package com.cifra.backend.dto;

import com.cifra.backend.model.enums.Frequencia;
import com.cifra.backend.model.enums.TipoOperacao;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransacaoRecorrenteResponse(
        Long id,
        String descricao,
        BigDecimal valor,
        TipoOperacao tipo,
        Frequencia frequencia,
        Integer diaDoMes,
        LocalDate dataInicio,
        LocalDate dataFim,
        boolean ativa,
        Long contaId,
        String contaNome,
        Long categoriaId,
        String categoriaNome
) {
}
