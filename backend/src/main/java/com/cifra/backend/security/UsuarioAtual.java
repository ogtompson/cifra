package com.cifra.backend.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class UsuarioAtual {

    public UsuarioAutenticado obter() {
        Authentication autenticacao = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacao == null || !(autenticacao.getPrincipal() instanceof UsuarioAutenticado usuario)) {
            throw new IllegalStateException("Não há usuário autenticado no contexto atual");
        }
        return usuario;
    }

    public Long id() {
        return obter().usuarioId();
    }
}
