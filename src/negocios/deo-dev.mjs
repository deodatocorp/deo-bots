// =============================================================
//  DEO DEV — configuração do bot (v2)
//  Tudo que o cliente lê sai daqui. Edite à vontade.
//  Itens marcados com ✏️ são placeholders que você precisa preencher.
// =============================================================

export default {
  id: "deo-dev",
  nome: "Deo Dev",
  emoji: "💻",

  phoneNumberIdEnv: "DEV_PHONE_NUMBER_ID",

  boasVindas:
    "Olá! 👋 Aqui é a *Deo Dev* 💻\n" +
    "Ajudamos o seu negócio a ser encontrado e lembrado: *landing pages profissionais*, *identidade visual*, " +
    "*posts e gestão de redes sociais* e *presença no Google*.\n\n" +
    "Como posso te ajudar?",

  menu: [
    { id: "orcamento", titulo: "Quero um orçamento", descricao: "Conte sobre o seu negócio" },
    { id: "servicos", titulo: "Serviços", descricao: "O que a Deo Dev faz" },
    { id: "planos", titulo: "Planos e preços", descricao: "A partir de R$ 199,99" },
    { id: "por_que_google", titulo: "Por que estar no Google", descricao: "O primeiro contato do seu cliente" },
    { id: "duvida", titulo: "Tirar uma dúvida", descricao: "Pergunte o que quiser" },
    { id: "atendente", titulo: "Falar com o Nathan", descricao: "Atendimento humano" },
  ],

  respostas: {
    servicos:
      "*Serviços da Deo Dev* 💻\n\n" +
      "🌐 *Landing page profissional* — a página do seu negócio, rápida e bonita no celular\n" +
      "🎨 *Identidade visual* — logo, cores e fontes da sua marca\n" +
      "📲 *Posts e gestão de redes sociais*\n" +
      "📍 *Presença no Google* — perfil da empresa no Google e Maps para seu cliente te achar\n\n" +
      "Hoje o Google é o primeiro contato do cliente com o seu negócio. Vamos fazer esse primeiro contato valer a pena. 🚀",

    planos:
      "*Planos Deo Dev* 💰\n\n" +
      "🔹 *Plano 1 — R$ 199,99*\n✏️ (o que inclui)\n\n" +
      "🔸 *Plano 2 — R$ 499,99*\n✏️ (o que inclui)\n\n" +
      "🔁 *Assinatura mensal — R$ 199,99/mês*\n✏️ (o que inclui: manutenção, posts, etc.)\n\n" +
      "Quer ajuda para escolher? Toque em *Quero um orçamento* no menu.",

    por_que_google:
      "*Por que estar no Google?* 🔎\n\n" +
      "Quando alguém precisa de um serviço, a primeira coisa que faz é pesquisar no Google. " +
      "Se o seu negócio não aparece — ou aparece sem fotos, horário e avaliações — o cliente vai para o concorrente.\n\n" +
      "A Deo Dev deixa seu negócio *encontrável, confiável e com cara profissional* desde o primeiro clique. ✅",

    atendente:
      "Beleza! Avisei o Nathan e ele vai te responder por aqui em breve. 🙌\n" +
      "Enquanto isso, o bot fica em silêncio nesta conversa.\n" +
      "Se quiser voltar ao menu, é só digitar *menu*.",
  },

  triagem: {
    abertura: "Vamos entender o seu negócio para montar a melhor proposta! 📝\n(Digite *cancelar* a qualquer momento para sair)",
    perguntas: [
      { campo: "nome", tipo: "texto", pergunta: "Qual é o seu *nome*?" },
      { campo: "negocio", tipo: "texto", pergunta: "Qual o *nome do seu negócio*?" },
      { campo: "ramo", tipo: "texto", pergunta: "Qual o *ramo*? (ex.: barbearia, restaurante, loja de roupas, clínica)" },
      {
        campo: "interesse",
        tipo: "lista",
        pergunta: "No que você tem *mais interesse*?",
        botaoLista: "Escolher serviço",
        opcoes: ["Landing page", "Identidade visual", "Redes sociais", "Presença no Google", "Pacote completo", "Não sei ainda"],
      },
      {
        campo: "plano",
        tipo: "lista",
        pergunta: "Algum *plano* chamou sua atenção?",
        botaoLista: "Escolher plano",
        opcoes: ["Plano 1 (R$ 199,99)", "Plano 2 (R$ 499,99)", "Mensal (R$ 199,99)", "Quero ajuda p/ escolher"],
      },
      { campo: "presenca_atual", tipo: "texto", pergunta: "Você já tem *site, Instagram ou perfil no Google*? Se sim, mande o link ou @ (ou responda *não*)." },
    ],
    rotulos: {
      nome: "Nome",
      negocio: "Negócio",
      ramo: "Ramo",
      interesse: "Interesse",
      plano: "Plano",
      presenca_atual: "Presença atual",
    },
    confirmacaoFinal:
      "Perfeito! ✅ Suas informações foram enviadas para o Nathan.\n" +
      "Ele vai dar uma olhada no seu negócio e te responder por aqui com uma proposta. 🚀",
  },

  conhecimentoIA: `
Você é o assistente virtual da Deo Dev, empresa do Nathan que cuida da presença digital de estabelecimentos.
SERVIÇOS: landing pages profissionais, identidade visual (logo, cores, fontes), posts e gestão de redes sociais, melhoria da visibilidade do negócio no Google (perfil da empresa no Google/Maps).
VISÃO: o Google é o primeiro contato do cliente com o negócio; a Deo Dev faz esse contato causar boa impressão.
PREÇOS: Plano 1 R$ 199,99; Plano 2 R$ 499,99; Assinatura mensal R$ 199,99/mês. Detalhes de cada plano: ✏️ preencher. Não prometa nada que não esteja aqui.
PRAZO DE ENTREGA: ✏️ preencher.
PAGAMENTO: ✏️ preencher.
`.trim(),
};
