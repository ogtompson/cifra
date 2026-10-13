package com.cifra.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CartaoCreditoRequest(
        @NotBlank @Size(max = 80) String nome,
        @NotBlank @Size(max = 30) String bandeira,
        @NotBlank @Pattern(regexp = "\\d{4}", message = "Informe os quatro últimos dígitos") String finalCartao,
        @NotNull @DecimalMin(value = "0.01") @Digits(integer = 10, fraction = 2) BigDecimal limiteTotal,
        @NotNull @Min(1) @Max(31) Integer diaFechamento,
        @NotNull @Min(1) @Max(31) Integer diaVencimento,
        @NotNull Long contaPagamentoId
) {
}
