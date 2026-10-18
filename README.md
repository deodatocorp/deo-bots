# 🤖 Bots WhatsApp — Deo Repair & Deo Dev · **v2**

Um único projeto no Netlify atende **os dois números**. O bot descobre qual negócio é pela mensagem que chega e responde com a configuração certa.

## O que o bot faz

| | Deo Repair 🔧 | Deo Dev 💻 |
|---|---|---|
| **Menu** (lista do WhatsApp) | Orçamento · Serviços · Como funciona (vídeo do reparo) · Horário · Dúvida · Falar com o Nathan | Orçamento · Serviços · Planos e preços · Por que estar no Google · Dúvida · Falar com o Nathan |
| **Pré-orçamento** | nome → aparelho → modelo → problema → já foi aberto? → urgência | nome → negócio → ramo → interesse → plano → presença atual |
| **IA** | responde dúvidas livres só com as informações da config, nunca inventa preço | idem |

Depois que o cliente confirma o pré-orçamento, **você recebe um aviso no seu WhatsApp pessoal** e o bot entra em modo silencioso naquela conversa: tudo que o cliente mandar (inclusive fotos) é repassado para você.

### Como você responde os clientes (comandos do dono)

Você manda estes comandos **do seu WhatsApp pessoal para o número do bot**:

| Comando | O que faz |
|---|---|
| `/r 5521999999999 Seu orçamento ficou R$ 150` | Envia a mensagem ao cliente pelo número da empresa |
| `/r Pode trazer amanhã` | Sem número = responde o último cliente que falou com você |
| `/fim 5521999999999` | Encerra o atendimento e religa o bot para esse cliente |
| `/leads` | Últimos 5 pedidos + link do painel |
| `/testar` / `/dono` | Liga/desliga o modo teste (você conversa com o bot como cliente) |
| qualquer outra coisa | Mostra a ajuda |

Se você não responder, o bot volta a atender sozinho depois de **12 horas** (`ATENDENTE_HORAS`).

> ⚠️ **Regra das 24h:** o WhatsApp só deixa a empresa mandar mensagem livre para quem falou com ela nas últimas 24h. Isso vale para os avisos que *você* recebe: mande qualquer coisa (ex.: `/leads`) para cada bot **uma vez por dia**. Mesmo se esquecer, nada se perde — tudo fica no **painel**.

### Painel de pedidos
`https://SEU-SITE.netlify.app/painel?token=SEU_ADMIN_TOKEN` — lista os pedidos dos dois negócios, com filtro, link para o WhatsApp do cliente e as fotos/vídeos que ele mandou.

---

## Implementação passo a passo

Tempo estimado: **cerca de 1 hora**. Você começa pelo **número de teste grátis da Meta**, que não exige chip, e só depois coloca os números reais.

### 0. O que você precisa
- Contas no **Facebook**, no **GitHub** e no **Netlify**.
- **Para a fase final:** dois chips, um por negócio, que **não** estejam com WhatsApp ativo. Se o número já tem WhatsApp, apague a conta nele antes. *(A Meta tem um modo de “coexistência” para usar o app e a API no mesmo número, mas ele é ativado por parceiros oficiais. Para começar, use números dedicados.)*
- *(Opcional)* Uma chave da Anthropic para a IA, em console.anthropic.com. Sem ela, o bot funciona só com menu e pré-orçamento.

### 1. Suba o projeto no GitHub
1. Descompacte o zip.
2. Em **github.com**, clique em **New repository**, dê o nome `deo-bots` e marque **Private** → **Create**.
3. Clique em **uploading an existing file** e arraste **o conteúdo** da pasta (os arquivos e pastas de dentro, não a pasta em si) → **Commit changes**.
   *(Arquivos que começam com ponto, como `.env.example` e `.gitignore`, podem ficar ocultos no seu sistema. Eles não são obrigatórios para funcionar.)*

