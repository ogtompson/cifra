package com.cifra.backend.controller;

import com.cifra.backend.dto.TransacaoRecorrenteResponse;
import com.cifra.backend.exception.ApiExceptionHandler;
import com.cifra.backend.exception.RegraNegocioException;
import com.cifra.backend.model.enums.Frequencia;
import com.cifra.backend.model.enums.TipoOperacao;
import com.cifra.backend.service.TransacaoRecorrenteService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class TransacaoRecorrenteControllerTest {

    private TransacaoRecorrenteService service;
    private MockMvc mockMvc;

    @BeforeEach
    void configurar() {
        service = mock(TransacaoRecorrenteService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new TransacaoRecorrenteController(service))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void deveCriarRecorrenciaERetornarLocalizacao() throws Exception {
        when(service.criar(any())).thenReturn(response());

        mockMvc.perform(post("/api/recorrencias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonValido()))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/api/recorrencias/3"))
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.frequencia").value("MENSAL"))
                .andExpect(jsonPath("$.diaDoMes").value(5))
                .andExpect(jsonPath("$.ativa").value(true));
    }

    @Test
    void deveRejeitarDadosInvalidos() throws Exception {
        mockMvc.perform(post("/api/recorrencias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "descricao":" ",
                                  "valor":0,
                                  "tipo":null,
                                  "frequencia":null,
                                  "dataInicio":null,
                                  "ativa":null,
                                  "contaId":null,
                                  "categoriaId":null
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.descricao").exists())
                .andExpect(jsonPath("$.erros.valor").exists())
                .andExpect(jsonPath("$.erros.frequencia").exists())
                .andExpect(jsonPath("$.erros.ativa").exists());
    }

    @Test
    void deveRetornarErroAoExcluirRecorrenciaComHistorico() throws Exception {
        org.mockito.Mockito.doThrow(new RegraNegocioException(
                "A recorrência não pode ser excluída porque possui transações geradas"
        )).when(service).excluir(3L);

        mockMvc.perform(delete("/api/recorrencias/3"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.title").value("Regra de negócio violada"));
    }

    private String jsonValido() {
        return """
                {
                  "descricao":"Aluguel",
                  "valor":1200.00,
                  "tipo":"DESPESA",
                  "frequencia":"MENSAL",
                  "diaDoMes":5,
                  "dataInicio":"2026-09-01",
                  "dataFim":null,
                  "ativa":true,
                  "contaId":1,
                  "categoriaId":2
                }
                """;
    }

    private TransacaoRecorrenteResponse response() {
        return new TransacaoRecorrenteResponse(
                3L,
                "Aluguel",
                new BigDecimal("1200.00"),
                TipoOperacao.DESPESA,
                Frequencia.MENSAL,
                5,
                LocalDate.of(2026, 9, 1),
                null,
                true,
                1L,
                "Conta corrente",
                2L,
                "Moradia"
        );
    }
}
