// =============================================================
//  Instagram + Messenger (v5)
//  Objetivo: atender rápido no direct/Messenger e levar o cliente
//  primeiro para o WhatsApp (onde o bot faz o pré-orçamento) e depois
//  para o site.
// =============================================================

const GRAPH = () => `https://graph.facebook.com/${process.env.GRAPH_VERSION || "v25.0"}`;
const MIN_ENTRE_CARTOES = 30 * 60e3; // não repete o cartão de botões em menos de 30 min
const HORAS_PAUSA = Number(process.env.ATENDENTE_HORAS || 12);
const MAX_HISTORICO = 10;

const normaliza = (s = "") =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
const SAUDACOES = /^(oi+|ola|opa|eai|e ai|hey|hello|bom dia|boa tarde|boa noite|tudo bem)( .{0,15})?$/;
const PEDE_ORCAMENTO = /\b(orcamento|orcar|cotacao|proposta|preco|valor|quanto custa|quanto fica)\b/;
const NOME_CANAL = { instagram: "Instagram", facebook: "Facebook" };

// ------------------- Links de destino -------------------
export function linksDoNegocio(negocio, plataforma, env = process.env) {
  const p = negocio.envPrefixo;
  const numero = (env[`${p}_WHATSAPP_NUMERO`] || negocio.redes?.whatsapp || "").replace(/\D/g, "");
  const site = env[`${p}_SITE_URL`] || negocio.redes?.site || "";
  const texto = negocio.social.mensagemWhats.replace("{canal}", NOME_CANAL[plataforma] || "Instagram");
  return {
    whats: numero ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}` : null,
    site: /^https?:\/\//.test(site) ? site : null,
  };
}

// ------------------- Envio (Graph API) -------------------
export function criarEnviadorSocial({ pageId, token, fetchImpl = fetch }) {
  async function post(caminho, corpo) {
    const res = await fetchImpl(`${GRAPH()}/${caminho}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
    const dados = await res.json().catch(() => ({}));
    if (!res.ok) console.error("[social] erro ao enviar:", res.status, JSON.stringify(dados));
    return res.ok ? dados : null;
  }
  const mensagem = (recipient, message) =>
    post(`${pageId}/messages`, { recipient, message, messaging_type: "RESPONSE" }).then((d) => d?.message_id || null);

  return {
    texto: (id, texto) => mensagem({ id }, { text: texto.slice(0, 1000) }),

    // Cartão com até 3 botões de link (funciona no Messenger e no Instagram)
    cartao: (id, { titulo, subtitulo, botoes }) =>
      mensagem(
        { id },
        {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements: [
                {
                  title: titulo.slice(0, 80),
                  subtitle: subtitulo?.slice(0, 80),
                  buttons: botoes.slice(0, 3).map((b) => ({ type: "web_url", url: b.url, title: b.titulo.slice(0, 20) })),
                },
              ],
            },
          },
        }
      ),

    // DM privada em resposta a um comentário (1 por comentário, até 7 dias depois)
    respostaPrivada: (commentId, texto) => mensagem({ comment_id: commentId }, { text: texto.slice(0, 1000) }),

    // Resposta pública ao comentário
    responderComentario: (plataforma, commentId, texto) =>
      post(plataforma === "instagram" ? `${commentId}/replies` : `${commentId}/comments`, { message: texto }),
  };
}

