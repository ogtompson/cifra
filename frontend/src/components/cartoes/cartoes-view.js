"use client";

import { useCallback, useEffect, useState } from "react";
import { Icone } from "@/components/icons";
import {
  botaoPrimario,
  botaoSecundario,
  campo,
  Confirmacao,
  ErroFormulario,
  EsqueletoBloco,
  EsqueletoLista,
  EstadoVazio,
  FeedbackErro,
  ModalPadrao,
  NavegacaoMes,
  SelectCampo,
} from "@/components/ui";
import { apiFetch } from "@/lib/api";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const mesCurto = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" });
const agora = new Date();
const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
const bandeiras = ["Mastercard", "Visa", "Elo", "American Express", "Hipercard", "Outra"];

function inicioDoMes(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-01`;
}

function ModalCartao({ cartao, contas, aoFechar, aoSalvar }) {
  const [formulario, setFormulario] = useState({
    nome: cartao?.nome ?? "",
    bandeira: cartao?.bandeira ?? "Mastercard",
    finalCartao: cartao?.finalCartao ?? "",
    limiteTotal: cartao?.limiteTotal ?? "",
    diaFechamento: cartao?.diaFechamento ?? "",
    diaVencimento: cartao?.diaVencimento ?? "",
    contaPagamentoId: cartao?.contaPagamentoId ? String(cartao.contaPagamentoId) : "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function alterar(evento) {
    const { name, value } = evento.target;
    setFormulario((atual) => ({ ...atual, [name]: value }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      await aoSalvar({
        ...formulario,
        limiteTotal: Number(formulario.limiteTotal),
        diaFechamento: Number(formulario.diaFechamento),
        diaVencimento: Number(formulario.diaVencimento),
        contaPagamentoId: Number(formulario.contaPagamentoId),
      });
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalPadrao eyebrow={cartao ? "Editar cartão" : "Novo cartão"} titulo={cartao ? "Atualize os dados do cartão" : "Organize suas próximas faturas"} aoFechar={aoFechar} tamanho="lg">
      <form onSubmit={enviar} className="modal-body space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label><span className="mb-2 block text-sm font-bold text-primary">Nome</span><input className={campo} name="nome" value={formulario.nome} onChange={alterar} placeholder="Ex.: Nubank Ultravioleta" required /></label>
          <label><span className="mb-2 block text-sm font-bold text-primary">Bandeira</span><SelectCampo nome="bandeira" valor={formulario.bandeira} aoAlterar={(bandeira) => setFormulario((atual) => ({ ...atual, bandeira }))} opcoes={bandeiras.map((item) => ({ valor: item, rotulo: item }))} rotulo="Bandeira" obrigatorio /></label>
          <label><span className="mb-2 block text-sm font-bold text-primary">Final do cartão</span><input className={campo} name="finalCartao" value={formulario.finalCartao} onChange={alterar} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="1234" required /></label>
          <label><span className="mb-2 block text-sm font-bold text-primary">Limite total</span><input className={campo} name="limiteTotal" value={formulario.limiteTotal} onChange={alterar} type="number" min="0.01" step="0.01" placeholder="0,00" required /></label>
          <label><span className="mb-2 block text-sm font-bold text-primary">Fecha no dia</span><input className={campo} name="diaFechamento" value={formulario.diaFechamento} onChange={alterar} type="number" min="1" max="31" required /></label>
          <label><span className="mb-2 block text-sm font-bold text-primary">Vence no dia</span><input className={campo} name="diaVencimento" value={formulario.diaVencimento} onChange={alterar} type="number" min="1" max="31" required /></label>
        </div>
        <label className="block"><span className="mb-2 block text-sm font-bold text-primary">Conta de pagamento</span><SelectCampo nome="contaPagamentoId" valor={formulario.contaPagamentoId} aoAlterar={(contaPagamentoId) => setFormulario((atual) => ({ ...atual, contaPagamentoId }))} opcoes={contas.map((conta) => ({ valor: conta.id, rotulo: conta.nome }))} rotulo="Conta de pagamento" obrigatorio /></label>
        <ErroFormulario mensagem={erro} />
        <div className="modal-footer"><button type="button" onClick={aoFechar} className={botaoSecundario}>Cancelar</button><button type="submit" disabled={salvando || !contas.length} className={botaoPrimario}>{salvando ? "Salvando..." : cartao ? "Salvar alterações" : "Criar cartão"}</button></div>
      </form>
    </ModalPadrao>
  );
}

function ModalCompra({ compra, cartoes, categorias, cartaoInicial, aoFechar, aoSalvar }) {
  const [formulario, setFormulario] = useState({
    descricao: compra?.descricao ?? "",
    valorTotal: compra?.valorTotal ?? "",
    dataCompra: compra?.dataCompra ?? hoje,
    numeroParcelas: compra?.numeroParcelas ?? 1,
    cartaoId: compra?.cartaoId ? String(compra.cartaoId) : cartaoInicial ? String(cartaoInicial) : "",
    categoriaId: compra?.categoriaId ? String(compra.categoriaId) : "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function alterar(evento) {
    const { name, value } = evento.target;
    setFormulario((atual) => ({ ...atual, [name]: value }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      await aoSalvar({
        ...formulario,
        valorTotal: Number(formulario.valorTotal),
        numeroParcelas: Number(formulario.numeroParcelas),
        cartaoId: Number(formulario.cartaoId),
        categoriaId: Number(formulario.categoriaId),
      });
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setSalvando(false);
    }
  }

  const valorParcela = Number(formulario.valorTotal || 0) / Number(formulario.numeroParcelas || 1);

  return (
    <ModalPadrao eyebrow={compra ? "Editar compra" : "Nova compra"} titulo={compra ? "Revise a compra parcelada" : "Registre uma compra no cartão"} aoFechar={aoFechar} tamanho="lg">
      <form onSubmit={enviar} className="modal-body space-y-5">
        <label className="block"><span className="mb-2 block text-sm font-bold text-primary">Descrição</span><input className={campo} name="descricao" value={formulario.descricao} onChange={alterar} placeholder="Ex.: Notebook" required /></label>
        <div className="grid gap-5 sm:grid-cols-3">
          <label><span className="mb-2 block text-sm font-bold text-primary">Valor total</span><input className={campo} name="valorTotal" value={formulario.valorTotal} onChange={alterar} type="number" min="0.01" step="0.01" placeholder="0,00" required /></label>
          <label><span className="mb-2 block text-sm font-bold text-primary">Parcelas</span><input className={campo} name="numeroParcelas" value={formulario.numeroParcelas} onChange={alterar} type="number" min="1" max="48" required /></label>
          <label><span className="mb-2 block text-sm font-bold text-primary">Data da compra</span><input className={campo} name="dataCompra" value={formulario.dataCompra} onChange={alterar} type="date" required /></label>
        </div>
        {Number(formulario.valorTotal) > 0 && <p className="rounded-xl bg-primary/[0.035] px-4 py-3 text-xs text-foreground-soft"><strong className="text-primary">{formulario.numeroParcelas}× de {moeda.format(valorParcela)}</strong> · a primeira parcela será posicionada conforme o fechamento.</p>}
        <div className="grid gap-5 sm:grid-cols-2">
          <label><span className="mb-2 block text-sm font-bold text-primary">Cartão</span><SelectCampo nome="cartaoId" valor={formulario.cartaoId} aoAlterar={(cartaoId) => setFormulario((atual) => ({ ...atual, cartaoId }))} opcoes={cartoes.map((cartao) => ({ valor: cartao.id, rotulo: `${cartao.nome} · ${cartao.finalCartao}` }))} rotulo="Cartão" obrigatorio /></label>
          <label><span className="mb-2 block text-sm font-bold text-primary">Categoria</span><SelectCampo nome="categoriaId" valor={formulario.categoriaId} aoAlterar={(categoriaId) => setFormulario((atual) => ({ ...atual, categoriaId }))} opcoes={categorias.map((categoria) => ({ valor: categoria.id, rotulo: categoria.nome }))} rotulo="Categoria" obrigatorio /></label>
        </div>
        <ErroFormulario mensagem={erro} />
        <div className="modal-footer"><button type="button" onClick={aoFechar} className={botaoSecundario}>Cancelar</button><button type="submit" disabled={salvando || !cartoes.length || !categorias.length} className={botaoPrimario}>{salvando ? "Salvando..." : compra ? "Salvar alterações" : "Registrar compra"}</button></div>
      </form>
    </ModalPadrao>
  );
}

function CartaoVisual({ cartao, selecionado, aoSelecionar, aoEditar, aoExcluir }) {
  const percentual = Math.min((Number(cartao.limiteUtilizado) / Number(cartao.limiteTotal)) * 100, 100);
  return (
    <article className={`relative min-h-52 overflow-hidden rounded-[1.5rem] border p-5 text-white transition ${selecionado ? "border-[#dfb76e] bg-primary shadow-[0_16px_40px_rgba(0,58,48,.16)]" : "border-primary/8 bg-[#0b4a40] hover:border-[#dfb76e]/60"}`}>
      <button type="button" onClick={aoSelecionar} className="absolute inset-0 z-0" aria-label={`Ver fatura de ${cartao.nome}`} />
      <div className="pointer-events-none relative z-10 flex h-full min-h-42 flex-col">
        <div className="flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white/10"><Icone nome="cartoes" className="size-5 text-[#f0cf91]" /></span><span className="text-[.65rem] font-extrabold uppercase tracking-[.16em] text-white/55">{cartao.bandeira}</span></div>
        <div className="mt-auto"><p className="text-xs font-bold text-white/65">{cartao.nome}</p><p className="mt-1 font-mono text-lg tracking-[.16em]">•••• {cartao.finalCartao}</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#dfb76e]" style={{ width: `${percentual}%` }} /></div><div className="mt-2 flex justify-between text-[.62rem] text-white/55"><span>{moeda.format(cartao.limiteDisponivel)} livres</span><span>{percentual.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% usado</span></div></div>
      </div>
      <div className="absolute bottom-3 right-3 z-20 flex gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100"><button type="button" onClick={aoEditar} className="grid size-8 place-items-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white" aria-label={`Editar ${cartao.nome}`}><Icone nome="editar" className="size-3.5" /></button><button type="button" onClick={aoExcluir} className="grid size-8 place-items-center rounded-lg bg-white/10 text-white/70 hover:bg-error hover:text-white" aria-label={`Excluir ${cartao.nome}`}><Icone nome="excluir" className="size-3.5" /></button></div>
    </article>
  );
}

export default function CartoesView() {
  const [referencia, setReferencia] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [dados, setDados] = useState({ cartoes: [], contas: [], categorias: [], compras: [] });
  const [faturas, setFaturas] = useState([]);
  const [cartaoId, setCartaoId] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoFaturas, setCarregandoFaturas] = useState(false);
  const [erro, setErro] = useState("");
  const [modalCartao, setModalCartao] = useState(null);
  const [modalCompra, setModalCompra] = useState(null);
  const [exclusao, setExclusao] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [cartoes, contas, categorias, compras] = await Promise.all([
        apiFetch("/cartoes"), apiFetch("/contas"), apiFetch("/categorias"), apiFetch("/cartoes/compras"),
      ]);
      const cartoesOrdenados = cartoes ?? [];
      setDados({ cartoes: cartoesOrdenados, contas: (contas ?? []).filter((item) => !item.arquivada), categorias: (categorias ?? []).filter((item) => item.tipo === "DESPESA"), compras: compras ?? [] });
      setCartaoId((atual) => cartoesOrdenados.some((item) => item.id === atual) ? atual : cartoesOrdenados[0]?.id ?? null);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { Promise.resolve().then(carregar); }, [carregar]);

  useEffect(() => {
    if (!cartaoId) return;
    let ativo = true;
    apiFetch(`/cartoes/${cartaoId}/faturas?mesReferencia=${inicioDoMes(referencia)}&meses=6`)
      .then((resposta) => { if (ativo) setFaturas(resposta ?? []); })
      .catch((falha) => { if (ativo) setErro(falha.message); })
      .finally(() => { if (ativo) setCarregandoFaturas(false); });
    return () => { ativo = false; };
  }, [cartaoId, referencia]);

  const cartaoSelecionado = dados.cartoes.find((item) => item.id === cartaoId);
  const faturaAtual = faturas[0];
  const comprasDoCartao = dados.compras.filter((item) => item.cartaoId === cartaoId);
  const totalParcelado = comprasDoCartao.reduce((total, item) => total + Number(item.valorTotal), 0);

  async function salvarCartao(payload) {
    const editando = modalCartao?.id;
    await apiFetch(editando ? `/cartoes/${editando}` : "/cartoes", { method: editando ? "PUT" : "POST", body: JSON.stringify(payload) });
    setModalCartao(null);
    await carregar();
  }

  async function salvarCompra(payload) {
    const editando = modalCompra?.id;
    await apiFetch(editando ? `/cartoes/compras/${editando}` : "/cartoes/compras", { method: editando ? "PUT" : "POST", body: JSON.stringify(payload) });
    setModalCompra(null);
    setCartaoId(payload.cartaoId);
    await carregar();
  }

  async function confirmarExclusao() {
    setExcluindo(true);
    try {
      await apiFetch(exclusao.tipo === "cartao" ? `/cartoes/${exclusao.item.id}` : `/cartoes/compras/${exclusao.item.id}`, { method: "DELETE" });
      setExclusao(null);
      await carregar();
    } catch (falha) {
      setErro(falha.message);
      setExclusao(null);
    } finally {
      setExcluindo(false);
    }
  }

  const limitePercentual = cartaoSelecionado ? Math.min((Number(cartaoSelecionado.limiteUtilizado) / Number(cartaoSelecionado.limiteTotal)) * 100, 100) : 0;
  const podeComprar = dados.cartoes.length && dados.categorias.length;

  function mudarMes(direcao) {
    setCarregandoFaturas(true);
    setReferencia((atual) => new Date(atual.getFullYear(), atual.getMonth() + direcao, 1));
  }

  function selecionarCartao(id) {
    setCarregandoFaturas(true);
    setCartaoId(id);
  }

  function abrirCompetencia(data) {
    setCarregandoFaturas(true);
    setReferencia(new Date(`${data}T12:00:00`));
  }

  return (
    <main className="page-shell">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div><NavegacaoMes referencia={referencia} aoMudar={mudarMes} /><h1 className="page-title">Cartões</h1><p className="page-description">Faturas, limite disponível e parcelas futuras em um só lugar.</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setModalCartao({})} className={botaoSecundario}><Icone nome="mais" className="size-4" /> Novo cartão</button><button type="button" onClick={() => setModalCompra({})} disabled={!podeComprar} className={botaoPrimario}><Icone nome="mais" className="size-4" /> Nova compra</button></div>
      </header>

      {erro && <FeedbackErro mensagem={erro} aoTentarNovamente={carregar} />}

      {!erro && (carregando ? <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><EsqueletoBloco className="h-52" /><EsqueletoBloco className="h-52" /><EsqueletoBloco className="h-52" /></div> : dados.cartoes.length ? (
        <section className="content-enter mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{dados.cartoes.map((cartao) => <div className="group" key={cartao.id}><CartaoVisual cartao={cartao} selecionado={cartao.id === cartaoId} aoSelecionar={() => selecionarCartao(cartao.id)} aoEditar={() => setModalCartao(cartao)} aoExcluir={() => setExclusao({ tipo: "cartao", item: cartao })} /></div>)}</section>
      ) : <div className="paper-card mt-6 overflow-hidden rounded-2xl"><EstadoVazio icone="cartoes" titulo="Cadastre seu primeiro cartão" descricao="Informe limite, fechamento, vencimento e a conta usada para pagar a fatura." acao={<button type="button" onClick={() => setModalCartao({})} className={botaoPrimario}>Criar cartão</button>} /></div>)}

      {!erro && !carregando && cartaoSelecionado && (carregandoFaturas ? <div className="mt-5 grid gap-4 xl:grid-cols-[1.35fr_.65fr]"><EsqueletoBloco className="h-96" /><EsqueletoBloco className="h-96" /></div> : (
        <div className="content-enter mt-5 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
          <section className="paper-card overflow-hidden rounded-2xl">
            <header className="flex flex-col justify-between gap-3 border-b border-primary/7 px-5 py-5 sm:flex-row sm:items-end sm:px-6"><div><p className="text-xs font-bold text-foreground-soft">Fatura de {mesCurto.format(referencia)}</p><p className="mt-1 text-3xl font-extrabold tracking-tight text-primary">{moeda.format(faturaAtual?.total ?? 0)}</p></div><div className="flex gap-5 text-[.65rem] text-foreground-soft"><span>Fecha <strong className="block text-xs text-primary">{faturaAtual ? dataCurta.format(new Date(`${faturaAtual.dataFechamento}T12:00:00`)) : "—"}</strong></span><span>Vence <strong className="block text-xs text-primary">{faturaAtual ? dataCurta.format(new Date(`${faturaAtual.dataVencimento}T12:00:00`)) : "—"}</strong></span></div></header>
            {faturaAtual?.parcelas?.length ? <div className="divide-y divide-primary/6">{faturaAtual.parcelas.map((parcela) => <div key={`${parcela.compraId}-${parcela.parcela}`} className="interactive-row flex items-center gap-3 px-5 py-4 sm:px-6"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/[0.055] text-primary"><Icone nome="compras" className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-primary">{parcela.descricao}</p><p className="mt-0.5 text-[.65rem] text-foreground-soft">{parcela.categoriaNome} · {parcela.parcela}/{parcela.totalParcelas}</p></div><strong className="text-sm text-primary">{moeda.format(parcela.valor)}</strong></div>)}</div> : <EstadoVazio compacto icone="cartoes" titulo="Fatura sem lançamentos" descricao="Nenhuma parcela está prevista para este mês." />}
          </section>

          <aside className="space-y-4">
            <section className="paper-card rounded-2xl p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs text-foreground-soft">Limite disponível</p><p className="mt-1 text-2xl font-extrabold text-primary">{moeda.format(cartaoSelecionado.limiteDisponivel)}</p></div><span className="grid size-11 place-items-center rounded-xl bg-secondary/8 text-secondary"><Icone nome="cartoes" /></span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-primary/7"><div className="h-full rounded-full bg-secondary transition-all duration-500" style={{ width: `${limitePercentual}%` }} /></div><div className="mt-2 flex justify-between text-[.65rem] text-foreground-soft"><span>{moeda.format(cartaoSelecionado.limiteUtilizado)} utilizados</span><span>{moeda.format(cartaoSelecionado.limiteTotal)}</span></div></section>
            <section className="paper-card rounded-2xl p-5 sm:p-6"><p className="text-xs text-foreground-soft">Compras parceladas registradas</p><p className="mt-1 text-xl font-extrabold text-primary">{moeda.format(totalParcelado)}</p><p className="mt-2 text-[.65rem] leading-5 text-foreground-soft">{comprasDoCartao.length} {comprasDoCartao.length === 1 ? "compra" : "compras"} · pagamento pela conta {cartaoSelecionado.contaPagamentoNome}</p></section>
          </aside>

          <section className="paper-card overflow-hidden rounded-2xl xl:col-span-2"><header className="border-b border-primary/7 px-5 py-4 sm:px-6"><h2 className="text-base font-extrabold text-primary">Próximas faturas</h2><p className="mt-0.5 text-xs text-foreground-soft">Parcelas já assumidas nos próximos seis meses.</p></header><div className="grid divide-y divide-primary/7 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-6">{faturas.map((fatura, indice) => <button type="button" key={fatura.mesReferencia} onClick={() => indice && abrirCompetencia(fatura.mesReferencia)} className={`px-4 py-4 text-left transition hover:bg-secondary/[0.025] ${indice === 0 ? "bg-primary/[0.025]" : ""}`}><span className="text-[.62rem] font-bold capitalize text-foreground-soft">{mesCurto.format(new Date(`${fatura.mesReferencia}T12:00:00`))}</span><strong className="mt-1 block text-sm text-primary">{moeda.format(fatura.total)}</strong><span className="mt-1 block text-[.58rem] text-foreground-soft">{fatura.parcelas.length} {fatura.parcelas.length === 1 ? "parcela" : "parcelas"}</span></button>)}</div></section>

          <section className="paper-card overflow-hidden rounded-2xl xl:col-span-2"><header className="flex items-center justify-between border-b border-primary/7 px-5 py-4 sm:px-6"><div><h2 className="text-base font-extrabold text-primary">Compras do cartão</h2><p className="mt-0.5 text-xs text-foreground-soft">Histórico e parcelamentos cadastrados.</p></div><button type="button" onClick={() => setModalCompra({})} className="text-xs font-extrabold text-secondary">Adicionar</button></header>{comprasDoCartao.length ? <div className="divide-y divide-primary/6">{comprasDoCartao.map((compra) => <article key={compra.id} className="interactive-row flex items-center gap-3 px-5 py-4 sm:px-6"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/[0.055] text-primary"><Icone nome="compras" className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-primary">{compra.descricao}</p><p className="mt-0.5 text-[.65rem] text-foreground-soft">{compra.categoriaNome} · {compra.numeroParcelas}× de {moeda.format(compra.valorParcela)}</p></div><strong className="hidden text-sm text-primary sm:block">{moeda.format(compra.valorTotal)}</strong><div className="flex gap-0.5"><button type="button" onClick={() => setModalCompra(compra)} className="icon-action" aria-label={`Editar ${compra.descricao}`}><Icone nome="editar" className="size-3.5" /></button><button type="button" onClick={() => setExclusao({ tipo: "compra", item: compra })} className="icon-action hover:!bg-error/10 hover:!text-error" aria-label={`Excluir ${compra.descricao}`}><Icone nome="excluir" className="size-3.5" /></button></div></article>)}</div> : <EstadoVazio compacto icone="compras" titulo="Nenhuma compra neste cartão" descricao="Registre compras à vista ou parceladas para projetar as faturas." />}</section>
        </div>
      ))}

      {modalCartao && <ModalCartao cartao={modalCartao.id ? modalCartao : null} contas={dados.contas} aoFechar={() => setModalCartao(null)} aoSalvar={salvarCartao} />}
      {modalCompra && <ModalCompra compra={modalCompra.id ? modalCompra : null} cartoes={dados.cartoes} categorias={dados.categorias} cartaoInicial={cartaoId} aoFechar={() => setModalCompra(null)} aoSalvar={salvarCompra} />}
      {exclusao && <Confirmacao titulo={`Excluir “${exclusao.item.nome ?? exclusao.item.descricao}”?`} descricao={exclusao.tipo === "cartao" ? "O cartão só poderá ser excluído se não possuir compras vinculadas." : "A compra e todas as suas parcelas deixarão de aparecer nas faturas projetadas."} confirmando={excluindo} aoCancelar={() => setExclusao(null)} aoConfirmar={confirmarExclusao} />}
    </main>
  );
}
