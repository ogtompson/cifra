package com.cifra.backend.service;

import com.cifra.backend.dto.CategoriaRequest;
import com.cifra.backend.dto.CategoriaResponse;
import com.cifra.backend.exception.RecursoNaoEncontradoException;
import com.cifra.backend.model.Categoria;
import com.cifra.backend.model.enums.TipoOperacao;
import com.cifra.backend.repository.CategoriaRepository;
import com.cifra.backend.repository.OrcamentoCategoriaRepository;
import com.cifra.backend.repository.CompraCartaoRepository;
import com.cifra.backend.repository.TransacaoRecorrenteRepository;
import com.cifra.backend.repository.TransacaoRepository;
import com.cifra.backend.repository.UsuarioRepository;
import com.cifra.backend.security.UsuarioAtualFixo;
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

    private static final Long USUARIO_ID = 7L;

    @Mock
    private CategoriaRepository categoriaRepository;
    @Mock
    private OrcamentoCategoriaRepository orcamentoRepository;
    @Mock
    private CompraCartaoRepository compraCartaoRepository;
    @Mock
    private TransacaoRepository transacaoRepository;
    @Mock
    private TransacaoRecorrenteRepository recorrenciaRepository;
    @Mock
    private UsuarioRepository usuarioRepository;

    private CategoriaService categoriaService;

    @BeforeEach
    void configurar() {
        categoriaService = new CategoriaService(
                categoriaRepository,
                orcamentoRepository,
                compraCartaoRepository,
                transacaoRepository,
                recorrenciaRepository,
                usuarioRepository,
                new UsuarioAtualFixo(USUARIO_ID)
        );
    }

    @Test
    void deveListarCategoriasOrdenadasPorNome() {
        Categoria alimentacao = categoria(1L, "Alimentação", TipoOperacao.DESPESA);
        Categoria salario = categoria(2L, "Salário", TipoOperacao.RECEITA);
        when(categoriaRepository.findByUsuarioId(org.mockito.ArgumentMatchers.eq(USUARIO_ID), any(Sort.class)))
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
        when(categoriaRepository.findByIdAndUsuarioId(1L, USUARIO_ID)).thenReturn(Optional.of(categoria));
        when(categoriaRepository.save(categoria)).thenReturn(categoria);

        CategoriaResponse resultado = categoriaService.atualizar(
                1L,
                new CategoriaRequest("Supermercado", TipoOperacao.DESPESA)
        );

        assertThat(resultado.nome()).isEqualTo("Supermercado");
        assertThat(resultado.tipo()).isEqualTo(TipoOperacao.DESPESA);
    }

    @Test
    void deveImpedirMudancaDeTipoComOrcamentoVinculado() {
        Categoria categoria = categoria(1L, "Mercado", TipoOperacao.DESPESA);
        when(categoriaRepository.findByIdAndUsuarioId(1L, USUARIO_ID)).thenReturn(Optional.of(categoria));
        when(orcamentoRepository.existsByCategoriaId(1L)).thenReturn(true);

        assertThatThrownBy(() -> categoriaService.atualizar(
                1L,
                new CategoriaRequest("Mercado", TipoOperacao.RECEITA)
        ))
                .isInstanceOf(com.cifra.backend.exception.RegraNegocioException.class)
                .hasMessage("O tipo da categoria não pode mudar enquanto houver movimentações vinculadas");
    }

    @Test
    void deveImpedirMudancaDeTipoComTransacaoVinculada() {
        Categoria categoria = categoria(1L, "Mercado", TipoOperacao.DESPESA);
        when(categoriaRepository.findByIdAndUsuarioId(1L, USUARIO_ID)).thenReturn(Optional.of(categoria));
        when(transacaoRepository.existsByCategoriaId(1L)).thenReturn(true);

        assertThatThrownBy(() -> categoriaService.atualizar(
                1L,
                new CategoriaRequest("Mercado", TipoOperacao.RECEITA)
        ))
                .isInstanceOf(com.cifra.backend.exception.RegraNegocioException.class)
                .hasMessage("O tipo da categoria não pode mudar enquanto houver movimentações vinculadas");
    }

    @Test
    void deveExcluirCategoriaExistente() {
        Categoria categoria = categoria(1L, "Lazer", TipoOperacao.DESPESA);
        when(categoriaRepository.findByIdAndUsuarioId(1L, USUARIO_ID)).thenReturn(Optional.of(categoria));

        categoriaService.excluir(1L);

        verify(categoriaRepository).delete(categoria);
    }

    @Test
    void deveImpedirExclusaoDeCategoriaComOrcamento() {
        Categoria categoria = categoria(1L, "Lazer", TipoOperacao.DESPESA);
        when(categoriaRepository.findByIdAndUsuarioId(1L, USUARIO_ID)).thenReturn(Optional.of(categoria));
        when(orcamentoRepository.existsByCategoriaId(1L)).thenReturn(true);

        assertThatThrownBy(() -> categoriaService.excluir(1L))
                .isInstanceOf(com.cifra.backend.exception.RegraNegocioException.class)
                .hasMessage("A categoria possui orçamentos vinculados e não pode ser excluída");
    }

    @Test
    void deveImpedirExclusaoDeCategoriaComTransacao() {
        Categoria categoria = categoria(1L, "Lazer", TipoOperacao.DESPESA);
        when(categoriaRepository.findByIdAndUsuarioId(1L, USUARIO_ID)).thenReturn(Optional.of(categoria));
        when(transacaoRepository.existsByCategoriaId(1L)).thenReturn(true);

        assertThatThrownBy(() -> categoriaService.excluir(1L))
                .isInstanceOf(com.cifra.backend.exception.RegraNegocioException.class)
                .hasMessage("A categoria possui transações vinculadas e não pode ser excluída");
    }

    @Test
    void deveImpedirExclusaoDeCategoriaComRecorrencia() {
        Categoria categoria = categoria(1L, "Lazer", TipoOperacao.DESPESA);
        when(categoriaRepository.findByIdAndUsuarioId(1L, USUARIO_ID)).thenReturn(Optional.of(categoria));
        when(recorrenciaRepository.existsByCategoriaId(1L)).thenReturn(true);

        assertThatThrownBy(() -> categoriaService.excluir(1L))
                .isInstanceOf(com.cifra.backend.exception.RegraNegocioException.class)
                .hasMessage("A categoria possui recorrências vinculadas e não pode ser excluída");
    }

    @Test
    void deveImpedirExclusaoDeCategoriaComCompraNoCartao() {
        Categoria categoria = categoria(1L, "Compras", TipoOperacao.DESPESA);
        when(categoriaRepository.findByIdAndUsuarioId(1L, USUARIO_ID)).thenReturn(Optional.of(categoria));
        when(compraCartaoRepository.existsByCategoriaId(1L)).thenReturn(true);

        assertThatThrownBy(() -> categoriaService.excluir(1L))
                .isInstanceOf(com.cifra.backend.exception.RegraNegocioException.class)
                .hasMessage("A categoria possui compras no cartão vinculadas e não pode ser excluída");
    }

    @Test
    void deveInformarQuandoCategoriaNaoExistir() {
        when(categoriaRepository.findByIdAndUsuarioId(99L, USUARIO_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoriaService.buscarPorId(99L))
                .isInstanceOf(RecursoNaoEncontradoException.class)
                .hasMessage("Categoria não encontrada com o id 99");
    }

    private Categoria categoria(Long id, String nome, TipoOperacao tipo) {
        return new Categoria(id, nome, tipo);
    }
}
