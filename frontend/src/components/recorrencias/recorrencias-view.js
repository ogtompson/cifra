"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Dialog, DialogTrigger, Popover } from "react-aria-components";
import { Icone } from "@/components/icons";
import { botaoPrimario, botaoSecundario, campo, Confirmacao, ErroFormulario, EsqueletoBloco, EsqueletoLista, EstadoVazio, FeedbackErro, FiltroSegmentado, ModalPadrao, NavegacaoMes, SelectCampo, Switch } from "@/components/ui";
import { apiFetch } from "@/lib/api";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const frequencias = { SEMANAL: "Semanal", MENSAL: "Mensal", ANUAL: "Anual" };
const diasSemana = ["D", "S", "T", "Q", "Q", "S", "S"];

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

function ocorrenciasNoMes(item, referencia) {
  if (!item.ativa) return [];
  const inicioMes = new Date(referencia.getFullYear(), referencia.getMonth(), 1, 12);
  const fimMes = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0, 12);
  const inicio = criarData(item.dataInicio);
  const fim = item.dataFim ? criarData(item.dataFim) : null;
  const dentroDoCiclo = (data) => data >= inicio && (!fim || data <= fim) && data >= inicioMes && data <= fimMes;

  if (item.frequencia === "MENSAL") {
    const dia = Math.min(item.diaDoMes, fimMes.getDate());
    const data = new Date(referencia.getFullYear(), referencia.getMonth(), dia, 12);
    return dentroDoCiclo(data) ? [data] : [];
  }

  if (item.frequencia === "ANUAL") {
    const data = new Date(referencia.getFullYear(), inicio.getMonth(), inicio.getDate(), 12);
    return dentroDoCiclo(data) ? [data] : [];
  }

  const datas = [];
  const data = new Date(inicio);
  while (data < inicioMes) data.setDate(data.getDate() + 7);
  while (data <= fimMes && (!fim || data <= fim)) {
    if (data >= inicio) datas.push(new Date(data));
    data.setDate(data.getDate() + 7);
  }
  return datas;
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
          <div className="grid gap-5 sm:grid-cols-3"><label><span className="mb-2 block text-sm font-bold text-primary">Frequência</span><SelectCampo nome="frequencia" valor={formulario.frequencia} aoAlterar={(frequencia) => setFormulario((atual) => ({ ...atual, frequencia, ...(frequencia !== "MENSAL" ? { diaDoMes: "" } : {}) }))} opcoes={[{ valor: "SEMANAL", rotulo: "Semanal" }, { valor: "MENSAL", rotulo: "Mensal" }, { valor: "ANUAL", rotulo: "Anual" }]} rotulo="Frequência" placeholder="Frequência" obrigatorio /></label>{formulario.frequencia === "MENSAL" && <label><span className="mb-2 block text-sm font-bold text-primary">Dia do mês</span><input className={campo} name="diaDoMes" value={formulario.diaDoMes} onChange={alterar} type="number" min="1" max="31" required /></label>}<label><span className="mb-2 block text-sm font-bold text-primary">Data inicial</span><input className={campo} name="dataInicio" value={formulario.dataInicio} onChange={alterar} type="date" required /></label><label><span className="mb-2 block text-sm font-bold text-primary">Data final <small className="font-normal text-foreground-soft">(opcional)</small></span><input className={campo} name="dataFim" value={formulario.dataFim} onChange={alterar} min={formulario.dataInicio} type="date" /></label></div>
          <div className="grid gap-5 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-bold text-primary">Conta</span><SelectCampo nome="contaId" valor={formulario.contaId} aoAlterar={(contaId) => setFormulario((atual) => ({ ...atual, contaId }))} opcoes={contas.map((conta) => ({ valor: conta.id, rotulo: conta.nome }))} rotulo="Conta" obrigatorio /></label><label><span className="mb-2 block text-sm font-bold text-primary">Categoria</span><SelectCampo nome="categoriaId" valor={formulario.categoriaId} aoAlterar={(categoriaId) => setFormulario((atual) => ({ ...atual, categoriaId }))} opcoes={categoriasCompativeis.map((categoria) => ({ valor: categoria.id, rotulo: categoria.nome }))} rotulo="Categoria" obrigatorio /></label></div>
          {!categoriasCompativeis.length && <p className="rounded-xl bg-accent/8 px-4 py-3 text-sm text-accent">Você ainda não possui uma categoria compatível. <Link href="/categorias" className="font-bold underline">Criar categoria</Link></p>}
          <ErroFormulario mensagem={erro} />
          <div className="modal-footer"><button type="button" onClick={aoFechar} className={botaoSecundario}>Cancelar</button><button type="submit" disabled={salvando || !contas.length || !categoriasCompativeis.length} className={botaoPrimario}>{salvando ? "Salvando..." : recorrencia ? "Salvar alterações" : "Criar recorrência"}</button></div>
        </form>
    </ModalPadrao>
  );
}

