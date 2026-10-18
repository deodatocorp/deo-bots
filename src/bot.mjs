// =============================================================
//  Cérebro do bot (v5) — mesmo código para Deo Repair e Deo Dev.
//  Recebe UMA mensagem e decide o que responder.
// =============================================================

const VERSAO = "v5";
const HORAS_ATENDENTE = Number(process.env.ATENDENTE_HORAS || 12);
const MAX_HISTORICO = 10;

const normaliza = (s = "") =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w\s/]/g, " ").replace(/\s+/g, " ").trim();

const SAUDACOES = /^(oi+|ola|opa|eai|e ai|hey|hello|bom dia|boa tarde|boa noite|tudo bem|oi tudo bem|ola tudo bem)( .{0,15})?$/;
const PEDE_ORCAMENTO = /\b(orcamento|orcar|cotacao|proposta)\b/;
const PEDE_ATENDENTE = /\b(atendente|humano|pessoa|nathan|falar com alguem)\b/;

// Números brasileiros às vezes chegam sem o 9 depois do DDD.
const digitos = (s = "") => s.replace(/\D/g, "");
function variantesBR(n) {
  n = digitos(n);
  const v = new Set([n]);
  if (n.startsWith("55") && n.length === 13 && n[4] === "9") v.add(n.slice(0, 4) + n.slice(5));
  if (n.startsWith("55") && n.length === 12) v.add(n.slice(0, 4) + "9" + n.slice(4));
  return v;
}
export const mesmoNumero = (a, b) => [...variantesBR(a)].some((x) => variantesBR(b).has(x));

const novaConversa = () => ({ etapa: "novo", indice: 0, respostas: {}, historico: [], atendenteAte: 0, midias: [] });

// Extrai o que o cliente mandou: texto digitado, botão/lista tocados ou mídia
function lerEntrada(msg) {
  if (msg.type === "text") return { tipo: "texto", texto: msg.text.body };
  if (msg.type === "interactive") {
    const r = msg.interactive.button_reply || msg.interactive.list_reply;
    return { tipo: "escolha", id: r.id, texto: r.title };
  }
  if (msg.type === "button") return { tipo: "texto", texto: msg.button.text }; // botão de template
  const midia = msg[msg.type];
  if (midia?.id) return { tipo: "midia", midiaTipo: msg.type, mediaId: midia.id, texto: midia.caption || "" };
  return { tipo: "outro", texto: "" };
}

const resumoRespostas = (negocio, respostas) =>
  negocio.triagem.perguntas
    .map((p) => `• *${negocio.triagem.rotulos[p.campo] || p.campo}:* ${respostas[p.campo] ?? "—"}`)
    .join("\n");

