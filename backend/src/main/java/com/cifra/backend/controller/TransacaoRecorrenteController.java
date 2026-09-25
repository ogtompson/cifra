package com.cifra.backend.controller;

import com.cifra.backend.dto.TransacaoRecorrenteRequest;
import com.cifra.backend.dto.TransacaoRecorrenteResponse;
import com.cifra.backend.service.TransacaoRecorrenteService;
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
@RequestMapping("/api/recorrencias")
public class TransacaoRecorrenteController {

    private final TransacaoRecorrenteService transacaoRecorrenteService;

    public TransacaoRecorrenteController(
            TransacaoRecorrenteService transacaoRecorrenteService
    ) {
        this.transacaoRecorrenteService = transacaoRecorrenteService;
    }

    @GetMapping
    public List<TransacaoRecorrenteResponse> listar(
            @RequestParam(required = false) Boolean ativa
    ) {
        return transacaoRecorrenteService.listar(ativa);
    }

    @GetMapping("/{id}")
    public TransacaoRecorrenteResponse buscarPorId(@PathVariable Long id) {
        return transacaoRecorrenteService.buscarPorId(id);
    }

    @PostMapping
    public ResponseEntity<TransacaoRecorrenteResponse> criar(
            @Valid @RequestBody TransacaoRecorrenteRequest request,
            UriComponentsBuilder uriBuilder
    ) {
        TransacaoRecorrenteResponse recorrencia = transacaoRecorrenteService.criar(request);
        URI location = uriBuilder.path("/api/recorrencias/{id}")
                .buildAndExpand(recorrencia.id())
                .toUri();
        return ResponseEntity.created(location).body(recorrencia);
    }

    @PutMapping("/{id}")
    public TransacaoRecorrenteResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody TransacaoRecorrenteRequest request
    ) {
        return transacaoRecorrenteService.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        transacaoRecorrenteService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
