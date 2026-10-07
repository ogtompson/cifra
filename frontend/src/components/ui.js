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

export function Confirmacao({ titulo, descricao, rotuloConfirmar = "Excluir", confirmando = false, aoCancelar, aoConfirmar }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-primary/35 backdrop-blur-sm sm:items-center sm:p-6" role="presentation">
      <section className="modal-panel w-full max-w-md rounded-t-[1.5rem] bg-white p-6 shadow-2xl sm:rounded-[1.5rem]" role="alertdialog" aria-modal="true" aria-labelledby="titulo-confirmacao">
        <p className="text-[.65rem] font-bold uppercase tracking-[.14em] text-error">Confirmação</p>
        <h2 id="titulo-confirmacao" className="mt-2 text-xl font-extrabold text-primary">{titulo}</h2>
        <p className="mt-3 text-sm leading-6 text-foreground-soft">{descricao}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={aoCancelar} className={botaoSecundario}>Cancelar</button>
          <button type="button" onClick={aoConfirmar} disabled={confirmando} className="action-danger">{confirmando ? "Excluindo..." : rotuloConfirmar}</button>
        </div>
      </section>
    </div>
  );
}
