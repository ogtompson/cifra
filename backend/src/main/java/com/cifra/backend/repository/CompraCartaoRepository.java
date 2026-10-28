package com.cifra.backend.repository;

import com.cifra.backend.model.CompraCartao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CompraCartaoRepository extends JpaRepository<CompraCartao, Long> {
    List<CompraCartao> findByCartaoContaPagamentoUsuarioIdOrderByDataCompraDescIdDesc(Long usuarioId);
    List<CompraCartao> findByCartaoIdAndCartaoContaPagamentoUsuarioIdOrderByDataCompraDescIdDesc(
            Long cartaoId,
            Long usuarioId
    );
    Optional<CompraCartao> findByIdAndCartaoContaPagamentoUsuarioId(Long id, Long usuarioId);
    boolean existsByCartaoId(Long cartaoId);
    boolean existsByCategoriaId(Long categoriaId);

    @Query("""
            select coalesce(sum(compra.valorTotal), 0)
            from CompraCartao compra
            where compra.cartao.contaPagamento.usuario.id = :usuarioId
              and compra.dataCompra between :dataInicio and :dataFim
            """)
    BigDecimal somarValorPorPeriodo(
            @Param("usuarioId") Long usuarioId,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim
    );

    @Query("""
            select compra.categoria.id as categoriaId,
                   compra.categoria.nome as categoriaNome,
                   sum(compra.valorTotal) as total
            from CompraCartao compra
            where compra.cartao.contaPagamento.usuario.id = :usuarioId
              and compra.dataCompra between :dataInicio and :dataFim
            group by compra.categoria.id, compra.categoria.nome
            order by sum(compra.valorTotal) desc, compra.categoria.nome asc
            """)
    List<TotalPorCategoria> somarPorCategoriaEPeriodo(
            @Param("usuarioId") Long usuarioId,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim
    );
}
