"use client";

import { useState } from "react";

const LARGURA = 640;
const ALTURA = 220;
const MARGEM = { esquerda: 18, direita: 18, topo: 28, base: 30 };

export default function GraficoComparativo({ dados, serieA, serieB, formatar, selecionado, aoSelecionar }) {
  const [foco, setFoco] = useState(null);
  const maior = Math.max(...dados.flatMap((item) => [Number(item[serieA.chave]), Number(item[serieB.chave])]), 1);
  const larguraUtil = LARGURA - MARGEM.esquerda - MARGEM.direita;
  const alturaUtil = ALTURA - MARGEM.topo - MARGEM.base;
  const coluna = larguraUtil / Math.max(dados.length, 1);
  const barra = Math.min(18, coluna * 0.25);
  const itemAtivo = foco === null ? null : dados[foco];

  function mudarFoco(evento) {
    const atual = foco ?? Math.max(dados.findIndex((item) => item.chave === selecionado), 0);
    const proximo = evento.key === "ArrowLeft" ? atual - 1 : evento.key === "ArrowRight" ? atual + 1 : evento.key === "Home" ? 0 : evento.key === "End" ? dados.length - 1 : null;
    if (evento.key === "Escape") setFoco(null);
    if (proximo === null) return;
    evento.preventDefault();
    setFoco(Math.max(0, Math.min(dados.length - 1, proximo)));
  }

  return (
    <div className="relative mt-5 outline-none focus-visible:ring-2 focus-visible:ring-secondary/25" role="group" tabIndex="0" aria-label="Comparação mensal. Use as setas para navegar e Enter para filtrar." onFocus={() => setFoco((atual) => atual ?? dados.length - 1)} onBlur={() => setFoco(null)} onKeyDown={(evento) => { mudarFoco(evento); if (evento.key === "Enter" && foco !== null) aoSelecionar(dados[foco].chave); }}>
      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="block h-auto w-full overflow-visible" onPointerLeave={(evento) => evento.pointerType === "mouse" && setFoco(null)}>
        {[0.25, 0.5, 0.75, 1].map((fracao) => {
          const y = MARGEM.topo + alturaUtil * (1 - fracao);
          return <line key={fracao} x1={MARGEM.esquerda} x2={LARGURA - MARGEM.direita} y1={y} y2={y} stroke="rgba(0,58,48,.07)" strokeDasharray="3 5" />;
        })}
        {dados.map((item, indice) => {
          const centro = MARGEM.esquerda + indice * coluna + coluna / 2;
          const alturaA = (Number(item[serieA.chave]) / maior) * alturaUtil;
          const alturaB = (Number(item[serieB.chave]) / maior) * alturaUtil;
          const apagado = foco !== null && foco !== indice;
          const ativo = foco === indice || selecionado === item.chave;
          return (
            <g key={item.chave} className="cursor-pointer transition-opacity" opacity={apagado ? 0.28 : 1} role="button" tabIndex="0" aria-label={`${item.rotulo}: ${serieA.rotulo} ${formatar(item[serieA.chave])}, ${serieB.rotulo} ${formatar(item[serieB.chave])}`} onPointerEnter={() => setFoco(indice)} onPointerDown={() => setFoco(indice)} onClick={() => aoSelecionar(item.chave)}>
              <rect x={centro - barra - 2} y={MARGEM.topo + alturaUtil - alturaA} width={barra} height={Math.max(alturaA, 2)} rx="4" fill={serieA.cor} fillOpacity={ativo ? 1 : 0.72} />
              <rect x={centro + 2} y={MARGEM.topo + alturaUtil - alturaB} width={barra} height={Math.max(alturaB, 2)} rx="4" fill={serieB.cor} fillOpacity={ativo ? 0.88 : 0.56} />
              <text x={centro} y={ALTURA - 7} textAnchor="middle" fontSize="10" fontWeight={ativo ? "800" : "650"} fill={ativo ? "#003a30" : "#65736f"}>{item.rotulo}</text>
            </g>
          );
        })}
      </svg>

      {itemAtivo && <div role="status" className="pointer-events-none absolute top-0 z-10 w-40 rounded-xl border border-primary/8 bg-white/95 p-3 shadow-[0_14px_35px_rgba(0,58,48,.16)] backdrop-blur" style={{ left: `${Math.min(Math.max(((foco + 0.5) / dados.length) * 100, 16), 84)}%`, transform: foco > dados.length / 2 ? "translateX(-100%)" : "none" }}><p className="text-[.6rem] font-extrabold uppercase tracking-[.1em] text-foreground-soft">{itemAtivo.rotuloCompleto}</p><div className="mt-2 flex items-center justify-between gap-3 text-[.65rem]"><span className="flex items-center gap-1.5 text-foreground-soft"><i className="size-2 rounded-full" style={{ background: serieA.cor }} />{serieA.rotulo}</span><strong className="text-primary">{formatar(itemAtivo[serieA.chave])}</strong></div><div className="mt-1.5 flex items-center justify-between gap-3 text-[.65rem]"><span className="flex items-center gap-1.5 text-foreground-soft"><i className="size-2 rounded-full" style={{ background: serieB.cor }} />{serieB.rotulo}</span><strong className="text-primary">{formatar(itemAtivo[serieB.chave])}</strong></div><div className="mt-2 flex items-center justify-between border-t border-primary/6 pt-2 text-[.62rem]"><span className="text-foreground-soft">Resultado</span><strong className={Number(itemAtivo[serieA.chave]) - Number(itemAtivo[serieB.chave]) >= 0 ? "text-positive" : "text-error"}>{formatar(Number(itemAtivo[serieA.chave]) - Number(itemAtivo[serieB.chave]))}</strong></div></div>}
    </div>
  );
}
