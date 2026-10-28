# Transição do Cifra para a máquina pessoal

Data do handoff: **28/10/2026**

Branch de trabalho: **`dev`**

Repositório: **`https://github.com/ogtompson/cifra.git`**

## Objetivo deste documento

Permitir que o desenvolvimento continue em outro computador e em um novo chat do Codex sem depender do histórico da conversa atual. Leia também:

- `docs/PLANO-DEPLOY-7-DIAS.md`;
- `docs/AUDITORIA-DIA-1.md`;
- `docs/AUDITORIA-DIA-2.md`.

## Resumo executivo para um novo agente

O **Cifra** é uma aplicação de gestão financeira pessoal construída inicialmente para resolver uma necessidade real do próprio autor: concentrar a vida financeira em uma interface agradável, confiável e progressivamente automatizada. Não deve ser tratado como um CRUD genérico nem como uma simples planilha com gráficos.

O produto precisa responder com rapidez a perguntas práticas:

- quanto dinheiro eu tenho agora;
- quanto entrou, quanto saiu e qual foi o resultado do mês;
- ainda posso gastar neste mês sem comprometer o próximo;
- estou poupando o suficiente;
- quanto da minha renda já está comprometido;
- quais despesas ainda vão vencer;
- onde estou gastando mais e o que saiu do padrão;
- quais orçamentos ou metas estão em risco;
- como cartões, parcelas, recorrências e investimentos afetam os próximos meses.

A primeira versão nasceu manual e deliberadamente simples. A direção de longo prazo é reduzir lançamentos “na unha” por meio de importação, conciliação e, depois do primeiro deploy, Open Finance por um parceiro regulado. O usuário sempre poderá rejeitar automação e manter o fluxo manual.

O primeiro deploy planejado é uma **beta privada**, não uma versão pública definitiva. Segurança, correção financeira, isolamento de dados, backup e capacidade de recuperação têm prioridade sobre quantidade de funcionalidades.

## Visão do produto

### Proposta central

Reunir contas, movimentações, categorias, orçamentos, compromissos recorrentes, cartões e investimentos em uma única leitura financeira coerente. Cada módulo deve alimentar o restante da aplicação; não criar ilhas desconectadas.

### Diferencial pretendido

O diferencial não é apenas registrar despesas. É transformar dados financeiros em orientação útil:

- mostrar o presente, o ritmo do mês e compromissos futuros;
- evitar duplicidades entre compra, fatura e pagamento;
- antecipar falta de caixa;
- destacar desvios e riscos sem exigir interpretação contábil;
- diminuir esforço manual com automação opcional;
- manter uma experiência sofisticada, clara e humana.

### Princípio de escolha do usuário

Automação nunca deve eliminar controle. Quando Open Finance, importação ou conciliação entrarem, o usuário precisa poder:

- optar pelo fluxo automático ou manual;
- revisar itens importados;
- corrigir classificação;
- evitar duplicidades;
- desconectar uma fonte sem perder o histórico confirmado.

## Público e perspectiva de uso

O autor do projeto também é o usuário-alvo inicial. Ele quer e precisa da solução, mas considera impraticável registrar indefinidamente cada movimentação à mão. Isso orienta duas prioridades:

1. o fluxo manual precisa ser rápido, previsível e agradável;
2. a arquitetura precisa permitir automação posterior sem reescrever o domínio financeiro.

Não presumir conhecimento financeiro avançado. Termos e indicadores devem ser explicados pela interface quando não forem evidentes.

## Organização conceitual da aplicação

### Visão geral / Início

É a home cotidiana, não o dashboard analítico completo. Deve oferecer uma leitura rápida e acolhedora:

- saudação com o usuário real;
- mês navegável com setas para passado e futuro;
- saldo e resumo mensal essencial;
- próximos compromissos ou informação mensal relevante;
- atalhos para as ações mais frequentes.

Evitar repetir nela toda a densidade do dashboard.

### Dashboard

É uma tela separada, analítica e interativa. A Fase 1 usa contas, categorias, transações e recorrências. Norte funcional já definido:

