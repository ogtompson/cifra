"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icone } from "@/components/icons";
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
  const lista = await apiFetch("/contas");
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
            <input name="nome" value={formulario.nome} onChange={alterar} maxLength={100} required autoFocus placeholder="Ex.: Conta principal" className="w-full rounded-xl border border-primary/15 bg-background px-4 py-3.5 text-sm outline-none transition placeholder:text-foreground-soft/60 focus:border-secondary focus:ring-3 focus:ring-secondary/10" />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-primary">Saldo inicial</span>
              <input name="saldoInicial" value={formulario.saldoInicial} onChange={alterar} type="number" step="0.01" required className="w-full rounded-xl border border-primary/15 bg-background px-4 py-3.5 text-sm outline-none transition focus:border-secondary focus:ring-3 focus:ring-secondary/10" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-primary">Tipo</span>
              <select name="tipo" value={formulario.tipo} onChange={alterar} className="w-full rounded-xl border border-primary/15 bg-background px-4 py-3.5 text-sm outline-none transition focus:border-secondary focus:ring-3 focus:ring-secondary/10">
                {tiposConta.map((tipo) => <option key={tipo.valor} value={tipo.valor}>{tipo.rotulo}</option>)}
              </select>
            </label>
          </div>

          {erro && <p className="rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error" role="alert">{erro}</p>}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={aoFechar} className="rounded-xl border border-primary/15 px-5 py-3 text-sm font-bold text-primary transition hover:bg-app-surface">Cancelar</button>
            <button type="submit" disabled={salvando} className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,58,48,0.16)] transition hover:bg-secondary disabled:cursor-wait disabled:opacity-60">
              {salvando ? "Salvando..." : conta ? "Salvar alterações" : "Criar conta"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function CartaoConta({ conta, aoEditar, aoExcluir }) {
  const saldoNegativo = Number(conta.saldoAtual) < 0;

  return (
    <article className="group rounded-2xl border border-primary/10 bg-white p-5 shadow-[0_8px_30px_rgba(0,58,48,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(0,58,48,0.09)]">
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

      <div className="mt-7">
        <p className="text-xs font-bold uppercase tracking-[0.13em] text-foreground-soft">Saldo atual</p>
        <p className={`mt-1 text-2xl font-extrabold tracking-tight ${saldoNegativo ? "text-error" : "text-primary"}`}>{formatoMoeda.format(conta.saldoAtual)}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-primary/8 pt-4 text-xs">
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

  const saldoTotal = useMemo(() => contas.reduce((total, conta) => total + Number(conta.saldoAtual), 0), [contas]);

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

  async function excluir(conta) {
    if (!window.confirm(`Excluir a conta “${conta.nome}”?`)) return;
    setErro("");
    try {
      await apiFetch(`/contas/${conta.id}`, { method: "DELETE" });
      await carregarContas();
    } catch (error) {
      setErro(error.message);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-secondary">Seu patrimônio</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">Minhas contas</h1>
          <p className="mt-2 text-sm text-foreground-soft">Acompanhe onde está seu dinheiro e mantenha os saldos organizados.</p>
        </div>
        <button type="button" onClick={abrirCriacao} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,58,48,0.16)] transition hover:bg-secondary">
          <Icone nome="mais" className="size-4" /> Nova conta
        </button>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-white shadow-[0_16px_44px_rgba(0,58,48,0.16)]">
          <div className="absolute -right-8 -top-12 size-40 rounded-full bg-secondary/40 blur-2xl" aria-hidden="true" />
          <p className="relative text-xs font-bold uppercase tracking-[0.14em] text-white/60">Saldo consolidado</p>
          <p className="relative mt-3 text-3xl font-extrabold tracking-tight">{carregando ? "—" : formatoMoeda.format(saldoTotal)}</p>
        </div>
        <div className="rounded-2xl border border-primary/10 bg-background p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground-soft">Contas cadastradas</p>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-primary">{carregando ? "—" : contas.length}</p>
        </div>
      </section>

      {erro && (
        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-error/20 bg-error/8 px-5 py-4 text-sm font-semibold text-error" role="alert">
          <span>{erro}</span>
          <button type="button" onClick={carregarContas} className="shrink-0 underline underline-offset-4">Tentar novamente</button>
        </div>
      )}

      <section className="mt-8">
        {carregando ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Carregando contas">
            {[1, 2, 3].map((item) => <div key={item} className="h-56 animate-pulse rounded-2xl bg-primary/6" />)}
          </div>
        ) : contas.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {contas.map((conta) => <CartaoConta key={conta.id} conta={conta} aoEditar={abrirEdicao} aoExcluir={excluir} />)}
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

      {modalAberto && <ModalConta conta={contaEditada} aoFechar={() => setModalAberto(false)} aoSalvar={salvar} />}
    </main>
  );
}
