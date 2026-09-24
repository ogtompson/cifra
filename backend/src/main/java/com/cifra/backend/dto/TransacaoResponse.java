package com.cifra.backend.dto;

import com.cifra.backend.model.enums.TipoOperacao;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransacaoResponse(
        Long id,
        String descricao,
        BigDecimal valor,
        LocalDate data,
        TipoOperacao tipo,
        Long contaId,
        String contaNome,
        Long categoriaId,
        String categoriaNome,
        Long recorrenciaId
) {
}
