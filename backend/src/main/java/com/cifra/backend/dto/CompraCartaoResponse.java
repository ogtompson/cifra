package com.cifra.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CompraCartaoResponse(
        Long id,
        String descricao,
        BigDecimal valorTotal,
        LocalDate dataCompra,
        Integer numeroParcelas,
        BigDecimal valorParcela,
        LocalDate primeiroVencimento,
        LocalDate ultimoVencimento,
        Long cartaoId,
        String cartaoNome,
        Long contaPagamentoId,
        String contaPagamentoNome,
        Long categoriaId,
        String categoriaNome
) {
}
