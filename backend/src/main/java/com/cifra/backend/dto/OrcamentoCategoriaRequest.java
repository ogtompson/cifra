package com.cifra.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record OrcamentoCategoriaRequest(
        @NotNull(message = "A categoria é obrigatória")
        Long categoriaId,

        @NotNull(message = "O mês de referência é obrigatório")
        LocalDate mesReferencia,

        @NotNull(message = "O limite é obrigatório")
        @DecimalMin(value = "0.01", message = "O limite deve ser maior que zero")
        BigDecimal valorLimite
) {
}
