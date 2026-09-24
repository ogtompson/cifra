package com.cifra.backend.service;

import com.cifra.backend.dto.TransacaoRequest;
import com.cifra.backend.dto.TransacaoResponse;
import com.cifra.backend.exception.RecursoNaoEncontradoException;
import com.cifra.backend.exception.RegraNegocioException;
import com.cifra.backend.model.Categoria;
import com.cifra.backend.model.Conta;
import com.cifra.backend.model.Transacao;
import com.cifra.backend.repository.CategoriaRepository;
import com.cifra.backend.repository.ContaRepository;
import com.cifra.backend.repository.TransacaoRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TransacaoService {

    private final TransacaoRepository transacaoRepository;
    private final ContaRepository contaRepository;
    private final CategoriaRepository categoriaRepository;

    public TransacaoService(
            TransacaoRepository transacaoRepository,
            ContaRepository contaRepository,
            CategoriaRepository categoriaRepository
    ) {
        this.transacaoRepository = transacaoRepository;
        this.contaRepository = contaRepository;
        this.categoriaRepository = categoriaRepository;
    }

    @Transactional(readOnly = true)
    public List<TransacaoResponse> listar(Long contaId) {
        List<Transacao> transacoes;
        if (contaId == null) {
            Sort ordem = Sort.by(Sort.Direction.DESC, "data")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            transacoes = transacaoRepository.findAll(ordem);
        } else {
            validarContaExistente(contaId);
            transacoes = transacaoRepository.findByContaIdOrderByDataDescIdDesc(contaId);
        }

        return transacoes.stream().map(this::paraResponse).toList();
    }

    @Transactional(readOnly = true)
    public TransacaoResponse buscarPorId(Long id) {
        return paraResponse(buscarEntidade(id));
    }

    @Transactional
    public TransacaoResponse criar(TransacaoRequest request) {
        Transacao transacao = new Transacao();
        atualizarDados(transacao, request);
        return paraResponse(transacaoRepository.save(transacao));
    }

    @Transactional
    public TransacaoResponse atualizar(Long id, TransacaoRequest request) {
        Transacao transacao = buscarEntidade(id);
        atualizarDados(transacao, request);
        return paraResponse(transacaoRepository.save(transacao));
    }

    @Transactional
    public void excluir(Long id) {
        transacaoRepository.delete(buscarEntidade(id));
    }

    private Transacao buscarEntidade(Long id) {
        return transacaoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Transação não encontrada com o id " + id
                ));
    }

    private Conta buscarConta(Long id) {
        return contaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Conta não encontrada com o id " + id
                ));
    }

    private void validarContaExistente(Long id) {
        if (!contaRepository.existsById(id)) {
            throw new RecursoNaoEncontradoException("Conta não encontrada com o id " + id);
        }
    }

    private Categoria buscarCategoria(Long id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Categoria não encontrada com o id " + id
                ));
    }

    private void atualizarDados(Transacao transacao, TransacaoRequest request) {
        Conta conta = buscarConta(request.contaId());
        Categoria categoria = buscarCategoria(request.categoriaId());

        if (categoria.getTipo() != request.tipo()) {
            throw new RegraNegocioException(
                    "O tipo da categoria deve ser igual ao tipo da transação"
            );
        }

        transacao.setDescricao(request.descricao().trim());
        transacao.setValor(request.valor());
        transacao.setData(request.data());
        transacao.setTipo(request.tipo());
        transacao.setConta(conta);
        transacao.setCategoria(categoria);
    }

    private TransacaoResponse paraResponse(Transacao transacao) {
        Long recorrenciaId = transacao.getRecorrencia() == null
                ? null
                : transacao.getRecorrencia().getId();

        return new TransacaoResponse(
                transacao.getId(),
                transacao.getDescricao(),
                transacao.getValor(),
                transacao.getData(),
                transacao.getTipo(),
                transacao.getConta().getId(),
                transacao.getConta().getNome(),
                transacao.getCategoria().getId(),
                transacao.getCategoria().getNome(),
                recorrenciaId
        );
    }
}
