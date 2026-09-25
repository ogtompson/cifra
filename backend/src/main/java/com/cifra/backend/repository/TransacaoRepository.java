package com.cifra.backend.repository;

import com.cifra.backend.model.Transacao;
import com.cifra.backend.model.enums.TipoOperacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    @Query("""
            select coalesce(sum(transacao.valor), 0)
            from Transacao transacao
            where transacao.tipo = :tipo
              and transacao.data between :dataInicio and :dataFim
            """)
    BigDecimal somarValorPorTipoEPeriodo(
            @Param("tipo") TipoOperacao tipo,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim
    );

    @Query("""
            select coalesce(sum(transacao.valor), 0)
            from Transacao transacao
            where transacao.tipo = :tipo
              and transacao.data <= :dataFim
            """)
    BigDecimal somarValorPorTipoAte(
            @Param("tipo") TipoOperacao tipo,
            @Param("dataFim") LocalDate dataFim
    );

    @Query("""
            select transacao.categoria.id as categoriaId,
                   transacao.categoria.nome as categoriaNome,
                   sum(transacao.valor) as total
            from Transacao transacao
            where transacao.tipo = :tipo
              and transacao.data between :dataInicio and :dataFim
            group by transacao.categoria.id, transacao.categoria.nome
            order by sum(transacao.valor) desc, transacao.categoria.nome asc
            """)
    List<TotalPorCategoria> somarPorCategoriaETipoEPeriodo(
            @Param("tipo") TipoOperacao tipo,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim
    );
}
