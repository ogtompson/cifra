package com.cifra.backend.dto;

import java.time.Instant;

public record AutenticacaoResponse(
        String token,
        Instant expiraEm,
        UsuarioResponse usuario
) {
}
