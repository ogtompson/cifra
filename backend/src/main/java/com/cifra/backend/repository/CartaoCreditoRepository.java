package com.cifra.backend.repository;

import com.cifra.backend.model.CartaoCredito;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CartaoCreditoRepository extends JpaRepository<CartaoCredito, Long> {
    List<CartaoCredito> findAllByOrderByNomeAsc();
}
