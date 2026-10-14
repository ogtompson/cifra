package com.cifra.backend.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record PagamentoFaturaRequest(
        @NotNull(message = "A data do pagamento é obrigatória") LocalDate dataPagamento
) {
}
