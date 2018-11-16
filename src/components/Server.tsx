import * as React from "react";

const os = require("os");
const ifaces = os.networkInterfaces();
const express = require("express");
const app = express();

app.get("/", (_: any, res: any) => {
  res.json({ asdfasdf: 1 });
});

export interface ServerState {
  executando: boolean;
  fechando: boolean;
}

let listening: any = null;

export class Server extends React.Component<{}, ServerState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      executando: false,
      fechando: false
    };
  }
  closing = false;
  port: null | HTMLInputElement = null;

  iniciar() {
    const el = this.port;
    if (!el) return;
    listening = app.listen(parseInt(el.value));
    this.setState({
      ...this.state,
      executando: true
    });
  }

  parar() {
    if (this.state.fechando) return;
    this.setState({
      ...this.state,
      fechando: true
    });
    if (listening)
      listening.close(() => {
        listening = null;
        this.setState({
          fechando: false,
          executando: false
        });
      });
    listening = null;
  }

  render() {
    let networkAddress = [] as string[];
    for (let name in ifaces) {
      for (const network of ifaces[name]) {
        const { address } = network;
        if (
          address.match(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/) &&
          address != "127.0.0.1" &&
          !address.endsWith(".0")
        ) {
          networkAddress.push(address);
        }
      }
    }
    return (
      <div
        style={{ opacity: this.state.fechando ? 0.5 : 1 }}
        className="servidor-http"
      >
        {networkAddress
          ? "http://" + networkAddress[networkAddress.length - 1] + ":"
          : "Port: "}
        <input
          type="number"
          readOnly={this.state.executando}
          defaultValue="8080"
          ref={el => (this.port = el)}
        />{" "}
        {this.state.executando ? (
          <span>
            <strong>Executando...</strong>{" "}
            <button onClick={() => this.parar()}>Parar</button>
          </span>
        ) : (
          <button onClick={() => this.iniciar()}>Iniciar</button>
        )}{" "}
        {networkAddress.length > 1
          ? "ou " +
            networkAddress
              .filter((_, i) => i != networkAddress.length - 1)
              .join(",")
          : ""}
      </div>
    );
  }
}
