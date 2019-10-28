import * as React from "react";
import { action } from "../util/action";
import { TampaState } from "../types/internal-state";

export class Tampa extends React.Component<
  TampaState,
  {
    open: boolean;
  }
> {
  constructor(props: TampaState) {
    super(props);
    this.state = {
      open: false
    };
  }

  openClose() {
    this.setState({
      ...this.state,
      open: !this.state.open
    });
  }

  render() {
    return (
      <div className="tampa">
        <button onClick={() => this.openClose()}>
          Tampa {this.props.aberto ? "Aberta" : "Fechada"}{" "}
          {this.props.abrindo && this.props.fechando
            ? " (Abrindo, Fechando)"
            : this.props.abrindo
            ? " (Abrindo)"
            : this.props.fechando
            ? " (Fechando)"
            : " (Abrindo, Fechando)"}{" "}
          <i className="fa fa-cog" />
        </button>
        {this.state.open ? (
          <div
            className="over-frame"
            style={{
              width: "380px",
              top: "19px",
              right: "6px",
              lineHeight: "2.4em"
            }}
          >
            Abrir Endpoint:{" "}
            <input
              type="text"
              style={{ float: "right", width: "260px" }}
              defaultValue={this.props.abrirEndPoint}
            />
            <br />
            Fechar Endpoint:{" "}
            <input
              type="text"
              style={{ float: "right", width: "260px" }}
              defaultValue={this.props.fecharEndPoint}
            />
            <br />
            Delay Para Vídeo ao Abrir:{" "}
            <input
              type="number"
              defaultValue={this.props.tampaPlayDelay + ""}
              style={{ width: "50px" }}
            />
            <br />
            Tempo para Abrir / Fechar:{" "}
            <input
              type="number"
              defaultValue={this.props.tampaTime + ""}
              style={{ width: "50px" }}
            />
            <div
              style={{
                lineHeight: "1.6em",
                marginBottom: "10px",
                marginTop: "2px"
              }}
            >
              <button style={{ float: "right" }}>
                Forçar Situação {this.props.aberto ? "Fechada" : "Aberta"}
              </button>
              Situação Atual:
              <br />
              <span className="tampa__state">
                Tampa {this.props.aberto ? "Aberta" : "Fechada"}{" "}
                {this.props.abrindo && this.props.fechando
                  ? " (Abrindo, Fechando)"
                  : this.props.abrindo
                  ? " (Abrindo)"
                  : this.props.fechando
                  ? " (Fechando)"
                  : ""}
              </span>
            </div>
            <div style={{ lineHeight: "1.3em" }}>
              Chamar API Manualmente / Testar API: <br />
              <input
                type="text"
                style={{ width: "250px" }}
                defaultValue={this.props.teste1}
              />{" "}
              <button>Salvar &amp; Executar</button>
              <input
                type="text"
                style={{ width: "250px", marginTop: "3px" }}
                defaultValue={this.props.teste2}
              />{" "}
              <button>Salvar &amp; Executar</button>
            </div>
            <button>Salvar</button>{" "}
            <button onClick={() => this.openClose()}>Cancelar</button>
            <br />
          </div>
        ) : null}
      </div>
    );
  }
}
