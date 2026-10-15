# Auditoria do Dia 1 — 15/10/2026

## Resultado

O núcleo manual está consistente para seguirmos à autenticação e às migrations. A versão ainda não está pronta para exposição pública porque todos os dados continuam globais e o schema ainda é administrado por `ddl-auto=update`.

## Validações executadas

- `mvn test`: 84 testes aprovados após as correções;
- `npm run lint`: aprovado sem avisos;
- `npm run build`: build de produção aprovado;
- rotas estáticas geradas: início, dashboard, contas, categorias, transações, recorrências e cartões;
- componentes compartilhados confirmados para loading, erro, estado vazio, modal, select, switch e navegação mensal;
- nenhum `TODO`, `FIXME`, `alert()` ou `console.log` encontrado no código de aplicação.

## Regras financeiras confirmadas

- saldo de conta: saldo inicial + receitas − saídas de caixa;
- pagamento de fatura reduz a conta, mas não é contado novamente como despesa econômica;
- compra no cartão entra em despesas e orçamento pela data e valor total da compra;
- parcelas representam compromissos de caixa futuros e não duplicam o gasto no resultado;
- faturas pagas deixam de consumir limite e deixam de aparecer como compromisso pendente;
- recorrências usam chave única por regra e data para evitar geração duplicada;
- orçamentos somam transações e compras no cartão da mesma categoria.

## Correções realizadas

- orçamento criado em categoria com gastos agora retorna imediatamente o consumo real;
- categoria com transação, recorrência, orçamento ou compra vinculada não pode ser excluída indevidamente;
- o tipo de uma categoria com histórico não pode ser alterado e corromper a leitura financeira;
- conta arquivada não aceita nova transação, recorrência ativa ou compra no cartão;
- conta com recorrência ativa ou cartão vinculado precisa ser regularizada antes do arquivamento;
- o gerador ignora contas arquivadas em dados legados inconsistentes;
- excluir uma recorrência remove a regra futura, desvincula e preserva os lançamentos históricos, conforme prometido pela interface.

## Pendências não bloqueadoras de hoje

- o texto `Olá, Paulo!` será substituído pelo usuário autenticado no Dia 3;
- ainda não existem testes automatizados do front-end ou E2E;
- não foi executado teste visual em navegador nesta auditoria; lint, build e inspeção estrutural foram concluídos;
- warnings do Mockito sobre carregamento dinâmico de agente não afetam a suíte atual, mas devem ser tratados antes de uma futura atualização do JDK;
- existe uma alteração local anterior de espaço em branco em `ResumoFinanceiroController.java`, mantida fora dos commits.

## Bloqueadores do deploy ainda abertos

1. migrations versionadas;
2. autenticação e propriedade dos dados;
3. isolamento de todas as operações por usuário;
4. configuração segura de produção;
5. CI, health check, backup, restauração e rollback;
6. testes de autorização e dos fluxos críticos de interface.

## Próxima ação

Iniciar o Dia 2 pela fotografia do schema atual e pela migration baseline. Depois, implementar usuário/autenticação e propagar a propriedade para cada agregado financeiro antes de adicionar novas funcionalidades.
