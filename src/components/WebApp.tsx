import * as React from "react";
// import {Monitor} from './Monitor'
import { ConexaoDMX } from "./ConexaoDMX";
import { Mesa } from "./Mesa";
import { Equipamentos } from "./equipamentos/Equipamentos";
import { AppInternalState } from "../types/internal-state";
import { Cenas } from "./Cenas";
import { action } from "../util/action";
import { deepFreeze } from "../util/equals";
import {Arquivos} from "./Arquivos";
import {Monitor} from "./Monitor";

const empty = {};
export class WebApp extends React.Component<{closed:boolean}, AppInternalState & {ws:boolean} | {}> {
  private socket: WebSocket;
  constructor(props: {}) {
    super(props);
    this.state = empty;
    const socket = new WebSocket("ws://" + location.host + "/state");
    this.socket = socket;
    socket.onmessage = event => {
      const data = JSON.parse(event.data) as AppInternalState&{ws:boolean};
      for (const key in data) {
          if ( typeof data[key] == 'object' && data[key])
              deepFreeze(data[key]);
      }
      data.ws = true;
      this.setState(data);
    };
    socket.onclose = () => {
      this.setState({
          ...this.state,
          ws: false
      });
    }
  }

  componentWillUnmount() {
      this.socket.close();
  }

  inputEl: HTMLInputElement | null = null;
  salvarMesa() {
    const nome = (this.inputEl && this.inputEl.value) || "";
    if (this.inputEl) this.inputEl.value = "";
    action({ type: "salvar-mesa", nome });
  }

  render() {
    if (this.state == empty) return null;
    const state = this.state as AppInternalState&{ws:boolean};
    return (
      <div>
        {state.animacao || !state.ws ? (
          <div
            style={{
              position: "fixed",
              top: "0",
              right: "0",
              bottom: "0",
              left: "0",
              background: "rgba(255,255,255,.6)",
              zIndex: 1,
              padding: '58px',
              fontSize: '19px',
              fontWeight: 'bold',
              textAlign: 'center'
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
          >
              {!state.ws?'Desconectado':null}
          </div>
        ) : null}
        <Monitor telas={state.telas} />
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
        <Arquivos arquivos={state.arquivos} />
      </div>
    );
  }
}
