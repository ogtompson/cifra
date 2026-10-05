const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

export async function apiFetch(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      "Content-Type": "application/json",
      ...opcoes.headers,
    },
  });

  if (!resposta.ok) {
    const problema = await resposta.json().catch(() => null);
    const erros = problema?.erros ? Object.values(problema.erros).join(". ") : null;
    throw new Error(erros || problema?.detail || "Não foi possível concluir a operação.");
  }

  if (resposta.status === 204) return null;
  return resposta.json();
}
