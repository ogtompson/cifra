"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icone } from "@/components/icons";
import { botaoPrimario, botaoSecundario, campo, Confirmacao, EsqueletoLista, FeedbackErro, ModalPadrao } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import OrcamentosPainel from "./orcamentos-painel";

const configuracao = {
  DESPESA: { rotulo: "Despesas", singular: "despesa", cor: "error", descricao: "Para onde o seu dinheiro vai" },
  RECEITA: { rotulo: "Receitas", singular: "receita", cor: "positive", descricao: "De onde o seu dinheiro vem" },
};

const sugestoes = [
  { nome: "Moradia", tipo: "DESPESA", icone: "casa" },
  { nome: "Alimentação", tipo: "DESPESA", icone: "alimentacao" },
  { nome: "Transporte", tipo: "DESPESA", icone: "transporte" },
  { nome: "Saúde", tipo: "DESPESA", icone: "saude" },
  { nome: "Educação", tipo: "DESPESA", icone: "educacao" },
  { nome: "Lazer", tipo: "DESPESA", icone: "lazer" },
  { nome: "Assinaturas", tipo: "DESPESA", icone: "assinatura" },
  { nome: "Compras", tipo: "DESPESA", icone: "compras" },
  { nome: "Salário", tipo: "RECEITA", icone: "salario" },
  { nome: "Freelance", tipo: "RECEITA", icone: "carteira" },
  { nome: "Investimentos", tipo: "RECEITA", icone: "investimento" },
  { nome: "Presentes", tipo: "RECEITA", icone: "presente" },
];

