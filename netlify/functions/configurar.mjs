// Configuração automática do webhook na Meta (v9)
// Abra no navegador: https://SEU-SITE.netlify.app/configurar?token=SEU_ADMIN_TOKEN&waba=ID_DA_CONTA_WHATSAPP
// Faz duas coisas pela API da Meta e mostra o resultado de cada uma:
//  1) cadastra o webhook do app (URL + token de verificação + campo "messages")
//  2) inscreve a conta do WhatsApp (WABA) no app, para as mensagens chegarem
// Nenhum segredo é exibido na resposta.

import { timingSafeEqual } from "node:crypto";

const env = (k) => (process.env[k] || "").trim();
const GRAPH = () => `https://graph.facebook.com/${env("GRAPH_VERSION") || "v25.0"}`;

function tokenOk(recebido) {
  const certo = env("ADMIN_TOKEN");
  if (!certo || !recebido || recebido.length !== certo.length) return false;
  return timingSafeEqual(Buffer.from(recebido), Buffer.from(certo));
}

async function chamar(rotulo, url, params) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
    });
    const dados = await res.json().catch(() => ({}));
    return { passo: rotulo, ok: res.ok && !dados.error, status: res.status, resposta: dados.error ? { erro: dados.error.message, codigo: dados.error.code, subcodigo: dados.error.error_subcode } : dados };
  } catch (e) {
    return { passo: rotulo, ok: false, erro: String(e) };
  }
}

export default async (req) => {
  const url = new URL(req.url);
  if (!tokenOk(url.searchParams.get("token"))) return new Response("Acesso negado", { status: 401 });

  const appId = env("META_APP_ID");
  const appSecret = env("META_APP_SECRET");
  const verify = env("WHATSAPP_VERIFY_TOKEN");
  const waba = (url.searchParams.get("waba") || env("WABA_ID")).replace(/\D/g, "");
  const callback = `${env("URL") || url.origin}/webhook`;

  const faltando = Object.entries({ META_APP_ID: appId, META_APP_SECRET: appSecret, WHATSAPP_VERIFY_TOKEN: verify, WHATSAPP_TOKEN: env("WHATSAPP_TOKEN") })
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (faltando.length) return Response.json({ ok: false, faltando_variaveis: faltando });

  const resultados = [];
  const assinar = (fields) =>
    chamar(`1. Cadastrar webhook do app (${fields})`, `${GRAPH()}/${appId}/subscriptions`, {
      object: "whatsapp_business_account",
      callback_url: callback,
      verify_token: verify,
      fields,
      include_values: "true",
      access_token: `${appId}|${appSecret}`,
    });
  // Tenta com os ecos da coexistência (suas respostas pelo app); se a Meta recusar, fica só com mensagens
  let r1 = await assinar("messages,smb_message_echoes");
  if (!r1.ok) {
    const sem = await assinar("messages");
    resultados.push({ ...r1, aviso: "Ecos do app recusados; webhook ficou só com mensagens" });
    r1 = sem;
  }
  resultados.push(r1);
  if (waba) {
    resultados.push(
      await chamar(`2. Inscrever a conta do WhatsApp ${waba} no app`, `${GRAPH()}/${waba}/subscribed_apps`, {
        access_token: env("WHATSAPP_TOKEN"),
      })
    );
    // 3) Lista os números da conta (para conferir o número real)
    try {
      const res = await fetch(`${GRAPH()}/${waba}/phone_numbers?fields=id,display_phone_number,verified_name,platform_type,code_verification_status,quality_rating`, {
        headers: { Authorization: `Bearer ${env("WHATSAPP_TOKEN")}` },
      });
      const d = await res.json().catch(() => ({}));
      resultados.push({ passo: "3. Números da conta", ok: res.ok && !d.error, resposta: d.error ? { erro: d.error.message, codigo: d.error.code } : d.data });
    } catch (e) {
      resultados.push({ passo: "3. Números da conta", ok: false, erro: String(e) });
    }
  } else {
    resultados.push({ passo: "2. Inscrever conta do WhatsApp", ok: false, erro: "Passe &waba=ID_DA_CONTA na URL" });
  }

  return Response.json({ versao: "v9", callback, resultados }, { headers: { "cache-control": "no-store" } });
};

export const config = { path: "/configurar" };
