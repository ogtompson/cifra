package com.cifra.backend.service;

import com.cifra.backend.dto.ResumoFinanceiroResponse;
import com.cifra.backend.exception.RegraNegocioException;
import com.cifra.backend.model.enums.TipoOperacao;
import com.cifra.backend.repository.ContaRepository;
import com.cifra.backend.repository.TotalPorCategoria;
import com.cifra.backend.repository.TransacaoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResumoFinanceiroServiceTest {

    @Mock
    private ContaRepository contaRepository;

    @Mock
    private TransacaoRepository transacaoRepository;

    @Mock
    private TotalPorCategoria totalAlimentacao;

    private ResumoFinanceiroService resumoFinanceiroService;

    @BeforeEach
    void configurar() {
        resumoFinanceiroService = new ResumoFinanceiroService(
                contaRepository, transacaoRepository
        );
    }

    @Test
    void deveGerarResumoDoPeriodoESaldoAteADataFinal() {
        LocalDate inicio = LocalDate.of(2026, 9, 1);
        LocalDate fim = LocalDate.of(2026, 9, 30);
        when(transacaoRepository.somarValorPorTipoEPeriodo(
                TipoOperacao.RECEITA, inicio, fim
        )).thenReturn(new BigDecimal("3000.00"));
        when(transacaoRepository.somarValorPorTipoEPeriodo(
                TipoOperacao.DESPESA, inicio, fim
        )).thenReturn(new BigDecimal("1200.00"));
        when(transacaoRepository.somarValorPorTipoAte(TipoOperacao.RECEITA, fim))
                .thenReturn(new BigDecimal("5000.00"));
        when(transacaoRepository.somarValorPorTipoAte(TipoOperacao.DESPESA, fim))
                .thenReturn(new BigDecimal("1800.00"));
        when(contaRepository.somarSaldosIniciais()).thenReturn(new BigDecimal("1000.00"));
        when(totalAlimentacao.getCategoriaId()).thenReturn(2L);
        when(totalAlimentacao.getCategoriaNome()).thenReturn("Alimentação");
        when(totalAlimentacao.getTotal()).thenReturn(new BigDecimal("700.00"));
        when(transacaoRepository.somarPorCategoriaETipoEPeriodo(
                TipoOperacao.DESPESA, inicio, fim
        )).thenReturn(List.of(totalAlimentacao));

        ResumoFinanceiroResponse resultado = resumoFinanceiroService.gerar(inicio, fim);

        assertThat(resultado.saldoTotal()).isEqualByComparingTo("4200.00");
        assertThat(resultado.totalReceitas()).isEqualByComparingTo("3000.00");
        assertThat(resultado.totalDespesas()).isEqualByComparingTo("1200.00");
        assertThat(resultado.resultadoPeriodo()).isEqualByComparingTo("1800.00");
        assertThat(resultado.despesasPorCategoria()).singleElement().satisfies(total -> {
            assertThat(total.categoriaId()).isEqualTo(2L);
            assertThat(total.categoriaNome()).isEqualTo("Alimentação");
            assertThat(total.total()).isEqualByComparingTo("700.00");
        });
    }

    @Test
    void deveRetornarValoresZeradosQuandoNaoHouverDados() {
        LocalDate inicio = LocalDate.of(2026, 9, 1);
        LocalDate fim = LocalDate.of(2026, 9, 30);
        when(transacaoRepository.somarPorCategoriaETipoEPeriodo(
                TipoOperacao.DESPESA, inicio, fim
        )).thenReturn(List.of());

        ResumoFinanceiroResponse resultado = resumoFinanceiroService.gerar(inicio, fim);

        assertThat(resultado.saldoTotal()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(resultado.totalReceitas()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(resultado.totalDespesas()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(resultado.resultadoPeriodo()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(resultado.despesasPorCategoria()).isEmpty();
    }

    @Test
    void deveRejeitarPeriodoInvertido() {
        LocalDate inicio = LocalDate.of(2026, 10, 1);
        LocalDate fim = LocalDate.of(2026, 9, 30);

        assertThatThrownBy(() -> resumoFinanceiroService.gerar(inicio, fim))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessage("A data inicial não pode ser posterior à data final");
        verifyNoInteractions(contaRepository, transacaoRepository);
    }
}
