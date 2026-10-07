package com.cifra.backend.controller;

import com.cifra.backend.dto.ContaRequest;
import com.cifra.backend.dto.ContaResponse;
import com.cifra.backend.dto.ExclusaoContaResponse;
import com.cifra.backend.dto.SaldoContaResponse;
import com.cifra.backend.dto.ArquivamentoContaRequest;
import com.cifra.backend.service.ContaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
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
@RequestMapping("/api/contas")
public class ContaController {

    private final ContaService contaService;

    public ContaController(ContaService contaService) {
        this.contaService = contaService;
    }

    @GetMapping
    public List<ContaResponse> listar(
            @RequestParam(defaultValue = "false") boolean incluirArquivadas
    ) {
        return contaService.listar(incluirArquivadas);
    }

    @GetMapping("/{id}")
    public ContaResponse buscarPorId(@PathVariable Long id) {
        return contaService.buscarPorId(id);
    }

    @GetMapping("/{id}/saldo")
    public SaldoContaResponse buscarSaldo(@PathVariable Long id) {
        return contaService.calcularSaldo(id);
    }

    @GetMapping("/{id}/exclusao")
    public ExclusaoContaResponse consultarExclusao(@PathVariable Long id) {
        return contaService.consultarExclusao(id);
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

    @PatchMapping("/{id}/arquivamento")
    public ContaResponse alterarArquivamento(
            @PathVariable Long id,
            @Valid @RequestBody ArquivamentoContaRequest request
    ) {
        return contaService.alterarArquivamento(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean excluirDependencias
    ) {
        contaService.excluir(id, excluirDependencias);
        return ResponseEntity.noContent().build();
    }
}
