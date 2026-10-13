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
import com.cifra.backend.repository.TotalPorCategoria;
import com.cifra.backend.repository.TransacaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import java.util.List;

@Service
public class OrcamentoCategoriaService {

    private static final BigDecimal CEM = new BigDecimal("100");
    private static final BigDecimal LIMITE_ATENCAO = new BigDecimal("80");

    private final OrcamentoCategoriaRepository orcamentoRepository;
    private final CategoriaRepository categoriaRepository;
    private final TransacaoRepository transacaoRepository;

    public OrcamentoCategoriaService(
            OrcamentoCategoriaRepository orcamentoRepository,
            CategoriaRepository categoriaRepository,
            TransacaoRepository transacaoRepository
    ) {
        this.orcamentoRepository = orcamentoRepository;
        this.categoriaRepository = categoriaRepository;
        this.transacaoRepository = transacaoRepository;
    }

    @Transactional(readOnly = true)
    public List<OrcamentoCategoriaResponse> listar(LocalDate mesReferencia) {
        LocalDate mes = normalizarMes(mesReferencia);
        Map<Long, TotalPorCategoria> gastos = transacaoRepository
                .somarPorCategoriaETipoEPeriodo(TipoOperacao.DESPESA, mes, mes.withDayOfMonth(mes.lengthOfMonth()))
                .stream()
                .collect(Collectors.toMap(TotalPorCategoria::getCategoriaId, Function.identity()));

        return orcamentoRepository.findByMesReferenciaOrderByCategoriaNomeAsc(mes)
                .stream()
                .map(orcamento -> paraResponse(
                        orcamento,
                        gastos.containsKey(orcamento.getCategoria().getId())
                                ? gastos.get(orcamento.getCategoria().getId()).getTotal()
                                : BigDecimal.ZERO
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
        return paraResponse(orcamentoRepository.save(orcamento), BigDecimal.ZERO);
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
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Categoria não encontrada com o id " + id));
        if (categoria.getTipo() != TipoOperacao.DESPESA) {
            throw new RegraNegocioException("Orçamentos só podem ser definidos para categorias de despesa");
        }
        return categoria;
    }

    private OrcamentoCategoria buscarEntidade(Long id) {
        return orcamentoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Orçamento não encontrado com o id " + id));
    }

    private void validarDuplicidade(Long idAtual, Long categoriaId, LocalDate mes) {
        orcamentoRepository.findByCategoriaIdAndMesReferencia(categoriaId, mes)
                .filter(existente -> !existente.getId().equals(idAtual))
                .ifPresent(existente -> { throw new RegraNegocioException("Esta categoria já possui orçamento no mês informado"); });
    }

    private BigDecimal gastoDaCategoria(Long categoriaId, LocalDate mes) {
        return transacaoRepository
                .somarPorCategoriaETipoEPeriodo(TipoOperacao.DESPESA, mes, mes.withDayOfMonth(mes.lengthOfMonth()))
                .stream()
                .filter(total -> total.getCategoriaId().equals(categoriaId))
                .map(TotalPorCategoria::getTotal)
                .findFirst()
                .orElse(BigDecimal.ZERO);
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
