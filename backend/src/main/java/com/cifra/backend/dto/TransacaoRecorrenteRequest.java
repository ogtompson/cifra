package com.cifra.backend.dto;

import com.cifra.backend.model.enums.Frequencia;
import com.cifra.backend.model.enums.TipoOperacao;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransacaoRecorrenteRequest(
        @NotBlank(message = "A descrição é obrigatória")
        @Size(max = 255, message = "A descrição deve ter no máximo 255 caracteres")
        String descricao,

        @NotNull(message = "O valor é obrigatório")
        @Positive(message = "O valor deve ser maior que zero")
        @Digits(
                integer = 10,
                fraction = 2,
                message = "O valor deve ter no máximo 10 dígitos inteiros e 2 decimais"
        )
        BigDecimal valor,

        @NotNull(message = "O tipo é obrigatório")
        TipoOperacao tipo,

        @NotNull(message = "A frequência é obrigatória")
        Frequencia frequencia,

        @Min(value = 1, message = "O dia do mês deve estar entre 1 e 31")
        @Max(value = 31, message = "O dia do mês deve estar entre 1 e 31")
        Integer diaDoMes,

        @NotNull(message = "A data inicial é obrigatória")
        LocalDate dataInicio,

        LocalDate dataFim,

        @NotNull(message = "A situação da recorrência é obrigatória")
        Boolean ativa,

        @NotNull(message = "A conta é obrigatória")
        Long contaId,

        @NotNull(message = "A categoria é obrigatória")
        Long categoriaId
) {
}
