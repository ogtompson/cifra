package com.cifra.backend.service;

import com.cifra.backend.dto.AutenticacaoResponse;
import com.cifra.backend.dto.CadastroRequest;
import com.cifra.backend.dto.LoginRequest;
import com.cifra.backend.dto.UsuarioResponse;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

@Service
public class AutenticacaoService {

    private static final int MAXIMO_BYTES_BCRYPT = 72;

    private final UsuarioRepository usuarioRepository;
    private final SessaoRepository sessaoRepository;
    private final ContaRepository contaRepository;
    private final CategoriaRepository categoriaRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final Clock clock;
    private final Duration duracaoSessao;

    public AutenticacaoService(
            UsuarioRepository usuarioRepository,
            SessaoRepository sessaoRepository,
            ContaRepository contaRepository,
            CategoriaRepository categoriaRepository,
            PasswordEncoder passwordEncoder,
            TokenService tokenService,
            Clock clock,
            @Value("${cifra.auth.session-duration:P7D}") Duration duracaoSessao
    ) {
        this.usuarioRepository = usuarioRepository;
        this.sessaoRepository = sessaoRepository;
        this.contaRepository = contaRepository;
        this.categoriaRepository = categoriaRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.clock = clock;
        this.duracaoSessao = duracaoSessao;
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public AutenticacaoResponse cadastrar(CadastroRequest request) {
        String email = normalizarEmail(request.email());
        validarSenha(request.senha());
        if (usuarioRepository.existsByEmail(email)) {
            throw new RegraNegocioException("Já existe uma conta com este e-mail");
        }

        Instant agora = Instant.now(clock);
        Usuario usuario = new Usuario();
        usuario.setNome(request.nome().trim());
        usuario.setEmail(email);
        usuario.setSenhaHash(passwordEncoder.encode(request.senha()));
        usuario.setCriadoEm(agora);
        usuario = usuarioRepository.saveAndFlush(usuario);

        if (usuarioRepository.count() == 1) {
            contaRepository.atribuirLegadasAoUsuario(usuario);
            categoriaRepository.atribuirLegadasAoUsuario(usuario);
        }

        return criarSessao(usuario, agora);
    }

    @Transactional
    public AutenticacaoResponse entrar(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(normalizarEmail(request.email()))
                .orElseThrow(CredenciaisInvalidasException::new);
        if (!passwordEncoder.matches(request.senha(), usuario.getSenhaHash())) {
            throw new CredenciaisInvalidasException();
        }
        Instant agora = Instant.now(clock);
        sessaoRepository.deleteByExpiraEmBefore(agora);
        return criarSessao(usuario, agora);
    }

    @Transactional
    public void sair(UsuarioAutenticado usuario) {
        sessaoRepository.deleteById(usuario.sessaoId());
    }

    public UsuarioResponse usuarioAtual(UsuarioAutenticado usuario) {
        return new UsuarioResponse(usuario.usuarioId(), usuario.nome(), usuario.email());
    }

    private AutenticacaoResponse criarSessao(Usuario usuario, Instant agora) {
        String token = tokenService.gerar();
        Instant expiraEm = agora.plus(duracaoSessao);
        Sessao sessao = new Sessao();
        sessao.setUsuario(usuario);
        sessao.setTokenHash(tokenService.hash(token));
        sessao.setCriadoEm(agora);
        sessao.setExpiraEm(expiraEm);
        sessaoRepository.save(sessao);
        return new AutenticacaoResponse(token, expiraEm, paraResponse(usuario));
    }

    private UsuarioResponse paraResponse(Usuario usuario) {
        return new UsuarioResponse(usuario.getId(), usuario.getNome(), usuario.getEmail());
    }

    private String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private void validarSenha(String senha) {
        if (senha.getBytes(StandardCharsets.UTF_8).length > MAXIMO_BYTES_BCRYPT) {
            throw new RegraNegocioException("A senha é longa demais");
        }
    }
}
