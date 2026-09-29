# Plano de implementação — Navalha 13 Barbearia

## Objetivo
Transformar a landing em um site de barbearia com páginas distintas e URLs próprias — Início, Serviços, Barbeiros, Galeria, Sobre, Agendar e Privacidade — sem esconder tudo em uma única página. Incluir um aviso de cookies que permita aceitar, rejeitar e personalizar cookies opcionais, salvando a escolha no navegador. Preservar a reserva como simulação, sem cobrança, pagamento ou agendamento real.

## Arquitetura escolhida
- **Frontend:** React + TypeScript + Vite e React Router para navegação por páginas, URL direta, botões voltar/avançar e histórico do navegador.
- **Entrega:** arquivos estáticos do Vite com fallback SPA configurado para as páginas; conteúdo renderizado no navegador.
- **Rotas públicas:** `/`, `/servicos`, `/barbeiros`, `/galeria`, `/sobre`, `/agendar` e `/privacidade`; manter `public/manus-routes.json` em sincronia.
- **Metadados:** título e descrição de página atualizados por rota no cliente; metadata geral inicial em `index.html`. Não inventar canonical ou sitemap com URL de produção não confirmada.
- **Consentimento:** gravar `n13_cookie_consent` como cookie first-party com escolhas para necessário (sempre ativo) e analytics opcional. Nenhum script/serviço de rastreamento é instalado nesta demonstração; a preferência opcional é registrada sem ativar terceiros.
- **Estado:** serviço pode ser pré-selecionado via query string `/agendar?servico=...`; os dados e horários são fictícios e o formulário gera um protocolo somente no cliente.
- **Desenvolvimento:** Vite na porta 3000. **Publicação:** build Manus estático em `dist`; `pnpm build:github-pages` prepara o projeto sob `/navalha13-barbearia/` e grava `404.html` para entradas diretas no GitHub Pages.

## Organização
- `index.html`: metadata inicial e mount React.
- `src/main.tsx`: bootstrap React e fontes servidas localmente no bundle.
- `src/App.tsx`: shell global, header/menu, rodapé, efeitos de rota e consentimento de cookies.
- `src/pages.tsx`: páginas Início, Serviços, Barbeiros, Galeria, Sobre, Agendar e Privacidade.
- `src/data.ts`: serviços, profissionais, URLs-base, horários e depoimentos demonstrativos.
- `public/images/`: fotografias locais para não depender de endereços do preview ou armazenamento externo.
- `src/styles.css`: identidade premium de barbearia, responsividade, estados de rota, banner de cookies e animações com redução de movimento.
- `public/manus-routes.json`: inventário completo das páginas.
- `public/robots.txt`, `public/favicon.svg`, `app.config.ts`: documentos públicos e identidade existente.

## Experiência do produto
1. Cada página tem conteúdo focado e navegação que leva a rotas diferentes, com menu móvel.
2. Início apresenta a Navalha 13, destaques e caminhos para as outras páginas, em vez de reunir todas as seções em um longo scroll.
3. Serviços lista corte, barba e combo com preço/duração e botões que abrem a agenda já com serviço selecionado.
4. Barbeiros mostra profissionais e especialidades; Galeria mostra os visuais; Sobre apresenta a casa e informações demonstrativas.
5. Agendar conserva as quatro etapas, bloqueia horários ocupados, valida nome e WhatsApp, mostra resumo e gera protocolo demonstrativo. Nenhum pagamento, mensagem ou reserva real acontece.
6. Aviso de cookies aparece antes de uma escolha salva; visitante aceita opcionais, rejeita opcionais ou personaliza. Uma página de privacidade explica a escolha e a ausência de rastreadores.

## Deployment e performance
O conteúdo permanece uma aplicação pública estática, sem API, banco, login ou recurso de servidor. `pnpm build` gera `dist`; no Manus, `/assets/*` atende recursos versionados e `/*` usa o fallback estático já declarado. O build GitHub Pages usa base de projeto, fontes e imagens locais e uma cópia `404.html` do shell React para entrada em subrotas; a publicação continua dependendo de autorização de Pages.

## SEO e acessibilidade
- Metadata geral e conteúdo de fallback semântico permanecem em `index.html`; atualizar título/descrição ao navegar no cliente.
- Manifesto declara todas as páginas; robots e outras URLs absolutas permanecem conservadores, sem inventar domínio canônico.
- Links com rotas reais, menu móvel acessível, `aria-current`, foco de teclado, labels e `prefers-reduced-motion`.
- Banner e painel de cookies com diálogo/controles rotulados, e texto direto de que opcionais não acionam terceiros.
- Seguir a preferência por movimento reduzido e explicitar que preços, equipe, horários e reserva são demonstrações.

## Verificação
- Usar os diagnósticos TypeScript já registrados e `pnpm build`.
- Consultar por HTTP `/`, cada rota profunda e `/manus-routes.json`; validar que o manifesto JSON enumera exatamente as rotas existentes.
- Conferir no código consentimento, gravação/leitura do cookie, opções do usuário, links de navegação e preseleção do serviço no agendamento.
- Inspecionar diff e push normal do branch `main` para o GitHub canônico.

## Limites
- Sem pagamentos, backend de agenda, persistência de reserva, analytics de terceiros, disparo real de WhatsApp ou envio de dados pessoais.
- Valores, barbeiros, localização/horários e slots permanecem demonstrativos.
