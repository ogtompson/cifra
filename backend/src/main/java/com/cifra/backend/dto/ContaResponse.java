package com.cifra.backend.dto;

import com.cifra.backend.model.enums.TipoConta;

import java.math.BigDecimal;

public record ContaResponse(
        Long id,
        String nome,
        BigDecimal saldoInicial,
        TipoConta tipo
) {
}
