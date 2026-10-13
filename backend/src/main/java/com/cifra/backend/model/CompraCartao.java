package com.cifra.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "compra_cartao")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CompraCartao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String descricao;

    @Column(name = "valor_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorTotal;

    @Column(name = "data_compra", nullable = false)
    private LocalDate dataCompra;

    @Column(name = "numero_parcelas", nullable = false)
    private Integer numeroParcelas;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cartao_id", nullable = false)
    private CartaoCredito cartao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;
}
