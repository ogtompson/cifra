package com.cifra.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CompraCartaoRequest(
        @NotBlank @Size(max = 150) String descricao,
        @NotNull @DecimalMin(value = "0.01") @Digits(integer = 10, fraction = 2) BigDecimal valorTotal,
        @NotNull LocalDate dataCompra,
        @NotNull @Min(1) @Max(48) Integer numeroParcelas,
        @NotNull Long cartaoId,
        @NotNull Long categoriaId
) {
}
