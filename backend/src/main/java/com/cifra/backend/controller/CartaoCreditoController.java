package com.cifra.backend.controller;

import com.cifra.backend.dto.CartaoCreditoRequest;
import com.cifra.backend.dto.CartaoCreditoResponse;
import com.cifra.backend.dto.CompraCartaoRequest;
import com.cifra.backend.dto.CompraCartaoResponse;
import com.cifra.backend.dto.FaturaCartaoResponse;
import com.cifra.backend.service.CartaoCreditoService;
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
@RequestMapping("/api/cartoes")
public class CartaoCreditoController {

    private final CartaoCreditoService service;

    public CartaoCreditoController(CartaoCreditoService service) {
        this.service = service;
    }

    @GetMapping
    public List<CartaoCreditoResponse> listarCartoes() {
        return service.listarCartoes();
    }

    @PostMapping
    public ResponseEntity<CartaoCreditoResponse> criarCartao(@Valid @RequestBody CartaoCreditoRequest request, UriComponentsBuilder uriBuilder) {
        CartaoCreditoResponse cartao = service.criarCartao(request);
        URI location = uriBuilder.path("/api/cartoes/{id}").buildAndExpand(cartao.id()).toUri();
        return ResponseEntity.created(location).body(cartao);
    }

    @PutMapping("/{id}")
    public CartaoCreditoResponse atualizarCartao(@PathVariable Long id, @Valid @RequestBody CartaoCreditoRequest request) {
        return service.atualizarCartao(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirCartao(@PathVariable Long id) {
        service.excluirCartao(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/compras")
    public List<CompraCartaoResponse> listarCompras(@RequestParam(required = false) Long cartaoId) {
        return service.listarCompras(cartaoId);
    }

    @PostMapping("/compras")
    public ResponseEntity<CompraCartaoResponse> criarCompra(@Valid @RequestBody CompraCartaoRequest request, UriComponentsBuilder uriBuilder) {
        CompraCartaoResponse compra = service.criarCompra(request);
        URI location = uriBuilder.path("/api/cartoes/compras/{id}").buildAndExpand(compra.id()).toUri();
        return ResponseEntity.created(location).body(compra);
    }

    @PutMapping("/compras/{id}")
    public CompraCartaoResponse atualizarCompra(@PathVariable Long id, @Valid @RequestBody CompraCartaoRequest request) {
        return service.atualizarCompra(id, request);
    }

    @DeleteMapping("/compras/{id}")
    public ResponseEntity<Void> excluirCompra(@PathVariable Long id) {
        service.excluirCompra(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/faturas")
    public List<FaturaCartaoResponse> projetarFaturas(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate mesReferencia,
            @RequestParam(defaultValue = "6") int meses
    ) {
        return service.projetarFaturas(id, mesReferencia, meses);
    }
}
