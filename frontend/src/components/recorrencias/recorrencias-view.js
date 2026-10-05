"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icone } from "@/components/icons";
import { apiFetch } from "@/lib/api";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const frequencias = { SEMANAL: "Semanal", MENSAL: "Mensal", ANUAL: "Anual" };
const campo = "w-full rounded-xl border border-primary/15 bg-background px-4 py-3.5 text-sm outline-none transition focus:border-secondary focus:ring-3 focus:ring-secondary/10";

async function buscarDados() {
  const [recorrencias, contas, categorias] = await Promise.all([apiFetch("/recorrencias"), apiFetch("/contas"), apiFetch("/categorias")]);
  return { recorrencias, contas, categorias };
}

function criarData(iso) {
  return new Date(`${iso}T12:00:00`);
}

function proximaOcorrencia(item) {
  if (!item.ativa) return null;
  const atual = new Date();
  atual.setHours(12, 0, 0, 0);
  let proxima = criarData(item.dataInicio);

  if (item.frequencia === "SEMANAL") {
    while (proxima < atual) proxima.setDate(proxima.getDate() + 7);
  } else if (item.frequencia === "MENSAL") {
    proxima = new Date(atual.getFullYear(), atual.getMonth(), Math.min(item.diaDoMes, new Date(atual.getFullYear(), atual.getMonth() + 1, 0).getDate()), 12);
    if (proxima < atual) proxima = new Date(atual.getFullYear(), atual.getMonth() + 1, Math.min(item.diaDoMes, new Date(atual.getFullYear(), atual.getMonth() + 2, 0).getDate()), 12);
    if (proxima < criarData(item.dataInicio)) proxima = criarData(item.dataInicio);
  } else {
    const inicio = criarData(item.dataInicio);
    proxima = new Date(atual.getFullYear(), inicio.getMonth(), inicio.getDate(), 12);
    if (proxima < atual) proxima.setFullYear(proxima.getFullYear() + 1);
    if (proxima < inicio) proxima = inicio;
  }

  if (item.dataFim && proxima > criarData(item.dataFim)) return null;
  return proxima;
}

