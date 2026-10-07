export const campo = "control-field";
export const botaoPrimario = "action-primary";
export const botaoSecundario = "action-secondary";
export const botaoIcone = "icon-action";

export function EsqueletoLista({ linhas = 5 }) {
  return (
    <div className="divide-y divide-primary/5" aria-label="Carregando conteúdo" aria-busy="true">
      {Array.from({ length: linhas }, (_, indice) => (
        <div key={indice} className="flex animate-pulse items-center gap-3 px-4 py-4 sm:px-6">
          <span className="size-10 shrink-0 rounded-xl bg-primary/7" />
          <span className="h-3.5 w-1/3 rounded-full bg-primary/7" />
          <span className="ml-auto h-3.5 w-20 rounded-full bg-primary/7" />
        </div>
      ))}
    </div>
  );
}

export function FeedbackErro({ mensagem, aoTentarNovamente }) {
  return (
    <div className="feedback-error mt-5" role="alert">
      <span>{mensagem}</span>
      {aoTentarNovamente && <button type="button" onClick={aoTentarNovamente}>Tentar novamente</button>}
    </div>
  );
}

export function FiltroSegmentado({ opcoes, valor, aoAlterar, rotulo }) {
  return (
    <div className="segmented-control" role="group" aria-label={rotulo}>
      {opcoes.map((opcao) => (
        <button key={opcao.valor} type="button" onClick={() => aoAlterar(opcao.valor)} className={valor === opcao.valor ? "is-active" : ""} aria-pressed={valor === opcao.valor}>
          {opcao.rotulo}
        </button>
      ))}
    </div>
  );
}
