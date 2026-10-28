# Transição do Cifra para a máquina pessoal

Data do handoff: **28/10/2026**

Branch de trabalho: **`dev`**

Repositório: **`https://github.com/ogtompson/cifra.git`**

## Objetivo deste documento

Permitir que o desenvolvimento continue em outro computador e em um novo chat do Codex sem depender do histórico da conversa atual. Leia também:

- `docs/PLANO-DEPLOY-7-DIAS.md`;
- `docs/AUDITORIA-DIA-1.md`;
- `docs/AUDITORIA-DIA-2.md`.

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
