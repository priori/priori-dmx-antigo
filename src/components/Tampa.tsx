import * as React from "react";
import { action } from "../util/action";
import { TampaState } from "../types/internal-state";

export class Tampa extends React.Component<
  TampaState,
  {
    open: boolean;
    abrirEndPoint: string;
    fecharEndPoint: string;
    tampaTime: number;
    tampaPlayDelay: number;
    teste2: string;
    teste1: string;
  }
> {
  constructor(props: TampaState) {
    super(props);
    this.state = {
      open: false,
      abrirEndPoint: props.abrirEndPoint,
      fecharEndPoint: props.fecharEndPoint,
      tampaPlayDelay: props.tampaPlayDelay,
      tampaTime: props.tampaTime,
      teste1: props.teste1,
      teste2: props.teste2
    };
  }

  openClose() {
    this.setState({
      ...this.state,
      open: !this.state.open,
      abrirEndPoint: this.props.abrirEndPoint,
      fecharEndPoint: this.props.fecharEndPoint,
      tampaPlayDelay: this.props.tampaPlayDelay,
      tampaTime: this.props.tampaTime,
      teste1: this.props.teste1,
      teste2: this.props.teste2
    });
  }

  executar1(){
    action({type: "executar1", teste1: this.state.teste1});
  }

  executar2(){
    action({type: "executar2", teste2: this.state.teste2});
  }

  fecharTampa(){
    action({type: "fechar-tampa" } );

  }

  abrirTampa(){
    action({type: "abrir-tampa" } );
  }

  salvar(){
    if ( this.state.tampaPlayDelay < 1 || this.state.tampaPlayDelay > 30000 ) {
      alert("Delay para o vídeo abrir inválido "+this.state.tampaPlayDelay+"." + (this.state.tampaPlayDelay>30000?"\nValor muito alto.":""))
      return;
    }
    if ( this.state.tampaTime < 1 || this.state.tampaTime > 30000 ) {
      alert("Tempo de Abrir / Fechar a Tampa inválido "+this.state.tampaTime+"." + (this.state.tampaTime>30000?"\nValor muito alto.":""))
      return;
    }
    if ( !this.state.abrirEndPoint ) {
      alert("Endpoint para abertura inválido.");
      return;
    }
    if ( !this.state.fecharEndPoint ) {
      alert("Endpoint para fechar inválido.");
      return;
    }
    action({
      type: "configurar-tampa",
      abrirEndPoint: this.state.abrirEndPoint,
      fecharEndPoint: this.state.fecharEndPoint,
      tampaPlayDelay: this.state.tampaPlayDelay,
      tampaTime: this.state.tampaTime
    });
    this.setState({
        ...this.state,
      open: false
    })
  }

  render() {
    return (
      <div className="tampa">
        <button onClick={() => this.openClose()}>
          Tampa {
            this.props.abrindo ? <strong>Abrindo...</strong> :
            this.props.fechando ? <strong>Fechando...</strong> :
            this.props.aberto ? "Aberta" : "Fechada"}{" "}
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
            <div style={{overflow:"hidden"}}>
            Abrir Endpoint:{" "}
            <span style={{float: "right"}}>
            <input
              type="text"
              style={{ width: "260px" }}
              defaultValue={this.state.abrirEndPoint}
              onChange={(e:any) => {
                this.setState({
                  ...this.state,
                  abrirEndPoint: e.target.value
                })}
              }
            /><div style={{
              lineHeight: "1em",
              marginBottom: "6px",
              textAlign: "right"}}>
              <i className="fa fa-arrow-right" style={{color:"#888"}} />{" "}
              {this.props.abrirEndPoint}
            </div>
            </span>
          </div>
            <div style={{overflow:"hidden"}}>
            Fechar Endpoint:{" "}
              <span style={{float: "right"}}>
            <input
              type="text"
              style={{ width: "260px" }}
              defaultValue={this.state.fecharEndPoint}
              onChange={(e:any) => {
                this.setState({
                    ...this.state,
                  fecharEndPoint: e.target.value
                })}
              }
            /><div style={{
                lineHeight: "1em",
                marginBottom: "6px",
                textAlign: "right"}}>
              <i className="fa fa-arrow-right" style={{color:"#888"}} />{" "}
                {this.props.fecharEndPoint}
              </div>
              </span>
            </div>
            Delay Para Vídeo ao Abrir:{" "}
            <input
              type="number"
              defaultValue={this.state.tampaPlayDelay + ""}
              onChange={(e: any) => {
                this.setState({
                  ...this.state,
                  tampaPlayDelay: parseInt(e.target.value)
                })
              }
              }
              style={{ width: "50px" }}
            />
            <br />
            Tempo de Abrir / Fechar a Tampa (Lock interno):{" "}
            <input
              type="number"
              defaultValue={this.state.tampaTime + ""}
              onChange={(e: any) => {
                this.setState({
                  ...this.state,
                  tampaTime: parseInt(e.target.value)
                })
              }
              }
              style={{ width: "50px" }}
            />
            <br/>
            <button onClick={()=>this.salvar()}>Salvar</button>{" "}
            <button onClick={() => this.openClose()}>Cancelar</button>
            <div
              style={{
                borderTop: "1px solid #ccc",
                paddingTop: "10px",
                lineHeight: "1.6em",
                marginBottom: "8px",
                marginTop: "8px"
              }}
            >
              <button style={{ float: "right" }} onClick={()=>{
                if ( this.props.aberto )
                  this.fecharTampa();
                else
                  this.abrirTampa();
              }}>
                Sobrescrever Situação como {this.props.aberto ? "Fechada" : "Aberta"}
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
                defaultValue={this.state.teste1}
                onChange={(e:any)=>{
                  this.setState({
                      ...this.state,
                    teste1: e.target.value
                  });
                }}
              />{" "}
              <button onClick={()=>this.executar1()}>Executar</button>
              <input
                type="text"
                style={{ width: "250px", marginTop: "3px" }}
                defaultValue={this.state.teste2}
                onChange={(e:any)=>{
                  this.setState({
                    ...this.state,
                    teste2: e.target.value
                  });
                }}
              />{" "}
              <button onClick={()=>this.executar2()}>Executar</button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}
