package com.cifra.backend.security;

public class UsuarioAtualFixo extends UsuarioAtual {

    private final Long usuarioId;

    public UsuarioAtualFixo(Long usuarioId) {
        this.usuarioId = usuarioId;
    }

    @Override
    public Long id() {
        return usuarioId;
    }
}
