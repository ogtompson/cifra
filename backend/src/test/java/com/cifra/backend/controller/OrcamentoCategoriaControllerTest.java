package com.cifra.backend.controller;

import com.cifra.backend.dto.OrcamentoCategoriaResponse;
import com.cifra.backend.exception.ApiExceptionHandler;
import com.cifra.backend.service.OrcamentoCategoriaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OrcamentoCategoriaControllerTest {

    private OrcamentoCategoriaService service;
    private MockMvc mockMvc;

    @BeforeEach
    void configurar() {
        service = mock(OrcamentoCategoriaService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new OrcamentoCategoriaController(service))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void deveCriarOrcamentoERetornarLocalizacao() throws Exception {
        when(service.criar(any())).thenReturn(new OrcamentoCategoriaResponse(
                7L, 2L, "Alimentação", LocalDate.of(2026, 10, 1),
                new BigDecimal("1000.00"), BigDecimal.ZERO, new BigDecimal("1000.00"),
                BigDecimal.ZERO, "DENTRO_DO_LIMITE"
        ));

        mockMvc.perform(post("/api/orcamentos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"categoriaId":2,"mesReferencia":"2026-10-01","valorLimite":1000.00}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/api/orcamentos/7"))
                .andExpect(jsonPath("$.categoriaNome").value("Alimentação"))
                .andExpect(jsonPath("$.valorLimite").value(1000.00));
    }

    @Test
    void deveRejeitarLimiteInvalido() throws Exception {
        mockMvc.perform(post("/api/orcamentos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"categoriaId":2,"mesReferencia":"2026-10-01","valorLimite":0}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.valorLimite").value("O limite deve ser maior que zero"));
    }
}
