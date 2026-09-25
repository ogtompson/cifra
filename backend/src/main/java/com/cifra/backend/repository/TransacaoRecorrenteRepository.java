package com.cifra.backend.repository;

import com.cifra.backend.model.TransacaoRecorrente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;

import java.util.List;

public interface TransacaoRecorrenteRepository extends JpaRepository<TransacaoRecorrente, Long> {
    List<TransacaoRecorrente> findByAtivaTrue();

    List<TransacaoRecorrente> findByAtiva(boolean ativa, Sort sort);
}
