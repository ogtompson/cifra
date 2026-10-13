"use client";

import { Icone } from "@/components/icons";
import { EstadoVazio } from "@/components/ui";

export default function BudgetGuard({ budgets, emptyLabel = "Nenhum limite configurado para este mês.", onSelect, className = "" }) {
  return (
    <div className={className}>
      {budgets.length === 0 ? (
        <EstadoVazio compacto icone="grafico" titulo="Nenhum limite neste mês" descricao={emptyLabel} />
      ) : (
        <ul className="divide-y divide-primary/7">
          {budgets.map((budget) => {
            const limite = Math.max(Number(budget.limit), 0.01);
            const usado = Number(budget.used);
            const percentual = (usado / limite) * 100;
            const excedido = usado >= limite;
            const atencao = !excedido && percentual >= 80;
            const saldo = limite - usado;
            const conteudo = (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2"><strong className="truncate text-xs text-primary sm:text-sm">{budget.label}</strong>{(excedido || atencao) && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[.55rem] font-extrabold ${excedido ? "bg-error/9 text-error" : "bg-[#d39a52]/12 text-[#8a5a1e]"}`}>{excedido ? "Limite atingido" : "Atenção"}</span>}</span>
                  <span className="shrink-0 text-[.65rem] font-bold tabular-nums text-foreground-soft">{budget.format(usado)} / {budget.format(limite)}</span>
                </div>
                <div className="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary/7" role="progressbar" aria-label={`Uso do orçamento de ${budget.textLabel ?? budget.label}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(Math.round(percentual), 100)}>
                  <div className={`h-full rounded-full transition-all ${excedido ? "bg-error" : atencao ? "bg-[#d39a52]" : "bg-secondary"}`} style={{ width: `${Math.min(100, Math.max(0, percentual))}%` }} />
                  <span className="absolute inset-y-0 left-[80%] w-px bg-primary/25" aria-hidden="true" />
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-3 text-[.6rem]"><span className="text-foreground-soft">Alerta a partir de 80%</span><span className={saldo >= 0 ? "font-bold text-positive" : "font-bold text-error"}>{saldo >= 0 ? `${budget.format(saldo)} disponíveis` : `${budget.format(Math.abs(saldo))} excedidos`}</span></div>
              </>
            );
            return <li key={budget.id}>{onSelect ? <button type="button" onClick={() => onSelect(budget)} className="interactive-row block w-full px-5 py-4 text-left focus-visible:bg-secondary/[.035] focus-visible:outline-none sm:px-6">{conteudo}</button> : <div className="px-5 py-4 sm:px-6">{conteudo}</div>}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
