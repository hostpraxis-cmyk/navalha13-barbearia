# Plano de implementação — Navalha 13 Barbearia

## Objetivo
Entregar um site multipágina, reconhecivelmente barbearia clássica, com animações marcantes e acessíveis, consentimento de cookies, contato totalmente fictício, login do próprio site e histórico persistente de **simulações**. Não criar pagamentos, cobranças ou reservas reais.

## Arquitetura aprovada
Aplicação em um container Node.js + Express WebDev, servindo os assets React + TypeScript + Vite produzidos no build e a API `/api/*` na mesma origem. O SPA suporta deep links. MySQL gerenciado WebDev guarda contas, sessões opacas e histórico demonstrativo; migrações versionadas, idempotentes e seguras contra inicializações concorrentes.

A conta oferece cadastro/entrada por e-mail e senha, conforme o pedido mais recente, e mantém Google Sign-In como alternativa opcional solicitada anteriormente. Não há login Manus dentro da conta do site. Senhas nunca são persistidas em texto puro: armazenar hash scrypt com salt aleatório e parâmetros fixos, comparar em tempo constante, limitar tentativas por IP, não logar credenciais e aceitar payloads estritamente limitados. Sessões usam token aleatório; MySQL guarda apenas seu hash. Cookie HttpOnly, Secure em HTTPS, SameSite apropriado e CSRF obrigatório em mutações. O cadastro inicial pode usar apenas e-mail e senha; sem serviço de e-mail não há confirmação de endereço nem recuperação automática de senha, então essa limitação será explícita na interface.

Google, se configurado, continua via Google Identity Services: Client ID público injetado somente pelo fluxo protegido; ID token enviado por HTTPS e validado no servidor com audiência e nonce. A identidade Google usa `sub`; contas e-mail/senha têm `google_sub` nulo. E-mail normalizado é único. O usuário também deve autorizar as origens JavaScript do Preview e do domínio publicado no Google Cloud Console.

## Login obrigatório para agendamento
A página `/agendar` exige conta autenticada antes de mostrar o formulário de simulação. Visitantes recebem uma entrada clara para entrar ou criar conta; a intenção de retorno, inclusive o serviço pré-selecionado, é preservada em rota interna segura. Se a conta/API/banco não estiver disponível, não simular sucesso: mostrar erro compreensível e não gravar dados parcialmente.

Depois do login, o visitante pode selecionar serviço, barbeiro, dia e horário demonstrativos, ver os estados de carregamento e salvar a escolha como simulação no próprio histórico. Sem dados de nome/WhatsApp e sem qualquer pagamento, contato, mensagem, bloqueio de horário, calendário de produção ou confirmação de atendimento. A interface diz que os registros são simulações, não reservas reais.

## Privacidade e dados
Histórico sempre consulta o `user_id` da sessão, com limite de 100 registros. O usuário pode apagar o histórico ou a conta com confirmação; apagar conta também remove sessões e histórico via foreign keys. Nunca confiar em identidade enviada pelo navegador. Rotas de dados usam `private, no-store`; não há CORS permissivo nem analytics. Consentimento de cookies continua first-party e configurável. Contato demonstrativo: telefone `(11) 0000-0013`, endereço `Rua da Navalha, 13`, `Vila do Corte · São Paulo, SP`; deixar claro que loja e atendimento não existem.

## Decisão de hospedagem
O usuário autorizou em 30/09/2026 habilitar `features.server: true` e banco gerenciado (habilitações unidirecionais), migrar do GitHub Pages para hospedagem WebDev e manter o código no GitHub como remoto canônico. A URL pública final será somente a retornada pelo WebDev. Até a recuperação do Addon, não afirmar que recursos ou publicação foram provisionados.

## Publicação e roteamento
O Dockerfile constrói o frontend (`dist`) e a API (`dist-server`) e copia ambos para a imagem runtime. Express serve assets por mesma origem, com cache longo somente para nomes versionados em `/assets/*`, HTML sem cache compartilhado, fallback SPA para caminhos sem arquivo e exclusão de `/api/*` e `/_app/*` do fallback. A publicação usa rota WebDev para o container; sem build estático separado ou dependência do GitHub Pages. A API não compartilha cache de respostas privadas. O container escuta no `PORT` fornecido, executa a migração versionada sob lock antes de iniciar e tem health path sem autenticação `/_app/health`, que verifica conectividade e schema aplicado. Build reproduzível com versão pnpm fixada/lockfile; sem segredos privados na imagem ou nos assets.

## Páginas e experiência
Rotas: `/`, `/servicos`, `/barbeiros`, `/galeria`, `/sobre`, `/contato`, `/agendar`, `/conta` e `/privacidade`. Conta oferece cadastro, login, logout, histórico, exclusão do histórico e exclusão da conta. Google permanece opcional; e-mail/senha é o fluxo principal.

## Organização
- `src/App.tsx`: shell, rotas, navegação, metadados e consentimento.
- `src/pages.tsx`, `src/ContactPage.tsx`, `src/AccountPage.tsx`: páginas e formulários.
- `src/api.ts`: chamadas same-origin e renovação CSRF.
- `src/styles.css`: identidade de barbearia, responsividade e motion acessível.
- `shared/catalog.ts`, `shared/contracts.ts`: catálogo e contratos JSON comuns.
- `server/index.ts`: Express, health, cadastro/login Google/email, sessões e histórico.
- `server/db.ts`, `server/migrations.ts`, `server/migrate.ts`: conexão TLS MySQL e migrações.
- `Dockerfile`, manifestos pnpm e lockfile: build do frontend e servidor, migração na inicialização e runtime.
- `public/manus-routes.json`: apenas rotas públicas de páginas, nunca endpoints.

## Verificação e entrega
Executar typecheck/build, revisar `git diff --check`, manifesto, links de retorno, endpoints de cadastro/login, hash e rejeição de senha incorreta, isolamento por usuário, agendamento autenticado, loading, logout e exclusões. Sem DB configurado, validar que o site não finge login/agendamento: erro explícito e sem gravação. Depois de recuperar os controles WebDev, habilitar server/banco, executar migração, declarar build/container/rotas, manter `main` canônico no GitHub, publicar pelo WebDev e validar URL, health, páginas, cookies e API. Não afirmar login operacional antes de DB, Client ID Google opcional e teste na origem publicada.
