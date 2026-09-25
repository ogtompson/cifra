package com.cifra.backend.service;

import com.cifra.backend.dto.ContaRequest;
import com.cifra.backend.dto.ContaResponse;
import com.cifra.backend.dto.SaldoContaResponse;
import com.cifra.backend.exception.RecursoNaoEncontradoException;
import com.cifra.backend.model.Conta;
import com.cifra.backend.model.enums.TipoOperacao;
import com.cifra.backend.repository.ContaRepository;
import com.cifra.backend.repository.TransacaoRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ContaService {

    private final ContaRepository contaRepository;
    private final TransacaoRepository transacaoRepository;

    public ContaService(ContaRepository contaRepository, TransacaoRepository transacaoRepository) {
        this.contaRepository = contaRepository;
        this.transacaoRepository = transacaoRepository;
    }

    @Transactional(readOnly = true)
    public List<ContaResponse> listar() {
        return contaRepository.findAll(Sort.by(Sort.Direction.ASC, "nome"))
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
    public void excluir(Long id) {
        contaRepository.delete(buscarEntidade(id));
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
                conta.getTipo()
        );
    }

    private BigDecimal valorOuZero(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }
}
