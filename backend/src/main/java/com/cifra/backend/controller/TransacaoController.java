package com.cifra.backend.controller;

import com.cifra.backend.dto.TransacaoRequest;
import com.cifra.backend.dto.TransacaoResponse;
import com.cifra.backend.service.TransacaoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/transacoes")
public class TransacaoController {

    private final TransacaoService transacaoService;

    public TransacaoController(TransacaoService transacaoService) {
        this.transacaoService = transacaoService;
    }

    @GetMapping
    public List<TransacaoResponse> listar(
            @RequestParam(required = false) Long contaId
    ) {
        return transacaoService.listar(contaId);
    }

    @GetMapping("/{id}")
    public TransacaoResponse buscarPorId(@PathVariable Long id) {
        return transacaoService.buscarPorId(id);
    }

    @PostMapping
    public ResponseEntity<TransacaoResponse> criar(
            @Valid @RequestBody TransacaoRequest request,
            UriComponentsBuilder uriBuilder
    ) {
        TransacaoResponse transacao = transacaoService.criar(request);
        URI location = uriBuilder.path("/api/transacoes/{id}")
                .buildAndExpand(transacao.id())
                .toUri();
        return ResponseEntity.created(location).body(transacao);
    }

    @PutMapping("/{id}")
    public TransacaoResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody TransacaoRequest request
    ) {
        return transacaoService.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        transacaoService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
