"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icone } from "@/components/icons";
import { botaoPrimario, EsqueletoBloco, EsqueletoLista, EstadoVazio, FeedbackErro, NavegacaoMes } from "@/components/ui";
import { apiFetch } from "@/lib/api";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

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
  function moverMes(deslocamento) {
    setCarregando(true);
    setErro("");
    setMesReferencia((atual) => new Date(atual.getFullYear(), atual.getMonth() + deslocamento, 1, 12));
  }
  async function recarregar() {
    setCarregando(true);
    setErro("");
    try { setDados(await carregarPainel(mesReferencia)); } catch (error) { setErro(error.message); } finally { setCarregando(false); }
  }

  return (
    <main className="page-shell">
      <section className="flex items-end justify-between gap-4">
        <div><NavegacaoMes referencia={mesReferencia} aoMudar={moverMes} /><h1 className="page-title">Olá, Paulo!</h1><p className="page-description">Seu dinheiro, com mais clareza.</p></div>
        <Link href="/transacoes?nova=1" className={`${botaoPrimario} size-11 !p-0 sm:size-auto sm:!px-5`}><Icone nome="mais" className="size-4" /><span className="hidden sm:inline">Nova transação</span></Link>
      </section>

      {erro && <FeedbackErro mensagem={`${erro} Verifique se o backend está em execução.`} aoTentarNovamente={recarregar} />}

      {!erro && (!dados || carregando) ? <div className="mt-5 space-y-4"><EsqueletoBloco className="h-48" /><div className="grid gap-4 xl:grid-cols-2"><div className="paper-card overflow-hidden rounded-2xl"><EsqueletoLista linhas={4} /></div><div className="paper-card overflow-hidden rounded-2xl"><EsqueletoLista linhas={4} /></div></div></div> : !erro && dados ? <div className="content-enter">
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
            <div>{ultimas.length ? ultimas.map((item) => { const pagamentoFatura = item.natureza === "PAGAMENTO_FATURA"; return <div key={item.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-2.5 border-b border-primary/6 px-4 py-3 last:border-0 sm:px-5"><span className={`grid size-8 place-items-center rounded-lg ${pagamentoFatura ? "bg-secondary/9 text-secondary" : item.tipo === "RECEITA" ? "bg-positive/10 text-positive" : "bg-error/8 text-error"}`}><Icone nome={pagamentoFatura ? "cartoes" : item.tipo === "RECEITA" ? "setaCima" : "setaBaixo"} className="size-3.5" /></span><div className="min-w-0"><p className="truncate text-xs font-bold text-primary sm:text-sm">{item.descricao}</p><p className="mt-0.5 truncate text-[.62rem] text-foreground-soft sm:text-xs">{pagamentoFatura ? "Pagamento de fatura" : item.categoriaNome} · {item.contaNome}</p></div><div className="text-right"><strong className={`whitespace-nowrap text-xs sm:text-sm ${pagamentoFatura ? "text-primary" : item.tipo === "RECEITA" ? "text-positive" : "text-error"}`}>{item.tipo === "RECEITA" ? "+" : "−"} {moeda.format(item.valor)}</strong><p className="mt-0.5 text-[.58rem] text-foreground-soft sm:text-[.65rem]">{dataCurta.format(new Date(`${item.data}T12:00:00`))}</p></div></div>; }) : <EstadoVazio compacto icone="transacoes" titulo="Nenhuma movimentação neste mês" descricao="Seus lançamentos mais recentes aparecerão aqui." />}</div>
          </article>

          <article className="paper-card overflow-hidden rounded-2xl">
            <CabecalhoCard titulo="Despesas por categoria" descricao="Distribuição no mês atual" href="/categorias" link="Categorias" />
            <div className={dados.resumo.despesasPorCategoria.length ? "space-y-4 px-4 py-5 sm:px-5" : ""}>{dados.resumo.despesasPorCategoria.length ? dados.resumo.despesasPorCategoria.slice(0, 6).map((item) => <div key={item.categoriaId}><div className="mb-1.5 flex items-center justify-between gap-3"><span className="truncate text-xs font-bold text-primary">{item.categoriaNome}</span><strong className="text-xs text-primary">{moeda.format(item.total)}</strong></div><div className="h-1.5 overflow-hidden rounded-full bg-primary/7"><div className="h-full rounded-full bg-secondary transition-all duration-500" style={{ width: `${Math.max((Number(item.total) / maiorDespesa) * 100, 4)}%` }} /></div></div>) : <EstadoVazio compacto icone="categorias" titulo="Nenhuma despesa neste mês" descricao="A distribuição por categoria aparecerá aqui." />}</div>
          </article>
        </section>

        <section className="paper-card mt-4 overflow-hidden rounded-2xl">
          <CabecalhoCard titulo="Próximos compromissos" descricao="Recorrências ativas" href="/recorrencias" link="Gerenciar" />
          <div className="grid divide-y divide-primary/6 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">{proximas.length ? proximas.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5"><div className="min-w-0"><p className="truncate text-xs font-bold text-primary sm:text-sm">{item.descricao}</p><p className="mt-0.5 text-[.62rem] text-foreground-soft">{item.frequencia === "MENSAL" ? `Todo dia ${item.diaDoMes}` : item.frequencia === "SEMANAL" ? "Toda semana" : "Todo ano"}</p></div><strong className="whitespace-nowrap text-xs text-primary sm:text-sm">{moeda.format(item.valor)}</strong></div>) : <div className="col-span-full"><EstadoVazio compacto icone="recorrencias" titulo="Nenhum compromisso recorrente" descricao="Suas próximas recorrências ativas aparecerão aqui." /></div>}</div>
        </section>
      </div> : null}
    </main>
  );
}
