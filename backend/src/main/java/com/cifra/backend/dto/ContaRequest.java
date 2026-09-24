package com.cifra.backend.dto;

import com.cifra.backend.model.enums.TipoConta;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ContaRequest(
        @NotBlank(message = "O nome é obrigatório")
        @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres")
        String nome,

        @NotNull(message = "O saldo inicial é obrigatório")
        @Digits(
                integer = 10,
                fraction = 2,
                message = "O saldo inicial deve ter no máximo 10 dígitos inteiros e 2 decimais"
        )
        BigDecimal saldoInicial,

        @NotNull(message = "O tipo é obrigatório")
        TipoConta tipo
) {
}
