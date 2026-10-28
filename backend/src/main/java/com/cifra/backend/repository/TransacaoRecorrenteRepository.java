package com.cifra.backend.repository;

import com.cifra.backend.model.TransacaoRecorrente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

public interface TransacaoRecorrenteRepository extends JpaRepository<TransacaoRecorrente, Long> {
    List<TransacaoRecorrente> findByAtivaTrue();

    List<TransacaoRecorrente> findByContaUsuarioId(Long usuarioId, Sort sort);

    List<TransacaoRecorrente> findByAtivaAndContaUsuarioId(boolean ativa, Long usuarioId, Sort sort);

    Optional<TransacaoRecorrente> findByIdAndContaUsuarioId(Long id, Long usuarioId);

    long countByContaId(Long contaId);

    long countByContaIdAndAtivaTrue(Long contaId);

    boolean existsByCategoriaId(Long categoriaId);

    long deleteByContaId(Long contaId);
}
