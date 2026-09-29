# Plano de implementação — Navalha 13 Barbearia

## Objetivo
Entregar uma landing page pública, responsiva e interativa para a Navalha 13 Barbearia, agora com sinais visuais clássicos inequívocos de barbearia (poste barber pole, letreiro listrado, linguagem direta de corte/barba/navalha, cadeira/couro/ferramentas) além do acabamento premium. O movimento deve ser visível como em um site comercial pronto: hero sequencial, reveals ao rolar, ticker contínuo, poste de listras animadas, microinterações de botão/card/imagem e progressão de agenda, sempre respeitando `prefers-reduced-motion`. O usuário deve conseguir simular uma reserva escolhendo serviço, barbeiro, data, horário e dados de contato, sem pagamentos reais, sem cobrança e sem backend financeiro.

## Arquitetura escolhida
- **Frontend:** React + TypeScript + Vite.
- **Entrega:** site estático/SPA com `index.html` pré-carregado contendo conteúdo semântico e interações no cliente.
- **Estado:** estado local React para stepper de agendamento, seleção de horário e confirmação; dados demonstrativos em módulos locais.
- **Persistência:** nenhuma; o fluxo é explicitamente simulado e reinicia ao recarregar.
- **Rotas:** uma rota pública `/` e o manifesto obrigatório `/manus-routes.json`.
- **Serviço de desenvolvimento:** Vite na porta 3000, host `0.0.0.0`.
- **Publicação:** build Vite em `dist`, com assets versionados pelo bundler. Como não há API nem servidor, a publicação será estática.

## Organização prevista
- `index.html`: metadata, fonte, conteúdo base e mount.
- `src/main.tsx`: bootstrap React.
- `src/App.tsx`: composição da página e estado de booking.
- `src/data.ts`: serviços, profissionais, horários e depoimentos fictícios.
- `src/styles.css`: tokens, layout, responsividade, animação e acessibilidade.
- `public/images/`: assets gerados para placements concretos.
- `public/manus-routes.json`: manifesto completo de rotas.
- `public/robots.txt`: documento básico de descoberta para a página pública. Um sitemap com URLs absolutas será adicionado somente após uma URL pública de produção ser definida, evitando publicar um endereço adivinhado.
- `public/brand-mark.png`: logo/favicon opaco quadrado.
- `app.config.ts`: URL HTTPS do logo para sincronização da identidade do projeto.

## Experiência do produto
1. Hero com CTA “Reservar meu horário”, status da casa e selo “desde 2013”.
2. Serviços com preço, duração e descrição curta: Corte Navalha, Barba Ritual e Combo 13.
3. Manifesto editorial que comunica a experiência e mostra o ambiente.
4. Galeria responsiva de fotos de barba, ferramentas, interior e acabamento.
5. Depoimentos e sinal social.
6. Booking dock com quatro etapas visíveis; dados demonstrativos e horários ocupados bloqueados.
7. Formulário final com validação de nome/WhatsApp, resumo e protocolo gerado no cliente.
8. Confirmação de sucesso com opção “Agendar outro horário”.

## Deployment e performance
O conteúdo é público, estável e não precisa de SSR; a escolha estática reduz complexidade e mantém o primeiro carregamento rápido. O build será `pnpm build` com `outputDirectory: dist`. A SPA terá apenas `/*` como fallback estático. Não haverá `features.server`, database ou rotas de API. Assets de imagem serão locais em `public/images` e otimizados em dimensões adequadas ao uso.

## SEO e acessibilidade
- Conteúdo semântico de apresentação presente no HTML inicial.
- `title`, `description`, Open Graph, Twitter Card e `theme-color`.
- `robots.txt`, `sitemap.xml` e manifesto de rotas.
- Navegação por teclado, focus-visible, labels explícitos e suporte a `prefers-reduced-motion`.
- Contraste alto e linguagem clara sobre a natureza simulada do agendamento.

## Verificação
- Inspecionar diagnósticos host-managed do projeto.
- Rodar `pnpm build`.
- Iniciar Vite em `0.0.0.0:3000` e verificar `GET /` e `GET /manus-routes.json` com HTTP 200.
- Verificar o preview visual e interações principais quando necessário para corrigir defeitos observáveis.
- Conferir a existência do logo e do metadata `app.config.ts` antes do primeiro checkpoint.

## Limites deliberados
- Nenhuma transação, pagamento, integração financeira, envio real de WhatsApp ou persistência de reserva.
- Profissionais, horários, avaliações, preços e protocolo são demonstrativos.
