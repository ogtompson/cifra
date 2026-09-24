package com.cifra.backend.service;

import com.cifra.backend.dto.CategoriaRequest;
import com.cifra.backend.dto.CategoriaResponse;
import com.cifra.backend.exception.RecursoNaoEncontradoException;
import com.cifra.backend.model.Categoria;
import com.cifra.backend.model.enums.TipoOperacao;
import com.cifra.backend.repository.CategoriaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoriaServiceTest {

    @Mock
    private CategoriaRepository categoriaRepository;

    private CategoriaService categoriaService;

    @BeforeEach
    void configurar() {
        categoriaService = new CategoriaService(categoriaRepository);
    }

    @Test
    void deveListarCategoriasOrdenadasPorNome() {
        Categoria alimentacao = categoria(1L, "Alimentação", TipoOperacao.DESPESA);
        Categoria salario = categoria(2L, "Salário", TipoOperacao.RECEITA);
        when(categoriaRepository.findAll(any(Sort.class)))
                .thenReturn(List.of(alimentacao, salario));

        List<CategoriaResponse> resultado = categoriaService.listar();

        assertThat(resultado).containsExactly(
                new CategoriaResponse(1L, "Alimentação", TipoOperacao.DESPESA),
                new CategoriaResponse(2L, "Salário", TipoOperacao.RECEITA)
        );
    }

    @Test
    void deveCriarCategoriaNormalizandoONome() {
        CategoriaRequest request = new CategoriaRequest("  Salário  ", TipoOperacao.RECEITA);
        when(categoriaRepository.save(any(Categoria.class))).thenAnswer(invocacao -> {
            Categoria categoria = invocacao.getArgument(0);
            categoria.setId(1L);
            return categoria;
        });

        CategoriaResponse resultado = categoriaService.criar(request);

        assertThat(resultado).isEqualTo(
                new CategoriaResponse(1L, "Salário", TipoOperacao.RECEITA)
        );
    }

    @Test
    void deveAtualizarCategoriaExistente() {
        Categoria categoria = categoria(1L, "Mercado", TipoOperacao.DESPESA);
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoria));
        when(categoriaRepository.save(categoria)).thenReturn(categoria);

        CategoriaResponse resultado = categoriaService.atualizar(
                1L,
                new CategoriaRequest("Supermercado", TipoOperacao.DESPESA)
        );

        assertThat(resultado.nome()).isEqualTo("Supermercado");
        assertThat(resultado.tipo()).isEqualTo(TipoOperacao.DESPESA);
    }

    @Test
    void deveExcluirCategoriaExistente() {
        Categoria categoria = categoria(1L, "Lazer", TipoOperacao.DESPESA);
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoria));

        categoriaService.excluir(1L);

        verify(categoriaRepository).delete(categoria);
    }

    @Test
    void deveInformarQuandoCategoriaNaoExistir() {
        when(categoriaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoriaService.buscarPorId(99L))
                .isInstanceOf(RecursoNaoEncontradoException.class)
                .hasMessage("Categoria não encontrada com o id 99");
    }

    private Categoria categoria(Long id, String nome, TipoOperacao tipo) {
        return new Categoria(id, nome, tipo);
    }
}
