import * as React from "react";
import { Equipamento, EquipamentoTipo } from "../types";
import { rgb2Color, rgbw2Color } from "../util/cores";
import { action } from "../util/action";

export interface EquipamentosState {
  monitorCriado: boolean;
}

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
    onSubmit: (nome: string, tipo: EquipamentoTipo, inicio: number) => void;
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
      tipo: "glow64"
    };
  }

  render() {
    return (
      <div>
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
        </button>
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

export class Equipamentos extends React.Component<EquipamentosProps, any> {
  constructor(props: { equipamentos: Equipamento[] }) {
    super(props);
    this.state = {
      add: false,
      canais: {}
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
        <h2 style={{ margin: 0, marginTop: "10px", fontSize: "inherit" }}>
          Equipamentos{" "}
          <strong style={{ float: "right" }} onClick={() => this.add()}>
            +
          </strong>
        </h2>
        {this.state.add ? (
          <AddForm
            onSubmit={(nome: string, tipo: EquipamentoTipo, inicio: number) => {
              action({ type: "create-equipamento", nome, inicio, tipo });
              this.setState({ add: false });
            }}
          />
        ) : (
          undefined
        )}
        <div className="equipamentos">
          {this.props.equipamentos.map((e: Equipamento, index: number) => (
            <div className="equipamento" key={index}>
              <div className="equipamento__main">
                <strong style={{ fontSize: "12px" }}>{e.nome}</strong>
                <br />
                <input
                  type="color"
                  value={this.cor(e) || "#000000"}
                  onChange={(event: any) =>
                    this.changeColor(e, event.target.value)
                  }
                />
                <br />
                <br />
                <strong style={{ fontSize: "20px" }}>{e.inicio}</strong>
              </div>
              <div className="equipamento__canais">
                {e.tipo == "glow64"
                  ? glow64Canais.map((ec: EquipamentoCanal, index: number) => (
                      <div
                        key={index}
                        className={"equipamento__canal " + ec.name}
                      >
                        <span className="equipamento__canal__index ">
                          {e.inicio + index}
                        </span>
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
                        <span className="equipamento__canal__valor">
                          {typeof this.state.canais[index + e.inicio] !=
                          "undefined"
                            ? this.state.canais[e.inicio + index]
                            : this.props.canais[index + e.inicio] || "0"}
                        </span>
                      </div>
                    ))
                  : par16Canais.map((ec: EquipamentoCanal, index: number) => (
                      <div
                        key={index}
                        className={"equipamento__canal " + ec.name}
                      >
                        <span className="equipamento__canal__index">
                          {e.inicio + index}
                        </span>
                        <input
                          onChange={(event: any) =>
                            this.updateCanal(
                              index + e.inicio,
                              event.target.value
                            )
                          }
                          type="range"
                          className="equipamento__canal__input"
                          min="0"
                          max="255"
                          value={
                            typeof this.state.canais[index + e.inicio] !=
                            "undefined"
                              ? this.state.canais[e.inicio + index]
                              : this.props.canais[index + e.inicio] || "0"
                          }
                        />
                        <span className="equipamento__canal__valor">
                          {typeof this.state.canais[index + e.inicio] !=
                          "undefined"
                            ? this.state.canais[e.inicio + index]
                            : this.props.canais[index + e.inicio] || "0"}
                        </span>
                      </div>
                    ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  private updateCanal(index: number, val: string) {
    const value = parseInt(val);
    this.setState({
      ...this.state,
      canais: {
        ...this.state.canais,
        [index]: val
      }
    });
    action({ type: "slide", index, value });
  }

  private cor(e: Equipamento) {
    return buildCor(e, this.props.canais);
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
