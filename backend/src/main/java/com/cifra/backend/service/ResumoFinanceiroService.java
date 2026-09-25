package com.cifra.backend.service;

import com.cifra.backend.dto.DespesaPorCategoriaResponse;
import com.cifra.backend.dto.ResumoFinanceiroResponse;
import com.cifra.backend.exception.RegraNegocioException;
import com.cifra.backend.model.enums.TipoOperacao;
import com.cifra.backend.repository.ContaRepository;
import com.cifra.backend.repository.TransacaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class ResumoFinanceiroService {

    private final ContaRepository contaRepository;
    private final TransacaoRepository transacaoRepository;

    public ResumoFinanceiroService(
            ContaRepository contaRepository,
            TransacaoRepository transacaoRepository
    ) {
        this.contaRepository = contaRepository;
        this.transacaoRepository = transacaoRepository;
    }

    @Transactional(readOnly = true)
    public ResumoFinanceiroResponse gerar(LocalDate dataInicio, LocalDate dataFim) {
        validarPeriodo(dataInicio, dataFim);

        BigDecimal totalReceitas = valorOuZero(transacaoRepository.somarValorPorTipoEPeriodo(
                TipoOperacao.RECEITA, dataInicio, dataFim
        ));
        BigDecimal totalDespesas = valorOuZero(transacaoRepository.somarValorPorTipoEPeriodo(
                TipoOperacao.DESPESA, dataInicio, dataFim
        ));
        BigDecimal receitasAteFim = valorOuZero(transacaoRepository.somarValorPorTipoAte(
                TipoOperacao.RECEITA, dataFim
        ));
        BigDecimal despesasAteFim = valorOuZero(transacaoRepository.somarValorPorTipoAte(
                TipoOperacao.DESPESA, dataFim
        ));
        BigDecimal saldoTotal = valorOuZero(contaRepository.somarSaldosIniciais())
                .add(receitasAteFim)
                .subtract(despesasAteFim);
        List<DespesaPorCategoriaResponse> despesasPorCategoria = transacaoRepository
                .somarPorCategoriaETipoEPeriodo(TipoOperacao.DESPESA, dataInicio, dataFim)
                .stream()
                .map(total -> new DespesaPorCategoriaResponse(
                        total.getCategoriaId(), total.getCategoriaNome(), total.getTotal()
                ))
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
