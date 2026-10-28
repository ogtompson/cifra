package com.cifra.backend.service;

import com.cifra.backend.dto.CartaoCreditoRequest;
import com.cifra.backend.dto.CartaoCreditoResponse;
import com.cifra.backend.dto.CompraCartaoRequest;
import com.cifra.backend.dto.CompraCartaoResponse;
import com.cifra.backend.dto.FaturaCartaoResponse;
import com.cifra.backend.dto.ParcelaFaturaResponse;
import com.cifra.backend.dto.PagamentoFaturaRequest;
import com.cifra.backend.exception.RecursoNaoEncontradoException;
import com.cifra.backend.exception.RegraNegocioException;
import com.cifra.backend.model.CartaoCredito;
import com.cifra.backend.model.Categoria;
import com.cifra.backend.model.CompraCartao;
import com.cifra.backend.model.Conta;
import com.cifra.backend.model.PagamentoFatura;
import com.cifra.backend.model.Transacao;
import com.cifra.backend.model.enums.NaturezaTransacao;
import com.cifra.backend.model.enums.TipoOperacao;
import com.cifra.backend.repository.CartaoCreditoRepository;
import com.cifra.backend.repository.CategoriaRepository;
import com.cifra.backend.repository.CompraCartaoRepository;
import com.cifra.backend.repository.ContaRepository;
import com.cifra.backend.repository.PagamentoFaturaRepository;
import com.cifra.backend.repository.TransacaoRepository;
import com.cifra.backend.security.UsuarioAtual;
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
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class CartaoCreditoService {

    private final CartaoCreditoRepository cartaoRepository;
    private final CompraCartaoRepository compraRepository;
    private final ContaRepository contaRepository;
    private final CategoriaRepository categoriaRepository;
    private final PagamentoFaturaRepository pagamentoRepository;
    private final TransacaoRepository transacaoRepository;
    private final Clock clock;
    private final UsuarioAtual usuarioAtual;

    public CartaoCreditoService(
            CartaoCreditoRepository cartaoRepository,
            CompraCartaoRepository compraRepository,
            ContaRepository contaRepository,
            CategoriaRepository categoriaRepository,
            PagamentoFaturaRepository pagamentoRepository,
            TransacaoRepository transacaoRepository,
            Clock clock,
            UsuarioAtual usuarioAtual
    ) {
        this.cartaoRepository = cartaoRepository;
        this.compraRepository = compraRepository;
        this.contaRepository = contaRepository;
        this.categoriaRepository = categoriaRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.transacaoRepository = transacaoRepository;
        this.clock = clock;
        this.usuarioAtual = usuarioAtual;
    }

    @Transactional(readOnly = true)
    public List<CartaoCreditoResponse> listarCartoes() {
        return cartaoRepository.findByContaPagamentoUsuarioIdOrderByNomeAsc(usuarioAtual.id()).stream()
                .map(cartao -> paraCartaoResponse(cartao, calcularLimiteUtilizado(cartao)))
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
        if (compraRepository.existsByCartaoId(id)
                && (!cartao.getDiaFechamento().equals(request.diaFechamento())
                || !cartao.getDiaVencimento().equals(request.diaVencimento()))) {
            throw new RegraNegocioException("Fechamento e vencimento não podem mudar enquanto houver compras vinculadas");
        }
        BigDecimal utilizado = calcularLimiteUtilizado(cartao);
        if (request.limiteTotal().compareTo(utilizado) < 0) {
            throw new RegraNegocioException("O novo limite não pode ser menor que o valor ainda comprometido");
        }
        atualizarCartao(cartao, request);
        return paraCartaoResponse(cartaoRepository.save(cartao), utilizado);
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
                ? compraRepository.findByCartaoContaPagamentoUsuarioIdOrderByDataCompraDescIdDesc(usuarioAtual.id())
                : compraRepository.findByCartaoIdAndCartaoContaPagamentoUsuarioIdOrderByDataCompraDescIdDesc(
                        cartaoId,
                        usuarioAtual.id()
                );
        return compras.stream().map(this::paraCompraResponse).toList();
    }

    @Transactional
    public CompraCartaoResponse criarCompra(CompraCartaoRequest request) {
        CompraCartao compra = new CompraCartao();
        atualizarCompra(compra, request);
        validarNaoAfetaFaturaPaga(compra);
        validarLimite(compra, null);
        return paraCompraResponse(compraRepository.save(compra));
    }

    @Transactional
    public CompraCartaoResponse atualizarCompra(Long id, CompraCartaoRequest request) {
        CompraCartao compra = buscarCompra(id);
        validarCompraEditavel(compra);
        atualizarCompra(compra, request);
        validarNaoAfetaFaturaPaga(compra);
        validarLimite(compra, id);
        return paraCompraResponse(compraRepository.save(compra));
    }

    @Transactional
    public void excluirCompra(Long id) {
        CompraCartao compra = buscarCompra(id);
        validarCompraEditavel(compra);
        compraRepository.delete(compra);
    }

    @Transactional(readOnly = true)
    public List<FaturaCartaoResponse> projetarFaturas(Long cartaoId, LocalDate mesReferencia, int meses) {
        if (meses < 1 || meses > 24) {
            throw new RegraNegocioException("A projeção deve conter entre 1 e 24 meses");
        }
        CartaoCredito cartao = buscarCartao(cartaoId);
        YearMonth inicio = YearMonth.from(mesReferencia);
        List<CompraCartao> compras = compraRepository
                .findByCartaoIdAndCartaoContaPagamentoUsuarioIdOrderByDataCompraDescIdDesc(
                        cartaoId,
                        usuarioAtual.id()
                );
        Map<YearMonth, PagamentoFatura> pagamentos = pagamentosPorMes(cartaoId);
        List<FaturaCartaoResponse> faturas = new ArrayList<>();
        for (int deslocamento = 0; deslocamento < meses; deslocamento++) {
            YearMonth competencia = inicio.plusMonths(deslocamento);
            List<ParcelaFaturaResponse> parcelas = parcelasDaFatura(cartao, compras, competencia);
            BigDecimal total = parcelas.stream().map(ParcelaFaturaResponse::valor).reduce(BigDecimal.ZERO, BigDecimal::add);
            PagamentoFatura pagamento = pagamentos.get(competencia);
            faturas.add(new FaturaCartaoResponse(
                    cartao.getId(),
                    cartao.getNome(),
                    competencia.atDay(1),
                    dataFechamentoDaFatura(competencia, cartao),
                    dataNoMes(competencia, cartao.getDiaVencimento()),
                    total,
                    parcelas,
                    pagamento != null,
                    pagamento == null ? null : pagamento.getDataPagamento()
            ));
        }
        return faturas;
    }

    @Transactional
    public FaturaCartaoResponse pagarFatura(Long cartaoId, LocalDate mesReferencia, PagamentoFaturaRequest request) {
        CartaoCredito cartao = buscarCartao(cartaoId);
        LocalDate mes = YearMonth.from(mesReferencia).atDay(1);
        if (pagamentoRepository.findByCartaoIdAndMesReferencia(cartaoId, mes).isPresent()) {
            throw new RegraNegocioException("Esta fatura já está paga");
        }
        if (Boolean.TRUE.equals(cartao.getContaPagamento().getArquivada())) {
            throw new RegraNegocioException("A conta de pagamento do cartão está arquivada");
        }
        if (request.dataPagamento().isAfter(LocalDate.now(clock))) {
            throw new RegraNegocioException("A data do pagamento não pode estar no futuro");
        }
        FaturaCartaoResponse fatura = projetarFaturas(cartaoId, mes, 1).getFirst();
        if (fatura.total().signum() <= 0) {
            throw new RegraNegocioException("Não há valor nesta fatura para pagar");
        }

        Transacao transacao = new Transacao();
        transacao.setDescricao("Pagamento da fatura · " + cartao.getNome());
        transacao.setValor(fatura.total());
        transacao.setData(request.dataPagamento());
        transacao.setTipo(TipoOperacao.DESPESA);
        transacao.setConta(cartao.getContaPagamento());
        transacao.setCategoria(null);
        transacao.setNatureza(NaturezaTransacao.PAGAMENTO_FATURA);
        transacao = transacaoRepository.save(transacao);

        PagamentoFatura pagamento = new PagamentoFatura();
        pagamento.setCartao(cartao);
        pagamento.setMesReferencia(mes);
        pagamento.setValorPago(fatura.total());
        pagamento.setDataPagamento(request.dataPagamento());
        pagamento.setTransacao(transacao);
        pagamentoRepository.save(pagamento);

        return new FaturaCartaoResponse(
                fatura.cartaoId(), fatura.cartaoNome(), fatura.mesReferencia(), fatura.dataFechamento(),
                fatura.dataVencimento(), fatura.total(), fatura.parcelas(), true, request.dataPagamento()
        );
    }

    @Transactional
    public void desfazerPagamento(Long cartaoId, LocalDate mesReferencia) {
        buscarCartao(cartaoId);
        LocalDate mes = YearMonth.from(mesReferencia).atDay(1);
        PagamentoFatura pagamento = pagamentoRepository.findByCartaoIdAndMesReferencia(cartaoId, mes)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pagamento da fatura não encontrado"));
        Transacao transacao = pagamento.getTransacao();
        pagamentoRepository.delete(pagamento);
        pagamentoRepository.flush();
        transacaoRepository.delete(transacao);
    }

    private void atualizarCartao(CartaoCredito cartao, CartaoCreditoRequest request) {
        Conta conta = contaRepository.findByIdAndUsuarioId(request.contaPagamentoId(), usuarioAtual.id())
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
        Categoria categoria = categoriaRepository.findByIdAndUsuarioId(request.categoriaId(), usuarioAtual.id())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Categoria não encontrada com o id " + request.categoriaId()));
        if (Boolean.TRUE.equals(cartao.getContaPagamento().getArquivada())) {
            throw new RegraNegocioException("Não é possível registrar compras em um cartão associado a uma conta arquivada");
        }
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
        Set<YearMonth> mesesPagos = pagamentosPorMes(compra.getCartao().getId()).keySet();
        BigDecimal utilizado = compraRepository
                .findByCartaoIdAndCartaoContaPagamentoUsuarioIdOrderByDataCompraDescIdDesc(
                        compra.getCartao().getId(),
                        usuarioAtual.id()
                ).stream()
                .filter(item -> compraAtualId == null || !item.getId().equals(compraAtualId))
                .flatMap(item -> parcelasDaCompra(item).stream())
                .filter(parcela -> !mesesPagos.contains(YearMonth.from(parcela.vencimento())))
                .map(ParcelaFaturaResponse::valor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (utilizado.add(compra.getValorTotal()).compareTo(compra.getCartao().getLimiteTotal()) > 0) {
            throw new RegraNegocioException("A compra ultrapassa o limite disponível do cartão");
        }
    }

    private BigDecimal calcularLimiteUtilizado(CartaoCredito cartao) {
        Set<YearMonth> mesesPagos = pagamentosPorMes(cartao.getId()).keySet();
        return compraRepository.findByCartaoIdAndCartaoContaPagamentoUsuarioIdOrderByDataCompraDescIdDesc(
                        cartao.getId(),
                        usuarioAtual.id()
                ).stream()
                .flatMap(compra -> parcelasDaCompra(compra).stream())
                .filter(parcela -> !mesesPagos.contains(YearMonth.from(parcela.vencimento())))
                .map(ParcelaFaturaResponse::valor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void validarCompraEditavel(CompraCartao compra) {
        Set<YearMonth> mesesPagos = pagamentosPorMes(compra.getCartao().getId()).keySet();
        boolean pertenceAFaturaPaga = parcelasDaCompra(compra).stream()
                .map(parcela -> YearMonth.from(parcela.vencimento()))
                .anyMatch(mesesPagos::contains);
        if (pertenceAFaturaPaga) {
            throw new RegraNegocioException("A compra compõe uma fatura paga e não pode ser alterada");
        }
    }

    private void validarNaoAfetaFaturaPaga(CompraCartao compra) {
        Set<YearMonth> mesesPagos = pagamentosPorMes(compra.getCartao().getId()).keySet();
        boolean afetaFaturaPaga = parcelasDaCompra(compra).stream()
                .map(parcela -> YearMonth.from(parcela.vencimento()))
                .anyMatch(mesesPagos::contains);
        if (afetaFaturaPaga) {
            throw new RegraNegocioException("A compra não pode ser incluída em uma fatura que já foi paga");
        }
    }

    private Map<YearMonth, PagamentoFatura> pagamentosPorMes(Long cartaoId) {
        return pagamentoRepository.findByCartaoId(cartaoId).stream()
                .collect(Collectors.toMap(item -> YearMonth.from(item.getMesReferencia()), Function.identity()));
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
        return cartaoRepository.findByIdAndContaPagamentoUsuarioId(id, usuarioAtual.id())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cartão não encontrado com o id " + id));
    }

    private CompraCartao buscarCompra(Long id) {
        return compraRepository.findByIdAndCartaoContaPagamentoUsuarioId(id, usuarioAtual.id())
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
                compra.getCartao().getId(), compra.getCartao().getNome(),
                compra.getCartao().getContaPagamento().getId(), compra.getCartao().getContaPagamento().getNome(),
                compra.getCategoria().getId(), compra.getCategoria().getNome()
        );
    }
}