function normalizar(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function iconeDaCategoria(nome) {
  const chave = normalizar(nome);
  const correspondencia = sugestoes.find((item) => normalizar(item.nome) === chave);
  if (correspondencia) return correspondencia.icone;
  if (chave.includes("casa") || chave.includes("aluguel")) return "casa";
  if (chave.includes("mercado") || chave.includes("restaurante")) return "alimentacao";
  if (chave.includes("renda") || chave.includes("venda")) return "salario";
  return "outros";
}

async function buscarCategorias() {
  return apiFetch("/categorias");
}

function mesIso(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-01`;
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
    <ModalPadrao eyebrow={`${categoria ? "Editar" : "Nova"} categoria`} titulo={categoria ? categoria.nome : "Dê nome aos seus hábitos"} aoFechar={aoFechar}>
        <form className="modal-body space-y-5" onSubmit={enviar}>
          <label className="block"><span className="mb-2 block text-sm font-bold text-primary">Nome</span><input name="nome" value={formulario.nome} onChange={(evento) => setFormulario((atual) => ({ ...atual, nome: evento.target.value }))} maxLength={100} required autoFocus placeholder="Ex.: Alimentação" className={campo} /></label>
          <fieldset><legend className="mb-2 text-sm font-bold text-primary">Tipo</legend><div className="operation-switch">{["DESPESA", "RECEITA"].map((tipo) => <label key={tipo} className={`operation-option ${formulario.tipo === tipo ? "is-active" : ""}`}><input type="radio" name="tipo" value={tipo} checked={formulario.tipo === tipo} onChange={(evento) => setFormulario((atual) => ({ ...atual, tipo: evento.target.value }))} className="sr-only" />{configuracao[tipo].singular[0].toUpperCase() + configuracao[tipo].singular.slice(1)}</label>)}</div></fieldset>
          {erro && <p className="rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error" role="alert">{erro}</p>}
          <div className="modal-footer"><button type="button" onClick={aoFechar} className={botaoSecundario}>Cancelar</button><button type="submit" disabled={salvando} className={botaoPrimario}>{salvando ? "Salvando..." : categoria ? "Salvar alterações" : "Criar categoria"}</button></div>
        </form>
    </ModalPadrao>
  );
}

function ItemCategoria({ categoria, aoEditar, aoExcluir }) {
  const estilo = categoria.tipo === "RECEITA" ? "bg-positive/10 text-positive" : "bg-error/8 text-error";
  return (
    <article className="group -mx-2 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border-b border-primary/7 px-2 py-3.5 transition-colors last:border-0 hover:bg-secondary/[0.045] sm:py-4">
      <span className={`grid size-11 place-items-center rounded-2xl ${estilo}`}><Icone nome={iconeDaCategoria(categoria.nome)} /></span>
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
  const [adicionandoSugestao, setAdicionandoSugestao] = useState("");
  const [sugestoesAbertas, setSugestoesAbertas] = useState(false);
  const [categoriaExcluida, setCategoriaExcluida] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [orcamentos, setOrcamentos] = useState([]);
  const [mesOrcamento, setMesOrcamento] = useState(() => new Date());

  const carregarCategorias = useCallback(async () => {
    setCarregando(true); setErro("");
    try { setCategorias(await buscarCategorias()); } catch (error) { setErro(`${error.message} Verifique se o backend está em execução.`); } finally { setCarregando(false); }
  }, []);

  useEffect(() => {
    let ativo = true;
    buscarCategorias().then((resultado) => ativo && setCategorias(resultado)).catch((error) => ativo && setErro(`${error.message} Verifique se o backend está em execução.`)).finally(() => ativo && setCarregando(false));
    return () => { ativo = false; };
  }, []);

  const carregarOrcamentos = useCallback(async () => {
    try {
      setOrcamentos(await apiFetch(`/orcamentos?mesReferencia=${mesIso(mesOrcamento)}`));
    } catch (error) {
      setErro(error.message);
    }
  }, [mesOrcamento]);

  useEffect(() => {
    let ativo = true;
    apiFetch(`/orcamentos?mesReferencia=${mesIso(mesOrcamento)}`).then((resultado) => ativo && setOrcamentos(resultado)).catch((error) => ativo && setErro(error.message));
    return () => { ativo = false; };
  }, [mesOrcamento]);

  const separadas = useMemo(() => ({ DESPESA: categorias.filter((categoria) => categoria.tipo === "DESPESA"), RECEITA: categorias.filter((categoria) => categoria.tipo === "RECEITA") }), [categorias]);
  const sugestoesDisponiveis = useMemo(() => {
    const existentes = new Set(categorias.map((categoria) => `${categoria.tipo}:${normalizar(categoria.nome)}`));
    return sugestoes.filter((sugestao) => !existentes.has(`${sugestao.tipo}:${normalizar(sugestao.nome)}`));
  }, [categorias]);

  function abrirCriacao(tipo = "DESPESA") { setCategoriaEditada(null); setTipoInicial(tipo); setModalAberto(true); }
  function abrirEdicao(categoria) { setCategoriaEditada(categoria); setTipoInicial(categoria.tipo); setModalAberto(true); }
  async function salvar(dados) { await apiFetch(categoriaEditada ? `/categorias/${categoriaEditada.id}` : "/categorias", { method: categoriaEditada ? "PUT" : "POST", body: JSON.stringify(dados) }); setModalAberto(false); setCategoriaEditada(null); await carregarCategorias(); }
  async function excluir() { setErro(""); setExcluindo(true); try { await apiFetch(`/categorias/${categoriaExcluida.id}`, { method: "DELETE" }); setCategoriaExcluida(null); await carregarCategorias(); } catch (error) { setErro(error.message); } finally { setExcluindo(false); } }
  async function adicionarSugestao(sugestao) {
    setErro("");
    setAdicionandoSugestao(`${sugestao.tipo}:${sugestao.nome}`);
    try {
      await apiFetch("/categorias", { method: "POST", body: JSON.stringify({ nome: sugestao.nome, tipo: sugestao.tipo }) });
      await carregarCategorias();
    } catch (error) {
      setErro(error.message);
    } finally {
      setAdicionandoSugestao("");
    }
  }
  async function salvarOrcamento(id, payload) {
    setErro("");
    await apiFetch(id ? `/orcamentos/${id}` : "/orcamentos", { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
    await carregarOrcamentos();
  }
  async function excluirOrcamento(id) {
    setErro("");
    await apiFetch(`/orcamentos/${id}`, { method: "DELETE" });
    await carregarOrcamentos();
  }
  function mudarMesOrcamento(deslocamento) {
    setMesOrcamento((atual) => new Date(atual.getFullYear(), atual.getMonth() + deslocamento, 1, 12));
  }

  return (
    <main className="page-shell">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="page-eyebrow">Cada real no lugar certo</p><h1 className="page-title">Categorias</h1><p className="page-description">Organize suas movimentações e entenda seus hábitos financeiros.</p>{!carregando && <p className="mt-3 text-xs font-semibold text-foreground-soft"><strong className="text-primary">{separadas.DESPESA.length}</strong> de despesa · <strong className="text-primary">{separadas.RECEITA.length}</strong> de receita</p>}</div><button type="button" onClick={() => abrirCriacao()} className={botaoPrimario}><Icone nome="mais" className="size-4" /> Nova categoria</button></div>

      {erro && <FeedbackErro mensagem={erro} aoTentarNovamente={carregarCategorias} />}

      {!carregando && sugestoesDisponiveis.length > 0 && (
        <section className="mt-5 rounded-2xl border border-primary/8 bg-white/55 px-4 py-3.5">
          <button type="button" onClick={() => setSugestoesAbertas((abertas) => !abertas)} className="flex w-full items-center justify-between gap-4 text-left" aria-expanded={sugestoesAbertas}>
            <span><strong className="block text-sm text-primary">Categorias sugeridas</strong><span className="mt-0.5 block text-xs text-foreground-soft">{sugestoesDisponiveis.length} opções prontas para adicionar</span></span>
            <span className={`grid size-8 place-items-center rounded-full bg-primary/6 text-primary transition-transform ${sugestoesAbertas ? "rotate-45" : ""}`}><Icone nome="mais" className="size-4" /></span>
          </button>
          {sugestoesAbertas && <div className="mt-3 flex flex-wrap gap-2 border-t border-primary/7 pt-3">
            {sugestoesDisponiveis.map((sugestao) => {
              const chave = `${sugestao.tipo}:${sugestao.nome}`;
              return (
                <button key={chave} type="button" onClick={() => adicionarSugestao(sugestao)} disabled={adicionandoSugestao === chave} className="flex items-center gap-2 rounded-full border border-primary/10 bg-background px-3.5 py-2 text-xs font-bold text-primary transition hover:-translate-y-0.5 hover:border-secondary/35 hover:bg-secondary/6 disabled:cursor-wait disabled:opacity-55">
                  <Icone nome={sugestao.icone} className="size-4" />
                  {adicionandoSugestao === chave ? "Adicionando..." : sugestao.nome}
                  <Icone nome="mais" className="size-3.5" />
                </button>
              );
            })}
          </div>}
        </section>
      )}

      {!carregando && <OrcamentosPainel categorias={categorias} orcamentos={orcamentos} referencia={mesOrcamento} aoMudarMes={mudarMesOrcamento} aoSalvar={salvarOrcamento} aoExcluir={excluirOrcamento} />}

      <div className="mt-6 grid gap-5 xl:grid-cols-2">{carregando ? [1, 2].map((item) => <div key={item} className="paper-card overflow-hidden rounded-[1.6rem]"><EsqueletoLista linhas={5} /></div>) : <><GrupoCategorias tipo="DESPESA" categorias={separadas.DESPESA} aoAdicionar={abrirCriacao} aoEditar={abrirEdicao} aoExcluir={setCategoriaExcluida} /><GrupoCategorias tipo="RECEITA" categorias={separadas.RECEITA} aoAdicionar={abrirCriacao} aoEditar={abrirEdicao} aoExcluir={setCategoriaExcluida} /></>}</div>

      {modalAberto && <ModalCategoria categoria={categoriaEditada} tipoInicial={tipoInicial} aoFechar={() => setModalAberto(false)} aoSalvar={salvar} />}
      {categoriaExcluida && <Confirmacao titulo={`Excluir “${categoriaExcluida.nome}”?`} descricao="A categoria só poderá ser excluída se não estiver vinculada a movimentações ou recorrências." confirmando={excluindo} aoCancelar={() => setCategoriaExcluida(null)} aoConfirmar={excluir} />}
    </main>
  );
}
