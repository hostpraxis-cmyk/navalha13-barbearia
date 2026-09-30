# Plano de implementação — Navalha 13 Barbearia

## Objetivo
Entregar um site multipágina, reconhecivelmente barbearia clássica, com animações marcantes e acessíveis, agenda demonstrativa com estados de carregamento, cookies configuráveis, página de contato fictícia e uma conta com Google Sign-In real e histórico persistente de simulações. Não criar pagamentos, cobranças ou reservas reais.

## Arquitetura aprovada
Frontend React + TypeScript + Vite + React Router servido como assets estáticos. API Node.js + Express para `/api/*` na mesma origem. Banco MySQL gerenciado WebDev com tabelas próprias para contas, sessões opacas e histórico demonstrativo; migrações aditivas. O login usa o botão oficial Google Identity Services; o ID token é enviado por HTTPS e validado no servidor por `google-auth-library` (`verifyIdToken`, audiência igual ao Web Client ID). A chave estável do usuário é `sub`, nunca o e-mail. Não implementar login Manus, senha, ou autenticação simulada.

A sessão usa o cookie próprio `n13_google_session`, `HttpOnly`, `Secure` em HTTPS e `SameSite=None` quando necessário para o Preview incorporado. No MySQL guarda-se somente o hash de um token aleatório. A inicialização de login emite CSRF e nonce; o servidor compara o CSRF em double-submit e valida o nonce assinado pelo Google. Toda API com dados pessoais é `private, no-store`; não há CORS permissivo.

O proprietário fornecerá somente o Web Client ID pelo fluxo protegido de segredos, sem chat, Git ou logs. O Client ID será embutido no bundle público do GIS, como previsto pelo fluxo; o proprietário também deve autorizar as origens JavaScript do Preview e do domínio publicado no Google Cloud Console. Este fluxo de ID token não precisa de um OAuth client secret.

Qualquer visitante pode concluir uma simulação local sem entrar. Após login, simulações concluídas são persistidas no histórico da própria conta. O backend registra serviço, barbeiro, data/horário demonstrativos e identificador de usuário; não persiste WhatsApp do formulário, não bloqueia horário, não envia mensagens, não confirma atendimento real e não cobra. Histórico e página Minha Conta identificam todos os registros como simulações. O usuário pode apagar histórico ou conta com confirmação. Não armazena o ID token Google.

Preservar o consentimento first-party existente, sem analytics. Explicar que o Google Identity Services é carregado para autenticação, que a sessão define um cookie necessário e que o histórico só se salva após o login. Contato permanece totalmente fictício: `(11) 0000-0013`, `Rua da Navalha, 13`, `Vila do Corte · São Paulo, SP`, com aviso de que loja e atendimento não existem.

## Decisão de hospedagem aprovada
O usuário autorizou em 30/09/2026 habilitar `features.server: true` e o banco gerenciado (habilitações unidirecionais), migrar do GitHub Pages para hospedagem WebDev e manter o código no GitHub como remoto canônico. A URL pública final será somente a retornada pelo WebDev.

## Publicação e roteamento
Publicação híbrida: build estático Vite em `dist` mais container Node para API. Em ordem: `/_app/*` → server; `/api/*` → server com resposta sem cache compartilhado; `/assets/*` → static com cache longo para assets versionados; `/*` → static com fallback SPA. O container escuta no `PORT` fornecido e tem health path sem autenticação `/_app/health`. Instalação reproduzível e fixada por `packageManager`/lockfile; não embutir segredos privados em imagem ou assets.

## Páginas e experiência
Rotas públicas: `/`, `/servicos`, `/barbeiros`, `/galeria`, `/sobre`, `/contato`, `/agendar`, `/conta` e `/privacidade`. A conta oferece Google Sign-In, dados mínimos, histórico persistente de simulações, logout e controles para apagar dados. No agendamento, visitante sem sessão conclui uma simulação local; usuário conectado salva via API e pode abrir seu histórico. Se API/DB ficar indisponível, a simulação continua local e a tela avisa que não será salva. Em nenhum estado chamar a simulação de reserva real.

## Organização
- `src/App.tsx`: shell, rotas, navegação, metadados e consentimento.
- `src/pages.tsx`, `src/ContactPage.tsx`, `src/AccountPage.tsx`: páginas.
- `src/api.ts`: chamadas same-origin com renovação do desafio CSRF/nonce.
- `src/styles.css`: identidade premium de barbearia e motion acessível.
- `shared/catalog.ts`, `shared/contracts.ts`: catálogo e contratos JSON comuns.
- `server/index.ts`: Express, health, autenticação, sessões e histórico.
- `server/db.ts`, `server/migrations.ts`, `server/migrate.ts`: conexão TLS MySQL e migrações.
- `Dockerfile`, manifestos pnpm e lockfile: build/runtime.
- `public/manus-routes.json`: apenas rotas públicas de páginas, nunca endpoints.

## Privacidade, segurança e limites
Verificar tokens no servidor; nunca confiar em nome/e-mail vindos do navegador. Consultas do histórico sempre usam o `user_id` da sessão autenticada. Cookies seguros, CSRF, nonce Google, validação de payload e respostas privadas sem cache. Sem pagamentos, WhatsApp, e-mail ou calendário de produção. Nomes, valores e horários da loja são demonstrativos.

## Verificação e entrega
Verificar TypeScript/build de frontend e backend, migrações, `git diff --check`, manifesto e páginas, respostas da API e parser real do frontend. Depois de recuperar os controles WebDev: habilitar server/banco, executar migração, declarar build/container/rotas, manter `main` canônico no GitHub, publicar pelo WebDev e validar URL, health, páginas e API. Não afirmar login operacional até o Client ID ser inserido pelo fluxo protegido e as origens serem autorizadas no Google Cloud.
