package com.cifra.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(
        name = "pagamento_fatura",
        uniqueConstraints = @UniqueConstraint(name = "uk_pagamento_fatura_cartao_mes", columnNames = {"cartao_id", "mes_referencia"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PagamentoFatura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cartao_id", nullable = false)
    private CartaoCredito cartao;

    @Column(name = "mes_referencia", nullable = false)
    private LocalDate mesReferencia;

    @Column(name = "valor_pago", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorPago;

    @Column(name = "data_pagamento", nullable = false)
    private LocalDate dataPagamento;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transacao_id", nullable = false, unique = true)
    private Transacao transacao;
}
