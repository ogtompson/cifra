const UM_DIA = 86_400_000;

export function criarData(iso) {
  return new Date(`${iso}T12:00:00`);
}

export function isoLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function chaveMes(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

export function limitesMes(chave) {
  const [ano, mes] = chave.split("-").map(Number);
  return {
    inicio: new Date(ano, mes - 1, 1, 12),
    fim: new Date(ano, mes, 0, 12),
  };
}

export function mesesAte(chaveFinal, quantidade) {
  const { inicio: referencia } = limitesMes(chaveFinal);
  return Array.from({ length: quantidade }, (_, indice) => {
    const deslocamento = indice - quantidade + 1;
    const data = new Date(referencia.getFullYear(), referencia.getMonth() + deslocamento, 1, 12);
    return { chave: chaveMes(data), data };
  });
}

function dataMensal(item, ano, mes) {
  const ultimoDia = new Date(ano, mes + 1, 0, 12).getDate();
  return new Date(ano, mes, Math.min(Number(item.diaDoMes) || 1, ultimoDia), 12);
}

export function ocorrenciasEntre(item, inicioPeriodo, fimPeriodo) {
  if (!item.ativa) return [];
  const inicioCiclo = criarData(item.dataInicio);
  const fimCiclo = item.dataFim ? criarData(item.dataFim) : null;
  const inicio = inicioPeriodo > inicioCiclo ? inicioPeriodo : inicioCiclo;
  const fim = fimCiclo && fimCiclo < fimPeriodo ? fimCiclo : fimPeriodo;
  if (inicio > fim) return [];

  if (item.frequencia === "MENSAL") {
    const datas = [];
    let cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1, 12);
    const limite = new Date(fim.getFullYear(), fim.getMonth(), 1, 12);
    while (cursor <= limite) {
      const data = dataMensal(item, cursor.getFullYear(), cursor.getMonth());
      if (data >= inicio && data <= fim) datas.push(data);
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1, 12);
    }
    return datas;
  }

  if (item.frequencia === "ANUAL") {
    const datas = [];
    for (let ano = inicio.getFullYear(); ano <= fim.getFullYear(); ano += 1) {
      const data = new Date(ano, inicioCiclo.getMonth(), inicioCiclo.getDate(), 12);
      if (data >= inicio && data <= fim) datas.push(data);
    }
    return datas;
  }

  const datas = [];
  const diasDesdeInicio = Math.max(Math.floor((inicio - inicioCiclo) / UM_DIA), 0);
  const saltos = Math.ceil(diasDesdeInicio / 7);
  const cursor = new Date(inicioCiclo);
  cursor.setDate(cursor.getDate() + saltos * 7);
  while (cursor <= fim) {
    datas.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return datas;
}

function soma(lista, seletor = (item) => item) {
  return lista.reduce((total, item) => total + Number(seletor(item) || 0), 0);
}

export function filtrarMovimentos(transacoes, { contaId = "", categoriaId = "" } = {}) {
  return transacoes.filter((item) =>
    (!contaId || String(item.contaId) === String(contaId)) &&
    (!categoriaId || String(item.categoriaId) === String(categoriaId))
  );
}

export function filtrarRecorrencias(recorrencias, { contaId = "", categoriaId = "" } = {}) {
  return recorrencias.filter((item) =>
    item.ativa &&
    (!contaId || String(item.contaId) === String(contaId)) &&
    (!categoriaId || String(item.categoriaId) === String(categoriaId))
  );
}

export function saldoAte(contas, transacoes, dataLimite, contaId = "") {
  const contasConsideradas = contas.filter((conta) => !contaId || String(conta.id) === String(contaId));
  const ids = new Set(contasConsideradas.map((conta) => String(conta.id)));
  const inicial = soma(contasConsideradas, (conta) => conta.saldoInicial);
  const movimentos = transacoes.filter((item) => ids.has(String(item.contaId)) && criarData(item.data) <= dataLimite);
  return inicial + soma(movimentos, (item) => item.tipo === "RECEITA" ? item.valor : -Number(item.valor));
}

