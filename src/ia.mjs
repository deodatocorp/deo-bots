// Respostas livres com IA (Claude API da Anthropic)
// Se ANTHROPIC_API_KEY não estiver configurada, o bot funciona só com menu.

const REGRAS = `
REGRAS DE ATENDIMENTO:
- Responda em português do Brasil, tom simpático e direto, como numa conversa de WhatsApp.
- Respostas curtas: no máximo 4 frases. Use *negrito* do WhatsApp com moderação e no máximo 1 ou 2 emojis.
- Use SOMENTE as informações acima. Se não souber algo, diga que vai confirmar com o Nathan — nunca invente preço, prazo, garantia ou endereço. Itens marcados com ✏️ ainda não foram definidos: trate-os como desconhecidos.
- Se o cliente quiser orçamento, diga para digitar *orçamento*.
- Se o cliente quiser falar com uma pessoa, diga para digitar *atendente*.
- Não fale de assuntos que não tenham relação com o negócio; redirecione com educação.
`.trim();

export function criarIA({ apiKey, modelo, fetchImpl = fetch }) {
  if (!apiKey) return null;

  return async function responder(negocio, historico, opcoes = {}) {
    const regras =
      opcoes.canal === "social"
        ? REGRAS.replace(/- Se o cliente quiser orçamento[^\n]*\n- Se o cliente quiser falar[^\n]*/,
            "- Esta conversa é no Instagram/Messenger. Se o cliente quiser orçamento ou falar com o Nathan, diga que é pelo WhatsApp, no botão que vem logo abaixo.\n- NÃO use asteriscos para negrito (aqui não funciona).")
        : REGRAS;
    const res = await fetchImpl("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: modelo || "claude-haiku-5-5",
        max_tokens: 400,
        system: `${negocio.conhecimentoIA}\n\n${regras}`,
        messages: historico,
      }),
    });

    if (!res.ok) {
      console.error("[ia] erro:", res.status, await res.text());
      return null;
    }
    const dados = await res.json();
    return dados.content?.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim() || null;
  };
}
