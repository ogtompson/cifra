package com.cifra.backend.service;

import com.cifra.backend.dto.CategoriaRequest;
import com.cifra.backend.dto.CategoriaResponse;
import com.cifra.backend.exception.RecursoNaoEncontradoException;
import com.cifra.backend.model.Categoria;
import com.cifra.backend.repository.CategoriaRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;

    public CategoriaService(CategoriaRepository categoriaRepository) {
        this.categoriaRepository = categoriaRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponse> listar() {
        return categoriaRepository.findAll(Sort.by(Sort.Direction.ASC, "nome"))
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
        return paraResponse(categoriaRepository.save(categoria));
    }

    @Transactional
    public CategoriaResponse atualizar(Long id, CategoriaRequest request) {
        Categoria categoria = buscarEntidade(id);
        atualizarDados(categoria, request);
        return paraResponse(categoriaRepository.save(categoria));
    }

    @Transactional
    public void excluir(Long id) {
        categoriaRepository.delete(buscarEntidade(id));
    }

    private Categoria buscarEntidade(Long id) {
        return categoriaRepository.findById(id)
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
