package com.cifra.backend.service;

import com.cifra.backend.dto.ContaRequest;
import com.cifra.backend.dto.ContaResponse;
import com.cifra.backend.dto.SaldoContaResponse;
import com.cifra.backend.exception.RecursoNaoEncontradoException;
import com.cifra.backend.model.Conta;
import com.cifra.backend.model.enums.TipoConta;
import com.cifra.backend.model.enums.TipoOperacao;
import com.cifra.backend.repository.ContaRepository;
import com.cifra.backend.repository.TransacaoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContaServiceTest {

    @Mock
    private ContaRepository contaRepository;

    @Mock
    private TransacaoRepository transacaoRepository;

    private ContaService contaService;

    @BeforeEach
    void configurar() {
        contaService = new ContaService(contaRepository, transacaoRepository);
    }

    @Test
    void deveListarContasOrdenadasPorNome() {
        Conta carteira = conta(1L, "Carteira", "50.00", TipoConta.DINHEIRO);
        Conta corrente = conta(2L, "Conta corrente", "1000.00", TipoConta.CORRENTE);
        when(contaRepository.findAll(any(Sort.class)))
                .thenReturn(List.of(carteira, corrente));

        List<ContaResponse> resultado = contaService.listar();

        assertThat(resultado).containsExactly(
                new ContaResponse(1L, "Carteira", new BigDecimal("50.00"), TipoConta.DINHEIRO),
                new ContaResponse(2L, "Conta corrente", new BigDecimal("1000.00"), TipoConta.CORRENTE)
        );
    }

    @Test
    void deveCriarContaNormalizandoONome() {
        ContaRequest request = new ContaRequest(
                "  Conta corrente  ",
                new BigDecimal("1500.25"),
                TipoConta.CORRENTE
        );
        when(contaRepository.save(any(Conta.class))).thenAnswer(invocacao -> {
            Conta conta = invocacao.getArgument(0);
            conta.setId(1L);
            return conta;
        });

        ContaResponse resultado = contaService.criar(request);

        assertThat(resultado).isEqualTo(
                new ContaResponse(
                        1L,
                        "Conta corrente",
                        new BigDecimal("1500.25"),
                        TipoConta.CORRENTE
                )
        );
    }

    @Test
    void devePermitirSaldoInicialNegativo() {
        ContaRequest request = new ContaRequest(
                "Conta devedora",
                new BigDecimal("-200.00"),
                TipoConta.CORRENTE
        );
        when(contaRepository.save(any(Conta.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        ContaResponse resultado = contaService.criar(request);

        assertThat(resultado.saldoInicial()).isEqualByComparingTo("-200.00");
    }

    @Test
    void deveAtualizarContaExistente() {
        Conta conta = conta(1L, "Poupança", "100.00", TipoConta.POUPANCA);
        when(contaRepository.findById(1L)).thenReturn(Optional.of(conta));
        when(contaRepository.save(conta)).thenReturn(conta);

        ContaResponse resultado = contaService.atualizar(
                1L,
                new ContaRequest("Reserva", new BigDecimal("250.00"), TipoConta.POUPANCA)
        );

        assertThat(resultado.nome()).isEqualTo("Reserva");
        assertThat(resultado.saldoInicial()).isEqualByComparingTo("250.00");
    }

    @Test
    void deveExcluirContaExistente() {
        Conta conta = conta(1L, "Carteira", "20.00", TipoConta.DINHEIRO);
        when(contaRepository.findById(1L)).thenReturn(Optional.of(conta));

        contaService.excluir(1L);

        verify(contaRepository).delete(conta);
    }

    @Test
    void deveInformarQuandoContaNaoExistir() {
        when(contaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contaService.buscarPorId(99L))
                .isInstanceOf(RecursoNaoEncontradoException.class)
                .hasMessage("Conta não encontrada com o id 99");
    }

    @Test
    void deveCalcularSaldoPeloTipoDasOperacoes() {
        Conta conta = conta(1L, "Conta corrente", "1000.00", TipoConta.CORRENTE);
        when(contaRepository.findById(1L)).thenReturn(Optional.of(conta));
        when(transacaoRepository.somarValorPorContaETipo(1L, TipoOperacao.RECEITA))
                .thenReturn(new BigDecimal("2500.00"));
        when(transacaoRepository.somarValorPorContaETipo(1L, TipoOperacao.DESPESA))
                .thenReturn(new BigDecimal("750.00"));

        SaldoContaResponse resultado = contaService.calcularSaldo(1L);

        assertThat(resultado).isEqualTo(new SaldoContaResponse(
                1L,
                "Conta corrente",
                new BigDecimal("1000.00"),
                new BigDecimal("2500.00"),
                new BigDecimal("750.00"),
                new BigDecimal("2750.00")
        ));
    }

    @Test
    void deveUsarSaldoInicialQuandoNaoHouverTransacoes() {
        Conta conta = conta(1L, "Carteira", "80.00", TipoConta.DINHEIRO);
        when(contaRepository.findById(1L)).thenReturn(Optional.of(conta));
        when(transacaoRepository.somarValorPorContaETipo(1L, TipoOperacao.RECEITA))
                .thenReturn(BigDecimal.ZERO);
        when(transacaoRepository.somarValorPorContaETipo(1L, TipoOperacao.DESPESA))
                .thenReturn(BigDecimal.ZERO);

        SaldoContaResponse resultado = contaService.calcularSaldo(1L);

        assertThat(resultado.saldoAtual()).isEqualByComparingTo("80.00");
        assertThat(resultado.totalReceitas()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(resultado.totalDespesas()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    private Conta conta(Long id, String nome, String saldoInicial, TipoConta tipo) {
        return new Conta(id, nome, new BigDecimal(saldoInicial), tipo);
    }
}
