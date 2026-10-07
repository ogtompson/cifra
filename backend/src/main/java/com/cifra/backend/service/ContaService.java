package com.cifra.backend.service;

import com.cifra.backend.dto.ContaRequest;
import com.cifra.backend.dto.ContaResponse;
import com.cifra.backend.dto.ExclusaoContaResponse;
import com.cifra.backend.dto.ArquivamentoContaRequest;
import com.cifra.backend.dto.SaldoContaResponse;
import com.cifra.backend.exception.RegraNegocioException;
import com.cifra.backend.exception.RecursoNaoEncontradoException;
import com.cifra.backend.model.Conta;
import com.cifra.backend.model.enums.TipoOperacao;
import com.cifra.backend.repository.ContaRepository;
import com.cifra.backend.repository.TransacaoRepository;
import com.cifra.backend.repository.TransacaoRecorrenteRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ContaService {

    private final ContaRepository contaRepository;
    private final TransacaoRepository transacaoRepository;
    private final TransacaoRecorrenteRepository transacaoRecorrenteRepository;

    public ContaService(
            ContaRepository contaRepository,
            TransacaoRepository transacaoRepository,
            TransacaoRecorrenteRepository transacaoRecorrenteRepository
    ) {
        this.contaRepository = contaRepository;
        this.transacaoRepository = transacaoRepository;
        this.transacaoRecorrenteRepository = transacaoRecorrenteRepository;
    }

    @Transactional(readOnly = true)
    public List<ContaResponse> listar(boolean incluirArquivadas) {
        Sort ordenacao = Sort.by(Sort.Direction.ASC, "nome");
        List<Conta> contas = incluirArquivadas
                ? contaRepository.findAll(ordenacao)
                : contaRepository.findByArquivadaFalseOrArquivadaIsNull(ordenacao);
        return contas
                .stream()
                .map(this::paraResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ContaResponse buscarPorId(Long id) {
        return paraResponse(buscarEntidade(id));
    }

    @Transactional(readOnly = true)
    public SaldoContaResponse calcularSaldo(Long id) {
        Conta conta = buscarEntidade(id);
        BigDecimal totalReceitas = valorOuZero(
                transacaoRepository.somarValorPorContaETipo(id, TipoOperacao.RECEITA)
        );
        BigDecimal totalDespesas = valorOuZero(
                transacaoRepository.somarValorPorContaETipo(id, TipoOperacao.DESPESA)
        );
        BigDecimal saldoAtual = conta.getSaldoInicial()
                .add(totalReceitas)
                .subtract(totalDespesas);

        return new SaldoContaResponse(
                conta.getId(), conta.getNome(), conta.getSaldoInicial(),
                totalReceitas, totalDespesas, saldoAtual
        );
    }

    @Transactional
    public ContaResponse criar(ContaRequest request) {
        Conta conta = new Conta();
        atualizarDados(conta, request);
        return paraResponse(contaRepository.save(conta));
    }

    @Transactional
    public ContaResponse atualizar(Long id, ContaRequest request) {
        Conta conta = buscarEntidade(id);
        atualizarDados(conta, request);
        return paraResponse(contaRepository.save(conta));
    }

    @Transactional
    public ContaResponse alterarArquivamento(Long id, ArquivamentoContaRequest request) {
        Conta conta = buscarEntidade(id);
        conta.setArquivada(request.arquivada());
        return paraResponse(contaRepository.save(conta));
    }

    @Transactional(readOnly = true)
    public ExclusaoContaResponse consultarExclusao(Long id) {
        Conta conta = buscarEntidade(id);
        long totalTransacoes = transacaoRepository.countByContaId(id);
        long totalRecorrencias = transacaoRecorrenteRepository.countByContaId(id);

        return new ExclusaoContaResponse(
                conta.getId(),
                conta.getNome(),
                totalTransacoes,
                totalRecorrencias,
                totalTransacoes == 0 && totalRecorrencias == 0
        );
    }

    @Transactional
    public void excluir(Long id, boolean excluirDependencias) {
        Conta conta = buscarEntidade(id);
        long totalTransacoes = transacaoRepository.countByContaId(id);
        long totalRecorrencias = transacaoRecorrenteRepository.countByContaId(id);

        if (!excluirDependencias && (totalTransacoes > 0 || totalRecorrencias > 0)) {
            throw new RegraNegocioException(
                    "A conta possui " + totalTransacoes + " transa\u00e7\u00e3o(\u00f5es) e "
                            + totalRecorrencias + " recorr\u00eancia(s). Confirme a exclus\u00e3o do hist\u00f3rico vinculado."
            );
        }

        if (excluirDependencias) {
            transacaoRepository.deleteByContaId(id);
            transacaoRecorrenteRepository.deleteByContaId(id);
        }

        contaRepository.delete(conta);
    }

    private Conta buscarEntidade(Long id) {
        return contaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Conta não encontrada com o id " + id
                ));
    }

    private void atualizarDados(Conta conta, ContaRequest request) {
        conta.setNome(request.nome().trim());
        conta.setSaldoInicial(request.saldoInicial());
        conta.setTipo(request.tipo());
    }

    private ContaResponse paraResponse(Conta conta) {
        return new ContaResponse(
                conta.getId(),
                conta.getNome(),
                conta.getSaldoInicial(),
                conta.getTipo(),
                Boolean.TRUE.equals(conta.getArquivada())
        );
    }

    private BigDecimal valorOuZero(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }
}
