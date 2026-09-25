package com.cifra.backend.controller;

import com.cifra.backend.dto.ContaResponse;
import com.cifra.backend.dto.SaldoContaResponse;
import com.cifra.backend.exception.ApiExceptionHandler;
import com.cifra.backend.exception.RecursoNaoEncontradoException;
import com.cifra.backend.model.enums.TipoConta;
import com.cifra.backend.service.ContaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ContaControllerTest {

    private ContaService contaService;
    private MockMvc mockMvc;

    @BeforeEach
    void configurar() {
        contaService = mock(ContaService.class);
        ContaController controller = new ContaController(contaService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void deveCriarContaERetornarLocalizacao() throws Exception {
        when(contaService.criar(any()))
                .thenReturn(new ContaResponse(
                        1L,
                        "Conta corrente",
                        new BigDecimal("1500.25"),
                        TipoConta.CORRENTE
                ));

        mockMvc.perform(post("/api/contas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome":"Conta corrente",
                                  "saldoInicial":1500.25,
                                  "tipo":"CORRENTE"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/api/contas/1"))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nome").value("Conta corrente"))
                .andExpect(jsonPath("$.saldoInicial").value(1500.25))
                .andExpect(jsonPath("$.tipo").value("CORRENTE"));
    }

    @Test
    void deveRejeitarContaComCamposObrigatoriosAusentes() throws Exception {
        mockMvc.perform(post("/api/contas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":" ","saldoInicial":null,"tipo":null}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Dados inválidos"))
                .andExpect(jsonPath("$.erros.nome").value("O nome é obrigatório"))
                .andExpect(jsonPath("$.erros.saldoInicial")
                        .value("O saldo inicial é obrigatório"))
                .andExpect(jsonPath("$.erros.tipo").value("O tipo é obrigatório"));
    }

    @Test
    void deveRetornarNaoEncontrado() throws Exception {
        when(contaService.buscarPorId(99L))
                .thenThrow(new RecursoNaoEncontradoException(
                        "Conta não encontrada com o id 99"
                ));

        mockMvc.perform(get("/api/contas/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Recurso não encontrado"))
                .andExpect(jsonPath("$.detail").value("Conta não encontrada com o id 99"));
    }

    @Test
    void deveRetornarSaldoConsolidadoDaConta() throws Exception {
        when(contaService.calcularSaldo(1L))
                .thenReturn(new SaldoContaResponse(
                        1L,
                        "Conta corrente",
                        new BigDecimal("1000.00"),
                        new BigDecimal("2500.00"),
                        new BigDecimal("750.00"),
                        new BigDecimal("2750.00")
                ));

        mockMvc.perform(get("/api/contas/1/saldo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contaId").value(1))
                .andExpect(jsonPath("$.contaNome").value("Conta corrente"))
                .andExpect(jsonPath("$.saldoInicial").value(1000.00))
                .andExpect(jsonPath("$.totalReceitas").value(2500.00))
                .andExpect(jsonPath("$.totalDespesas").value(750.00))
                .andExpect(jsonPath("$.saldoAtual").value(2750.00));
    }
}
