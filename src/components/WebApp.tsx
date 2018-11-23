import * as React from "react";
// import {Monitor} from './Monitor'
import { ConexaoDMX } from "./ConexaoDMX";
import { Mesa } from "./Mesa";
import { Equipamentos } from "./equipamentos/Equipamentos";
import { AppInternalState } from "../types/internal-state";
import { Cenas } from "./Cenas";
import { action } from "../util/action";
import { deepFreeze } from "../util/equals";
import { Arquivos } from "./Arquivos";

export interface WebAppState {
  appState: AppInternalState | null;
  ws: boolean;
  mesaAberta: boolean;
  equipamentosAberto: boolean;
}

export class WebApp extends React.Component<{ closed: boolean }, WebAppState> {
  private socket: WebSocket;
  constructor(props: {}) {
    super(props);
    this.state = {
      appState: null,
      ws: false,
      mesaAberta: false,
      equipamentosAberto: false
    };
    this.connect();
  }

  connect() {
    const socket = new WebSocket("ws://" + location.host + "/state");
    this.socket = socket;
    socket.onmessage = event => {
      const data = JSON.parse(event.data) as AppInternalState & { ws: boolean };
      deepFreeze(data);
      this.setState({
        ...this.state,
        ws: true,
        appState: data
      });
    };
    socket.onclose = () => {
      this.setState({
        ...this.state,
        ws: false
      });
    };
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
    if (!this.state.appState) return null;
    const state = this.state.appState;
    return (
      <div>
        {state.animacao || !this.state.ws ? (
          <div
            style={{
              position: "fixed",
              top: "0",
              right: "0",
              bottom: "0",
              left: "0",
              background: "rgba(255,255,255,.6)",
              zIndex: 1,
              padding: "58px",
              fontSize: "19px",
              fontWeight: "bold",
              textAlign: "center"
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
            onClick={() => {
              if (!this.state.ws) this.connect();
            }}
          >
            {!this.state.ws ? "Desconectado" : null}
          </div>
        ) : null}
        <ConexaoDMX {...state.dmx} />
        <Cenas {...state} />
        <div style={{ textAlign: "right", paddingBottom: "5px" }}>
          <input type="text" ref={el => (this.inputEl = el)} />{" "}
          <button onClick={() => this.salvarMesa()}>Salvar</button>
        </div>
        {this.state.mesaAberta ? (
          <div>
            <div
              className="abrir-fechar"
              onClick={() =>
                this.setState({
                  ...this.state,
                  mesaAberta: false
                })
              }
            >
              Mesa +
            </div>
            <Mesa canais={state.canais} />
          </div>
        ) : (
          <div
            onClick={() =>
              this.setState({
                ...this.state,
                mesaAberta: true
              })
            }
            className="abrir-fechar"
          >
            Mesa -
          </div>
        )}
        {this.state.equipamentosAberto ? (
          <div>
            <div
              className="abrir-fechar"
              onClick={() =>
                this.setState({
                  ...this.state,
                  equipamentosAberto: false
                })
              }
            >
              Equipamentos +
            </div>
            <Equipamentos
              equipamentoTipos={state.equipamentoTipos}
              equipamentos={state.equipamentos}
              canais={state.canais}
              cenas={state.cenas}
            />
          </div>
        ) : (
          <div
            onClick={() =>
              this.setState({
                ...this.state,
                equipamentosAberto: true
              })
            }
            className="abrir-fechar"
          >
            Equipamentos -
          </div>
        )}
        <Arquivos
          player={state.player}
          arquivos={state.arquivos}
          showThumbs={false}
          telas={state.telas}
        />
      </div>
    );
  }
}
