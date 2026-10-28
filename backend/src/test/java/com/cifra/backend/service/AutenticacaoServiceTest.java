package com.cifra.backend.service;

import com.cifra.backend.dto.CadastroRequest;
import com.cifra.backend.dto.LoginRequest;
import com.cifra.backend.exception.CredenciaisInvalidasException;
import com.cifra.backend.exception.RegraNegocioException;
import com.cifra.backend.model.Sessao;
import com.cifra.backend.model.Usuario;
import com.cifra.backend.repository.CategoriaRepository;
import com.cifra.backend.repository.ContaRepository;
import com.cifra.backend.repository.SessaoRepository;
import com.cifra.backend.repository.UsuarioRepository;
import com.cifra.backend.security.TokenService;
import com.cifra.backend.security.UsuarioAutenticado;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AutenticacaoServiceTest {

    private static final Instant AGORA = Instant.parse("2026-10-28T18:00:00Z");

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private SessaoRepository sessaoRepository;
    @Mock private ContaRepository contaRepository;
    @Mock private CategoriaRepository categoriaRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private TokenService tokenService;

    private AutenticacaoService service;

    @BeforeEach
    void configurar() {
        service = new AutenticacaoService(
                usuarioRepository,
                sessaoRepository,
                contaRepository,
                categoriaRepository,
                passwordEncoder,
                tokenService,
                Clock.fixed(AGORA, ZoneOffset.UTC),
                Duration.ofDays(7)
        );
    }

    @Test
    void deveCadastrarNormalizarEmailEReivindicarDadosLegados() {
        when(passwordEncoder.encode("senha-segura")).thenReturn("hash-da-senha");
        when(tokenService.gerar()).thenReturn("token-bruto");
        when(tokenService.hash("token-bruto")).thenReturn("hash-do-token");
        when(usuarioRepository.saveAndFlush(any())).thenAnswer(invocacao -> {
            Usuario usuario = invocacao.getArgument(0);
            usuario.setId(7L);
            return usuario;
        });
        when(usuarioRepository.count()).thenReturn(1L);

        var resposta = service.cadastrar(new CadastroRequest(
                "  Paulo  ", "  PAULO@EXEMPLO.COM ", "senha-segura"
        ));

        assertThat(resposta.token()).isEqualTo("token-bruto");
        assertThat(resposta.expiraEm()).isEqualTo(AGORA.plus(Duration.ofDays(7)));
        assertThat(resposta.usuario().nome()).isEqualTo("Paulo");
        assertThat(resposta.usuario().email()).isEqualTo("paulo@exemplo.com");
        ArgumentCaptor<Sessao> sessao = ArgumentCaptor.forClass(Sessao.class);
        verify(sessaoRepository).save(sessao.capture());
        assertThat(sessao.getValue().getTokenHash()).isEqualTo("hash-do-token");
        assertThat(sessao.getValue().getTokenHash()).doesNotContain("token-bruto");
        verify(contaRepository).atribuirLegadasAoUsuario(any(Usuario.class));
        verify(categoriaRepository).atribuirLegadasAoUsuario(any(Usuario.class));
    }

    @Test
    void deveRejeitarEmailJaCadastrado() {
        when(usuarioRepository.existsByEmail("paulo@exemplo.com")).thenReturn(true);

        assertThatThrownBy(() -> service.cadastrar(new CadastroRequest(
                "Paulo", "paulo@exemplo.com", "senha-segura"
        )))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessage("Já existe uma conta com este e-mail");

        verify(usuarioRepository, never()).saveAndFlush(any());
    }

    @Test
    void deveEntrarComCredenciaisValidas() {
        Usuario usuario = usuario();
        when(usuarioRepository.findByEmail("paulo@exemplo.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("senha-segura", "hash-da-senha")).thenReturn(true);
        when(tokenService.gerar()).thenReturn("novo-token");
        when(tokenService.hash("novo-token")).thenReturn("novo-hash");

        var resposta = service.entrar(new LoginRequest("PAULO@EXEMPLO.COM", "senha-segura"));

        assertThat(resposta.token()).isEqualTo("novo-token");
        verify(sessaoRepository).deleteByExpiraEmBefore(AGORA);
        verify(sessaoRepository).save(any(Sessao.class));
    }

    @Test
    void deveRejeitarSenhaIncorretaSemDizerQualCampoFalhou() {
        Usuario usuario = usuario();
        when(usuarioRepository.findByEmail("paulo@exemplo.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("senha-errada", "hash-da-senha")).thenReturn(false);

        assertThatThrownBy(() -> service.entrar(new LoginRequest(
                "paulo@exemplo.com", "senha-errada"
        )))
                .isInstanceOf(CredenciaisInvalidasException.class)
                .hasMessage("E-mail ou senha inválidos");
    }

    @Test
    void deveRevogarSessaoNoLogout() {
        service.sair(new UsuarioAutenticado(7L, 11L, "Paulo", "paulo@exemplo.com"));

        verify(sessaoRepository).deleteById(11L);
    }

    private Usuario usuario() {
        Usuario usuario = new Usuario();
        usuario.setId(7L);
        usuario.setNome("Paulo");
        usuario.setEmail("paulo@exemplo.com");
        usuario.setSenhaHash("hash-da-senha");
        usuario.setCriadoEm(AGORA);
        return usuario;
    }
}
