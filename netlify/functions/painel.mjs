// Painel dos bots (v10): visão geral, caixa de entrada, quadro de pedidos e respostas rápidas,
// com a identidade da Deodato Corp e o tema de cada empresa.
// Acesse: https://SEU-SITE.netlify.app/painel?token=SEU_ADMIN_TOKEN

import { getStore } from "@netlify/blobs";
import { criarArmazenamento } from "../../src/armazenamento.mjs";
import { criarEnviador } from "../../src/whatsapp.mjs";
import { registrar } from "../../src/historico.mjs";
import PAGINA from "../../src/painel-ui.mjs";
import deoRepair from "../../src/negocios/deo-repair.mjs";
import deoDev from "../../src/negocios/deo-dev.mjs";
import { timingSafeEqual } from "node:crypto";

const VERSAO = "v12";
const NEGOCIOS = { "deo-repair": deoRepair, "deo-dev": deoDev };
const HORAS = () => Number(process.env.ATENDENTE_HORAS || 12);
const ETAPAS = ["novo", "orcamento", "aprovado", "concluido", "perdido"];
const json = (d, status = 200) => Response.json(d, { status, headers: { "cache-control": "no-store" } });
const soNumeros = (s) => String(s || "").replace(/\D/g, "");

// Respostas rápidas iniciais (você edita tudo pelo painel)
const RESPOSTAS_PADRAO = {
  "deo-repair": [
    { titulo: "Recebi o pedido", texto: "Oi, {nome}! Aqui é o Nathan, da Deo Repair. Recebi seu pedido e já vou analisar. Se puder, mande fotos ou um vídeo curto do problema 📸" },
    { titulo: "Orçamento", texto: "{nome}, o orçamento ficou em R$ ___ e o prazo é de ___ dias úteis. Todo o reparo é filmado na abertura e no fechamento, e você recebe o vídeo junto com o orçamento detalhado. Posso seguir?" },
    { titulo: "Diagnóstico", texto: "{nome}, para te passar um valor certinho preciso fazer o diagnóstico no aparelho. Quando fica bom pra você trazer?" },
    { titulo: "Pronto p/ retirada", texto: "Boa notícia, {nome}! Seu aparelho está pronto ✅ Já te mandei o vídeo do reparo. Quando quiser retirar, é só me avisar." },
    { titulo: "Pagamento", texto: "Pode pagar por Pix ou cartão. A chave Pix é: ___" },
  ],
  "deo-dev": [
    { titulo: "Recebi o pedido", texto: "Oi, {nome}! Aqui é o Nathan, da Deo Dev. Recebi suas informações e vou montar a proposta pro seu negócio. Te mando ainda hoje 🚀" },
    { titulo: "Planos", texto: "{nome}, os planos são: Plano 1 por R$ 199,99, Plano 2 por R$ 499,99 e o Mensal por R$ 199,99/mês. Quer que eu te explique a diferença entre eles?" },
    { titulo: "Proposta enviada", texto: "{nome}, te enviei a proposta. Qualquer dúvida é só chamar! Se aprovar, já começo o briefing." },
    { titulo: "Briefing", texto: "Pra começar preciso de: logo (se tiver), cores que você gosta, fotos do negócio e 2 ou 3 referências de sites/perfis que você curte." },
    { titulo: "Pagamento", texto: "Pode pagar por Pix ou cartão. A chave Pix é: ___" },
  ],
};

function tokenOk(recebido) {
  const certo = (process.env.ADMIN_TOKEN || "").trim();
  if (!certo || !recebido || recebido.length !== certo.length) return false;
  return timingSafeEqual(Buffer.from(recebido), Buffer.from(certo));
}

const chaveLead = (l) => `${l.negocio}/${l.criadoEm}-${l.telefone}`;

