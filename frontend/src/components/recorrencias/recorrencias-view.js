"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icone } from "@/components/icons";
import { botaoPrimario, botaoSecundario, campo, Confirmacao, EsqueletoLista, FeedbackErro, FiltroSegmentado, ModalPadrao, Switch } from "@/components/ui";
import { apiFetch } from "@/lib/api";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const frequencias = { SEMANAL: "Semanal", MENSAL: "Mensal", ANUAL: "Anual" };

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
    <ModalPadrao eyebrow={`${recorrencia ? "Editar" : "Nova"} recorrência`} titulo={recorrencia ? recorrencia.descricao : "Planeje uma vez. Repita sem esforço."} aoFechar={aoFechar} tamanho="xl">
        <form className="modal-body space-y-5" onSubmit={enviar}>
          <fieldset><legend className="mb-2 text-sm font-bold text-primary">Movimentação</legend><div className="operation-switch">{[{ valor: "DESPESA", rotulo: "Despesa" }, { valor: "RECEITA", rotulo: "Receita" }].map((tipo) => <label key={tipo.valor} className={`operation-option ${formulario.tipo === tipo.valor ? (tipo.valor === "RECEITA" ? "is-positive" : "is-negative") : ""}`}><input type="radio" name="tipo" value={tipo.valor} checked={formulario.tipo === tipo.valor} onChange={alterar} className="sr-only" />{tipo.rotulo}</label>)}</div></fieldset>
          <div className="grid gap-5 sm:grid-cols-[1.5fr_.5fr]"><label><span className="mb-2 block text-sm font-bold text-primary">Descrição</span><input className={campo} name="descricao" value={formulario.descricao} onChange={alterar} maxLength={150} required autoFocus placeholder="Ex.: Aluguel" /></label><label><span className="mb-2 block text-sm font-bold text-primary">Valor</span><input className={campo} name="valor" value={formulario.valor} onChange={alterar} type="number" min="0.01" step="0.01" required /></label></div>
          <div className="grid gap-5 sm:grid-cols-3"><label><span className="mb-2 block text-sm font-bold text-primary">Frequência</span><select className={campo} name="frequencia" value={formulario.frequencia} onChange={alterar}><option value="SEMANAL">Semanal</option><option value="MENSAL">Mensal</option><option value="ANUAL">Anual</option></select></label>{formulario.frequencia === "MENSAL" && <label><span className="mb-2 block text-sm font-bold text-primary">Dia do mês</span><input className={campo} name="diaDoMes" value={formulario.diaDoMes} onChange={alterar} type="number" min="1" max="31" required /></label>}<label><span className="mb-2 block text-sm font-bold text-primary">Data inicial</span><input className={campo} name="dataInicio" value={formulario.dataInicio} onChange={alterar} type="date" required /></label><label><span className="mb-2 block text-sm font-bold text-primary">Data final <small className="font-normal text-foreground-soft">(opcional)</small></span><input className={campo} name="dataFim" value={formulario.dataFim} onChange={alterar} min={formulario.dataInicio} type="date" /></label></div>
          <div className="grid gap-5 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-bold text-primary">Conta</span><select className={campo} name="contaId" value={formulario.contaId} onChange={alterar} required><option value="">Selecione</option>{contas.map((conta) => <option key={conta.id} value={conta.id}>{conta.nome}</option>)}</select></label><label><span className="mb-2 block text-sm font-bold text-primary">Categoria</span><select className={campo} name="categoriaId" value={formulario.categoriaId} onChange={alterar} required><option value="">Selecione</option>{categoriasCompativeis.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}</select></label></div>
          {!categoriasCompativeis.length && <p className="rounded-xl bg-accent/8 px-4 py-3 text-sm text-accent">Você ainda não possui uma categoria compatível. <Link href="/categorias" className="font-bold underline">Criar categoria</Link></p>}
          {erro && <p className="rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error" role="alert">{erro}</p>}
          <div className="modal-footer"><button type="button" onClick={aoFechar} className={botaoSecundario}>Cancelar</button><button type="submit" disabled={salvando || !contas.length || !categoriasCompativeis.length} className={botaoPrimario}>{salvando ? "Salvando..." : recorrencia ? "Salvar alterações" : "Criar recorrência"}</button></div>
        </form>
    </ModalPadrao>
  );
}

