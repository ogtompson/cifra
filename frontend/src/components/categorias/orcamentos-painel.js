"use client";

import { useMemo, useState } from "react";
import { Icone } from "@/components/icons";
import { botaoPrimario, botaoSecundario, campo, Confirmacao, ModalPadrao, SelectCampo } from "@/components/ui";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

function rotuloMes(data) {
  const texto = nomeMes.format(data);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function ModalOrcamento({ orcamento, categoriaInicial, categorias, mesReferencia, aoFechar, aoSalvar }) {
  const [categoriaId, setCategoriaId] = useState(String(orcamento?.categoriaId ?? categoriaInicial?.id ?? ""));
  const [valor, setValor] = useState(orcamento?.valorLimite?.toString() ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      await aoSalvar(orcamento, { categoriaId: Number(categoriaId), mesReferencia, valorLimite: Number(valor) });
    } catch (error) {
      setErro(error.message);
      setSalvando(false);
    }
  }

  return (
    <ModalPadrao eyebrow={orcamento ? "Editar orçamento" : "Novo orçamento"} titulo="Defina um limite para o mês" aoFechar={aoFechar}>
      <form className="modal-body space-y-5" onSubmit={enviar}>
        <div className="rounded-xl bg-primary/[.035] px-4 py-3"><p className="text-xs font-bold text-foreground-soft">Mês de referência</p><p className="mt-1 text-sm font-extrabold text-primary">{rotuloMes(new Date(`${mesReferencia}T12:00:00`))}</p></div>
        <label className="block"><span className="mb-2 block text-sm font-bold text-primary">Categoria</span><SelectCampo valor={categoriaId} aoAlterar={setCategoriaId} opcoes={categorias.map((categoria) => ({ valor: String(categoria.id), rotulo: categoria.nome }))} rotulo="Categoria do orçamento" placeholder="Selecione uma categoria" obrigatorio desabilitado={Boolean(orcamento)} /></label>
        <label className="block"><span className="mb-2 block text-sm font-bold text-primary">Limite mensal</span><input className={campo} type="number" min="0.01" step="0.01" value={valor} onChange={(evento) => setValor(evento.target.value)} placeholder="0,00" required autoFocus /></label>
        {erro && <p className="rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error" role="alert">{erro}</p>}
        <div className="modal-footer"><button type="button" onClick={aoFechar} className={botaoSecundario}>Cancelar</button><button type="submit" disabled={salvando || !categoriaId} className={botaoPrimario}>{salvando ? "Salvando..." : "Salvar orçamento"}</button></div>
      </form>
    </ModalPadrao>
  );
}

function EstadoOrcamento({ item }) {
  const configuracao = item.status === "ESTOURADO"
    ? { texto: "Limite excedido", classe: "bg-error/9 text-error" }
    : item.status === "ATENCAO"
      ? { texto: "Atenção", classe: "bg-[#d39a52]/12 text-[#8a5a1e]" }
      : { texto: "No limite", classe: "bg-positive/9 text-positive" };
  return <span className={`rounded-full px-2.5 py-1 text-[.6rem] font-extrabold ${configuracao.classe}`}>{configuracao.texto}</span>;
}

