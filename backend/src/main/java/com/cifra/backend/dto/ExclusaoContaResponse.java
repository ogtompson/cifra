package com.cifra.backend.dto;

public record ExclusaoContaResponse(
        Long contaId,
        String contaNome,
        long totalTransacoes,
        long totalRecorrencias,
        long totalCartoes,
        boolean podeExcluirDiretamente
) {
}