- saldo consolidado;
- receitas, despesas e resultado do mês;
- taxa de poupança;
- projeção de fechamento do mês;
- saldo projetado após compromissos pendentes;
- recorrências dos próximos 7 e 30 dias;
- top 5 categorias e participação na renda;
- comparação com a média dos últimos três meses;
- comprometimento fixo da renda;
- receita versus despesa em 6 a 12 meses;
- evolução do saldo consolidado.

Filtros devem ser pertinentes e, idealmente, seleções em gráficos devem filtrar os demais componentes. A tela atual é uma base e inevitavelmente será refinada.

Fases futuras do dashboard:

- cartão: fatura, limite usado, fechamento, vencimento, parcelas e projeção de próximas faturas;
- investimentos: patrimônio, proventos, renda passiva, alocação, número mágico e reserva de emergência.

### Contas

Representam locais onde há dinheiro ou saldo. A tela deve ser mais minimalista do que a home. Requisitos levantados:

- permitir saldo inicial positivo ou negativo;
- tipo de conta;
- posteriormente, agência e identificação bancária opcionais;
- meta associada opcional, caso faça sentido no modelo futuro;
- arquivamento seguro;
- exclusão explicando dependências antes da confirmação;
- cartões podem ser agrupados conceitualmente próximos das contas, sem misturar os domínios.

### Categorias e orçamentos

Categorias classificam receitas e despesas. Requisitos e decisões:

- sugestões prontas com ícones reais, não letras improvisadas;
- sugestões como alimentação, saúde, educação, lazer, assinaturas, compras, freelance, investimentos e presentes;
- orçamento mensal aplicado diretamente à categoria de despesa;
- evitar uma etapa separada e burocrática de “definir limite”;
- receitas e despesas visualmente distinguíveis, mas sem repetir excessivamente rótulos equivalentes;
- não excluir ou mudar o tipo quando isso corromperia vínculos históricos.

### Transações

São movimentações efetivas em contas. O fluxo precisa alertar antecipadamente quando faltam conta ou categoria; não deixar o usuário preencher o formulário inteiro para só então descobrir o bloqueio.

Diretrizes visuais:

- busca e filtros sutis, compactos e arredondados;
- selects não devem usar o visual azul nativo do navegador;
- ícones e setas precisam de respiro dentro dos campos;
- botões e diálogos devem seguir o mesmo tamanho, espaçamento e rodapé;
- reduzir repetição visual de “entrada”, “saída”, “receita” e “despesa”.

### Recorrências

Representam regras futuras, não transações já realizadas. A experiência atual combina:

- resumo de despesas e receitas previstas;
- calendário mensal com o nome do compromisso no dia;
- detalhe flutuante adaptado ao espaço disponível;
- fechamento com `Esc` ou clique externo;
- destaque por contorno no dia atual;
- lista de todas as recorrências;
- switch acessível para ativa/pausada;
- despesas e receitas distinguíveis;
- cartões/faturas também aparecem como compromissos do vencimento.

Futuramente diferenciar melhor:

- recorrência fixa;
- compromisso previsto pontual;
- dívida com terceiros;
- pagamento de fatura.

Pausar uma recorrência não apaga histórico. Excluir a regra também preserva transações já geradas.

### Cartões de crédito

O módulo manual atual inclui:

- cartão ligado a uma conta de pagamento;
- limite total, fechamento e vencimento;
- compras e parcelamentos;
- projeção de faturas;
- pagamento e estorno do pagamento;
- impacto nos compromissos futuros e recorrências visuais.

A compra é despesa econômica na data da compra. O pagamento da fatura é saída de caixa, mas não pode duplicar a despesa no resultado.

### Investimentos

Ainda não implementado. O MVP manual previsto deve permitir:

- cadastro de ativos e classes;
- operações de compra e venda;
- posição, quantidade, custo médio e patrimônio investido;
- alocação por classe;
- identificação da reserva de emergência;
- integração do resumo ao dashboard.

Cotações automáticas, tributação avançada e integrações externas ficam depois do primeiro deploy.

### Metas, alertas e importação

Ainda não implementados. O plano prevê:

- metas financeiras simples e persistentes;
- alertas internos para orçamento, recorrência, fatura ou meta em risco;
- modelo idempotente de importação e conciliação;
- CSV genérico apenas se os itens críticos estiverem estáveis.

## Princípios de UI/UX já estabelecidos

### Direção visual

