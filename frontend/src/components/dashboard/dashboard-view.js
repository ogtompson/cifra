"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icone } from "@/components/icons";
import { botaoSecundario, EsqueletoBloco, EsqueletoLista, EstadoVazio, FeedbackErro, FiltroSegmentado, NavegacaoMes, SelectCampo } from "@/components/ui";
import GraficoComparativo from "@/components/ui/grafico-comparativo";
import { apiFetch } from "@/lib/api";
import { categoriasDoMes, chaveMes, compromissoFixo, mediasCategorias, previsaoProximoMes, proximasRecorrencias, resumoMes, serieMensal } from "./dashboard-calculos";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const moedaCompacta = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });
const mesCurto = new Intl.DateTimeFormat("pt-BR", { month: "short" });
const mesLongo = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const CORES = ["#006463", "#d39a52", "#ad6248", "#80a89d", "#c6b8a4", "#dfe4df"];

async function carregarDashboard() {
  const [contas, transacoes, recorrencias, comprasCartao] = await Promise.all([apiFetch("/contas"), apiFetch("/transacoes"), apiFetch("/recorrencias"), apiFetch("/cartoes/compras")]);
  const comprasComoMovimentos = comprasCartao.map((compra) => ({
    id: `compra-cartao-${compra.id}`,
    descricao: compra.descricao,
    valor: compra.valorTotal,
    data: compra.dataCompra,
    tipo: "DESPESA",
    natureza: "COMPRA_CARTAO",
    contaId: compra.contaPagamentoId,
    contaNome: compra.contaPagamentoNome,
    categoriaId: compra.categoriaId,
    categoriaNome: compra.categoriaNome,
  }));
  return { contas, transacoes: [...transacoes, ...comprasComoMovimentos], recorrencias };
}

