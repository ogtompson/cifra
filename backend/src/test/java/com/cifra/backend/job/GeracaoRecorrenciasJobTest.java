package com.cifra.backend.job;

import com.cifra.backend.service.GeracaoRecorrenciasService;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class GeracaoRecorrenciasJobTest {

    @Test
    void deveGerarPendenciasAteADataAtualDaZonaConfigurada() {
        GeracaoRecorrenciasService service = mock(GeracaoRecorrenciasService.class);
        Clock clock = Clock.fixed(
                Instant.parse("2026-09-25T13:00:00Z"),
                ZoneId.of("America/Sao_Paulo")
        );
        GeracaoRecorrenciasJob job = new GeracaoRecorrenciasJob(service, clock);

        job.executar();

        verify(service).gerarPendentesAte(LocalDate.of(2026, 9, 25));
    }
}
