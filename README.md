# 🤖 Bots Deo Repair & Deo Dev — WhatsApp, Instagram e Messenger · **v11**

Um único projeto no Netlify atende **os dois negócios em três canais**: WhatsApp, Instagram e Messenger. O bot descobre qual negócio e qual canal é pela mensagem que chega e responde com a configuração certa.

```
Instagram / Messenger ──► saudação + botões [Orçamento no WhatsApp] [Ver o site]
        │
        └─► WhatsApp (mensagem pronta "Vim pelo Instagram…") ──► pré-orçamento ──► aviso no seu WhatsApp + painel
```

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
`https://SEU-SITE.netlify.app/painel?token=SEU_ADMIN_TOKEN` — central dos bots com a identidade da Deodato Corp. Escolha **Todas**, **Deo Repair** ou **Deo Dev** no topo e o painel muda logo, cores e dados para aquela empresa (tema claro/escuro incluso). Depois de abrir pelo link, o token sai da barra de endereço e fica só naquela aba.

- **Visão geral:** quem está esperando resposta (e há quanto tempo), conversas da semana comparadas com a anterior, pedidos novos, valor em negociação e fechado no mês, gráfico de 14 dias, retornos combinados, origem dos pedidos, funil do mês e comparativo Repair × Dev.
- **Conversas:** caixa de entrada com busca, filtros (aguardando / com você / com o bot), marcação de não lidas, aviso da janela de 24h, fotos dos clientes na conversa, respostas rápidas com um toque, botões Assumir/Devolver e **ficha do cliente** (pedidos dele + notas internas que só você vê).
- **Pedidos:** quadro com etapas *Novo → Orçamento enviado → Aprovado → Concluído / Perdido* (arraste os cartões), valor de cada orçamento, data para retornar, anotações e **exportar planilha** (CSV que abre no Excel/Google Planilhas).
- **Respostas rápidas:** mensagens prontas por empresa, editáveis no painel. Use `{nome}` e `{empresa}`.
- **Som** opcional quando chega mensagem e contador na aba do navegador.

> A tela do painel fica em `src/painel-ui.html`. Depois de editar, rode `npm run painel` para gerar `src/painel-ui.mjs`.

---

## Instagram e Messenger (v3)

**O que o bot faz:**
- **Direct do Instagram / Messenger:** responde na hora com uma saudação e um cartão com dois botões, nesta ordem:
  1. **Orçamento no WhatsApp:** abre o WhatsApp do negócio com a mensagem pronta *“Oi! Vim pelo Instagram e quero um orçamento 😊”*. O bot do WhatsApp já começa o pré-orçamento e registra a **origem** do lead.
  2. **Ver o site:** abre a landing page.
- **Perguntas livres** no direct são respondidas pela IA (sem negrito, que não funciona nesses apps), e o cartão é reenviado no máximo a cada 30 min.
- **Comentários nos posts** com palavras como *orçamento, quero, preço, valor, quanto, info* recebem uma **DM automática** com os links, e o comentário é respondido em público com *“Te chamei no direct! 📩”*. A lista fica em `palavrasComentario`.
- **Você assume quando quiser:** se responder alguém pela caixa de entrada do Instagram ou do Meta Business Suite, o bot **para de responder aquela pessoa por 12h**. No Instagram e no Messenger não há comandos `/r`: você responde direto pelo app normal.
- No **painel**, cada pedido mostra de onde veio: 💬 WhatsApp, 📸 Instagram ou 📘 Facebook.

**Contas já configuradas** (em `src/negocios/*.mjs` → `redes`):