O Cifra deve parecer sofisticado, classudo, limpo e acolhedor, sem virar uma tela vazia. Minimalismo aqui significa hierarquia e ausência de ruído, não ausência de informação.

Base visual construída:

- verde profundo como cor institucional;
- superfícies creme/off-white;
- dourado usado como acento discreto, nunca como contorno chamativo em grandes áreas;
- tipografia Manrope;
- cartões com bordas leves, raios consistentes e sombras suaves;
- ícones lineares coerentes;
- bastante respiro, mas com densidade suficiente para gestão financeira.

### Consistência obrigatória

- páginas devem compartilhar largura, margens, ritmo vertical e hierarquia tipográfica;
- botões equivalentes devem ter mesmo tamanho, raio e comportamento;
- modais usam estrutura comum, sem rodapés gigantes ou scroll da página por trás;
- campos mantêm espaçamento interno para lupa, ícone e seta;
- navegação mensal segue o padrão `< Outubro de 2026 >` com setas reais;
- estados vazios, loading, erro, hover, foco e animações devem usar componentes/padrões comuns;
- toda ação assíncrona precisa dar feedback;
- animações devem ser sutis e respeitar redução de movimento;
- responsividade não pode apenas empilhar cartões enormes no mobile.

### Barra lateral

Comportamento esperado:

- recolhida por padrão no desktop;
- mostra o símbolo do baú quando recolhida;
- amplia ao hover/foco e revela a marca completa e os rótulos;
- símbolo e marca não podem saltar de tamanho ou posição;
- usuário fica no canto inferior;
- navegação móvel permanece própria para tela pequena.

### Interação

A interface deve parecer viva:

- hover onde houver affordance real;
- categorias e cards informativos reagem ao cursor;
- transições suaves entre seções;
- loading coerente;
- foco visível e operação por teclado;
- switches e selects acessíveis, preferencialmente baseados em React Aria quando necessário.

## Fluxos essenciais

### Primeiro acesso

Fluxo desejado para o Dia 3:

1. cadastro do usuário;
2. validação automática da sessão;
3. onboarding curto;
4. criação da primeira conta;
5. escolha de categorias sugeridas ou criação manual;
6. chegada à visão geral pronta para o primeiro lançamento.

O fluxo anterior era confuso porque transação exigia categoria, depois conta, e cada ausência só aparecia tarde. O onboarding deve resolver essa dependência explicitamente.

### Uso recorrente

1. usuário entra e vê o mês atual;
2. entende saldo, resultado e próximos compromissos;
3. registra ou importa movimentações;
4. acompanha orçamento e cartão;
5. consulta dashboard quando precisar de análise mais profunda.

### Exclusões

Excluir um agregado com dependências nunca deve falhar silenciosamente. A interface deve informar o impacto e oferecer somente escolhas seguras. Quando a exclusão em cascata for permitida, ela precisa de confirmação explícita.

## Regras financeiras que não podem ser quebradas

- saldo de conta = saldo inicial + receitas − saídas de caixa;
- saldo inicial pode ser negativo;
- resultado do período = receitas − despesas econômicas;
- compra no cartão entra em despesa e orçamento pela data e valor total da compra;
- parcelas são compromissos de caixa futuros, não novas despesas econômicas;
- pagamento de fatura reduz a conta, mas não duplica a despesa;
- fatura paga deixa de consumir limite e de aparecer como pendência;
- categoria usada por histórico não pode ser removida ou ter tipo trocado de forma destrutiva;
- conta arquivada não recebe novas transações, recorrências ativas ou compras;
- conta com recorrências ativas ou cartões vinculados precisa ser regularizada antes do arquivamento;
- recorrência é idempotente por regra e data;
- remover recorrência preserva lançamentos históricos;
- orçamento soma transações e compras no cartão da mesma categoria;
- dados e agregados sempre pertencem ao usuário autenticado;
- recursos de outro usuário respondem 404 e não revelam sua existência.

## Requisitos funcionais consolidados

### Implementados ou parcialmente implementados

- cadastro, login, sessão e logout;
- contas com saldo e arquivamento;
- categorias de receita e despesa;
- orçamentos mensais por categoria;
- transações manuais;
- recorrências e geração automática;
- calendário de compromissos;
- cartões, compras, parcelas, faturas e pagamento;
- visão geral mensal;
- dashboard Fase 1 como base visual/funcional;
- navegação mensal;
- estados compartilhados de erro, loading e vazio;
- isolamento dos dados por usuário.

