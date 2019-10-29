import * as React from "react";
import { Monitor } from "./Monitor";
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
  selected: "cenas" | "player" | "equipamentos" | "mesa" | "conf" | "arquivos";
}

export class WebApp extends React.Component<{}, WebAppState> {
  private socket: WebSocket;
  constructor(props: {}) {
    super(props);
    this.state = {
      appState: null,
      ws: false,
      selected: "cenas"
    };
    this.connect();
  }

  connect() {
    const socket = new WebSocket("ws://" + location.host + "/state");
    (window as any).socket = socket;
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
  select(selected: "cenas" | "player" | "equipamentos" | "mesa" | "conf") {
    this.setState({
      ...this.state,
      selected
    });
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

        <div className="tabs">
          <i
            className={
              "fa fa-image" +
              (this.state.selected == "cenas" ? " selected" : "")
            }
            onClick={() => {
              this.select("cenas");
            }}
          />
          <i
            className={
              "fa fa-play-circle" +
              (this.state.selected == "player" ? " selected" : "")
            }
            onClick={() => {
              this.select("player");
            }}
          />
          <i
            className={
              "fa fa-cubes" +
              (this.state.selected == "equipamentos" ? " selected" : "")
            }
            onClick={() => {
              this.select("equipamentos");
            }}
          />
          <i
            className={
              "fa fa-th" + (this.state.selected == "mesa" ? " selected" : "")
            }
            onClick={() => {
              this.select("mesa");
            }}
          />
          <i
            className={
              "fa fa-cog" + (this.state.selected == "conf" ? " selected" : "")
            }
            onClick={() => {
              this.select("conf");
            }}
          />
        </div>

        <div
          style={{
            display: this.state.selected == "conf" ? undefined : "none"
          }}
        >
          <ConexaoDMX {...state.dmx} />
          <Monitor telas={state.telas} />
        </div>
        <div
          style={{
            display: this.state.selected == "cenas" ? undefined : "none"
          }}
        >
          <Cenas {...state} />

          <div className="cenas__nova-cena-form">
            <input type="text" ref={el => (this.inputEl = el)} />{" "}
            <button onClick={() => this.salvarMesa()}>Salvar</button>
          </div>
        </div>
        <div
          style={{
            display: this.state.selected == "mesa" ? undefined : "none"
          }}
        >
          {this.state.selected == "mesa" ? (
            <Mesa canais={state.canais} />
          ) : null}
        </div>
        <div
          style={{
            display: this.state.selected == "equipamentos" ? undefined : "none"
          }}
        >
          <Equipamentos
            equipamentoTipos={state.equipamentoTipos}
            equipamentos={state.equipamentos}
            canais={state.canais}
            cenas={state.cenas}
          />
        </div>
        <div
          style={{
            display: this.state.selected == "player" ? undefined : "none"
          }}
        >
          <Arquivos
            player={state.player}
            arquivos={state.arquivos}
            showThumbs={false}
            telas={state.telas}
          />
        </div>
      </div>
    );
  }
}
