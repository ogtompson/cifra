package com.cifra.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ResumoFinanceiroResponse(
        LocalDate dataInicio,
        LocalDate dataFim,
        BigDecimal saldoTotal,
        BigDecimal totalReceitas,
        BigDecimal totalDespesas,
        BigDecimal resultadoPeriodo,
        List<DespesaPorCategoriaResponse> despesasPorCategoria
) {
}