| | Deo Repair 🔧 | Deo Dev 💻 |
|---|---|---|
| WhatsApp | (21) 99229-1220 | (21) 96698-6094 |
| Site | https://deorepair.netlify.app/ | https://deo-dev.netlify.app/ |
| Instagram | [@deo_repair](https://www.instagram.com/deo_repair/) | [@deodev.corp](https://www.instagram.com/deodev.corp/) |
| Facebook | [página](https://www.facebook.com/profile.php?id=61595494169589) | [página](https://www.facebook.com/profile.php?id=61595093687313) |

> Se as Páginas do Facebook estiverem trocadas, inverta os dois `facebookPageId` nos arquivos dos negócios.

### Como ligar Instagram e Messenger
1. **Instagram profissional e vinculado:** no app do Instagram de cada negócio, vá em *Configurações → Tipo de conta* e mude para **Empresa**. Depois, vincule-o à Página do Facebook correspondente (*Central de Contas* ou *Configurações da Página → Contas vinculadas*).
2. **Permita mensagens de apps:** no Instagram, vá em *Configurações → Mensagens e respostas → Ferramentas conectadas* e ative **Permitir acesso às mensagens**.
3. **No app da Meta:** adicione os casos de uso de **Messenger** e de **mensagens do Instagram**. Em *Configuração da API* de cada um:
   - conecte as duas Páginas (e as contas do Instagram vinculadas a elas);
   - clique em **Gerar token** para cada Página → `REPAIR_PAGE_TOKEN` e `DEV_PAGE_TOKEN`;
   - copie o **ID da conta do Instagram** → `REPAIR_IG_ID` e `DEV_IG_ID`.
4. **Webhook:** use **a mesma URL** do WhatsApp (`https://SEU-SITE.netlify.app/webhook`) e o mesmo token de verificação. Assine:
   - Messenger (Página): `messages`, `messaging_postbacks`, `message_echoes`, `feed`;
   - Instagram: `messages`, `comments`.
   Depois, em cada Página, clique em **Adicionar assinaturas** para essa Página.
5. **No Netlify:** cadastre as novas variáveis do `.env.example` (`META_APP_ID`, `*_PAGE_TOKEN`, `*_IG_ID`). WhatsApp e site já estão no código e faça um deploy.
6. **Teste** mandando “oi” no direct de cada perfil, a partir de uma conta que tenha função no app (a sua). Comente “quero” em um post.

> **Para atender o público:** enquanto o app está em modo de desenvolvimento, só quem tem função no app recebe respostas. Para liberar para todos, coloque o app em **modo Ativo (Live)** e conclua a **verificação da empresa** no Portfólio empresarial. Se a Meta pedir **análise do app** para alguma permissão (o Instagram costuma pedir), grave um vídeo curto mostrando o bot respondendo no direct.


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
| Instagram/Messenger não respondem | As assinaturas do webhook (passo 4 da seção Instagram e Messenger) e “Adicionar assinaturas” na Página. Nos logs, **“conta sem negócio configurado”** mostra o ID que chegou: confira `*_IG_ID` ou o `facebookPageId`. |
| O bot parou de responder alguém no Instagram | Você (ou o bot, se faltar `META_APP_ID`) respondeu pela caixa de entrada: ele pausa por 12h. Coloque `META_APP_ID` no Netlify. |
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
npm run teste        # roda 15 conversas simuladas (WhatsApp, Instagram e Messenger)
node test/simular.mjs -v   # mostra cada mensagem que o bot enviaria
```

## Estrutura
```
netlify/functions/webhook.mjs   ← recebe as mensagens da Meta
netlify/functions/painel.mjs    ← painel (/painel) e suas rotas /painel/api/*
src/painel-ui.html              ← a tela do painel (edite aqui e rode npm run painel)
src/bot.mjs                     ← lógica: menu, pré-orçamento, IA, atendente, comandos do dono
src/negocios/*.mjs              ← textos e perguntas de cada negócio
src/social.mjs                  ← Instagram e Messenger: direct, comentários, botões
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
- **v11**: textos das duas empresas completados com as informações dos sites (serviços, garantia de 90 dias, como funciona, planos atuais da Deo Dev: Presença, Marca, Negócio Pronto e Assinatura); sem mais textos de exemplo (✏️).
- **v10**: corrige perguntas repetidas e mensagens sumindo do histórico (armazenamento com leitura sempre atualizada — `consistency: "strong"`).
- **v9**: números reais por coexistência (YCloud): o webhook reconhece a empresa pelo número real e guarda o ID sozinho; o painel responde pelo número real; `/configurar` assina os ecos do app (`smb_message_echoes`) e lista os números da conta.
- **v8**: painel redesenhado com a identidade da Deodato Corp e tema por empresa (logo, cores, claro/escuro); visão geral com indicadores e gráfico; quadro de pedidos com etapas, valor, retorno e exportação; respostas rápidas editáveis; ficha do cliente com notas internas; busca, filtros, não lidas, aviso da janela de 24h e som.
- **v7**: caixa de entrada no painel (`/painel`): conversas dos dois negócios, histórico, resposta pelo número da empresa, botões Assumir/Devolver ao bot; suporte à coexistência (respostas suas pelo app WhatsApp Business pausam o bot e entram no histórico).
- **v6**: verificação do webhook tolerante a espaços + log; rota `/configurar?token=ADMIN_TOKEN&waba=ID` que cadastra o webhook e inscreve a conta do WhatsApp pela API da Meta.
- **v5**: Graph API atualizada para v25.0 (versão atual da Meta).
- **v4**: WhatsApp, site e Instagram reais da Deo Repair e da Deo Dev inseridos nas configurações (os botões funcionam sem variáveis extras); a IA também conhece esses contatos.
- **v3**: Instagram e Messenger (direct e comentários) levando primeiro ao WhatsApp e depois ao site; pausa automática quando você responde pela caixa de entrada; origem do lead no aviso e no painel; webhook único para os três canais.
- **v2**: README com a implementação passo a passo (começando pelo número de teste), tabela de variáveis e seção de problemas comuns.
- **v1**: primeira versão dos bots (menu, pré-orçamento, IA, atendimento humano com comandos do dono e painel de pedidos).

---
*Bots Deo — v11*
