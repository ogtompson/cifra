"use client";

import { Button as AriaButton, Dialog, ListBox, ListBoxItem, Modal, ModalOverlay, Popover, Select as AriaSelect, SelectValue, Switch as AriaSwitch } from "react-aria-components";
import { Icone } from "@/components/icons";

export const campo = "control-field";
export const botaoPrimario = "action-primary";
export const botaoSecundario = "action-secondary";
export const botaoIcone = "icon-action";

export function SelectCampo({ valor, aoAlterar, opcoes, rotulo, nome, obrigatorio = false, desabilitado = false, placeholder = "Selecione" }) {
  const chaveSelecionada = valor === "" || valor === null || valor === undefined ? null : String(valor);
  return (
    <AriaSelect selectedKey={chaveSelecionada} onSelectionChange={(chave) => aoAlterar(chave === "__vazio" || chave === null ? "" : String(chave))} name={nome} isRequired={obrigatorio} isDisabled={desabilitado} aria-label={rotulo} placeholder={placeholder} className="select-control">
      <AriaButton className="select-trigger">
        <SelectValue className="min-w-0 flex-1 truncate text-left" />
        <Icone nome="chevronBaixo" className="size-4 shrink-0" />
      </AriaButton>
      <Popover placement="bottom start" offset={6} containerPadding={12} className="select-popover">
        <ListBox className="select-listbox">
          {[...(obrigatorio ? [] : [{ valor: "", rotulo: placeholder }]), ...opcoes.filter((opcao) => opcao.valor !== "")].map((opcao) => {
            const id = opcao.valor === "" ? "__vazio" : String(opcao.valor);
            return <ListBoxItem key={id} id={id} textValue={opcao.rotulo} className={({ isSelected, isFocused }) => `select-option ${isSelected ? "is-selected" : ""} ${isFocused ? "is-focused" : ""}`}>{({ isSelected }) => <><span className="truncate">{opcao.rotulo}</span>{isSelected && <Icone nome="check" className="size-3.5 shrink-0" />}</>}</ListBoxItem>;
          })}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}

export function ModalPadrao({ titulo, eyebrow, aoFechar, children, tamanho = "md" }) {
  const larguras = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-3xl" };
  return (
    <ModalOverlay isOpen isDismissable onOpenChange={(aberto) => !aberto && aoFechar()} className="modal-overlay">
      <Modal className={`modal-surface ${larguras[tamanho] ?? larguras.md}`}>
        <Dialog className="outline-none">
          <header className="modal-header">
            <div>{eyebrow && <p className="modal-eyebrow">{eyebrow}</p>}<h2 className="modal-title">{titulo}</h2></div>
            <button type="button" onClick={aoFechar} className="modal-close" aria-label="Fechar"><Icone nome="fechar" /></button>
          </header>
          {children}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
export function Switch({ selecionado, aoAlterar, rotulo, desabilitado = false, compacto = false }) {
  return (
    <AriaSwitch isSelected={selecionado} onChange={aoAlterar} isDisabled={desabilitado} className={`cifra-switch ${compacto ? "is-compact" : ""}`} aria-label={rotulo}>
      <span className="cifra-switch-track"><span className="cifra-switch-thumb" /></span>
      <span className="cifra-switch-label">{selecionado ? "Ativa" : "Pausada"}</span>
    </AriaSwitch>
  );
}
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
    <ModalPadrao titulo={titulo} eyebrow="Confirmação" aoFechar={aoCancelar} tamanho="sm">
      <div className="modal-body">
        <p className="text-sm leading-6 text-foreground-soft">{descricao}</p>
        <div className="modal-footer">
          <button type="button" onClick={aoCancelar} className={botaoSecundario}>Cancelar</button>
          <button type="button" onClick={aoConfirmar} disabled={confirmando} className="action-danger">{confirmando ? "Excluindo..." : rotuloConfirmar}</button>
        </div>
      </div>
    </ModalPadrao>
  );
}
