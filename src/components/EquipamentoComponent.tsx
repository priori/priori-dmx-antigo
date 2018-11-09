import * as React from "react";
import { FastInput } from "./util/FastInput";
import { Cena, Equipamento, EquipamentoTipo } from "../types";
import { action } from "../util/action";
import { SoftPanel } from "./util/SoftPanel";
import { buildCor } from "../util/cores";

export interface EquipamentoComponentProps {
  equipamento: Equipamento;
  tipo: EquipamentoTipo;
  canais: { [key: number]: number };
  cenas: Cena[];
}
export interface EquipamentoComponentState {
  canais: { [key: number]: number };
  editNome: boolean;
  editInicio: boolean;
  salvarConfiguracao: boolean;
}

interface SalvarConfiguracaoProps {
  equipamento: Equipamento;
  tipo: EquipamentoTipo;
  onClose: () => void;
  cenas: Cena[];
}
interface SalvarConfiguracaoState {
  tipo: string;
  nome: string;
  cenaUid: number;
}
class SalvarConfiguracao extends React.Component<
  SalvarConfiguracaoProps,
  SalvarConfiguracaoState
> {
  constructor(props: SalvarConfiguracaoProps) {
    super(props);
    this.state = {
      tipo: "",
      nome: "",
      cenaUid: -1
    };
  }
  private salvar() {
    const nome = this.state.nome;
    if (this.state.tipo == "neste") {
      action({
        type: "salvar-equipamento-configuracao",
        uid: this.props.equipamento.uid,
        nome
      });
    } else if (this.state.tipo == "tipo") {
      action({
        type: "salvar-equipamento-tipo-configuracao",
        uid: this.props.equipamento.uid,
        nome
      });
    } else if (this.state.tipo == "cena") {
      if (this.state.cenaUid == -1) {
        alert("Escolha uma cena para salvar.");
        return;
      }
      action({
        type: "adicionar-equipamento-a-cena",
        uid: this.props.equipamento.uid,
        nome,
        cenaUid: this.state.cenaUid
      });
    } else if (this.state.tipo == "novacena") {
      action({
        type: "criar-cena-equipamento",
        uid: this.props.equipamento.uid,
        nome
      });
    } else {
      alert("Escolha onde salvar a configuração.");
    }
  }
  render() {
    return (
      <SoftPanel
        onBlur={() => {
          this.props.onClose();
        }}
      >
        <div>
          {this.state.tipo != "cena" ? (
            <div>
              {" "}
              <input
                type="text"
                onChange={(e: any) =>
                  this.setState({ ...this.state, nome: e.target.value })
                }
              />{" "}
            </div>
          ) : null}
          <select
            onChange={(e: any) =>
              this.setState({ ...this.state, tipo: e.target.value })
            }
            value={this.state.tipo}
          >
            <option value="" />
            <option value="neste">Neste Equipamento</option>
            <option value="tipo">Para Todos {this.props.tipo.nome}</option>
            <option value="cena">Cena Existente</option>
            <option value="novacena">Nova Cena</option>
          </select>
          {this.state.tipo == "cena" ? (
            <div>
              <select
                onChange={(e: any) =>
                  this.setState({
                    ...this.state,
                    cenaUid: parseInt(e.target.value)
                  })
                }
              >
                <option value="-1" />
                {this.props.cenas
                  .filter(c => c.tipo == "equipamentos")
                  .map(c => (
                    <option value={c.uid} key={c.uid}>
                      {c.nome}
                    </option>
                  ))}
              </select>
            </div>
          ) : null}
          <div>
            <button onClick={() => this.salvar()}>Salvar</button>{" "}
            <button onClick={() => this.props.onClose()}>Cancelar</button>
          </div>
        </div>
      </SoftPanel>
    );
  }
}

export class EquipamentoComponent extends React.Component<
  EquipamentoComponentProps,
  EquipamentoComponentState
