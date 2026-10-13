package com.cifra.backend.controller;

import com.cifra.backend.dto.OrcamentoCategoriaRequest;
import com.cifra.backend.dto.OrcamentoCategoriaResponse;
import com.cifra.backend.service.OrcamentoCategoriaService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
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
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/orcamentos")
public class OrcamentoCategoriaController {

    private final OrcamentoCategoriaService orcamentoService;

    public OrcamentoCategoriaController(OrcamentoCategoriaService orcamentoService) {
        this.orcamentoService = orcamentoService;
    }

    @GetMapping
    public List<OrcamentoCategoriaResponse> listar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate mesReferencia
    ) {
        return orcamentoService.listar(mesReferencia);
    }

    @PostMapping
    public ResponseEntity<OrcamentoCategoriaResponse> criar(
            @Valid @RequestBody OrcamentoCategoriaRequest request,
            UriComponentsBuilder uriBuilder
    ) {
        OrcamentoCategoriaResponse orcamento = orcamentoService.criar(request);
        URI location = uriBuilder.path("/api/orcamentos/{id}").buildAndExpand(orcamento.id()).toUri();
        return ResponseEntity.created(location).body(orcamento);
    }

    @PutMapping("/{id}")
    public OrcamentoCategoriaResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody OrcamentoCategoriaRequest request
    ) {
        return orcamentoService.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        orcamentoService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
