// Webhook do WhatsApp — a Meta chama esta URL a cada mensagem recebida.
// URL final: https://SEU-SITE.netlify.app/webhook

import deoRepair from "../../src/negocios/deo-repair.mjs";
import deoDev from "../../src/negocios/deo-dev.mjs";
import { processarMensagem } from "../../src/bot.mjs";
import { criarEnviador, assinaturaValida, baixarMidia } from "../../src/whatsapp.mjs";
import { criarIA } from "../../src/ia.mjs";
import { criarArmazenamento } from "../../src/armazenamento.mjs";

const NEGOCIOS = [deoRepair, deoDev];
const env = (k) => process.env[k];

export default async (req) => {
  const url = new URL(req.url);

  // 1) Verificação inicial (a Meta faz um GET quando você cadastra o webhook)
  if (req.method === "GET") {
    const ok =
      url.searchParams.get("hub.mode") === "subscribe" &&
      url.searchParams.get("hub.verify_token") === env("WHATSAPP_VERIFY_TOKEN");
    return ok
      ? new Response(url.searchParams.get("hub.challenge"), { status: 200 })
      : new Response("Token de verificação inválido", { status: 403 });
  }

  if (req.method !== "POST") return new Response("Método não permitido", { status: 405 });

  // 2) Mensagens recebidas
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
  const token = env("WHATSAPP_TOKEN");
  const ia = criarIA({ apiKey: env("ANTHROPIC_API_KEY"), modelo: env("IA_MODELO") });

  for (const entry of corpo.entry || []) {
    for (const change of entry.changes || []) {
      const v = change.value || {};
      if (!v.messages?.length) continue; // ignora status de entrega/leitura

      const phoneNumberId = v.metadata?.phone_number_id;
      const negocio = NEGOCIOS.find((n) => env(n.phoneNumberIdEnv) === phoneNumberId);
      if (!negocio) {
        console.warn("[webhook] número sem negócio configurado:", phoneNumberId);
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
          console.error("[webhook] erro processando mensagem", msg.id, e);
        }
      }
    }
  }

  // Sempre 200, senão a Meta fica reenviando
  return new Response("ok", { status: 200 });
};

export const config = { path: "/webhook" };
