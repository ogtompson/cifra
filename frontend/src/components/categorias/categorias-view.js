"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icone } from "@/components/icons";
import { apiFetch } from "@/lib/api";

const configuracao = {
  DESPESA: { rotulo: "Despesas", singular: "despesa", cor: "error", descricao: "Para onde o seu dinheiro vai" },
  RECEITA: { rotulo: "Receitas", singular: "receita", cor: "positive", descricao: "De onde o seu dinheiro vem" },
};

async function buscarCategorias() {
  return apiFetch("/categorias");
}

function ModalCategoria({ categoria, tipoInicial, aoFechar, aoSalvar }) {
  const [formulario, setFormulario] = useState({ nome: categoria?.nome ?? "", tipo: categoria?.tipo ?? tipoInicial });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      await aoSalvar({ nome: formulario.nome.trim(), tipo: formulario.tipo });
    } catch (error) {
      setErro(error.message);
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/45 backdrop-blur-sm sm:items-center sm:p-6" role="presentation">
      <section className="w-full max-w-lg rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-[2rem] sm:p-8" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-categoria">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">{categoria ? "Editar" : "Nova"} categoria</p><h2 id="titulo-modal-categoria" className="mt-2 text-2xl font-extrabold tracking-tight text-primary">{categoria ? categoria.nome : "Dê nome aos seus hábitos"}</h2></div>
          <button type="button" onClick={aoFechar} className="grid size-10 place-items-center rounded-full bg-app-surface text-primary transition hover:bg-primary/10" aria-label="Fechar"><Icone nome="fechar" /></button>
        </div>

        <form className="mt-7 space-y-5" onSubmit={enviar}>
          <label className="block"><span className="mb-2 block text-sm font-bold text-primary">Nome</span><input name="nome" value={formulario.nome} onChange={(evento) => setFormulario((atual) => ({ ...atual, nome: evento.target.value }))} maxLength={100} required autoFocus placeholder="Ex.: Alimentação" className="w-full rounded-xl border border-primary/15 bg-background px-4 py-3.5 text-sm outline-none transition placeholder:text-foreground-soft/60 focus:border-secondary focus:ring-3 focus:ring-secondary/10" /></label>
          <fieldset><legend className="mb-2 text-sm font-bold text-primary">Tipo</legend><div className="grid grid-cols-2 gap-3">{["DESPESA", "RECEITA"].map((tipo) => <label key={tipo} className={`cursor-pointer rounded-xl border px-4 py-3.5 text-center text-sm font-bold transition ${formulario.tipo === tipo ? "border-primary bg-primary text-white" : "border-primary/12 bg-background text-primary hover:border-primary/30"}`}><input type="radio" name="tipo" value={tipo} checked={formulario.tipo === tipo} onChange={(evento) => setFormulario((atual) => ({ ...atual, tipo: evento.target.value }))} className="sr-only" />{configuracao[tipo].singular[0].toUpperCase() + configuracao[tipo].singular.slice(1)}</label>)}</div></fieldset>
          {erro && <p className="rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error" role="alert">{erro}</p>}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end"><button type="button" onClick={aoFechar} className="rounded-xl border border-primary/15 px-5 py-3 text-sm font-bold text-primary transition hover:bg-app-surface">Cancelar</button><button type="submit" disabled={salvando} className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,58,48,.16)] transition hover:bg-secondary disabled:cursor-wait disabled:opacity-60">{salvando ? "Salvando..." : categoria ? "Salvar alterações" : "Criar categoria"}</button></div>
        </form>
      </section>
    </div>
  );
}

function ItemCategoria({ categoria, aoEditar, aoExcluir }) {
  const estilo = categoria.tipo === "RECEITA" ? "bg-positive/10 text-positive" : "bg-error/8 text-error";
  return (
    <article className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-primary/7 py-4 last:border-0">
      <span className={`grid size-11 place-items-center rounded-2xl ${estilo}`}><span className="text-sm font-extrabold">{categoria.nome.slice(0, 1).toUpperCase()}</span></span>
      <div className="min-w-0"><h3 className="truncate text-sm font-extrabold text-primary">{categoria.nome}</h3><p className="mt-0.5 text-xs text-foreground-soft">Categoria de {configuracao[categoria.tipo].singular}</p></div>
      <div className="flex opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"><button type="button" onClick={() => aoEditar(categoria)} className="grid size-9 place-items-center rounded-lg text-foreground-soft transition hover:bg-secondary/10 hover:text-secondary" aria-label={`Editar ${categoria.nome}`}><Icone nome="editar" className="size-4" /></button><button type="button" onClick={() => aoExcluir(categoria)} className="grid size-9 place-items-center rounded-lg text-foreground-soft transition hover:bg-error/10 hover:text-error" aria-label={`Excluir ${categoria.nome}`}><Icone nome="excluir" className="size-4" /></button></div>
    </article>
  );
}

