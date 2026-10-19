// =============================================================
//  DEO DEV — configuração do bot (v11)
//  Tudo que o cliente lê sai daqui. Edite à vontade.
//  Preços e planos conferidos com o site (deo-dev.netlify.app).
// =============================================================

export default {
  id: "deo-dev",
  nome: "Deo Dev",
  emoji: "💻",

  phoneNumberIdEnv: "DEV_PHONE_NUMBER_ID",

  // v13: número em coexistência ligado pelo YCloud → as respostas saem pela API do YCloud
  envio: "ycloud",

  // ---------------- Instagram e Messenger (v3) ----------------
  // Prefixo das variáveis de ambiente deste negócio no Netlify:
  // DEV_PAGE_TOKEN, DEV_WHATSAPP_NUMERO, DEV_SITE_URL, DEV_IG_ID (e opcionalmente DEV_PAGE_ID)
  envPrefixo: "DEV",
  redes: {
    facebook: "https://www.facebook.com/profile.php?id=61595093687313",
    facebookPageId: "61595093687313", // pode ser sobrescrito por DEV_PAGE_ID
    instagram: "https://www.instagram.com/deodev.corp/",
    whatsapp: "5521966986094", // pode ser sobrescrito por DEV_WHATSAPP_NUMERO
    site: "https://deo-dev.netlify.app/", // pode ser sobrescrito por DEV_SITE_URL
  },
  social: {
    saudacao:
      'Olá! 👋 Aqui é a Deo Dev 💻\nCriamos landing pages profissionais, identidade visual, posts para redes sociais e deixamos seu negócio visível no Google. Todo plano começa com um diagnóstico gratuito.\n\nO orçamento é feito pelo WhatsApp. Toque no botão abaixo 👇',
    cartaoTitulo: "Deo Dev 💻",
    cartaoSubtitulo: "Landing page, identidade visual, redes sociais e Google",
    botaoWhats: "Orçamento no WhatsApp",
    botaoSite: "Ver o site",
    // Texto que já vem escrito quando o cliente abre o WhatsApp ({canal} vira Instagram ou Facebook)
    mensagemWhats: "Oi! Vim pelo {canal} e quero um orçamento 😊",
    // Comentários com estas palavras recebem uma DM automática
    palavrasComentario: ["orcamento", "quero", "preco", "valor", "quanto", "info", "interesse", "como funciona"],
    respostaComentario: "Te chamei no direct! 📩",
    respostaComentarioFacebook: "Te mandei uma mensagem no Messenger! 📩",
  },

  boasVindas:
    "Olá! 👋 Aqui é a *Deo Dev* 💻\n" +
    "Ajudamos o seu negócio a ser encontrado e lembrado: *landing pages profissionais*, *identidade visual*, " +
    "*posts e gestão de redes sociais* e *presença no Google*.\n\n" +
    "Como posso te ajudar?",

  menu: [
    { id: "orcamento", titulo: "Quero um orçamento", descricao: "Conte sobre o seu negócio" },
    { id: "servicos", titulo: "Serviços", descricao: "O que a Deo Dev faz" },
    { id: "planos", titulo: "Planos e preços", descricao: "A partir de R$ 350 ou R$ 199,99/mês" },
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
      "*Planos Deo Dev* 💰\nTodo plano começa com um *diagnóstico gratuito*.\n\n" +
      "📍 *Presença — a partir de R$ 350* (pagamento único)\nPerfil no Google completo, WhatsApp e localização no Maps, demonstração de identidade visual e landing page, catálogo ou menu de valores.\n\n" +
      "🎨 *Marca — a partir de R$ 1.000* (pagamento único)\nIdentidade visual completa, landing page com a nova marca, perfil no Google e redes padronizados, demonstração de posts.\n\n" +
      "🚀 *Negócio Pronto — R$ 1.700* (pagamento único)\nIdentidade visual e manual da marca, landing page profissional, perfil no Google otimizado, catálogo ou menu de valores, TikTok, Instagram e Facebook configurados e demonstração de posts.\n\n" +
      "🔁 *Assinatura — a partir de R$ 199,99/mês*\nGestão de TikTok, Instagram e Facebook, até 12 posts por mês, Google atualizado e avaliações respondidas, relatório mensal. Fidelidade de 12 meses.\n\n" +
      "⏱️ Prazo de entrega: *de 7 a 30 dias*, conforme o plano.\n💳 Pagamento: *Pix, cartão ou parcelado*.\n\n" +
      "Dá para combinar: comece com o Negócio Pronto e mantenha tudo em dia com a assinatura. Quer ajuda para escolher? Toque em *Quero um orçamento* no menu.",

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
        opcoes: ["Presença (R$ 350)", "Marca (R$ 1.000)", "Negócio Pronto R$1.700", "Assinatura R$199,99/mês", "Quero ajuda p/ escolher"],
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
DIAGNÓSTICO: todo plano começa com um diagnóstico gratuito de como o negócio aparece hoje no Google, nas redes e no site.
PLANOS (pagamento único):
- Presença, a partir de R$ 350: perfil no Google completo; WhatsApp e localização no Maps; demonstração de identidade visual e landing page; catálogo ou menu de valores.
- Marca, a partir de R$ 1.000: identidade visual completa; landing page com a nova marca; perfil no Google e redes padronizados; demonstração de posts.
- Negócio Pronto, R$ 1.700: identidade visual completa e manual da marca; landing page profissional; perfil no Google completo e otimizado; catálogo ou menu de valores; TikTok, Instagram e Facebook configurados no padrão da marca; demonstração de posts.
ASSINATURA MENSAL, a partir de R$ 199,99/mês: gestão de TikTok, Instagram e Facebook; até 12 posts por mês; Google atualizado e avaliações respondidas; relatório mensal; serviços personalizados (dashboard, banco de clientes, controle de gastos) sob consulta, o que pode aumentar o valor. Fidelidade contratual de 12 meses, com rescisão antecipada conforme o contrato.
Pode contratar só um serviço. Também montamos plano sob medida.
COMO FUNCIONA: 1) diagnóstico; 2) proposta com o que será feito, prazos e valores; 3) criação, com aprovação do cliente antes de ir ao ar; 4) publicação e acompanhamento.
PRAZO DE ENTREGA: de 7 a 30 dias, dependendo do plano; o prazo exato vem na proposta, antes de fechar.
GOOGLE: não garantimos primeiro lugar (ninguém pode); deixamos o perfil completo, correto e ativo.
PAGAMENTO: Pix, cartão ou parcelado (condições do parcelamento combinadas na proposta).
HORÁRIO DE ATENDIMENTO: das 8h às 22h.
Não prometa nada que não esteja aqui.
SITE: https://deo-dev.netlify.app/
INSTAGRAM: @deodev.corp
WHATSAPP: (21) 96698-6094
`.trim(),
};
