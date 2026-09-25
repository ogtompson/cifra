package com.cifra.backend.service;

import com.cifra.backend.model.Transacao;
import com.cifra.backend.model.TransacaoRecorrente;
import com.cifra.backend.repository.TransacaoRecorrenteRepository;
import com.cifra.backend.repository.TransacaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
public class GeracaoRecorrenciasService {

    private final TransacaoRecorrenteRepository transacaoRecorrenteRepository;
    private final TransacaoRepository transacaoRepository;

    public GeracaoRecorrenciasService(
            TransacaoRecorrenteRepository transacaoRecorrenteRepository,
            TransacaoRepository transacaoRepository
    ) {
        this.transacaoRecorrenteRepository = transacaoRecorrenteRepository;
        this.transacaoRepository = transacaoRepository;
    }

    @Transactional
    public int gerarPendentesAte(LocalDate dataLimite) {
        int totalGerado = 0;
        for (TransacaoRecorrente recorrencia : transacaoRecorrenteRepository.findByAtivaTrue()) {
            for (LocalDate data : calcularDatasPendentes(recorrencia, dataLimite)) {
                if (!transacaoRepository.existsByRecorrenciaIdAndData(
                        recorrencia.getId(), data
                )) {
                    transacaoRepository.save(criarTransacao(recorrencia, data));
                    totalGerado++;
                }
            }
        }
        return totalGerado;
    }

    List<LocalDate> calcularDatasPendentes(
            TransacaoRecorrente recorrencia,
            LocalDate dataLimite
    ) {
        LocalDate limiteEfetivo = recorrencia.getDataFim() == null
                || recorrencia.getDataFim().isAfter(dataLimite)
                ? dataLimite
                : recorrencia.getDataFim();

        if (recorrencia.getDataInicio().isAfter(limiteEfetivo)) {
            return List.of();
        }

        return switch (recorrencia.getFrequencia()) {
            case SEMANAL -> calcularSemanais(recorrencia.getDataInicio(), limiteEfetivo);
            case MENSAL -> calcularMensais(recorrencia, limiteEfetivo);
            case ANUAL -> calcularAnuais(recorrencia.getDataInicio(), limiteEfetivo);
        };
    }

    private List<LocalDate> calcularSemanais(LocalDate inicio, LocalDate limite) {
        List<LocalDate> datas = new ArrayList<>();
        for (LocalDate data = inicio; !data.isAfter(limite); data = data.plusWeeks(1)) {
            datas.add(data);
        }
        return datas;
    }

    private List<LocalDate> calcularMensais(
            TransacaoRecorrente recorrencia,
            LocalDate limite
    ) {
        List<LocalDate> datas = new ArrayList<>();
        YearMonth mes = YearMonth.from(recorrencia.getDataInicio());
        LocalDate data = diaValidoNoMes(mes, recorrencia.getDiaDoMes());
        if (data.isBefore(recorrencia.getDataInicio())) {
            mes = mes.plusMonths(1);
            data = diaValidoNoMes(mes, recorrencia.getDiaDoMes());
        }

        while (!data.isAfter(limite)) {
            datas.add(data);
            mes = mes.plusMonths(1);
            data = diaValidoNoMes(mes, recorrencia.getDiaDoMes());
        }
        return datas;
    }

    private List<LocalDate> calcularAnuais(LocalDate inicio, LocalDate limite) {
        List<LocalDate> datas = new ArrayList<>();
        for (int ano = inicio.getYear(); ano <= limite.getYear(); ano++) {
            YearMonth mes = YearMonth.of(ano, inicio.getMonth());
            LocalDate data = diaValidoNoMes(mes, inicio.getDayOfMonth());
            if (!data.isBefore(inicio) && !data.isAfter(limite)) {
                datas.add(data);
            }
        }
        return datas;
    }

    private LocalDate diaValidoNoMes(YearMonth mes, int diaDesejado) {
        return mes.atDay(Math.min(diaDesejado, mes.lengthOfMonth()));
    }

    private Transacao criarTransacao(
            TransacaoRecorrente recorrencia,
            LocalDate data
    ) {
        Transacao transacao = new Transacao();
        transacao.setDescricao(recorrencia.getDescricao());
        transacao.setValor(recorrencia.getValor());
        transacao.setData(data);
        transacao.setTipo(recorrencia.getTipo());
        transacao.setConta(recorrencia.getConta());
        transacao.setCategoria(recorrencia.getCategoria());
        transacao.setRecorrencia(recorrencia);
        return transacao;
    }
}
