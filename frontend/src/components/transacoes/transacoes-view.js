"use client";

import { useEffect, useMemo, useState } from "react";
import { Icone } from "@/components/icons";
import { apiFetch } from "@/lib/api";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataCompleta = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
const campo = "w-full rounded-xl border border-primary/15 bg-background px-4 py-3.5 text-sm outline-none transition focus:border-secondary focus:ring-3 focus:ring-secondary/10";

async function buscarDados() {
  const [transacoes, contas, categorias] = await Promise.all([apiFetch("/transacoes"), apiFetch("/contas"), apiFetch("/categorias")]);
  return { transacoes, contas, categorias };
}

function LinhaTransacao({ transacao }) {
  const receita = transacao.tipo === "RECEITA";
  return (
    <article className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-primary/6 px-4 py-4 last:border-0 sm:grid-cols-[auto_minmax(0,1fr)_10rem_10rem_auto] sm:px-6">
      <span className={`grid size-10 place-items-center rounded-xl ${receita ? "bg-positive/10 text-positive" : "bg-error/8 text-error"}`}><Icone nome={receita ? "setaCima" : "setaBaixo"} className="size-4" /></span>
      <div className="min-w-0"><h3 className="truncate text-sm font-extrabold text-primary">{transacao.descricao}</h3><p className="mt-0.5 truncate text-xs text-foreground-soft sm:hidden">{transacao.categoriaNome} · {transacao.contaNome}</p>{transacao.recorrenciaId && <span className="mt-1 inline-block rounded-full bg-secondary/8 px-2 py-0.5 text-[.6rem] font-bold text-secondary">Recorrente</span>}</div>
      <p className="hidden truncate text-xs font-semibold text-foreground-soft sm:block">{transacao.categoriaNome}</p><p className="hidden truncate text-xs font-semibold text-foreground-soft sm:block">{transacao.contaNome}</p>
      <strong className={`whitespace-nowrap text-sm ${receita ? "text-positive" : "text-error"}`}>{receita ? "+" : "−"} {moeda.format(transacao.valor)}</strong>
    </article>
  );
}

export default function TransacoesView() {
  const [dados, setDados] = useState({ transacoes: [], contas: [], categorias: [] });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [filtros, setFiltros] = useState({ busca: "", conta: "", categoria: "", tipo: "" });

  useEffect(() => { let ativo = true; buscarDados().then((resultado) => ativo && setDados(resultado)).catch((error) => ativo && setErro(`${error.message} Verifique se o backend está em execução.`)).finally(() => ativo && setCarregando(false)); return () => { ativo = false; }; }, []);
  const filtradas = useMemo(() => dados.transacoes.filter((item) => (!filtros.busca || item.descricao.toLocaleLowerCase("pt-BR").includes(filtros.busca.toLocaleLowerCase("pt-BR"))) && (!filtros.conta || item.contaId === Number(filtros.conta)) && (!filtros.categoria || item.categoriaId === Number(filtros.categoria)) && (!filtros.tipo || item.tipo === filtros.tipo)), [dados.transacoes, filtros]);
  const agrupadas = useMemo(() => Object.entries(filtradas.reduce((grupos, item) => ({ ...grupos, [item.data]: [...(grupos[item.data] ?? []), item] }), {})).sort(([a], [b]) => b.localeCompare(a)), [filtradas]);
  const totais = useMemo(() => filtradas.reduce((total, item) => ({ ...total, [item.tipo]: total[item.tipo] + Number(item.valor) }), { RECEITA: 0, DESPESA: 0 }), [filtradas]);

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
      <div><p className="text-sm font-bold text-secondary">Seu dinheiro em movimento</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-.035em] text-primary sm:text-4xl">Transações</h1><p className="mt-2 text-sm text-foreground-soft">Acompanhe tudo que entrou e saiu das suas contas.</p></div>
      <section className="mt-7 grid gap-4 sm:grid-cols-2"><div className="paper-card rounded-[1.4rem] p-5"><p className="text-xs font-bold uppercase tracking-[.13em] text-foreground-soft">Entradas exibidas</p><p className="mt-2 text-2xl font-extrabold text-positive">{moeda.format(totais.RECEITA)}</p></div><div className="paper-card rounded-[1.4rem] p-5"><p className="text-xs font-bold uppercase tracking-[.13em] text-foreground-soft">Saídas exibidas</p><p className="mt-2 text-2xl font-extrabold text-error">{moeda.format(totais.DESPESA)}</p></div></section>
      <section className="paper-card mt-5 rounded-[1.5rem] p-4 sm:p-5"><div className="grid gap-3 md:grid-cols-[minmax(14rem,1fr)_repeat(3,minmax(9rem,.45fr))]"><label className="relative"><span className="sr-only">Buscar</span><Icone nome="busca" className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground-soft" /><input value={filtros.busca} onChange={(evento) => setFiltros((atual) => ({ ...atual, busca: evento.target.value }))} placeholder="Buscar por descrição..." className={`${campo} pl-10`} /></label><select value={filtros.conta} onChange={(evento) => setFiltros((atual) => ({ ...atual, conta: evento.target.value }))} className={campo}><option value="">Todas as contas</option>{dados.contas.map((conta) => <option key={conta.id} value={conta.id}>{conta.nome}</option>)}</select><select value={filtros.categoria} onChange={(evento) => setFiltros((atual) => ({ ...atual, categoria: evento.target.value }))} className={campo}><option value="">Todas as categorias</option>{dados.categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}</select><select value={filtros.tipo} onChange={(evento) => setFiltros((atual) => ({ ...atual, tipo: evento.target.value }))} className={campo}><option value="">Todos os tipos</option><option value="RECEITA">Receitas</option><option value="DESPESA">Despesas</option></select></div></section>
      {erro && <div className="mt-5 rounded-2xl border border-error/20 bg-error/8 px-5 py-4 text-sm font-semibold text-error">{erro}</div>}
      <section className="paper-card mt-5 overflow-hidden rounded-[1.5rem]">{carregando ? <div className="h-80 animate-pulse bg-primary/6" /> : agrupadas.length ? agrupadas.map(([data, itens]) => <div key={data}><header className="border-y border-primary/7 bg-app-surface/70 px-5 py-3 first:border-t-0 sm:px-6"><h2 className="text-xs font-extrabold capitalize text-primary">{dataCompleta.format(new Date(`${data}T12:00:00`))}</h2></header>{itens.map((item) => <LinhaTransacao key={item.id} transacao={item} />)}</div>) : <div className="px-6 py-16 text-center"><h2 className="text-lg font-extrabold text-primary">Nenhuma movimentação encontrada</h2><p className="mt-2 text-sm text-foreground-soft">Ajuste os filtros para encontrar uma transação.</p></div>}</section>
    </main>
  );
}
