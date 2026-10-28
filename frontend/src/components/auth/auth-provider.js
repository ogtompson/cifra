"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, limparSessaoSalva, obterSessaoSalva, salvarSessao } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const encerrarLocalmente = useCallback(() => {
    limparSessaoSalva();
    setSessao(null);
  }, []);

  useEffect(() => {
    let ativo = true;

    async function restaurar() {
      await Promise.resolve();
      const salva = obterSessaoSalva();
      if (!salva) {
        if (ativo) setCarregando(false);
        return;
      }
      try {
        const usuario = await apiFetch("/auth/me");
        if (!ativo) return;
        const atualizada = { ...salva, usuario };
        salvarSessao(atualizada);
        setSessao(atualizada);
      } catch {
        if (ativo) encerrarLocalmente();
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    restaurar();

    return () => { ativo = false; };
  }, [encerrarLocalmente]);

  useEffect(() => {
    window.addEventListener("cifra:sessao-expirada", encerrarLocalmente);
    return () => window.removeEventListener("cifra:sessao-expirada", encerrarLocalmente);
  }, [encerrarLocalmente]);

  const autenticar = useCallback(async (caminho, dados) => {
    const novaSessao = await apiFetch(caminho, {
      method: "POST",
      body: JSON.stringify(dados),
      autenticado: false,
    });
    salvarSessao(novaSessao);
    setSessao(novaSessao);
    return novaSessao;
  }, []);

  const entrar = useCallback(
    (credenciais) => autenticar("/auth/login", credenciais),
    [autenticar],
  );
  const cadastrar = useCallback(
    (dados) => autenticar("/auth/cadastro", dados),
    [autenticar],
  );
  const sair = useCallback(async () => {
    try {
      if (obterSessaoSalva()) await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      encerrarLocalmente();
    }
  }, [encerrarLocalmente]);

  const valor = useMemo(() => ({
    usuario: sessao?.usuario ?? null,
    autenticado: Boolean(sessao?.token),
    carregando,
    entrar,
    cadastrar,
    sair,
  }), [sessao, carregando, entrar, cadastrar, sair]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return contexto;
}
