"use client";

import { Button as AriaButton, Dialog, Menu, MenuItem, MenuTrigger, Modal, ModalOverlay, Popover, Switch as AriaSwitch } from "react-aria-components";
import { Icone } from "@/components/icons";

export const campo = "control-field";
export const botaoPrimario = "action-primary";
export const botaoSecundario = "action-secondary";
export const botaoIcone = "icon-action";

const formatadorMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

export function NavegacaoMes({ referencia, aoMudar, className = "" }) {
  const texto = formatadorMes.format(referencia);
  const rotulo = texto.charAt(0).toUpperCase() + texto.slice(1);
  return (
    <div className={`flex w-fit items-center gap-1 text-secondary ${className}`} aria-label="Navegação mensal">
      <button type="button" onClick={() => aoMudar(-1)} className="grid size-6 place-items-center rounded-full transition hover:bg-secondary/8" aria-label="Mês anterior"><Icone nome="setaDireita" className="size-3 rotate-180" /></button>
      <span className="min-w-32 text-center text-xs font-extrabold">{rotulo}</span>
      <button type="button" onClick={() => aoMudar(1)} className="grid size-6 place-items-center rounded-full transition hover:bg-secondary/8" aria-label="Próximo mês"><Icone nome="setaDireita" className="size-3" /></button>
    </div>
  );
}

export function SelectCampo({ valor, aoAlterar, opcoes, rotulo, nome, obrigatorio = false, desabilitado = false, placeholder = "Selecione" }) {
  const chaveSelecionada = valor === "" || valor === null || valor === undefined ? null : String(valor);
  const opcoesVisiveis = [...(obrigatorio ? [] : [{ valor: "", rotulo: placeholder }]), ...opcoes.filter((opcao) => opcao.valor !== "")];
  const textoSelecionado = opcoes.find((opcao) => String(opcao.valor) === chaveSelecionada)?.rotulo ?? placeholder;
  return (
    <div className="select-control">
      {nome && <input type="hidden" name={nome} value={valor ?? ""} />}
      <MenuTrigger>
      <AriaButton type="button" isDisabled={desabilitado} className="select-trigger" aria-label={rotulo}>
        <span className={`min-w-0 flex-1 truncate text-left ${chaveSelecionada ? "" : "text-foreground-soft"}`}>{textoSelecionado}</span>
        <Icone nome="chevronBaixo" className="size-4 shrink-0" />
      </AriaButton>
      <Popover placement="bottom start" offset={6} containerPadding={12} className="select-popover">
        <Menu className="select-listbox" aria-label={rotulo} onAction={(chave) => aoAlterar(chave === "__vazio" ? "" : String(chave))}>
          {opcoesVisiveis.map((opcao) => {
            const id = opcao.valor === "" ? "__vazio" : String(opcao.valor);
            const selecionada = id === (chaveSelecionada ?? "__vazio");
            return <MenuItem key={id} id={id} textValue={opcao.rotulo} className={({ isFocused }) => `select-option ${selecionada ? "is-selected" : ""} ${isFocused ? "is-focused" : ""}`}><span className="truncate">{opcao.rotulo}</span>{selecionada && <Icone nome="check" className="size-3.5 shrink-0" />}</MenuItem>;
          })}
        </Menu>
      </Popover>
      </MenuTrigger>
    </div>
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
        <div key={indice} className="flex items-center gap-3 px-4 py-4 sm:px-6">
          <span className="skeleton size-10 shrink-0 rounded-xl" />
          <span className="skeleton h-3.5 w-1/3 rounded-full" />
          <span className="skeleton ml-auto h-3.5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function EsqueletoBloco({ className = "h-40" }) {
  return <div className={`skeleton rounded-2xl ${className}`} aria-label="Carregando conteúdo" aria-busy="true" />;
}

export function EstadoVazio({ icone = "outros", titulo, descricao, acao, compacto = false, className = "" }) {
  return (
    <div className={`empty-state ${compacto ? "is-compact" : ""} ${className}`}>
      <span className="empty-state-icon"><Icone nome={icone} className={compacto ? "size-4" : "size-5"} /></span>
      <div><h3 className="empty-state-title">{titulo}</h3>{descricao && <p className="empty-state-description">{descricao}</p>}</div>
      {acao && <div className="empty-state-action">{acao}</div>}
    </div>
  );
}

export function ErroFormulario({ mensagem }) {
  if (!mensagem) return null;
  return <p className="form-error" role="alert"><Icone nome="alerta" className="size-4 shrink-0" />{mensagem}</p>;
}

export function FeedbackErro({ mensagem, aoTentarNovamente, className = "" }) {
  return (
    <div className={`feedback-error mt-5 ${className}`} role="alert">
      <span className="feedback-error-icon"><Icone nome="alerta" className="size-4" /></span>
      <div className="min-w-0 flex-1"><strong>Não foi possível concluir</strong><p>{mensagem}</p></div>
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
