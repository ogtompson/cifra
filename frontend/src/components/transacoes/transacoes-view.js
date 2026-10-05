"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icone } from "@/components/icons";
import { apiFetch } from "@/lib/api";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataCompleta = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
const hoje = () => new Date().toLocaleDateString("en-CA");
const campo = "w-full rounded-xl border border-primary/15 bg-background px-4 py-3.5 text-sm outline-none transition focus:border-secondary focus:ring-3 focus:ring-secondary/10";

async function buscarDados() {
  const [transacoes, contas, categorias] = await Promise.all([apiFetch("/transacoes"), apiFetch("/contas"), apiFetch("/categorias")]);
  return { transacoes, contas, categorias };
}

function ModalTransacao({ transacao, contas, categorias, aoFechar, aoSalvar }) {
  const [formulario, setFormulario] = useState({
    descricao: transacao?.descricao ?? "",
    valor: transacao?.valor?.toString() ?? "",
    data: transacao?.data ?? hoje(),
    tipo: transacao?.tipo ?? "DESPESA",
    contaId: transacao?.contaId?.toString() ?? contas[0]?.id?.toString() ?? "",
    categoriaId: transacao?.categoriaId?.toString() ?? "",
  });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const categoriasCompativeis = categorias.filter((categoria) => categoria.tipo === formulario.tipo);

  function alterar(evento) {
    const { name, value } = evento.target;
    setFormulario((atual) => ({ ...atual, [name]: value, ...(name === "tipo" ? { categoriaId: "" } : {}) }));
  }

  async function enviar(evento) {
    evento.preventDefault(); setErro(""); setSalvando(true);
    try {
      await aoSalvar({ ...formulario, valor: Number(formulario.valor), contaId: Number(formulario.contaId), categoriaId: Number(formulario.categoriaId) });
    } catch (error) { setErro(error.message); setSalvando(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/45 backdrop-blur-sm sm:items-center sm:p-6" role="presentation">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-[2rem] sm:p-8" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-transacao">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-secondary">{transacao ? "Editar" : "Nova"} transação</p><h2 id="titulo-modal-transacao" className="mt-2 text-2xl font-extrabold tracking-tight text-primary">{transacao ? transacao.descricao : "Registre o que aconteceu"}</h2></div><button type="button" onClick={aoFechar} className="grid size-10 place-items-center rounded-full bg-app-surface text-primary transition hover:bg-primary/10" aria-label="Fechar"><Icone nome="fechar" /></button></div>
        <form className="mt-7 space-y-5" onSubmit={enviar}>
          <fieldset><legend className="mb-2 text-sm font-bold text-primary">Movimentação</legend><div className="grid grid-cols-2 gap-3">{[{ valor: "DESPESA", rotulo: "Despesa" }, { valor: "RECEITA", rotulo: "Receita" }].map((tipo) => <label key={tipo.valor} className={`cursor-pointer rounded-xl border px-4 py-3.5 text-center text-sm font-bold transition ${formulario.tipo === tipo.valor ? (tipo.valor === "RECEITA" ? "border-positive bg-positive text-white" : "border-error bg-error text-white") : "border-primary/12 bg-background text-primary hover:border-primary/30"}`}><input type="radio" name="tipo" value={tipo.valor} checked={formulario.tipo === tipo.valor} onChange={alterar} className="sr-only" />{tipo.rotulo}</label>)}</div></fieldset>
          <label className="block"><span className="mb-2 block text-sm font-bold text-primary">Descrição</span><input className={campo} name="descricao" value={formulario.descricao} onChange={alterar} maxLength={150} required autoFocus placeholder="Ex.: Supermercado" /></label>
          <div className="grid gap-5 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-bold text-primary">Valor</span><input className={campo} name="valor" value={formulario.valor} onChange={alterar} type="number" min="0.01" step="0.01" required placeholder="0,00" /></label><label><span className="mb-2 block text-sm font-bold text-primary">Data</span><input className={campo} name="data" value={formulario.data} onChange={alterar} type="date" required /></label></div>
          <div className="grid gap-5 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-bold text-primary">Conta</span><select className={campo} name="contaId" value={formulario.contaId} onChange={alterar} required><option value="">Selecione</option>{contas.map((conta) => <option key={conta.id} value={conta.id}>{conta.nome}</option>)}</select></label><label><span className="mb-2 block text-sm font-bold text-primary">Categoria</span><select className={campo} name="categoriaId" value={formulario.categoriaId} onChange={alterar} required><option value="">Selecione</option>{categoriasCompativeis.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}</select></label></div>
          {!categoriasCompativeis.length && <p className="rounded-xl bg-accent/8 px-4 py-3 text-sm text-accent">Você ainda não possui uma categoria de {formulario.tipo === "RECEITA" ? "receita" : "despesa"}. <Link href="/categorias" className="font-bold underline">Criar categoria</Link></p>}
          {erro && <p className="rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error" role="alert">{erro}</p>}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end"><button type="button" onClick={aoFechar} className="rounded-xl border border-primary/15 px-5 py-3 text-sm font-bold text-primary transition hover:bg-app-surface">Cancelar</button><button type="submit" disabled={salvando || !contas.length || !categoriasCompativeis.length} className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,58,48,.16)] transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-45">{salvando ? "Salvando..." : transacao ? "Salvar alterações" : "Criar transação"}</button></div>
        </form>
      </section>
    </div>
  );
}

function LinhaTransacao({ transacao, aoEditar, aoExcluir }) {
  const receita = transacao.tipo === "RECEITA";
  return (
    <article className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-primary/6 px-4 py-4 last:border-0 sm:grid-cols-[auto_minmax(0,1fr)_10rem_10rem_auto] sm:px-6">
      <span className={`grid size-10 place-items-center rounded-xl ${receita ? "bg-positive/10 text-positive" : "bg-error/8 text-error"}`}><Icone nome={receita ? "setaCima" : "setaBaixo"} className="size-4" /></span>
      <div className="min-w-0"><h3 className="truncate text-sm font-extrabold text-primary">{transacao.descricao}</h3><p className="mt-0.5 truncate text-xs text-foreground-soft sm:hidden">{transacao.categoriaNome} · {transacao.contaNome}</p>{transacao.recorrenciaId && <span className="mt-1 inline-block rounded-full bg-secondary/8 px-2 py-0.5 text-[.6rem] font-bold text-secondary">Recorrente</span>}</div>
      <p className="hidden truncate text-xs font-semibold text-foreground-soft sm:block">{transacao.categoriaNome}</p><p className="hidden truncate text-xs font-semibold text-foreground-soft sm:block">{transacao.contaNome}</p>
      <div className="flex items-center gap-1"><strong className={`mr-1 whitespace-nowrap text-sm ${receita ? "text-positive" : "text-error"}`}>{receita ? "+" : "−"} {moeda.format(transacao.valor)}</strong><button type="button" onClick={() => aoEditar(transacao)} className="grid size-8 place-items-center rounded-lg text-foreground-soft transition hover:bg-secondary/10 hover:text-secondary" aria-label={`Editar ${transacao.descricao}`}><Icone nome="editar" className="size-3.5" /></button><button type="button" onClick={() => aoExcluir(transacao)} className="grid size-8 place-items-center rounded-lg text-foreground-soft transition hover:bg-error/10 hover:text-error" aria-label={`Excluir ${transacao.descricao}`}><Icone nome="excluir" className="size-3.5" /></button></div>
    </article>
  );
}

export default function TransacoesView() {
  const [dados, setDados] = useState({ transacoes: [], contas: [], categorias: [] });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [transacaoEditada, setTransacaoEditada] = useState(null);
  const [filtros, setFiltros] = useState({ busca: "", conta: "", categoria: "", tipo: "" });

  const carregar = useCallback(async () => { setCarregando(true); setErro(""); try { setDados(await buscarDados()); } catch (error) { setErro(`${error.message} Verifique se o backend está em execução.`); } finally { setCarregando(false); } }, []);
  useEffect(() => { let ativo = true; buscarDados().then((resultado) => { if (ativo) { setDados(resultado); if (new URLSearchParams(window.location.search).get("nova") === "1") setModalAberto(true); } }).catch((error) => ativo && setErro(`${error.message} Verifique se o backend está em execução.`)).finally(() => ativo && setCarregando(false)); return () => { ativo = false; }; }, []);

  const filtradas = useMemo(() => dados.transacoes.filter((item) => (!filtros.busca || item.descricao.toLocaleLowerCase("pt-BR").includes(filtros.busca.toLocaleLowerCase("pt-BR"))) && (!filtros.conta || item.contaId === Number(filtros.conta)) && (!filtros.categoria || item.categoriaId === Number(filtros.categoria)) && (!filtros.tipo || item.tipo === filtros.tipo)), [dados.transacoes, filtros]);
  const agrupadas = useMemo(() => Object.entries(filtradas.reduce((grupos, item) => ({ ...grupos, [item.data]: [...(grupos[item.data] ?? []), item] }), {})).sort(([a], [b]) => b.localeCompare(a)), [filtradas]);
  const totais = useMemo(() => filtradas.reduce((total, item) => ({ ...total, [item.tipo]: total[item.tipo] + Number(item.valor) }), { RECEITA: 0, DESPESA: 0 }), [filtradas]);

  function abrirCriacao() { setTransacaoEditada(null); setModalAberto(true); }
  function abrirEdicao(item) { setTransacaoEditada(item); setModalAberto(true); }
  async function salvar(payload) { await apiFetch(transacaoEditada ? `/transacoes/${transacaoEditada.id}` : "/transacoes", { method: transacaoEditada ? "PUT" : "POST", body: JSON.stringify(payload) }); setModalAberto(false); setTransacaoEditada(null); await carregar(); }
  async function excluir(item) { if (!window.confirm(`Excluir a transação “${item.descricao}”?`)) return; setErro(""); try { await apiFetch(`/transacoes/${item.id}`, { method: "DELETE" }); await carregar(); } catch (error) { setErro(error.message); } }

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-secondary">Seu dinheiro em movimento</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-.035em] text-primary sm:text-4xl">Transações</h1><p className="mt-2 text-sm text-foreground-soft">Acompanhe tudo que entrou e saiu das suas contas.</p></div><button type="button" onClick={abrirCriacao} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,58,48,.16)] transition hover:-translate-y-0.5 hover:bg-secondary"><Icone nome="mais" className="size-4" /> Nova transação</button></div>

      <section className="mt-7 grid gap-4 sm:grid-cols-2"><div className="paper-card rounded-[1.4rem] p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.13em] text-foreground-soft">Entradas exibidas</p><p className="mt-2 text-2xl font-extrabold text-positive">{moeda.format(totais.RECEITA)}</p></div><span className="grid size-11 place-items-center rounded-2xl bg-positive/10 text-positive"><Icone nome="setaCima" /></span></div></div><div className="paper-card rounded-[1.4rem] p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.13em] text-foreground-soft">Saídas exibidas</p><p className="mt-2 text-2xl font-extrabold text-error">{moeda.format(totais.DESPESA)}</p></div><span className="grid size-11 place-items-center rounded-2xl bg-error/10 text-error"><Icone nome="setaBaixo" /></span></div></div></section>

      <section className="paper-card mt-5 rounded-[1.5rem] p-4 sm:p-5"><div className="grid gap-3 md:grid-cols-[minmax(14rem,1fr)_repeat(3,minmax(9rem,.45fr))]"><label className="relative"><span className="sr-only">Buscar</span><Icone nome="busca" className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground-soft" /><input value={filtros.busca} onChange={(evento) => setFiltros((atual) => ({ ...atual, busca: evento.target.value }))} placeholder="Buscar por descrição..." className={`${campo} pl-10`} /></label><select value={filtros.conta} onChange={(evento) => setFiltros((atual) => ({ ...atual, conta: evento.target.value }))} className={campo} aria-label="Filtrar por conta"><option value="">Todas as contas</option>{dados.contas.map((conta) => <option key={conta.id} value={conta.id}>{conta.nome}</option>)}</select><select value={filtros.categoria} onChange={(evento) => setFiltros((atual) => ({ ...atual, categoria: evento.target.value }))} className={campo} aria-label="Filtrar por categoria"><option value="">Todas as categorias</option>{dados.categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}</select><select value={filtros.tipo} onChange={(evento) => setFiltros((atual) => ({ ...atual, tipo: evento.target.value }))} className={campo} aria-label="Filtrar por tipo"><option value="">Todos os tipos</option><option value="RECEITA">Receitas</option><option value="DESPESA">Despesas</option></select></div></section>

      {erro && <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-error/20 bg-error/8 px-5 py-4 text-sm font-semibold text-error" role="alert"><span>{erro}</span><button type="button" onClick={carregar} className="shrink-0 underline underline-offset-4">Tentar novamente</button></div>}

      <section className="paper-card mt-5 overflow-hidden rounded-[1.5rem]">{carregando ? <div className="h-80 animate-pulse bg-primary/6" /> : agrupadas.length ? agrupadas.map(([data, itens]) => <div key={data}><header className="border-y border-primary/7 bg-app-surface/70 px-5 py-3 first:border-t-0 sm:px-6"><h2 className="text-xs font-extrabold capitalize text-primary">{dataCompleta.format(new Date(`${data}T12:00:00`))}</h2></header>{itens.map((item) => <LinhaTransacao key={item.id} transacao={item} aoEditar={abrirEdicao} aoExcluir={excluir} />)}</div>) : <div className="px-6 py-16 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/7 text-primary"><Icone nome="transacoes" /></span><h2 className="mt-4 text-lg font-extrabold text-primary">Nenhuma movimentação encontrada</h2><p className="mx-auto mt-2 max-w-md text-sm text-foreground-soft">Ajuste os filtros ou registre sua primeira receita ou despesa.</p><button type="button" onClick={abrirCriacao} className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">Nova transação</button></div>}</section>

      {modalAberto && <ModalTransacao transacao={transacaoEditada} contas={dados.contas} categorias={dados.categorias} aoFechar={() => setModalAberto(false)} aoSalvar={salvar} />}
    </main>
  );
}
