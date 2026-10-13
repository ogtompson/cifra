"use client";

import BudgetGuard from "@/components/ui/budget-guard";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function OrcamentosPainel({ categorias, orcamentos, aoEditarCategoria }) {
  const totais = orcamentos.reduce((total, item) => ({ limite: total.limite + Number(item.valorLimite), gasto: total.gasto + Number(item.gastoRealizado) }), { limite: 0, gasto: 0 });
  const disponivel = totais.limite - totais.gasto;
  const budgets = orcamentos.map((item) => ({
    id: item.id,
    label: item.categoriaNome,
    textLabel: item.categoriaNome,
    used: Number(item.gastoRealizado),
    limit: Number(item.valorLimite),
    format: (valor) => moeda.format(valor),
    categoria: categorias.find((categoria) => String(categoria.id) === String(item.categoriaId)),
  }));

  return (
    <section className="paper-card mt-6 overflow-hidden rounded-[1.6rem]">
      <header className="border-b border-primary/7 px-4 py-4 sm:px-6"><h2 className="text-base font-extrabold text-primary">Orçamento do mês</h2><p className="mt-0.5 text-xs text-foreground-soft">Acompanhe os limites informados nas categorias de despesa.</p></header>
      <div className="grid border-b border-primary/7 sm:grid-cols-3 sm:divide-x sm:divide-primary/7">
        <div className="min-w-0 px-5 py-4 sm:px-6"><p className="text-xs text-foreground-soft">Planejado</p><strong className="mt-1 block truncate text-lg text-primary">{moeda.format(totais.limite)}</strong></div>
        <div className="min-w-0 border-t border-primary/7 px-5 py-4 sm:border-t-0 sm:px-6"><p className="text-xs text-foreground-soft">Realizado</p><strong className="mt-1 block truncate text-lg text-primary">{moeda.format(totais.gasto)}</strong></div>
        <div className="min-w-0 border-t border-primary/7 px-5 py-4 sm:border-t-0 sm:px-6"><p className="text-xs text-foreground-soft">Disponível</p><strong className={`mt-1 block truncate text-lg ${disponivel < 0 ? "text-error" : "text-positive"}`}>{moeda.format(disponivel)}</strong></div>
      </div>
      <BudgetGuard budgets={budgets} emptyLabel="Nenhum limite neste mês. Você pode adicioná-lo ao criar ou editar uma categoria de despesa." onSelect={(budget) => budget.categoria && aoEditarCategoria(budget.categoria)} />
    </section>
  );
}
