package com.cifra.backend.repository;

import com.cifra.backend.model.Conta;
import com.cifra.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Sort;

public interface ContaRepository extends JpaRepository<Conta, Long> {

    @Modifying
    @Query("update Conta conta set conta.usuario = :usuario where conta.usuario is null")
    int atribuirLegadasAoUsuario(Usuario usuario);

    Optional<Conta> findByIdAndUsuarioId(Long id, Long usuarioId);

    List<Conta> findByUsuarioId(Long usuarioId, Sort sort);

    @Query("""
            select conta from Conta conta
            where conta.usuario.id = :usuarioId
              and (conta.arquivada = false or conta.arquivada is null)
            """)
    List<Conta> findAtivasByUsuarioId(Long usuarioId, Sort sort);

    @Query("""
            select coalesce(sum(conta.saldoInicial), 0)
            from Conta conta
            where conta.usuario.id = :usuarioId
              and (conta.arquivada = false or conta.arquivada is null)
            """)
    BigDecimal somarSaldosIniciaisAtivas(Long usuarioId);
}