function LinhaRecorrencia({ item, aoEditar, aoAlternar, aoExcluir }) {
  const proxima = proximaOcorrencia(item);
  const receita = item.tipo === "RECEITA";
  return (
    <article className={`interactive-row group flex items-center gap-3 border-b border-primary/6 px-4 py-3 last:border-0 sm:px-5 ${item.ativa ? "" : "opacity-55"}`}>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/[0.055] text-[.65rem] font-extrabold text-primary">{proxima ? String(proxima.getDate()).padStart(2, "0") : "—"}</span>
      <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-extrabold text-primary">{item.descricao}</h3><p className="mt-0.5 truncate text-[.68rem] text-foreground-soft">{item.categoriaNome} · {frequencias[item.frequencia]} · {proxima ? dataCurta.format(proxima) : item.ativa ? "ciclo encerrado" : "pausada"}</p></div>
      <strong className={`hidden whitespace-nowrap text-xs sm:block ${receita ? "text-positive" : "text-primary"}`}>{receita ? "+" : "−"} {moeda.format(item.valor)}</strong>
      <Switch compacto selecionado={item.ativa} aoAlterar={() => aoAlternar(item)} rotulo={`${item.ativa ? "Pausar" : "Reativar"} ${item.descricao}`} />
      <div className="flex items-center gap-0.5"><button type="button" onClick={() => aoEditar(item)} className="icon-action" aria-label={`Editar ${item.descricao}`}><Icone nome="editar" className="size-3.5" /></button><button type="button" onClick={() => aoExcluir(item)} className="icon-action hover:!bg-error/10 hover:!text-error" aria-label={`Excluir ${item.descricao}`}><Icone nome="excluir" className="size-3.5" /></button></div>
    </article>
  );
}

function GrupoRecorrencias({ titulo, descricao, itens, carregando, aoEditar, aoAlternar, aoExcluir, aoCriar }) {
  return (
    <section>
      <header className="mb-3 flex items-end justify-between gap-4 px-1">
        <div><h2 className="text-base font-extrabold text-primary">{titulo}</h2><p className="mt-0.5 text-xs text-foreground-soft">{descricao}</p></div>
        {carregando ? <span className="skeleton h-6 w-8 rounded-full" /> : <span className="rounded-full bg-primary/6 px-2.5 py-1 text-[.68rem] font-extrabold text-primary">{itens.length}</span>}
      </header>
      <div className="paper-card min-h-24 overflow-hidden rounded-[1.35rem]">
        {carregando ? <EsqueletoLista linhas={3} /> : itens.length ? itens.map((item) => <LinhaRecorrencia key={item.id} item={item} aoEditar={aoEditar} aoAlternar={aoAlternar} aoExcluir={aoExcluir} />) : (
          <EstadoVazio compacto icone="recorrencias" titulo="Nenhuma recorrência aqui" descricao="Crie uma recorrência para começar." acao={<button type="button" onClick={aoCriar} className={botaoSecundario}>Adicionar recorrência</button>} />
        )}
      </div>
    </section>
  );
}

