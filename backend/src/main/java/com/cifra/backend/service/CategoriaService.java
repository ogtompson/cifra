package com.cifra.backend.service;

import com.cifra.backend.dto.CategoriaRequest;
import com.cifra.backend.dto.CategoriaResponse;
import com.cifra.backend.exception.RecursoNaoEncontradoException;
import com.cifra.backend.exception.RegraNegocioException;
import com.cifra.backend.model.Categoria;
import com.cifra.backend.repository.CategoriaRepository;
import com.cifra.backend.repository.OrcamentoCategoriaRepository;
import com.cifra.backend.repository.CompraCartaoRepository;
import com.cifra.backend.repository.TransacaoRecorrenteRepository;
import com.cifra.backend.repository.TransacaoRepository;
import com.cifra.backend.repository.UsuarioRepository;
import com.cifra.backend.security.UsuarioAtual;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final OrcamentoCategoriaRepository orcamentoRepository;
    private final CompraCartaoRepository compraCartaoRepository;
    private final TransacaoRepository transacaoRepository;
    private final TransacaoRecorrenteRepository recorrenciaRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioAtual usuarioAtual;

    public CategoriaService(
            CategoriaRepository categoriaRepository,
            OrcamentoCategoriaRepository orcamentoRepository,
            CompraCartaoRepository compraCartaoRepository,
            TransacaoRepository transacaoRepository,
            TransacaoRecorrenteRepository recorrenciaRepository,
            UsuarioRepository usuarioRepository,
            UsuarioAtual usuarioAtual
    ) {
        this.categoriaRepository = categoriaRepository;
        this.orcamentoRepository = orcamentoRepository;
        this.compraCartaoRepository = compraCartaoRepository;
        this.transacaoRepository = transacaoRepository;
        this.recorrenciaRepository = recorrenciaRepository;
        this.usuarioRepository = usuarioRepository;
        this.usuarioAtual = usuarioAtual;
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponse> listar() {
        return categoriaRepository.findByUsuarioId(usuarioAtual.id(), Sort.by(Sort.Direction.ASC, "nome"))
                .stream()
                .map(this::paraResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoriaResponse buscarPorId(Long id) {
        return paraResponse(buscarEntidade(id));
    }

    @Transactional
    public CategoriaResponse criar(CategoriaRequest request) {
        Categoria categoria = new Categoria();
        atualizarDados(categoria, request);
        categoria.setUsuario(usuarioRepository.getReferenceById(usuarioAtual.id()));
        return paraResponse(categoriaRepository.save(categoria));
    }

    @Transactional
    public CategoriaResponse atualizar(Long id, CategoriaRequest request) {
        Categoria categoria = buscarEntidade(id);
        if (request.tipo() != categoria.getTipo()
                && possuiVinculos(id)) {
            throw new RegraNegocioException("O tipo da categoria não pode mudar enquanto houver movimentações vinculadas");
        }
        atualizarDados(categoria, request);
        return paraResponse(categoriaRepository.save(categoria));
    }

    @Transactional
    public void excluir(Long id) {
        Categoria categoria = buscarEntidade(id);
        if (transacaoRepository.existsByCategoriaId(id)) {
            throw new RegraNegocioException("A categoria possui transações vinculadas e não pode ser excluída");
        }
        if (recorrenciaRepository.existsByCategoriaId(id)) {
            throw new RegraNegocioException("A categoria possui recorrências vinculadas e não pode ser excluída");
        }
        if (orcamentoRepository.existsByCategoriaId(id)) {
            throw new RegraNegocioException("A categoria possui orçamentos vinculados e não pode ser excluída");
        }
        if (compraCartaoRepository.existsByCategoriaId(id)) {
            throw new RegraNegocioException("A categoria possui compras no cartão vinculadas e não pode ser excluída");
        }
        categoriaRepository.delete(categoria);
    }

    private boolean possuiVinculos(Long categoriaId) {
        return transacaoRepository.existsByCategoriaId(categoriaId)
                || recorrenciaRepository.existsByCategoriaId(categoriaId)
                || orcamentoRepository.existsByCategoriaId(categoriaId)
                || compraCartaoRepository.existsByCategoriaId(categoriaId);
    }

    private Categoria buscarEntidade(Long id) {
        return categoriaRepository.findByIdAndUsuarioId(id, usuarioAtual.id())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Categoria não encontrada com o id " + id
                ));
    }

    private void atualizarDados(Categoria categoria, CategoriaRequest request) {
        categoria.setNome(request.nome().trim());
        categoria.setTipo(request.tipo());
    }

    private CategoriaResponse paraResponse(Categoria categoria) {
        return new CategoriaResponse(
                categoria.getId(),
                categoria.getNome(),
                categoria.getTipo()
        );
    }
}
