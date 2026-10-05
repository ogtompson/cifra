"use client";

import Link from "next/link";
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

function ModalRecorrencia({ recorrencia, contas, categorias, aoFechar, aoSalvar }) {
  const [formulario, setFormulario] = useState({
    descricao: recorrencia?.descricao ?? "",
    valor: recorrencia?.valor?.toString() ?? "",
    tipo: recorrencia?.tipo ?? "DESPESA",
    frequencia: recorrencia?.frequencia ?? "MENSAL",
    diaDoMes: recorrencia?.diaDoMes?.toString() ?? "",
    dataInicio: recorrencia?.dataInicio ?? new Date().toLocaleDateString("en-CA"),
    dataFim: recorrencia?.dataFim ?? "",
    ativa: recorrencia?.ativa ?? true,
    contaId: recorrencia?.contaId?.toString() ?? contas[0]?.id?.toString() ?? "",
    categoriaId: recorrencia?.categoriaId?.toString() ?? "",
  });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const categoriasCompativeis = categorias.filter((categoria) => categoria.tipo === formulario.tipo);

  function alterar(evento) {
    const { name, value } = evento.target;
    setFormulario((atual) => ({ ...atual, [name]: value, ...(name === "tipo" ? { categoriaId: "" } : {}), ...(name === "frequencia" && value !== "MENSAL" ? { diaDoMes: "" } : {}) }));
  }

  async function enviar(evento) {
    evento.preventDefault(); setErro(""); setSalvando(true);
    try {
      await aoSalvar({ ...formulario, valor: Number(formulario.valor), diaDoMes: formulario.frequencia === "MENSAL" ? Number(formulario.diaDoMes) : null, dataFim: formulario.dataFim || null, contaId: Number(formulario.contaId), categoriaId: Number(formulario.categoriaId) });
    } catch (error) { setErro(error.message); setSalvando(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/45 backdrop-blur-sm sm:items-center sm:p-6" role="presentation">
      <section className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-[2rem] sm:p-8" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-recorrencia">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-secondary">{recorrencia ? "Editar" : "Nova"} recorrência</p><h2 id="titulo-modal-recorrencia" className="mt-2 text-2xl font-extrabold tracking-tight text-primary">{recorrencia ? recorrencia.descricao : "Planeje uma vez. Repita sem esforço."}</h2></div><button type="button" onClick={aoFechar} className="grid size-10 place-items-center rounded-full bg-app-surface text-primary" aria-label="Fechar"><Icone nome="fechar" /></button></div>
        <form className="mt-7 space-y-5" onSubmit={enviar}>
          <fieldset><legend className="mb-2 text-sm font-bold text-primary">Movimentação</legend><div className="grid grid-cols-2 gap-3">{[{ valor: "DESPESA", rotulo: "Despesa" }, { valor: "RECEITA", rotulo: "Receita" }].map((tipo) => <label key={tipo.valor} className={`cursor-pointer rounded-xl border px-4 py-3.5 text-center text-sm font-bold transition ${formulario.tipo === tipo.valor ? (tipo.valor === "RECEITA" ? "border-positive bg-positive text-white" : "border-error bg-error text-white") : "border-primary/12 bg-background text-primary"}`}><input type="radio" name="tipo" value={tipo.valor} checked={formulario.tipo === tipo.valor} onChange={alterar} className="sr-only" />{tipo.rotulo}</label>)}</div></fieldset>
          <div className="grid gap-5 sm:grid-cols-[1.5fr_.5fr]"><label><span className="mb-2 block text-sm font-bold text-primary">Descrição</span><input className={campo} name="descricao" value={formulario.descricao} onChange={alterar} maxLength={150} required autoFocus placeholder="Ex.: Aluguel" /></label><label><span className="mb-2 block text-sm font-bold text-primary">Valor</span><input className={campo} name="valor" value={formulario.valor} onChange={alterar} type="number" min="0.01" step="0.01" required /></label></div>
          <div className="grid gap-5 sm:grid-cols-3"><label><span className="mb-2 block text-sm font-bold text-primary">Frequência</span><select className={campo} name="frequencia" value={formulario.frequencia} onChange={alterar}><option value="SEMANAL">Semanal</option><option value="MENSAL">Mensal</option><option value="ANUAL">Anual</option></select></label>{formulario.frequencia === "MENSAL" && <label><span className="mb-2 block text-sm font-bold text-primary">Dia do mês</span><input className={campo} name="diaDoMes" value={formulario.diaDoMes} onChange={alterar} type="number" min="1" max="31" required /></label>}<label><span className="mb-2 block text-sm font-bold text-primary">Data inicial</span><input className={campo} name="dataInicio" value={formulario.dataInicio} onChange={alterar} type="date" required /></label><label><span className="mb-2 block text-sm font-bold text-primary">Data final <small className="font-normal text-foreground-soft">(opcional)</small></span><input className={campo} name="dataFim" value={formulario.dataFim} onChange={alterar} min={formulario.dataInicio} type="date" /></label></div>
          <div className="grid gap-5 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-bold text-primary">Conta</span><select className={campo} name="contaId" value={formulario.contaId} onChange={alterar} required><option value="">Selecione</option>{contas.map((conta) => <option key={conta.id} value={conta.id}>{conta.nome}</option>)}</select></label><label><span className="mb-2 block text-sm font-bold text-primary">Categoria</span><select className={campo} name="categoriaId" value={formulario.categoriaId} onChange={alterar} required><option value="">Selecione</option>{categoriasCompativeis.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}</select></label></div>
          {!categoriasCompativeis.length && <p className="rounded-xl bg-accent/8 px-4 py-3 text-sm text-accent">Você ainda não possui uma categoria compatível. <Link href="/categorias" className="font-bold underline">Criar categoria</Link></p>}
          {erro && <p className="rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error" role="alert">{erro}</p>}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end"><button type="button" onClick={aoFechar} className="rounded-xl border border-primary/15 px-5 py-3 text-sm font-bold text-primary">Cancelar</button><button type="submit" disabled={salvando || !contas.length || !categoriasCompativeis.length} className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">{salvando ? "Salvando..." : recorrencia ? "Salvar alterações" : "Criar recorrência"}</button></div>
        </form>
      </section>
    </div>
  );
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
  const [modalAberto, setModalAberto] = useState(false);
  const [recorrenciaEditada, setRecorrenciaEditada] = useState(null);

  const carregar = useCallback(async () => { setCarregando(true); setErro(""); try { setDados(await buscarDados()); } catch (error) { setErro(`${error.message} Verifique se o backend está em execução.`); } finally { setCarregando(false); } }, []);
  useEffect(() => { let ativo = true; buscarDados().then((resultado) => ativo && setDados(resultado)).catch((error) => ativo && setErro(`${error.message} Verifique se o backend está em execução.`)).finally(() => ativo && setCarregando(false)); return () => { ativo = false; }; }, []);

  const filtradas = useMemo(() => dados.recorrencias.filter((item) => (!filtros.situacao || item.ativa === (filtros.situacao === "ATIVA")) && (!filtros.tipo || item.tipo === filtros.tipo)), [dados.recorrencias, filtros]);
  const totais = useMemo(() => ({ todas: dados.recorrencias.length, ativas: dados.recorrencias.filter((item) => item.ativa).length, pausadas: dados.recorrencias.filter((item) => !item.ativa).length }), [dados.recorrencias]);

  function abrirCriacao() { setRecorrenciaEditada(null); setModalAberto(true); }
  function abrirEdicao(item) { setRecorrenciaEditada(item); setModalAberto(true); }
  async function salvar(payload) { await apiFetch(recorrenciaEditada ? `/recorrencias/${recorrenciaEditada.id}` : "/recorrencias", { method: recorrenciaEditada ? "PUT" : "POST", body: JSON.stringify(payload) }); setModalAberto(false); setRecorrenciaEditada(null); await carregar(); }

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-secondary">O futuro também entra no planejamento</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-.035em] text-primary sm:text-4xl">Recorrências</h1><p className="mt-2 text-sm text-foreground-soft">Acompanhe os compromissos e receitas que se repetem.</p></div><button type="button" onClick={abrirCriacao} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,58,48,.16)]"><Icone nome="mais" className="size-4" /> Nova recorrência</button></div>
      <section className="gold-surface mt-7 grid gap-5 rounded-[1.6rem] border border-accent/10 px-6 py-6 sm:grid-cols-[1fr_auto] sm:items-center sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-accent">Rotina automatizada</p><p className="mt-2 max-w-xl text-xl font-extrabold text-primary">O Cifra cuida dos lançamentos repetidos para você não perder nenhum compromisso.</p></div><div className="flex gap-2"><div className="rounded-2xl bg-white/65 px-4 py-3 text-center"><strong className="block text-xl text-primary">{carregando ? "—" : totais.ativas}</strong><span className="text-[.68rem] text-foreground-soft">ativas</span></div><div className="rounded-2xl bg-white/65 px-4 py-3 text-center"><strong className="block text-xl text-primary">{carregando ? "—" : totais.pausadas}</strong><span className="text-[.68rem] text-foreground-soft">pausadas</span></div></div></section>
      <section className="paper-card mt-5 rounded-[1.5rem] p-4 sm:p-5"><div className="grid gap-3 sm:grid-cols-2"><select className={campo} value={filtros.situacao} onChange={(evento) => setFiltros((atual) => ({ ...atual, situacao: evento.target.value }))} aria-label="Filtrar por situação"><option value="">Todas ({totais.todas})</option><option value="ATIVA">Ativas ({totais.ativas})</option><option value="PAUSADA">Pausadas ({totais.pausadas})</option></select><select className={campo} value={filtros.tipo} onChange={(evento) => setFiltros((atual) => ({ ...atual, tipo: evento.target.value }))} aria-label="Filtrar por tipo"><option value="">Receitas e despesas</option><option value="RECEITA">Receitas</option><option value="DESPESA">Despesas</option></select></div></section>
      {erro && <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-error/20 bg-error/8 px-5 py-4 text-sm font-semibold text-error"><span>{erro}</span><button type="button" onClick={carregar} className="underline">Tentar novamente</button></div>}
      <section className="paper-card mt-5 overflow-hidden rounded-[1.5rem]">{carregando ? <div className="h-80 animate-pulse bg-primary/6" /> : filtradas.length ? filtradas.map((item) => <button type="button" key={item.id} onClick={() => abrirEdicao(item)} className="block w-full text-left transition hover:bg-primary/[.025]"><LinhaRecorrencia item={item} /></button>) : <div className="px-6 py-16 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/7 text-primary"><Icone nome="recorrencias" /></span><h2 className="mt-4 text-lg font-extrabold text-primary">Nenhuma recorrência encontrada</h2><p className="mt-2 text-sm text-foreground-soft">Os seus compromissos frequentes aparecerão aqui.</p><button type="button" onClick={abrirCriacao} className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">Nova recorrência</button></div>}</section>
      {modalAberto && <ModalRecorrencia recorrencia={recorrenciaEditada} contas={dados.contas} categorias={dados.categorias} aoFechar={() => setModalAberto(false)} aoSalvar={salvar} />}
    </main>
  );
}
