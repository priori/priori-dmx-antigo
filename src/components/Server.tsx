import * as React from "react";
import {action} from "../util/action";

const os = require("os");
const ifaces = os.networkInterfaces();

export interface ServerState {
  abrindo: boolean;
  fechando: boolean;
}
export interface ServerProps {
    open: boolean,
    port: number
}

export class Server extends React.Component<ServerProps, ServerState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      abrindo: false,
      fechando: false
    };
  }
  port: null | HTMLInputElement = null;

  componentWillReceiveProps(){
    this.setState({abrindo:false,fechando:false});
  }

  iniciar() {
    if (this.state.abrindo) return;
    const el = this.port;
    if (!el) return;
    const port = parseInt(el.value);
    action({type:"http-open",port});
    this.setState({
        ...this.state,
        abrindo: true
    });
  }

  parar() {
    if (this.state.fechando) return;
    this.setState({
      ...this.state,
      fechando: true
    });
    action({type:"http-close"});
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
        style={{ opacity: this.state.fechando || this.state.abrindo ? 0.5 : 1 }}
        className="servidor-http"
      >
        {networkAddress
          ? "http://" + networkAddress[networkAddress.length - 1] + ":"
          : "Port: "}
        <input
          type="number"
          readOnly={this.state.abrindo || this.state.fechando || this.props.open}
          defaultValue="8080"
          ref={el => (this.port = el)}
        />{" "}
        {this.props.open ? (
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
