"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icone } from "@/components/icons";
import { apiFetch } from "@/lib/api";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const cores = ["#006463", "#c47b4a", "#e8b57d", "#8ba49e", "#704424"];

function periodoAtual() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  const iso = (data) => data.toLocaleDateString("en-CA");
  return { inicio: iso(inicio), fim: iso(fim) };
}

async function carregarPainel() {
  const periodo = periodoAtual();
  const [resumo, transacoes, contas, recorrencias] = await Promise.all([
    apiFetch(`/resumo-financeiro?dataInicio=${periodo.inicio}&dataFim=${periodo.fim}`),
    apiFetch("/transacoes"), apiFetch("/contas"), apiFetch("/recorrencias?ativa=true"),
  ]);
  return { resumo, transacoes, contas, recorrencias };
}

function MiniGrafico({ despesa = false }) {
  return <div className="flex h-16 items-end gap-2" aria-hidden="true">{[34, 52, 43, 68, 58, 80, 63].map((altura, indice) => <span key={indice} className={`w-full rounded-t-md ${despesa ? "bg-accent/45" : "bg-secondary/65"}`} style={{ height: `${altura}%` }} />)}</div>;
}

export default function VisaoGeral() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    carregarPainel().then((resultado) => ativo && setDados(resultado)).catch((error) => ativo && setErro(error.message));
    return () => { ativo = false; };
  }, []);

  const ultimas = useMemo(() => [...(dados?.transacoes ?? [])].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5), [dados]);
  const proximas = useMemo(() => (dados?.recorrencias ?? []).slice(0, 4), [dados]);

  if (erro) return <main className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 lg:px-10"><div className="rounded-2xl border border-error/20 bg-error/8 p-5 text-sm font-semibold text-error">{erro} Verifique se o backend está em execução.</div></main>;

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-bold text-secondary">Seu mês em perspectiva</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.035em] text-primary sm:text-4xl">Olá, Paulo.</h1><p className="mt-1.5 text-sm text-foreground-soft">Seu dinheiro, com mais clareza.</p></div>
        <button type="button" className="flex items-center justify-center gap-2 self-start rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-[0_12px_25px_rgba(0,58,48,.16)] transition hover:-translate-y-0.5 hover:bg-secondary"><Icone nome="mais" className="size-4" /> Nova transação</button>
      </section>

      {!dados ? <div className="mt-7 h-64 animate-pulse rounded-[1.75rem] bg-primary/7" /> : <>
        <section className="balance-panel relative mt-7 overflow-hidden rounded-[1.75rem] px-6 py-7 text-white shadow-[0_22px_55px_rgba(0,58,48,.18)] sm:px-8 lg:min-h-64 lg:px-10 lg:py-9">
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-center">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Seu saldo hoje</p><p className="mt-2 text-4xl font-extrabold tracking-[-0.045em] sm:text-5xl">{moeda.format(dados.resumo.saldoTotal)}</p>
              <div className="mt-8 grid max-w-xl grid-cols-3 divide-x divide-white/15"><div className="pr-3"><p className="text-xs text-white/55">Entrou</p><strong className="mt-1 block text-sm text-[#7fe0b3] sm:text-base">{moeda.format(dados.resumo.totalReceitas)}</strong></div><div className="px-3"><p className="text-xs text-white/55">Saiu</p><strong className="mt-1 block text-sm text-[#f4aa93] sm:text-base">{moeda.format(dados.resumo.totalDespesas)}</strong></div><div className="pl-3"><p className="text-xs text-white/55">Resultado</p><strong className="mt-1 block text-sm sm:text-base">{moeda.format(dados.resumo.resultadoPeriodo)}</strong></div></div>
            </div>
            <div className="relative hidden h-44 items-center justify-end lg:flex"><p className="absolute left-0 top-4 -rotate-3 text-lg font-semibold italic leading-snug text-[#e7bd76]">Mais que números,<br />mais conquistas.</p><Image src="/logomarca/simbolo-bau-3d.png" alt="" width={500} height={499} className="h-44 w-auto drop-shadow-[0_18px_18px_rgba(0,0,0,.18)]" /></div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr_.9fr]">
          <article className="paper-card rounded-[1.5rem] p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-foreground-soft">Entradas</p><p className="mt-1 text-2xl font-extrabold text-primary">{moeda.format(dados.resumo.totalReceitas)}</p></div><span className="grid size-11 place-items-center rounded-2xl bg-positive/10 text-positive"><Icone nome="setaCima" /></span></div><div className="mt-5"><MiniGrafico /></div></article>
          <article className="paper-card rounded-[1.5rem] p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-foreground-soft">Saídas</p><p className="mt-1 text-2xl font-extrabold text-primary">{moeda.format(dados.resumo.totalDespesas)}</p></div><span className="grid size-11 place-items-center rounded-2xl bg-error/10 text-error"><Icone nome="setaBaixo" /></span></div><div className="mt-5"><MiniGrafico despesa /></div></article>
          <article className="paper-card rounded-[1.5rem] p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-foreground-soft">Contas</p><p className="mt-1 text-2xl font-extrabold text-primary">{dados.contas.length}</p></div><Link href="/contas" className="grid size-10 place-items-center rounded-full bg-primary/6 text-primary"><Icone nome="setaDireita" className="size-4" /></Link></div><div className="mt-6 flex -space-x-2">{dados.contas.slice(0, 5).map((conta, indice) => <span key={conta.id} className="grid size-10 place-items-center rounded-full border-2 border-white text-xs font-extrabold text-white" style={{ background: cores[indice % cores.length] }}>{conta.nome.slice(0, 1)}</span>)}</div><p className="mt-3 text-xs text-foreground-soft">Seu patrimônio distribuído em um só lugar.</p></article>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.9fr]">
          <article className="paper-card overflow-hidden rounded-[1.5rem]"><header className="flex items-center justify-between px-5 py-5 sm:px-6"><div><h2 className="font-extrabold text-primary">Últimas movimentações</h2><p className="mt-1 text-xs text-foreground-soft">O que aconteceu mais recentemente</p></div><span className="text-xs font-bold text-secondary">Ver todas</span></header><div className="border-t border-primary/7">
            {ultimas.length ? ultimas.map((item) => <div key={item.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-primary/6 px-5 py-3.5 last:border-0 sm:px-6"><span className={`grid size-10 place-items-center rounded-xl ${item.tipo === "RECEITA" ? "bg-positive/10 text-positive" : "bg-error/8 text-error"}`}><Icone nome={item.tipo === "RECEITA" ? "setaCima" : "setaBaixo"} className="size-4" /></span><div className="min-w-0"><p className="truncate text-sm font-bold text-primary">{item.descricao}</p><p className="mt-0.5 truncate text-xs text-foreground-soft">{item.categoriaNome} · {item.contaNome}</p></div><div className="text-right"><strong className={`text-sm ${item.tipo === "RECEITA" ? "text-positive" : "text-error"}`}>{item.tipo === "RECEITA" ? "+" : "−"} {moeda.format(item.valor)}</strong><p className="mt-0.5 text-[.65rem] text-foreground-soft">{dataCurta.format(new Date(`${item.data}T12:00:00`))}</p></div></div>) : <p className="px-6 py-10 text-center text-sm text-foreground-soft">Suas movimentações aparecerão aqui.</p>}
          </div></article>
          <article className="paper-card rounded-[1.5rem] p-5 sm:p-6"><div className="flex items-start justify-between"><div><h2 className="font-extrabold text-primary">Próximos compromissos</h2><p className="mt-1 text-xs text-foreground-soft">Recorrências sob controle</p></div><span className="grid size-10 place-items-center rounded-xl bg-accent/10 text-accent"><Icone nome="calendario" className="size-4" /></span></div><div className="mt-5 space-y-2.5">{proximas.length ? proximas.map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-app-surface px-3.5 py-3"><div><p className="text-sm font-bold text-primary">{item.descricao}</p><p className="mt-0.5 text-[.68rem] text-foreground-soft">Todo dia {item.diaDoMes}</p></div><strong className="text-sm text-primary">{moeda.format(item.valor)}</strong></div>) : <div className="gold-surface rounded-2xl p-5"><p className="font-bold text-primary">Tudo tranquilo por aqui.</p><p className="mt-1 text-xs leading-5 text-foreground-soft">Nenhum compromisso recorrente ativo.</p></div>}</div></article>
        </section>
      </>}
    </main>
  );
}