function LinhaRecorrencia({ item, aoEditar, aoAlternar, aoExcluir }) {
  const proxima = proximaOcorrencia(item);
  const receita = item.tipo === "RECEITA";
  return (
    <article className="group grid grid-cols-2 gap-x-4 gap-y-3 border-b border-primary/6 px-4 py-3.5 transition-colors last:border-0 hover:bg-secondary/[0.025] lg:grid-cols-[minmax(12rem,1.4fr)_8rem_8rem_minmax(10rem,1fr)_auto] lg:items-center lg:px-6 lg:py-4">
      <div className="col-span-2 flex min-w-0 items-center gap-3 lg:col-span-1"><span className={`grid size-10 shrink-0 place-items-center rounded-xl lg:size-11 lg:rounded-2xl ${receita ? "bg-positive/10 text-positive" : "bg-error/8 text-error"}`}><Icone nome={receita ? "setaCima" : "setaBaixo"} className="size-4" /></span><div className="min-w-0"><h3 className="truncate text-sm font-extrabold text-primary">{item.descricao}</h3><p className="mt-0.5 truncate text-xs text-foreground-soft">{item.categoriaNome} · {item.contaNome}</p></div></div>
      <div><p className="text-[.65rem] font-bold uppercase tracking-wider text-foreground-soft lg:hidden">Valor</p><strong className={receita ? "text-positive" : "text-error"}>{receita ? "+" : "−"} {moeda.format(item.valor)}</strong></div>
      <div><p className="text-[.65rem] font-bold uppercase tracking-wider text-foreground-soft lg:hidden">Frequência</p><span className="text-sm font-semibold text-primary">{frequencias[item.frequencia]}</span></div>
      <div><p className="text-[.65rem] font-bold uppercase tracking-wider text-foreground-soft">Próxima ocorrência</p><span className="mt-1 block text-sm font-bold text-primary">{proxima ? dataCurta.format(proxima) : item.ativa ? "Ciclo encerrado" : "Pausada"}</span></div>
      <div className="flex items-center justify-end gap-1 lg:justify-start">
        <Switch selecionado={item.ativa} aoAlterar={() => aoAlternar(item)} rotulo={`${item.ativa ? "Pausar" : "Reativar"} ${item.descricao}`} />
        <button type="button" onClick={() => aoEditar(item)} className="icon-action" aria-label={`Editar ${item.descricao}`}><Icone nome="editar" className="size-3.5" /></button><button type="button" onClick={() => aoExcluir(item)} className="icon-action hover:!bg-error/10 hover:!text-error" aria-label={`Excluir ${item.descricao}`}><Icone nome="excluir" className="size-3.5" /></button>
      </div>
    </article>
  );
}

function GrupoRecorrencias({ titulo, descricao, itens, carregando, aoEditar, aoAlternar, aoExcluir, aoCriar }) {
  return (
    <section>
      <header className="mb-3 flex items-end justify-between gap-4 px-1">
        <div><h2 className="text-base font-extrabold text-primary">{titulo}</h2><p className="mt-0.5 text-xs text-foreground-soft">{descricao}</p></div>
        <span className="rounded-full bg-primary/6 px-2.5 py-1 text-[.68rem] font-extrabold text-primary">{itens.length}</span>
      </header>
      <div className="paper-card overflow-hidden rounded-[1.35rem]">
        {carregando ? <EsqueletoLista linhas={3} /> : itens.length ? itens.map((item) => <LinhaRecorrencia key={item.id} item={item} aoEditar={aoEditar} aoAlternar={aoAlternar} aoExcluir={aoExcluir} />) : (
          <div className="px-6 py-10 text-center"><p className="text-sm font-bold text-primary">Nenhum item aqui</p><p className="mt-1 text-xs text-foreground-soft">Crie uma recorrência para começar.</p><button type="button" onClick={aoCriar} className="mt-4 text-xs font-extrabold text-secondary hover:underline">Adicionar recorrência</button></div>
        )}
      </div>
    </section>
  );
}