### 2. Crie o app na Meta
1. Em **developers.facebook.com**, vá em **Meus apps → Criar app** → tipo **Empresa (Business)**.
2. Vincule ou crie o **Portfólio empresarial** “Deodato Corp”.
3. Adicione o produto **WhatsApp**.
4. Em **WhatsApp → Configuração da API**, a Meta te dá um **número de teste**. Copie:
   - o **token temporário**, que vira `WHATSAPP_TOKEN` e vale 24h;
   - a **Identificação do número de telefone**, que vira `REPAIR_PHONE_NUMBER_ID`.
5. Na mesma tela, em **Para**, cadastre **seu celular** como destinatário de teste e confirme o código.
6. Em **Configurações do app → Básico**, copie o **Chave Secreta do Aplicativo**, que vira `META_APP_SECRET`.

### 3. Publique no Netlify
1. Em **app.netlify.com**, vá em **Add new site → Import an existing project → GitHub** e escolha `deo-bots` → **Deploy**. Não precisa mudar nada.
   *(O deploy de arrastar a pasta não publica as funções; use o GitHub.)*
2. Em **Site configuration → Environment variables**, crie as variáveis abaixo:

   | Variável | Valor na fase de teste |
   |---|---|
   | `WHATSAPP_TOKEN` | token temporário do passo 2 |
   | `WHATSAPP_VERIFY_TOKEN` | uma senha inventada, ex.: `deo-verifica-2026` |
   | `META_APP_SECRET` | chave secreta do app |
   | `REPAIR_PHONE_NUMBER_ID` | ID do número de teste |
   | `DEV_PHONE_NUMBER_ID` | deixe `0` por enquanto |
   | `DONO_WHATSAPP` | seu WhatsApp com 55 e DDD, ex.: `5521999999999` |
   | `ADMIN_TOKEN` | uma senha longa para o painel |
   | `ANTHROPIC_API_KEY` | *(opcional)* sua chave da Anthropic |

3. Rode **Deploys → Trigger deploy → Deploy site** para as variáveis valerem.
4. Anote o endereço do site, por exemplo `https://deo-bots.netlify.app`.

### 4. Ligue o webhook
1. Na Meta, vá em **WhatsApp → Configuração → Webhook → Editar**.
2. **URL de retorno:** `https://SEU-SITE.netlify.app/webhook`
3. **Token de verificação:** o mesmo texto de `WHATSAPP_VERIFY_TOKEN`.
4. Clique em **Verificar e salvar** e, em **Campos do webhook**, assine **`messages`**.

### 5. Teste
1. Do seu celular, mande **`/testar`** para o número de teste. Como você é o dono, isso liga o modo cliente.
2. Mande **oi**: o menu da Deo Repair aparece.
3. Faça um pré-orçamento completo e confirme.
4. Mande **`/dono`**: o aviso do pedido chega para você.
5. Abra `https://SEU-SITE.netlify.app/painel?token=SEU_ADMIN_TOKEN` e confira o pedido.

> Para testar a Deo Dev com o mesmo número de teste, troque temporariamente: coloque o ID de teste em `DEV_PHONE_NUMBER_ID` e `0` em `REPAIR_PHONE_NUMBER_ID`, e faça um novo deploy.

### 6. Coloque os números reais
1. **Token permanente:** em **business.facebook.com → Configurações → Usuários do sistema → Adicionar** (função *Administrador*). Depois, em **Atribuir ativos**, dê ao usuário o app (controle total) e a conta do WhatsApp. Por fim, clique em **Gerar token**, marque `whatsapp_business_messaging` e `whatsapp_business_management` e escolha a validade **Nunca**.
2. **Números:** em **WhatsApp → Configuração da API → Adicionar número de telefone**, cadastre o da Deo Repair, com nome de exibição **Deo Repair**, e confirme por SMS. Repita com a **Deo Dev**.
3. Adicione uma **forma de pagamento** à conta do WhatsApp. Responder quem te chamou é gratuito; só as mensagens que a empresa inicia com modelo são cobradas (confira a tabela atual da Meta).
4. No Netlify, troque o `WHATSAPP_TOKEN` pelo token permanente e coloque os dois IDs reais → **Trigger deploy**.
5. Mande `/ajuda` para cada número de empresa, para abrir a janela de avisos.