function DetalhesDia({ dia, referencia, itens, alinharDireita, aoFechar, aoEditar, aoAlternar, aoExcluir }) {
  const data = new Date(referencia.getFullYear(), referencia.getMonth(), dia, 12);
  const dataPorExtenso = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(data);
  const saldo = itens.reduce((total, item) => total + (item.tipo === "RECEITA" ? Number(item.valor) : -Number(item.valor)), 0);

  return (
    <Popover placement={alinharDireita ? "bottom end" : "bottom start"} offset={7} containerPadding={16} shouldFlip className="z-50 max-h-[calc(100dvh-2rem)] w-[min(19rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-primary/10 bg-white shadow-[0_20px_55px_rgba(0,58,48,.2)]" aria-label={`Detalhes de ${dataPorExtenso}`}>
      <Dialog className="outline-none">
      <header className="flex items-center gap-2.5 border-b border-primary/7 px-3 py-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/[0.08] text-xs font-extrabold text-primary">{String(dia).padStart(2, "0")}</span>
        <div className="min-w-0 flex-1"><h3 className="text-xs font-extrabold text-primary">{dataPorExtenso}</h3><p className="mt-0.5 text-[.58rem] text-foreground-soft">{itens.length} compromisso{itens.length === 1 ? "" : "s"} previsto{itens.length === 1 ? "" : "s"}</p></div>
        <button type="button" onClick={aoFechar} className="icon-action !size-8" aria-label="Fechar detalhes"><Icone nome="fechar" className="size-3.5" /></button>
      </header>

      {itens.length ? <div>{itens.map((item) => {
        const receita = item.tipo === "RECEITA";
        return (
          <article key={item.id} className="border-b border-primary/7 px-3 py-2.5 last:border-0">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold text-primary">{item.descricao}</p><p className="mt-0.5 truncate text-[.58rem] text-foreground-soft">{item.categoriaNome} · {item.contaNome}</p></div>
              <button type="button" onClick={() => aoEditar(item)} className="icon-action !size-8" aria-label={`Editar ${item.descricao}`}><Icone nome="editar" className="size-3.5" /></button>
              <button type="button" onClick={() => aoExcluir(item)} className="icon-action !size-8 hover:!bg-error/10 hover:!text-error" aria-label={`Excluir ${item.descricao}`}><Icone nome="excluir" className="size-3.5" /></button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3"><strong className={`text-[.68rem] ${receita ? "text-positive" : "text-primary"}`}>{receita ? "+" : "−"} {moeda.format(item.valor)}</strong><Switch compacto selecionado={item.ativa} aoAlterar={() => aoAlternar(item)} rotulo={`${item.ativa ? "Pausar" : "Reativar"} ${item.descricao}`} /></div>
          </article>
        );
      })}</div> : <EstadoVazio compacto icone="calendario" titulo="Nenhum compromisso neste dia" className="!min-h-0 !py-6" />}

      <footer className="flex items-center justify-between border-t border-primary/7 bg-primary/[0.025] px-3 py-2.5"><span className="text-[.6rem] text-foreground-soft">Saldo previsto do dia</span><strong className={`text-[.68rem] ${saldo > 0 ? "text-positive" : "text-primary"}`}>{saldo > 0 ? "+" : saldo < 0 ? "−" : ""} {moeda.format(Math.abs(saldo))}</strong></footer>
      </Dialog>
    </Popover>
  );
}

