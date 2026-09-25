package com.cifra.backend.job;

import com.cifra.backend.service.GeracaoRecorrenciasService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;

@Component
public class GeracaoRecorrenciasJob {

    private final GeracaoRecorrenciasService geracaoRecorrenciasService;
    private final Clock clock;

    public GeracaoRecorrenciasJob(
            GeracaoRecorrenciasService geracaoRecorrenciasService,
            Clock clock
    ) {
        this.geracaoRecorrenciasService = geracaoRecorrenciasService;
        this.clock = clock;
    }

    @Scheduled(
            cron = "${cifra.recorrencias.cron:0 0 3 * * *}",
            zone = "${cifra.recorrencias.zone:America/Sao_Paulo}"
    )
    public void executar() {
        geracaoRecorrenciasService.gerarPendentesAte(LocalDate.now(clock));
    }
}
