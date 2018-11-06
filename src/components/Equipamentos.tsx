import * as React from "react";
import { Equipamento, EquipamentoTipo } from "../types";
import { rgb2Color, rgbw2Color } from "../util/cores";
import { action } from "../util/action";
import {FastInput} from "./util/FastInput";

interface EquipamentoCanal {
  name: string;
}

const glow64Canais: EquipamentoCanal[] = [
  { name: "red" },
  { name: "green" },
  { name: "blue" },
  { name: "white" },
  { name: "master" },
  { name: "piscar" },
  { name: "hue" },
  { name: "animacao" }
];

const par16Canais: EquipamentoCanal[] = [
  { name: "master" },
  { name: "red" },
  { name: "green" },
  { name: "blue" }
];

class AddForm extends React.Component<
  {
    onSubmit: (nome: string, tipo: EquipamentoTipo, inicio: number) => void,
      onCancelar: ()=>void
  },
  {
    tipo: EquipamentoTipo;
    nome: string;
    inicio: number;
  }
> {
  constructor(props: any) {
    super(props);
    this.state = {
      inicio: 1,
      nome: "",
      tipo: "glow64",

    };
  }

  render() {
    return (
      <div className="add-form">
        Nome:{" "}
        <input
          type="text"
          value={this.state.nome}
          onChange={e =>
            this.setState({ ...this.state, nome: (e.target as any).value })
          }
        />
        <br />
        Início:{" "}
        <input
          type="number"
          value={this.state.inicio}
          onChange={e =>
            this.setState({
              ...this.state,
              inicio: parseInt((e.target as any).value)
            })
          }
        />
        <br />
        Tipo:{" "}
        <select
          onChange={(e: any) =>
            this.setState({ ...this.state, tipo: e.target.value })
          }
          value={this.state.tipo}
        >
          <option value="glow64">LED 64 GLOW</option>
          <option value="par16">PAR LED 16</option>
        </select>
        <br />
        <button
          onClick={() =>
            this.props.onSubmit(
              this.state.nome,
              this.state.tipo,
              this.state.inicio
            )
          }
        >
          Incluir
        </button>{' '}
          <button onClick={()=>this.props.onCancelar()}>Cancelar</button>
      </div>
    );
  }
}

export interface EquipamentosProps {
  equipamentos: Equipamento[];
  canais: {
    [key: number]: number;
  };
}

export interface EquipamentosState {
    add: boolean,
    canais: {[key:number]: number},
    editNome: number,
    editInicio: number
}

export class Equipamentos extends React.Component<EquipamentosProps,EquipamentosState> {
  constructor(props:EquipamentosProps) {
    super(props);
    this.state = {
      add: false,
      canais: {},
      editNome: -1,
        editInicio: -1
    };
  }

  add() {
    this.setState({
      ...this.state,
      add: true
    });
  }

  componentWillReceiveProps(nextProps: EquipamentosProps) {
    this.setState({
      ...this.state,
      canais: { ...nextProps.canais }
    });
  }

  changeColor(equipamento: Equipamento, cor: string) {
    action({ type: "change-color", equipamento: equipamento.uid, cor });
  }