function CalendarioRecorrencias({ referencia, eventos, diaSelecionado, aoSelecionarDia, aoEditar, aoAlternar, aoExcluir }) {
  const hoje = new Date();
  const diasNoMes = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0).getDate();
  const primeiroDia = new Date(referencia.getFullYear(), referencia.getMonth(), 1).getDay();
  const celulas = [...Array(primeiroDia).fill(null), ...Array.from({ length: diasNoMes }, (_, indice) => indice + 1)];
  while (celulas.length % 7) celulas.push(null);

  return (
    <section className="paper-card mt-5 rounded-[1.5rem] p-4 sm:p-5">
      <header><h2 className="text-sm font-extrabold capitalize text-primary">Calendário de {nomeMes.format(referencia)}</h2><p className="mt-0.5 text-xs text-foreground-soft">Quando cada compromisso cai no mês</p></header>
      <div className="mt-4 flex items-center justify-end gap-4 text-[.62rem] text-foreground-soft"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-error" />Despesa</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#eab35c]" />Receita</span></div>
      <div className="mt-3 grid grid-cols-7 gap-1.5 sm:gap-2">
        {diasSemana.map((dia, indice) => <span key={`${dia}-${indice}`} className="py-1 text-center text-[.62rem] font-bold text-foreground-soft">{dia}</span>)}
        {celulas.map((dia, indice) => {
          const itens = dia ? eventos.get(dia) ?? [] : [];
          const atual = dia && hoje.getFullYear() === referencia.getFullYear() && hoje.getMonth() === referencia.getMonth() && hoje.getDate() === dia;
          const selecionado = dia === diaSelecionado;
          if (!dia) return <span key={indice} aria-hidden="true" />;
          const alinharDireita = indice % 7 >= 4;
          return (
            <DialogTrigger key={indice} isOpen={selecionado} onOpenChange={(aberto) => aoSelecionarDia(aberto ? dia : null)}>
              <Button className={`h-full min-h-16 w-full overflow-hidden rounded-xl border p-1.5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-secondary/45 sm:min-h-24 sm:p-2 ${atual ? `border-2 border-primary bg-primary/[0.035] shadow-[inset_0_0_0_1px_rgba(0,58,48,.08)] hover:bg-primary/[0.065] ${selecionado ? "ring-2 ring-secondary/45" : ""}` : selecionado ? "border-primary bg-primary/[0.09] shadow-[inset_0_0_0_1px_rgba(0,58,48,.18)]" : "border-transparent bg-primary/[0.045] hover:border-primary/15 hover:bg-primary/[0.065]"}`} aria-label={`Dia ${dia}${itens.length ? `, ${itens.length} compromisso${itens.length > 1 ? "s" : ""}` : ", sem compromissos"}`}>
                <span className="text-[.62rem] font-extrabold text-primary sm:text-xs">{dia}</span>
                {itens.length > 0 && <div className="mt-1 space-y-1">{itens.slice(0, 2).map((item) => <span key={`${item.id}-${dia}`} title={`${item.descricao}: ${moeda.format(item.valor)}`} className={`block truncate rounded-sm bg-white px-1 py-0.5 text-[.48rem] font-semibold shadow-[0_1px_3px_rgba(0,58,48,.08)] sm:text-[.58rem] ${item.tipo === "RECEITA" ? "text-positive" : "text-primary"}`}><span className="sm:hidden">{item.descricao}</span><span className="hidden sm:inline">{item.descricao} · {moeda.format(item.valor)}</span></span>)}{itens.length > 2 && <span className="block px-1 text-[.5rem] font-bold text-foreground-soft">+{itens.length - 2} compromissos</span>}</div>}
              </Button>
              <DetalhesDia dia={dia} referencia={referencia} itens={itens} alinharDireita={alinharDireita} aoFechar={() => aoSelecionarDia(null)} aoEditar={aoEditar} aoAlternar={aoAlternar} aoExcluir={aoExcluir} />
            </DialogTrigger>
          );
        })}
      </div>
      <p className="mt-3 text-[.6rem] leading-5 text-foreground-soft">Dias 29, 30 e 31 são ajustados para o último dia em meses mais curtos. Recorrências pausadas não aparecem no calendário.</p>
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
  const [mesReferencia, setMesReferencia] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12));
  const [diaSelecionado, setDiaSelecionado] = useState(null);

  const carregar = useCallback(async () => { setCarregando(true); setErro(""); try { setDados(await buscarDados()); } catch (error) { setErro(`${error.message} Verifique se o backend está em execução.`); } finally { setCarregando(false); } }, []);
  useEffect(() => { let ativo = true; buscarDados().then((resultado) => ativo && setDados(resultado)).catch((error) => ativo && setErro(`${error.message} Verifique se o backend está em execução.`)).finally(() => ativo && setCarregando(false)); return () => { ativo = false; }; }, []);

  const filtradas = useMemo(() => dados.recorrencias.filter((item) => !situacao || item.ativa === (situacao === "ATIVA")), [dados.recorrencias, situacao]);
  const separadas = useMemo(() => ({ DESPESA: filtradas.filter((item) => item.tipo === "DESPESA"), RECEITA: filtradas.filter((item) => item.tipo === "RECEITA") }), [filtradas]);
  const totais = useMemo(() => ({ todas: dados.recorrencias.length, ativas: dados.recorrencias.filter((item) => item.ativa).length, pausadas: dados.recorrencias.filter((item) => !item.ativa).length }), [dados.recorrencias]);
  const ocorrenciasMes = useMemo(() => dados.recorrencias.flatMap((item) => ocorrenciasNoMes(item, mesReferencia).map((data) => ({ item, data }))), [dados.recorrencias, mesReferencia]);
  const eventosCalendario = useMemo(() => ocorrenciasMes.reduce((mapa, { item, data }) => mapa.set(data.getDate(), [...(mapa.get(data.getDate()) ?? []), item]), new Map()), [ocorrenciasMes]);
  const resumoMes = useMemo(() => ocorrenciasMes.reduce((total, { item, data }) => ({ ...total, [item.tipo]: total[item.tipo] + Number(item.valor), PENDENTE: total.PENDENTE + (item.tipo === "DESPESA" && data >= new Date(new Date().setHours(0, 0, 0, 0)) ? Number(item.valor) : 0) }), { RECEITA: 0, DESPESA: 0, PENDENTE: 0 }), [ocorrenciasMes]);

  function abrirCriacao() { setRecorrenciaEditada(null); setModalAberto(true); }
  function abrirEdicao(item) { setRecorrenciaEditada(item); setModalAberto(true); }
  function mudarMes(deslocamento) { setMesReferencia((mes) => new Date(mes.getFullYear(), mes.getMonth() + deslocamento, 1, 12)); setDiaSelecionado(null); }
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
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><NavegacaoMes referencia={mesReferencia} aoMudar={mudarMes} /><h1 className="page-title">Recorrências</h1><p className="page-description">Contas fixas, assinaturas e entradas que se repetem todo mês.</p></div><button type="button" onClick={abrirCriacao} className={botaoPrimario}><Icone nome="mais" className="size-4" /> Nova recorrência</button></div>

      {erro && <FeedbackErro mensagem={erro} aoTentarNovamente={carregar} />}

      {!erro && (carregando ? <section className="mt-6 grid gap-3 md:grid-cols-3" aria-label="Carregando resumo de recorrências"><EsqueletoBloco className="h-28" /><EsqueletoBloco className="h-28" /><EsqueletoBloco className="h-28" /></section> : <section className="content-enter mt-6 grid gap-3 md:grid-cols-3">
        <article className="paper-card rounded-2xl p-4 sm:p-5"><p className="text-xs text-foreground-soft">Despesas fixas</p><strong className="mt-2 block text-xl text-primary">{moeda.format(resumoMes.DESPESA)}</strong><p className="mt-2 text-[.65rem] capitalize text-foreground-soft">{nomeMes.format(mesReferencia)}</p></article>
        <article className="paper-card rounded-2xl p-4 sm:p-5"><p className="text-xs text-foreground-soft">Receitas fixas</p><strong className="mt-2 block text-xl text-positive">{moeda.format(resumoMes.RECEITA)}</strong><p className="mt-2 text-[.65rem] text-foreground-soft">Salários, aportes e outras entradas</p></article>
        <article className="paper-card rounded-2xl p-4 sm:p-5"><p className="text-xs text-foreground-soft">Ainda a pagar em <span className="capitalize">{new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(mesReferencia)}</span></p><strong className="mt-2 block text-xl text-primary">{moeda.format(resumoMes.PENDENTE)}</strong><p className="mt-2 text-[.65rem] text-foreground-soft">Ocorrências ativas a partir de hoje</p></article>
      </section>)}

      {!erro && (carregando ? <EsqueletoBloco className="mt-5 h-[32rem]" /> : <div className="content-enter"><CalendarioRecorrencias referencia={mesReferencia} eventos={eventosCalendario} diaSelecionado={diaSelecionado} aoSelecionarDia={setDiaSelecionado} aoEditar={abrirEdicao} aoAlternar={alternarSituacao} aoExcluir={setRecorrenciaExcluida} /></div>)}

      {!erro && !carregando && <div className="content-enter mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-primary/7 py-3">
        <p className="text-xs text-foreground-soft"><strong className="text-primary">{totais.ativas}</strong> ativas · <strong className="text-primary">{totais.pausadas}</strong> pausadas</p>
        <FiltroSegmentado rotulo="Situação das recorrências" valor={situacao} aoAlterar={setSituacao} opcoes={[{ valor: "", rotulo: `Todas (${totais.todas})` }, { valor: "ATIVA", rotulo: `Ativas (${totais.ativas})` }, { valor: "PAUSADA", rotulo: `Pausadas (${totais.pausadas})` }]} />
      </div>}
      {!erro && <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <GrupoRecorrencias titulo="Despesas recorrentes" descricao="Compromissos que se repetem" itens={separadas.DESPESA} carregando={carregando} aoEditar={abrirEdicao} aoAlternar={alternarSituacao} aoExcluir={setRecorrenciaExcluida} aoCriar={abrirCriacao} />
        <GrupoRecorrencias titulo="Receitas recorrentes" descricao="Valores previstos com frequência" itens={separadas.RECEITA} carregando={carregando} aoEditar={abrirEdicao} aoAlternar={alternarSituacao} aoExcluir={setRecorrenciaExcluida} aoCriar={abrirCriacao} />
      </div>}
      {modalAberto && <ModalRecorrencia recorrencia={recorrenciaEditada} contas={dados.contas} categorias={dados.categorias} aoFechar={() => setModalAberto(false)} aoSalvar={salvar} />}
      {recorrenciaExcluida && <Confirmacao titulo={`Excluir “${recorrenciaExcluida.descricao}”?`} descricao="Os lançamentos já gerados permanecerão no histórico, mas novas ocorrências não serão criadas." confirmando={excluindo} aoCancelar={() => setRecorrenciaExcluida(null)} aoConfirmar={excluir} />}
    </main>
  );
}
