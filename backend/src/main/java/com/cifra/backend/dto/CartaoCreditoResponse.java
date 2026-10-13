package com.cifra.backend.dto;

import java.math.BigDecimal;

public record CartaoCreditoResponse(
        Long id,
        String nome,
        String bandeira,
        String finalCartao,
        BigDecimal limiteTotal,
        BigDecimal limiteUtilizado,
        BigDecimal limiteDisponivel,
        Integer diaFechamento,
        Integer diaVencimento,
        Long contaPagamentoId,
        String contaPagamentoNome
) {
}