export function resumoMes({ transacoes, recorrencias, contas, chave, contaId = "", categoriaId = "", taxaMeta = 20, hoje = new Date() }) {
  const { inicio, fim } = limitesMes(chave);
  const hojeNormalizado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 12);
  const mesAtual = chaveMes(hojeNormalizado) === chave;
  const corte = mesAtual ? (hojeNormalizado < fim ? hojeNormalizado : fim) : fim;
  const movimentosFiltrados = filtrarMovimentos(transacoes, { contaId, categoriaId });
  const movimentosMes = movimentosFiltrados.filter((item) => {
    const data = criarData(item.data);
    return data >= inicio && data <= corte;
  });
  const receitas = soma(movimentosMes.filter((item) => item.tipo === "RECEITA"), (item) => item.valor);
  const despesas = soma(movimentosMes.filter((item) => item.tipo === "DESPESA"), (item) => item.valor);
  const resultado = receitas - despesas;
  const taxaPoupanca = receitas > 0 ? (resultado / receitas) * 100 : 0;
  const diasCorridos = Math.max(Math.min(corte.getDate(), fim.getDate()), 1);
  const projecaoRitmo = mesAtual ? (despesas / diasCorridos) * fim.getDate() : despesas;
  const recorrenciasFiltradas = filtrarRecorrencias(recorrencias, { contaId, categoriaId });
  const futuras = recorrenciasFiltradas.flatMap((item) => ocorrenciasEntre(item, new Date(corte.getTime() + UM_DIA), fim).map((data) => ({ ...item, dataOcorrencia: data })));
  const despesasFuturas = soma(futuras.filter((item) => item.tipo === "DESPESA"), (item) => item.valor);
  const receitasFuturas = soma(futuras.filter((item) => item.tipo === "RECEITA"), (item) => item.valor);
  const despesasProjetadas = mesAtual ? Math.max(projecaoRitmo, despesas + despesasFuturas) : despesas;
  const receitasProjetadas = receitas + (mesAtual ? receitasFuturas : 0);
  const resultadoProjetado = receitasProjetadas - despesasProjetadas;
  const poupancaAlvo = receitasProjetadas * (taxaMeta / 100);
  const margemLivre = resultadoProjetado - poupancaAlvo;
  const saldo = saldoAte(contas, transacoes, corte, contaId);
  const saldoProjetado = saldo + (mesAtual ? receitasFuturas - despesasFuturas : 0);

  return {
    inicio, fim, corte, mesAtual, movimentosMes, receitas, despesas, resultado, taxaPoupanca,
    projecaoRitmo, despesasProjetadas, receitasProjetadas, resultadoProjetado, poupancaAlvo,
    margemLivre, saldo, saldoProjetado, futuras,
  };
}

export function serieMensal({ transacoes, contas, chaveFinal, quantidade, contaId = "", categoriaId = "" }) {
  const movimentos = filtrarMovimentos(transacoes, { contaId, categoriaId });
  return mesesAte(chaveFinal, quantidade).map((mes) => {
    const { inicio, fim } = limitesMes(mes.chave);
    const itens = movimentos.filter((item) => {
      const data = criarData(item.data);
      return data >= inicio && data <= fim;
    });
    const receitas = soma(itens.filter((item) => item.tipo === "RECEITA"), (item) => item.valor);
    const despesas = soma(itens.filter((item) => item.tipo === "DESPESA"), (item) => item.valor);
    return { ...mes, receitas, despesas, resultado: receitas - despesas, saldo: saldoAte(contas, transacoes, fim, contaId) };
  });
}

export function categoriasDoMes({ transacoes, chave, contaId = "", categoriaId = "", receitas = 0 }) {
  const { inicio, fim } = limitesMes(chave);
  const despesas = filtrarMovimentos(transacoes, { contaId, categoriaId }).filter((item) => {
    const data = criarData(item.data);
    return item.tipo === "DESPESA" && data >= inicio && data <= fim;
  });
  const agrupadas = new Map();
  despesas.forEach((item) => {
    const id = String(item.categoriaId);
    const atual = agrupadas.get(id) ?? { id, nome: item.categoriaNome, total: 0 };
    atual.total += Number(item.valor);
    agrupadas.set(id, atual);
  });
  return [...agrupadas.values()].sort((a, b) => b.total - a.total).map((item) => ({ ...item, percentualReceita: receitas > 0 ? (item.total / receitas) * 100 : 0 }));
}

export function mediasCategorias({ transacoes, chave, contaId = "" }) {
  const meses = mesesAte(chave, 4).slice(0, 3);
  const totais = new Map();
  meses.forEach((mes) => {
    categoriasDoMes({ transacoes, chave: mes.chave, contaId }).forEach((item) => totais.set(item.id, (totais.get(item.id) ?? 0) + item.total));
  });
  return new Map([...totais].map(([id, total]) => [id, total / 3]));
}

export function proximasRecorrencias({ recorrencias, inicio, dias, contaId = "", categoriaId = "" }) {
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + dias);
  return filtrarRecorrencias(recorrencias, { contaId, categoriaId })
    .flatMap((item) => ocorrenciasEntre(item, inicio, fim).map((data) => ({ ...item, dataOcorrencia: data })))
    .sort((a, b) => a.dataOcorrencia - b.dataOcorrencia);
}

export function compromissoFixo({ recorrencias, receitas, chave, contaId = "", categoriaId = "" }) {
  const { inicio, fim } = limitesMes(chave);
  const despesas = filtrarRecorrencias(recorrencias, { contaId, categoriaId })
    .filter((item) => item.tipo === "DESPESA")
    .flatMap((item) => ocorrenciasEntre(item, inicio, fim).map(() => Number(item.valor)));
  const total = soma(despesas);
  return { total, percentual: receitas > 0 ? (total / receitas) * 100 : 0 };
}

export function previsaoProximoMes({ recorrencias, chave, contaId = "", categoriaId = "" }) {
  const { inicio } = limitesMes(chave);
  const referencia = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1, 12);
  const fim = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0, 12);
  const ocorrencias = filtrarRecorrencias(recorrencias, { contaId, categoriaId })
    .flatMap((item) => ocorrenciasEntre(item, referencia, fim).map((data) => ({ ...item, dataOcorrencia: data })));
  const receitas = soma(ocorrencias.filter((item) => item.tipo === "RECEITA"), (item) => item.valor);
  const despesas = soma(ocorrencias.filter((item) => item.tipo === "DESPESA"), (item) => item.valor);
  return { referencia, ocorrencias, receitas, despesas, necessidade: Math.max(despesas - receitas, 0), resultado: receitas - despesas };
}
