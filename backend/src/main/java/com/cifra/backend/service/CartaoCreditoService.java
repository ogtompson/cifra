package com.cifra.backend.service;

import com.cifra.backend.dto.CartaoCreditoRequest;
import com.cifra.backend.dto.CartaoCreditoResponse;
import com.cifra.backend.dto.CompraCartaoRequest;
import com.cifra.backend.dto.CompraCartaoResponse;
import com.cifra.backend.dto.FaturaCartaoResponse;
import com.cifra.backend.dto.ParcelaFaturaResponse;
import com.cifra.backend.exception.RecursoNaoEncontradoException;
import com.cifra.backend.exception.RegraNegocioException;
import com.cifra.backend.model.CartaoCredito;
import com.cifra.backend.model.Categoria;
import com.cifra.backend.model.CompraCartao;
import com.cifra.backend.model.Conta;
import com.cifra.backend.model.enums.TipoOperacao;
import com.cifra.backend.repository.CartaoCreditoRepository;
import com.cifra.backend.repository.CategoriaRepository;
import com.cifra.backend.repository.CompraCartaoRepository;
import com.cifra.backend.repository.ContaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class CartaoCreditoService {

    private final CartaoCreditoRepository cartaoRepository;
    private final CompraCartaoRepository compraRepository;
    private final ContaRepository contaRepository;
    private final CategoriaRepository categoriaRepository;
    private final Clock clock;

    public CartaoCreditoService(
            CartaoCreditoRepository cartaoRepository,
            CompraCartaoRepository compraRepository,
            ContaRepository contaRepository,
            CategoriaRepository categoriaRepository,
            Clock clock
    ) {
        this.cartaoRepository = cartaoRepository;
        this.compraRepository = compraRepository;
        this.contaRepository = contaRepository;
        this.categoriaRepository = categoriaRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<CartaoCreditoResponse> listarCartoes() {
        LocalDate hoje = LocalDate.now(clock);
        return cartaoRepository.findAllByOrderByNomeAsc().stream()
                .map(cartao -> paraCartaoResponse(cartao, calcularLimiteUtilizado(cartao, hoje)))
                .toList();
    }

    @Transactional
    public CartaoCreditoResponse criarCartao(CartaoCreditoRequest request) {
        CartaoCredito cartao = new CartaoCredito();
        atualizarCartao(cartao, request);
        return paraCartaoResponse(cartaoRepository.save(cartao), BigDecimal.ZERO);
    }

    @Transactional
    public CartaoCreditoResponse atualizarCartao(Long id, CartaoCreditoRequest request) {
        CartaoCredito cartao = buscarCartao(id);
        atualizarCartao(cartao, request);
        return paraCartaoResponse(cartaoRepository.save(cartao), calcularLimiteUtilizado(cartao, LocalDate.now(clock)));
    }

    @Transactional
    public void excluirCartao(Long id) {
        CartaoCredito cartao = buscarCartao(id);
        if (compraRepository.existsByCartaoId(id)) {
            throw new RegraNegocioException("O cartão possui compras vinculadas e não pode ser excluído");
        }
        cartaoRepository.delete(cartao);
    }

    @Transactional(readOnly = true)
    public List<CompraCartaoResponse> listarCompras(Long cartaoId) {
        if (cartaoId != null) buscarCartao(cartaoId);
        List<CompraCartao> compras = cartaoId == null
                ? compraRepository.findAllByOrderByDataCompraDescIdDesc()
                : compraRepository.findByCartaoIdOrderByDataCompraDescIdDesc(cartaoId);
        return compras.stream().map(this::paraCompraResponse).toList();
    }

    @Transactional
    public CompraCartaoResponse criarCompra(CompraCartaoRequest request) {
        CompraCartao compra = new CompraCartao();
        atualizarCompra(compra, request);
        validarLimite(compra, null);
        return paraCompraResponse(compraRepository.save(compra));
    }

    @Transactional
    public CompraCartaoResponse atualizarCompra(Long id, CompraCartaoRequest request) {
        CompraCartao compra = buscarCompra(id);
        atualizarCompra(compra, request);
        validarLimite(compra, id);
        return paraCompraResponse(compraRepository.save(compra));
    }

    @Transactional
    public void excluirCompra(Long id) {
        compraRepository.delete(buscarCompra(id));
    }

    @Transactional(readOnly = true)
    public List<FaturaCartaoResponse> projetarFaturas(Long cartaoId, LocalDate mesReferencia, int meses) {
        if (meses < 1 || meses > 24) {
            throw new RegraNegocioException("A projeção deve conter entre 1 e 24 meses");
        }
        CartaoCredito cartao = buscarCartao(cartaoId);
        YearMonth inicio = YearMonth.from(mesReferencia);
        List<CompraCartao> compras = compraRepository.findByCartaoIdOrderByDataCompraDescIdDesc(cartaoId);
        List<FaturaCartaoResponse> faturas = new ArrayList<>();
        for (int deslocamento = 0; deslocamento < meses; deslocamento++) {
            YearMonth competencia = inicio.plusMonths(deslocamento);
            List<ParcelaFaturaResponse> parcelas = parcelasDaFatura(cartao, compras, competencia);
            BigDecimal total = parcelas.stream().map(ParcelaFaturaResponse::valor).reduce(BigDecimal.ZERO, BigDecimal::add);
            faturas.add(new FaturaCartaoResponse(
                    cartao.getId(),
                    cartao.getNome(),
                    competencia.atDay(1),
                    dataFechamentoDaFatura(competencia, cartao),
                    dataNoMes(competencia, cartao.getDiaVencimento()),
                    total,
                    parcelas
            ));
        }
        return faturas;
    }

    private void atualizarCartao(CartaoCredito cartao, CartaoCreditoRequest request) {
        Conta conta = contaRepository.findById(request.contaPagamentoId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Conta não encontrada com o id " + request.contaPagamentoId()));
        if (Boolean.TRUE.equals(conta.getArquivada())) {
            throw new RegraNegocioException("A conta de pagamento precisa estar ativa");
        }
        if (request.diaFechamento().equals(request.diaVencimento())) {
            throw new RegraNegocioException("Fechamento e vencimento devem ocorrer em dias diferentes");
        }
        cartao.setNome(request.nome().trim());
        cartao.setBandeira(request.bandeira().trim());
        cartao.setFinalCartao(request.finalCartao());
        cartao.setLimiteTotal(request.limiteTotal());
        cartao.setDiaFechamento(request.diaFechamento());
        cartao.setDiaVencimento(request.diaVencimento());
        cartao.setContaPagamento(conta);
    }

    private void atualizarCompra(CompraCartao compra, CompraCartaoRequest request) {
        CartaoCredito cartao = buscarCartao(request.cartaoId());
        Categoria categoria = categoriaRepository.findById(request.categoriaId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Categoria não encontrada com o id " + request.categoriaId()));
        if (categoria.getTipo() != TipoOperacao.DESPESA) {
            throw new RegraNegocioException("Compras no cartão exigem uma categoria de despesa");
        }
        compra.setDescricao(request.descricao().trim());
        compra.setValorTotal(request.valorTotal());
        compra.setDataCompra(request.dataCompra());
        compra.setNumeroParcelas(request.numeroParcelas());
        compra.setCartao(cartao);
        compra.setCategoria(categoria);
    }

    private void validarLimite(CompraCartao compra, Long compraAtualId) {
        YearMonth mesAtual = YearMonth.from(LocalDate.now(clock));
        BigDecimal utilizado = compraRepository.findByCartaoIdOrderByDataCompraDescIdDesc(compra.getCartao().getId()).stream()
                .filter(item -> compraAtualId == null || !item.getId().equals(compraAtualId))
                .flatMap(item -> parcelasDaCompra(item).stream())
                .filter(parcela -> !YearMonth.from(parcela.vencimento()).isBefore(mesAtual))
                .map(ParcelaFaturaResponse::valor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (utilizado.add(compra.getValorTotal()).compareTo(compra.getCartao().getLimiteTotal()) > 0) {
            throw new RegraNegocioException("A compra ultrapassa o limite disponível do cartão");
        }
    }

    private BigDecimal calcularLimiteUtilizado(CartaoCredito cartao, LocalDate hoje) {
        YearMonth mesAtual = YearMonth.from(hoje);
        return compraRepository.findByCartaoIdOrderByDataCompraDescIdDesc(cartao.getId()).stream()
                .flatMap(compra -> parcelasDaCompra(compra).stream())
                .filter(parcela -> !YearMonth.from(parcela.vencimento()).isBefore(mesAtual))
                .map(ParcelaFaturaResponse::valor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<ParcelaFaturaResponse> parcelasDaFatura(CartaoCredito cartao, List<CompraCartao> compras, YearMonth competencia) {
        return compras.stream()
                .filter(compra -> compra.getCartao().getId().equals(cartao.getId()))
                .flatMap(compra -> parcelasDaCompra(compra).stream())
                .filter(parcela -> YearMonth.from(parcela.vencimento()).equals(competencia))
                .sorted(Comparator.comparing(ParcelaFaturaResponse::vencimento).thenComparing(ParcelaFaturaResponse::descricao))
                .toList();
    }

    private List<ParcelaFaturaResponse> parcelasDaCompra(CompraCartao compra) {
        BigDecimal valorBase = compra.getValorTotal().divide(BigDecimal.valueOf(compra.getNumeroParcelas()), 2, RoundingMode.DOWN);
        BigDecimal diferenca = compra.getValorTotal().subtract(valorBase.multiply(BigDecimal.valueOf(compra.getNumeroParcelas())));
        LocalDate primeiroVencimento = primeiroVencimento(compra);
        List<ParcelaFaturaResponse> parcelas = new ArrayList<>();
        for (int indice = 0; indice < compra.getNumeroParcelas(); indice++) {
            BigDecimal valor = indice == 0 ? valorBase.add(diferenca) : valorBase;
            LocalDate vencimento = dataNoMes(YearMonth.from(primeiroVencimento).plusMonths(indice), compra.getCartao().getDiaVencimento());
            parcelas.add(new ParcelaFaturaResponse(
                    compra.getId(), compra.getDescricao(), valor, indice + 1, compra.getNumeroParcelas(), vencimento,
                    compra.getCategoria().getId(), compra.getCategoria().getNome()
            ));
        }
        return parcelas;
    }

    private LocalDate primeiroVencimento(CompraCartao compra) {
        CartaoCredito cartao = compra.getCartao();
        YearMonth mesFechamento = YearMonth.from(compra.getDataCompra());
        int fechamentoReal = Math.min(cartao.getDiaFechamento(), mesFechamento.lengthOfMonth());
        if (compra.getDataCompra().getDayOfMonth() > fechamentoReal) mesFechamento = mesFechamento.plusMonths(1);
        YearMonth mesVencimento = cartao.getDiaVencimento() > cartao.getDiaFechamento()
                ? mesFechamento
                : mesFechamento.plusMonths(1);
        return dataNoMes(mesVencimento, cartao.getDiaVencimento());
    }

    private LocalDate dataNoMes(YearMonth mes, int dia) {
        return mes.atDay(Math.min(dia, mes.lengthOfMonth()));
    }

    private LocalDate dataFechamentoDaFatura(YearMonth competenciaVencimento, CartaoCredito cartao) {
        YearMonth competenciaFechamento = cartao.getDiaVencimento() > cartao.getDiaFechamento()
                ? competenciaVencimento
                : competenciaVencimento.minusMonths(1);
        return dataNoMes(competenciaFechamento, cartao.getDiaFechamento());
    }

    private CartaoCredito buscarCartao(Long id) {
        return cartaoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cartão não encontrado com o id " + id));
    }

    private CompraCartao buscarCompra(Long id) {
        return compraRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Compra não encontrada com o id " + id));
    }

    private CartaoCreditoResponse paraCartaoResponse(CartaoCredito cartao, BigDecimal utilizado) {
        return new CartaoCreditoResponse(
                cartao.getId(), cartao.getNome(), cartao.getBandeira(), cartao.getFinalCartao(), cartao.getLimiteTotal(),
                utilizado, cartao.getLimiteTotal().subtract(utilizado), cartao.getDiaFechamento(), cartao.getDiaVencimento(),
                cartao.getContaPagamento().getId(), cartao.getContaPagamento().getNome()
        );
    }

    private CompraCartaoResponse paraCompraResponse(CompraCartao compra) {
        List<ParcelaFaturaResponse> parcelas = parcelasDaCompra(compra);
        return new CompraCartaoResponse(
                compra.getId(), compra.getDescricao(), compra.getValorTotal(), compra.getDataCompra(), compra.getNumeroParcelas(),
                parcelas.getFirst().valor(), parcelas.getFirst().vencimento(), parcelas.getLast().vencimento(),
                compra.getCartao().getId(), compra.getCartao().getNome(), compra.getCategoria().getId(), compra.getCategoria().getNome()
        );
    }
}