### Ainda necessários para a beta

- conclusão da sessão no frontend e onboarding;
- investimentos manuais MVP;
- metas financeiras simples;
- alertas internos essenciais;
- testes de interface e E2E dos fluxos críticos;
- configuração por ambiente e produção;
- Docker, CI e health check;
- backup, restauração e rollback ensaiados;
- revisão final mobile e acessibilidade.

### Posteriores ao primeiro deploy

- Open Finance real;
- homologação com agregador regulado;
- importadores específicos de vários bancos;
- cotação automática de investimentos;
- tributação avançada;
- notificações por e-mail ou push;
- rotativo, juros e pagamento parcial de cartão;
- automações e análises avançadas.

## Requisitos não funcionais

- segurança por padrão e nenhuma credencial versionada;
- isolamento multiusuário comprovado no backend, não apenas na UI;
- integridade e idempotência financeira;
- migrations reproduzíveis em banco vazio e legado;
- responsividade real em desktop e mobile;
- acessibilidade por teclado, foco visível e semântica apropriada;
- feedback de carregamento, sucesso, erro e indisponibilidade;
- mensagens úteis sem expor dados sensíveis;
- desempenho suficiente para uso pessoal sem carregamentos excessivos;
- logs operacionais sem tokens ou senhas;
- backup restaurável;
- deploy e rollback documentados;
- código modular, testes proporcionais ao risco e commits pequenos.

## Stack e arquitetura atuais

### Frontend

- Next.js 16 com App Router;
- React 19;
- JavaScript;
- Tailwind CSS 4;
- React Aria Components para controles acessíveis quando aplicável;
- Manrope Variable;
- cliente HTTP central em `frontend/src/lib/api.js`;
- componentes por domínio em `frontend/src/components`;
- rotas em `frontend/src/app`.

### Backend

- Java 21;
- Spring Boot 4.1;
- Spring Web;
- Spring Data JPA / Hibernate;
- Spring Validation;
- Spring Security;
- PostgreSQL;
- Flyway;
- Lombok;
- JUnit, AssertJ e Mockito.

### Persistência

Agregados raiz com proprietário direto:

- `Usuario`;
- `Conta` → `usuario_id`;
- `Categoria` → `usuario_id`.

Propriedade derivada:

- transação e recorrência pertencem ao usuário da conta;
- cartão pertence ao usuário da conta de pagamento;
- compra e pagamento pertencem ao usuário do cartão;
- orçamento pertence ao usuário da categoria.

Isso evita repetir `usuario_id` em todas as tabelas, mas exige que cada consulta atravesse corretamente o agregado proprietário.

### Autenticação

- token opaco aleatório de 256 bits;
- token bruto entregue ao navegador;
- somente SHA-256 armazenado no banco;
- senha com BCrypt;
- sessão padrão de sete dias, configurável por `AUTH_SESSION_DURATION`;
- logout remove a sessão no servidor;
- frontend mantém a sessão atual em `localStorage` e revalida em `/auth/me`.

### Migrations

- V1: baseline financeiro;
- V2: usuários, sessões e propriedade de contas/categorias;
- `ddl-auto=validate` impede alteração implícita do schema;
- `baseline-on-migrate` permite introduzir Flyway no banco legado.

## Mapa resumido de rotas

### Frontend

- `/` — visão geral;
- `/dashboard` — relatório financeiro;
- `/contas`;
- `/cartoes`;
- `/transacoes`;
- `/categorias`;
- `/recorrencias`;
- `/entrar`;
- `/cadastro`.

### API

- `/api/auth` — cadastro, login, usuário atual e logout;
- `/api/contas` — CRUD, saldo, arquivamento e impacto de exclusão;
- `/api/categorias` — CRUD;
- `/api/orcamentos` — orçamento mensal por categoria;
- `/api/transacoes` — CRUD;
- `/api/recorrencias` — CRUD;
- `/api/cartoes` — cartões, compras, projeção e pagamento de faturas;
- `/api/resumo-financeiro` — consolidação por período.

## Referências visuais e evolução do design

