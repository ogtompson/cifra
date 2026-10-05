"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icone } from "@/components/icons";
import { apiFetch } from "@/lib/api";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

function periodoAtual() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  const iso = (data) => data.toLocaleDateString("en-CA");
  return { inicio: iso(inicio), fim: iso(fim) };
}

async function carregarPainel() {
  const periodo = periodoAtual();
  const [resumo, transacoes, recorrencias] = await Promise.all([
    apiFetch(`/resumo-financeiro?dataInicio=${periodo.inicio}&dataFim=${periodo.fim}`),
    apiFetch("/transacoes"),
    apiFetch("/recorrencias?ativa=true"),
  ]);
  return { resumo, transacoes, recorrencias };
}

function CabecalhoCard({ titulo, descricao, href, link }) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-primary/7 px-4 py-4 sm:px-5">
      <div><h2 className="text-sm font-extrabold text-primary sm:text-base">{titulo}</h2><p className="mt-0.5 text-[.68rem] text-foreground-soft sm:text-xs">{descricao}</p></div>
      {href && <Link href={href} className="shrink-0 text-xs font-bold text-secondary">{link}</Link>}
    </header>
  );
}

export default function VisaoGeral() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    carregarPainel().then((resultado) => ativo && setDados(resultado)).catch((error) => ativo && setErro(error.message));
    return () => { ativo = false; };
  }, []);

  const ultimas = useMemo(() => [...(dados?.transacoes ?? [])].sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id).slice(0, 5), [dados]);
  const proximas = useMemo(() => (dados?.recorrencias ?? []).slice(0, 4), [dados]);
  const maiorDespesa = Math.max(...(dados?.resumo.despesasPorCategoria ?? []).map((item) => Number(item.total)), 1);

  if (erro) return <main className="mx-auto max-w-[1400px] px-4 py-7 sm:px-7 lg:px-9"><div className="rounded-xl border border-error/20 bg-error/8 p-4 text-sm font-semibold text-error">{erro} Verifique se o backend está em execução.</div></main>;

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-7 lg:px-9 lg:py-8">
      <section className="flex items-end justify-between gap-4">
        <div><p className="text-xs font-bold capitalize text-secondary">{nomeMes.format(new Date())}</p><h1 className="mt-1 text-2xl font-extrabold tracking-[-.035em] text-primary sm:text-3xl">Visão geral</h1><p className="mt-1 text-xs text-foreground-soft sm:text-sm">Olá, Paulo. Aqui está o resumo da sua vida financeira.</p></div>
        <Link href="/transacoes?nova=1" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-[0_8px_20px_rgba(0,58,48,.14)] sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-3 sm:text-sm sm:font-bold"><Icone nome="mais" className="size-4" /><span className="hidden sm:inline">Nova transação</span></Link>
      </section>

      {!dados ? <div className="mt-5 h-52 animate-pulse rounded-2xl bg-primary/7" /> : <>
        <section className="balance-panel relative mt-5 overflow-hidden rounded-2xl px-5 py-5 text-white shadow-[0_16px_40px_rgba(0,58,48,.14)] sm:px-7 sm:py-7">
          <div className="relative z-10 grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div><p className="text-[.65rem] font-bold uppercase tracking-[.15em] text-white/55">Saldo consolidado</p><p className="mt-1.5 text-3xl font-extrabold tracking-[-.045em] sm:text-4xl">{moeda.format(dados.resumo.saldoTotal)}</p>
              <div className="mt-5 grid max-w-lg grid-cols-3 divide-x divide-white/15"><div className="pr-2 sm:pr-4"><p className="text-[.62rem] text-white/50 sm:text-xs">Entradas</p><strong className="mt-1 block truncate text-xs text-[#82ddb5] sm:text-sm">{moeda.format(dados.resumo.totalReceitas)}</strong></div><div className="px-2 sm:px-4"><p className="text-[.62rem] text-white/50 sm:text-xs">Saídas</p><strong className="mt-1 block truncate text-xs text-[#f0aa94] sm:text-sm">{moeda.format(dados.resumo.totalDespesas)}</strong></div><div className="pl-2 sm:pl-4"><p className="text-[.62rem] text-white/50 sm:text-xs">Resultado</p><strong className="mt-1 block truncate text-xs sm:text-sm">{moeda.format(dados.resumo.resultadoPeriodo)}</strong></div></div>
            </div>
            <Image src="/logomarca/simbolo-bau-3d.png" alt="" width={500} height={499} className="hidden h-28 w-auto drop-shadow-[0_15px_15px_rgba(0,0,0,.18)] md:block" />
          </div>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
          <article className="paper-card overflow-hidden rounded-2xl">
            <CabecalhoCard titulo="Movimentações recentes" descricao="Seus últimos lançamentos" href="/transacoes" link="Ver todas" />
            <div>{ultimas.length ? ultimas.map((item) => <div key={item.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-2.5 border-b border-primary/6 px-4 py-3 last:border-0 sm:px-5"><span className={`grid size-8 place-items-center rounded-lg ${item.tipo === "RECEITA" ? "bg-positive/10 text-positive" : "bg-error/8 text-error"}`}><Icone nome={item.tipo === "RECEITA" ? "setaCima" : "setaBaixo"} className="size-3.5" /></span><div className="min-w-0"><p className="truncate text-xs font-bold text-primary sm:text-sm">{item.descricao}</p><p className="mt-0.5 truncate text-[.62rem] text-foreground-soft sm:text-xs">{item.categoriaNome} · {item.contaNome}</p></div><div className="text-right"><strong className={`whitespace-nowrap text-xs sm:text-sm ${item.tipo === "RECEITA" ? "text-positive" : "text-error"}`}>{item.tipo === "RECEITA" ? "+" : "−"} {moeda.format(item.valor)}</strong><p className="mt-0.5 text-[.58rem] text-foreground-soft sm:text-[.65rem]">{dataCurta.format(new Date(`${item.data}T12:00:00`))}</p></div></div>) : <p className="px-5 py-10 text-center text-xs text-foreground-soft">Suas movimentações aparecerão aqui.</p>}</div>
          </article>

          <article className="paper-card overflow-hidden rounded-2xl">
            <CabecalhoCard titulo="Despesas por categoria" descricao="Distribuição no mês atual" href="/categorias" link="Categorias" />
            <div className="space-y-4 px-4 py-5 sm:px-5">{dados.resumo.despesasPorCategoria.length ? dados.resumo.despesasPorCategoria.slice(0, 6).map((item) => <div key={item.categoriaId}><div className="mb-1.5 flex items-center justify-between gap-3"><span className="truncate text-xs font-bold text-primary">{item.categoriaNome}</span><strong className="text-xs text-primary">{moeda.format(item.total)}</strong></div><div className="h-1.5 overflow-hidden rounded-full bg-primary/7"><div className="h-full rounded-full bg-secondary" style={{ width: `${Math.max((Number(item.total) / maiorDespesa) * 100, 4)}%` }} /></div></div>) : <div className="py-5 text-center"><p className="text-sm font-bold text-primary">Nenhuma despesa neste mês</p><p className="mt-1 text-xs text-foreground-soft">Seu resumo por categoria aparecerá aqui.</p></div>}</div>
          </article>
        </section>

        <section className="paper-card mt-4 overflow-hidden rounded-2xl">
          <CabecalhoCard titulo="Próximos compromissos" descricao="Recorrências ativas" href="/recorrencias" link="Gerenciar" />
          <div className="grid divide-y divide-primary/6 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">{proximas.length ? proximas.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5"><div className="min-w-0"><p className="truncate text-xs font-bold text-primary sm:text-sm">{item.descricao}</p><p className="mt-0.5 text-[.62rem] text-foreground-soft">{item.frequencia === "MENSAL" ? `Todo dia ${item.diaDoMes}` : item.frequencia === "SEMANAL" ? "Toda semana" : "Todo ano"}</p></div><strong className="whitespace-nowrap text-xs text-primary sm:text-sm">{moeda.format(item.valor)}</strong></div>) : <p className="col-span-full px-5 py-8 text-center text-xs text-foreground-soft">Nenhum compromisso recorrente ativo.</p>}</div>
        </section>
      </>}
    </main>
  );
}
