package com.cifra.backend.dto;

import com.cifra.backend.model.enums.TipoOperacao;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransacaoRequest(
        @NotBlank(message = "A descrição é obrigatória")
        @Size(max = 150, message = "A descrição deve ter no máximo 150 caracteres")
        String descricao,

        @NotNull(message = "O valor é obrigatório")
        @Positive(message = "O valor deve ser maior que zero")
        @Digits(
                integer = 10,
                fraction = 2,
                message = "O valor deve ter no máximo 10 dígitos inteiros e 2 decimais"
        )
        BigDecimal valor,

        @NotNull(message = "A data é obrigatória")
        LocalDate data,

        @NotNull(message = "O tipo é obrigatório")
        TipoOperacao tipo,

        @NotNull(message = "A conta é obrigatória")
        Long contaId,

        @NotNull(message = "A categoria é obrigatória")
        Long categoriaId
) {
}
