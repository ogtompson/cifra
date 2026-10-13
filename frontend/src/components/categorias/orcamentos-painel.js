"use client";

import { useMemo, useState } from "react";
import { Icone } from "@/components/icons";
import BudgetGuard from "@/components/ui/budget-guard";
import { botaoPrimario, botaoSecundario, campo, Confirmacao, ModalPadrao, SelectCampo } from "@/components/ui";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

function rotuloMes(data) {
  const texto = nomeMes.format(data);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function ModalOrcamento({ orcamento, categorias, mesReferencia, aoFechar, aoSalvar, aoExcluir }) {
  const [categoriaId, setCategoriaId] = useState(String(orcamento?.categoriaId ?? ""));
  const [valor, setValor] = useState(orcamento?.valorLimite?.toString() ?? "");
  const [salvando, setSalvando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      await aoSalvar(orcamento?.id, { categoriaId: Number(categoriaId), mesReferencia, valorLimite: Number(valor) });
      aoFechar();
    } catch (error) {
      setErro(error.message);
      setSalvando(false);
    }
  }

  async function excluir() {
    setExcluindo(true);
    try {
      await aoExcluir(orcamento.id);
      aoFechar();
    } catch (error) {
      setErro(error.message);
      setExcluindo(false);
      setConfirmandoExclusao(false);
    }
  }

  return (
    <>
      {!confirmandoExclusao && <ModalPadrao eyebrow={orcamento ? "Editar limite" : "Novo limite"} titulo="Planeje esta categoria" aoFechar={aoFechar} tamanho="sm">
        <form className="modal-body space-y-5" onSubmit={enviar}>
          <div className="rounded-xl bg-primary/[.035] px-4 py-3"><p className="text-[.65rem] font-bold text-foreground-soft">Mês de referência</p><p className="mt-1 text-sm font-extrabold text-primary">{rotuloMes(new Date(`${mesReferencia}T12:00:00`))}</p></div>
          <label className="block"><span className="mb-2 block text-sm font-bold text-primary">Categoria</span><SelectCampo valor={categoriaId} aoAlterar={setCategoriaId} opcoes={categorias.map((categoria) => ({ valor: String(categoria.id), rotulo: categoria.nome }))} rotulo="Categoria do orçamento" placeholder="Selecione uma categoria" obrigatorio desabilitado={Boolean(orcamento)} /></label>
          <label className="block"><span className="mb-2 block text-sm font-bold text-primary">Limite mensal</span><input className={campo} type="number" min="0.01" step="0.01" value={valor} onChange={(evento) => setValor(evento.target.value)} placeholder="0,00" required autoFocus={Boolean(orcamento)} /></label>
          {erro && <p className="rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error" role="alert">{erro}</p>}
          <div className="modal-footer">{orcamento && <button type="button" onClick={() => setConfirmandoExclusao(true)} className="mr-auto text-sm font-bold text-error transition hover:opacity-70">Remover limite</button>}<button type="button" onClick={aoFechar} className={botaoSecundario}>Cancelar</button><button type="submit" disabled={salvando || !categoriaId} className={botaoPrimario}>{salvando ? "Salvando..." : "Salvar limite"}</button></div>
        </form>
      </ModalPadrao>}
      {confirmandoExclusao && <Confirmacao titulo={`Remover limite de “${orcamento.categoriaNome}”?`} descricao={`O orçamento será removido apenas de ${rotuloMes(new Date(`${mesReferencia}T12:00:00`))}. As transações não serão alteradas.`} rotuloConfirmar="Remover limite" confirmando={excluindo} aoCancelar={() => setConfirmandoExclusao(false)} aoConfirmar={excluir} />}
    </>
  );
}

export default function OrcamentosPainel({ categorias, orcamentos, referencia, aoSalvar, aoExcluir }) {
  const [orcamentoAberto, setOrcamentoAberto] = useState(undefined);
  const mesReferencia = `${referencia.getFullYear()}-${String(referencia.getMonth() + 1).padStart(2, "0")}-01`;
  const categoriasDisponiveis = useMemo(() => {
    const configuradas = new Set(orcamentos.map((item) => String(item.categoriaId)));
    return categorias.filter((categoria) => categoria.tipo === "DESPESA" && (!configuradas.has(String(categoria.id)) || String(categoria.id) === String(orcamentoAberto?.categoriaId)));
  }, [categorias, orcamentos, orcamentoAberto]);
  const totais = orcamentos.reduce((total, item) => ({ limite: total.limite + Number(item.valorLimite), gasto: total.gasto + Number(item.gastoRealizado) }), { limite: 0, gasto: 0 });
  const disponivel = totais.limite - totais.gasto;
  const budgets = orcamentos.map((item) => ({ id: item.id, label: item.categoriaNome, textLabel: item.categoriaNome, used: Number(item.gastoRealizado), limit: Number(item.valorLimite), format: (valor) => moeda.format(valor), original: item }));

  return (
    <section className="paper-card mt-6 overflow-hidden rounded-[1.6rem]">
      <header className="flex flex-col gap-3 border-b border-primary/7 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div><h2 className="text-base font-extrabold text-primary">Orçamento do mês</h2><p className="mt-0.5 text-xs text-foreground-soft">Defina quanto pretende gastar em cada categoria.</p></div>
        <button type="button" onClick={() => setOrcamentoAberto(null)} disabled={!categoriasDisponiveis.length} className={`${botaoPrimario} !min-h-10 self-start sm:self-auto`}><Icone nome="mais" className="size-4" /> Definir limite</button>
      </header>
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-3 divide-x divide-primary/8 rounded-2xl border border-primary/8 bg-primary/[.018] py-3">
          <div className="min-w-0 px-3 sm:px-5"><p className="text-[.58rem] font-bold text-foreground-soft sm:text-[.65rem]">Planejado</p><strong className="mt-1 block truncate text-xs text-primary sm:text-base">{moeda.format(totais.limite)}</strong></div>
          <div className="min-w-0 px-3 sm:px-5"><p className="text-[.58rem] font-bold text-foreground-soft sm:text-[.65rem]">Realizado</p><strong className="mt-1 block truncate text-xs text-primary sm:text-base">{moeda.format(totais.gasto)}</strong></div>
          <div className="min-w-0 px-3 sm:px-5"><p className="text-[.58rem] font-bold text-foreground-soft sm:text-[.65rem]">Disponível</p><strong className={`mt-1 block truncate text-xs sm:text-base ${disponivel < 0 ? "text-error" : "text-positive"}`}>{moeda.format(disponivel)}</strong></div>
        </div>
        <BudgetGuard budgets={budgets} onSelect={(budget) => setOrcamentoAberto(budget.original)} className="mt-4" />
      </div>
      {orcamentoAberto !== undefined && <ModalOrcamento orcamento={orcamentoAberto} categorias={categoriasDisponiveis} mesReferencia={mesReferencia} aoFechar={() => setOrcamentoAberto(undefined)} aoSalvar={aoSalvar} aoExcluir={aoExcluir} />}
    </section>
  );
}
