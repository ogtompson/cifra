package com.cifra.backend.repository;

import com.cifra.backend.model.CartaoCredito;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartaoCreditoRepository extends JpaRepository<CartaoCredito, Long> {
    List<CartaoCredito> findByContaPagamentoUsuarioIdOrderByNomeAsc(Long usuarioId);
    Optional<CartaoCredito> findByIdAndContaPagamentoUsuarioId(Long id, Long usuarioId);
    long countByContaPagamentoId(Long contaId);
}
