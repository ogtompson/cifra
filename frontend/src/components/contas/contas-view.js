"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icone } from "@/components/icons";
import { botaoPrimario, botaoSecundario, campo, EsqueletoLista, FeedbackErro } from "@/components/ui";
import { apiFetch } from "@/lib/api";

const tiposConta = [
  { valor: "CORRENTE", rotulo: "Conta corrente" },
  { valor: "POUPANCA", rotulo: "Poupança" },
  { valor: "DINHEIRO", rotulo: "Dinheiro" },
  { valor: "INVESTIMENTO", rotulo: "Investimento" },
];

const formatoMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function rotuloTipo(tipo) {
  return tiposConta.find((item) => item.valor === tipo)?.rotulo ?? tipo;
}

async function buscarContas() {
  const lista = await apiFetch("/contas?incluirArquivadas=true");
  const saldos = await Promise.all(
    lista.map((conta) => apiFetch(`/contas/${conta.id}/saldo`)),
  );
  return lista.map((conta, indice) => ({ ...conta, ...saldos[indice] }));
}

function ModalConta({ conta, aoFechar, aoSalvar }) {
  const [formulario, setFormulario] = useState({
    nome: conta?.nome ?? "",
    saldoInicial: conta?.saldoInicial?.toString() ?? "0.00",
    tipo: conta?.tipo ?? "CORRENTE",
  });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function alterar(evento) {
    const { name, value } = evento.target;
    setFormulario((atual) => ({ ...atual, [name]: value }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      await aoSalvar({
        nome: formulario.nome.trim(),
        saldoInicial: Number(formulario.saldoInicial),
        tipo: formulario.tipo,
      });
    } catch (error) {
      setErro(error.message);
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/45 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="presentation">
      <section className="w-full max-w-lg rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-[2rem] sm:p-8" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-conta">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">{conta ? "Editar" : "Nova"} conta</p>
            <h2 id="titulo-modal-conta" className="mt-2 text-2xl font-extrabold tracking-tight text-primary">
              {conta ? conta.nome : "Organize seu dinheiro"}
            </h2>
          </div>
          <button type="button" onClick={aoFechar} className="grid size-10 place-items-center rounded-full bg-app-surface text-primary transition hover:bg-primary/10" aria-label="Fechar">
            <Icone nome="fechar" />
          </button>
        </div>

        <form className="mt-7 space-y-5" onSubmit={enviar}>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-primary">Nome</span>
            <input name="nome" value={formulario.nome} onChange={alterar} maxLength={100} required autoFocus placeholder="Ex.: Conta principal" className={campo} />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-primary">Saldo inicial</span>
              <input name="saldoInicial" value={formulario.saldoInicial} onChange={alterar} type="number" step="0.01" required className={campo} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-primary">Tipo</span>
              <select name="tipo" value={formulario.tipo} onChange={alterar} className={campo}>
                {tiposConta.map((tipo) => <option key={tipo.valor} value={tipo.valor}>{tipo.rotulo}</option>)}
              </select>
            </label>
          </div>

          {erro && <p className="rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error" role="alert">{erro}</p>}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={aoFechar} className={botaoSecundario}>Cancelar</button>
            <button type="submit" disabled={salvando} className={botaoPrimario}>
              {salvando ? "Salvando..." : conta ? "Salvar alterações" : "Criar conta"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ModalExclusaoConta({ impacto, aoFechar, aoConfirmar, aoArquivar }) {
  const [confirmado, setConfirmado] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [arquivando, setArquivando] = useState(false);
  const [erro, setErro] = useState("");
  const possuiHistorico = !impacto.podeExcluirDiretamente;

  async function confirmar() {
    setErro("");
    setExcluindo(true);
    try {
      await aoConfirmar(possuiHistorico);
    } catch (error) {
      setErro(error.message);
      setExcluindo(false);
    }
  }

  async function arquivar() {
    setErro("");
    setArquivando(true);
    try {
      await aoArquivar();
    } catch (error) {
      setErro(error.message);
      setArquivando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/45 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="presentation">
      <section className="w-full max-w-lg rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-[2rem] sm:p-8" role="dialog" aria-modal="true" aria-labelledby="titulo-exclusao-conta">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-error">Ação permanente</p>
            <h2 id="titulo-exclusao-conta" className="mt-2 text-2xl font-extrabold tracking-tight text-primary">Excluir {impacto.contaNome}?</h2>
          </div>
          <button type="button" onClick={aoFechar} className="grid size-10 place-items-center rounded-full bg-app-surface text-primary transition hover:bg-primary/10" aria-label="Fechar">
            <Icone nome="fechar" />
          </button>
        </div>

        {possuiHistorico ? (
          <>
            <p className="mt-5 text-sm leading-6 text-foreground-soft">Esta conta ainda possui informações vinculadas. Arquive-a para preservar o histórico ou confirme abaixo para excluir tudo definitivamente.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-error/7 p-4"><strong className="block text-2xl text-error">{impacto.totalTransacoes}</strong><span className="mt-1 block text-xs text-foreground-soft">transações</span></div>
              <div className="rounded-2xl bg-error/7 p-4"><strong className="block text-2xl text-error">{impacto.totalRecorrencias}</strong><span className="mt-1 block text-xs text-foreground-soft">recorrências</span></div>
            </div>
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-error/15 bg-error/5 p-4">
              <input type="checkbox" checked={confirmado} onChange={(evento) => setConfirmado(evento.target.checked)} className="mt-0.5 size-4 accent-[#b44337]" />
              <span className="text-sm font-semibold leading-5 text-primary">Entendo que a conta e todo o histórico vinculado serão excluídos.</span>
            </label>
          </>
        ) : (
          <p className="mt-5 rounded-xl bg-app-surface p-4 text-sm leading-6 text-foreground-soft">A conta não possui transações ou recorrências vinculadas e pode ser excluída com segurança.</p>
        )}

        {erro && <p className="mt-4 rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error" role="alert">{erro}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={aoFechar} className="rounded-xl border border-primary/15 px-5 py-3 text-sm font-bold text-primary transition hover:bg-app-surface">Cancelar</button>
          {possuiHistorico && (
            <button type="button" onClick={arquivar} disabled={arquivando || excluindo} className="rounded-xl border border-primary/20 px-5 py-3 text-sm font-bold text-primary transition hover:bg-primary/7 disabled:cursor-wait disabled:opacity-45">
              {arquivando ? "Arquivando..." : "Arquivar conta"}
            </button>
          )}
          <button type="button" onClick={confirmar} disabled={excluindo || (possuiHistorico && !confirmado)} className="rounded-xl bg-error px-5 py-3 text-sm font-bold text-white transition hover:bg-[#96362d] disabled:cursor-not-allowed disabled:opacity-45">
            {excluindo ? "Excluindo..." : possuiHistorico ? "Excluir conta e histórico" : "Excluir conta"}
          </button>
        </div>
      </section>
    </div>
  );
}

function ContaArquivada({ conta, aoRestaurar }) {
  const [restaurando, setRestaurando] = useState(false);

  async function restaurar() {
    setRestaurando(true);
    try {
      await aoRestaurar(conta);
    } finally {
      setRestaurando(false);
    }
  }

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-white/55 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-bold text-primary">{conta.nome}</p>
        <p className="mt-1 text-xs text-foreground-soft">{rotuloTipo(conta.tipo)} · saldo preservado de {formatoMoeda.format(conta.saldoAtual)}</p>
      </div>
      <button type="button" onClick={restaurar} disabled={restaurando} className="rounded-xl border border-primary/15 px-4 py-2.5 text-xs font-bold text-primary transition hover:bg-primary/7 disabled:cursor-wait disabled:opacity-50">
        {restaurando ? "Restaurando..." : "Restaurar conta"}
      </button>
    </li>
  );
}

function CartaoConta({ conta, aoEditar, aoExcluir }) {
  const saldoNegativo = Number(conta.saldoAtual) < 0;

  return (
    <article className="paper-card group rounded-[1.4rem] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(0,58,48,0.09)] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary/10 text-secondary"><Icone nome="carteira" /></span>
          <div className="min-w-0">
            <h2 className="truncate font-extrabold text-primary">{conta.nome}</h2>
            <p className="mt-0.5 text-xs font-semibold text-foreground-soft">{rotuloTipo(conta.tipo)}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={() => aoEditar(conta)} className="grid size-9 place-items-center rounded-lg text-foreground-soft transition hover:bg-secondary/10 hover:text-secondary" aria-label={`Editar ${conta.nome}`}><Icone nome="editar" className="size-4" /></button>
          <button type="button" onClick={() => aoExcluir(conta)} className="grid size-9 place-items-center rounded-lg text-foreground-soft transition hover:bg-error/10 hover:text-error" aria-label={`Excluir ${conta.nome}`}><Icone nome="excluir" className="size-4" /></button>
        </div>
      </div>

      <div className="mt-5 sm:mt-7">
        <p className="text-xs font-bold uppercase tracking-[0.13em] text-foreground-soft">Saldo atual</p>
        <p className={`mt-1 text-2xl font-extrabold tracking-tight ${saldoNegativo ? "text-error" : "text-primary"}`}>{formatoMoeda.format(conta.saldoAtual)}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-primary/8 pt-3 text-xs sm:mt-5 sm:pt-4">
        <div><span className="block text-foreground-soft">Receitas</span><strong className="mt-1 block text-positive">{formatoMoeda.format(conta.totalReceitas)}</strong></div>
        <div><span className="block text-foreground-soft">Despesas</span><strong className="mt-1 block text-error">{formatoMoeda.format(conta.totalDespesas)}</strong></div>
      </div>
    </article>
  );
}

export default function ContasView() {
  const [contas, setContas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [contaEditada, setContaEditada] = useState(null);
  const [impactoExclusao, setImpactoExclusao] = useState(null);

  const carregarContas = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setContas(await buscarContas());
    } catch (error) {
      setErro(`${error.message} Verifique se o backend está em execução.`);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    buscarContas()
      .then((resultado) => {
        if (ativo) setContas(resultado);
      })
      .catch((error) => {
        if (ativo) setErro(`${error.message} Verifique se o backend está em execução.`);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const contasAtivas = useMemo(() => contas.filter((conta) => !conta.arquivada), [contas]);
  const contasArquivadas = useMemo(() => contas.filter((conta) => conta.arquivada), [contas]);
  const saldoTotal = useMemo(() => contasAtivas.reduce((total, conta) => total + Number(conta.saldoAtual), 0), [contasAtivas]);

  function abrirCriacao() {
    setContaEditada(null);
    setModalAberto(true);
  }

  function abrirEdicao(conta) {
    setContaEditada(conta);
    setModalAberto(true);
  }

  async function salvar(dados) {
    await apiFetch(contaEditada ? `/contas/${contaEditada.id}` : "/contas", {
      method: contaEditada ? "PUT" : "POST",
      body: JSON.stringify(dados),
    });
    setModalAberto(false);
    setContaEditada(null);
    await carregarContas();
  }

  async function solicitarExclusao(conta) {
    setErro("");
    try {
      setImpactoExclusao(await apiFetch(`/contas/${conta.id}/exclusao`));
    } catch (error) {
      setErro(error.message);
    }
  }

  async function confirmarExclusao(excluirDependencias) {
    try {
      await apiFetch(`/contas/${impactoExclusao.contaId}?excluirDependencias=${excluirDependencias}`, { method: "DELETE" });
      setImpactoExclusao(null);
      await carregarContas();
    } catch (error) {
      throw error;
    }
  }

  async function alterarArquivamento(contaId, arquivada) {
    try {
      await apiFetch(`/contas/${contaId}/arquivamento`, {
        method: "PATCH",
        body: JSON.stringify({ arquivada }),
      });
      setImpactoExclusao(null);
      await carregarContas();
    } catch (error) {
      setErro(error.message);
      throw error;
    }
  }

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-secondary">Seu patrimônio em um só lugar</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">Minhas contas</h1>
          <p className="mt-2 text-sm text-foreground-soft">Acompanhe onde está seu dinheiro e mantenha os saldos organizados.</p>
        </div>
        <button type="button" onClick={abrirCriacao} className={botaoPrimario}>
          <Icone nome="mais" className="size-4" /> Nova conta
        </button>
      </div>

      <section className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-primary/7 py-4">
        <div><p className="text-[.65rem] font-bold uppercase tracking-[.1em] text-foreground-soft">Saldo nas contas</p><p className={`mt-1 text-xl font-extrabold tracking-tight ${saldoTotal < 0 ? "text-error" : "text-primary"}`}>{carregando ? "—" : formatoMoeda.format(saldoTotal)}</p></div>
        <div className="h-9 w-px bg-primary/8" aria-hidden="true" />
        <div><p className="text-[.65rem] font-bold uppercase tracking-[.1em] text-foreground-soft">Ativas</p><p className="mt-1 text-xl font-extrabold text-primary">{carregando ? "—" : contasAtivas.length}</p></div>
        {contasArquivadas.length > 0 && <div><p className="text-[.65rem] font-bold uppercase tracking-[.1em] text-foreground-soft">Arquivadas</p><p className="mt-1 text-xl font-extrabold text-primary">{contasArquivadas.length}</p></div>}
      </section>

      {erro && <FeedbackErro mensagem={erro} aoTentarNovamente={carregarContas} />}

      <section className="mt-8">
        {carregando ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Carregando contas">{[1, 2, 3].map((item) => <div key={item} className="paper-card overflow-hidden rounded-2xl"><EsqueletoLista linhas={2} /></div>)}</div>
        ) : contasAtivas.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {contasAtivas.map((conta) => <CartaoConta key={conta.id} conta={conta} aoEditar={abrirEdicao} aoExcluir={solicitarExclusao} />)}
          </div>
        ) : !erro ? (
          <div className="rounded-[2rem] border border-dashed border-primary/20 bg-background px-6 py-14 text-center">
            <Image src="/logomarca/simbolo-bau-contorno.svg" alt="" width={1046} height={943} className="mx-auto h-auto w-28 opacity-80" />
            <h2 className="mt-5 text-xl font-extrabold text-primary">Sua primeira conta começa aqui</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground-soft">Cadastre uma conta corrente, poupança, carteira ou investimento para acompanhar seu saldo.</p>
            <button type="button" onClick={abrirCriacao} className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-secondary">Criar primeira conta</button>
          </div>
        ) : null}
      </section>

      {!carregando && contasArquivadas.length > 0 && (
        <section className="mt-10 rounded-[1.5rem] border border-primary/8 bg-primary/[0.025] p-5 sm:p-6">
          <h2 className="text-base font-extrabold text-primary">Contas arquivadas</h2>
          <p className="mt-1 text-xs leading-5 text-foreground-soft">Ficam fora dos saldos consolidados e de novos lançamentos, sem perder o histórico.</p>
          <ul className="mt-4 grid gap-3 lg:grid-cols-2">
            {contasArquivadas.map((conta) => (
              <ContaArquivada key={conta.id} conta={conta} aoRestaurar={(item) => alterarArquivamento(item.id, false)} />
            ))}
          </ul>
        </section>
      )}

      {modalAberto && <ModalConta conta={contaEditada} aoFechar={() => setModalAberto(false)} aoSalvar={salvar} />}
      {impactoExclusao && <ModalExclusaoConta impacto={impactoExclusao} aoFechar={() => setImpactoExclusao(null)} aoConfirmar={confirmarExclusao} aoArquivar={() => alterarArquivamento(impactoExclusao.contaId, true)} />}
    </main>
  );
}
