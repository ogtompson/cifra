package com.cifra.backend.service;

import com.cifra.backend.dto.CartaoCreditoRequest;
import com.cifra.backend.dto.CompraCartaoRequest;
import com.cifra.backend.dto.FaturaCartaoResponse;
import com.cifra.backend.exception.RegraNegocioException;
import com.cifra.backend.model.CartaoCredito;
import com.cifra.backend.model.Categoria;
import com.cifra.backend.model.CompraCartao;
import com.cifra.backend.model.Conta;
import com.cifra.backend.model.enums.TipoConta;
import com.cifra.backend.model.enums.TipoOperacao;
import com.cifra.backend.repository.CartaoCreditoRepository;
import com.cifra.backend.repository.CategoriaRepository;
import com.cifra.backend.repository.CompraCartaoRepository;
import com.cifra.backend.repository.ContaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CartaoCreditoServiceTest {

    @Mock private CartaoCreditoRepository cartaoRepository;
    @Mock private CompraCartaoRepository compraRepository;
    @Mock private ContaRepository contaRepository;
    @Mock private CategoriaRepository categoriaRepository;

    private CartaoCreditoService service;
    private Conta conta;
    private Categoria categoria;
    private CartaoCredito cartao;

    @BeforeEach
    void configurar() {
        Clock clock = Clock.fixed(Instant.parse("2026-10-13T12:00:00Z"), ZoneId.of("America/Sao_Paulo"));
        service = new CartaoCreditoService(cartaoRepository, compraRepository, contaRepository, categoriaRepository, clock);
        conta = new Conta(1L, "Nubank", BigDecimal.ZERO, TipoConta.CORRENTE);
        categoria = new Categoria(2L, "Compras", TipoOperacao.DESPESA);
        cartao = new CartaoCredito(3L, "Ultravioleta", "Mastercard", "1234", new BigDecimal("5000.00"), 28, 5, conta);
    }

    @Test
    void deveCriarCartaoVinculadoAContaAtiva() {
        when(contaRepository.findById(1L)).thenReturn(Optional.of(conta));
        when(cartaoRepository.save(any())).thenAnswer(invocacao -> {
            CartaoCredito salvo = invocacao.getArgument(0);
            salvo.setId(3L);
            return salvo;
        });

        var resposta = service.criarCartao(new CartaoCreditoRequest("Ultravioleta", "Mastercard", "1234", new BigDecimal("5000"), 28, 5, 1L));

        assertThat(resposta.nome()).isEqualTo("Ultravioleta");
        assertThat(resposta.limiteDisponivel()).isEqualByComparingTo("5000.00");
        assertThat(resposta.contaPagamentoNome()).isEqualTo("Nubank");
    }

    @Test
    void deveProjetarCompraParceladaSemPerderCentavos() {
        CompraCartao compra = new CompraCartao(4L, "Notebook", new BigDecimal("100.00"), LocalDate.of(2026, 10, 20), 3, cartao, categoria);
        when(cartaoRepository.findById(3L)).thenReturn(Optional.of(cartao));
        when(compraRepository.findByCartaoIdOrderByDataCompraDescIdDesc(3L)).thenReturn(List.of(compra));

        List<FaturaCartaoResponse> faturas = service.projetarFaturas(3L, LocalDate.of(2026, 11, 1), 3);

        assertThat(faturas).extracting(FaturaCartaoResponse::total)
                .usingElementComparator(BigDecimal::compareTo)
                .containsExactly(new BigDecimal("33.34"), new BigDecimal("33.33"), new BigDecimal("33.33"));
        assertThat(faturas.getFirst().dataFechamento()).isEqualTo(LocalDate.of(2026, 10, 28));
        assertThat(faturas.getFirst().dataVencimento()).isEqualTo(LocalDate.of(2026, 11, 5));
    }

    @Test
    void deveRejeitarCompraAcimaDoLimiteDisponivel() {
        when(cartaoRepository.findById(3L)).thenReturn(Optional.of(cartao));
        when(categoriaRepository.findById(2L)).thenReturn(Optional.of(categoria));
        when(compraRepository.findByCartaoIdOrderByDataCompraDescIdDesc(3L)).thenReturn(List.of());

        CompraCartaoRequest request = new CompraCartaoRequest("Viagem", new BigDecimal("5200.00"), LocalDate.of(2026, 10, 13), 1, 3L, 2L);

        assertThatThrownBy(() -> service.criarCompra(request))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessage("A compra ultrapassa o limite disponível do cartão");
    }
}
