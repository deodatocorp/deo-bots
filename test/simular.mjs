// Simulador local: roda conversas inteiras sem precisar da Meta nem do Netlify.
// Uso:  npm run teste
import assert from "node:assert/strict";
import deoRepair from "../src/negocios/deo-repair.mjs";
import deoDev from "../src/negocios/deo-dev.mjs";
import { processarMensagem, mesmoNumero } from "../src/bot.mjs";
import { criarArmazenamentoMemoria } from "./armazenamento-memoria.mjs";

const DONO = "5521988887777";
const CLIENTE = "5521911112222";
const verbose = process.argv.includes("-v");

function montar(negocio, { comIA = true } = {}) {
  const store = criarArmazenamentoMemoria();
  const saida = [];
  const reg = (tipo) => async (para, ...args) => (saida.push({ para, tipo, args }), true);
  const wa = { texto: reg("texto"), botoes: reg("botoes"), lista: reg("lista"), lida: async () => true };
  const ia = comIA ? async (_n, hist) => `[IA] resposta para: ${hist.at(-1).content}` : null;
  let n = 0;
  let relogio = Date.parse("2026-10-18T12:00:00Z");

  async function envia(de, conteudo, nome = "Cliente Teste") {
    const msg = { id: `wamid.${++n}`, from: de, type: "text" };
    if (typeof conteudo === "string") msg.text = { body: conteudo };
    else Object.assign(msg, conteudo);
    const antes = saida.length;
    await processarMensagem(
      { negocio, msg, nomePerfil: nome },
      { store, wa, ia, donoNumero: DONO, agora: relogio, urlSite: "https://deo.test", adminToken: "x",
        baixarMidia: async () => ({ dados: new ArrayBuffer(4), mime: "image/jpeg" }) }
    );
    const novas = saida.slice(antes);
    if (verbose) for (const s of novas) console.log(`   → [${s.tipo}] para ${s.para}:`, JSON.stringify(s.args).slice(0, 160));
    return novas;
  }
  const escolha = (id, title) => ({ type: "interactive", interactive: { type: "list_reply", list_reply: { id, title } } });
  const botao = (id, title) => ({ type: "interactive", interactive: { type: "button_reply", button_reply: { id, title } } });
  const avancar = (h) => (relogio += h * 3600e3);
  return { envia, escolha, botao, store, avancar };
}

let ok = 0;
async function caso(nome, fn) {
  await fn();
  ok++;
  console.log(`✅ ${nome}`);
}

// ---------------------------------------------------------------
await caso("números BR com e sem o 9 são o mesmo", () => {
  assert.ok(mesmoNumero("5521988887777", "552188887777"));
  assert.ok(!mesmoNumero("5521988887777", "5521988887776"));
});

await caso("Deo Repair: oi → boas-vindas com menu", async () => {
  const { envia } = montar(deoRepair);
  const r = await envia(CLIENTE, "Oi, bom dia!");
  assert.equal(r[0].tipo, "lista");
  assert.match(r[0].args[0], /Deo Repair/);
  assert.equal(r[0].args[2].length, 6);
});

await caso("Deo Repair: pré-orçamento completo + aviso ao dono + lead salvo", async () => {
  const { envia, escolha, botao, store } = montar(deoRepair);
  await envia(CLIENTE, "oi");
  let r = await envia(CLIENTE, escolha("menu:orcamento", "Pedir orçamento"));
  assert.match(r.at(-1).args[0], /nome/);
  r = await envia(CLIENTE, "João");
  assert.equal(r[0].tipo, "lista"); // tipo de aparelho
  r = await envia(CLIENTE, escolha("opt:1:0", "Smartphone"));
  r = await envia(CLIENTE, "iPhone 11");
  r = await envia(CLIENTE, { type: "image", image: { id: "m1", caption: "tela" } }); // foto no meio
  assert.match(r[0].args[0], /Recebi o arquivo/);
  r = await envia(CLIENTE, "Tela quebrada, touch não funciona");
  assert.equal(r[0].tipo, "botoes");
  r = await envia(CLIENTE, botao("opt:4:1", "Não"));
  r = await envia(CLIENTE, botao("opt:5:0", "Urgente"));
  assert.match(r[0].args[0], /iPhone 11/);
  assert.match(r[0].args[0], /Urgência:\* Urgente/);
  r = await envia(CLIENTE, botao("conf:sim", "✅ Confirmar"));
  const aviso = r.find((s) => s.para === DONO);
  assert.ok(aviso, "dono deveria ser avisado");
  assert.match(aviso.args[0], /Novo pedido/);
  assert.match(aviso.args[0], /1 arquivo/);
  const leads = await store.listarLeads();
  assert.equal(leads.length, 1);
  assert.equal(leads[0].respostas.aparelho, "Smartphone");
  // após o pedido, mensagens do cliente vão para o dono
  r = await envia(CLIENTE, "quanto tempo demora?");
  assert.equal(r.length, 1);
  assert.equal(r[0].para, DONO);
});