// -------------------------------------------------------------
export async function processarMensagem({ negocio, msg, nomePerfil }, deps) {
  const { store, wa, ia, donoNumero, baixarMidia, urlSite, adminToken } = deps;
  const agora = deps.agora ?? Date.now();
  const tel = msg.from;
  const entrada = lerEntrada(msg);

  const chaveDono = `${negocio.id}:__dono`;
  const ehDono = donoNumero && mesmoNumero(tel, donoNumero);

  // ---------------- Mensagens do dono (Nathan) ----------------
  if (ehDono) {
    const estadoDono = (await store.lerConversa(chaveDono)) || {};
    estadoDono.waId = tel;
    estadoDono.ultimaMsg = agora; // abre a janela de 24h para receber avisos
    const t = (entrada.texto || "").trim();

    if (estadoDono.modoTeste && normaliza(t) !== "/dono") {
      await store.salvarConversa(chaveDono, estadoDono);
      return processarCliente();
    }
    await store.salvarConversa(chaveDono, estadoDono);
    return comandoDono(t, estadoDono);
  }
  return processarCliente();

  // ===========================================================
  async function comandoDono(t, estadoDono) {
    const [cmd, ...resto] = t.split(/\s+/);
    const c = normaliza(cmd || "");

    if (c === "/r" || c === "/responder") {
      const m = t.match(/^\S+\s+\+?(\d{10,15})\s+([\s\S]+)$/);
      const alvo = m ? m[1] : estadoDono.ultimoCliente;
      const texto = (m ? m[2] : t.replace(/^\S+\s*/, "")).trim();
      if (!alvo) return wa.texto(tel, "⚠️ Não sei para quem responder. Use: /r 5521999999999 sua mensagem");
      if (!texto) return wa.texto(tel, "⚠️ Escreva a mensagem depois do número. Ex.: /r 5521999999999 Seu orçamento ficou R$ 150");
      const conv = (await store.lerConversa(`${negocio.id}:${alvo}`)) || novaConversa();
      conv.etapa = "atendente";
      conv.atendenteAte = agora + HORAS_ATENDENTE * 3600e3;
      await store.salvarConversa(`${negocio.id}:${alvo}`, conv);
      estadoDono.ultimoCliente = alvo;
      await store.salvarConversa(chaveDono, estadoDono);
      const ok = await wa.texto(alvo, texto);
      return wa.texto(tel, ok ? `✅ Enviado para ${alvo}` : `❌ Não consegui enviar para ${alvo} (a janela de 24h do cliente pode ter fechado).`);
    }

    if (c === "/fim") {
      const alvo = resto[0] ? digitos(resto[0]) : estadoDono.ultimoCliente;
      if (!alvo) return wa.texto(tel, "Use: /fim 5521999999999");
      const conv = (await store.lerConversa(`${negocio.id}:${alvo}`)) || novaConversa();
      conv.etapa = "menu";
      conv.atendenteAte = 0;
      await store.salvarConversa(`${negocio.id}:${alvo}`, conv);
      await wa.texto(alvo, `Obrigado pelo contato com a *${negocio.nome}*! ${negocio.emoji}\nSe precisar de algo, é só digitar *menu*.`);
      return wa.texto(tel, `✅ Atendimento com ${alvo} encerrado. O bot voltou a responder.`);
    }

    if (c === "/leads") {
      const leads = (await store.listarLeads()).filter((l) => l.negocio === negocio.id).slice(0, 5);
      if (!leads.length) return wa.texto(tel, "Nenhum lead ainda. 📭");
      const linhas = leads.map(
        (l) => `🕒 ${new Date(l.criadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n👤 ${l.respostas.nome || l.nomePerfil} — ${l.telefone}`
      );
      return wa.texto(tel, `*Últimos leads — ${negocio.nome}*\n\n${linhas.join("\n\n")}${painelLink() ? `\n\n📋 Painel: ${painelLink()}` : ""}`);
    }

    if (c === "/testar") {
      estadoDono.modoTeste = true;
      await store.salvarConversa(chaveDono, estadoDono);
      await store.salvarConversa(`${negocio.id}:${tel}`, novaConversa());
      return wa.texto(tel, "🧪 *Modo teste ligado.* Agora o bot te trata como cliente.\nDigite *oi* para começar e */dono* para sair.");
    }
    if (c === "/dono") {
      estadoDono.modoTeste = false;
      await store.salvarConversa(chaveDono, estadoDono);
      return wa.texto(tel, "👑 Modo dono ativo de novo.");
    }

    return wa.texto(
      tel,
      `*Bot ${negocio.nome} ${negocio.emoji} — ${VERSAO}*\nComandos do dono:\n\n` +
        "*/r <número> <mensagem>* — responder um cliente (o número é opcional: sem ele, responde o último que falou)\n" +
        "*/fim <número>* — encerrar o atendimento e religar o bot para esse cliente\n" +
        "*/leads* — últimos 5 pedidos de orçamento\n" +
        "*/testar* — conversar com o bot como se fosse cliente (*/dono* para sair)\n\n" +
        "💡 Mande qualquer mensagem aqui pelo menos 1x por dia para continuar recebendo os avisos (regra das 24h do WhatsApp)."
    );
  }

  function painelLink() {
    return urlSite && adminToken ? `${urlSite}/painel?token=${adminToken}` : null;
  }

  async function avisarDono(texto) {
    if (!donoNumero) return;
    const estadoDono = (await store.lerConversa(chaveDono)) || {};
    estadoDono.ultimoCliente = digitos(tel);
    await store.salvarConversa(chaveDono, estadoDono);
    await wa.texto(estadoDono.waId || donoNumero, texto);
  }

  // ===========================================================
  async function processarCliente() {
    const chave = `${negocio.id}:${tel}`;
    const conv = (await store.lerConversa(chave)) || novaConversa();
    const primeiraVez = conv.etapa === "novo";
    const n = normaliza(entrada.texto);
    // De onde o cliente veio (mensagem pronta dos botões do Instagram/Messenger)
    const origem = n.match(/vim pelo (instagram|facebook|messenger|site)/);
    if (origem) conv.origem = origem[1] === "messenger" ? "facebook" : origem[1];
    const salvar = () => ((conv.atualizado = agora), (conv.nomePerfil = nomePerfil), store.salvarConversa(chave, conv));
    const quem = () => `${conv.respostas?.nome || nomePerfil || "Cliente"} (${tel})`;

    // Mídia: guarda para o Nathan ver no painel
    let linkMidia = null;
    if (entrada.tipo === "midia" && baixarMidia) {
      const arq = await baixarMidia(entrada.mediaId);
      if (arq) {
        const k = `${negocio.id}/${tel}/${msg.id}`;
        await store.salvarMidia(k, arq.dados, arq.mime);
        conv.midias.push({ chave: k, tipo: entrada.midiaTipo, em: agora });
        linkMidia = urlSite && adminToken ? `${urlSite}/painel/midia?k=${encodeURIComponent(k)}&token=${adminToken}` : null;
      }
    }

    // --- Comandos que funcionam em qualquer momento ---
    if (["menu", "inicio", "voltar", "0"].includes(n)) {
      conv.etapa = "menu";
      conv.atendenteAte = 0;
      await salvar();
      return enviarMenu(conv, false);
    }
    if (n === "cancelar" && ["triagem", "confirmar"].includes(conv.etapa)) {
      conv.etapa = "menu";
      conv.respostas = {};
      await salvar();
      await wa.texto(tel, "Tudo bem, cancelei. 👍");
      return enviarMenu(conv, false);
    }

    // --- Em atendimento humano: o bot só repassa para o Nathan ---
    if (conv.etapa === "atendente" && conv.atendenteAte > agora) {
      await salvar();
      const conteudo =
        entrada.tipo === "midia"
          ? `📎 enviou ${entrada.midiaTipo}${entrada.texto ? `: ${entrada.texto}` : ""}${linkMidia ? `\n${linkMidia}` : ""}`
          : entrada.texto;
      return avisarDono(`💬 *${negocio.nome}* | ${quem()}\n${conteudo}\n\n↩️ Responder: */r ${tel} sua mensagem*`);
    }
    if (conv.etapa === "atendente") conv.etapa = "menu"; // atendimento expirou

    // --- Pré-orçamento em andamento ---
    if (conv.etapa === "triagem") return responderTriagem();
    if (conv.etapa === "confirmar") return responderConfirmacao();

    // --- Mídia fora de um fluxo ---
    if (entrada.tipo === "midia") {
      await salvar();
      await avisarDono(`📎 *${negocio.nome}* | ${quem()} enviou ${entrada.midiaTipo}${linkMidia ? `\n${linkMidia}` : ""}`);
      return wa.texto(tel, "Recebi seu arquivo! 📎 Já deixei separado para o Nathan ver.\nDigite *menu* para ver as opções.");
    }

    // --- Opções do menu (toque na lista) ---
    if (entrada.tipo === "escolha" && entrada.id.startsWith("menu:")) return opcaoMenu(entrada.id.slice(5));

    // --- Palavras-chave ---
    if (PEDE_ORCAMENTO.test(n)) return opcaoMenu("orcamento");
    if (PEDE_ATENDENTE.test(n)) return opcaoMenu("atendente");
    if (primeiraVez || SAUDACOES.test(n) || !n) {
      conv.etapa = "menu";
      await salvar();
      return enviarMenu(conv, true);
    }

    // --- Pergunta livre: IA ---
    conv.etapa = "menu";
    if (ia) {
      conv.historico.push({ role: "user", content: entrada.texto });
      conv.historico = conv.historico.slice(-MAX_HISTORICO);
      if (conv.historico[0]?.role !== "user") conv.historico.shift();
      const resposta = await ia(negocio, conv.historico).catch(() => null);
      if (resposta) {
        conv.historico.push({ role: "assistant", content: resposta });
        await salvar();
        return wa.texto(tel, `${resposta}\n\n_Digite *menu* para ver as opções._`);
      }
      conv.historico.pop();
    }
    await salvar();
    await wa.texto(tel, "Hmm, não entendi muito bem 😅 Escolha uma opção abaixo:");
    return enviarMenu(conv, false);

    // ---------------------------------------------------------
    async function opcaoMenu(id) {
      if (id === "orcamento") {
        conv.etapa = "triagem";
        conv.indice = 0;
        conv.respostas = {};
        await salvar();
        await wa.texto(tel, negocio.triagem.abertura);
        return perguntar();
      }
      if (id === "atendente") {
        conv.etapa = "atendente";
        conv.atendenteAte = agora + HORAS_ATENDENTE * 3600e3;
        await salvar();
        await avisarDono(`🙋 *${negocio.nome}* | ${quem()} quer falar com você.\n\n↩️ Responder: */r ${tel} sua mensagem*\n✅ Encerrar: */fim ${tel}*`);
        return wa.texto(tel, negocio.respostas.atendente);
      }
      if (id === "duvida") {
        conv.etapa = "menu";
        await salvar();
        return wa.texto(tel, ia ? "Pode mandar sua pergunta! 💬" : "Pode mandar sua pergunta que o Nathan responde assim que puder! 💬");
      }
      const resposta = negocio.respostas[id];
      await salvar();
      if (!resposta) return enviarMenu(conv, false);
      return wa.botoes(tel, resposta, [
        { id: "menu:orcamento", titulo: "Pedir orçamento" },
        { id: "menu:voltar", titulo: "Ver menu" },
      ]);
    }

    async function enviarMenu(c, comBoasVindas) {
      const itens = negocio.menu.map((m) => ({ id: `menu:${m.id}`, titulo: m.titulo, descricao: m.descricao }));
      const corpo = comBoasVindas ? negocio.boasVindas : "Como posso te ajudar? 👇";
      return wa.lista(tel, corpo, "Ver opções", itens);
    }

    async function perguntar() {
      const p = negocio.triagem.perguntas[conv.indice];
      const opcoes = (p.opcoes || []).map((o, k) => ({ id: `opt:${conv.indice}:${k}`, titulo: o }));
      if (p.tipo === "botoes") return wa.botoes(tel, p.pergunta, opcoes);
      if (p.tipo === "lista") return wa.lista(tel, p.pergunta, p.botaoLista || "Escolher", opcoes);
      return wa.texto(tel, p.pergunta);
    }

    async function responderTriagem() {
      const p = negocio.triagem.perguntas[conv.indice];
      if (entrada.tipo === "midia") {
        await salvar();
        await wa.texto(tel, "Recebi o arquivo! 📸 Vou anexar ao seu pedido. Agora responda por texto, por favor:");
        return perguntar();
      }
      if (entrada.tipo === "escolha" && entrada.id.startsWith("menu:")) {
        conv.etapa = "menu";
        return opcaoMenu(entrada.id.slice(5));
      }
      const valor = (entrada.texto || "").trim();
      if (!valor) return perguntar();
      conv.respostas[p.campo] = valor.slice(0, 500);
      conv.indice++;

      if (conv.indice < negocio.triagem.perguntas.length) {
        await salvar();
        return perguntar();
      }
      conv.etapa = "confirmar";
      await salvar();
      return wa.botoes(tel, `Confira seus dados:\n\n${resumoRespostas(negocio, conv.respostas)}\n\nEstá tudo certo?`, [
        { id: "conf:sim", titulo: "✅ Confirmar" },
        { id: "conf:corrigir", titulo: "✏️ Corrigir" },
        { id: "conf:cancelar", titulo: "❌ Cancelar" },
      ]);
    }

    async function responderConfirmacao() {
      const id = entrada.id || "";
      const sim = id === "conf:sim" || /^(sim|s|confirmar|confirmo|ok|certo|isso)$/.test(n);
      const corrigir = id === "conf:corrigir" || /^(corrigir|nao|n|errado)$/.test(n);
      const cancelar = id === "conf:cancelar";

      if (cancelar) {
        conv.etapa = "menu";
        conv.respostas = {};
        await salvar();
        await wa.texto(tel, "Tudo bem, cancelei. 👍");
        return enviarMenu(conv, false);
      }
      if (corrigir) {
        conv.etapa = "triagem";
        conv.indice = 0;
        conv.respostas = {};
        await salvar();
        await wa.texto(tel, "Sem problemas, vamos de novo! 🔄");
        return perguntar();
      }
      if (!sim) {
        return wa.botoes(tel, "Toque em uma das opções, por favor 👇", [
          { id: "conf:sim", titulo: "✅ Confirmar" },
          { id: "conf:corrigir", titulo: "✏️ Corrigir" },
          { id: "conf:cancelar", titulo: "❌ Cancelar" },
        ]);
      }

      const lead = {
        negocio: negocio.id,
        negocioNome: negocio.nome,
        telefone: tel,
        nomePerfil,
        origem: conv.origem || "whatsapp",
        respostas: conv.respostas,
        midias: conv.midias.map((m) => m.chave),
        criadoEm: new Date(agora).toISOString(),
      };
      await store.salvarLead(lead);

      // Depois do pedido, o Nathan assume a conversa (fotos e dúvidas chegam para ele)
      conv.etapa = "atendente";
      conv.atendenteAte = agora + HORAS_ATENDENTE * 3600e3;
      conv.respostas = {};
      await salvar();

      await avisarDono(
        `🆕 *Novo pedido de orçamento — ${negocio.nome}* ${negocio.emoji}\n\n${resumoRespostas(negocio, lead.respostas)}\n📞 ${tel}\n📍 Veio pelo: ${{ whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook", site: "site" }[lead.origem]}` +
          (lead.midias.length ? `\n📎 ${lead.midias.length} arquivo(s) no painel` : "") +
          `\n\n↩️ Responder: */r ${tel} sua mensagem*`
      );
      return wa.texto(tel, negocio.triagem.confirmacaoFinal);
    }
  }
}
