# Cifra — plano de fechamento para deploy

Janela de trabalho: **15 a 21 de outubro de 2026**. Deploy planejado a partir de **22 de outubro de 2026**.

## Objetivo da semana

Entregar uma versão beta privada, segura e operável do Cifra. A prioridade é confiabilidade financeira, isolamento dos dados e capacidade de recuperar o serviço. Recursos que dependem de parceiros externos não devem bloquear o primeiro deploy.

## Escopo fechado

### Entra nesta semana

- estabilização de contas, categorias, orçamentos, transações, recorrências, cartões e dashboard;
- migrations versionadas e configuração separada por ambiente;
- autenticação e isolamento dos dados por usuário;
- onboarding mínimo e identificação real do usuário na interface;
- MVP manual de investimentos, com posição e alocação;
- metas financeiras persistentes e alertas internos essenciais;
- fundação de importação e conciliação, com adaptador CSV se houver margem;
- testes críticos, Docker, CI, health check, backup e roteiro de deploy.

### Fica depois do primeiro deploy

- conexão Open Finance em produção;
- contratação e homologação de agregador regulado;
- cotação automática e tributação avançada de investimentos;
- notificações por e-mail ou push;
- pagamento parcial, juros e rotativo de cartão;
- importadores específicos de vários bancos;
- refinamentos visuais que não afetem uso, acessibilidade ou responsividade.

## Sequência diária

### Dia 1 — 15/10: estabilização e congelamento

- auditar os fluxos existentes e suas regras financeiras;
- corrigir falhas críticas de integridade e mensagens de bloqueio;
- validar testes do back-end, lint e build do front-end;
- registrar escopo, riscos e critérios de aceite.

### Dia 2 — 16/10: dados, migrations e autenticação

- introduzir Flyway sem perder a estrutura atual;
- criar usuário e autenticação segura;
- associar entidades financeiras ao proprietário;
- garantir isolamento em consultas, alterações e exclusões;
- testar acesso cruzado e migração de banco vazio.

### Dia 3 — 17/10: sessão e onboarding

- integrar login, cadastro e encerramento de sessão no front-end;
- substituir dados fixos pelo usuário autenticado;
- proteger rotas e expiração de sessão;
- criar onboarding mínimo para conta e categorias iniciais;
- oferecer exportação e exclusão da conta, se couber no recorte seguro.

### Dia 4 — 18/10: investimentos MVP

- cadastrar ativos e operações manuais;
- calcular posição, custo médio e patrimônio investido;
- exibir alocação por classe e reserva de emergência;
- integrar o resumo de investimentos ao dashboard sem cotações externas.

### Dia 5 — 19/10: metas, alertas e importação

- persistir metas financeiras simples;
- sinalizar orçamento, recorrência, fatura e meta em risco;
- definir o modelo de importação e conciliação idempotente;
- implementar CSV genérico apenas se os itens anteriores estiverem estáveis.

### Dia 6 — 20/10: produção e qualidade

- ampliar testes dos cálculos e da autorização;
- adicionar testes essenciais de interface e fluxo completo;
- preparar Docker, variáveis, logs, health check e CI;
- remover configurações inseguras de desenvolvimento;
- documentar execução, backup e restauração.

### Dia 7 — 21/10: ensaio de deploy

- regressão funcional completa em desktop e mobile;
- revisão de acessibilidade e mensagens de erro;
- subir ambiente limpo usando somente migrations;
- ensaiar backup, restauração e rollback;
- congelar código, gerar tag e executar o runbook.

## Portões obrigatórios para deploy

- testes, lint e build aprovados;
- migrations funcionando em banco vazio e em banco com dados;
- nenhuma credencial versionada;
- autenticação e isolamento entre usuários comprovados;
- cálculos sem duplicidade entre compra, fatura e pagamento;
- recorrências idempotentes e exclusões preservando histórico;
- backup restaurado em teste;
- fluxos críticos utilizáveis em tela pequena;
- documentação de ambiente e rollback atualizada;
- árvore de trabalho limpa ou com alterações explicitamente conhecidas.

## Regra de corte

Se houver atraso, cortar nesta ordem: CSV, automações, alertas avançados, gráficos adicionais e polimento cosmético. Não cortar autenticação, isolamento, migrations, segurança, testes dos cálculos, backup nem configuração de produção.
