"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icone } from "@/components/icons";
import { botaoPrimario, EsqueletoLista, FeedbackErro } from "@/components/ui";
import { apiFetch } from "@/lib/api";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

function periodoDaData(referencia) {
  const inicio = new Date(referencia.getFullYear(), referencia.getMonth(), 1);
  const fim = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0);
  const iso = (data) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
  return { inicio: iso(inicio), fim: iso(fim) };
}

async function carregarPainel(referencia) {
  const periodo = periodoDaData(referencia);
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
      {href && <Link href={href} className="shrink-0 text-xs font-bold text-secondary transition hover:translate-x-0.5 hover:underline hover:underline-offset-4">{link}</Link>}
    </header>
  );
}

export default function VisaoGeral() {
  const [mesReferencia, setMesReferencia] = useState(() => new Date());
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    carregarPainel(mesReferencia).then((resultado) => { if (ativo) setDados(resultado); }).catch((error) => ativo && setErro(error.message)).finally(() => ativo && setCarregando(false));
    return () => { ativo = false; };
  }, [mesReferencia]);

  const periodo = useMemo(() => periodoDaData(mesReferencia), [mesReferencia]);
  const ultimas = useMemo(() => [...(dados?.transacoes ?? [])].filter((item) => item.data >= periodo.inicio && item.data <= periodo.fim).sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id).slice(0, 5), [dados, periodo]);
  const proximas = useMemo(() => (dados?.recorrencias ?? []).slice(0, 4), [dados]);
  const maiorDespesa = Math.max(...(dados?.resumo.despesasPorCategoria ?? []).map((item) => Number(item.total)), 1);
  const taxaEconomia = dados?.resumo && Number(dados.resumo.totalReceitas) > 0 ? (Number(dados.resumo.resultadoPeriodo) / Number(dados.resumo.totalReceitas)) * 100 : 0;
  const rotuloMes = nomeMes.format(mesReferencia);

  function moverMes(deslocamento) {
    setCarregando(true);
    setErro("");
    setMesReferencia((atual) => new Date(atual.getFullYear(), atual.getMonth() + deslocamento, 1, 12));
  }

  if (erro) return <main className="page-shell"><FeedbackErro mensagem={`${erro} Verifique se o backend está em execução.`} /></main>;

  return (
    <main className="page-shell">
      <section className="flex items-end justify-between gap-4">
        <div><div className="mb-1 flex items-center gap-1 text-secondary"><button type="button" onClick={() => moverMes(-1)} className="grid size-6 place-items-center rounded-full transition hover:bg-secondary/8" aria-label="Mês anterior"><Icone nome="setaDireita" className="size-3 rotate-180" /></button><p className="min-w-32 text-center text-xs font-extrabold">{rotuloMes.charAt(0).toUpperCase() + rotuloMes.slice(1)}</p><button type="button" onClick={() => moverMes(1)} className="grid size-6 place-items-center rounded-full transition hover:bg-secondary/8" aria-label="Próximo mês"><Icone nome="setaDireita" className="size-3" /></button></div><h1 className="page-title">Olá, Paulo!</h1><p className="page-description">Seu dinheiro, com mais clareza.</p></div>
        <Link href="/transacoes?nova=1" className={`${botaoPrimario} size-11 !p-0 sm:size-auto sm:!px-5`}><Icone nome="mais" className="size-4" /><span className="hidden sm:inline">Nova transação</span></Link>
      </section>

      {!dados || carregando ? <div className="mt-5 space-y-4"><div className="h-48 animate-pulse rounded-2xl bg-primary/7" /><div className="grid gap-4 xl:grid-cols-2"><div className="paper-card overflow-hidden rounded-2xl"><EsqueletoLista linhas={4} /></div><div className="paper-card overflow-hidden rounded-2xl"><EsqueletoLista linhas={4} /></div></div></div> : <>
        <section className="balance-panel relative mt-5 overflow-hidden rounded-2xl px-5 py-5 text-white shadow-[0_16px_40px_rgba(0,58,48,.14)] sm:px-7 sm:py-7">
          <div className="relative z-10 grid gap-6 md:grid-cols-[1fr_minmax(13rem,.38fr)] md:items-center">
            <div><p className="text-[.65rem] font-bold uppercase tracking-[.15em] text-white/55">Saldo consolidado</p><p className="mt-1.5 text-3xl font-extrabold tracking-[-.045em] sm:text-4xl">{moeda.format(dados.resumo.saldoTotal)}</p>
              <div className="mt-5 flex max-w-md gap-6"><div><p className="text-[.62rem] text-white/50 sm:text-xs">Recebido no mês</p><strong className="mt-1 block text-xs text-[#82ddb5] sm:text-sm">{moeda.format(dados.resumo.totalReceitas)}</strong></div><div><p className="text-[.62rem] text-white/50 sm:text-xs">Pago no mês</p><strong className="mt-1 block text-xs text-[#f0aa94] sm:text-sm">{moeda.format(dados.resumo.totalDespesas)}</strong></div></div>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/[0.075] p-4 backdrop-blur-sm sm:p-5"><p className="text-[.62rem] font-bold uppercase tracking-[.13em] text-white/50">Resultado do mês</p><p className={`mt-2 text-2xl font-extrabold ${Number(dados.resumo.resultadoPeriodo) >= 0 ? "text-[#9ae4c1]" : "text-[#f2ae99]"}`}>{moeda.format(dados.resumo.resultadoPeriodo)}</p><p className="mt-2 text-xs text-white/55">{taxaEconomia >= 0 ? `${taxaEconomia.toFixed(1)}% do que entrou foi preservado.` : "As despesas superaram as receitas neste período."}</p></div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
          <article className="paper-card overflow-hidden rounded-2xl">
            <CabecalhoCard titulo="Movimentações recentes" descricao="Seus últimos lançamentos" href="/transacoes" link="Ver todas" />
            <div>{ultimas.length ? ultimas.map((item) => <div key={item.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-2.5 border-b border-primary/6 px-4 py-3 transition-colors last:border-0 hover:bg-secondary/[0.025] sm:px-5"><span className={`grid size-8 place-items-center rounded-lg ${item.tipo === "RECEITA" ? "bg-positive/10 text-positive" : "bg-error/8 text-error"}`}><Icone nome={item.tipo === "RECEITA" ? "setaCima" : "setaBaixo"} className="size-3.5" /></span><div className="min-w-0"><p className="truncate text-xs font-bold text-primary sm:text-sm">{item.descricao}</p><p className="mt-0.5 truncate text-[.62rem] text-foreground-soft sm:text-xs">{item.categoriaNome} · {item.contaNome}</p></div><div className="text-right"><strong className={`whitespace-nowrap text-xs sm:text-sm ${item.tipo === "RECEITA" ? "text-positive" : "text-error"}`}>{item.tipo === "RECEITA" ? "+" : "−"} {moeda.format(item.valor)}</strong><p className="mt-0.5 text-[.58rem] text-foreground-soft sm:text-[.65rem]">{dataCurta.format(new Date(`${item.data}T12:00:00`))}</p></div></div>) : <p className="px-5 py-10 text-center text-xs text-foreground-soft">Suas movimentações aparecerão aqui.</p>}</div>
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
