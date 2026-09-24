package com.cifra.backend.controller;

import com.cifra.backend.dto.ContaRequest;
import com.cifra.backend.dto.ContaResponse;
import com.cifra.backend.service.ContaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/contas")
public class ContaController {

    private final ContaService contaService;

    public ContaController(ContaService contaService) {
        this.contaService = contaService;
    }

    @GetMapping
    public List<ContaResponse> listar() {
        return contaService.listar();
    }

    @GetMapping("/{id}")
    public ContaResponse buscarPorId(@PathVariable Long id) {
        return contaService.buscarPorId(id);
    }

    @PostMapping
    public ResponseEntity<ContaResponse> criar(
            @Valid @RequestBody ContaRequest request,
            UriComponentsBuilder uriBuilder
    ) {
        ContaResponse conta = contaService.criar(request);
        URI location = uriBuilder.path("/api/contas/{id}")
                .buildAndExpand(conta.id())
                .toUri();
        return ResponseEntity.created(location).body(conta);
    }

    @PutMapping("/{id}")
    public ContaResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody ContaRequest request
    ) {
        return contaService.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        contaService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
