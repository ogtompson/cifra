package com.cifra.backend.repository;

import com.cifra.backend.model.Categoria;
import com.cifra.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Sort;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    @Modifying
    @Query("update Categoria categoria set categoria.usuario = :usuario where categoria.usuario is null")
    int atribuirLegadasAoUsuario(Usuario usuario);

    List<Categoria> findByUsuarioId(Long usuarioId, Sort sort);

    Optional<Categoria> findByIdAndUsuarioId(Long id, Long usuarioId);
}
