package com.cifra.backend.security;

import com.cifra.backend.model.Sessao;
import com.cifra.backend.repository.SessaoRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.List;

@Component
public class AutenticacaoTokenFilter extends OncePerRequestFilter {

    private static final String PREFIXO = "Bearer ";

    private final SessaoRepository sessaoRepository;
    private final TokenService tokenService;
    private final Clock clock;

    public AutenticacaoTokenFilter(
            SessaoRepository sessaoRepository,
            TokenService tokenService,
            Clock clock
    ) {
        this.sessaoRepository = sessaoRepository;
        this.tokenService = tokenService;
        this.clock = clock;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String autorizacao = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (autorizacao != null && autorizacao.startsWith(PREFIXO)) {
            String token = autorizacao.substring(PREFIXO.length()).trim();
            if (!token.isEmpty()) {
                autenticar(token, Instant.now(clock));
            }
        }
        filterChain.doFilter(request, response);
    }

    private void autenticar(String token, Instant agora) {
        sessaoRepository.findByTokenHashAndExpiraEmAfter(tokenService.hash(token), agora)
                .map(this::principal)
                .ifPresent(principal -> SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken(principal, null, List.of())
                ));
    }

    private UsuarioAutenticado principal(Sessao sessao) {
        return new UsuarioAutenticado(
                sessao.getUsuario().getId(),
                sessao.getId(),
                sessao.getUsuario().getNome(),
                sessao.getUsuario().getEmail()
        );
    }
}
