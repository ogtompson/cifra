package com.cifra.backend.repository;

import com.cifra.backend.model.OrcamentoCategoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface OrcamentoCategoriaRepository extends JpaRepository<OrcamentoCategoria, Long> {
    List<OrcamentoCategoria> findByMesReferenciaOrderByCategoriaNomeAsc(LocalDate mesReferencia);

    Optional<OrcamentoCategoria> findByCategoriaIdAndMesReferencia(Long categoriaId, LocalDate mesReferencia);

    boolean existsByCategoriaId(Long categoriaId);

}
