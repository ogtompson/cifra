package com.cifra.backend.service;

import com.cifra.backend.dto.OrcamentoCategoriaRequest;
import com.cifra.backend.dto.OrcamentoCategoriaResponse;
import com.cifra.backend.exception.RegraNegocioException;
import com.cifra.backend.model.Categoria;
import com.cifra.backend.model.OrcamentoCategoria;
import com.cifra.backend.model.enums.TipoOperacao;
import com.cifra.backend.repository.CategoriaRepository;
import com.cifra.backend.repository.OrcamentoCategoriaRepository;
import com.cifra.backend.repository.TotalPorCategoria;
import com.cifra.backend.repository.TransacaoRepository;
import com.cifra.backend.repository.CompraCartaoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrcamentoCategoriaServiceTest {

    @Mock
    private OrcamentoCategoriaRepository orcamentoRepository;
    @Mock
    private CategoriaRepository categoriaRepository;
    @Mock
    private TransacaoRepository transacaoRepository;
    @Mock
    private CompraCartaoRepository compraCartaoRepository;

    private OrcamentoCategoriaService service;

    @BeforeEach
    void configurar() {
        service = new OrcamentoCategoriaService(orcamentoRepository, categoriaRepository, transacaoRepository, compraCartaoRepository);
    }

    @Test
    void deveListarOrcamentosComConsumoCalculado() {
        Categoria alimentacao = new Categoria(1L, "Alimentação", TipoOperacao.DESPESA);
        OrcamentoCategoria orcamento = new OrcamentoCategoria(2L, alimentacao, LocalDate.of(2026, 10, 1), new BigDecimal("1000.00"));
        TotalPorCategoria total = mock(TotalPorCategoria.class);
        TotalPorCategoria compraCartao = mock(TotalPorCategoria.class);
        when(total.getCategoriaId()).thenReturn(1L);
        when(total.getTotal()).thenReturn(new BigDecimal("850.00"));
        when(transacaoRepository.somarPorCategoriaETipoEPeriodo(TipoOperacao.DESPESA, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31))).thenReturn(List.of(total));
        when(compraCartao.getCategoriaId()).thenReturn(1L);
        when(compraCartao.getTotal()).thenReturn(new BigDecimal("100.00"));
        when(compraCartaoRepository.somarPorCategoriaEPeriodo(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31))).thenReturn(List.of(compraCartao));
        when(orcamentoRepository.findByMesReferenciaOrderByCategoriaNomeAsc(LocalDate.of(2026, 10, 1))).thenReturn(List.of(orcamento));

        List<OrcamentoCategoriaResponse> resultado = service.listar(LocalDate.of(2026, 10, 13));

        assertThat(resultado).singleElement().satisfies(item -> {
            assertThat(item.gastoRealizado()).isEqualByComparingTo("950.00");
            assertThat(item.saldoDisponivel()).isEqualByComparingTo("50.00");
            assertThat(item.percentualUtilizado()).isEqualByComparingTo("95.0");
            assertThat(item.status()).isEqualTo("ATENCAO");
        });
    }

    @Test
    void deveCriarOrcamentoNormalizandoOMes() {
        Categoria moradia = new Categoria(1L, "Moradia", TipoOperacao.DESPESA);
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(moradia));
        when(orcamentoRepository.findByCategoriaIdAndMesReferencia(1L, LocalDate.of(2026, 10, 1))).thenReturn(Optional.empty());
        when(orcamentoRepository.save(any())).thenAnswer(invocacao -> {
            OrcamentoCategoria item = invocacao.getArgument(0);
            item.setId(3L);
            return item;
        });

        OrcamentoCategoriaResponse resultado = service.criar(new OrcamentoCategoriaRequest(1L, LocalDate.of(2026, 10, 20), new BigDecimal("1800.00")));

        assertThat(resultado.mesReferencia()).isEqualTo(LocalDate.of(2026, 10, 1));
        assertThat(resultado.valorLimite()).isEqualByComparingTo("1800.00");
        assertThat(resultado.status()).isEqualTo("DENTRO_DO_LIMITE");
    }

    @Test
    void deveCriarOrcamentoRefletindoGastosJaRealizados() {
        Categoria moradia = new Categoria(1L, "Moradia", TipoOperacao.DESPESA);
        TotalPorCategoria total = mock(TotalPorCategoria.class);
        when(total.getCategoriaId()).thenReturn(1L);
        when(total.getTotal()).thenReturn(new BigDecimal("650.00"));
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(moradia));
        when(orcamentoRepository.findByCategoriaIdAndMesReferencia(1L, LocalDate.of(2026, 10, 1))).thenReturn(Optional.empty());
        when(transacaoRepository.somarPorCategoriaETipoEPeriodo(
                TipoOperacao.DESPESA,
                LocalDate.of(2026, 10, 1),
                LocalDate.of(2026, 10, 31)
        )).thenReturn(List.of(total));
        when(orcamentoRepository.save(any())).thenAnswer(invocacao -> invocacao.getArgument(0));

        OrcamentoCategoriaResponse resultado = service.criar(
                new OrcamentoCategoriaRequest(1L, LocalDate.of(2026, 10, 20), new BigDecimal("1000.00"))
        );

        assertThat(resultado.gastoRealizado()).isEqualByComparingTo("650.00");
        assertThat(resultado.saldoDisponivel()).isEqualByComparingTo("350.00");
        assertThat(resultado.percentualUtilizado()).isEqualByComparingTo("65.0");
    }

    @Test
    void deveRejeitarCategoriaDeReceita() {
        Categoria salario = new Categoria(1L, "Salário", TipoOperacao.RECEITA);
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(salario));

        assertThatThrownBy(() -> service.criar(new OrcamentoCategoriaRequest(1L, LocalDate.of(2026, 10, 1), BigDecimal.TEN)))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessage("Orçamentos só podem ser definidos para categorias de despesa");
    }

    @Test
    void deveRejeitarOrcamentoDuplicadoNoMesmoMes() {
        Categoria lazer = new Categoria(1L, "Lazer", TipoOperacao.DESPESA);
        OrcamentoCategoria existente = new OrcamentoCategoria(9L, lazer, LocalDate.of(2026, 10, 1), new BigDecimal("300.00"));
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(lazer));
        when(orcamentoRepository.findByCategoriaIdAndMesReferencia(1L, LocalDate.of(2026, 10, 1))).thenReturn(Optional.of(existente));

        assertThatThrownBy(() -> service.criar(new OrcamentoCategoriaRequest(1L, LocalDate.of(2026, 10, 1), new BigDecimal("400.00"))))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessage("Esta categoria já possui orçamento no mês informado");
    }

    @Test
    void deveExcluirOrcamentoExistente() {
        OrcamentoCategoria orcamento = new OrcamentoCategoria();
        when(orcamentoRepository.findById(4L)).thenReturn(Optional.of(orcamento));

        service.excluir(4L);

        verify(orcamentoRepository).delete(orcamento);
    }
}
