package com.cifra.backend.dto;

import java.math.BigDecimal;

public record SaldoContaResponse(
        Long contaId,
        String contaNome,
        BigDecimal saldoInicial,
        BigDecimal totalReceitas,
        BigDecimal totalDespesas,
        BigDecimal saldoAtual
) {
}
