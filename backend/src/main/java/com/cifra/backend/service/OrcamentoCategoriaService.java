package com.cifra.backend.service;

import com.cifra.backend.dto.OrcamentoCategoriaRequest;
import com.cifra.backend.dto.OrcamentoCategoriaResponse;
import com.cifra.backend.exception.RecursoNaoEncontradoException;
import com.cifra.backend.exception.RegraNegocioException;
import com.cifra.backend.model.Categoria;
import com.cifra.backend.model.OrcamentoCategoria;
import com.cifra.backend.model.enums.TipoOperacao;
import com.cifra.backend.repository.CategoriaRepository;
import com.cifra.backend.repository.OrcamentoCategoriaRepository;
import com.cifra.backend.repository.TransacaoRepository;
import com.cifra.backend.repository.CompraCartaoRepository;
import com.cifra.backend.security.UsuarioAtual;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Map;

import java.util.List;

@Service
public class OrcamentoCategoriaService {

    private static final BigDecimal CEM = new BigDecimal("100");
    private static final BigDecimal LIMITE_ATENCAO = new BigDecimal("80");

    private final OrcamentoCategoriaRepository orcamentoRepository;
    private final CategoriaRepository categoriaRepository;
    private final TransacaoRepository transacaoRepository;
    private final CompraCartaoRepository compraCartaoRepository;
    private final UsuarioAtual usuarioAtual;

    public OrcamentoCategoriaService(
            OrcamentoCategoriaRepository orcamentoRepository,
            CategoriaRepository categoriaRepository,
            TransacaoRepository transacaoRepository,
            CompraCartaoRepository compraCartaoRepository,
            UsuarioAtual usuarioAtual
    ) {
        this.orcamentoRepository = orcamentoRepository;
        this.categoriaRepository = categoriaRepository;
        this.transacaoRepository = transacaoRepository;
        this.compraCartaoRepository = compraCartaoRepository;
        this.usuarioAtual = usuarioAtual;
    }

    @Transactional(readOnly = true)
    public List<OrcamentoCategoriaResponse> listar(LocalDate mesReferencia) {
        LocalDate mes = normalizarMes(mesReferencia);
        Map<Long, BigDecimal> gastos = gastosPorCategoria(mes);

        return orcamentoRepository.findByCategoriaUsuarioIdAndMesReferenciaOrderByCategoriaNomeAsc(
                        usuarioAtual.id(),
                        mes
                )
                .stream()
                .map(orcamento -> paraResponse(
                        orcamento,
                        gastos.getOrDefault(orcamento.getCategoria().getId(), BigDecimal.ZERO)
                ))
                .toList();
    }

    @Transactional
    public OrcamentoCategoriaResponse criar(OrcamentoCategoriaRequest request) {
        Categoria categoria = buscarCategoriaDeDespesa(request.categoriaId());
        LocalDate mes = normalizarMes(request.mesReferencia());
        validarDuplicidade(null, categoria.getId(), mes);

        OrcamentoCategoria orcamento = new OrcamentoCategoria();
        orcamento.setCategoria(categoria);
        orcamento.setMesReferencia(mes);
        orcamento.setValorLimite(request.valorLimite());
        return paraResponse(orcamentoRepository.save(orcamento), gastoDaCategoria(categoria.getId(), mes));
    }

    @Transactional
    public OrcamentoCategoriaResponse atualizar(Long id, OrcamentoCategoriaRequest request) {
        OrcamentoCategoria orcamento = buscarEntidade(id);
        Categoria categoria = buscarCategoriaDeDespesa(request.categoriaId());
        LocalDate mes = normalizarMes(request.mesReferencia());
        validarDuplicidade(id, categoria.getId(), mes);

        orcamento.setCategoria(categoria);
        orcamento.setMesReferencia(mes);
        orcamento.setValorLimite(request.valorLimite());
        return paraResponse(orcamentoRepository.save(orcamento), gastoDaCategoria(categoria.getId(), mes));
    }

    @Transactional
    public void excluir(Long id) {
        orcamentoRepository.delete(buscarEntidade(id));
    }

    private Categoria buscarCategoriaDeDespesa(Long id) {
        Categoria categoria = categoriaRepository.findByIdAndUsuarioId(id, usuarioAtual.id())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Categoria não encontrada com o id " + id));
        if (categoria.getTipo() != TipoOperacao.DESPESA) {
            throw new RegraNegocioException("Orçamentos só podem ser definidos para categorias de despesa");
        }
        return categoria;
    }

    private OrcamentoCategoria buscarEntidade(Long id) {
        return orcamentoRepository.findByIdAndCategoriaUsuarioId(id, usuarioAtual.id())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Orçamento não encontrado com o id " + id));
    }

    private void validarDuplicidade(Long idAtual, Long categoriaId, LocalDate mes) {
        orcamentoRepository.findByCategoriaIdAndMesReferencia(categoriaId, mes)
                .filter(existente -> !existente.getId().equals(idAtual))
                .ifPresent(existente -> { throw new RegraNegocioException("Esta categoria já possui orçamento no mês informado"); });
    }

    private BigDecimal gastoDaCategoria(Long categoriaId, LocalDate mes) {
        return gastosPorCategoria(mes).getOrDefault(categoriaId, BigDecimal.ZERO);
    }

    private Map<Long, BigDecimal> gastosPorCategoria(LocalDate mes) {
        LocalDate fim = mes.withDayOfMonth(mes.lengthOfMonth());
        Map<Long, BigDecimal> gastos = new java.util.HashMap<>();
        transacaoRepository.somarPorCategoriaETipoEPeriodo(usuarioAtual.id(), TipoOperacao.DESPESA, mes, fim)
                .forEach(total -> gastos.merge(total.getCategoriaId(), total.getTotal(), BigDecimal::add));
        compraCartaoRepository.somarPorCategoriaEPeriodo(usuarioAtual.id(), mes, fim)
                .forEach(total -> gastos.merge(total.getCategoriaId(), total.getTotal(), BigDecimal::add));
        return gastos;
    }

    private LocalDate normalizarMes(LocalDate data) {
        return data.withDayOfMonth(1);
    }

    private OrcamentoCategoriaResponse paraResponse(OrcamentoCategoria orcamento, BigDecimal gasto) {
        BigDecimal limite = orcamento.getValorLimite();
        BigDecimal percentual = limite.signum() == 0
                ? BigDecimal.ZERO
                : gasto.multiply(CEM).divide(limite, 1, RoundingMode.HALF_UP);
        String status = percentual.compareTo(CEM) >= 0
                ? "ESTOURADO"
                : percentual.compareTo(LIMITE_ATENCAO) >= 0 ? "ATENCAO" : "DENTRO_DO_LIMITE";

        return new OrcamentoCategoriaResponse(
                orcamento.getId(),
                orcamento.getCategoria().getId(),
                orcamento.getCategoria().getNome(),
                orcamento.getMesReferencia(),
                limite,
                gasto,
                limite.subtract(gasto),
                percentual,
                status
        );
    }
}
