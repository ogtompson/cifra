package com.cifra.backend.dto;

import jakarta.validation.constraints.NotNull;

public record ArquivamentoContaRequest(
        @NotNull(message = "A situa\u00e7\u00e3o de arquivamento \u00e9 obrigat\u00f3ria")
        Boolean arquivada
) {
}