export default function OrcamentosPainel({ categorias, orcamentos, referencia, aoMudarMes, aoSalvar, aoExcluir }) {
  const [modal, setModal] = useState(null);
  const [categoriaInicial, setCategoriaInicial] = useState(null);
  const [excluido, setExcluido] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const mesIso = `${referencia.getFullYear()}-${String(referencia.getMonth() + 1).padStart(2, "0")}-01`;
  const categoriasDisponiveis = useMemo(() => {
    const configuradas = new Set(orcamentos.map((item) => String(item.categoriaId)));
    return categorias.filter((categoria) => categoria.tipo === "DESPESA" && (!configuradas.has(String(categoria.id)) || String(categoria.id) === String(modal?.categoriaId)));
  }, [categorias, orcamentos, modal]);
  const totais = orcamentos.reduce((acc, item) => ({ limite: acc.limite + Number(item.valorLimite), gasto: acc.gasto + Number(item.gastoRealizado) }), { limite: 0, gasto: 0 });
  const disponivel = totais.limite - totais.gasto;

  function abrirNovo(categoria = null) { setCategoriaInicial(categoria); setModal({ novo: true }); }
  function fechar() { setModal(null); setCategoriaInicial(null); }
  async function salvar(orcamento, payload) { await aoSalvar(orcamento?.id, payload); fechar(); }
  async function confirmarExclusao() { setExcluindo(true); try { await aoExcluir(excluido.id); setExcluido(null); } finally { setExcluindo(false); } }

  return (
    <section className="paper-card mt-6 overflow-hidden rounded-[1.6rem]">
      <header className="flex flex-col gap-4 border-b border-primary/7 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div><h2 className="text-base font-extrabold text-primary">Orçamentos do mês</h2><p className="mt-0.5 text-xs text-foreground-soft">Limites para suas categorias de despesa.</p></div>
        <div className="flex flex-wrap items-center gap-2"><div className="flex min-h-10 items-center rounded-full border border-primary/10 bg-app-surface p-0.5"><button type="button" onClick={() => aoMudarMes(-1)} className="grid size-8 place-items-center rounded-full text-primary transition hover:bg-primary/6" aria-label="Mês anterior"><Icone nome="setaDireita" className="size-3.5 rotate-180" /></button><span className="min-w-36 px-2 text-center text-xs font-extrabold text-primary">{rotuloMes(referencia)}</span><button type="button" onClick={() => aoMudarMes(1)} className="grid size-8 place-items-center rounded-full text-primary transition hover:bg-primary/6" aria-label="Próximo mês"><Icone nome="setaDireita" className="size-3.5" /></button></div><button type="button" onClick={() => abrirNovo()} disabled={!categoriasDisponiveis.length} className={`${botaoPrimario} !min-h-10`}><Icone nome="mais" className="size-4" /> Definir limite</button></div>
      </header>

      <div className="grid border-b border-primary/7 sm:grid-cols-3 sm:divide-x sm:divide-primary/7"><div className="px-5 py-4"><p className="text-xs text-foreground-soft">Total planejado</p><p className="mt-1 text-lg font-extrabold text-primary">{moeda.format(totais.limite)}</p></div><div className="border-t border-primary/7 px-5 py-4 sm:border-t-0"><p className="text-xs text-foreground-soft">Gasto realizado</p><p className="mt-1 text-lg font-extrabold text-primary">{moeda.format(totais.gasto)}</p></div><div className="border-t border-primary/7 px-5 py-4 sm:border-t-0"><p className="text-xs text-foreground-soft">Disponível</p><p className={`mt-1 text-lg font-extrabold ${disponivel >= 0 ? "text-positive" : "text-error"}`}>{moeda.format(disponivel)}</p></div></div>

      {orcamentos.length ? <div className="divide-y divide-primary/6">{orcamentos.map((item) => { const progresso = Math.min(Math.max(Number(item.percentualUtilizado), 0), 100); return <article key={item.id} className="group grid gap-3 px-4 py-4 transition hover:bg-primary/[.02] sm:grid-cols-[minmax(12rem,1fr)_minmax(12rem,.9fr)_auto] sm:items-center sm:px-6"><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate text-sm font-extrabold text-primary">{item.categoriaNome}</h3><EstadoOrcamento item={item} /></div><p className="mt-1 text-xs text-foreground-soft">{moeda.format(item.gastoRealizado)} de {moeda.format(item.valorLimite)}</p></div><div><div className="h-2 overflow-hidden rounded-full bg-primary/7"><div className={`h-full rounded-full transition-all ${item.status === "ESTOURADO" ? "bg-error" : item.status === "ATENCAO" ? "bg-[#d39a52]" : "bg-secondary"}`} style={{ width: `${progresso}%` }} /></div><div className="mt-1.5 flex justify-between text-[.62rem] font-bold"><span className="text-foreground-soft">{Number(item.percentualUtilizado).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% usado</span><span className={Number(item.saldoDisponivel) >= 0 ? "text-positive" : "text-error"}>{Number(item.saldoDisponivel) >= 0 ? `${moeda.format(item.saldoDisponivel)} livres` : `${moeda.format(Math.abs(item.saldoDisponivel))} excedidos`}</span></div></div><div className="flex justify-end"><button type="button" onClick={() => setModal(item)} className="icon-action" aria-label={`Editar orçamento de ${item.categoriaNome}`}><Icone nome="editar" className="size-4" /></button><button type="button" onClick={() => setExcluido(item)} className="icon-action hover:!bg-error/8 hover:!text-error" aria-label={`Remover orçamento de ${item.categoriaNome}`}><Icone nome="excluir" className="size-4" /></button></div></article>; })}</div> : <div className="px-5 py-10 text-center"><span className="mx-auto grid size-11 place-items-center rounded-xl bg-primary/6 text-primary"><Icone nome="grafico" /></span><p className="mt-3 text-sm font-extrabold text-primary">Nenhum limite definido</p><p className="mt-1 text-xs text-foreground-soft">Comece pela categoria que mais pesa no mês.</p></div>}

      {categoriasDisponiveis.length > 0 && orcamentos.length > 0 && <div className="flex flex-wrap gap-2 border-t border-primary/7 bg-app-surface/45 px-4 py-3 sm:px-6"><span className="mr-1 self-center text-xs font-bold text-foreground-soft">Sem limite:</span>{categoriasDisponiveis.slice(0, 5).map((categoria) => <button key={categoria.id} type="button" onClick={() => abrirNovo(categoria)} className="rounded-full border border-primary/10 bg-white px-3 py-1.5 text-xs font-bold text-primary transition hover:border-secondary/30 hover:bg-secondary/5">+ {categoria.nome}</button>)}</div>}

      {modal && <ModalOrcamento orcamento={modal.novo ? null : modal} categoriaInicial={categoriaInicial} categorias={modal.novo ? categoriasDisponiveis : categorias.filter((item) => item.id === modal.categoriaId)} mesReferencia={mesIso} aoFechar={fechar} aoSalvar={salvar} />}
      {excluido && <Confirmacao titulo={`Remover orçamento de “${excluido.categoriaNome}”?`} descricao={`O limite será removido apenas de ${rotuloMes(referencia)}. As transações da categoria não serão alteradas.`} rotuloConfirmar="Remover limite" confirmando={excluindo} aoCancelar={() => setExcluido(null)} aoConfirmar={confirmarExclusao} />}
    </section>
  );
}
