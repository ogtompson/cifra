package com.cifra.backend.controller;

import com.cifra.backend.dto.ResumoFinanceiroResponse;
import com.cifra.backend.service.ResumoFinanceiroService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/resumo-financeiro")
public class ResumoFinanceiroController {

    private final ResumoFinanceiroService resumoFinanceiroService;

    public ResumoFinanceiroController(ResumoFinanceiroService resumoFinanceiroService) {
        this.resumoFinanceiroService = resumoFinanceiroService;
    }

    @GetMapping
    public ResumoFinanceiroResponse buscar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim
    ) {
        return resumoFinanceiroService.gerar(dataInicio, dataFim);
    }
}
