// Envio de mensagens pela WhatsApp Cloud API (Meta)
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages

const GRAPH = () => `https://graph.facebook.com/${process.env.GRAPH_VERSION || "v23.0"}`;

const corta = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

export function criarEnviador({ phoneNumberId, token, fetchImpl = fetch }) {
  async function enviar(payload) {
    const res = await fetchImpl(`${GRAPH()}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    });
    if (!res.ok) {
      const erro = await res.text();
      console.error("[whatsapp] erro ao enviar:", res.status, erro);
    }
    return res.ok;
  }

  return {
    texto: (para, corpo) =>
      enviar({ to: para, type: "text", text: { body: corpo, preview_url: true } }),

    // Até 3 botões. Cada item: { id, titulo }
    botoes: (para, corpo, botoes) =>
      enviar({
        to: para,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: corpo },
          action: {
            buttons: botoes.slice(0, 3).map((b) => ({
              type: "reply",
              reply: { id: b.id, title: corta(b.titulo, 20) },
            })),
          },
        },
      }),

    // Lista de até 10 itens. Cada item: { id, titulo, descricao? }
    lista: (para, corpo, textoBotao, itens) =>
      enviar({
        to: para,
        type: "interactive",
        interactive: {
          type: "list",
          body: { text: corpo },
          action: {
            button: corta(textoBotao, 20),
            sections: [
              {
                title: "Opções",
                rows: itens.slice(0, 10).map((i) => ({
                  id: i.id,
                  title: corta(i.titulo, 24),
                  ...(i.descricao ? { description: corta(i.descricao, 72) } : {}),
                })),
              },
            ],
          },
        },
      }),

    // Marca como lida (os dois tracinhos azuis)
    lida: (messageId) => enviar({ status: "read", message_id: messageId }),
  };
}

// Baixa uma mídia recebida (foto, vídeo, áudio, documento)
export async function baixarMidia(mediaId, token, fetchImpl = fetch) {
  const info = await fetchImpl(`${GRAPH()}/${mediaId}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!info.ok) return null;
  const { url, mime_type } = await info.json();
  const arquivo = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!arquivo.ok) return null;
  return { dados: await arquivo.arrayBuffer(), mime: mime_type };
}

// Verifica a assinatura X-Hub-Signature-256 que a Meta manda em cada webhook
export async function assinaturaValida(corpoBruto, cabecalho, appSecret) {
  if (!appSecret) return true; // sem segredo configurado, não valida (só em teste!)
  if (!cabecalho?.startsWith("sha256=")) return false;
  const { createHmac, timingSafeEqual } = await import("node:crypto");
  const esperado = createHmac("sha256", appSecret).update(corpoBruto).digest("hex");
  const recebido = cabecalho.slice(7);
  if (esperado.length !== recebido.length) return false;
  return timingSafeEqual(Buffer.from(esperado), Buffer.from(recebido));
}
