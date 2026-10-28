package com.cifra.backend.security;

public record UsuarioAutenticado(
        Long usuarioId,
        Long sessaoId,
        String nome,
        String email
) {
}
