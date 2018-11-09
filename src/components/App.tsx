import * as React from "react";
// import {Monitor} from './Monitor'
import { Server } from "./Server";
import { ConexaoDMX } from "./ConexaoDMX";
import { Mesa } from "./Mesa";
import { Equipamentos } from "./Equipamentos";
import { AppState } from "../types";
import { Cenas } from "./Cenas";
import { action } from "../util/action";
import { listen, close } from "../util/listeners";

const empty = {};
export class App extends React.Component<{}, AppState | {}> {
  constructor(props: {}) {
    super(props);
    this.state = empty;
    action({ type: "app-start" });
    // this.stateListener = this.stateListener.bind(this);
    listen(this.stateListener);
  }
  stateListener = (data: AppState) => {
    this.setState(data);
  };

  componentWillUnmount() {
    close(this.stateListener);
  }

  //     setArquivos(arquivos:Arquivo[]){
  //         this.setState({
  //             arquivos
  //         },()=>ipcRenderer.send('state',this.state));
  //     }

  inputEl: HTMLInputElement | null = null;
  salvarMesa() {
    const nome = (this.inputEl && this.inputEl.value) || "";
    if (this.inputEl) this.inputEl.value = "";
    action({ type: "salvar-mesa", nome });
  }

  render() {
    if (this.state == empty) return null;
    const state = this.state as AppState;
    return (
      <div>
        <div
          style={{
            borderBottom: "1px solid #ddd",
            paddingBottom: "10px"
          }}
        >
          <button onClick={() => action({ type: "novo" })}>Novo</button>{" "}
          <button onClick={() => action({ type: "abrir" })}>Abrir</button>{" "}
          <button onClick={() => action({ type: "salvar" })}>Salvar</button>{" "}
        </div>
        {state.animacao ? (
          <div
            style={{
              position: "fixed",
              top: "0",
              right: "0",
              bottom: "0",
              left: "0",
              background: "rgba(255,255,255,.6)",
              zIndex: 1
            }}
            ref={el => {
              if (el) {
                if (
                  document.activeElement &&
                  (document.activeElement as any).blur
                )
                  (document.activeElement as any).blur();
              }
            }}
          />
        ) : null}
        {/*<Monitor />*/}
        <Server />
        <ConexaoDMX {...state.dmx} />
        <Cenas {...state} />
        <div style={{ textAlign: "right", paddingBottom: "5px" }}>
          <input type="text" ref={el => (this.inputEl = el)} />{" "}
          <button onClick={() => this.salvarMesa()}>Salvar</button>
        </div>
        <Mesa canais={state.canais} />
        <Equipamentos
          equipamentoTipos={state.equipamentoTipos}
          equipamentos={state.equipamentos}
          canais={state.canais}
          cenas={state.cenas}
        />
        {/*<Arquivos onChange={arquivos=>this.setArquivos(arquivos)} />*/}
      </div>
    );
  }
}

if ((window as any).destoryGlobalListeners) {
  (window as any).destoryGlobalListeners();
}
(window as any).globalListenersStarted = true;
const listener = (e: any) => {
  const el = e.target;
  if (
    el instanceof HTMLElement &&
    !(el.tagName in { INPUT: 1, TEXTAREA: 1, SELECT: 1, OPTION: 1 })
  ) {
    const el2 = el.closest("[tabindex]");
    if (el2 && el2.getAttribute("tabindex") != "-1") {
      (el2 as any).focus();
    } else if (
      document.activeElement &&
      !(document.activeElement.tagName in { HTML: 1, BODY: 1 })
    ) {
      const el = document.activeElement;
      if (el && (el as any).blur) (el as any).blur();
    }
    e.preventDefault();
  }
};
window.addEventListener("mousedown", listener);
(window as any).destoryGlobalListeners = () => {
  window.removeEventListener("mousedown", listener);
};
