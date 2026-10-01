package com.cifra.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

import static org.assertj.core.api.Assertions.assertThatCode;

class CorsConfigTest {

    @Test
    void deveRegistrarAsOrigensPermitidas() {
        CorsConfig config = new CorsConfig(new String[]{
                "http://localhost:3000",
                "https://cifra.exemplo.com"
        });

        assertThatCode(() -> config.addCorsMappings(new CorsRegistry()))
                .doesNotThrowAnyException();
    }
}
