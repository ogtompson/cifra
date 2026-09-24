package com.cifra.backend.dto;

import com.cifra.backend.model.enums.TipoOperacao;

public record CategoriaResponse(
        Long id,
        String nome,
        TipoOperacao tipo
) {
}