As inspirações enviadas ao longo do projeto misturam dashboards financeiros claros, painéis escuros sofisticados e layouts móveis bancários. Elas são referências de composição e qualidade, não templates para copiar integralmente.

Ao receber um componente ou prompt externo:

- não copiar cegamente;
- adaptar cores, dimensões, texto, densidade e interação ao Cifra;
- reutilizar padrões já existentes;
- evitar introduzir uma linguagem visual isolada em uma única seção;
- avaliar primeiro a necessidade funcional e depois a aparência.

O usuário rejeitou anteriormente componentes desproporcionais, contornos dourados fortes, cards enormes, filtros quadrados, selects nativos azuis e telas minimalistas a ponto de parecerem vazias. Essas rejeições devem orientar novas decisões.

## Forma de trabalhar esperada

- antes de implementar, validar o pedido contra o produto e investigar impactos;
- não interpretar feedback apenas como ordem mecânica de CSS;
- explicar a lógica e o impacto das mudanças durante o trabalho;
- preservar mudanças locais do usuário;
- usar commits pequenos, temáticos e com mensagens claras;
- separar implementação, correção e documentação quando fizer sentido;
- rodar testes proporcionais ao risco;
- não fazer push automaticamente quando o usuário não pediu ou quando não for necessário para a transição;
- não adicionar uma nova feature antes de estabilizar a anterior;
- manter o documento de auditoria de cada etapa atualizado;
- questionar decisões que criem inconsistência financeira ou de UX, apresentando evidências e alternativas.

## Definição de pronto para o primeiro deploy

O projeto não está pronto apenas porque as telas funcionam localmente. Os portões mínimos são:

- backend testado;
- lint e build do frontend aprovados;
- fluxos críticos testados de ponta a ponta;
- banco vazio e legado migrando corretamente;
- autenticação e isolamento comprovados;
- nenhuma credencial no repositório;
- configurações inseguras de desenvolvimento removidas da produção;
- health check e logs adequados;
- backup restaurado em ensaio;
- rollback documentado e testado;
- desktop e mobile utilizáveis;
- acessibilidade mínima revisada;
- árvore Git limpa ou com alterações explicitamente conhecidas.

## Situação atual

O Dia 1 e o Dia 2 estão concluídos. O Dia 3 foi iniciado com um esqueleto funcional de autenticação no frontend.

### Dia 1 — concluído

- auditoria dos fluxos financeiros existentes;
- correções de integridade em contas, categorias, orçamentos e recorrências;
- 84 testes aprovados ao final daquela etapa;
- lint e build do frontend aprovados.

### Dia 2 — concluído

- schema versionado com Flyway;
- migration V1 com o baseline financeiro;
- migration V2 com usuários, sessões e propriedade dos dados;
- cadastro, login, `/auth/me` e logout no backend;
- BCrypt para senhas;
- sessões opacas e revogáveis;
- somente o hash SHA-256 do token é persistido;
- todas as rotas financeiras exigem autenticação;
- contas, categorias, transações, recorrências, cartões, compras, faturas, orçamentos e resumos isolados por usuário;
- acesso cruzado retorna 404;
- banco vazio, banco legado e dois usuários reais foram testados em PostgreSQL;
- 93 testes do backend aprovados.

### Dia 3 — esqueleto iniciado

Implementado no commit `7411f4a`:

- `AuthProvider` global;
- armazenamento e restauração da sessão no navegador;
- validação da sessão em `/api/auth/me` ao recarregar;
- inclusão automática de `Authorization: Bearer ...` no cliente HTTP;
- limpeza da sessão em expiração ou resposta 401;
- página `/entrar`;
- página `/cadastro`;
- proteção das páginas financeiras;
- redirecionamento de visitante não autenticado para `/entrar`;
- logout pela área do usuário na barra lateral e no cabeçalho móvel;
- usuário real exibido na barra lateral;
- estado visual enquanto a sessão é validada.

Validações já executadas nesse esqueleto:

- `npm run lint`: aprovado;
- `npm run build`: aprovado;
- rotas `/entrar` e `/cadastro` incluídas no build estático.

## Roadmap de fechamento e estado das etapas

As datas originais do plano servem como sequência lógica. Como o trabalho continuou depois da janela inicialmente escrita, orientar-se pelo número do dia e pelos critérios de aceite, não pela data nominal.

