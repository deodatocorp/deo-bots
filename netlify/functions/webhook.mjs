// Webhook único (v6) — a Meta chama esta URL para WhatsApp, Messenger e Instagram.
// URL final: https://SEU-SITE.netlify.app/webhook

import deoRepair from "../../src/negocios/deo-repair.mjs";
import deoDev from "../../src/negocios/deo-dev.mjs";
import { processarMensagem } from "../../src/bot.mjs";
import { processarMensagemSocial, processarComentario, criarEnviadorSocial } from "../../src/social.mjs";
import { criarEnviador, assinaturaValida, baixarMidia } from "../../src/whatsapp.mjs";
import { criarIA } from "../../src/ia.mjs";
import { criarArmazenamento } from "../../src/armazenamento.mjs";

const NEGOCIOS = [deoRepair, deoDev];
const env = (k) => process.env[k];

const pageIdDe = (n) => env(`${n.envPrefixo}_PAGE_ID`) || n.redes?.facebookPageId;
const igIdDe = (n) => env(`${n.envPrefixo}_IG_ID`);

// Descobre o negócio pelo ID que a Meta manda em cada evento
function negocioPorConta(objeto, contaId) {
  return NEGOCIOS.find((n) => (objeto === "instagram" ? igIdDe(n) : pageIdDe(n)) === String(contaId));
}

export default async (req) => {
  const url = new URL(req.url);

  // 1) Verificação inicial (a Meta faz um GET quando você cadastra o webhook)
  if (req.method === "GET") {
    const recebido = (url.searchParams.get("hub.verify_token") || "").trim();
    const esperado = (env("WHATSAPP_VERIFY_TOKEN") || "").trim();
    const ok = url.searchParams.get("hub.mode") === "subscribe" && esperado !== "" && recebido === esperado;
    console.log("[verificacao]", { modo: url.searchParams.get("hub.mode"), recebido: recebido.length, esperado: esperado.length, ok });
    return ok
      ? new Response(url.searchParams.get("hub.challenge"), { status: 200 })
      : new Response("Token de verificação inválido", { status: 403 });
  }
  if (req.method !== "POST") return new Response("Método não permitido", { status: 405 });

  // 2) Eventos recebidos
  const corpoBruto = await req.text();
  if (!(await assinaturaValida(corpoBruto, req.headers.get("x-hub-signature-256"), env("META_APP_SECRET")))) {
    return new Response("Assinatura inválida", { status: 401 });
  }
  let corpo;
  try {
    corpo = JSON.parse(corpoBruto);
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }

  const store = criarArmazenamento();
  const ia = criarIA({ apiKey: env("ANTHROPIC_API_KEY"), modelo: env("IA_MODELO") });

  try {
    if (corpo.object === "whatsapp_business_account") await tratarWhatsApp(corpo, store, ia);
    else if (corpo.object === "page" || corpo.object === "instagram") await tratarSocial(corpo, store, ia);
  } catch (e) {
    console.error("[webhook] erro:", e);
  }

  // Sempre 200, senão a Meta fica reenviando
  return new Response("ok", { status: 200 });
};

// ---------------- WhatsApp ----------------
async function tratarWhatsApp(corpo, store, ia) {
  const token = env("WHATSAPP_TOKEN");
  for (const entry of corpo.entry || []) {
    for (const change of entry.changes || []) {
      const v = change.value || {};
      if (!v.messages?.length) continue; // ignora status de entrega/leitura

      const phoneNumberId = v.metadata?.phone_number_id;
      const negocio = NEGOCIOS.find((n) => env(n.phoneNumberIdEnv) === phoneNumberId);
      if (!negocio) {
        console.warn("[whatsapp] número sem negócio configurado:", phoneNumberId);
        continue;
      }
      const wa = criarEnviador({ phoneNumberId, token });
      const nomePerfil = v.contacts?.[0]?.profile?.name;

      for (const msg of v.messages) {
        try {
          if (await store.jaProcessada(msg.id)) continue;
          await wa.lida(msg.id);
          await processarMensagem(
            { negocio, msg, nomePerfil },
            {
              store,
              wa,
              ia,
              donoNumero: env("DONO_WHATSAPP"),
              baixarMidia: (id) => baixarMidia(id, token),
              urlSite: env("URL"), // o Netlify preenche sozinho
              adminToken: env("ADMIN_TOKEN"),
            }
          );
        } catch (e) {
          console.error("[whatsapp] erro na mensagem", msg.id, e);
        }
      }
    }
  }
}

// ---------------- Messenger e Instagram ----------------
async function tratarSocial(corpo, store, ia) {
  const plataforma = corpo.object === "instagram" ? "instagram" : "facebook";

  for (const entry of corpo.entry || []) {
    const negocio = negocioPorConta(corpo.object, entry.id);
    if (!negocio) {
      console.warn(`[${plataforma}] conta sem negócio configurado:`, entry.id);
      continue;
    }
    const token = env(`${negocio.envPrefixo}_PAGE_TOKEN`);
    if (!token) {
      console.warn(`[${plataforma}] falta ${negocio.envPrefixo}_PAGE_TOKEN`);
      continue;
    }
    const envio = criarEnviadorSocial({ pageId: pageIdDe(negocio), token });
    const deps = { store, envio, ia, appId: env("META_APP_ID") };

    // Mensagens diretas
    for (const evento of entry.messaging || []) {
      try {
        if (!evento.message && !evento.postback) continue; // leitura, reação etc.
        await processarMensagemSocial({ negocio, plataforma, evento }, deps);
      } catch (e) {
        console.error(`[${plataforma}] erro na mensagem`, e);
      }
    }

    // Comentários em posts
    for (const change of entry.changes || []) {
      try {
        const v = change.value || {};
        let comentario = null;
        if (plataforma === "instagram" && change.field === "comments") {
          comentario = { id: v.id, texto: v.text, deId: v.from?.id, contaId: entry.id };
        } else if (plataforma === "facebook" && change.field === "feed" && v.item === "comment" && v.verb === "add") {
          comentario = { id: v.comment_id, texto: v.message, deId: v.from?.id, contaId: entry.id };
        }
        if (comentario) await processarComentario({ negocio, plataforma, comentario }, deps);
      } catch (e) {
        console.error(`[${plataforma}] erro no comentário`, e);
      }
    }
  }
}

export const config = { path: "/webhook" };
