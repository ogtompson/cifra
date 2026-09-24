package com.cifra.backend.service;

import com.cifra.backend.dto.TransacaoRequest;
import com.cifra.backend.dto.TransacaoResponse;
import com.cifra.backend.exception.RecursoNaoEncontradoException;
import com.cifra.backend.exception.RegraNegocioException;
import com.cifra.backend.model.Categoria;
import com.cifra.backend.model.Conta;
import com.cifra.backend.model.Transacao;
import com.cifra.backend.model.enums.TipoConta;
import com.cifra.backend.model.enums.TipoOperacao;
import com.cifra.backend.repository.CategoriaRepository;
import com.cifra.backend.repository.ContaRepository;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransacaoServiceTest {

    @Mock
    private TransacaoRepository transacaoRepository;
    @Mock
    private ContaRepository contaRepository;
    @Mock
    private CategoriaRepository categoriaRepository;

    private TransacaoService transacaoService;
    private Conta conta;
    private Categoria categoriaDespesa;

    @BeforeEach
    void configurar() {
        transacaoService = new TransacaoService(
                transacaoRepository,
                contaRepository,
                categoriaRepository
        );
        conta = new Conta(1L, "Conta corrente", BigDecimal.ZERO, TipoConta.CORRENTE);
        categoriaDespesa = new Categoria(2L, "Alimentação", TipoOperacao.DESPESA);
    }

    @Test
    void deveCriarTransacaoManualComValorPositivo() {
        TransacaoRequest request = request(TipoOperacao.DESPESA, 1L, 2L);
        when(contaRepository.findById(1L)).thenReturn(Optional.of(conta));
        when(categoriaRepository.findById(2L)).thenReturn(Optional.of(categoriaDespesa));
        when(transacaoRepository.save(any(Transacao.class))).thenAnswer(invocacao -> {
            Transacao transacao = invocacao.getArgument(0);
            transacao.setId(3L);
            return transacao;
        });

        TransacaoResponse resultado = transacaoService.criar(request);

        assertThat(resultado.id()).isEqualTo(3L);
        assertThat(resultado.valor()).isEqualByComparingTo("25.90");
        assertThat(resultado.recorrenciaId()).isNull();
        assertThat(resultado.contaNome()).isEqualTo("Conta corrente");
    }

    @Test
    void deveRejeitarCategoriaComTipoDiferenteDaTransacao() {
        TransacaoRequest request = request(TipoOperacao.RECEITA, 1L, 2L);
        when(contaRepository.findById(1L)).thenReturn(Optional.of(conta));
        when(categoriaRepository.findById(2L)).thenReturn(Optional.of(categoriaDespesa));

        assertThatThrownBy(() -> transacaoService.criar(request))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessage("O tipo da categoria deve ser igual ao tipo da transação");
    }

    @Test
    void deveListarTransacoesFiltradasPorConta() {
        Transacao transacao = transacao(4L);
        when(contaRepository.existsById(1L)).thenReturn(true);
        when(transacaoRepository.findByContaIdOrderByDataDescIdDesc(1L))
                .thenReturn(List.of(transacao));

        List<TransacaoResponse> resultado = transacaoService.listar(1L);

        assertThat(resultado).hasSize(1);
        assertThat(resultado.getFirst().id()).isEqualTo(4L);
    }

    @Test
    void deveListarTodasAsTransacoes() {
        when(transacaoRepository.findAll(any(Sort.class)))
                .thenReturn(List.of(transacao(4L)));

        List<TransacaoResponse> resultado = transacaoService.listar(null);

        assertThat(resultado).hasSize(1);
    }

    @Test
    void deveInformarQuandoContaDoFiltroNaoExistir() {
        when(contaRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> transacaoService.listar(99L))
                .isInstanceOf(RecursoNaoEncontradoException.class)
                .hasMessage("Conta não encontrada com o id 99");
    }

    @Test
    void deveExcluirTransacaoExistente() {
        Transacao transacao = transacao(4L);
        when(transacaoRepository.findById(4L)).thenReturn(Optional.of(transacao));

        transacaoService.excluir(4L);

        verify(transacaoRepository).delete(transacao);
    }

    private TransacaoRequest request(TipoOperacao tipo, Long contaId, Long categoriaId) {
        return new TransacaoRequest(
                "  Almoço  ",
                new BigDecimal("25.90"),
                LocalDate.of(2026, 9, 24),
                tipo,
                contaId,
                categoriaId
        );
    }

    private Transacao transacao(Long id) {
        return new Transacao(
                id,
                "Almoço",
                new BigDecimal("25.90"),
                LocalDate.of(2026, 9, 24),
                TipoOperacao.DESPESA,
                conta,
                categoriaDespesa,
                null
        );
    }
}
