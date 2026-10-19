// Envio de mensagens pela WhatsApp Cloud API (Meta)
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages

const GRAPH = () => `https://graph.facebook.com/${process.env.GRAPH_VERSION || "v25.0"}`;

const corta = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

const YCLOUD = "https://api.ycloud.com/v2/whatsapp/messages/sendDirectly";
const e164 = (n) => "+" + String(n || "").replace(/\D/g, "");

// v13: números em coexistência ligados pelo YCloud respondem pela API do YCloud (caminho
// oficial: na coexistência por parceiro, quem responde ao cliente é o parceiro).
// ycloud = { apiKey, from, sempre } — from é o número da empresa (ex.: 5521966986094);
// sempre=true manda tudo pelo YCloud; sem "sempre", o YCloud só entra se a Meta recusar por permissão.
// As mensagens dos clientes continuam chegando pelo webhook da Meta.
export function criarEnviador({ phoneNumberId, token, ycloud, fetchImpl = fetch }) {
  let usarYcloud = Boolean(ycloud?.sempre);

  async function pelaMeta(payload) {
    const res = await fetchImpl(`${GRAPH()}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    });
    if (res.ok) return { ok: true };
    const erro = await res.text();
    console.error("[whatsapp] erro ao enviar:", res.status, erro);
    return { ok: false, permissao: /"code":10\b|"code":200\b/.test(erro) };
  }

  async function peloYcloud(payload) {
    const { to, ...resto } = payload;
    const res = await fetchImpl(YCLOUD, {
      method: "POST",
      headers: { "X-API-Key": ycloud.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ from: e164(ycloud.from), to: e164(to), ...resto }),
    });
    if (!res.ok) console.error("[ycloud] erro ao enviar:", res.status, await res.text());
    return res.ok;
  }

  async function enviar(payload) {
    const temYcloud = Boolean(ycloud?.apiKey && ycloud?.from);
    if (usarYcloud && !temYcloud) {
      console.error("[whatsapp] este número responde pelo YCloud, mas falta a variável YCLOUD_API_KEY no Netlify");
      return false;
    }
    if (usarYcloud) return peloYcloud(payload);
    const r = await pelaMeta(payload);
    if (r.ok) return true;
    if (r.permissao && temYcloud) {
      usarYcloud = true;
      console.log("[whatsapp] Meta recusou; enviando pelo YCloud");
      return peloYcloud(payload);
    }
    return false;
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
    lida: async (messageId) => {
      if (usarYcloud) return true; // no YCloud a leitura é marcada pelo próprio painel deles
      const r = await pelaMeta({ status: "read", message_id: messageId });
      if (!r.ok && r.permissao) usarYcloud = true;
      return r.ok;
    },
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
