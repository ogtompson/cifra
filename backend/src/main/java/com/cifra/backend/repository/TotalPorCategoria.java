package com.cifra.backend.repository;

import java.math.BigDecimal;

public interface TotalPorCategoria {

    Long getCategoriaId();

    String getCategoriaNome();

    BigDecimal getTotal();
}
