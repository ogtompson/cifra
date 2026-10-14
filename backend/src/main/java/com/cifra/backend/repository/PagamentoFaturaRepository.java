package com.cifra.backend.repository;

import com.cifra.backend.model.PagamentoFatura;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PagamentoFaturaRepository extends JpaRepository<PagamentoFatura, Long> {
    Optional<PagamentoFatura> findByCartaoIdAndMesReferencia(Long cartaoId, LocalDate mesReferencia);
    List<PagamentoFatura> findByCartaoId(Long cartaoId);
}