  render() {
    return (
      <div>
        <div style={{textAlign:'right',marginTop:'11px'}}>
          {/*Equipamentos{" "}*/}
          <button onClick={() => this.add()}>
            Novo Equipamento
          </button>
        </div>
        {this.state.add ? (
          <AddForm
            onSubmit={(nome: string, tipo: EquipamentoTipo, inicio: number) => {
              action({ type: "create-equipamento", nome, inicio, tipo });
              this.setState({ ...this.state, add: false });
            }}
            onCancelar={()=>this.setState({ ...this.state, add:false})}
          />
        ) : (
          undefined
        )}
        <div className="equipamentos">
          {this.props.equipamentos.map((e: Equipamento, index: number) => (
            <div className="equipamento" key={index}>
              <div className="equipamento__main">
                  {
                      this.state.editNome == e.uid ?
                          <FastInput className="equipamento__nome"
                                 initialValue={e.nome}
                                 style={{ width: "60px" }}
                                 onChange={(value:string) =>
                                     this.novoNome(e.uid, value)
                                 }
                                 onCancel={()=>{
                                     this.setState({
                                         ...this.state,
                                         editNome: -1
                                     });
                                 }}
                          />
                          :
                          <div className="equipamento__nome">{e.nome} <i className="fa fa-pencil" onClick={()=>this.editNome(e.uid)} /></div>
                  }
                <input
                  type="color"
                  value={this.cor(e) || "#000000"}
                  onChange={(event: any) =>
                    this.changeColor(e, event.target.value)
                  }
                />
                  {this.state.editInicio == e.uid ?
                      <FastInput
                          className="equipamento__inicio"
                          initialValue={e.inicio+''}
                          type="number"
                          onChange={(val)=>{
                              const i = parseInt(val);
                              if ( i <= 0 || !i || i > 255 ) {
                                  alert('Valor inválido!');
                              } else {
                                  action({type:'equipamento-editar-inicio',uid:e.uid,inicio:i});
                              }
                              this.setState({...this.state,editInicio:-1});
                          }}
                          onCancel={()=>{
                              this.setState({...this.state,editInicio:-1});
                          }}
                      />
                  :
                      <span className="equipamento__inicio"
                            onDoubleClick={()=>this.setState({...this.state,
                                editInicio: e.uid})}>{e.inicio}</span>
                  }
              </div>
              <div className="equipamento__canais">
                {(e.tipo == "glow64"
                  ? glow64Canais : par16Canais).map((ec: EquipamentoCanal, index: number) => (
                      <div
                        key={index}
                        className={"equipamento__canal " + ec.name}
                      >
                        <div className="equipamento__canal__index ">
                          {e.inicio + index}
                        </div>
                          <div className="equipamento__canal__input__wrapper">
                        <input
                          onChange={(event: any) =>
                            this.updateCanal(
                              index + e.inicio,
                              event.target.value
                            )
                          }
                          type="range"
                          min="0"
                          className="equipamento__canal__input"
                          max="255"
                          value={
                            typeof this.state.canais[index + e.inicio] !=
                            "undefined"
                              ? this.state.canais[e.inicio + index]
                              : this.props.canais[index + e.inicio] || "0"
                          }
                        />
                          </div>
                        <div className="equipamento__canal__valor">
                          {typeof this.state.canais[index + e.inicio] !=
                          "undefined"
                            ? this.state.canais[e.inicio + index]
                            : this.props.canais[index + e.inicio] || "0"}
                        </div>
                      </div>
                    )) }
                  <i className="fa fa-close" onClick={()=>this.removeEquipamento(e.uid)}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  private removeEquipamento(uid:number){
      if ( confirm('Realmente deseja remover este equipamento?') ){
          action({type:'remove-equipamento',uid})
      }
  }

  private updateCanal(index: number, val: string) {
    const value = parseInt(val);
    this.setState({
      ...this.state,
      canais: {
        ...this.state.canais,
        [index]: value
      }
    });
    action({ type: "slide", index, value });
  }

  private cor(e: Equipamento) {
    return buildCor(e, this.props.canais);
  }

  private editNome(uid: number) {
    return this.setState({
      ...this.state,
      editNome: uid
    });
  }

  private novoNome(uid: any, value: any) {
    action({type:"editar-equipamento-nome",uid,nome:value});
    this.setState({
        ...this.state,
        editNome: -1
    });
  }
}

function buildCor(e: Equipamento, canais: { [k: number]: number }) {
  if (e.tipo == "glow64") {
    if (canais[e.inicio + 6] || canais[e.inicio + 7]) {
      return null;
    }
    const master = canais[e.inicio + 4] / 255,
      r = canais[e.inicio] * master,
      g = canais[e.inicio + 1] * master,
      b = canais[e.inicio + 2] * master,
      w = canais[e.inicio + 3] * master;
    return rgbw2Color(r, g, b, w);
  } else {
    const master = canais[e.inicio] / 255,
      r = canais[e.inicio + 1] * master,
      g = canais[e.inicio + 2] * master,
      b = canais[e.inicio + 3] * master;
    return rgb2Color(r, g, b);
  }
}
