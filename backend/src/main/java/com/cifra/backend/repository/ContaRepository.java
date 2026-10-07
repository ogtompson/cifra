package com.cifra.backend.repository;

import com.cifra.backend.model.Conta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.domain.Sort;

public interface ContaRepository extends JpaRepository<Conta, Long> {

    @Query("select coalesce(sum(conta.saldoInicial), 0) from Conta conta")
    BigDecimal somarSaldosIniciais();

    List<Conta> findByArquivadaFalseOrArquivadaIsNull(Sort sort);

    @Query("""
            select coalesce(sum(conta.saldoInicial), 0)
            from Conta conta
            where conta.arquivada = false or conta.arquivada is null
            """)
    BigDecimal somarSaldosIniciaisAtivas();
}
