package com.cifra.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record FaturaCartaoResponse(
        Long cartaoId,
        String cartaoNome,
        LocalDate mesReferencia,
        LocalDate dataFechamento,
        LocalDate dataVencimento,
        BigDecimal total,
        List<ParcelaFaturaResponse> parcelas,
        boolean paga,
        LocalDate dataPagamento
) {
}
