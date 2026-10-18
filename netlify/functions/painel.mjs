// Painel dos bots (v7): caixa de entrada das conversas + pedidos de orçamento.
// Acesse: https://SEU-SITE.netlify.app/painel?token=SEU_ADMIN_TOKEN

import { criarArmazenamento } from "../../src/armazenamento.mjs";
import { criarEnviador } from "../../src/whatsapp.mjs";
import { registrar } from "../../src/historico.mjs";
import deoRepair from "../../src/negocios/deo-repair.mjs";
import deoDev from "../../src/negocios/deo-dev.mjs";
import { timingSafeEqual } from "node:crypto";

const NEGOCIOS = { "deo-repair": deoRepair, "deo-dev": deoDev };
const HORAS = () => Number(process.env.ATENDENTE_HORAS || 12);
const ORIGENS = { whatsapp: "💬 WhatsApp", instagram: "📸 Instagram", facebook: "📘 Facebook", site: "🌐 Site" };
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const json = (d, status = 200) => Response.json(d, { status, headers: { "cache-control": "no-store" } });

function tokenOk(recebido) {
  const certo = (process.env.ADMIN_TOKEN || "").trim();
  if (!certo || !recebido || recebido.length !== certo.length) return false;
  return timingSafeEqual(Buffer.from(recebido), Buffer.from(certo));
}

