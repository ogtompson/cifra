package com.cifra.backend.controller;

import com.cifra.backend.dto.CategoriaResponse;
import com.cifra.backend.exception.ApiExceptionHandler;
import com.cifra.backend.exception.RecursoNaoEncontradoException;
import com.cifra.backend.model.enums.TipoOperacao;
import com.cifra.backend.service.CategoriaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CategoriaControllerTest {

    private CategoriaService categoriaService;
    private MockMvc mockMvc;

    @BeforeEach
    void configurar() {
        categoriaService = mock(CategoriaService.class);
        CategoriaController controller = new CategoriaController(categoriaService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void deveCriarCategoriaERetornarLocalizacao() throws Exception {
        when(categoriaService.criar(org.mockito.ArgumentMatchers.any()))
                .thenReturn(new CategoriaResponse(1L, "Salário", TipoOperacao.RECEITA));

        mockMvc.perform(post("/api/categorias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Salário","tipo":"RECEITA"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/api/categorias/1"))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nome").value("Salário"))
                .andExpect(jsonPath("$.tipo").value("RECEITA"));
    }

    @Test
    void deveRejeitarCategoriaComCamposInvalidos() throws Exception {
        mockMvc.perform(post("/api/categorias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":" ","tipo":null}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Dados inválidos"))
                .andExpect(jsonPath("$.erros.nome").value("O nome é obrigatório"))
                .andExpect(jsonPath("$.erros.tipo").value("O tipo é obrigatório"));
    }

    @Test
    void deveRetornarNaoEncontrado() throws Exception {
        when(categoriaService.buscarPorId(99L))
                .thenThrow(new RecursoNaoEncontradoException(
                        "Categoria não encontrada com o id 99"
                ));

        mockMvc.perform(get("/api/categorias/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Recurso não encontrado"))
                .andExpect(jsonPath("$.detail")
                        .value("Categoria não encontrada com o id 99"));
    }
}
