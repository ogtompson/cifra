package com.cifra.backend.repository;

import com.cifra.backend.model.Conta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;

public interface ContaRepository extends JpaRepository<Conta, Long> {

    @Query("select coalesce(sum(conta.saldoInicial), 0) from Conta conta")
    BigDecimal somarSaldosIniciais();
}
