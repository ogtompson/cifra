package com.cifra.backend.controller;

import com.cifra.backend.dto.AutenticacaoResponse;
import com.cifra.backend.dto.CadastroRequest;
import com.cifra.backend.dto.LoginRequest;
import com.cifra.backend.dto.UsuarioResponse;
import com.cifra.backend.security.UsuarioAutenticado;
import com.cifra.backend.service.AutenticacaoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AutenticacaoController {

    private final AutenticacaoService autenticacaoService;

    public AutenticacaoController(AutenticacaoService autenticacaoService) {
        this.autenticacaoService = autenticacaoService;
    }

    @PostMapping("/cadastro")
    public ResponseEntity<AutenticacaoResponse> cadastrar(@Valid @RequestBody CadastroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(autenticacaoService.cadastrar(request));
    }

    @PostMapping("/login")
    public AutenticacaoResponse entrar(@Valid @RequestBody LoginRequest request) {
        return autenticacaoService.entrar(request);
    }

    @GetMapping("/me")
    public UsuarioResponse usuarioAtual(@AuthenticationPrincipal UsuarioAutenticado usuario) {
        return autenticacaoService.usuarioAtual(usuario);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> sair(@AuthenticationPrincipal UsuarioAutenticado usuario) {
        autenticacaoService.sair(usuario);
        return ResponseEntity.noContent().build();
    }
}
