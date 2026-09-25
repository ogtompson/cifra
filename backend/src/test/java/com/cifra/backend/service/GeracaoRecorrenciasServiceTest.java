package com.cifra.backend.service;

import com.cifra.backend.model.Categoria;
import com.cifra.backend.model.Conta;
import com.cifra.backend.model.Transacao;
import com.cifra.backend.model.TransacaoRecorrente;
import com.cifra.backend.model.enums.Frequencia;
import com.cifra.backend.model.enums.TipoConta;
import com.cifra.backend.model.enums.TipoOperacao;
import com.cifra.backend.repository.TransacaoRecorrenteRepository;
import com.cifra.backend.repository.TransacaoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GeracaoRecorrenciasServiceTest {

    @Mock
    private TransacaoRecorrenteRepository recorrenciaRepository;

    @Mock
    private TransacaoRepository transacaoRepository;

    private GeracaoRecorrenciasService service;

    @BeforeEach
    void configurar() {
        service = new GeracaoRecorrenciasService(recorrenciaRepository, transacaoRepository);
    }

    @Test
    void deveGerarOcorrenciasMensaisPendentesSemDuplicar() {
        TransacaoRecorrente recorrencia = recorrencia(
                Frequencia.MENSAL, 31, LocalDate.of(2026, 1, 15), null
        );
        when(recorrenciaRepository.findByAtivaTrue()).thenReturn(List.of(recorrencia));
        when(transacaoRepository.existsByRecorrenciaIdAndData(
                10L, LocalDate.of(2026, 1, 31)
        )).thenReturn(true);

        int quantidade = service.gerarPendentesAte(LocalDate.of(2026, 3, 10));

        ArgumentCaptor<Transacao> captor = ArgumentCaptor.forClass(Transacao.class);
        verify(transacaoRepository).save(captor.capture());
        Transacao gerada = captor.getValue();
        assertThat(quantidade).isEqualTo(1);
        assertThat(gerada.getData()).isEqualTo(LocalDate.of(2026, 2, 28));
        assertThat(gerada.getDescricao()).isEqualTo("Aluguel");
        assertThat(gerada.getValor()).isEqualByComparingTo("1200.00");
        assertThat(gerada.getConta()).isSameAs(recorrencia.getConta());
        assertThat(gerada.getCategoria()).isSameAs(recorrencia.getCategoria());
        assertThat(gerada.getRecorrencia()).isSameAs(recorrencia);
    }

    @Test
    void deveRespeitarDataFinalNaRecorrenciaSemanal() {
        TransacaoRecorrente recorrencia = recorrencia(
                Frequencia.SEMANAL,
                null,
                LocalDate.of(2026, 9, 1),
                LocalDate.of(2026, 9, 15)
        );

        assertThat(service.calcularDatasPendentes(
                recorrencia, LocalDate.of(2026, 10, 1)
        )).containsExactly(
                LocalDate.of(2026, 9, 1),
                LocalDate.of(2026, 9, 8),
                LocalDate.of(2026, 9, 15)
        );
    }

    @Test
    void deveAjustarRecorrenciaAnualDeAnoBissexto() {
        TransacaoRecorrente recorrencia = recorrencia(
                Frequencia.ANUAL,
                null,
                LocalDate.of(2024, 2, 29),
                null
        );

        assertThat(service.calcularDatasPendentes(
                recorrencia, LocalDate.of(2026, 3, 1)
        )).containsExactly(
                LocalDate.of(2024, 2, 29),
                LocalDate.of(2025, 2, 28),
                LocalDate.of(2026, 2, 28)
        );
    }

    @Test
    void naoDeveGerarAntesDaDataInicial() {
        TransacaoRecorrente recorrencia = recorrencia(
                Frequencia.SEMANAL, null, LocalDate.of(2026, 10, 1), null
        );
        when(recorrenciaRepository.findByAtivaTrue()).thenReturn(List.of(recorrencia));

        int quantidade = service.gerarPendentesAte(LocalDate.of(2026, 9, 30));

        assertThat(quantidade).isZero();
        verify(transacaoRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    private TransacaoRecorrente recorrencia(
            Frequencia frequencia,
            Integer diaDoMes,
            LocalDate dataInicio,
            LocalDate dataFim
    ) {
        Conta conta = new Conta(1L, "Conta corrente", BigDecimal.ZERO, TipoConta.CORRENTE);
        Categoria categoria = new Categoria(2L, "Moradia", TipoOperacao.DESPESA);
        return new TransacaoRecorrente(
                10L,
                "Aluguel",
                new BigDecimal("1200.00"),
                TipoOperacao.DESPESA,
                frequencia,
                diaDoMes,
                dataInicio,
                dataFim,
                true,
                conta,
                categoria
        );
    }
}