await caso("Deo Dev: palavra 'orçamento' inicia triagem; corrigir reinicia; cancelar sai", async () => {
  const { envia, botao } = montar(deoDev);
  await envia(CLIENTE, "boa tarde");
  let r = await envia(CLIENTE, "queria um orçamento de site");
  assert.match(r.at(-1).args[0], /nome/);
  for (const t of ["Ana", "Barbearia do Zé", "barbearia", "Landing page", "Plano 2 (R$ 499,99)", "não"]) await envia(CLIENTE, t);
  r = await envia(CLIENTE, botao("conf:corrigir", "Corrigir"));
  assert.match(r.at(-1).args[0], /nome/);
  r = await envia(CLIENTE, "cancelar");
  assert.equal(r.at(-1).tipo, "lista");
});

await caso("Deo Dev: planos mostra preços; pergunta livre vai para a IA", async () => {
  const { envia, escolha } = montar(deoDev);
  await envia(CLIENTE, "oi");
  let r = await envia(CLIENTE, escolha("menu:planos", "Planos e preços"));
  assert.match(r[0].args[0], /199,99/);
  assert.match(r[0].args[0], /499,99/);
  r = await envia(CLIENTE, "vocês fazem cardápio digital?");
  assert.match(r[0].args[0], /\[IA\]/);
});

await caso("sem IA: pergunta livre cai no menu", async () => {
  const { envia } = montar(deoRepair, { comIA: false });
  await envia(CLIENTE, "oi");
  const r = await envia(CLIENTE, "vocês trocam bateria de xbox?");
  assert.match(r[0].args[0], /não entendi/);
  assert.equal(r[1].tipo, "lista");
});

await caso("atendente: bot silencia, repassa, dono responde com /r e encerra com /fim", async () => {
  const { envia } = montar(deoRepair);
  await envia(CLIENTE, "oi");
  let r = await envia(CLIENTE, "quero falar com um atendente");
  assert.ok(r.some((s) => s.para === DONO && /quer falar/.test(s.args[0])));
  r = await envia(CLIENTE, "meu note não liga");
  assert.deepEqual(r.map((s) => s.para), [DONO]);
  r = await envia("552188887777", "/r Pode trazer amanhã às 10h"); // dono, sem o 9, sem número do cliente
  assert.ok(r.some((s) => s.para === "5521911112222" && /amanhã/.test(s.args[0])));
  r = await envia(DONO, `/r ${CLIENTE} Fica R$ 150`);
  assert.ok(r.some((s) => s.para === CLIENTE && s.args[0] === "Fica R$ 150"));
  r = await envia(DONO, "/fim");
  assert.ok(r.some((s) => s.para === CLIENTE && /Obrigado/.test(s.args[0])));
  r = await envia(CLIENTE, "valeu!");
  assert.equal(r[0].para, CLIENTE); // bot voltou
});

await caso("atendente expira depois de 12h", async () => {
  const { envia, avancar } = montar(deoRepair);
  await envia(CLIENTE, "oi");
  await envia(CLIENTE, "atendente");
  avancar(13);
  const r = await envia(CLIENTE, "oi de novo");
  assert.equal(r[0].para, CLIENTE);
});

await caso("dono: /testar vira cliente, /dono volta; /leads e ajuda", async () => {
  const { envia } = montar(deoRepair);
  let r = await envia(DONO, "/testar");
  assert.match(r[0].args[0], /Modo teste/);
  r = await envia(DONO, "oi");
  assert.equal(r[0].tipo, "lista");
  r = await envia(DONO, "/dono");
  assert.match(r[0].args[0], /Modo dono/);
  r = await envia(DONO, "/leads");
  assert.match(r[0].args[0], /Nenhum lead/);
  r = await envia(DONO, "qualquer coisa");
  assert.match(r[0].args[0], /Comandos do dono/);
});

await caso("limites do WhatsApp respeitados nas configs", () => {
  for (const neg of [deoRepair, deoDev]) {
    assert.ok(neg.menu.length <= 10);
    for (const m of neg.menu) assert.ok(m.titulo.length <= 24 && m.descricao.length <= 72, m.titulo);
    for (const p of neg.triagem.perguntas) {
      if (p.tipo === "botoes") { assert.ok(p.opcoes.length <= 3); p.opcoes.forEach((o) => assert.ok(o.length <= 20, o)); }
      if (p.tipo === "lista") { assert.ok(p.opcoes.length <= 10); p.opcoes.forEach((o) => assert.ok(o.length <= 24, o)); }
    }
  }
});

console.log(`\n${ok} cenários passaram. 🎉`);
