const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";
const CHAVE_SESSAO = "cifra:sessao";

export class ApiError extends Error {
  constructor(mensagem, status, problema = null) {
    super(mensagem);
    this.name = "ApiError";
    this.status = status;
    this.problema = problema;
  }
}

export function obterSessaoSalva() {
  if (typeof window === "undefined") return null;
  const valor = window.localStorage.getItem(CHAVE_SESSAO);
  if (!valor) return null;
  try {
    const sessao = JSON.parse(valor);
    if (!sessao?.token || !sessao?.expiraEm || new Date(sessao.expiraEm) <= new Date()) {
      limparSessaoSalva();
      return null;
    }
    return sessao;
  } catch {
    limparSessaoSalva();
    return null;
  }
}

export function salvarSessao(sessao) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
  }
}

export function limparSessaoSalva() {
  if (typeof window !== "undefined") window.localStorage.removeItem(CHAVE_SESSAO);
}

export async function apiFetch(caminho, opcoes = {}) {
  const { autenticado = true, ...opcoesFetch } = opcoes;
  const sessao = autenticado ? obterSessaoSalva() : null;
  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...opcoesFetch,
    headers: {
      "Content-Type": "application/json",
      ...(sessao?.token ? { Authorization: `Bearer ${sessao.token}` } : {}),
      ...opcoesFetch.headers,
    },
  });

  if (!resposta.ok) {
    const problema = await resposta.json().catch(() => null);
    const erros = problema?.erros ? Object.values(problema.erros).join(". ") : null;
    if (resposta.status === 401 && autenticado) {
      limparSessaoSalva();
      if (typeof window !== "undefined") window.dispatchEvent(new Event("cifra:sessao-expirada"));
    }
    throw new ApiError(
      erros || problema?.detail || "Não foi possível concluir a operação.",
      resposta.status,
      problema,
    );
  }

  if (resposta.status === 204) return null;
  return resposta.json();
}
