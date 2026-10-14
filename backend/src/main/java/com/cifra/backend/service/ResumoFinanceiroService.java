package com.cifra.backend.service;

import com.cifra.backend.dto.DespesaPorCategoriaResponse;
import com.cifra.backend.dto.ResumoFinanceiroResponse;
import com.cifra.backend.exception.RegraNegocioException;
import com.cifra.backend.model.enums.TipoOperacao;
import com.cifra.backend.repository.ContaRepository;
import com.cifra.backend.repository.TransacaoRepository;
import com.cifra.backend.repository.CompraCartaoRepository;
import com.cifra.backend.repository.TotalPorCategoria;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class ResumoFinanceiroService {

    private final ContaRepository contaRepository;
    private final TransacaoRepository transacaoRepository;
    private final CompraCartaoRepository compraCartaoRepository;

    public ResumoFinanceiroService(
            ContaRepository contaRepository,
            TransacaoRepository transacaoRepository,
            CompraCartaoRepository compraCartaoRepository
    ) {
        this.contaRepository = contaRepository;
        this.transacaoRepository = transacaoRepository;
        this.compraCartaoRepository = compraCartaoRepository;
    }

    @Transactional(readOnly = true)
    public ResumoFinanceiroResponse gerar(LocalDate dataInicio, LocalDate dataFim) {
        validarPeriodo(dataInicio, dataFim);

        BigDecimal totalReceitas = valorOuZero(transacaoRepository.somarValorPorTipoEPeriodo(
                TipoOperacao.RECEITA, dataInicio, dataFim
        ));
        BigDecimal totalDespesas = valorOuZero(transacaoRepository.somarValorPorTipoEPeriodo(
                TipoOperacao.DESPESA, dataInicio, dataFim
        )).add(valorOuZero(compraCartaoRepository.somarValorPorPeriodo(dataInicio, dataFim)));
        BigDecimal receitasAteFim = valorOuZero(transacaoRepository.somarValorPorTipoAteEmContasAtivas(
                TipoOperacao.RECEITA, dataFim
        ));
        BigDecimal despesasAteFim = valorOuZero(transacaoRepository.somarValorPorTipoAteEmContasAtivas(
                TipoOperacao.DESPESA, dataFim
        ));
        BigDecimal saldoTotal = valorOuZero(contaRepository.somarSaldosIniciaisAtivas())
                .add(receitasAteFim)
                .subtract(despesasAteFim);
        Map<Long, DespesaPorCategoriaResponse> despesasAgrupadas = new LinkedHashMap<>();
        List<TotalPorCategoria> totaisPorCategoria = new java.util.ArrayList<>(transacaoRepository
                .somarPorCategoriaETipoEPeriodo(TipoOperacao.DESPESA, dataInicio, dataFim));
        totaisPorCategoria.addAll(compraCartaoRepository.somarPorCategoriaEPeriodo(dataInicio, dataFim));
        totaisPorCategoria.forEach(total -> despesasAgrupadas.merge(
                total.getCategoriaId(),
                new DespesaPorCategoriaResponse(total.getCategoriaId(), total.getCategoriaNome(), total.getTotal()),
                (atual, novo) -> new DespesaPorCategoriaResponse(atual.categoriaId(), atual.categoriaNome(), atual.total().add(novo.total()))
        ));
        List<DespesaPorCategoriaResponse> despesasPorCategoria = despesasAgrupadas.values().stream()
                .sorted((a, b) -> b.total().compareTo(a.total()))
                .toList();

        return new ResumoFinanceiroResponse(
                dataInicio,
                dataFim,
                saldoTotal,
                totalReceitas,
                totalDespesas,
                totalReceitas.subtract(totalDespesas),
                despesasPorCategoria
        );
    }

    private void validarPeriodo(LocalDate dataInicio, LocalDate dataFim) {
        if (dataInicio.isAfter(dataFim)) {
            throw new RegraNegocioException("A data inicial não pode ser posterior à data final");
        }
    }

    private BigDecimal valorOuZero(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }
}
