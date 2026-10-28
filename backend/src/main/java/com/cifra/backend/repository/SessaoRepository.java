package com.cifra.backend.repository;

import com.cifra.backend.model.Sessao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.time.Instant;
import java.util.Optional;

public interface SessaoRepository extends JpaRepository<Sessao, Long> {
    @EntityGraph(attributePaths = "usuario")
    Optional<Sessao> findByTokenHashAndExpiraEmAfter(String tokenHash, Instant instante);
    long deleteByExpiraEmBefore(Instant instante);
}