// ------------------- Mensagens (DM / Messenger) -------------------
export async function processarMensagemSocial({ negocio, plataforma, evento }, deps) {
  const { store, envio, ia } = deps;
  const agora = deps.agora ?? Date.now();
  const links = deps.links ?? linksDoNegocio(negocio, plataforma);
  const msg = evento.message;

  // Eco = mensagem enviada PELA página. Se não foi o bot, foi você respondendo
  // pela caixa de entrada do Instagram/Meta Business Suite → o bot pausa.
  if (msg?.is_echo) {
    if (deps.appId && String(msg.app_id) === String(deps.appId)) return; // enviada por este app
    if (await store.tem(`enviada:${msg.mid}`)) return;
    const chave = `${negocio.id}:${plataforma}:${evento.recipient.id}`;
    const conv = (await store.lerConversa(chave)) || {};
    conv.pausadoAte = agora + HORAS_PAUSA * 3600e3;
    await store.salvarConversa(chave, conv);
    return;
  }
  if (msg?.mid && (await store.jaProcessada(msg.mid))) return;

  const usuario = evento.sender.id;
  const chave = `${negocio.id}:${plataforma}:${usuario}`;
  const conv = (await store.lerConversa(chave)) || { historico: [], ultimoCartao: 0 };
  conv.historico ||= [];
  if (conv.pausadoAte > agora) return; // você está atendendo esta pessoa

  const texto = msg?.quick_reply?.payload || msg?.text || evento.postback?.title || "";
  const n = normaliza(texto);
  const primeiraVez = !conv.atualizado;

  const registra = async (mid) => mid && store.marcar(`enviada:${mid}`);
  const enviarCartao = async () => {
    const botoes = [];
    if (links.whats) botoes.push({ titulo: negocio.social.botaoWhats, url: links.whats });
    if (links.site) botoes.push({ titulo: negocio.social.botaoSite, url: links.site });
    if (!botoes.length) return;
    conv.ultimoCartao = agora;
    await registra(await envio.cartao(usuario, { titulo: negocio.social.cartaoTitulo, subtitulo: negocio.social.cartaoSubtitulo, botoes }));
  };
  const salvar = () => ((conv.atualizado = agora), store.salvarConversa(chave, conv));

  // Saudação, pedido de orçamento, mensagem sem texto (foto, áudio, figurinha) → saudação + botões
  if (primeiraVez || !n || SAUDACOES.test(n) || PEDE_ORCAMENTO.test(n)) {
    await registra(await envio.texto(usuario, negocio.social.saudacao));
    await enviarCartao();
    return salvar();
  }

  // Pergunta livre → IA (se configurada)
  if (ia) {
    conv.historico.push({ role: "user", content: texto });
    conv.historico = conv.historico.slice(-MAX_HISTORICO);
    if (conv.historico[0]?.role !== "user") conv.historico.shift();
    const resposta = await ia(negocio, conv.historico, { canal: "social" }).catch(() => null);
    if (resposta) {
      conv.historico.push({ role: "assistant", content: resposta });
      await registra(await envio.texto(usuario, resposta));
      if (agora - (conv.ultimoCartao || 0) > MIN_ENTRE_CARTOES) await enviarCartao();
      return salvar();
    }
    conv.historico.pop();
  }

  // Sem IA → direciona
  await registra(
    await envio.texto(usuario, "Para tirar dúvidas e fazer seu orçamento, fale com a gente no WhatsApp 👇")
  );
  await enviarCartao();
  return salvar();
}

// ------------------- Comentários em posts -------------------
// comentario: { id, texto, deId, contaId }
export async function processarComentario({ negocio, plataforma, comentario }, deps) {
  const { store, envio } = deps;
  const links = deps.links ?? linksDoNegocio(negocio, plataforma);
  if (!comentario?.id || comentario.deId === comentario.contaId) return; // ignora a própria página
  if (await store.jaProcessada(`comentario:${comentario.id}`)) return;

  const n = normaliza(comentario.texto);
  const bate = negocio.social.palavrasComentario.some((p) => n.includes(normaliza(p)));
  if (!bate) return;

  const linhas = [negocio.social.saudacao.replace(/\n\n[^\n]*👇\s*$/, "")];
  if (links.whats) linhas.push(`📲 Orçamento no WhatsApp: ${links.whats}`);
  if (links.site) linhas.push(`🌐 Site: ${links.site}`);
  await envio.respostaPrivada(comentario.id, linhas.join("\n\n"));
  await envio.responderComentario(
    plataforma,
    comentario.id,
    plataforma === "instagram" ? negocio.social.respostaComentario : negocio.social.respostaComentarioFacebook
  );
}
