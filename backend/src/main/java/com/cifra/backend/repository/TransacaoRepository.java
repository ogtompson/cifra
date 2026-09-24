package com.cifra.backend.repository;

import com.cifra.backend.model.Transacao;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TransacaoRepository extends JpaRepository<Transacao, Long> {
    List<Transacao> findByContaIdOrderByDataDescIdDesc(Long contaId);
}