### Dia 1 — estabilização e congelamento: concluído

- regras financeiras auditadas;
- integridade crítica corrigida;
- escopo e riscos registrados;
- testes, lint e build aprovados.

### Dia 2 — dados, migrations e autenticação: concluído

- Flyway e baseline;
- autenticação segura;
- propriedade e isolamento;
- testes em banco vazio, legado e dois usuários.

### Dia 3 — sessão e onboarding: em andamento

- infraestrutura e telas de autenticação iniciadas;
- ainda faltam teste visual completo, nome real na home, mensagens de expiração, retorno à rota pretendida e onboarding;
- exportação e exclusão da conta entram apenas se couberem sem comprometer segurança.

### Dia 4 — investimentos MVP: não iniciado

- modelar ativo, classe e operação;
- calcular posição, quantidade, custo médio e patrimônio;
- mostrar alocação e reserva de emergência;
- integrar um resumo ao dashboard;
- manter cotações externas fora do recorte inicial.

Antes de codificar, revisar se operações devem ser eventos imutáveis e como vendas afetam custo médio. Escrever testes dos cálculos antes ou junto da implementação.

### Dia 5 — metas, alertas e importação: não iniciado

- persistir metas simples;
- detectar orçamento, fatura, recorrência e meta em risco;
- definir lote de importação e chave de idempotência;
- criar conciliação que permita confirmar, ignorar ou vincular um item;
- CSV genérico somente se os itens anteriores estiverem estáveis.

### Dia 6 — produção e qualidade: não iniciado

- ampliar testes de autorização e cálculos;
- testes essenciais de interface e fluxo completo;
- Docker para frontend/backend e ambiente local reproduzível;
- CI com testes, lint e build;
- health check;
- variáveis e perfis de ambiente;
- logs seguros;
- documentação de backup e restauração.

### Dia 7 — ensaio de deploy: não iniciado

- regressão desktop e mobile;
- acessibilidade e mensagens de erro;
- subida limpa somente com migrations;
- ensaio real de backup/restauração;
- ensaio de rollback;
- congelamento, tag e runbook de deploy.

### Depois da beta

- escolher e contratar parceiro de Open Finance regulado;
- consentimento, sincronização, renovação e revogação;
- deduplicação e conciliação de transações bancárias;
- automação de cartões quando a fonte permitir;
- cotações e eventos de investimentos;
- notificações externas;
- inteligência financeira e projeções mais avançadas.

## O que falta no Dia 3

Ordem recomendada:

1. testar visualmente cadastro, login, recarga, expiração e logout em desktop e mobile;
2. substituir `Olá, Paulo!` em `frontend/src/components/visao-geral.js` pelo nome autenticado;
3. preservar a rota pretendida no redirecionamento para login;
4. apresentar uma mensagem clara quando a sessão expirar;
5. sincronizar logout entre abas, se mantivermos sessão em `localStorage`;
6. construir onboarding mínimo após o primeiro cadastro;
7. no onboarding, criar a primeira conta e oferecer categorias iniciais sugeridas;
8. decidir se exportação e exclusão da conta entram no recorte desta semana;
9. adicionar testes essenciais do fluxo de autenticação no frontend;
10. repetir lint, build e regressão dos fluxos financeiros.

O onboarding não deve bloquear usuários que já possuem conta e categorias. A condição inicial pode ser determinada consultando `/api/contas` e `/api/categorias` depois do cadastro ou da restauração da sessão.

## Decisões já tomadas

- O backend usa sessão opaca, não JWT.
- O token bruto é entregue apenas ao cliente; o banco guarda seu hash.
- Logout revoga a sessão imediatamente no backend.
- IDs pertencentes a outro usuário devem responder como inexistentes.
- O primeiro usuário cadastrado assume dados legados que ainda estejam sem proprietário.
- O job de recorrências processa todos os usuários; rotas públicas sempre usam o proprietário da sessão.
- A integração atual do frontend mantém a sessão em `localStorage`. Rever isso exige alterar conscientemente a estratégia; não trocar casualmente no meio do Dia 3.
- O frontend ainda é JavaScript, não TypeScript.

## Arquivos centrais para continuar

### Backend

