package com.cifra.backend.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TokenServiceTest {

    private final TokenService service = new TokenService();

    @Test
    void deveGerarTokensAleatoriosComEntropiaAdequada() {
        String primeiro = service.gerar();
        String segundo = service.gerar();

        assertThat(primeiro).hasSize(43).isNotEqualTo(segundo);
        assertThat(primeiro).doesNotContain("=", "+", "/");
    }

    @Test
    void deveGerarHashSha256DeterministicoSemGuardarToken() {
        String hash = service.hash("token-de-teste");

        assertThat(hash).hasSize(64).isEqualTo(service.hash("token-de-teste"));
        assertThat(hash).doesNotContain("token-de-teste");
    }
}
