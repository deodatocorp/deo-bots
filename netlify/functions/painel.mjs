// Painel de pedidos de orçamento (leads) dos dois bots.
// Acesse: https://SEU-SITE.netlify.app/painel?token=SEU_ADMIN_TOKEN

import { criarArmazenamento } from "../../src/armazenamento.mjs";
import { timingSafeEqual } from "node:crypto";

const ORIGENS = { whatsapp: "💬 WhatsApp", instagram: "📸 Instagram", facebook: "📘 Facebook", site: "🌐 Site" };
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function tokenOk(recebido) {
  const certo = process.env.ADMIN_TOKEN || "";
  if (!certo || !recebido || recebido.length !== certo.length) return false;
  return timingSafeEqual(Buffer.from(recebido), Buffer.from(certo));
}

export default async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!tokenOk(token)) return new Response("Acesso negado", { status: 401 });

  const store = criarArmazenamento();

  // Arquivo enviado por um cliente (foto/vídeo/áudio)
  if (url.pathname.endsWith("/midia")) {
    const m = await store.lerMidia(url.searchParams.get("k") || "");
    if (!m) return new Response("Arquivo não encontrado", { status: 404 });
    return new Response(m.dados, { headers: { "content-type": m.mime, "cache-control": "private, max-age=3600" } });
  }

  const leads = await store.listarLeads();
  const filtro = url.searchParams.get("negocio");
  const lista = filtro ? leads.filter((l) => l.negocio === filtro) : leads;
  const link = (q) => `?token=${encodeURIComponent(token)}${q}`;

  const cartoes = lista
    .map((l) => {
      const quando = new Date(l.criadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      const campos = Object.entries(l.respostas || {})
        .map(([k, v]) => `<dt>${esc(k.replace(/_/g, " "))}</dt><dd>${esc(v)}</dd>`)
        .join("");
      const midias = (l.midias || [])
        .map((k, i) => `<a href="/painel/midia${link(`&k=${encodeURIComponent(k)}`)}" target="_blank">📎 Arquivo ${i + 1}</a>`)
        .join(" ");
      const zap = `https://wa.me/${esc(l.telefone)}`;
      return `<article class="${esc(l.negocio)}">
        <header><span class="tag">${esc(l.negocioNome)}</span><span class="origem">${ORIGENS[l.origem || "whatsapp"] || ""}</span><time>${esc(quando)}</time></header>
        <h2>${esc(l.respostas?.nome || l.nomePerfil || "Cliente")}</h2>
        <dl>${campos}</dl>
        <footer><a href="${zap}" target="_blank">📞 ${esc(l.telefone)}</a> ${midias}</footer>
      </article>`;
    })
    .join("");

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Painel Bots Deo</title>
<style>
:root{--bg:#0f1115;--card:#181b22;--txt:#e9ecf1;--sub:#9aa3b2;--repair:#ff7a1a;--dev:#3d8bff;--linha:#262a33}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--txt);font:15px/1.5 system-ui,sans-serif;padding:24px 16px}
h1{margin:0 0 4px;font-size:22px}.sub{color:var(--sub);margin:0 0 18px}
nav{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}nav a{color:var(--txt);text-decoration:none;border:1px solid var(--linha);padding:6px 12px;border-radius:99px}
nav a.on{background:var(--txt);color:var(--bg)}
main{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
article{background:var(--card);border:1px solid var(--linha);border-left:4px solid var(--dev);border-radius:12px;padding:16px}
article.deo-repair{border-left-color:var(--repair)}
article header{display:flex;justify-content:space-between;color:var(--sub);font-size:13px}
.tag{font-weight:600}.origem{margin-left:auto;margin-right:10px}.deo-repair .tag{color:var(--repair)}.deo-dev .tag{color:var(--dev)}
h2{margin:6px 0 10px;font-size:18px}dl{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin:0}
dt{color:var(--sub);text-transform:capitalize}dd{margin:0;word-break:break-word}
footer{margin-top:12px;display:flex;gap:12px;flex-wrap:wrap}footer a{color:var(--txt)}
.vazio{color:var(--sub)}.ver{position:fixed;bottom:10px;right:14px;color:var(--sub);font-size:12px}
</style></head><body>
<h1>Pedidos de orçamento</h1><p class="sub">${lista.length} pedido(s)</p>
<nav>
<a href="${link("")}" class="${!filtro ? "on" : ""}">Todos</a>
<a href="${link("&negocio=deo-repair")}" class="${filtro === "deo-repair" ? "on" : ""}">🔧 Deo Repair</a>
<a href="${link("&negocio=deo-dev")}" class="${filtro === "deo-dev" ? "on" : ""}">💻 Deo Dev</a>
</nav>
<main>${cartoes || '<p class="vazio">Nenhum pedido ainda.</p>'}</main>
<span class="ver">Bots Deo v5</span>
</body></html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
};

export const config = { path: ["/painel", "/painel/midia"] };
