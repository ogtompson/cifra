export function Icone({ nome, className = "size-5" }) {
  const caminhos = {
    inicio: <path d="M3 10.8 12 3l9 7.8V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10.8Z" />,
    contas: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18M7 15h4" /></>,
    transacoes: <><path d="m7 7-4 4 4 4M3 11h13M17 17l4-4-4-4M21 13H8" /></>,
    categorias: <><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></>,
    recorrencias: <><path d="M20 7h-5V2" /><path d="M20 7a9 9 0 1 0 1 8" /></>,
    mais: <><path d="M12 5v14M5 12h14" /></>,
    editar: <><path d="m14 5 5 5M4 20l3.5-.7L19 7.8a2.1 2.1 0 0 0-3-3L4.7 16.3 4 20Z" /></>,
    excluir: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" /></>,
    fechar: <path d="m6 6 12 12M18 6 6 18" />,
    carteira: <><path d="M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h12" /><path d="M16 11h6v4h-6a2 2 0 0 1 0-4Z" /></>,
    sino: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    calendario: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    setaCima: <><path d="m6 15 6-6 6 6" /><path d="M12 9v10" /></>,
    setaBaixo: <><path d="m6 9 6 6 6-6" /><path d="M12 5v10" /></>,
    grafico: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    setaDireita: <path d="m9 18 6-6-6-6" />,
    busca: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    filtro: <path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{caminhos[nome]}</svg>;
}
