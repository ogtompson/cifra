package com.cifra.backend.controller;

import com.cifra.backend.dto.TransacaoResponse;
import com.cifra.backend.exception.ApiExceptionHandler;
import com.cifra.backend.exception.RegraNegocioException;
import com.cifra.backend.model.enums.TipoOperacao;
import com.cifra.backend.service.TransacaoService;
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

class TransacaoControllerTest {

    private TransacaoService transacaoService;
    private MockMvc mockMvc;

    @BeforeEach
    void configurar() {
        transacaoService = mock(TransacaoService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new TransacaoController(transacaoService))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void deveCriarTransacaoERetornarLocalizacao() throws Exception {
        when(transacaoService.criar(any())).thenReturn(new TransacaoResponse(
                1L,
                "Almoço",
                new BigDecimal("25.90"),
                LocalDate.of(2026, 9, 24),
                TipoOperacao.DESPESA,
                2L,
                "Conta corrente",
                3L,
                "Alimentação",
                null
        ));

        mockMvc.perform(post("/api/transacoes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonValido("DESPESA", "25.90")))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/api/transacoes/1"))
                .andExpect(jsonPath("$.valor").value(25.90))
                .andExpect(jsonPath("$.tipo").value("DESPESA"))
                .andExpect(jsonPath("$.recorrenciaId").isEmpty());
    }

    @Test
    void deveRejeitarValorNaoPositivo() throws Exception {
        mockMvc.perform(post("/api/transacoes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonValido("DESPESA", "-25.90")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.valor").value("O valor deve ser maior que zero"));
    }

    @Test
    void deveRetornarErroParaCategoriaIncompativel() throws Exception {
        when(transacaoService.criar(any())).thenThrow(new RegraNegocioException(
                "O tipo da categoria deve ser igual ao tipo da transação"
        ));

        mockMvc.perform(post("/api/transacoes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonValido("RECEITA", "25.90")))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.title").value("Regra de negócio violada"));
    }

    private String jsonValido(String tipo, String valor) {
        return """
                {
                  "descricao":"Almoço",
                  "valor":%s,
                  "data":"2026-09-24",
                  "tipo":"%s",
                  "contaId":2,
                  "categoriaId":3
                }
                """.formatted(valor, tipo);
    }
}
