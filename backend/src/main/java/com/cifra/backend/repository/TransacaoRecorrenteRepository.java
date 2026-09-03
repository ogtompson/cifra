package com.cifra.backend.repository;

import com.cifra.backend.model.TransacaoRecorrente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TransacaoRecorrenteRepository extends JpaRepository<TransacaoRecorrente, Long> {
    List<TransacaoRecorrente> findByAtivaTrue();
}