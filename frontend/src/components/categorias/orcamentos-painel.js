"use client";

import { useState } from "react";
import { botaoPrimario, botaoSecundario, campo, Confirmacao, ModalPadrao } from "@/components/ui";

const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

function rotuloMes(mesReferencia) {
  const texto = nomeMes.format(new Date(`${mesReferencia}T12:00:00`));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function ModalOrcamento({ categoria, orcamento, mesReferencia, aoFechar, aoSalvar, aoExcluir }) {
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
      await aoSalvar(orcamento?.id, { categoriaId: categoria.id, mesReferencia, valorLimite: Number(valor) });
      aoFechar();
    } catch (error) {
      setErro(error.message);
      setSalvando(false);
    }
  }

  async function excluir() {
    setExcluindo(true);
    setErro("");
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
      {!confirmandoExclusao && <ModalPadrao eyebrow={orcamento ? "Editar limite" : "Novo limite"} titulo={categoria.nome} aoFechar={aoFechar} tamanho="sm">
        <form className="modal-body space-y-5" onSubmit={enviar}>
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-primary/[.035] px-4 py-3">
            <div><p className="text-[.65rem] font-bold text-foreground-soft">Categoria</p><p className="mt-1 truncate text-sm font-extrabold text-primary">{categoria.nome}</p></div>
            <div><p className="text-[.65rem] font-bold text-foreground-soft">Mês de referência</p><p className="mt-1 text-sm font-extrabold text-primary">{rotuloMes(mesReferencia)}</p></div>
          </div>
          <label className="block"><span className="mb-2 block text-sm font-bold text-primary">Limite mensal</span><input className={campo} type="number" min="0.01" step="0.01" value={valor} onChange={(evento) => setValor(evento.target.value)} placeholder="0,00" required autoFocus /></label>
          {erro && <p className="rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error" role="alert">{erro}</p>}
          <div className="modal-footer">
            {orcamento && <button type="button" onClick={() => setConfirmandoExclusao(true)} className="mr-auto text-sm font-bold text-error transition hover:opacity-70">Remover limite</button>}
            <button type="button" onClick={aoFechar} className={botaoSecundario}>Cancelar</button>
            <button type="submit" disabled={salvando} className={botaoPrimario}>{salvando ? "Salvando..." : "Salvar limite"}</button>
          </div>
        </form>
      </ModalPadrao>}

      {confirmandoExclusao && <Confirmacao titulo={`Remover limite de “${categoria.nome}”?`} descricao={`O orçamento será removido apenas de ${rotuloMes(mesReferencia)}. As transações da categoria não serão alteradas.`} rotuloConfirmar="Remover limite" confirmando={excluindo} aoCancelar={() => setConfirmandoExclusao(false)} aoConfirmar={excluir} />}
    </>
  );
}