function percentual(valor) {
  return `${Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;
}

function tomValor(valor) {
  return Number(valor) >= 0 ? "text-positive" : "text-error";
}

function capitalizarPrimeira(texto) {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "";
}

function CartaoMetrica({ rotulo, valor, detalhe, icone, tom = "neutro", destaque = false }) {
  const cor = tom === "positivo" ? "text-positive" : tom === "negativo" ? "text-error" : "text-primary";
  return (
    <article className={`rounded-2xl p-4 sm:p-5 ${destaque ? "border border-primary bg-primary text-white shadow-[0_14px_35px_rgba(0,58,48,.14)]" : "paper-card"}`}>
      <div className="flex items-center justify-between gap-3"><p className={`text-[.65rem] font-extrabold uppercase tracking-[.12em] ${destaque ? "text-white/55" : "text-foreground-soft"}`}>{rotulo}</p><span className={`grid size-8 place-items-center rounded-full ${destaque ? "bg-white/10 text-white" : "bg-primary/5 text-secondary"}`}><Icone nome={icone} className="size-4" /></span></div>
      <p className={`mt-4 truncate text-2xl font-extrabold tracking-[-.04em] sm:text-[1.7rem] ${destaque ? "text-white" : cor}`}>{valor}</p>
      <p className={`mt-1.5 text-[.68rem] leading-5 ${destaque ? "text-white/55" : "text-foreground-soft"}`}>{detalhe}</p>
    </article>
  );
}

function BarraProgresso({ valor, limite = 100, cor = "bg-secondary", className = "" }) {
  const largura = Math.min(Math.max((Number(valor) / Math.max(Number(limite), 1)) * 100, 0), 100);
  return <div className={`h-1.5 overflow-hidden rounded-full bg-primary/7 ${className}`}><div className={`h-full rounded-full transition-all duration-500 ${cor}`} style={{ width: `${largura}%` }} /></div>;
}

function RoscaCategorias({ itens, total, selecionada, aoSelecionar }) {
  const raio = 48;
  const circunferencia = 2 * Math.PI * raio;
  const segmentos = itens.reduce((resultado, item, indice) => {
    const fracao = total > 0 ? item.total / total : 0;
    const acumulado = resultado.reduce((soma, segmento) => soma + segmento.fracao, 0);
    return [...resultado, { ...item, fracao, cor: CORES[indice % CORES.length], comprimento: fracao * circunferencia, deslocamento: -acumulado * circunferencia }];
  }, []);
  return (
    <div className="relative mx-auto size-48 sm:size-52">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-label="Distribuição das despesas por categoria">
        <circle cx="60" cy="60" r={raio} fill="none" stroke="rgba(0,58,48,.06)" strokeWidth="13" />
        {segmentos.map((item) => <circle key={item.id} cx="60" cy="60" r={raio} fill="none" stroke={item.cor} strokeWidth={selecionada && String(selecionada) !== item.id ? 8 : 13} strokeDasharray={`${item.comprimento} ${circunferencia - item.comprimento}`} strokeDashoffset={item.deslocamento} className="cursor-pointer transition-all hover:opacity-80 focus:outline-none" role="button" tabIndex="0" aria-label={`Filtrar por ${item.nome}`} onClick={() => aoSelecionar(item.id)} onKeyDown={(evento) => (evento.key === "Enter" || evento.key === " ") && aoSelecionar(item.id)} />)}
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-[.6rem] font-bold uppercase tracking-[.1em] text-foreground-soft">Despesas</p><p className="mt-1 text-lg font-extrabold text-primary">{moedaCompacta.format(total)}</p></div></div>
    </div>
  );
}

function GraficoSaldo({ serie, aoSelecionar }) {
  const valores = serie.map((item) => item.saldo);
  const minimo = Math.min(...valores, 0);
  const maximo = Math.max(...valores, 1);
  const largura = 600;
  const altura = 170;
  const pontos = serie.map((item, indice) => ({ ...item, x: serie.length === 1 ? largura / 2 : (indice / (serie.length - 1)) * largura, y: altura - ((item.saldo - minimo) / Math.max(maximo - minimo, 1)) * (altura - 28) - 14 }));
  const caminho = pontos.map((ponto, indice) => `${indice ? "L" : "M"} ${ponto.x} ${ponto.y}`).join(" ");
  const area = `${caminho} L ${largura} ${altura} L 0 ${altura} Z`;
  return (
    <div className="mt-6">
      <svg viewBox={`-8 -8 ${largura + 16} ${altura + 16}`} className="h-44 w-full overflow-visible" preserveAspectRatio="none" aria-label="Evolução do saldo consolidado"><defs><linearGradient id="areaSaldo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#006463" stopOpacity=".22" /><stop offset="1" stopColor="#006463" stopOpacity="0" /></linearGradient></defs><path d={area} fill="url(#areaSaldo)" /><path d={caminho} fill="none" stroke="#006463" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />{pontos.map((ponto) => <circle key={ponto.chave} cx={ponto.x} cy={ponto.y} r="6" fill="#fefefe" stroke="#006463" strokeWidth="3" vectorEffect="non-scaling-stroke" className="cursor-pointer outline-none" role="button" tabIndex="0" aria-label={`${mesLongo.format(ponto.data)}: ${moeda.format(ponto.saldo)}`} onClick={() => aoSelecionar(ponto.chave)} onKeyDown={(evento) => (evento.key === "Enter" || evento.key === " ") && aoSelecionar(ponto.chave)} />)}</svg>
      <div className="mt-1 flex">{serie.map((item) => <span key={item.chave} className="min-w-0 flex-1 text-center text-[.58rem] font-bold capitalize text-foreground-soft">{mesCurto.format(item.data).replace(".", "")}</span>)}</div>
    </div>
  );
}

function MedidorComprometimento({ percentual: valor }) {
  const progresso = Math.min(Math.max(Number(valor), 0), 100);
  const cor = progresso > 60 ? "#b44337" : progresso > 40 ? "#d39a52" : "#006463";
  return (
    <div className="relative mx-auto h-28 w-56 overflow-hidden">
      <svg viewBox="0 0 180 105" className="size-full"><path d="M 15 92 A 75 75 0 0 1 165 92" pathLength="100" fill="none" stroke="rgba(0,58,48,.07)" strokeWidth="16" strokeLinecap="round" /><path d="M 15 92 A 75 75 0 0 1 165 92" pathLength="100" fill="none" stroke={cor} strokeWidth="16" strokeLinecap="round" strokeDasharray={`${progresso} 100`} /></svg>
      <div className="absolute inset-x-0 top-[58%] -translate-y-1/2 text-center"><p className="text-2xl font-extrabold tracking-[-.04em] text-primary">{percentual(valor)}</p><p className="mt-0.5 text-[.58rem] font-bold text-foreground-soft">da receita projetada</p></div>
    </div>
  );
}

export default function DashboardView() {
  const agora = useMemo(() => new Date(), []);
  const mesAtual = chaveMes(agora);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [mesReferencia, setMesReferencia] = useState(mesAtual);
  const [contaId, setContaId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [periodo, setPeriodo] = useState("6");
  const [taxaMeta, setTaxaMeta] = useState("20");
  const [janelaRecorrencias, setJanelaRecorrencias] = useState("7");
  const [orcamentos, setOrcamentos] = useState([]);
  const [cartoesCredito, setCartoesCredito] = useState([]);
  const [faturasCartao, setFaturasCartao] = useState([]);

  useEffect(() => { let ativo = true; carregarDashboard().then((resultado) => ativo && setDados(resultado)).catch((error) => ativo && setErro(error.message)); return () => { ativo = false; }; }, []);
  useEffect(() => { let ativo = true; apiFetch(`/orcamentos?mesReferencia=${mesReferencia}-01`).then((resultado) => ativo && setOrcamentos(resultado)).catch((error) => ativo && setErro(error.message)); return () => { ativo = false; }; }, [mesReferencia]);
  useEffect(() => { let ativo = true; apiFetch("/cartoes").then(async (cartoes) => ({ cartoes, faturas: await Promise.all(cartoes.map((cartao) => apiFetch(`/cartoes/${cartao.id}/faturas?mesReferencia=${mesReferencia}-01&meses=6`))) })).then((resultado) => { if (ativo) { setCartoesCredito(resultado.cartoes); setFaturasCartao(resultado.faturas); } }).catch((error) => ativo && setErro(error.message)); return () => { ativo = false; }; }, [mesReferencia]);

  const categoriasFiltro = useMemo(() => { const mapa = new Map((dados?.transacoes ?? []).filter((item) => item.categoriaId && item.categoriaNome).map((item) => [String(item.categoriaId), item.categoriaNome])); return [...mapa].sort((a, b) => a[1].localeCompare(b[1], "pt-BR")).map(([valor, rotulo]) => ({ valor, rotulo })); }, [dados]);
  const analise = useMemo(() => dados ? resumoMes({ ...dados, chave: mesReferencia, contaId, categoriaId, taxaMeta: Number(taxaMeta), hoje: agora }) : null, [dados, mesReferencia, contaId, categoriaId, taxaMeta, agora]);
  const serie = useMemo(() => dados ? serieMensal({ ...dados, chaveFinal: mesReferencia, quantidade: Number(periodo), contaId, categoriaId }) : [], [dados, mesReferencia, periodo, contaId, categoriaId]);
  const categorias = useMemo(() => dados && analise ? categoriasDoMes({ transacoes: dados.transacoes, chave: mesReferencia, contaId, categoriaId, receitas: analise.receitas }) : [], [dados, analise, mesReferencia, contaId, categoriaId]);
  const medias = useMemo(() => dados ? mediasCategorias({ transacoes: dados.transacoes, chave: mesReferencia, contaId }) : new Map(), [dados, mesReferencia, contaId]);
  const fixo = useMemo(() => dados && analise ? compromissoFixo({ recorrencias: dados.recorrencias, receitas: analise.receitasProjetadas, chave: mesReferencia, contaId, categoriaId }) : { total: 0, percentual: 0 }, [dados, analise, mesReferencia, contaId, categoriaId]);
  const proximoMes = useMemo(() => dados ? previsaoProximoMes({ recorrencias: dados.recorrencias, chave: mesReferencia, contaId, categoriaId }) : null, [dados, mesReferencia, contaId, categoriaId]);
  const proximas = useMemo(() => dados ? proximasRecorrencias({ recorrencias: dados.recorrencias, inicio: agora, dias: Number(janelaRecorrencias), contaId, categoriaId }) : [], [dados, agora, janelaRecorrencias, contaId, categoriaId]);
  const totalCategorias = categorias.reduce((total, item) => total + item.total, 0);
  const orcamentosFiltrados = categoriaId ? orcamentos.filter((item) => String(item.categoriaId) === categoriaId) : orcamentos;
  const resumoOrcamentos = orcamentosFiltrados.reduce((total, item) => ({ limite: total.limite + Number(item.valorLimite), gasto: total.gasto + Number(item.gastoRealizado) }), { limite: 0, gasto: 0 });
  const orcamentosEstourados = orcamentosFiltrados.filter((item) => item.status === "ESTOURADO");
  const cartoesVisiveis = contaId ? cartoesCredito.filter((item) => String(item.contaPagamentoId) === contaId) : cartoesCredito;
  const idsCartoesVisiveis = new Set(cartoesVisiveis.map((item) => item.id));
  const faturasVisiveis = faturasCartao.filter((grupo) => grupo[0] && idsCartoesVisiveis.has(grupo[0].cartaoId));
  const resumoCartoes = cartoesVisiveis.reduce((total, cartao) => ({ limite: total.limite + Number(cartao.limiteTotal), utilizado: total.utilizado + Number(cartao.limiteUtilizado) }), { limite: 0, utilizado: 0 });
  const faturaCartaoAtual = faturasVisiveis.reduce((total, grupo) => total + (grupo[0]?.paga ? 0 : Number(grupo[0]?.total ?? 0)), 0);
  const totalParceladoCartao = faturasVisiveis.reduce((total, grupo) => total + grupo.reduce((soma, fatura) => soma + (fatura.paga ? 0 : Number(fatura.total)), 0), 0);
  const projecaoCartoes = Array.from({ length: 6 }, (_, indice) => ({ mes: faturasVisiveis[0]?.[indice]?.mesReferencia, total: faturasVisiveis.reduce((soma, grupo) => soma + (grupo[indice]?.paga ? 0 : Number(grupo[indice]?.total ?? 0)), 0) }));
  const maiorFaturaProjetada = Math.max(...projecaoCartoes.map((item) => item.total), 1);
  const filtrosAtivos = Boolean(contaId || categoriaId || mesReferencia !== mesAtual);
  const [anoReferencia, numeroMesReferencia] = mesReferencia.split("-").map(Number);
  const dataReferencia = new Date(anoReferencia, numeroMesReferencia - 1, 1, 12);
  const referencia = capitalizarPrimeira(mesLongo.format(dataReferencia));

  function selecionarCategoria(id) { setCategoriaId((atual) => String(atual) === String(id) ? "" : String(id)); }
  function limparFiltros() { setContaId(""); setCategoriaId(""); setMesReferencia(mesAtual); }
  function moverMes(deslocamento) {
    const [ano, mes] = mesReferencia.split("-").map(Number);
    setMesReferencia(chaveMes(new Date(ano, mes - 1 + deslocamento, 1, 12)));
  }
  async function recarregar() {
    setErro("");
    setDados(null);
    try {
      const [dadosAtualizados, orcamentosAtualizados, cartoesAtualizados] = await Promise.all([carregarDashboard(), apiFetch(`/orcamentos?mesReferencia=${mesReferencia}-01`), apiFetch("/cartoes")]);
      const faturasAtualizadas = await Promise.all(cartoesAtualizados.map((cartao) => apiFetch(`/cartoes/${cartao.id}/faturas?mesReferencia=${mesReferencia}-01&meses=6`)));
      setDados(dadosAtualizados);
      setOrcamentos(orcamentosAtualizados);
      setCartoesCredito(cartoesAtualizados);
      setFaturasCartao(faturasAtualizadas);
    } catch (error) {
      setErro(error.message);
    }
  }

  return (
    <main className="page-shell">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><NavegacaoMes referencia={dataReferencia} aoMudar={moverMes} /><h1 className="page-title">Dashboard</h1><p className="page-description">Seu dinheiro hoje, no fechamento do mês e no próximo ciclo.</p></div><Link href="/transacoes" className={`${botaoSecundario} self-start lg:self-auto`}>Transações <Icone nome="setaDireita" className="size-3.5" /></Link></header>

      {erro && <FeedbackErro mensagem={`${erro} Verifique se o backend está em execução.`} aoTentarNovamente={recarregar} />}

      {!erro && dados && <section className="content-enter mt-5 rounded-2xl border border-primary/8 bg-white/65 p-3 shadow-[var(--shadow-soft)] backdrop-blur-sm" aria-label="Filtros do dashboard">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto_1fr] xl:items-center"><SelectCampo valor={contaId} aoAlterar={setContaId} opcoes={(dados?.contas ?? []).map((conta) => ({ valor: String(conta.id), rotulo: conta.nome }))} rotulo="Filtrar por conta" placeholder="Todas as contas" /><SelectCampo valor={categoriaId} aoAlterar={setCategoriaId} opcoes={categoriasFiltro} rotulo="Filtrar por categoria" placeholder="Todas as categorias" /><FiltroSegmentado valor={periodo} aoAlterar={setPeriodo} rotulo="Período da tendência" opcoes={[{ valor: "6", rotulo: "6 meses" }, { valor: "12", rotulo: "12 meses" }]} /><SelectCampo valor={taxaMeta} aoAlterar={setTaxaMeta} opcoes={[{ valor: "10", rotulo: "Poupar 10%" }, { valor: "20", rotulo: "Poupar 20%" }, { valor: "30", rotulo: "Poupar 30%" }]} rotulo="Referência de poupança" obrigatorio /></div>
        {filtrosAtivos && <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-primary/6 pt-3">{contaId && <button type="button" onClick={() => setContaId("")} className="rounded-full bg-primary/6 px-2.5 py-1 text-[.62rem] font-bold text-primary">{dados?.contas.find((item) => String(item.id) === contaId)?.nome} ×</button>}{categoriaId && <button type="button" onClick={() => setCategoriaId("")} className="rounded-full bg-primary/6 px-2.5 py-1 text-[.62rem] font-bold text-primary">{categoriasFiltro.find((item) => item.valor === categoriaId)?.rotulo} ×</button>}{mesReferencia !== mesAtual && <button type="button" onClick={() => setMesReferencia(mesAtual)} className="rounded-full bg-primary/6 px-2.5 py-1 text-[.62rem] font-bold text-primary">{referencia} ×</button>}<button type="button" onClick={limparFiltros} className="ml-auto text-[.65rem] font-extrabold text-secondary underline decoration-secondary/25 underline-offset-4">Limpar filtros</button></div>}
      </section>}

      {!erro && (!dados || !analise) ? <div className="mt-5 grid gap-4 lg:grid-cols-4"><EsqueletoBloco className="h-44 lg:col-span-2" /><div className="paper-card overflow-hidden rounded-2xl lg:col-span-2"><EsqueletoLista linhas={3} /></div></div> : !erro && dados && analise ? <div className="content-enter">
        <section className="mt-6"><h2 className="mb-3 text-lg font-extrabold tracking-[-.025em] text-primary">Sua posição agora</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><CartaoMetrica rotulo={analise.mesAtual ? "Saldo consolidado" : `Saldo em ${dataCurta.format(analise.corte)}`} valor={moeda.format(analise.saldo)} detalhe={contaId ? "Conta selecionada" : `${dados.contas.length} ${dados.contas.length === 1 ? "conta" : "contas"}`} icone="carteira" destaque /><CartaoMetrica rotulo="Gasto no mês" valor={moeda.format(analise.despesas)} detalhe={`${moeda.format(analise.receitas)} recebidos`} icone="setaBaixo" tom="negativo" /><CartaoMetrica rotulo="Resultado" valor={moeda.format(analise.resultado)} detalhe="Receitas menos despesas" icone="transacoes" tom={analise.resultado >= 0 ? "positivo" : "negativo"} /><CartaoMetrica rotulo="Taxa de poupança" valor={percentual(analise.taxaPoupanca)} detalhe={`Referência de ${taxaMeta}%`} icone="grafico" tom={analise.taxaPoupanca >= Number(taxaMeta) ? "positivo" : "negativo"} /></div></section>

        <section className="mt-5 grid gap-4 xl:grid-cols-[1.12fr_.88fr]">
          <article className="relative overflow-hidden rounded-2xl bg-[#102d28] p-5 text-white shadow-[0_20px_50px_rgba(0,58,48,.16)] sm:p-6"><div className="absolute -right-20 -top-28 size-72 rounded-full border border-white/8" /><div className="absolute -right-8 -top-16 size-52 rounded-full border border-white/8" /><div className="relative grid gap-7 md:grid-cols-[1.05fr_.95fr] md:items-end"><div><p className="text-[.65rem] font-extrabold uppercase tracking-[.14em] text-white/45">Posso gastar mais?</p><p className={`mt-3 text-3xl font-extrabold tracking-[-.045em] sm:text-4xl ${analise.margemLivre >= 0 ? "text-[#a7dfc5]" : "text-[#f3ad9e]"}`}>{moeda.format(Math.abs(analise.margemLivre))}</p><p className="mt-2 max-w-md text-xs leading-5 text-white/60">{analise.margemLivre >= 0 ? `de margem estimada, preservando ${taxaMeta}% da receita projetada.` : `faltariam para encerrar o mês preservando ${taxaMeta}% da receita projetada.`}</p></div><div className="rounded-xl border border-white/8 bg-white/[.055] p-4"><div className="flex items-center justify-between text-[.65rem]"><span className="text-white/55">Despesa realizada</span><strong>{moeda.format(analise.despesas)}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#d7aa68]" style={{ width: `${Math.min((analise.despesas / Math.max(analise.despesasProjetadas, 1)) * 100, 100)}%` }} /></div><div className="mt-3 flex items-center justify-between text-[.65rem]"><span className="text-white/55">Fechamento projetado</span><strong>{moeda.format(analise.despesasProjetadas)}</strong></div></div></div></article>
          <article className="paper-card rounded-2xl p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><h2 className="text-lg font-extrabold text-primary">Ritmo do mês</h2><span className={`rounded-full px-2.5 py-1 text-[.62rem] font-extrabold ${analise.resultadoProjetado >= 0 ? "bg-positive/8 text-positive" : "bg-error/8 text-error"}`}>{analise.resultadoProjetado >= 0 ? "Superávit previsto" : "Déficit previsto"}</span></div><div className="mt-6 grid grid-cols-2 gap-5"><div><p className="text-xs text-foreground-soft">Despesa projetada</p><p className="mt-1 text-lg font-extrabold text-primary">{moeda.format(analise.despesasProjetadas)}</p></div><div><p className="text-xs text-foreground-soft">Saldo ao fechar</p><p className={`mt-1 text-lg font-extrabold ${tomValor(analise.saldoProjetado)}`}>{moeda.format(analise.saldoProjetado)}</p></div></div><BarraProgresso valor={analise.despesas} limite={analise.despesasProjetadas} cor="bg-secondary" className="mt-5" /></article>
        </section>

        <section className="mt-5 grid gap-4 xl:grid-cols-[.78fr_1.22fr]">
          <article className="paper-card rounded-2xl p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><h2 className="text-base font-extrabold text-primary">Próximos compromissos</h2><FiltroSegmentado valor={janelaRecorrencias} aoAlterar={setJanelaRecorrencias} rotulo="Janela de recorrências" opcoes={[{ valor: "7", rotulo: "7 dias" }, { valor: "30", rotulo: "30 dias" }]} /></div><div className="mt-4 divide-y divide-primary/6">{proximas.slice(0, 5).map((item, indice) => <div key={`${item.id}-${item.dataOcorrencia}-${indice}`} className="flex items-center gap-3 py-3"><span className={`grid size-9 shrink-0 place-items-center rounded-xl text-[.62rem] font-extrabold ${item.tipo === "RECEITA" ? "bg-positive/9 text-positive" : "bg-error/8 text-error"}`}>{String(item.dataOcorrencia.getDate()).padStart(2, "0")}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold text-primary">{item.descricao}</p><p className="mt-0.5 truncate text-[.6rem] text-foreground-soft">{item.contaNome} · {dataCurta.format(item.dataOcorrencia)}</p></div><strong className={`whitespace-nowrap text-xs ${item.tipo === "RECEITA" ? "text-positive" : "text-primary"}`}>{item.tipo === "RECEITA" ? "+" : "−"}{moeda.format(item.valor)}</strong></div>)}{!proximas.length && <EstadoVazio compacto icone="recorrencias" titulo="Nenhuma recorrência nesta janela" descricao="Altere o período ou cadastre um novo compromisso." />}</div><Link href="/recorrencias" className="mt-4 flex items-center justify-between text-xs font-extrabold text-secondary">Gerenciar recorrências <Icone nome="setaDireita" className="size-3.5" /></Link></article>
          <article className="paper-card rounded-2xl p-5 sm:p-6"><div><h2 className="text-base font-extrabold text-primary">Comprometimento fixo</h2><p className="mt-1 text-xs text-foreground-soft">Parcela da receita projetada que já tem destino.</p></div><MedidorComprometimento percentual={fixo.percentual} /><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-primary/[.035] p-4"><p className="text-xs text-foreground-soft">Fixos previstos</p><p className="mt-1 text-sm font-extrabold text-primary">{moeda.format(fixo.total)}</p></div><div className="rounded-xl bg-primary/[.035] p-4"><p className="text-xs text-foreground-soft">Receita projetada</p><p className="mt-1 text-sm font-extrabold text-positive">{moeda.format(analise.receitasProjetadas)}</p></div><div className="rounded-xl bg-primary/[.035] p-4"><p className="text-xs text-foreground-soft">Resultado projetado</p><p className={`mt-1 text-sm font-extrabold ${tomValor(analise.resultadoProjetado)}`}>{moeda.format(analise.resultadoProjetado)}</p></div></div></article>
        </section>

        <section className="mt-5 grid gap-4 2xl:grid-cols-[.75fr_1.25fr]">
          <article className="paper-card rounded-2xl p-5 sm:p-6"><div><h2 className="text-base font-extrabold text-primary">Onde você mais gasta</h2><p className="mt-1 text-[.68rem] text-foreground-soft">Top 5 categorias em valor e participação na receita.</p></div>{categorias.length ? <><RoscaCategorias itens={categorias.slice(0, 6)} total={totalCategorias} selecionada={categoriaId} aoSelecionar={selecionarCategoria} /><div className="mt-3 space-y-1">{categorias.slice(0, 5).map((item, indice) => <button key={item.id} type="button" onClick={() => selecionarCategoria(item.id)} className={`interactive-row flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${String(categoriaId) === item.id ? "bg-primary/[.055] ring-1 ring-primary/10" : ""}`}><span className="size-2.5 shrink-0 rounded-full" style={{ background: CORES[indice % CORES.length] }} /><span className="min-w-0 flex-1 truncate text-xs font-bold text-primary">{item.nome}</span><span className="text-[.65rem] text-foreground-soft">{percentual(item.percentualReceita)} da receita</span><strong className="w-24 text-right text-xs text-primary">{moeda.format(item.total)}</strong></button>)}</div></> : <div className="mt-5"><EstadoVazio compacto icone="categorias" titulo="Nenhuma despesa encontrada" descricao="Ajuste os filtros para consultar outra composição." /></div>}</article>
          <article className="paper-card overflow-hidden rounded-2xl"><header className="border-b border-primary/7 px-5 py-5 sm:px-6"><h2 className="text-base font-extrabold text-primary">Fora do padrão?</h2><p className="mt-1 text-[.68rem] text-foreground-soft">O mês selecionado comparado à média dos três anteriores.</p></header><div className="divide-y divide-primary/6">{categorias.slice(0, 6).map((item) => { const media = medias.get(item.id) ?? 0; const delta = media > 0 ? ((item.total - media) / media) * 100 : null; return <button key={item.id} type="button" onClick={() => selecionarCategoria(item.id)} className="interactive-row grid w-full grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 text-left sm:grid-cols-[1fr_9rem_7rem] sm:px-6"><div className="min-w-0"><p className="truncate text-xs font-extrabold text-primary">{item.nome}</p><div className="mt-2 max-w-xs"><BarraProgresso valor={item.total} limite={Math.max(item.total, media, 1)} cor={delta !== null && delta > 10 ? "bg-error/70" : "bg-secondary"} /></div></div><div className="hidden text-right sm:block"><p className="text-[.58rem] text-foreground-soft">média de 3 meses</p><p className="mt-0.5 text-xs font-bold text-primary">{moeda.format(media)}</p></div><div className="text-right"><p className="text-xs font-extrabold text-primary">{moeda.format(item.total)}</p><p className={`mt-1 text-[.6rem] font-extrabold ${delta === null ? "text-foreground-soft" : delta > 10 ? "text-error" : "text-positive"}`}>{delta === null ? "sem histórico" : `${delta >= 0 ? "+" : ""}${percentual(delta)}`}</p></div></button>; })}{!categorias.length && <EstadoVazio compacto icone="grafico" titulo="Comparativo indisponível" descricao="Ele aparecerá quando houver despesas no período." />}</div></article>
        </section>

        <section className="paper-card mt-5 overflow-hidden rounded-2xl">
          <header className="flex items-center justify-between gap-4 border-b border-primary/7 px-5 py-4 sm:px-6"><div><h2 className="text-base font-extrabold text-primary">Orçamento × realizado</h2><p className="mt-0.5 text-xs text-foreground-soft">Limites definidos para {referencia.toLowerCase()}.</p></div><Link href="/categorias" className="shrink-0 text-xs font-extrabold text-secondary">Gerenciar</Link></header>
          {orcamentosFiltrados.length ? <><div className="grid border-b border-primary/7 sm:grid-cols-3 sm:divide-x sm:divide-primary/7"><div className="px-5 py-4 sm:px-6"><p className="text-xs text-foreground-soft">Planejado</p><p className="mt-1 text-lg font-extrabold text-primary">{moeda.format(resumoOrcamentos.limite)}</p></div><div className="border-t border-primary/7 px-5 py-4 sm:border-t-0 sm:px-6"><p className="text-xs text-foreground-soft">Realizado</p><p className="mt-1 text-lg font-extrabold text-primary">{moeda.format(resumoOrcamentos.gasto)}</p></div><div className="border-t border-primary/7 px-5 py-4 sm:border-t-0 sm:px-6"><p className="text-xs text-foreground-soft">Disponível</p><p className={`mt-1 text-lg font-extrabold ${tomValor(resumoOrcamentos.limite - resumoOrcamentos.gasto)}`}>{moeda.format(resumoOrcamentos.limite - resumoOrcamentos.gasto)}</p></div></div><div className="grid gap-x-8 px-5 py-3 sm:grid-cols-2 sm:px-6">{orcamentosFiltrados.slice(0, 6).map((item) => <div key={item.id} className="py-3"><div className="flex items-center justify-between gap-3"><span className="truncate text-xs font-extrabold text-primary">{item.categoriaNome}</span><span className={`text-[.62rem] font-extrabold ${item.status === "ESTOURADO" ? "text-error" : item.status === "ATENCAO" ? "text-[#8a5a1e]" : "text-positive"}`}>{Number(item.percentualUtilizado).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/7"><div className={`h-full rounded-full transition-all duration-500 ${item.status === "ESTOURADO" ? "bg-error" : item.status === "ATENCAO" ? "bg-[#d39a52]" : "bg-secondary"}`} style={{ width: `${Math.min(Number(item.percentualUtilizado), 100)}%` }} /></div></div>)}</div></> : <EstadoVazio icone="grafico" titulo="Nenhum orçamento neste mês" descricao="Defina limites nas categorias para comparar o planejado ao realizado." acao={<Link href="/categorias" className={botaoSecundario}>Abrir categorias</Link>} />}
        </section>

        <section className="paper-card mt-5 overflow-hidden rounded-2xl">
          <header className="flex items-center justify-between gap-4 border-b border-primary/7 px-5 py-4 sm:px-6"><div><h2 className="text-base font-extrabold text-primary">Cartões de crédito</h2><p className="mt-0.5 text-xs text-foreground-soft">Fatura atual, limite e parcelas já comprometidas.</p></div><Link href="/cartoes" className="shrink-0 text-xs font-extrabold text-secondary">Gerenciar</Link></header>
          {cartoesVisiveis.length ? <><div className="grid border-b border-primary/7 sm:grid-cols-3 sm:divide-x sm:divide-primary/7"><div className="px-5 py-4 sm:px-6"><p className="text-xs text-foreground-soft">Fatura em aberto</p><p className="mt-1 text-lg font-extrabold text-primary">{moeda.format(faturaCartaoAtual)}</p></div><div className="border-t border-primary/7 px-5 py-4 sm:border-t-0 sm:px-6"><p className="text-xs text-foreground-soft">Limite utilizado</p><p className="mt-1 text-lg font-extrabold text-primary">{percentual((resumoCartoes.utilizado / Math.max(resumoCartoes.limite, 1)) * 100)}</p><p className="mt-0.5 text-[.6rem] text-foreground-soft">{moeda.format(resumoCartoes.utilizado)} de {moeda.format(resumoCartoes.limite)}</p></div><div className="border-t border-primary/7 px-5 py-4 sm:border-t-0 sm:px-6"><p className="text-xs text-foreground-soft">Próximas 6 em aberto</p><p className="mt-1 text-lg font-extrabold text-primary">{moeda.format(totalParceladoCartao)}</p></div></div><div className="grid gap-3 px-5 py-5 sm:grid-cols-3 lg:grid-cols-6 sm:px-6">{projecaoCartoes.map((item, indice) => <button type="button" key={item.mes ?? indice} onClick={() => item.mes && setMesReferencia(item.mes.slice(0, 7))} className="interactive-row rounded-xl px-3 py-3 text-left"><span className="text-[.6rem] font-bold capitalize text-foreground-soft">{item.mes ? mesCurto.format(new Date(`${item.mes}T12:00:00`)).replace(".", "") : "—"}</span><strong className="mt-1 block text-xs text-primary">{moeda.format(item.total)}</strong><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/7"><div className="h-full rounded-full bg-[#d39a52] transition-all duration-500" style={{ width: `${(item.total / maiorFaturaProjetada) * 100}%` }} /></div></button>)}</div></> : <EstadoVazio icone="cartoes" titulo={contaId ? "Nenhum cartão ligado a esta conta" : "Nenhum cartão cadastrado"} descricao="Cadastre seus cartões para acompanhar faturas e parcelas futuras." acao={!contaId && <Link href="/cartoes" className={botaoSecundario}>Cadastrar cartão</Link>} />}
        </section>

        <section className="mt-5 grid gap-4 xl:grid-cols-2">
          <article className="paper-card rounded-2xl p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><h2 className="text-base font-extrabold text-primary">Receita × despesa</h2><div className="hidden gap-3 text-[.58rem] font-bold text-foreground-soft sm:flex"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-positive" />Receita</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-error/65" />Despesa</span></div></div><GraficoComparativo dados={serie.map((item) => ({ ...item, rotulo: mesCurto.format(item.data).replace(".", ""), rotuloCompleto: capitalizarPrimeira(mesLongo.format(item.data)) }))} serieA={{ chave: "receitas", rotulo: "Receita", cor: "#087b55" }} serieB={{ chave: "despesas", rotulo: "Despesa", cor: "#b44337" }} formatar={(valor) => moeda.format(valor)} selecionado={mesReferencia} aoSelecionar={setMesReferencia} /></article>
          <article className="paper-card rounded-2xl p-5 sm:p-6"><div><h2 className="text-base font-extrabold text-primary">Evolução do saldo</h2><p className="mt-1 text-[.68rem] text-foreground-soft">Patrimônio consolidado ao fim de cada mês.</p></div><GraficoSaldo serie={serie} aoSelecionar={setMesReferencia} /></article>
        </section>

        <section className="mt-5 rounded-2xl border border-primary/8 bg-[#ebe4d8]/70 p-5 sm:p-6"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><h2 className="text-lg font-extrabold text-primary">Sinais de atenção</h2><p className="text-xs text-foreground-soft">Referências do painel; ainda não são metas salvas.</p></div><div className="mt-5 grid gap-3 md:grid-cols-3"><div className="rounded-xl bg-white/70 p-4"><span className={`grid size-8 place-items-center rounded-full ${analise.taxaPoupanca >= Number(taxaMeta) ? "bg-positive/10 text-positive" : "bg-error/9 text-error"}`}><Icone nome={analise.taxaPoupanca >= Number(taxaMeta) ? "check" : "grafico"} className="size-4" /></span><p className="mt-3 text-xs font-extrabold text-primary">Poupança de referência</p><p className="mt-1 text-[.65rem] leading-5 text-foreground-soft">{analise.taxaPoupanca >= Number(taxaMeta) ? `Você está acima dos ${taxaMeta}% escolhidos.` : `Faltam ${percentual(Number(taxaMeta) - analise.taxaPoupanca)} para a referência de ${taxaMeta}%.`}</p></div><div className="rounded-xl bg-white/70 p-4"><span className={`grid size-8 place-items-center rounded-full ${orcamentosEstourados.length ? "bg-error/9 text-error" : "bg-positive/10 text-positive"}`}><Icone nome="categorias" className="size-4" /></span><p className="mt-3 text-xs font-extrabold text-primary">Limites por categoria</p><p className="mt-1 text-[.65rem] leading-5 text-foreground-soft">{orcamentosEstourados.length ? `${orcamentosEstourados.slice(0, 2).map((item) => item.categoriaNome).join(" e ")} ${orcamentosEstourados.length > 2 ? `e mais ${orcamentosEstourados.length - 2}` : ""} ultrapassaram o planejado.` : orcamentosFiltrados.length ? "Todos os orçamentos estão dentro do limite." : "Nenhum orçamento foi definido para o período."}</p></div><div className="rounded-xl bg-white/70 p-4"><span className={`grid size-8 place-items-center rounded-full ${proximoMes?.necessidade ? "bg-error/9 text-error" : "bg-positive/10 text-positive"}`}><Icone nome="calendario" className="size-4" /></span><p className="mt-3 text-xs font-extrabold text-primary">{proximoMes ? capitalizarPrimeira(mesLongo.format(proximoMes.referencia)) : "Próximo ciclo"}</p><p className="mt-1 text-[.65rem] leading-5 text-foreground-soft">{proximoMes?.necessidade ? `As despesas fixas superam as receitas fixas em ${moeda.format(proximoMes.necessidade)}. Esse valor precisará vir de renda adicional ou do saldo.` : `As receitas recorrentes cobrem os ${moeda.format(proximoMes?.despesas ?? 0)} já previstos para o mês.`}</p></div></div></section>
      </div> : null}
    </main>
  );
}