> {
  constructor(props: { equipamento: Equipamento }) {
    super(props);
    this.state = {
      canais: {},
      editNome: false,
      editInicio: false,
      salvarConfiguracao: false
    };
  }

  private removeEquipamento() {
    const uid = this.props.equipamento.uid;
    if (confirm("Realmente deseja remover este equipamento?")) {
      action({ type: "remove-equipamento", uid });
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

  private cor() {
    return buildCor(this.props.equipamento, this.props.tipo, this.props.canais);
  }

  private editNome() {
    return this.setState({
      ...this.state,
      editNome: true
    });
  }

  private changeColor(equipamento: Equipamento, cor: string) {
    action({ type: "change-color", equipamento: equipamento.uid, cor });
  }

  private novoNome(value: any) {
    const uid = this.props.equipamento.uid;
    action({ type: "editar-equipamento-nome", uid, nome: value });
    this.setState({
      ...this.state,
      editNome: false
    });
  }

  private piscar() {
    const uid = this.props.equipamento.uid;
    action({ type: "piscar-equipamento", uid });
  }

  private pulsar() {
    const uid = this.props.equipamento.uid;
    action({ type: "pulsar-equipamento", uid });
  }

  private salvar() {
    this.setState({ ...this.state, salvarConfiguracao: true });
  }

  render() {
    const e = this.props.equipamento;

    return (
      <div className="equipamento">
        <div className="equipamento__nome">
          {this.state.editNome ? (
            <FastInput
              className="equipamento__nome"
              initialValue={e.nome}
              style={{ width: "280px", border: 0, padding: 0 }}
              onChange={(value: string) => this.novoNome(value)}
              onCancel={() => {
                this.setState({
                  ...this.state,
                  editNome: false
                });
              }}
            />
          ) : (
            <span>
              {e.nome}{" "}
              <i className="fa fa-pencil" onClick={() => this.editNome()} />{" "}
              <i
                className="fa fa-close"
                onClick={() => this.removeEquipamento()}
              />
            </span>
          )}
        </div>
        <div className="equipamento__main">
          <input
            type="color"
            value={this.cor() || "#000000"}
            onChange={(event: any) => this.changeColor(e, event.target.value)}
          />
          <div
            style={{
              lineHeight: "2.4em",
              marginTop: "6px",
              textAlign: "center"
            }}
          >
            <button onClick={() => this.pulsar()}>Pulsar</button>{" "}
            <button onClick={() => this.piscar()}>Piscar</button>
            <br />
            {this.state.salvarConfiguracao ? (
              <SalvarConfiguracao
                cenas={this.props.cenas}
                equipamento={e}
                tipo={this.props.tipo}
                onClose={() =>
                  this.setState({
                    ...this.state,
                    salvarConfiguracao: false
                  })
                }
              />
            ) : null}
            <button onClick={() => this.salvar()}>Salvar</button>
          </div>
          {this.state.editInicio ? (
            <FastInput
              className="equipamento__inicio"
              initialValue={e.inicio + ""}
              type="number"
              min={1}
              max={255}
              onChange={val => {
                const i = parseInt(val);
                if (i <= 0 || !i || i > 255) {
                  alert("Valor inválido!");
                } else {
                  action({
                    type: "equipamento-editar-inicio",
                    uid: e.uid,
                    inicio: i
                  });
                }
                this.setState({ ...this.state, editInicio: false });
              }}
              onCancel={() => {
                this.setState({ ...this.state, editInicio: false });
              }}
            />
          ) : (
            <span
              className="equipamento__inicio"
              onDoubleClick={() =>
                this.setState({
                  ...this.state,
                  editInicio: true
                })
              }
            >
              {e.inicio}
            </span>
          )}
        </div>
        <div className="equipamento__canais">
          {this.props.tipo.canais.map((canal, index) => (
            <div key={index} className={"equipamento__canal " + canal.tipo}>
              <div className="equipamento__canal__index ">
                {e.inicio + index}
              </div>
              <div className="equipamento__canal__input__wrapper">
                <input
                  onChange={(event: any) =>
                    this.updateCanal(index + e.inicio, event.target.value)
                  }
                  type="range"
                  min="0"
                  className="equipamento__canal__input"
                  max="255"
                  value={
                    typeof this.state.canais[index + e.inicio] != "undefined"
                      ? this.state.canais[e.inicio + index]
                      : this.props.canais[index + e.inicio] || "0"
                  }
                />
              </div>
              <div className="equipamento__canal__valor">
                {typeof this.state.canais[index + e.inicio] != "undefined"
                  ? this.state.canais[e.inicio + index]
                  : this.props.canais[index + e.inicio] || "0"}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
