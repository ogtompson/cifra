package com.cifra.backend.service;

import com.cifra.backend.dto.TransacaoRecorrenteRequest;
import com.cifra.backend.dto.TransacaoRecorrenteResponse;
import com.cifra.backend.exception.RecursoNaoEncontradoException;
import com.cifra.backend.exception.RegraNegocioException;
import com.cifra.backend.model.Categoria;
import com.cifra.backend.model.Conta;
import com.cifra.backend.model.TransacaoRecorrente;
import com.cifra.backend.model.enums.Frequencia;
import com.cifra.backend.repository.CategoriaRepository;
import com.cifra.backend.repository.ContaRepository;
import com.cifra.backend.repository.TransacaoRecorrenteRepository;
import com.cifra.backend.repository.TransacaoRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TransacaoRecorrenteService {

    private final TransacaoRecorrenteRepository transacaoRecorrenteRepository;
    private final TransacaoRepository transacaoRepository;
    private final ContaRepository contaRepository;
    private final CategoriaRepository categoriaRepository;

    public TransacaoRecorrenteService(
            TransacaoRecorrenteRepository transacaoRecorrenteRepository,
            TransacaoRepository transacaoRepository,
            ContaRepository contaRepository,
            CategoriaRepository categoriaRepository
    ) {
        this.transacaoRecorrenteRepository = transacaoRecorrenteRepository;
        this.transacaoRepository = transacaoRepository;
        this.contaRepository = contaRepository;
        this.categoriaRepository = categoriaRepository;
    }

    @Transactional(readOnly = true)
    public List<TransacaoRecorrenteResponse> listar(Boolean ativa) {
        Sort ordem = Sort.by(Sort.Direction.ASC, "descricao")
                .and(Sort.by(Sort.Direction.ASC, "id"));
        List<TransacaoRecorrente> recorrencias = ativa == null
                ? transacaoRecorrenteRepository.findAll(ordem)
                : transacaoRecorrenteRepository.findByAtiva(ativa, ordem);

        return recorrencias.stream().map(this::paraResponse).toList();
    }

    @Transactional(readOnly = true)
    public TransacaoRecorrenteResponse buscarPorId(Long id) {
        return paraResponse(buscarEntidade(id));
    }

    @Transactional
    public TransacaoRecorrenteResponse criar(TransacaoRecorrenteRequest request) {
        TransacaoRecorrente recorrencia = new TransacaoRecorrente();
        atualizarDados(recorrencia, request);
        return paraResponse(transacaoRecorrenteRepository.save(recorrencia));
    }

    @Transactional
    public TransacaoRecorrenteResponse atualizar(
            Long id,
            TransacaoRecorrenteRequest request
    ) {
        TransacaoRecorrente recorrencia = buscarEntidade(id);
        atualizarDados(recorrencia, request);
        return paraResponse(transacaoRecorrenteRepository.save(recorrencia));
    }

    @Transactional
    public void excluir(Long id) {
        TransacaoRecorrente recorrencia = buscarEntidade(id);
        if (transacaoRepository.existsByRecorrenciaId(id)) {
            throw new RegraNegocioException(
                    "A recorrência não pode ser excluída porque possui transações geradas"
            );
        }
        transacaoRecorrenteRepository.delete(recorrencia);
    }

    private TransacaoRecorrente buscarEntidade(Long id) {
        return transacaoRecorrenteRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Recorrência não encontrada com o id " + id
                ));
    }

    private Conta buscarConta(Long id) {
        return contaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Conta não encontrada com o id " + id
                ));
    }

    private Categoria buscarCategoria(Long id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Categoria não encontrada com o id " + id
                ));
    }

    private void atualizarDados(
            TransacaoRecorrente recorrencia,
            TransacaoRecorrenteRequest request
    ) {
        validarDatas(request);
        validarDiaDoMes(request);
        Conta conta = buscarConta(request.contaId());
        Categoria categoria = buscarCategoria(request.categoriaId());

        if (categoria.getTipo() != request.tipo()) {
            throw new RegraNegocioException(
                    "O tipo da categoria deve ser igual ao tipo da recorrência"
            );
        }

        recorrencia.setDescricao(request.descricao().trim());
        recorrencia.setValor(request.valor());
        recorrencia.setTipo(request.tipo());
        recorrencia.setFrequencia(request.frequencia());
        recorrencia.setDiaDoMes(request.diaDoMes());
        recorrencia.setDataInicio(request.dataInicio());
        recorrencia.setDataFim(request.dataFim());
        recorrencia.setAtiva(request.ativa());
        recorrencia.setConta(conta);
        recorrencia.setCategoria(categoria);
    }

    private void validarDatas(TransacaoRecorrenteRequest request) {
        if (request.dataFim() != null && request.dataFim().isBefore(request.dataInicio())) {
            throw new RegraNegocioException(
                    "A data final não pode ser anterior à data inicial"
            );
        }
    }

    private void validarDiaDoMes(TransacaoRecorrenteRequest request) {
        if (request.frequencia() == Frequencia.MENSAL && request.diaDoMes() == null) {
            throw new RegraNegocioException(
                    "O dia do mês é obrigatório para recorrências mensais"
            );
        }
        if (request.frequencia() != Frequencia.MENSAL && request.diaDoMes() != null) {
            throw new RegraNegocioException(
                    "O dia do mês deve ser informado apenas para recorrências mensais"
            );
        }
    }

    private TransacaoRecorrenteResponse paraResponse(TransacaoRecorrente recorrencia) {
        return new TransacaoRecorrenteResponse(
                recorrencia.getId(),
                recorrencia.getDescricao(),
                recorrencia.getValor(),
                recorrencia.getTipo(),
                recorrencia.getFrequencia(),
                recorrencia.getDiaDoMes(),
                recorrencia.getDataInicio(),
                recorrencia.getDataFim(),
                recorrencia.isAtiva(),
                recorrencia.getConta().getId(),
                recorrencia.getConta().getNome(),
                recorrencia.getCategoria().getId(),
                recorrencia.getCategoria().getNome()
        );
    }
}
