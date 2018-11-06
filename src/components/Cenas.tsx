import * as React from "react";
import { AppState, Cena } from "../types";
import { action } from "../util/action";
import {FastInput} from "./util/FastInput";

export interface CenasState {
  editandoTempo: number;
  editandoNome: number;
}

export class Cenas extends React.Component<AppState, CenasState> {
  constructor(props: AppState) {
    super(props);
    this.state = {
      editandoNome: -1,
      editandoTempo: -1
    };
  }

  aplicar(uid: number) {
    action({ type: "aplicar-cena-agora", uid });
  }

  transicao(uid: number) {
    action({ type: "transicao-para-cena", uid });
  }

  salvarCena(uid: number) {
    action({ type: "salvar-cena", uid });
  }

  novoNome(uid: number, nome: string) {
    action({ type: "editar-nome-da-cena", uid, nome });
    // ipcRenderer.send('editar-nome-da-cena',{uid,nome});
    this.setState({
      ...this.state,
      editandoNome: -1
    });
  }

  novoTempo(uid: number, tempo: number) {
    if ( tempo < 0 ) {
      alert('Valor inválido!');
      return;
    }
    action({ type: "editar-tempo-da-cena", uid, tempo });
    this.setState({
      ...this.state,
      editandoTempo: -1
    });
  }

  render() {
    return (
      <div style={{ lineHeight: "2.5em" }} className="cenas">
        {/*<h1 style={{ margin: "0" }}>Cenas</h1>*/}
        {this.props.cenas && this.props.cenas.length ? (
          <table>
            <tbody>
              {this.props.cenas.map((cena: Cena) => (
                <tr
                  key={cena.uid}
                  className={
                    "cena" +
                    (cena.uid == this.props.ultimaCena ? " selected" : "")
                  }
                >
                  <th>
                    {this.state.editandoNome == cena.uid ? (
                      <FastInput
                          className="cena__nome"
                        initialValue={cena.nome}
                        onChange={(value:string) => {
                          this.novoNome(cena.uid, value)
                        } }
                        onCancel={()=>{
                            this.setState({
                                ...this.state,
                                editandoNome: -1
                            });
                        }}
                      />
                    ) : (
                      <span
                        onDoubleClick={() =>
                          this.setState({
                            ...this.state,
                            editandoNome: cena.uid
                          })
                        }
                      >
                        {cena.nome}
                      </span>
                    )}
                      <i className="fa fa-close" onClick={()=>this.removeCena(cena.uid)}/>
                  </th>
                  <td style={{ width: "74px" }}>
                    {this.state.editandoTempo == cena.uid ? (
                      <FastInput
                        type="number"
                        initialValue={cena.transicaoTempo + "" || "0"}
                        style={{ width: "60px" }}
                        onChange={ value =>
                          this.novoTempo(cena.uid, parseInt(value))
                        }
                        onCancel={()=> this.setState({ ...this.state, editandoTempo: -1 }) }
                      />
                    ) : (
                      <span
                        onDoubleClick={() =>
                          this.setState({
                            ...this.state,
                            editandoTempo: cena.uid
                          })
                        }
                      >
                        {cena.transicaoTempo || 0}
                        ms
                      </span>
                    )}
                  </td>
                  <td style={{ width: "53px" }}>
                    {this.props.ultimaCena == cena.uid ? (
                      <button onClick={() => this.salvarCena(cena.uid)}>
                        Salvar
                      </button>
                    ) : null}
                  </td>
                  <td style={{ width: "53px" }}>
                    <button onClick={() => this.aplicar(cena.uid)}>
                      Agora
                    </button>
                  </td>
                  <td style={{ width: "71px" }}>
                    <button onClick={() => this.transicao(cena.uid)}>
                      Transição
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    );
  }

    private removeCena(uid: number) {
        if ( confirm('Realmente deseja remover esta cena?') ){
            action({type:'remove-cena',uid})
        }
    }
}