export default function RecorrenciasView() {
  const [dados, setDados] = useState({ recorrencias: [], contas: [], categorias: [] });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [situacao, setSituacao] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [recorrenciaEditada, setRecorrenciaEditada] = useState(null);
  const [recorrenciaExcluida, setRecorrenciaExcluida] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregar = useCallback(async () => { setCarregando(true); setErro(""); try { setDados(await buscarDados()); } catch (error) { setErro(`${error.message} Verifique se o backend está em execução.`); } finally { setCarregando(false); } }, []);
  useEffect(() => { let ativo = true; buscarDados().then((resultado) => ativo && setDados(resultado)).catch((error) => ativo && setErro(`${error.message} Verifique se o backend está em execução.`)).finally(() => ativo && setCarregando(false)); return () => { ativo = false; }; }, []);

  const filtradas = useMemo(() => dados.recorrencias.filter((item) => !situacao || item.ativa === (situacao === "ATIVA")), [dados.recorrencias, situacao]);
  const separadas = useMemo(() => ({ DESPESA: filtradas.filter((item) => item.tipo === "DESPESA"), RECEITA: filtradas.filter((item) => item.tipo === "RECEITA") }), [filtradas]);
  const totais = useMemo(() => ({ todas: dados.recorrencias.length, ativas: dados.recorrencias.filter((item) => item.ativa).length, pausadas: dados.recorrencias.filter((item) => !item.ativa).length }), [dados.recorrencias]);
  const valoresAtivos = useMemo(() => dados.recorrencias.filter((item) => item.ativa).reduce((total, item) => ({ ...total, [item.tipo]: total[item.tipo] + Number(item.valor) }), { RECEITA: 0, DESPESA: 0 }), [dados.recorrencias]);
  const agenda = useMemo(() => dados.recorrencias.map((item) => ({ item, data: proximaOcorrencia(item) })).filter(({ data }) => data).sort((a, b) => a.data - b.data).slice(0, 4), [dados.recorrencias]);

  function abrirCriacao() { setRecorrenciaEditada(null); setModalAberto(true); }
  function abrirEdicao(item) { setRecorrenciaEditada(item); setModalAberto(true); }
  async function salvar(payload) { await apiFetch(recorrenciaEditada ? `/recorrencias/${recorrenciaEditada.id}` : "/recorrencias", { method: recorrenciaEditada ? "PUT" : "POST", body: JSON.stringify(payload) }); setModalAberto(false); setRecorrenciaEditada(null); await carregar(); }
  async function alternarSituacao(item) {
    setErro("");
    setDados((atual) => ({ ...atual, recorrencias: atual.recorrencias.map((recorrencia) => recorrencia.id === item.id ? { ...recorrencia, ativa: !item.ativa } : recorrencia) }));
    try {
      await apiFetch(`/recorrencias/${item.id}`, { method: "PUT", body: JSON.stringify({ descricao: item.descricao, valor: item.valor, tipo: item.tipo, frequencia: item.frequencia, diaDoMes: item.diaDoMes, dataInicio: item.dataInicio, dataFim: item.dataFim, ativa: !item.ativa, contaId: item.contaId, categoriaId: item.categoriaId }) });
    } catch (error) {
      setDados((atual) => ({ ...atual, recorrencias: atual.recorrencias.map((recorrencia) => recorrencia.id === item.id ? item : recorrencia) }));
      setErro(error.message);
    }
  }
  async function excluir() { setErro(""); setExcluindo(true); try { await apiFetch(`/recorrencias/${recorrenciaExcluida.id}`, { method: "DELETE" }); setRecorrenciaExcluida(null); await carregar(); } catch (error) { setErro(error.message); } finally { setExcluindo(false); } }

  return (
    <main className="page-shell">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="page-eyebrow">O futuro também entra no planejamento</p><h1 className="page-title">Recorrências</h1><p className="page-description">Acompanhe os compromissos e receitas que se repetem.</p></div><button type="button" onClick={abrirCriacao} className={botaoPrimario}><Icone nome="mais" className="size-4" /> Nova recorrência</button></div>

      <section className="mt-6 grid gap-4 lg:grid-cols-[.65fr_1.35fr]">
        <div className="balance-panel relative overflow-hidden rounded-2xl p-5 text-white">
          <div className="relative z-10"><p className="text-[.65rem] font-bold uppercase tracking-[.13em] text-white/55">Valores ativos cadastrados</p><div className="mt-5 grid grid-cols-2 gap-4"><div><span className="text-[.65rem] text-white/50">A receber</span><strong className="mt-1 block text-lg text-[#9ae4c1]">{moeda.format(valoresAtivos.RECEITA)}</strong></div><div><span className="text-[.65rem] text-white/50">A pagar</span><strong className="mt-1 block text-lg text-[#f2ae99]">{moeda.format(valoresAtivos.DESPESA)}</strong></div></div><p className="mt-5 text-[.65rem] leading-5 text-white/45">Os valores respeitam a frequência individual de cada recorrência.</p></div>
        </div>
        <div className="paper-card rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between"><div><h2 className="text-sm font-extrabold text-primary">Próximas ocorrências</h2><p className="mt-0.5 text-xs text-foreground-soft">Sua agenda financeira mais próxima</p></div><span className="grid size-9 place-items-center rounded-xl bg-secondary/8 text-secondary"><Icone nome="calendario" className="size-4" /></span></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">{agenda.length ? agenda.map(({ item, data }) => <div key={item.id} className="flex items-center gap-3 rounded-xl bg-primary/[0.035] px-3 py-2.5"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-center shadow-sm"><strong className="block text-xs text-primary">{data.getDate()}</strong></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-primary">{item.descricao}</p><p className="mt-0.5 text-[.62rem] capitalize text-foreground-soft">{dataCurta.format(data)}</p></div><strong className={`text-xs ${item.tipo === "RECEITA" ? "text-positive" : "text-error"}`}>{moeda.format(item.valor)}</strong></div>) : <p className="col-span-2 py-5 text-center text-xs text-foreground-soft">Nenhuma ocorrência ativa prevista.</p>}</div>
        </div>
      </section>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-primary/7 py-3">
        <p className="text-xs text-foreground-soft"><strong className="text-primary">{totais.ativas}</strong> ativas · <strong className="text-primary">{totais.pausadas}</strong> pausadas</p>
        <FiltroSegmentado rotulo="Situação das recorrências" valor={situacao} aoAlterar={setSituacao} opcoes={[{ valor: "", rotulo: `Todas (${totais.todas})` }, { valor: "ATIVA", rotulo: `Ativas (${totais.ativas})` }, { valor: "PAUSADA", rotulo: `Pausadas (${totais.pausadas})` }]} />
      </div>
      {erro && <FeedbackErro mensagem={erro} aoTentarNovamente={carregar} />}
      <div className="mt-6 grid gap-8 2xl:grid-cols-2">
        <GrupoRecorrencias titulo="Despesas recorrentes" descricao="Compromissos que se repetem" itens={separadas.DESPESA} carregando={carregando} aoEditar={abrirEdicao} aoAlternar={alternarSituacao} aoExcluir={setRecorrenciaExcluida} aoCriar={abrirCriacao} />
        <GrupoRecorrencias titulo="Receitas recorrentes" descricao="Valores previstos com frequência" itens={separadas.RECEITA} carregando={carregando} aoEditar={abrirEdicao} aoAlternar={alternarSituacao} aoExcluir={setRecorrenciaExcluida} aoCriar={abrirCriacao} />
      </div>
      {modalAberto && <ModalRecorrencia recorrencia={recorrenciaEditada} contas={dados.contas} categorias={dados.categorias} aoFechar={() => setModalAberto(false)} aoSalvar={salvar} />}
      {recorrenciaExcluida && <Confirmacao titulo={`Excluir “${recorrenciaExcluida.descricao}”?`} descricao="Os lançamentos já gerados permanecerão no histórico, mas novas ocorrências não serão criadas." confirmando={excluindo} aoCancelar={() => setRecorrenciaExcluida(null)} aoConfirmar={excluir} />}
    </main>
  );
}
