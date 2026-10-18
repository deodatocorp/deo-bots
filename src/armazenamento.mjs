// Guarda o estado das conversas e os leads no Netlify Blobs
// (armazenamento grátis que já vem com o Netlify, sem banco de dados extra).

import { getStore } from "@netlify/blobs";

export function criarArmazenamento() {
  const conversas = getStore("conversas");
  const leads = getStore("leads");
  const processadas = getStore("mensagens-processadas");
  const midias = getStore("midias");

  return {
    salvarMidia: (chave, dados, mime) => midias.set(chave, dados, { metadata: { mime } }),
    lerMidia: async (chave) => {
      const r = await midias.getWithMetadata(chave, { type: "arrayBuffer" });
      return r ? { dados: r.data, mime: r.metadata?.mime || "application/octet-stream" } : null;
    },

    lerConversa: (chave) => conversas.get(chave, { type: "json" }),
    salvarConversa: (chave, dados) => conversas.setJSON(chave, dados),

    salvarLead: (lead) => leads.setJSON(`${lead.negocio}/${lead.criadoEm}-${lead.telefone}`, lead),
    listarLeads: async () => {
      const { blobs } = await leads.list();
      const todos = await Promise.all(blobs.map((b) => leads.get(b.key, { type: "json" })));
      return todos.filter(Boolean).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
    },

    // Evita responder duas vezes quando a Meta reenvia o mesmo webhook
    jaProcessada: async (id) => {
      if (await processadas.get(id)) return true;
      await processadas.set(id, "1");
      return false;
    },
  };
}
