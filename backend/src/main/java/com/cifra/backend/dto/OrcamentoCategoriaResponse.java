package com.cifra.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record OrcamentoCategoriaResponse(
        Long id,
        Long categoriaId,
        String categoriaNome,
        LocalDate mesReferencia,
        BigDecimal valorLimite,
        BigDecimal gastoRealizado,
        BigDecimal saldoDisponivel,
        BigDecimal percentualUtilizado,
        String status
) {
}
