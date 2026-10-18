// Versão em memória, usada nos testes locais
export function criarArmazenamentoMemoria() {
  const conversas = new Map();
  const leads = [];
  const processadas = new Set();
  const midias = new Map();
  const historico = new Map();
  return {
    addHistorico: async (k, item) => void historico.set(k, [...(historico.get(k) || []), item].slice(-300)),
    lerHistorico: async (k) => historico.get(k) || [],
    listarHistoricos: async () => [...historico.keys()],
    salvarMidia: async (k, dados, mime) => void midias.set(k, { dados, mime }),
    lerMidia: async (k) => midias.get(k) ?? null,
    lerConversa: async (k) => conversas.get(k) ?? null,
    salvarConversa: async (k, d) => void conversas.set(k, structuredClone(d)),
    salvarLead: async (l) => void leads.push(l),
    listarLeads: async () => [...leads].reverse(),
    marcar: async (k) => void processadas.add(k),
    tem: async (k) => processadas.has(k),
    jaProcessada: async (id) => (processadas.has(id) ? true : (processadas.add(id), false)),
    _leads: leads,
  };
}
