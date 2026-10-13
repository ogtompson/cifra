package com.cifra.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ParcelaFaturaResponse(
        Long compraId,
        String descricao,
        BigDecimal valor,
        Integer parcela,
        Integer totalParcelas,
        LocalDate vencimento,
        Long categoriaId,
        String categoriaNome
) {
}
