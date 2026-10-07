"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icone } from "@/components/icons";
import { botaoPrimario, campo, EsqueletoLista, FeedbackErro, FiltroSegmentado } from "@/components/ui";
import { apiFetch } from "@/lib/api";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataCompleta = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
const hoje = () => new Date().toLocaleDateString("en-CA");

async function buscarDados() {
  const [transacoes, contas, categorias] = await Promise.all([apiFetch("/transacoes"), apiFetch("/contas"), apiFetch("/categorias")]);
  return { transacoes, contas, categorias };
}

function ModalTransacao({ transacao, contas, categorias, aoFechar, aoSalvar }) {
  const tipoInicial = transacao?.tipo
    ?? (categorias.some((categoria) => categoria.tipo === "DESPESA") ? "DESPESA" : categorias.some((categoria) => categoria.tipo === "RECEITA") ? "RECEITA" : "DESPESA");
  const [formulario, setFormulario] = useState({
    descricao: transacao?.descricao ?? "",
    valor: transacao?.valor?.toString() ?? "",
    data: transacao?.data ?? hoje(),
    tipo: tipoInicial,
    contaId: transacao?.contaId?.toString() ?? contas[0]?.id?.toString() ?? "",
    categoriaId: transacao?.categoriaId?.toString() ?? "",
  });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const categoriasCompativeis = categorias.filter((categoria) => categoria.tipo === formulario.tipo);
  const configuracaoCompleta = contas.length > 0 && categorias.length > 0;

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
        {!configuracaoCompleta ? (
          <div className="mt-7">
            <p className="text-sm leading-6 text-foreground-soft">Uma transação precisa estar vinculada a uma conta e a uma categoria. Complete os itens abaixo para continuar.</p>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/8 bg-app-surface p-4">
                <div className="flex items-center gap-3"><span className={`grid size-8 place-items-center rounded-full text-sm font-extrabold ${contas.length ? "bg-positive/10 text-positive" : "bg-primary/8 text-primary"}`}>{contas.length ? "✓" : "1"}</span><div><p className="text-sm font-bold text-primary">Conta financeira</p><p className="mt-0.5 text-xs text-foreground-soft">Define onde o valor entrou ou saiu.</p></div></div>
                {contas.length ? <span className="text-xs font-bold text-positive">Concluído</span> : <Link href="/contas" className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">Criar conta</Link>}
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/8 bg-app-surface p-4">
                <div className="flex items-center gap-3"><span className={`grid size-8 place-items-center rounded-full text-sm font-extrabold ${categorias.length ? "bg-positive/10 text-positive" : "bg-primary/8 text-primary"}`}>{categorias.length ? "✓" : "2"}</span><div><p className="text-sm font-bold text-primary">Categorias</p><p className="mt-0.5 text-xs text-foreground-soft">Organizam o lançamento nos relatórios.</p></div></div>
                {categorias.length ? <span className="text-xs font-bold text-positive">Concluído</span> : <Link href="/categorias" className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">Configurar</Link>}
              </div>
            </div>
            <button type="button" onClick={aoFechar} className="mt-6 w-full rounded-xl border border-primary/15 px-5 py-3 text-sm font-bold text-primary transition hover:bg-app-surface">Voltar às transações</button>
          </div>
        ) : <form className="mt-7 space-y-5" onSubmit={enviar}>
          <fieldset><legend className="mb-2 text-sm font-bold text-primary">Movimentação</legend><div className="grid grid-cols-2 gap-3">{[{ valor: "DESPESA", rotulo: "Despesa" }, { valor: "RECEITA", rotulo: "Receita" }].map((tipo) => <label key={tipo.valor} className={`cursor-pointer rounded-xl border px-4 py-3.5 text-center text-sm font-bold transition ${formulario.tipo === tipo.valor ? (tipo.valor === "RECEITA" ? "border-positive bg-positive text-white" : "border-error bg-error text-white") : "border-primary/12 bg-background text-primary hover:border-primary/30"}`}><input type="radio" name="tipo" value={tipo.valor} checked={formulario.tipo === tipo.valor} onChange={alterar} className="sr-only" />{tipo.rotulo}</label>)}</div></fieldset>
          {!categoriasCompativeis.length && <p className="rounded-xl border border-accent/10 bg-accent/8 px-4 py-3 text-sm text-accent">Ainda não há uma categoria de {formulario.tipo === "RECEITA" ? "receita" : "despesa"}. <Link href="/categorias" className="font-bold underline underline-offset-4">Criar categoria</Link></p>}
          <label className="block"><span className="mb-2 block text-sm font-bold text-primary">Descrição</span><input className={campo} name="descricao" value={formulario.descricao} onChange={alterar} maxLength={150} required autoFocus placeholder="Ex.: Supermercado" /></label>
          <div className="grid gap-5 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-bold text-primary">Valor</span><input className={campo} name="valor" value={formulario.valor} onChange={alterar} type="number" min="0.01" step="0.01" required placeholder="0,00" /></label><label><span className="mb-2 block text-sm font-bold text-primary">Data</span><input className={campo} name="data" value={formulario.data} onChange={alterar} type="date" required /></label></div>
          <div className="grid gap-5 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-bold text-primary">Conta</span><select className={campo} name="contaId" value={formulario.contaId} onChange={alterar} required><option value="">Selecione</option>{contas.map((conta) => <option key={conta.id} value={conta.id}>{conta.nome}</option>)}</select></label><label><span className="mb-2 block text-sm font-bold text-primary">Categoria</span><select className={campo} name="categoriaId" value={formulario.categoriaId} onChange={alterar} required><option value="">Selecione</option>{categoriasCompativeis.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}</select></label></div>
          {erro && <p className="rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error" role="alert">{erro}</p>}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end"><button type="button" onClick={aoFechar} className="rounded-xl border border-primary/15 px-5 py-3 text-sm font-bold text-primary transition hover:bg-app-surface">Cancelar</button><button type="submit" disabled={salvando || !contas.length || !categoriasCompativeis.length} className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,58,48,.16)] transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-45">{salvando ? "Salvando..." : transacao ? "Salvar alterações" : "Criar transação"}</button></div>
        </form>}
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
  const configuracaoCompleta = dados.contas.length > 0 && dados.categorias.length > 0;

  function abrirCriacao() { setTransacaoEditada(null); setModalAberto(true); }
  function abrirEdicao(item) { setTransacaoEditada(item); setModalAberto(true); }
  async function salvar(payload) { await apiFetch(transacaoEditada ? `/transacoes/${transacaoEditada.id}` : "/transacoes", { method: transacaoEditada ? "PUT" : "POST", body: JSON.stringify(payload) }); setModalAberto(false); setTransacaoEditada(null); await carregar(); }
  async function excluir(item) { if (!window.confirm(`Excluir a transação “${item.descricao}”?`)) return; setErro(""); try { await apiFetch(`/transacoes/${item.id}`, { method: "DELETE" }); await carregar(); } catch (error) { setErro(error.message); } }

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-secondary">Seu dinheiro em movimento</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-.035em] text-primary sm:text-4xl">Transações</h1><p className="mt-2 text-sm text-foreground-soft">Acompanhe tudo que entrou e saiu das suas contas.</p></div><button type="button" onClick={abrirCriacao} className={botaoPrimario}><Icone nome="mais" className="size-4" /> Nova transação</button></div>

      {!carregando && !configuracaoCompleta && <section className="mt-6 rounded-[1.5rem] border border-accent/15 bg-[#fbf5e9] p-5 sm:mt-7 sm:p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div><p className="text-xs font-bold uppercase tracking-[.13em] text-accent">Prepare o primeiro lançamento</p><h2 className="mt-2 text-lg font-extrabold text-primary">Falta pouco para começar</h2><p className="mt-1 text-sm text-foreground-soft">Toda transação precisa de uma conta e de uma categoria.</p></div>
          <div className="flex flex-wrap gap-2">
            {dados.contas.length ? <span className="rounded-full bg-positive/10 px-3 py-2 text-xs font-bold text-positive">✓ Conta criada</span> : <Link href="/contas" className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white">1. Criar conta</Link>}
            {dados.categorias.length ? <span className="rounded-full bg-positive/10 px-3 py-2 text-xs font-bold text-positive">✓ Categorias prontas</span> : <Link href="/categorias" className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white">2. Configurar categorias</Link>}
          </div>
        </div>
      </section>}

      <section className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-primary/7 py-3.5 text-xs sm:mt-7">
        <span className="text-foreground-soft">No resultado exibido</span>
        <span><strong className="text-positive">{moeda.format(totais.RECEITA)}</strong> <span className="text-foreground-soft">recebidos</span></span>
        <span><strong className="text-error">{moeda.format(totais.DESPESA)}</strong> <span className="text-foreground-soft">pagos</span></span>
        <span className="sm:ml-auto"><strong className={totais.RECEITA - totais.DESPESA >= 0 ? "text-positive" : "text-error"}>{moeda.format(totais.RECEITA - totais.DESPESA)}</strong> <span className="text-foreground-soft">resultado</span></span>
      </section>

      <section className="mt-5 rounded-[1.35rem] border border-primary/8 bg-white/55 p-3 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="relative min-w-0 flex-1"><span className="sr-only">Buscar</span><Icone nome="busca" className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground-soft" /><input value={filtros.busca} onChange={(evento) => setFiltros((atual) => ({ ...atual, busca: evento.target.value }))} placeholder="Buscar transação" className={`${campo} pl-10`} /></label>
          <FiltroSegmentado rotulo="Tipo de transação" valor={filtros.tipo} aoAlterar={(tipo) => setFiltros((atual) => ({ ...atual, tipo }))} opcoes={[{ valor: "", rotulo: "Todas" }, { valor: "RECEITA", rotulo: "Receitas" }, { valor: "DESPESA", rotulo: "Despesas" }]} />
          <div className="grid gap-2 sm:grid-cols-2 xl:w-[22rem]"><select value={filtros.conta} onChange={(evento) => setFiltros((atual) => ({ ...atual, conta: evento.target.value }))} className={campo} aria-label="Filtrar por conta"><option value="">Todas as contas</option>{dados.contas.map((conta) => <option key={conta.id} value={conta.id}>{conta.nome}</option>)}</select><select value={filtros.categoria} onChange={(evento) => setFiltros((atual) => ({ ...atual, categoria: evento.target.value }))} className={campo} aria-label="Filtrar por categoria"><option value="">Todas as categorias</option>{dados.categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}</select></div>
        </div>
      </section>

      {erro && <FeedbackErro mensagem={erro} aoTentarNovamente={carregar} />}

      <section className="paper-card mt-5 overflow-hidden rounded-[1.5rem]">{carregando ? <EsqueletoLista linhas={6} /> : agrupadas.length ? agrupadas.map(([data, itens]) => <div key={data}><header className="border-y border-primary/7 bg-app-surface/70 px-5 py-3 first:border-t-0 sm:px-6"><h2 className="text-xs font-extrabold capitalize text-primary">{dataCompleta.format(new Date(`${data}T12:00:00`))}</h2></header>{itens.map((item) => <LinhaTransacao key={item.id} transacao={item} aoEditar={abrirEdicao} aoExcluir={excluir} />)}</div>) : <div className="px-6 py-16 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/7 text-primary"><Icone nome="transacoes" /></span><h2 className="mt-4 text-lg font-extrabold text-primary">Nenhuma movimentação encontrada</h2><p className="mx-auto mt-2 max-w-md text-sm text-foreground-soft">Ajuste os filtros ou registre sua primeira receita ou despesa.</p><button type="button" onClick={abrirCriacao} className={`${botaoPrimario} mt-5`}>Nova transação</button></div>}</section>

      {modalAberto && <ModalTransacao transacao={transacaoEditada} contas={dados.contas} categorias={dados.categorias} aoFechar={() => setModalAberto(false)} aoSalvar={salvar} />}
    </main>
  );
}