- `backend/src/main/java/com/cifra/backend/config/SecurityConfig.java`;
- `backend/src/main/java/com/cifra/backend/controller/AutenticacaoController.java`;
- `backend/src/main/java/com/cifra/backend/service/AutenticacaoService.java`;
- `backend/src/main/java/com/cifra/backend/security/AutenticacaoTokenFilter.java`;
- `backend/src/main/resources/db/migration/V1__baseline_financeiro.sql`;
- `backend/src/main/resources/db/migration/V2__usuarios_e_sessoes.sql`.

### Frontend

- `frontend/src/lib/api.js`;
- `frontend/src/components/auth/auth-provider.js`;
- `frontend/src/components/auth/auth-view.js`;
- `frontend/src/components/app-shell.js`;
- `frontend/src/app/entrar/page.js`;
- `frontend/src/app/cadastro/page.js`;
- `frontend/src/components/visao-geral.js`.

## Preparação da máquina pessoal

### 1. Obter o projeto

```powershell
git clone https://github.com/ogtompson/cifra.git
cd cifra
git checkout dev
git pull origin dev
```

### 2. Pré-requisitos

- Java 21 ou superior;
- Maven;
- Node.js compatível com Next.js 16;
- PostgreSQL disponível em `localhost:5432`;
- banco local chamado `cifra`.

Exemplo para criar o banco, se necessário:

```powershell
createdb -h localhost -U postgres cifra
```

### 3. Iniciar o backend

Configure a senha apenas no ambiente local, sem colocá-la no Git:

```powershell
$env:DB_PASSWORD="SUA_SENHA_LOCAL"
cd backend
mvn spring-boot:run
```

O Flyway criará ou atualizará o schema. O backend deve ficar disponível em `http://localhost:8080`.

### 4. Iniciar o frontend

Em outro terminal:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Abra `http://localhost:3000/cadastro` para criar o primeiro usuário. Em banco novo, não haverá dados iniciais. Em banco antigo ainda sem proprietário, o primeiro cadastro assumirá os dados legados.

### 5. Comandos de validação

```powershell
cd backend
mvn test

cd ..\frontend
npm run lint
npm run build
```

## Estado conhecido da árvore de trabalho

Há uma alteração local anterior, de apenas espaço em branco, em:

`backend/src/main/java/com/cifra/backend/controller/ResumoFinanceiroController.java`

Ela foi preservada fora de todos os commits. Ao trocar de máquina, ela não estará presente, a menos que seja transportada separadamente — e não é necessária para o funcionamento.

## Commits mais recentes relevantes

- `7411f4a feat(frontend): iniciar sessao e acesso do usuario`;
- `08275b5 docs: registrar auditoria do dia 2`;
- `785b846 feat(backend): isolar dados por usuario`;
- `defc1f2 feat(backend): adicionar autenticacao por sessao`;
- `b8aa5de feat(backend): versionar schema com flyway`;
- `bc8684c docs: registrar plano e auditoria de deploy`.

## Mensagem sugerida para o novo chat do Codex

> Estamos continuando o Cifra na branch `dev`. Leia integralmente `docs/PLANO-DEPLOY-7-DIAS.md`, `docs/AUDITORIA-DIA-1.md`, `docs/AUDITORIA-DIA-2.md` e `docs/TRANSICAO-MAQUINA-PESSOAL.md` antes de alterar arquivos. O Dia 2 está concluído e o commit `7411f4a` iniciou o esqueleto do Dia 3. Continue pelo teste visual e funcional da autenticação, corrija eventuais falhas e implemente o onboarding mínimo. Preserve o padrão visual existente, faça commits pequenos e não misture mudanças sem relação.

## Primeiro critério de aceite ao retomar

O fluxo abaixo deve funcionar sem intervenção manual no armazenamento do navegador:

1. visitante abre uma rota financeira e é enviado para `/entrar`;
2. novo usuário acessa `/cadastro` e cria a conta;
3. usuário autenticado entra na aplicação;
4. recarregar a página preserva a sessão válida;
5. o nome real aparece na home e na barra lateral;
6. logout revoga a sessão e retorna ao login;
7. token expirado ou inválido também retorna ao login com mensagem adequada;
8. primeiro acesso sem conta/categoria conduz ao onboarding.
