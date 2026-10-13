package com.cifra.backend.repository;

import com.cifra.backend.model.CompraCartao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompraCartaoRepository extends JpaRepository<CompraCartao, Long> {
    List<CompraCartao> findAllByOrderByDataCompraDescIdDesc();
    List<CompraCartao> findByCartaoIdOrderByDataCompraDescIdDesc(Long cartaoId);
    boolean existsByCartaoId(Long cartaoId);
    boolean existsByCategoriaId(Long categoriaId);
}
