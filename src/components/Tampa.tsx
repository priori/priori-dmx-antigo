import * as React from "react";
import { action } from "../util/action";
import { TampaState } from "../types/internal-state";

interface TampaFormProps extends TampaState {
  onClose?: () => void;
}
class TampaForm extends React.Component<
  TampaFormProps,
  {
    abrirEndPoint: string;
    fecharEndPoint: string;
    requestWhaitTime: number;
    playDelayTime: number;
    teste2: string;
    teste1: string;
  }
> {
  constructor(props: TampaState) {
    super(props);
    this.state = {
      abrirEndPoint: props.abrirEndPoint,
      fecharEndPoint: props.fecharEndPoint,
      playDelayTime: props.playDelayTime,
      requestWhaitTime: props.requestWhaitTime,
      teste1: props.teste1,
      teste2: props.teste2
    };
  }
  render() {
    return (
      <div>
        <div style={{ overflow: "hidden" }}>
          Abrir Endpoint:{" "}
          <span style={{ float: "right" }}>
            <input
              type="text"
              style={{ width: "260px" }}
              defaultValue={this.state.abrirEndPoint}
              onChange={(e: any) => {
                this.setState({
                  ...this.state,
                  abrirEndPoint: e.target.value
                });
              }}
            />
            <div
              style={{
                lineHeight: "1em",
                marginBottom: "6px",
                textAlign: "right"
              }}
            >
              {this.props.abrirEndPointFinal ? (
                <span>
                  <i className="fa fa-check" style={{ color: "#888" }} />{" "}
                  {this.props.abrirEndPointFinal}
                </span>
              ) : (
                <span>
                  <i className="fa fa-close" /> {this.props.abrirEndPoint}
                </span>
              )}
            </div>
          </span>
        </div>
        <div style={{ overflow: "hidden" }}>
          Fechar Endpoint:{" "}
          <span style={{ float: "right" }}>
            <input
              type="text"
              style={{ width: "260px" }}
              defaultValue={this.state.fecharEndPoint}
              onChange={(e: any) => {
                this.setState({
                  ...this.state,
                  fecharEndPoint: e.target.value
                });
              }}
            />
            <div
              style={{
                lineHeight: "1em",
                marginBottom: "6px",
                textAlign: "right"
              }}
            >
              {this.props.fecharEndPointFinal ? (
                <span>
                  <i className="fa fa-check" style={{ color: "#888" }} />{" "}
                  {this.props.fecharEndPointFinal}
                </span>
              ) : (
                <span>
                  <i className="fa fa-close" /> {this.props.fecharEndPoint}
                </span>
              )}
            </div>
          </span>
        </div>
        Delay Para Vídeo ao Abrir:{" "}
        <input
          type="number"
          defaultValue={this.state.playDelayTime + ""}
          onChange={(e: any) => {
            this.setState({
              ...this.state,
              playDelayTime: parseInt(e.target.value)
            });
          }}
          style={{ width: "50px" }}
        />
        <br />
        Tempo de Abrir / Fechar a Tampa (Lock interno):{" "}
        <input
          type="number"
          defaultValue={this.state.requestWhaitTime + ""}
          onChange={(e: any) => {
            this.setState({
              ...this.state,
              requestWhaitTime: parseInt(e.target.value)
            });
          }}
          style={{ width: "50px" }}
        />
        <br />
        <button onClick={() => this.salvar()}>Salvar</button>{" "}
        <button onClick={() => this.cancelar()}>Cancelar</button>
        <div
          style={{
            borderTop: "1px solid #ccc",
            paddingTop: "10px",
            lineHeight: "1.6em",
            marginBottom: "8px",
            marginTop: "8px"
          }}
        >
          <button
            style={{ float: "right" }}
            onClick={() => {
              if (this.props.aberto) this.fecharTampa();
              else this.abrirTampa();
            }}
          >
            Sobrescrever Situação como{" "}
            {this.props.aberto ? "Fechada" : "Aberta"}
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
            style={{ width: "240px" }}
            defaultValue={this.state.teste1}
            onChange={(e: any) => {
              this.setState({
                ...this.state,
                teste1: e.target.value
              });
            }}
          />{" "}
            <button onClick={() => this.executar1()}>Executar</button>{" "}
            <button onClick={() => this.salvar1()}>Salvar</button><br/>
          <input
            type="text"
            style={{ width: "240px", marginTop: "3px" }}
            defaultValue={this.state.teste2}
            onChange={(e: any) => {
              this.setState({
                ...this.state,
                teste2: e.target.value
              });
            }}
          />{" "}
            <button onClick={() => this.executar2()}>Executar</button>{" "}
            <button onClick={() => this.salvar2()}>Salvar</button>
        </div>
      </div>
    );
  }

    executar1() {
        action({ type: "executar1", teste1: this.state.teste1 });
    }

    executar2() {
        action({ type: "executar2", teste2: this.state.teste2 });
    }

    salvar1() {
        action({ type: "tampa-salvar1", teste1: this.state.teste1 });
    }

    salvar2() {
        action({ type: "tampa-salvar2", teste2: this.state.teste2 });
    }

  fecharTampa() {
    action({ type: "fechar-tampa" });
  }

  abrirTampa() {
    action({ type: "abrir-tampa" });
  }

  salvar() {
    if (this.state.playDelayTime < 1 || this.state.playDelayTime > 30000) {
      alert(
        "Delay para o vídeo abrir inválido " +
          this.state.playDelayTime +
          "." +
          (this.state.playDelayTime > 30000 ? "\nValor muito alto." : "")
      );
      return;
    }
    if (
      this.state.requestWhaitTime < 1 ||
      this.state.requestWhaitTime > 30000
    ) {
      alert(
        "Tempo de Abrir / Fechar a Tampa inválido " +
          this.state.requestWhaitTime +
          "." +
          (this.state.requestWhaitTime > 30000 ? "\nValor muito alto." : "")
      );
      return;
    }
    if (!this.state.abrirEndPoint) {
      alert("Endpoint para abertura inválido.");
      return;
    }
    if (!this.state.fecharEndPoint) {
      alert("Endpoint para fechar inválido.");
      return;
    }
    action({
      type: "configurar-tampa",
      abrirEndPoint: this.state.abrirEndPoint,
      fecharEndPoint: this.state.fecharEndPoint,
      playDelayTime: this.state.playDelayTime,
      requestWhaitTime: this.state.requestWhaitTime
    });
    this.setState({
      ...this.state
    });
    if (this.props.onClose) this.props.onClose();
  }

  private cancelar() {
    this.setState({
      ...this.state,
      abrirEndPoint: this.props.abrirEndPoint,
      fecharEndPoint: this.props.fecharEndPoint,
      playDelayTime: this.props.playDelayTime,
      requestWhaitTime: this.props.requestWhaitTime
    });
    if (this.props.onClose) this.props.onClose();
  }
}

export interface TampaProps extends TampaState {
  open?: boolean;
}

export class Tampa extends React.Component<
  TampaProps,
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
      open: !this.state.open
    });
  }

  render() {
    if (this.props.open) {
      return (
        <div className="tampa">
          <h1>Tampa</h1>
          <TampaForm {...this.props} />
        </div>
      );
    }
    return (
      <div className="tampa">
        <button onClick={() => this.openClose()}>
          Tampa{" "}
          {this.props.abrindo ? (
            <strong>Abrindo...</strong>
          ) : this.props.fechando ? (
            <strong>Fechando...</strong>
          ) : this.props.aberto ? (
            "Aberta"
          ) : (
            "Fechada"
          )}
          {this.props.uriWildcardsState == "pending"
            ? "..."
            : this.props.uriWildcardsState == "fail"
            ? "!" :
            this.props.requesting ? "*"
            : ""}{" "}
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
            <TampaForm
              {...this.props}
              onClose={() => this.setState({ open: false })}
            />
          </div>
        ) : null}
      </div>
    );
  }
}
