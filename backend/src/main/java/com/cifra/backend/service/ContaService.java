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
import com.cifra.backend.repository.CartaoCreditoRepository;
import com.cifra.backend.repository.TransacaoRepository;
import com.cifra.backend.repository.TransacaoRecorrenteRepository;
import com.cifra.backend.repository.UsuarioRepository;
import com.cifra.backend.security.UsuarioAtual;
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
    private final CartaoCreditoRepository cartaoCreditoRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioAtual usuarioAtual;

    public ContaService(
            ContaRepository contaRepository,
            TransacaoRepository transacaoRepository,
            TransacaoRecorrenteRepository transacaoRecorrenteRepository,
            CartaoCreditoRepository cartaoCreditoRepository,
            UsuarioRepository usuarioRepository,
            UsuarioAtual usuarioAtual
    ) {
        this.contaRepository = contaRepository;
        this.transacaoRepository = transacaoRepository;
        this.transacaoRecorrenteRepository = transacaoRecorrenteRepository;
        this.cartaoCreditoRepository = cartaoCreditoRepository;
        this.usuarioRepository = usuarioRepository;
        this.usuarioAtual = usuarioAtual;
    }

    @Transactional(readOnly = true)
    public List<ContaResponse> listar(boolean incluirArquivadas) {
        Sort ordenacao = Sort.by(Sort.Direction.ASC, "nome");
        List<Conta> contas = incluirArquivadas
                ? contaRepository.findByUsuarioId(usuarioAtual.id(), ordenacao)
                : contaRepository.findAtivasByUsuarioId(usuarioAtual.id(), ordenacao);
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
        conta.setUsuario(usuarioRepository.getReferenceById(usuarioAtual.id()));
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
        if (request.arquivada()) {
            long recorrenciasAtivas = transacaoRecorrenteRepository.countByContaIdAndAtivaTrue(id);
            long cartoesVinculados = cartaoCreditoRepository.countByContaPagamentoId(id);
            if (recorrenciasAtivas > 0 || cartoesVinculados > 0) {
                throw new RegraNegocioException(
                        "Pause as recorrências ativas e reassocie os cartões antes de arquivar esta conta"
                );
            }
        }
        conta.setArquivada(request.arquivada());
        return paraResponse(contaRepository.save(conta));
    }

    @Transactional(readOnly = true)
    public ExclusaoContaResponse consultarExclusao(Long id) {
        Conta conta = buscarEntidade(id);
        long totalTransacoes = transacaoRepository.countByContaId(id);
        long totalRecorrencias = transacaoRecorrenteRepository.countByContaId(id);
        long totalCartoes = cartaoCreditoRepository.countByContaPagamentoId(id);

        return new ExclusaoContaResponse(
                conta.getId(),
                conta.getNome(),
                totalTransacoes,
                totalRecorrencias,
                totalCartoes,
                totalTransacoes == 0 && totalRecorrencias == 0 && totalCartoes == 0
        );
    }

    @Transactional
    public void excluir(Long id, boolean excluirDependencias) {
        Conta conta = buscarEntidade(id);
        long totalTransacoes = transacaoRepository.countByContaId(id);
        long totalRecorrencias = transacaoRecorrenteRepository.countByContaId(id);
        long totalCartoes = cartaoCreditoRepository.countByContaPagamentoId(id);

        if (totalCartoes > 0) {
            throw new RegraNegocioException(
                    "A conta é usada para pagar " + totalCartoes + " cartão(ões). Reassocie ou exclua os cartões antes de remover a conta."
            );
        }

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
        return contaRepository.findByIdAndUsuarioId(id, usuarioAtual.id())
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
