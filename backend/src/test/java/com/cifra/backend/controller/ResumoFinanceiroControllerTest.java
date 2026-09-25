package com.cifra.backend.controller;

import com.cifra.backend.dto.DespesaPorCategoriaResponse;
import com.cifra.backend.dto.ResumoFinanceiroResponse;
import com.cifra.backend.exception.ApiExceptionHandler;
import com.cifra.backend.exception.RegraNegocioException;
import com.cifra.backend.service.ResumoFinanceiroService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ResumoFinanceiroControllerTest {

    private ResumoFinanceiroService resumoFinanceiroService;
    private MockMvc mockMvc;

    @BeforeEach
    void configurar() {
        resumoFinanceiroService = mock(ResumoFinanceiroService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(
                        new ResumoFinanceiroController(resumoFinanceiroService)
                )
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void deveRetornarResumoFinanceiro() throws Exception {
        LocalDate inicio = LocalDate.of(2026, 9, 1);
        LocalDate fim = LocalDate.of(2026, 9, 30);
        when(resumoFinanceiroService.gerar(inicio, fim)).thenReturn(
                new ResumoFinanceiroResponse(
                        inicio,
                        fim,
                        new BigDecimal("4200.00"),
                        new BigDecimal("3000.00"),
                        new BigDecimal("1200.00"),
                        new BigDecimal("1800.00"),
                        List.of(new DespesaPorCategoriaResponse(
                                2L, "Alimentação", new BigDecimal("700.00")
                        ))
                )
        );

        mockMvc.perform(get("/api/resumo-financeiro")
                        .param("dataInicio", "2026-09-01")
                        .param("dataFim", "2026-09-30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dataInicio").value("2026-09-01"))
                .andExpect(jsonPath("$.dataFim").value("2026-09-30"))
                .andExpect(jsonPath("$.saldoTotal").value(4200.00))
                .andExpect(jsonPath("$.totalReceitas").value(3000.00))
                .andExpect(jsonPath("$.totalDespesas").value(1200.00))
                .andExpect(jsonPath("$.resultadoPeriodo").value(1800.00))
                .andExpect(jsonPath("$.despesasPorCategoria[0].categoriaId").value(2))
                .andExpect(jsonPath("$.despesasPorCategoria[0].total").value(700.00));
    }

    @Test
    void deveRetornarErroParaPeriodoInvertido() throws Exception {
        LocalDate inicio = LocalDate.of(2026, 10, 1);
        LocalDate fim = LocalDate.of(2026, 9, 30);
        when(resumoFinanceiroService.gerar(inicio, fim)).thenThrow(
                new RegraNegocioException(
                        "A data inicial não pode ser posterior à data final"
                )
        );

        mockMvc.perform(get("/api/resumo-financeiro")
                        .param("dataInicio", "2026-10-01")
                        .param("dataFim", "2026-09-30"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.title").value("Regra de negócio violada"));
    }
}
