// =============================================================
//  DEO REPAIR — configuração do bot (v5)
//  Tudo que o cliente lê sai daqui. Edite à vontade.
//  Itens marcados com ✏️ são placeholders que você precisa preencher.
// =============================================================

export default {
  id: "deo-repair",
  nome: "Deo Repair",
  emoji: "🔧",

  // ID do número na Meta (WhatsApp Manager → Configuração da API).
  // Vem da variável de ambiente para não ficar no código.
  phoneNumberIdEnv: "REPAIR_PHONE_NUMBER_ID",

  // ---------------- Instagram e Messenger (v3) ----------------
  // Prefixo das variáveis de ambiente deste negócio no Netlify:
  // REPAIR_PAGE_TOKEN, REPAIR_WHATSAPP_NUMERO, REPAIR_SITE_URL, REPAIR_IG_ID (e opcionalmente REPAIR_PAGE_ID)
  envPrefixo: "REPAIR",
  redes: {
    facebook: "https://www.facebook.com/profile.php?id=61595494169589",
    facebookPageId: "61595494169589", // pode ser sobrescrito por REPAIR_PAGE_ID
    instagram: "https://www.instagram.com/deo_repair/",
    whatsapp: "5521992291220", // pode ser sobrescrito por REPAIR_WHATSAPP_NUMERO
    site: "https://deorepair.netlify.app/", // pode ser sobrescrito por REPAIR_SITE_URL
  },
  social: {
    saudacao:
      'Olá! 👋 Aqui é a Deo Repair 🔧\nConsertamos smartphones, tablets, notebooks e computadores, e fazemos upgrades em videogames. Todo reparo é filmado na abertura e no fechamento, e você recebe o vídeo + orçamento detalhado.\n\nO orçamento é feito pelo WhatsApp. Toque no botão abaixo 👇',
    cartaoTitulo: "Deo Repair 🔧",
    cartaoSubtitulo: "Conserto de celular, tablet, notebook, PC e videogame",
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
    "Olá! 👋 Aqui é a *Deo Repair* 🔧\n" +
    "Consertamos *smartphones, tablets, notebooks e computadores*, e fazemos *upgrades em videogames*.\n\n" +
    "Como posso te ajudar?",

  // Itens do menu principal (lista do WhatsApp: máx. 10 itens,
  // título até 24 caracteres, descrição até 72).
  menu: [
    { id: "orcamento", titulo: "Pedir orçamento", descricao: "Conte o problema do seu aparelho" },
    { id: "servicos", titulo: "Serviços", descricao: "O que consertamos" },
    { id: "como_funciona", titulo: "Como funciona", descricao: "Vídeo do reparo e orçamento detalhado" },
    { id: "horario", titulo: "Horário e local", descricao: "Onde e quando atendemos" },
    { id: "duvida", titulo: "Tirar uma dúvida", descricao: "Pergunte o que quiser" },
    { id: "atendente", titulo: "Falar com o Nathan", descricao: "Atendimento humano" },
  ],

  respostas: {
    servicos:
      "*Serviços da Deo Repair* 🔧\n\n" +
      "📱 *Smartphones* — troca de tela, bateria, conector de carga, câmera, botões, software\n" +
      "📲 *Tablets* — tela, bateria, carga, software\n" +
      "💻 *Notebooks* — limpeza, pasta térmica, SSD, memória, tela, teclado, formatação\n" +
      "🖥️ *Computadores* — montagem, upgrade, limpeza, formatação, diagnóstico\n" +
      "🎮 *Videogames* — upgrades, limpeza e manutenção\n\n" +
      "✏️ (ajuste esta lista com os serviços que você realmente faz)",

    como_funciona:
      "*Como funciona o reparo na Deo Repair* 🎥\n\n" +
      "1️⃣ Você descreve o problema e recebe um pré-orçamento\n" +
      "2️⃣ Seu aparelho é *filmado na abertura* — você vê o estado em que ele chegou\n" +
      "3️⃣ O reparo é feito\n" +
      "4️⃣ O aparelho é *filmado no fechamento*\n" +
      "5️⃣ Você recebe *o vídeo* + um *orçamento detalhado* de tudo o que foi feito\n\n" +
      "Transparência total, do começo ao fim. ✅",

    horario:
      "*Horário e local* 📍\n\n" +
      "🕘 ✏️ Seg a Sex, 9h às 18h | Sáb, 9h às 13h\n" +
      "📍 ✏️ Bairro / forma de entrega (leva e traz? ponto de encontro?)\n\n" +
      "Fora do horário você pode deixar sua mensagem — respondemos assim que possível.",

    atendente:
      "Beleza! Avisei o Nathan e ele vai te responder por aqui em breve. 🙌\n" +
      "Enquanto isso, o bot fica em silêncio nesta conversa.\n" +
      "Se quiser voltar ao menu, é só digitar *menu*.",
  },

  // Perguntas do pré-orçamento, na ordem.
  // tipo: "texto" | "lista" | "botoes" (botões: máx. 3, título até 20 caracteres)
  triagem: {
    abertura: "Vamos montar seu pré-orçamento! São só algumas perguntas rápidas. 📝\n(Digite *cancelar* a qualquer momento para sair)",
    perguntas: [
      { campo: "nome", tipo: "texto", pergunta: "Qual é o seu *nome*?" },
      {
        campo: "aparelho",
        tipo: "lista",
        pergunta: "Qual é o *tipo de aparelho*?",
        botaoLista: "Escolher aparelho",
        opcoes: ["Smartphone", "Tablet", "Notebook", "Computador", "Videogame", "Outro"],
      },
      { campo: "modelo", tipo: "texto", pergunta: "Qual a *marca e modelo*? (ex.: Samsung A54, iPhone 12, PS4 Slim)" },
      { campo: "problema", tipo: "texto", pergunta: "Descreva o *problema*: o que aconteceu e o que ele está fazendo (ou não fazendo)?" },
      {
        campo: "aberto_antes",
        tipo: "botoes",
        pergunta: "O aparelho *já foi aberto* por outra assistência?",
        opcoes: ["Sim", "Não", "Não sei"],
      },
      {
        campo: "urgencia",
        tipo: "botoes",
        pergunta: "Qual a *urgência*?",
        opcoes: ["Urgente", "Essa semana", "Sem pressa"],
      },
    ],
    rotulos: {
      nome: "Nome",
      aparelho: "Aparelho",
      modelo: "Modelo",
      problema: "Problema",
      aberto_antes: "Já foi aberto",
      urgencia: "Urgência",
    },
    confirmacaoFinal:
      "Pronto! ✅ Seu pedido de orçamento foi enviado para o Nathan.\n" +
      "Ele vai analisar e te responder por aqui com o pré-orçamento.\n\n" +
      "Se puder, mande *fotos ou um vídeo curto* do problema — ajuda muito no diagnóstico! 📸",
  },

  // Conhecimento que a IA usa para responder dúvidas livres.
  // Quanto mais completo, melhor. NUNCA invente preços aqui que você não pratica.
  conhecimentoIA: `
Você é o assistente virtual da Deo Repair, assistência técnica de eletrônicos do Nathan.
SERVIÇOS: conserto de smartphones, tablets, notebooks e computadores; upgrades em videogames.
DIFERENCIAL: todo reparo é filmado na abertura e no fechamento do aparelho. O cliente recebe o vídeo e um orçamento detalhado de tudo o que foi feito. É o próprio Nathan quem faz os reparos.
PREÇOS: não existe tabela fixa — o valor depende do modelo e do diagnóstico. NUNCA informe preço; ofereça o pré-orçamento.
HORÁRIO/LOCAL: ✏️ preencher.
GARANTIA: ✏️ preencher (ex.: 90 dias nos serviços).
PAGAMENTO: ✏️ preencher (ex.: Pix, cartão).
SITE: https://deorepair.netlify.app/
INSTAGRAM: @deo_repair
WHATSAPP: (21) 99229-1220
`.trim(),
};
