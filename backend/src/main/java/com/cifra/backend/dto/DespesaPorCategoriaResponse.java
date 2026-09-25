package com.cifra.backend.dto;

import java.math.BigDecimal;

public record DespesaPorCategoriaResponse(
        Long categoriaId,
        String categoriaNome,
        BigDecimal total
) {
}
