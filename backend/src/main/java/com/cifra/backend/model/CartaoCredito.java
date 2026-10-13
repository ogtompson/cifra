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

@Entity
@Table(name = "cartao_credito")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CartaoCredito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String nome;

    @Column(nullable = false, length = 30)
    private String bandeira;

    @Column(name = "final_cartao", nullable = false, length = 4)
    private String finalCartao;

    @Column(name = "limite_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal limiteTotal;

    @Column(name = "dia_fechamento", nullable = false)
    private Integer diaFechamento;

    @Column(name = "dia_vencimento", nullable = false)
    private Integer diaVencimento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conta_pagamento_id", nullable = false)
    private Conta contaPagamento;
}
