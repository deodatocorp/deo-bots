// =============================================================
//  DEO REPAIR — configuração do bot (v11)
//  Tudo que o cliente lê sai daqui. Edite à vontade.
//  Informações conferidas com o site (deorepair.netlify.app).
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
      "📱 *Smartphones* (Android e iPhone) — tela, bateria, conector de carga, câmera e lente, tampa traseira, áudio e microfone, celular molhado, placa\n" +
      "📲 *Tablets* — tela e touch, bateria, carga, botões e áudio, sistema, placa\n" +
      "💻 *Notebooks e MacBooks* — tela, teclado e touchpad, bateria, upgrade de SSD e memória, limpeza e pasta térmica, dobradiça, líquido derramado, formatação\n" +
      "🖥️ *Computadores* — diagnóstico, montagem e upgrade, limpeza, formatação, vírus e lentidão, rede e periféricos\n" +
      "🎮 *Videogames* — SSD maior, limpeza e pasta térmica, analógicos com drift (opção Hall Effect), controles, HDMI, leitor de disco\n\n" +
      "Não achou o seu? Conta o que está acontecendo que a gente te diz se tem jeito. 😉",

    como_funciona:
      "*Como funciona o reparo na Deo Repair* 🎥\n\n" +
      "1️⃣ Você descreve o problema e recebe um pré-orçamento\n" +
      "2️⃣ Seu aparelho é *filmado na abertura* — você vê o estado em que ele chegou\n" +
      "3️⃣ O reparo é feito\n" +
      "4️⃣ O aparelho é *filmado no fechamento*\n" +
      "5️⃣ Você recebe *o vídeo* + um *orçamento detalhado* de tudo o que foi feito\n\n" +
      "🛡️ *90 dias de garantia por escrito* em todo serviço. Você aprova o valor antes — nada é feito sem o seu ok.\n\n" +
      "Transparência total, do começo ao fim. ✅",

    horario:
      "*Horário e local* 📍\n\n" +
      "📍 Atendemos no *Rio de Janeiro — RJ*.\n" +
      "🕘 Atendimento *das 8h às 22h*.\n" +
      "📦 A forma de entrega do aparelho é combinada aqui pelo WhatsApp, depois do pré-orçamento.\n" +
      "💳 Pagamento: *Pix, cartão ou parcelado*.\n\n" +
      "Pode deixar sua mensagem a qualquer hora — respondemos assim que possível.",

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
SERVIÇOS DETALHADOS: smartphones Android e iPhone (tela, bateria, conector de carga, câmera e lente, tampa traseira, áudio e microfone, celular molhado, placa e "não liga"); tablets (tela e touch, bateria, carga, botões e áudio, sistema, placa); notebooks e MacBooks (tela, teclado e touchpad, bateria e carga, upgrade de SSD e memória, limpeza e pasta térmica, dobradiça e carcaça, líquido derramado, formatação com backup); computadores (não liga/reinicia, montagem e upgrade, limpeza, formatação, vírus e lentidão, rede e periféricos); videogames PlayStation, Xbox e Nintendo Switch (SSD maior, limpeza e pasta térmica, analógicos com drift com opção Hall Effect, controles, porta HDMI, leitor de disco, não liga). Marcas: Apple, Samsung, Motorola, Xiaomi, Lenovo, Dell, HP, Acer, Asus, PlayStation, Xbox, Nintendo e outras.
COMO FUNCIONA: diagnóstico e orçamento antes de mexer em qualquer coisa; o cliente aprova; abertura e fechamento filmados; o cliente recebe o vídeo e o orçamento detalhado com cada peça e serviço. Se surgir algo novo no meio do caminho, o Nathan avisa e o cliente decide.
ARQUIVOS: o reparo é no hardware e não mexemos em arquivos e fotos; mesmo assim recomendamos backup antes.
CONSOLES: podem perder a garantia de fábrica ao serem abertos; avisamos antes de começar.
LÍQUIDO: desligue na hora, tire da tomada, não tente carregar, esqueça o arroz e traga o quanto antes.
GARANTIA: 90 dias, por escrito no orçamento, em todo serviço.
LOCAL: Rio de Janeiro — RJ. A forma de entrega do aparelho é combinada pelo WhatsApp com o Nathan; não invente endereço.
HORÁRIO DE ATENDIMENTO: das 8h às 22h.
PAGAMENTO: Pix, cartão ou parcelado (condições do parcelamento combinadas no orçamento).
SITE: https://deorepair.netlify.app/
INSTAGRAM: @deo_repair
WHATSAPP: (21) 99229-1220
`.trim(),
};