export default async (req) => {
  const url = new URL(req.url);
  const rota = url.pathname.replace(/\/+$/, "");

  // A página em si não tem dados: ela pede o token ao abrir e usa nas chamadas abaixo
  if (rota === "/painel") {
    return new Response(PAGINA, {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex", "referrer-policy": "no-referrer" },
    });
  }

  const token = req.headers.get("x-token") || url.searchParams.get("token");
  if (!tokenOk(token)) return new Response("Acesso negado", { status: 401 });
  const store = criarArmazenamento();
  const ajustes = getStore({ name: "ajustes", consistency: "strong" });
  const leadsStore = getStore({ name: "leads", consistency: "strong" });
  const corpo = () => (req.method === "POST" ? req.json().catch(() => ({})) : Promise.resolve({}));

  // ---------- Arquivo enviado por um cliente ----------
  if (rota.endsWith("/midia")) {
    const m = await store.lerMidia(url.searchParams.get("k") || "");
    if (!m) return new Response("Arquivo não encontrado", { status: 404 });
    return new Response(m.dados, { headers: { "content-type": m.mime, "cache-control": "private, max-age=3600" } });
  }

  // ---------- Informações das empresas + respostas rápidas ----------
  if (rota.endsWith("/api/info")) {
    const salvas = (await ajustes.get("respostas", { type: "json" })) || {};
    const negocios = {};
    const respostas = {};
    for (const [id, n] of Object.entries(NEGOCIOS)) {
      const pid = process.env[n.phoneNumberIdEnv];
      const real = await ajustes.get(`numero/${id}`, { type: "json" });
      negocios[id] = { nome: n.nome, rotulos: n.triagem?.rotulos || {}, conectado: Boolean(real || (pid && pid !== "0")), real: Boolean(real), whatsapp: n.redes?.whatsapp, site: n.redes?.site };
      respostas[id] = salvas[id] || RESPOSTAS_PADRAO[id] || [];
    }
    return json({ versao: VERSAO, negocios, respostas });
  }

  if (rota.endsWith("/api/respostas") && req.method === "POST") {
    const { neg, itens } = await corpo();
    if (!NEGOCIOS[neg] || !Array.isArray(itens)) return json({ ok: false, erro: "Dados inválidos." }, 400);
    const limpos = itens
      .map((r) => ({ titulo: String(r?.titulo || "").trim().slice(0, 40), texto: String(r?.texto || "").trim().slice(0, 1500) }))
      .filter((r) => r.titulo && r.texto)
      .slice(0, 30);
    const salvas = (await ajustes.get("respostas", { type: "json" })) || {};
    salvas[neg] = limpos;
    await ajustes.setJSON("respostas", salvas);
    return json({ ok: true, itens: limpos });
  }

  // ---------- Caixa de entrada ----------
  if (rota.endsWith("/api/conversas")) {
    const chaves = await store.listarHistoricos();
    const agora = Date.now();
    const lista = await Promise.all(
      chaves.map(async (k) => {
        const [neg, tel] = k.split(":");
        const hist = await store.lerHistorico(k);
        const ult = hist[hist.length - 1] || {};
        const nome = [...hist].reverse().find((h) => h.nome)?.nome;
        const ultCliente = [...hist].reverse().find((h) => h.de === "cliente")?.em || 0;
        const conv = (await store.lerConversa(k)) || {};
        const comVoce = conv.etapa === "atendente" && conv.atendenteAte > agora;
        return {
          neg,
          tel,
          nome: conv.respostas?.nome || nome || tel,
          ultima: ult.texto || `[${ult.tipo || "mensagem"}]`,
          de: ult.de,
          em: ult.em || 0,
          inicio: hist[0]?.em || ult.em || 0,
          ultCliente,
          // Última mensagem é do cliente e ninguém respondeu (normalmente porque você assumiu)
          aguardando: ult.de === "cliente",
          comVoce,
          total: hist.length,
        };
      })
    );
    return json(lista.filter((c) => NEGOCIOS[c.neg]).sort((a, b) => b.em - a.em));
  }

  if (rota.endsWith("/api/conversa")) {
    const neg = url.searchParams.get("neg");
    const tel = soNumeros(url.searchParams.get("tel"));
    const k = `${neg}:${tel}`;
    const conv = (await store.lerConversa(k)) || {};
    const nota = (await ajustes.get(`nota/${k}`, { type: "json" }))?.texto || "";
    return json({ mensagens: await store.lerHistorico(k), comVoce: conv.etapa === "atendente" && conv.atendenteAte > Date.now(), ate: conv.atendenteAte || 0, nota });
  }

  if (rota.endsWith("/api/nota") && req.method === "POST") {
    const { neg, tel, nota } = await corpo();
    if (!NEGOCIOS[neg] || !soNumeros(tel)) return json({ ok: false, erro: "Dados inválidos." }, 400);
    await ajustes.setJSON(`nota/${neg}:${soNumeros(tel)}`, { texto: String(nota || "").slice(0, 5000), em: Date.now() });
    return json({ ok: true });
  }

  if (rota.endsWith("/api/estado") && req.method === "POST") {
    const { neg, tel, acao } = await corpo();
    const k = `${neg}:${soNumeros(tel)}`;
    const conv = (await store.lerConversa(k)) || { etapa: "novo", indice: 0, respostas: {}, historico: [], midias: [] };
    if (acao === "assumir") {
      conv.etapa = "atendente";
      conv.atendenteAte = Date.now() + HORAS() * 3600e3;
    } else {
      conv.etapa = "menu";
      conv.atendenteAte = 0;
    }
    await store.salvarConversa(k, conv);
    return json({ ok: true, comVoce: acao === "assumir" });
  }

  if (rota.endsWith("/api/responder") && req.method === "POST") {
    const { neg, tel: telBruto, texto } = await corpo();
    const negocio = NEGOCIOS[neg];
    const tel = soNumeros(telBruto);
    const msg = String(texto || "").trim();
    if (!negocio || !tel || !msg) return json({ ok: false, erro: "Dados incompletos." }, 400);
    // Número real (aprendido pelo webhook) tem prioridade sobre o de teste
    const real = await ajustes.get(`numero/${negocio.id}`, { type: "json" });
    const phoneNumberId = real?.phoneNumberId || process.env[negocio.phoneNumberIdEnv];
    if (!phoneNumberId || phoneNumberId === "0") return json({ ok: false, erro: `O número da ${negocio.nome} ainda não está configurado.` }, 400);
    const wa = criarEnviador({ phoneNumberId, token: process.env.WHATSAPP_TOKEN, ycloud: { apiKey: process.env.YCLOUD_API_KEY, from: negocio.redes?.whatsapp } });
    const ok = await wa.texto(tel, msg.slice(0, 4000));
    await registrar(store, negocio.id, tel, { de: "voce-painel", texto: msg, ...(ok ? {} : { falhou: true }) });
    // Você assumiu: o bot para de responder esse cliente por um tempo
    const k = `${negocio.id}:${tel}`;
    const conv = (await store.lerConversa(k)) || { etapa: "novo", indice: 0, respostas: {}, historico: [], midias: [] };
    conv.etapa = "atendente";
    conv.atendenteAte = Date.now() + HORAS() * 3600e3;
    await store.salvarConversa(k, conv);
    return json(ok ? { ok: true } : { ok: false, erro: "A Meta recusou o envio. Se o cliente não falou com a empresa nas últimas 24h, só é possível responder depois que ele mandar uma nova mensagem." });
  }

  // ---------- Pedidos (quadro) ----------
  if (rota.endsWith("/api/pedidos")) {
    const leads = await store.listarLeads();
    return json(leads.map((l) => ({ ...l, k: chaveLead(l), status: l.status || "novo" })));
  }

  if (rota.endsWith("/api/pedido") && req.method === "POST") {
    const d = await corpo();
    const k = String(d.k || "");
    if (!/^deo-(repair|dev)\//.test(k)) return json({ ok: false, erro: "Pedido inválido." }, 400);
    const lead = await leadsStore.get(k, { type: "json" });
    if (!lead) return json({ ok: false, erro: "Pedido não encontrado." }, 404);
    if (d.status !== undefined) {
      if (!ETAPAS.includes(d.status)) return json({ ok: false, erro: "Etapa inválida." }, 400);
      if (d.status !== (lead.status || "novo")) {
        lead.etapas = [...(lead.etapas || []), { de: lead.status || "novo", para: d.status, em: Date.now() }].slice(-30);
      }
      lead.status = d.status;
    }
    if (d.valor !== undefined) lead.valor = Math.max(0, Math.round(Number(d.valor) * 100) / 100) || 0;
    if (d.retorno !== undefined) lead.retorno = /^\d{4}-\d{2}-\d{2}$/.test(d.retorno) ? d.retorno : "";
    if (d.nota !== undefined) lead.nota = String(d.nota).slice(0, 5000);
    lead.atualizadoEm = Date.now();
    await leadsStore.setJSON(k, lead);
    return json({ ok: true, pedido: { ...lead, k } });
  }

  return new Response("Não encontrado", { status: 404 });
};

export const config = {
  path: [
    "/painel",
    "/painel/midia",
    "/painel/api/info",
    "/painel/api/respostas",
    "/painel/api/conversas",
    "/painel/api/conversa",
    "/painel/api/nota",
    "/painel/api/responder",
    "/painel/api/estado",
    "/painel/api/pedidos",
    "/painel/api/pedido",
  ],
};
