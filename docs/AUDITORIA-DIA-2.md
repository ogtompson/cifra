# Auditoria do Dia 2 — 28/10/2026

## Resultado

O backend do Cifra agora possui schema versionado, autenticação segura e isolamento dos dados por usuário. Os cinco critérios definidos para o Dia 2 foram implementados e validados em testes unitários e em PostgreSQL real.

## Entregas

- Flyway introduzido com baseline do schema financeiro atual;
- Hibernate alterado de criação automática para validação do schema;
- migrations V1, com a estrutura financeira, e V2, com usuários, sessões e propriedade dos dados;
- cadastro, login, identificação da sessão e logout;
- senhas protegidas com BCrypt;
- sessões revogáveis com token aleatório de 256 bits;
- persistência somente do hash SHA-256 do token;
- duração da sessão configurável por ambiente;
- todas as rotas financeiras protegidas por autenticação;
- contas e categorias associadas ao usuário;
- transações, recorrências, cartões, compras, faturas e orçamentos isolados por meio de seus agregados proprietários;
- consultas individuais de dados alheios retornando 404;
- dashboard e cálculos agregados filtrados pelo usuário autenticado;
- dados anteriores ao sistema de usuários assumidos pelo primeiro cadastro, sem perda de histórico.

## Validações executadas

- `mvn test`: 93 testes aprovados, sem falhas;
- banco vazio: V1 e V2 aplicadas e validadas pelo Hibernate;
- autenticação real: rota protegida sem token retorna 401, cadastro e sessão funcionam, logout revoga imediatamente o token;
- dois usuários reais: listas, gravações e resumo financeiro permanecem independentes;
- tentativa de leitura e de criação usando dados de outro usuário retorna 404;
- banco legado sem histórico do Flyway: V1 reconhecida como baseline e V2 aplicada;
- conta, categoria e transação legadas preservadas e vinculadas ao primeiro usuário;
- resumo legado permaneceu consistente após a migração;
- nenhum token bruto foi persistido no banco.

## Decisões de segurança

- sessões opacas foram preferidas a JWT para permitir revogação imediata no logout;
- o token bruto só existe na resposta entregue ao cliente;
- mensagens de credenciais inválidas não revelam se o e-mail existe;
- acesso cruzado usa resposta 404 para não confirmar a existência de recursos alheios;
- o job de recorrências continua processando todos os proprietários, enquanto as rotas públicas são sempre filtradas pela sessão.

## Commits do Dia 2

- `b8aa5de feat(backend): versionar schema com flyway`;
- `defc1f2 feat(backend): adicionar autenticacao por sessao`;
- `785b846 feat(backend): isolar dados por usuario`.

## Pendências conhecidas

- o frontend ainda não envia a sessão e, por isso, receberá 401 até a integração do Dia 3;
- login, cadastro, proteção de rotas, expiração e logout precisam ser apresentados na interface;
- o nome fixo da home será substituído pelo usuário autenticado;
- falta o onboarding mínimo para a primeira conta e as categorias iniciais;
- exportação e exclusão da conta permanecem opcionais no recorte seguro;
- existe uma alteração local anterior de espaço em branco em `ResumoFinanceiroController.java`, mantida fora dos commits.

## Próxima ação

Iniciar o Dia 3 integrando a sessão ao frontend. A primeira fatia deve criar o cliente de autenticação e o estado global da sessão; depois entram telas de login/cadastro, proteção das rotas e onboarding inicial.
