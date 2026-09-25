package com.cifra.backend.service;

import com.cifra.backend.dto.TransacaoRecorrenteRequest;
import com.cifra.backend.dto.TransacaoRecorrenteResponse;
import com.cifra.backend.exception.RegraNegocioException;
import com.cifra.backend.model.Categoria;
import com.cifra.backend.model.Conta;
import com.cifra.backend.model.TransacaoRecorrente;
import com.cifra.backend.model.enums.Frequencia;
import com.cifra.backend.model.enums.TipoConta;
import com.cifra.backend.model.enums.TipoOperacao;
import com.cifra.backend.repository.CategoriaRepository;
import com.cifra.backend.repository.ContaRepository;
import com.cifra.backend.repository.TransacaoRecorrenteRepository;
import com.cifra.backend.repository.TransacaoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransacaoRecorrenteServiceTest {

    @Mock
    private TransacaoRecorrenteRepository recorrenciaRepository;

    @Mock
    private TransacaoRepository transacaoRepository;

    @Mock
    private ContaRepository contaRepository;

    @Mock
    private CategoriaRepository categoriaRepository;

    private TransacaoRecorrenteService service;
    private Conta conta;
    private Categoria categoriaDespesa;

    @BeforeEach
    void configurar() {
        service = new TransacaoRecorrenteService(
                recorrenciaRepository,
                transacaoRepository,
                contaRepository,
                categoriaRepository
        );
        conta = new Conta(1L, "Conta corrente", BigDecimal.ZERO, TipoConta.CORRENTE);
        categoriaDespesa = new Categoria(2L, "Moradia", TipoOperacao.DESPESA);
    }

    @Test
    void deveCriarRecorrenciaMensal() {
        when(contaRepository.findById(1L)).thenReturn(Optional.of(conta));
        when(categoriaRepository.findById(2L)).thenReturn(Optional.of(categoriaDespesa));
        when(recorrenciaRepository.save(any())).thenAnswer(invocacao -> {
            TransacaoRecorrente recorrencia = invocacao.getArgument(0);
            recorrencia.setId(3L);
            return recorrencia;
        });

        TransacaoRecorrenteResponse resultado = service.criar(request(
                Frequencia.MENSAL, 5, LocalDate.of(2026, 9, 1), null, true
        ));

        assertThat(resultado.id()).isEqualTo(3L);
        assertThat(resultado.descricao()).isEqualTo("Aluguel");
        assertThat(resultado.diaDoMes()).isEqualTo(5);
        assertThat(resultado.ativa()).isTrue();
        assertThat(resultado.contaNome()).isEqualTo("Conta corrente");
        assertThat(resultado.categoriaNome()).isEqualTo("Moradia");
    }

    @Test
    void deveListarFiltrandoPorSituacao() {
        TransacaoRecorrente recorrencia = recorrencia(3L);
        when(recorrenciaRepository.findByAtiva(any(Boolean.class), any(Sort.class)))
                .thenReturn(List.of(recorrencia));

        List<TransacaoRecorrenteResponse> resultado = service.listar(true);

        assertThat(resultado).singleElement().extracting(TransacaoRecorrenteResponse::id)
                .isEqualTo(3L);
    }

    @Test
    void deveExigirDiaDoMesParaFrequenciaMensal() {
        assertThatThrownBy(() -> service.criar(request(
                Frequencia.MENSAL, null, LocalDate.of(2026, 9, 1), null, true
        )))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessage("O dia do mês é obrigatório para recorrências mensais");
    }

    @Test
    void deveRejeitarDiaDoMesEmFrequenciaSemanal() {
        assertThatThrownBy(() -> service.criar(request(
                Frequencia.SEMANAL, 5, LocalDate.of(2026, 9, 1), null, true
        )))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessage("O dia do mês deve ser informado apenas para recorrências mensais");
    }

    @Test
    void deveRejeitarDataFinalAnteriorAInicial() {
        assertThatThrownBy(() -> service.criar(request(
                Frequencia.ANUAL,
                null,
                LocalDate.of(2026, 9, 1),
                LocalDate.of(2026, 8, 31),
                true
        )))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessage("A data final não pode ser anterior à data inicial");
    }

    @Test
    void deveRejeitarCategoriaComTipoIncompativel() {
        Categoria categoriaReceita = new Categoria(2L, "Salário", TipoOperacao.RECEITA);
        when(contaRepository.findById(1L)).thenReturn(Optional.of(conta));
        when(categoriaRepository.findById(2L)).thenReturn(Optional.of(categoriaReceita));

        assertThatThrownBy(() -> service.criar(request(
                Frequencia.MENSAL, 5, LocalDate.of(2026, 9, 1), null, true
        )))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessage("O tipo da categoria deve ser igual ao tipo da recorrência");
    }

    @Test
    void deveBloquearExclusaoQuandoExistiremTransacoesGeradas() {
        TransacaoRecorrente recorrencia = recorrencia(3L);
        when(recorrenciaRepository.findById(3L)).thenReturn(Optional.of(recorrencia));
        when(transacaoRepository.existsByRecorrenciaId(3L)).thenReturn(true);

        assertThatThrownBy(() -> service.excluir(3L))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessage("A recorrência não pode ser excluída porque possui transações geradas");
        verify(recorrenciaRepository, never()).delete(any());
    }

    @Test
    void deveExcluirRecorrenciaSemTransacoesGeradas() {
        TransacaoRecorrente recorrencia = recorrencia(3L);
        when(recorrenciaRepository.findById(3L)).thenReturn(Optional.of(recorrencia));

        service.excluir(3L);

        verify(recorrenciaRepository).delete(recorrencia);
    }

    private TransacaoRecorrenteRequest request(
            Frequencia frequencia,
            Integer diaDoMes,
            LocalDate dataInicio,
            LocalDate dataFim,
            boolean ativa
    ) {
        return new TransacaoRecorrenteRequest(
                "  Aluguel  ",
                new BigDecimal("1200.00"),
                TipoOperacao.DESPESA,
                frequencia,
                diaDoMes,
                dataInicio,
                dataFim,
                ativa,
                1L,
                2L
        );
    }

    private TransacaoRecorrente recorrencia(Long id) {
        return new TransacaoRecorrente(
                id,
                "Aluguel",
                new BigDecimal("1200.00"),
                TipoOperacao.DESPESA,
                Frequencia.MENSAL,
                5,
                LocalDate.of(2026, 9, 1),
                null,
                true,
                conta,
                categoriaDespesa
        );
    }
}
