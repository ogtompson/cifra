"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icone } from "@/components/icons";
import { apiFetch } from "@/lib/api";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const mesCurto = new Intl.DateTimeFormat("pt-BR", { month: "short" });
const mesLongo = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const coresContas = ["bg-[#dbeee5]", "bg-[#dedaf0]", "bg-[#f3e1c4]", "bg-[#dcebea]"];

function mesesRecentes(quantidade = 6) {
  const hoje = new Date();
  return Array.from({ length: quantidade }, (_, indice) => {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - (quantidade - 1 - indice), 1);
    const fim = new Date(data.getFullYear(), data.getMonth() + 1, 0);
    return { data, inicio: data.toLocaleDateString("en-CA"), fim: fim.toLocaleDateString("en-CA") };
  });
}

async function carregarDashboard() {
  const meses = mesesRecentes();
  const [historico, contas] = await Promise.all([
    Promise.all(meses.map(async (mes) => ({ ...mes, resumo: await apiFetch(`/resumo-financeiro?dataInicio=${mes.inicio}&dataFim=${mes.fim}`) }))),
    apiFetch("/contas"),
  ]);
  const saldos = await Promise.all(contas.map((conta) => apiFetch(`/contas/${conta.id}/saldo`)));
  return { historico, contas: contas.map((conta, indice) => ({ ...conta, ...saldos[indice] })) };
}

function CardKpi({ rotulo, valor, detalhe, tom = "neutro" }) {
  const cores = tom === "positivo" ? "text-positive" : tom === "negativo" ? "text-error" : "text-primary";
  return <article className="rounded-xl border border-primary/7 bg-white px-4 py-3.5"><p className="text-[.62rem] font-bold uppercase tracking-[.11em] text-foreground-soft">{rotulo}</p><p className={`mt-1.5 truncate text-lg font-extrabold sm:text-xl ${cores}`}>{valor}</p><p className="mt-1 truncate text-[.65rem] text-foreground-soft">{detalhe}</p></article>;
}

