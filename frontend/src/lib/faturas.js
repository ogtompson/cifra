function criarData(iso) {
  return new Date(`${iso}T12:00:00`);
}

export function compromissosDeFaturas(cartoes, gruposFaturas, { contaId = "", categoriaId = "", incluirPagas = false } = {}) {
  const cartoesPorId = new Map(cartoes.map((cartao) => [String(cartao.id), cartao]));
  const faturas = gruposFaturas.flatMap((grupo) => Array.isArray(grupo) ? grupo : [grupo]);

  return faturas.flatMap((fatura) => {
    const cartao = cartoesPorId.get(String(fatura.cartaoId));
    if (!cartao || (!incluirPagas && fatura.paga) || (contaId && String(cartao.contaPagamentoId) !== String(contaId))) return [];

    const parcelas = categoriaId
      ? fatura.parcelas.filter((parcela) => String(parcela.categoriaId) === String(categoriaId))
      : fatura.parcelas;
    const valor = categoriaId
      ? parcelas.reduce((total, parcela) => total + Number(parcela.valor), 0)
      : Number(fatura.total);
    if (valor <= 0) return [];

    return [{
      id: `fatura-${fatura.cartaoId}-${fatura.mesReferencia}${categoriaId ? `-${categoriaId}` : ""}`,
      origem: "FATURA_CARTAO",
      derivado: true,
      ativa: true,
      tipo: "DESPESA",
      descricao: `Fatura ${fatura.cartaoNome}`,
      valor,
      dataOcorrencia: criarData(fatura.dataVencimento),
      contaId: cartao.contaPagamentoId,
      contaNome: cartao.contaPagamentoNome,
      categoriaId: categoriaId || null,
      categoriaNome: categoriaId ? parcelas[0]?.categoriaNome : "Cartão de crédito",
      cartaoId: fatura.cartaoId,
      mesReferencia: fatura.mesReferencia,
      paga: fatura.paga,
      dataPagamento: fatura.dataPagamento,
    }];
  });
}
