// Histórico das conversas do WhatsApp (v7) — alimenta a caixa de entrada do painel.
// Cada conversa guarda as últimas mensagens: do cliente, do bot e suas (painel ou app).

import { mesmoNumero } from "./bot.mjs";

const MAX = 300;

function resumoEntrada(msg) {
  if (msg.type === "text") return { tipo: "texto", texto: msg.text.body };
  if (msg.type === "interactive") {
    const r = msg.interactive.button_reply || msg.interactive.list_reply;
    return { tipo: "escolha", texto: r?.title || "" };
  }
  if (msg.type === "button") return { tipo: "texto", texto: msg.button.text };
  const m = msg[msg.type];
  if (m?.id) return { tipo: msg.type, texto: m.caption || "", midia: true };
  return { tipo: msg.type || "outro", texto: "" };
}

export async function registrar(store, negocioId, tel, item) {
  if (!tel) return;
  await store.addHistorico(`${negocioId}:${tel}`, { em: Date.now(), ...item });
}

// Mensagem que o cliente mandou
export function registrarEntrada(store, negocio, msg, nomePerfil) {
  const r = resumoEntrada(msg);
  return registrar(store, negocio.id, msg.from, {
    de: "cliente",
    nome: nomePerfil,
    ...r,
    ...(r.midia ? { midiaChave: `${negocio.id}/${msg.from}/${msg.id}` } : {}),
  });
}

// Envolve o enviador do WhatsApp para registrar tudo o que o bot manda
export function comHistorico(wa, store, negocio, donoNumero, de = "bot") {
  const ehDono = (para) => donoNumero && mesmoNumero(para, donoNumero);
  const log = (para, texto, extra) => (ehDono(para) ? null : registrar(store, negocio.id, String(para), { de, texto, ...extra }));
  return {
    ...wa,
    texto: async (para, corpo) => {
      const ok = await wa.texto(para, corpo);
      await log(para, corpo, ok ? {} : { falhou: true });
      return ok;
    },
    // Resposta sua pelo comando /r do WhatsApp pessoal
    textoDono: async (para, corpo) => {
      const ok = await wa.texto(para, corpo);
      await registrar(store, negocio.id, String(para), { de: "voce-whats", texto: corpo, ...(ok ? {} : { falhou: true }) });
      return ok;
    },
    botoes: async (para, corpo, botoes) => {
      const ok = await wa.botoes(para, corpo, botoes);
      await log(para, corpo, { opcoes: botoes.map((b) => b.titulo), ...(ok ? {} : { falhou: true }) });
      return ok;
    },
    lista: async (para, corpo, botao, itens) => {
      const ok = await wa.lista(para, corpo, botao, itens);
      await log(para, corpo, { opcoes: itens.map((i) => i.titulo), ...(ok ? {} : { falhou: true }) });
      return ok;
    },
  };
}

export { MAX as MAX_HISTORICO };