export default function DashboardView() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => { let ativo = true; carregarDashboard().then((resultado) => ativo && setDados(resultado)).catch((error) => ativo && setErro(error.message)); return () => { ativo = false; }; }, []);

  const atual = dados?.historico.at(-1)?.resumo;
  const maiorFluxo = useMemo(() => Math.max(...(dados?.historico ?? []).flatMap((item) => [Number(item.resumo.totalReceitas), Number(item.resumo.totalDespesas)]), 1), [dados]);
  const maiorSaldo = useMemo(() => Math.max(...(dados?.historico ?? []).map((item) => Math.max(Number(item.resumo.saldoTotal), 0)), 1), [dados]);
  const taxaEconomia = atual && Number(atual.totalReceitas) > 0 ? (Number(atual.resultadoPeriodo) / Number(atual.totalReceitas)) * 100 : 0;
  const principalCategoria = atual?.despesasPorCategoria?.[0];

  if (erro) return <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9"><div className="rounded-xl border border-error/20 bg-error/8 p-4 text-sm font-semibold text-error">{erro} Verifique se o backend está em execução.</div></main>;

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 lg:px-9 lg:py-8">
      <header className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold capitalize text-secondary">Relatório financeiro · {mesLongo.format(new Date())}</p><h1 className="mt-1 text-2xl font-extrabold tracking-[-.035em] text-primary sm:text-3xl">Dashboard</h1><p className="mt-1 text-xs text-foreground-soft sm:text-sm">Indicadores para entender o presente e planejar os próximos passos.</p></div><Link href="/transacoes" className="hidden items-center gap-2 rounded-xl border border-primary/10 bg-white px-4 py-2.5 text-xs font-bold text-primary sm:flex">Ver transações <Icone nome="setaDireita" className="size-3.5" /></Link></header>

      {!dados ? <div className="mt-5 h-[34rem] animate-pulse rounded-2xl bg-primary/6" /> : <>
        <section className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
          <article className="paper-card rounded-2xl p-4 sm:p-5">
            <div className="flex items-start justify-between"><div><p className="text-xs font-bold text-foreground-soft">Patrimônio</p><p className="mt-2 text-3xl font-extrabold tracking-[-.04em] text-primary sm:text-4xl">{moeda.format(atual.saldoTotal)}</p></div><span className="rounded-full bg-primary/6 px-3 py-1.5 text-[.65rem] font-bold capitalize text-primary">{mesLongo.format(new Date())}</span></div>
            <div className="mt-6 flex h-28 items-end gap-2 border-b border-primary/8 px-1 sm:h-36">{dados.historico.map((item, indice) => <div key={item.inicio} className="group flex h-full flex-1 items-end"><div className={`relative w-full rounded-t-md transition ${indice === dados.historico.length - 1 ? "bg-primary" : "bg-secondary/18 group-hover:bg-secondary/30"}`} style={{ height: `${Math.max((Math.max(Number(item.resumo.saldoTotal), 0) / maiorSaldo) * 100, 5)}%` }}><span className="absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-[.55rem] font-bold text-primary group-hover:block">{moeda.format(item.resumo.saldoTotal)}</span></div></div>)}</div>
            <div className="mt-2 grid grid-cols-6">{dados.historico.map((item) => <span key={item.inicio} className="text-center text-[.58rem] font-semibold capitalize text-foreground-soft">{mesCurto.format(item.data).replace(".", "")}</span>)}</div>
          </article>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            {dados.contas.slice(0, 4).map((conta, indice) => <Link href="/contas" key={conta.id} className={`${coresContas[indice % coresContas.length]} flex min-h-32 flex-col justify-between rounded-2xl p-4 transition hover:-translate-y-0.5`}><div className="flex items-start justify-between gap-2"><span className="grid size-8 place-items-center rounded-lg bg-white/70 text-primary"><Icone nome="carteira" className="size-4" /></span><Icone nome="setaDireita" className="size-3.5 text-primary/50" /></div><div><p className="truncate text-xs font-bold text-primary">{conta.nome}</p><p className="mt-1 truncate text-base font-extrabold text-primary sm:text-lg">{moeda.format(conta.saldoAtual)}</p></div></Link>)}
            {!dados.contas.length && <div className="col-span-2 grid min-h-64 place-items-center rounded-2xl border border-dashed border-primary/15 bg-white/60 p-6 text-center"><div><p className="font-bold text-primary">Nenhuma conta cadastrada</p><Link href="/contas" className="mt-2 inline-block text-xs font-bold text-secondary">Criar conta</Link></div></div>}
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <CardKpi rotulo="Receitas" valor={moeda.format(atual.totalReceitas)} detalhe="No mês atual" tom="positivo" />
          <CardKpi rotulo="Despesas" valor={moeda.format(atual.totalDespesas)} detalhe="No mês atual" tom="negativo" />
          <CardKpi rotulo="Resultado" valor={moeda.format(atual.resultadoPeriodo)} detalhe="Receitas menos despesas" tom={Number(atual.resultadoPeriodo) >= 0 ? "positivo" : "negativo"} />
          <CardKpi rotulo="Taxa de economia" valor={`${taxaEconomia.toFixed(1)}%`} detalhe="Do que entrou no mês" tom={taxaEconomia >= 0 ? "positivo" : "negativo"} />
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
          <article className="paper-card overflow-hidden rounded-2xl">
            <header className="border-b border-primary/7 px-4 py-4 sm:px-5"><h2 className="text-sm font-extrabold text-primary sm:text-base">Fluxo financeiro</h2><p className="mt-0.5 text-[.68rem] text-foreground-soft sm:text-xs">Receitas e despesas nos últimos seis meses</p></header>
            <div className="px-4 py-4 sm:px-5">{dados.historico.map((item) => <div key={item.inicio} className="grid grid-cols-[2.7rem_1fr] items-center gap-3 border-b border-primary/6 py-3 last:border-0"><span className="text-xs font-bold capitalize text-primary">{mesCurto.format(item.data).replace(".", "")}</span><div className="space-y-1.5"><div className="flex items-center gap-2"><div className="h-1.5 rounded-full bg-positive" style={{ width: `${Math.max((Number(item.resumo.totalReceitas) / maiorFluxo) * 100, 1)}%` }} /><span className="whitespace-nowrap text-[.58rem] font-semibold text-positive">{moeda.format(item.resumo.totalReceitas)}</span></div><div className="flex items-center gap-2"><div className="h-1.5 rounded-full bg-error/70" style={{ width: `${Math.max((Number(item.resumo.totalDespesas) / maiorFluxo) * 100, 1)}%` }} /><span className="whitespace-nowrap text-[.58rem] font-semibold text-error">{moeda.format(item.resumo.totalDespesas)}</span></div></div></div>)}</div>
          </article>

          <article className="overflow-hidden rounded-2xl bg-[#17201e] p-5 text-white shadow-[0_14px_35px_rgba(0,0,0,.1)]">
            <p className="text-[.65rem] font-bold uppercase tracking-[.14em] text-white/40">Leitura do mês</p><h2 className="mt-3 text-xl font-extrabold">Seu resultado em contexto.</h2>
            <div className="mt-6 border-t border-white/10 pt-5"><p className="text-xs text-white/45">Taxa de economia</p><p className={`mt-1 text-3xl font-extrabold ${taxaEconomia >= 0 ? "text-[#89ddb8]" : "text-[#f0a58e]"}`}>{taxaEconomia.toFixed(1)}%</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#89ddb8]" style={{ width: `${Math.min(Math.max(taxaEconomia, 0), 100)}%` }} /></div></div>
            <div className="mt-6 rounded-xl bg-white/6 p-4"><p className="text-[.65rem] font-bold uppercase tracking-wider text-white/35">Maior categoria de despesa</p><p className="mt-2 truncate text-sm font-bold">{principalCategoria?.categoriaNome ?? "Sem despesas no período"}</p>{principalCategoria && <p className="mt-1 text-lg font-extrabold text-[#f0c98a]">{moeda.format(principalCategoria.total)}</p>}</div>
            <Link href="/categorias" className="mt-5 flex items-center justify-between text-xs font-bold text-white/70">Ver composição completa <Icone nome="setaDireita" className="size-3.5" /></Link>
          </article>
        </section>
      </>}
    </main>
  );
}