export default async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || req.headers.get("x-token");
  if (!tokenOk(token)) return new Response("Acesso negado", { status: 401 });
  const store = criarArmazenamento();
  const rota = url.pathname.replace(/\/+$/, "");

  // ---------- Arquivo enviado por um cliente ----------
  if (rota.endsWith("/midia")) {
    const m = await store.lerMidia(url.searchParams.get("k") || "");
    if (!m) return new Response("Arquivo não encontrado", { status: 404 });
    return new Response(m.dados, { headers: { "content-type": m.mime, "cache-control": "private, max-age=3600" } });
  }

  // ---------- API da caixa de entrada ----------
  if (rota.endsWith("/api/conversas")) {
    const chaves = await store.listarHistoricos();
    const agora = Date.now();
    const lista = await Promise.all(
      chaves.map(async (k) => {
        const [neg, tel] = k.split(":");
        const hist = await store.lerHistorico(k);
        const ult = hist[hist.length - 1] || {};
        const nome = [...hist].reverse().find((h) => h.nome)?.nome;
        const conv = (await store.lerConversa(k)) || {};
        const comVoce = conv.etapa === "atendente" && conv.atendenteAte > agora;
        return { neg, tel, nome: conv.respostas?.nome || nome || tel, ultima: ult.texto || `[${ult.tipo || "mensagem"}]`, de: ult.de, em: ult.em || 0, comVoce, total: hist.length };
      })
    );
    return json(lista.sort((a, b) => b.em - a.em));
  }

  if (rota.endsWith("/api/conversa")) {
    const neg = url.searchParams.get("neg");
    const tel = (url.searchParams.get("tel") || "").replace(/\D/g, "");
    const k = `${neg}:${tel}`;
    const conv = (await store.lerConversa(k)) || {};
    return json({ mensagens: await store.lerHistorico(k), comVoce: conv.etapa === "atendente" && conv.atendenteAte > Date.now(), ate: conv.atendenteAte || 0 });
  }

  if (rota.endsWith("/api/estado") && req.method === "POST") {
    const { neg, tel, acao } = await req.json().catch(() => ({}));
    const k = `${neg}:${String(tel || "").replace(/\D/g, "")}`;
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
    const { neg, tel: telBruto, texto } = await req.json().catch(() => ({}));
    const negocio = NEGOCIOS[neg];
    const tel = String(telBruto || "").replace(/\D/g, "");
    const msg = String(texto || "").trim();
    if (!negocio || !tel || !msg) return json({ ok: false, erro: "Dados incompletos." }, 400);
    const phoneNumberId = process.env[negocio.phoneNumberIdEnv];
    if (!phoneNumberId || phoneNumberId === "0") return json({ ok: false, erro: `O número da ${negocio.nome} ainda não está configurado.` }, 400);
    const wa = criarEnviador({ phoneNumberId, token: process.env.WHATSAPP_TOKEN });
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

  // ---------- Página ----------
  const leads = await store.listarLeads();
  const link = (q) => `?token=${encodeURIComponent(token)}${q}`;
  const cartoes = leads
    .map((l) => {
      const quando = new Date(l.criadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      const campos = Object.entries(l.respostas || {})
        .map(([k, v]) => `<dt>${esc(k.replace(/_/g, " "))}</dt><dd>${esc(v)}</dd>`)
        .join("");
      const midias = (l.midias || [])
        .map((k, i) => `<a href="/painel/midia${link(`&k=${encodeURIComponent(k)}`)}" target="_blank">📎 Arquivo ${i + 1}</a>`)
        .join(" ");
      return `<article class="lead ${esc(l.negocio)}" data-neg="${esc(l.negocio)}">
        <header><span class="tag">${esc(l.negocioNome)}</span><span class="origem">${ORIGENS[l.origem || "whatsapp"] || ""}</span><time>${esc(quando)}</time></header>
        <h3>${esc(l.respostas?.nome || l.nomePerfil || "Cliente")}</h3>
        <dl>${campos}</dl>
        <footer><button class="link" data-abrir="${esc(l.negocio)}:${esc(l.telefone)}">💬 Abrir conversa</button> ${midias}</footer>
      </article>`;
    })
    .join("");

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Painel Bots Deo</title>
<meta name="theme-color" content="#0f1115"><meta name="apple-mobile-web-app-capable" content="yes">
<style>
:root{--bg:#0f1115;--card:#181b22;--card2:#20242d;--txt:#e9ecf1;--sub:#9aa3b2;--repair:#ff7a1a;--dev:#3d8bff;--linha:#262a33;--voce:#1f6f4a;--bot:#2a2f3a;--erro:#e5484d}
*{box-sizing:border-box}html,body{height:100%}body{margin:0;background:var(--bg);color:var(--txt);font:15px/1.45 system-ui,sans-serif}
.topo{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--linha);position:sticky;top:0;background:var(--bg);z-index:5}
.topo h1{font-size:17px;margin:0;margin-right:auto}.abas,.filtros{display:flex;gap:6px;flex-wrap:wrap}
.pill{border:1px solid var(--linha);background:none;color:var(--txt);padding:6px 12px;border-radius:99px;font:inherit;cursor:pointer}
.pill.on{background:var(--txt);color:var(--bg)}
.filtros{padding:10px 16px}
#conversas{display:grid;grid-template-columns:minmax(260px,360px) 1fr;height:calc(100% - 108px)}
#lista{overflow:auto;border-right:1px solid var(--linha)}
.item{display:block;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--linha);color:var(--txt);padding:12px 16px;cursor:pointer;font:inherit;border-left:4px solid var(--dev)}
.item.deo-repair{border-left-color:var(--repair)}.item.ativo{background:var(--card)}
.item b{display:block}.item small{color:var(--sub);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.selo{font-size:11px;padding:2px 8px;border-radius:99px;background:var(--bot);color:var(--sub);float:right}.selo.voce{background:var(--voce);color:#fff}
#chat{display:flex;flex-direction:column;min-width:0}
#cab{padding:12px 16px;border-bottom:1px solid var(--linha);display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#cab b{margin-right:auto}#voltar{display:none}
#msgs{flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:8px}
.m{max-width:78%;padding:8px 12px;border-radius:12px;white-space:pre-wrap;word-break:break-word}
.m small{display:block;color:var(--sub);font-size:11px;margin-top:4px}
.m.cliente{background:var(--card2);align-self:flex-start}
.m.bot{background:var(--bot);align-self:flex-end}
.m.voce{background:var(--voce);align-self:flex-end}
.m.falhou{outline:2px solid var(--erro)}
.m a{color:#9cc3ff}
form#envio{display:flex;gap:8px;padding:12px 16px;border-top:1px solid var(--linha)}
form#envio textarea{flex:1;resize:none;height:44px;background:var(--card);color:var(--txt);border:1px solid var(--linha);border-radius:10px;padding:10px;font:inherit}
.btn{background:var(--txt);color:var(--bg);border:0;border-radius:10px;padding:0 16px;font:inherit;font-weight:600;cursor:pointer}
.vazio{color:var(--sub);padding:24px 16px}
#aviso{color:var(--erro);padding:0 16px 8px;font-size:13px}
#pedidos{display:none;padding:16px;gap:14px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.lead{background:var(--card);border:1px solid var(--linha);border-left:4px solid var(--dev);border-radius:12px;padding:16px}
.lead.deo-repair{border-left-color:var(--repair)}
.lead header{display:flex;justify-content:space-between;color:var(--sub);font-size:13px}.tag{font-weight:600}.origem{margin-left:auto;margin-right:10px}
.lead h3{margin:6px 0 10px}dl{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin:0}dt{color:var(--sub);text-transform:capitalize}dd{margin:0;word-break:break-word}
.lead footer{margin-top:12px;display:flex;gap:12px;flex-wrap:wrap}.lead a{color:var(--txt)}
.link{background:none;border:0;color:var(--txt);text-decoration:underline;cursor:pointer;font:inherit;padding:0}
.ver{position:fixed;bottom:6px;right:10px;color:var(--sub);font-size:11px}
@media (max-width:720px){#conversas{grid-template-columns:1fr}#chat{display:none}#conversas.aberta #lista{display:none}#conversas.aberta #chat{display:flex}#voltar{display:inline-block}}
</style></head><body>
<div class="topo"><h1>Bots Deo</h1><div class="abas"><button class="pill on" data-aba="conversas">💬 Conversas</button><button class="pill" data-aba="pedidos">📝 Pedidos (${leads.length})</button></div></div>
<div class="filtros"><button class="pill on" data-f="">Todos</button><button class="pill" data-f="deo-repair">🔧 Deo Repair</button><button class="pill" data-f="deo-dev">💻 Deo Dev</button></div>
<section id="conversas">
  <div id="lista"><p class="vazio">Carregando…</p></div>
  <div id="chat">
    <div id="cab"><button class="pill" id="voltar">←</button><b id="titulo">Escolha uma conversa</b><button class="pill" id="assumir" hidden>🙋 Assumir</button><button class="pill" id="devolver" hidden>🤖 Devolver ao bot</button></div>
    <div id="msgs"></div><div id="aviso"></div>
    <form id="envio" hidden><textarea id="texto" placeholder="Responder como a empresa…"></textarea><button class="btn">Enviar</button></form>
  </div>
</section>
<section id="pedidos">${cartoes || '<p class="vazio">Nenhum pedido ainda.</p>'}</section>
<span class="ver">Bots Deo v7</span>
<script>
const T=${JSON.stringify(token)};const q=(p)=>p+(p.includes('?')?'&':'?')+'token='+encodeURIComponent(T);
const NOMES={'deo-repair':'Deo Repair','deo-dev':'Deo Dev'};const QUEM={cliente:'Cliente',bot:'Bot','voce-painel':'Você (painel)','voce-app':'Você (app)','voce-whats':'Você (/r)'};
let filtro='',atual=null,convs=[];
const $=(s)=>document.querySelector(s);const hora=(t)=>new Date(t).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
const esc=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
document.querySelectorAll('[data-aba]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-aba]').forEach(x=>x.classList.toggle('on',x===b));$('#conversas').style.display=b.dataset.aba==='conversas'?'':'none';$('#pedidos').style.display=b.dataset.aba==='pedidos'?'grid':'none'});
document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{filtro=b.dataset.f;document.querySelectorAll('[data-f]').forEach(x=>x.classList.toggle('on',x===b));desenharLista();document.querySelectorAll('.lead').forEach(l=>l.style.display=!filtro||l.dataset.neg===filtro?'':'none')});
document.querySelectorAll('[data-abrir]').forEach(b=>b.onclick=()=>{const [n,t]=b.dataset.abrir.split(':');document.querySelector('[data-aba=conversas]').click();abrir(n,t)});
async function carregarLista(){try{convs=await (await fetch(q('/painel/api/conversas'))).json();desenharLista()}catch(e){}}
function desenharLista(){const l=convs.filter(c=>!filtro||c.neg===filtro);$('#lista').innerHTML=l.length?l.map(c=>'<button class="item '+c.neg+(atual&&atual.neg===c.neg&&atual.tel===c.tel?' ativo':'')+'" data-n="'+c.neg+'" data-t="'+c.tel+'"><span class="selo '+(c.comVoce?'voce':'')+'">'+(c.comVoce?'com você':'bot')+'</span><b>'+esc(c.nome)+'</b><small>'+NOMES[c.neg]+' · '+hora(c.em)+'</small><small>'+esc((QUEM[c.de]||'')+': '+c.ultima)+'</small></button>').join(''):'<p class="vazio">Nenhuma conversa ainda.</p>';document.querySelectorAll('.item').forEach(b=>b.onclick=()=>abrir(b.dataset.n,b.dataset.t))}
async function abrir(neg,tel){atual={neg,tel};$('#conversas').classList.add('aberta');$('#envio').hidden=false;$('#aviso').textContent='';await carregarConversa(true);desenharLista()}
async function carregarConversa(rolar){if(!atual)return;const d=await (await fetch(q('/painel/api/conversa?neg='+atual.neg+'&tel='+atual.tel))).json();const c=convs.find(x=>x.neg===atual.neg&&x.tel===atual.tel);$('#titulo').textContent=(c?.nome||atual.tel)+' · '+NOMES[atual.neg];$('#assumir').hidden=d.comVoce;$('#devolver').hidden=!d.comVoce;const box=$('#msgs');const perto=box.scrollHeight-box.scrollTop-box.clientHeight<80;box.innerHTML=d.mensagens.map(m=>{const cls=m.de==='cliente'?'cliente':m.de==='bot'?'bot':'voce';const midia=m.midiaChave?'<br><a target="_blank" href="'+q('/painel/midia?k='+encodeURIComponent(m.midiaChave))+'">📎 ver '+esc(m.tipo)+'</a>':'';const ops=m.opcoes?'<br><small>['+m.opcoes.map(esc).join(' · ')+']</small>':'';return '<div class="m '+cls+(m.falhou?' falhou':'')+'">'+esc(m.texto||(m.midiaChave?'':'['+m.tipo+']'))+midia+ops+'<small>'+(QUEM[m.de]||m.de)+' · '+hora(m.em)+(m.falhou?' · não entregue':'')+'</small></div>'}).join('')||'<p class="vazio">Sem mensagens.</p>';if(rolar||perto)box.scrollTop=box.scrollHeight}
$('#voltar').onclick=()=>{$('#conversas').classList.remove('aberta');atual=null;desenharLista()};
async function estado(acao){await fetch(q('/painel/api/estado'),{method:'POST',body:JSON.stringify({...atual,acao})});await carregarConversa();carregarLista()}
$('#assumir').onclick=()=>estado('assumir');$('#devolver').onclick=()=>estado('devolver');
$('#envio').onsubmit=async(e)=>{e.preventDefault();const t=$('#texto').value.trim();if(!t||!atual)return;$('#texto').value='';$('#aviso').textContent='Enviando…';const r=await (await fetch(q('/painel/api/responder'),{method:'POST',body:JSON.stringify({...atual,texto:t})})).json();$('#aviso').textContent=r.ok?'':r.erro;await carregarConversa(true);carregarLista()};
$('#texto').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#envio').requestSubmit()}});
carregarLista();setInterval(carregarLista,15000);setInterval(()=>carregarConversa(false),5000);
</script>
</body></html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
};

export const config = { path: ["/painel", "/painel/midia", "/painel/api/conversas", "/painel/api/conversa", "/painel/api/responder", "/painel/api/estado"] };