> Para sair dos limites iniciais de envio, a Meta pode pedir a **verificação da empresa** no Portfólio empresarial.

### 7. Preencha os ✏️
Edite `src/negocios/deo-repair.mjs` e `src/negocios/deo-dev.mjs` direto no GitHub, pelo ícone de lápis → **Commit changes**. O Netlify publica sozinho em cerca de 1 minuto. Veja a seção **Personalizar** abaixo.

---

## Problemas comuns

| Sintoma | O que verificar |
|---|---|
| **“Verificar e salvar”** dá erro | O deploy terminou? `WHATSAPP_VERIFY_TOKEN` está idêntico na Meta e no Netlify? A URL termina em `/webhook`? |
| O bot não responde | O campo **`messages`** está assinado no webhook? O `*_PHONE_NUMBER_ID` está certo? Veja os logs em Netlify → **Logs → Functions → webhook**. |
| Nos logs aparece **“Assinatura inválida”** | `META_APP_SECRET` errado. Copie de novo de *Configurações do app → Básico*. |
| Nos logs aparece **“número sem negócio configurado”** | O ID que chegou não bate com `REPAIR_PHONE_NUMBER_ID` nem `DEV_PHONE_NUMBER_ID`. O log mostra o ID certo. |
| Erro **401 / token expirado** ao enviar | O token temporário venceu (24h). Gere o permanente (passo 6.1). |
| Erro **131030** (destinatário não permitido) | Com o número de teste, só os números cadastrados em **Para** recebem mensagens. |
| Você **não recebe os avisos** | A regra das 24h: mande qualquer mensagem para o número da empresa. Os pedidos continuam no painel. |
| Mudou uma variável e nada mudou | Variáveis só valem depois de um novo deploy. |
| A IA não responde | Confira `ANTHROPIC_API_KEY` e se há créditos na conta da Anthropic. Sem ela, o bot cai no menu. |

---

## Personalizar (o mais importante!)

Tudo que o cliente lê está em dois arquivos:

- `src/negocios/deo-repair.mjs`
- `src/negocios/deo-dev.mjs`

Procure os **✏️** e preencha: horário, local/forma de entrega, garantia, formas de pagamento, prazos e **o que cada plano da Deo Dev inclui**. Preencha também em `conhecimentoIA` — é dali que a IA tira as respostas. Se algo ficar com ✏️, a IA diz que vai confirmar com você em vez de inventar.

Limites do WhatsApp para não quebrar: menu/listas com até **10** itens (título ≤ 24 caracteres), botões até **3** (título ≤ 20). O teste abaixo confere isso.

## Testar no computador (sem Meta)
```bash
npm run teste        # roda 10 conversas simuladas
node test/simular.mjs -v   # mostra cada mensagem que o bot enviaria
```

## Estrutura
```
netlify/functions/webhook.mjs   ← recebe as mensagens da Meta
netlify/functions/painel.mjs    ← painel de pedidos (/painel)
src/bot.mjs                     ← lógica: menu, pré-orçamento, IA, atendente, comandos do dono
src/negocios/*.mjs              ← textos e perguntas de cada negócio
src/whatsapp.mjs                ← envio de texto, botões, listas; download de mídia
src/ia.mjs                      ← Claude (Anthropic) para dúvidas livres
src/armazenamento.mjs           ← Netlify Blobs (conversas, leads, arquivos)
test/                           ← simulador local
```

## Custos estimados
- **Netlify:** plano grátis cobre com folga um volume pequeno/médio.
- **WhatsApp:** responder quem te chamou é grátis; templates (mensagens que a empresa inicia) são cobrados por mensagem.
- **IA (opcional):** usa o modelo mais barato da Claude; centavos por centenas de perguntas. Sem `ANTHROPIC_API_KEY`, o bot funciona só com menu.

---
## Histórico de versões
- **v2**: README com a implementação passo a passo (começando pelo número de teste), tabela de variáveis e seção de problemas comuns.
- **v1**: primeira versão dos bots (menu, pré-orçamento, IA, atendimento humano com comandos do dono e painel de pedidos).

---
*Bots Deo — v2*