function LinhaRecorrencia({ item }) {
  const proxima = proximaOcorrencia(item);
  const receita = item.tipo === "RECEITA";
  return (
    <article className="grid gap-4 border-b border-primary/6 px-5 py-4 last:border-0 lg:grid-cols-[minmax(12rem,1.4fr)_8rem_8rem_minmax(10rem,1fr)_9rem] lg:items-center lg:px-6">
      <div className="flex min-w-0 items-center gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${receita ? "bg-positive/10 text-positive" : "bg-error/8 text-error"}`}><Icone nome={receita ? "setaCima" : "setaBaixo"} className="size-4" /></span><div className="min-w-0"><h3 className="truncate text-sm font-extrabold text-primary">{item.descricao}</h3><p className="mt-0.5 truncate text-xs text-foreground-soft">{item.categoriaNome} · {item.contaNome}</p></div></div>
      <div><p className="text-[.65rem] font-bold uppercase tracking-wider text-foreground-soft lg:hidden">Valor</p><strong className={receita ? "text-positive" : "text-error"}>{receita ? "+" : "−"} {moeda.format(item.valor)}</strong></div>
      <div><p className="text-[.65rem] font-bold uppercase tracking-wider text-foreground-soft lg:hidden">Frequência</p><span className="text-sm font-semibold text-primary">{frequencias[item.frequencia]}</span></div>
      <div><p className="text-[.65rem] font-bold uppercase tracking-wider text-foreground-soft">Próxima ocorrência</p><span className="mt-1 block text-sm font-bold text-primary">{proxima ? dataCurta.format(proxima) : item.ativa ? "Ciclo encerrado" : "Pausada"}</span></div>
      <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-extrabold ${item.ativa ? "bg-positive/10 text-positive" : "bg-primary/7 text-foreground-soft"}`}>{item.ativa ? "Ativa" : "Pausada"}</span>
    </article>
  );
}

export default function RecorrenciasView() {
  const [dados, setDados] = useState({ recorrencias: [], contas: [], categorias: [] });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [filtros, setFiltros] = useState({ situacao: "", tipo: "" });

  const carregar = useCallback(async () => { setCarregando(true); setErro(""); try { setDados(await buscarDados()); } catch (error) { setErro(`${error.message} Verifique se o backend está em execução.`); } finally { setCarregando(false); } }, []);
  useEffect(() => { let ativo = true; buscarDados().then((resultado) => ativo && setDados(resultado)).catch((error) => ativo && setErro(`${error.message} Verifique se o backend está em execução.`)).finally(() => ativo && setCarregando(false)); return () => { ativo = false; }; }, []);

  const filtradas = useMemo(() => dados.recorrencias.filter((item) => (!filtros.situacao || item.ativa === (filtros.situacao === "ATIVA")) && (!filtros.tipo || item.tipo === filtros.tipo)), [dados.recorrencias, filtros]);
  const totais = useMemo(() => ({ todas: dados.recorrencias.length, ativas: dados.recorrencias.filter((item) => item.ativa).length, pausadas: dados.recorrencias.filter((item) => !item.ativa).length }), [dados.recorrencias]);

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
      <div><p className="text-sm font-bold text-secondary">O futuro também entra no planejamento</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-.035em] text-primary sm:text-4xl">Recorrências</h1><p className="mt-2 text-sm text-foreground-soft">Acompanhe os compromissos e receitas que se repetem.</p></div>
      <section className="gold-surface mt-7 grid gap-5 rounded-[1.6rem] border border-accent/10 px-6 py-6 sm:grid-cols-[1fr_auto] sm:items-center sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-accent">Rotina automatizada</p><p className="mt-2 max-w-xl text-xl font-extrabold text-primary">O Cifra cuida dos lançamentos repetidos para você não perder nenhum compromisso.</p></div><div className="flex gap-2"><div className="rounded-2xl bg-white/65 px-4 py-3 text-center"><strong className="block text-xl text-primary">{carregando ? "—" : totais.ativas}</strong><span className="text-[.68rem] text-foreground-soft">ativas</span></div><div className="rounded-2xl bg-white/65 px-4 py-3 text-center"><strong className="block text-xl text-primary">{carregando ? "—" : totais.pausadas}</strong><span className="text-[.68rem] text-foreground-soft">pausadas</span></div></div></section>
      <section className="paper-card mt-5 rounded-[1.5rem] p-4 sm:p-5"><div className="grid gap-3 sm:grid-cols-2"><select className={campo} value={filtros.situacao} onChange={(evento) => setFiltros((atual) => ({ ...atual, situacao: evento.target.value }))} aria-label="Filtrar por situação"><option value="">Todas ({totais.todas})</option><option value="ATIVA">Ativas ({totais.ativas})</option><option value="PAUSADA">Pausadas ({totais.pausadas})</option></select><select className={campo} value={filtros.tipo} onChange={(evento) => setFiltros((atual) => ({ ...atual, tipo: evento.target.value }))} aria-label="Filtrar por tipo"><option value="">Receitas e despesas</option><option value="RECEITA">Receitas</option><option value="DESPESA">Despesas</option></select></div></section>
      {erro && <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-error/20 bg-error/8 px-5 py-4 text-sm font-semibold text-error"><span>{erro}</span><button type="button" onClick={carregar} className="underline">Tentar novamente</button></div>}
      <section className="paper-card mt-5 overflow-hidden rounded-[1.5rem]">{carregando ? <div className="h-80 animate-pulse bg-primary/6" /> : filtradas.length ? filtradas.map((item) => <LinhaRecorrencia key={item.id} item={item} />) : <div className="px-6 py-16 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/7 text-primary"><Icone nome="recorrencias" /></span><h2 className="mt-4 text-lg font-extrabold text-primary">Nenhuma recorrência encontrada</h2><p className="mt-2 text-sm text-foreground-soft">Os seus compromissos frequentes aparecerão aqui.</p></div>}</section>
    </main>
  );
}
