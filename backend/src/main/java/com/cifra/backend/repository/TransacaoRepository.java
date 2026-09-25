package com.cifra.backend.repository;

import com.cifra.backend.model.Transacao;
import com.cifra.backend.model.enums.TipoOperacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface TransacaoRepository extends JpaRepository<Transacao, Long> {
    List<Transacao> findByContaIdOrderByDataDescIdDesc(Long contaId);

    @Query("""
            select coalesce(sum(transacao.valor), 0)
            from Transacao transacao
            where transacao.conta.id = :contaId
              and transacao.tipo = :tipo
            """)
    BigDecimal somarValorPorContaETipo(
            @Param("contaId") Long contaId,
            @Param("tipo") TipoOperacao tipo
    );
}
