package com.cifra.backend.service;

import com.cifra.backend.dto.ContaRequest;
import com.cifra.backend.dto.ContaResponse;
import com.cifra.backend.dto.ExclusaoContaResponse;
import com.cifra.backend.dto.SaldoContaResponse;
import com.cifra.backend.dto.ArquivamentoContaRequest;
import com.cifra.backend.exception.RegraNegocioException;
import com.cifra.backend.exception.RecursoNaoEncontradoException;
import com.cifra.backend.model.Conta;
import com.cifra.backend.model.enums.TipoConta;
import com.cifra.backend.model.enums.TipoOperacao;
import com.cifra.backend.repository.ContaRepository;
import com.cifra.backend.repository.CartaoCreditoRepository;
import com.cifra.backend.repository.TransacaoRepository;
import com.cifra.backend.repository.TransacaoRecorrenteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContaServiceTest {

    @Mock
    private ContaRepository contaRepository;

    @Mock
    private TransacaoRepository transacaoRepository;

    @Mock
    private TransacaoRecorrenteRepository transacaoRecorrenteRepository;
    @Mock
    private CartaoCreditoRepository cartaoCreditoRepository;

    private ContaService contaService;

    @BeforeEach
    void configurar() {
        contaService = new ContaService(
                contaRepository,
                transacaoRepository,
                transacaoRecorrenteRepository,
                cartaoCreditoRepository
        );
    }

    @Test
    void deveListarContasOrdenadasPorNome() {
        Conta carteira = conta(1L, "Carteira", "50.00", TipoConta.DINHEIRO);
        Conta corrente = conta(2L, "Conta corrente", "1000.00", TipoConta.CORRENTE);
        when(contaRepository.findByArquivadaFalseOrArquivadaIsNull(any(Sort.class)))
                .thenReturn(List.of(carteira, corrente));

        List<ContaResponse> resultado = contaService.listar(false);

        assertThat(resultado).containsExactly(
                new ContaResponse(1L, "Carteira", new BigDecimal("50.00"), TipoConta.DINHEIRO, false),
                new ContaResponse(2L, "Conta corrente", new BigDecimal("1000.00"), TipoConta.CORRENTE, false)
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
                        TipoConta.CORRENTE,
                        false
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
    void deveArquivarERestaurarConta() {
        Conta conta = conta(1L, "Nubank", "120.00", TipoConta.CORRENTE);
        when(contaRepository.findById(1L)).thenReturn(Optional.of(conta));
        when(contaRepository.save(conta)).thenReturn(conta);

        ContaResponse arquivada = contaService.alterarArquivamento(
                1L, new ArquivamentoContaRequest(true)
        );
        ContaResponse restaurada = contaService.alterarArquivamento(
                1L, new ArquivamentoContaRequest(false)
        );

        assertThat(arquivada.arquivada()).isTrue();
        assertThat(restaurada.arquivada()).isFalse();
    }

    @Test
    void deveImpedirArquivamentoComCompromissosAtivos() {
        Conta conta = conta(1L, "Nubank", "120.00", TipoConta.CORRENTE);
        when(contaRepository.findById(1L)).thenReturn(Optional.of(conta));
        when(transacaoRecorrenteRepository.countByContaIdAndAtivaTrue(1L)).thenReturn(1L);

        assertThatThrownBy(() -> contaService.alterarArquivamento(
                1L, new ArquivamentoContaRequest(true)
        ))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessage("Pause as recorrências ativas e reassocie os cartões antes de arquivar esta conta");

        verify(contaRepository, never()).save(conta);
    }

    @Test
    void deveExcluirContaSemDependencias() {
        Conta conta = conta(1L, "Carteira", "20.00", TipoConta.DINHEIRO);
        when(contaRepository.findById(1L)).thenReturn(Optional.of(conta));

        contaService.excluir(1L, false);

        verify(contaRepository).delete(conta);
    }

    @Test
    void deveInformarImpactoDaExclusao() {
        Conta conta = conta(1L, "Nubank", "20.00", TipoConta.CORRENTE);
        when(contaRepository.findById(1L)).thenReturn(Optional.of(conta));
        when(transacaoRepository.countByContaId(1L)).thenReturn(12L);
        when(transacaoRecorrenteRepository.countByContaId(1L)).thenReturn(2L);

        ExclusaoContaResponse resultado = contaService.consultarExclusao(1L);

        assertThat(resultado).isEqualTo(new ExclusaoContaResponse(
                1L, "Nubank", 12L, 2L, 0L, false
        ));
    }

    @Test
    void deveImpedirExclusaoSilenciosaDeContaComDependencias() {
        Conta conta = conta(1L, "Nubank", "20.00", TipoConta.CORRENTE);
        when(contaRepository.findById(1L)).thenReturn(Optional.of(conta));
        when(transacaoRepository.countByContaId(1L)).thenReturn(12L);
        when(transacaoRecorrenteRepository.countByContaId(1L)).thenReturn(2L);

        assertThatThrownBy(() -> contaService.excluir(1L, false))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("12 transa\u00e7\u00e3o(\u00f5es)")
                .hasMessageContaining("2 recorr\u00eancia(s)");

        verify(contaRepository, never()).delete(conta);
    }

    @Test
    void deveImpedirExclusaoDeContaUsadaPorCartao() {
        Conta conta = conta(1L, "Nubank", "20.00", TipoConta.CORRENTE);
        when(contaRepository.findById(1L)).thenReturn(Optional.of(conta));
        when(cartaoCreditoRepository.countByContaPagamentoId(1L)).thenReturn(1L);

        assertThatThrownBy(() -> contaService.excluir(1L, true))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("Reassocie ou exclua os cartões");

        verify(contaRepository, never()).delete(conta);
    }

    @Test
    void deveExcluirDependenciasAntesDaContaQuandoConfirmado() {
        Conta conta = conta(1L, "Nubank", "20.00", TipoConta.CORRENTE);
        when(contaRepository.findById(1L)).thenReturn(Optional.of(conta));
        when(transacaoRepository.countByContaId(1L)).thenReturn(12L);
        when(transacaoRecorrenteRepository.countByContaId(1L)).thenReturn(2L);

        contaService.excluir(1L, true);

        InOrder ordem = inOrder(
                transacaoRepository,
                transacaoRecorrenteRepository,
                contaRepository
        );
        ordem.verify(transacaoRepository).deleteByContaId(1L);
        ordem.verify(transacaoRecorrenteRepository).deleteByContaId(1L);
        ordem.verify(contaRepository).delete(conta);
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
