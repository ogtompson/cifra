"use client";

import { useState } from "react";
import { Icone } from "@/components/icons";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function CartaoCreditoVisual({ cartao, selecionado, aoSelecionar, aoEditar, aoExcluir }) {
  const [virado, setVirado] = useState(false);
  const [sobCursor, setSobCursor] = useState(false);
  const mostrarVerso = virado || sobCursor;
  const percentual = Math.min((Number(cartao.limiteUtilizado) / Math.max(Number(cartao.limiteTotal), 1)) * 100, 100);

  function alternar() {
    aoSelecionar();
    setVirado((atual) => !atual);
  }

  function acionar(evento, acao) {
    evento.stopPropagation();
    acao();
  }

  return (
    <article
      className={`group relative aspect-[1.58/1] min-h-52 w-full cursor-pointer rounded-[1.55rem] outline-none [perspective:1200px] ${selecionado ? "ring-2 ring-[#d7aa68] ring-offset-2 ring-offset-background" : ""}`}
      onMouseEnter={() => setSobCursor(true)}
      onMouseLeave={() => setSobCursor(false)}
      data-flipped={mostrarVerso}
    >
      <div className={`relative size-full rounded-[1.55rem] transition-transform duration-700 ease-[cubic-bezier(.2,.75,.25,1)] [transform-style:preserve-3d] motion-reduce:duration-0 ${mostrarVerso ? "[transform:rotateY(180deg)]" : ""}`}>
        <div className="absolute inset-0 overflow-hidden rounded-[1.55rem] border border-white/10 bg-[linear-gradient(145deg,#064d42_0%,#003a30_58%,#002c27_100%)] p-5 text-white shadow-[0_18px_45px_rgba(0,58,48,.16)] [backface-visibility:hidden]" aria-hidden={mostrarVerso}>
          <button type="button" tabIndex={mostrarVerso ? -1 : 0} onClick={alternar} className="absolute inset-0 z-10 rounded-[1.55rem]" aria-label={`${cartao.nome}, final ${cartao.finalCartao}. Virar para ver detalhes.`} />
          <div className="pointer-events-none absolute -right-16 -top-20 size-52 rounded-full border border-white/[.07]" />
          <div className="pointer-events-none absolute -bottom-24 -left-14 size-48 rounded-full border border-[#d7aa68]/15" />
          <div className="relative flex h-full flex-col">
            <header className="flex items-start justify-between gap-4">
              <span className="relative block h-8 w-10 overflow-hidden rounded-lg border border-[#efd79d]/45 bg-[linear-gradient(135deg,#efd79d,#b78a43)] shadow-inner">
                <i className="absolute inset-x-0 top-1/2 border-t border-primary/25" />
                <i className="absolute inset-y-0 left-1/2 border-l border-primary/25" />
              </span>
              <div className="text-right"><p className="text-[.56rem] font-extrabold uppercase tracking-[.2em] text-white/40">Cifra</p><p className="mt-1 text-[.65rem] font-extrabold uppercase tracking-[.13em] text-[#efd79d]">{cartao.bandeira}</p></div>
            </header>

            <div className="my-auto">
              <p className="font-mono text-lg tracking-[.18em] text-white sm:text-xl">•••• •••• •••• {cartao.finalCartao}</p>
              <p className="mt-2 truncate text-xs font-bold text-white/65">{cartao.nome}</p>
            </div>

            <footer>
              <div className="flex items-end justify-between gap-4"><div><p className="text-[.55rem] font-bold uppercase tracking-[.13em] text-white/40">Disponível</p><p className="mt-1 text-sm font-extrabold text-white">{moeda.format(cartao.limiteDisponivel)}</p></div><p className="text-[.6rem] font-bold text-white/50">{percentual.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% utilizado</p></div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#d7aa68] transition-[width] duration-500" style={{ width: `${percentual}%` }} /></div>
            </footer>
          </div>
        </div>

        <div className="absolute inset-0 overflow-hidden rounded-[1.55rem] border border-primary/10 bg-[#f7f5ef] text-primary shadow-[0_18px_45px_rgba(0,58,48,.14)] [backface-visibility:hidden] [transform:rotateY(180deg)]" aria-hidden={!mostrarVerso}>
          <button type="button" tabIndex={mostrarVerso ? 0 : -1} onClick={alternar} className="absolute inset-0 z-0 rounded-[1.55rem]" aria-label={`${cartao.nome}. Virar para voltar à frente.`} />
          <div className="pointer-events-none h-10 bg-primary" />
          <div className="pointer-events-none relative z-10 flex h-[calc(100%_-_2.5rem)] flex-col p-5">
            <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-[.55rem] font-extrabold uppercase tracking-[.13em] text-foreground-soft">Conta de pagamento</p><p className="mt-1 truncate text-sm font-extrabold text-primary">{cartao.contaPagamentoNome}</p></div><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/[.06] text-secondary"><Icone nome="contas" className="size-4" /></span></div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-primary/8 pt-3"><div><p className="text-[.55rem] font-bold uppercase tracking-[.1em] text-foreground-soft">Fechamento</p><p className="mt-1 text-xs font-extrabold">Dia {cartao.diaFechamento}</p></div><div><p className="text-[.55rem] font-bold uppercase tracking-[.1em] text-foreground-soft">Vencimento</p><p className="mt-1 text-xs font-extrabold">Dia {cartao.diaVencimento}</p></div></div>
            <div className="mt-auto flex items-center justify-between gap-3"><p className="text-[.58rem] font-semibold text-foreground-soft">Clique para voltar</p><div className="pointer-events-auto flex gap-1"><button type="button" tabIndex={mostrarVerso ? 0 : -1} onClick={(evento) => acionar(evento, aoEditar)} className="icon-action" aria-label={`Editar ${cartao.nome}`}><Icone nome="editar" className="size-3.5" /></button><button type="button" tabIndex={mostrarVerso ? 0 : -1} onClick={(evento) => acionar(evento, aoExcluir)} className="icon-action hover:!bg-error/10 hover:!text-error" aria-label={`Excluir ${cartao.nome}`}><Icone nome="excluir" className="size-3.5" /></button></div></div>
          </div>
        </div>
      </div>
      {selecionado && <span className="pointer-events-none absolute -bottom-2 left-1/2 z-20 h-1 w-10 -translate-x-1/2 rounded-full bg-[#d7aa68]" aria-hidden="true" />}
    </article>
  );
}