function GrupoCategorias({ tipo, categorias, aoAdicionar, aoEditar, aoExcluir }) {
  const config = configuracao[tipo];
  return (
    <section className="paper-card rounded-[1.6rem] p-4 sm:p-6">
      <header className="flex items-start justify-between gap-4 border-b border-primary/8 pb-5"><div className="flex items-center gap-3"><span className={`grid size-11 place-items-center rounded-2xl ${tipo === "RECEITA" ? "bg-positive/10 text-positive" : "bg-error/8 text-error"}`}><Icone nome={tipo === "RECEITA" ? "setaCima" : "setaBaixo"} /></span><div><h2 className="font-extrabold text-primary">{config.rotulo}</h2><p className="mt-0.5 text-xs text-foreground-soft">{config.descricao}</p></div></div><span className="rounded-full bg-primary/6 px-3 py-1 text-xs font-extrabold text-primary">{categorias.length}</span></header>
      <div>{categorias.length ? categorias.map((categoria) => <ItemCategoria key={categoria.id} categoria={categoria} aoEditar={aoEditar} aoExcluir={aoExcluir} />) : <div className="py-10 text-center"><p className="text-sm font-bold text-primary">Nenhuma categoria de {config.singular}</p><p className="mt-1 text-xs text-foreground-soft">Crie uma para organizar seus lançamentos.</p></div>}</div>
      <button type="button" onClick={() => aoAdicionar(tipo)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/20 py-3 text-sm font-bold text-primary transition hover:border-secondary hover:bg-secondary/5"><Icone nome="mais" className="size-4" /> Adicionar {config.singular}</button>
    </section>
  );
}

export default function CategoriasView() {
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaEditada, setCategoriaEditada] = useState(null);
  const [tipoInicial, setTipoInicial] = useState("DESPESA");

  const carregarCategorias = useCallback(async () => {
    setCarregando(true); setErro("");
    try { setCategorias(await buscarCategorias()); } catch (error) { setErro(`${error.message} Verifique se o backend está em execução.`); } finally { setCarregando(false); }
  }, []);

  useEffect(() => {
    let ativo = true;
    buscarCategorias().then((resultado) => ativo && setCategorias(resultado)).catch((error) => ativo && setErro(`${error.message} Verifique se o backend está em execução.`)).finally(() => ativo && setCarregando(false));
    return () => { ativo = false; };
  }, []);

  const separadas = useMemo(() => ({ DESPESA: categorias.filter((categoria) => categoria.tipo === "DESPESA"), RECEITA: categorias.filter((categoria) => categoria.tipo === "RECEITA") }), [categorias]);

  function abrirCriacao(tipo = "DESPESA") { setCategoriaEditada(null); setTipoInicial(tipo); setModalAberto(true); }
  function abrirEdicao(categoria) { setCategoriaEditada(categoria); setTipoInicial(categoria.tipo); setModalAberto(true); }
  async function salvar(dados) { await apiFetch(categoriaEditada ? `/categorias/${categoriaEditada.id}` : "/categorias", { method: categoriaEditada ? "PUT" : "POST", body: JSON.stringify(dados) }); setModalAberto(false); setCategoriaEditada(null); await carregarCategorias(); }
  async function excluir(categoria) { if (!window.confirm(`Excluir a categoria “${categoria.nome}”?`)) return; setErro(""); try { await apiFetch(`/categorias/${categoria.id}`, { method: "DELETE" }); await carregarCategorias(); } catch (error) { setErro(error.message); } }

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-secondary">Cada real no lugar certo</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.035em] text-primary sm:text-4xl">Categorias</h1><p className="mt-2 text-sm text-foreground-soft">Organize suas movimentações e entenda seus hábitos financeiros.</p></div><button type="button" onClick={() => abrirCriacao()} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,58,48,.16)] transition hover:-translate-y-0.5 hover:bg-secondary"><Icone nome="mais" className="size-4" /> Nova categoria</button></div>

      <section className="gold-surface relative mt-6 overflow-hidden rounded-2xl border border-accent/10 px-4 py-5 sm:mt-7 sm:rounded-[1.6rem] sm:px-8 sm:py-6"><div className="relative z-10 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-[.68rem] font-bold uppercase tracking-[.14em] text-accent sm:text-xs">Seu mapa financeiro</p><p className="mt-1.5 max-w-xl text-base font-extrabold text-primary sm:mt-2 sm:text-xl">Categorias transformam uma lista de gastos em decisões mais claras.</p></div><div className="flex gap-2 sm:gap-3"><div className="rounded-xl bg-white/60 px-3 py-2 text-center sm:rounded-2xl sm:px-4 sm:py-3"><strong className="block text-lg text-primary sm:text-xl">{carregando ? "—" : separadas.DESPESA.length}</strong><span className="text-[.62rem] text-foreground-soft sm:text-[.68rem]">despesas</span></div><div className="rounded-xl bg-white/60 px-3 py-2 text-center sm:rounded-2xl sm:px-4 sm:py-3"><strong className="block text-lg text-primary sm:text-xl">{carregando ? "—" : separadas.RECEITA.length}</strong><span className="text-[.62rem] text-foreground-soft sm:text-[.68rem]">receitas</span></div></div></div></section>

      {erro && <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-error/20 bg-error/8 px-5 py-4 text-sm font-semibold text-error" role="alert"><span>{erro}</span><button type="button" onClick={carregarCategorias} className="shrink-0 underline underline-offset-4">Tentar novamente</button></div>}

      <div className="mt-5 grid gap-5 xl:grid-cols-2">{carregando ? [1, 2].map((item) => <div key={item} className="h-96 animate-pulse rounded-[1.6rem] bg-primary/6" />) : <><GrupoCategorias tipo="DESPESA" categorias={separadas.DESPESA} aoAdicionar={abrirCriacao} aoEditar={abrirEdicao} aoExcluir={excluir} /><GrupoCategorias tipo="RECEITA" categorias={separadas.RECEITA} aoAdicionar={abrirCriacao} aoEditar={abrirEdicao} aoExcluir={excluir} /></>}</div>

      {modalAberto && <ModalCategoria categoria={categoriaEditada} tipoInicial={tipoInicial} aoFechar={() => setModalAberto(false)} aoSalvar={salvar} />}
    </main>
  );
}
