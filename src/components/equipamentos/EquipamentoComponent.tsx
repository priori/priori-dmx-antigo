import * as React from "react";
import { FastInput } from "../util/FastInput";
import {
  Cena,
  Equipamento,
  EquipamentosCena,
  EquipamentoTipo
} from "../../types";
import { action } from "../../util/action";
import { buildCor } from "../../util/cores";
import { SalvarConfiguracao } from "./SalvarConfiguracao";
import { ConfiguracoesSalvas } from "./ConfiguracoesSalvas";

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
  configSalvos: boolean;
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
      salvarConfiguracao: false,
      configSalvos: false
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
            <select
                value={""}
              onChange={(e: any) => this.aplicarOpcao(e.target.value)}
              style={{ width: "90px" }}
            >
              <option value=""/>
              {this.options().map((o,index) => (
                <optgroup label={o.nome} key={index}>
                  {o.opcoes.map(o => (
                    <option value={o.value} key={o.value}>
                      {o.titulo}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>{" "}
            {this.state.configSalvos ? (
              <ConfiguracoesSalvas
                equipamento={e}
                cenas={this.props.cenas}
                tipo={this.props.tipo}
                onClose={() =>
                  this.setState({
                    ...this.state,
                    configSalvos: false
                  })
                }
              />
            ) : null}
            <i className="fa fa-cog" onClick={() => this.configSalvos()} />
            <span
              style={{
                position: "absolute",
                left: this.props.equipamento.inicio < 100 ? "53px" : "60px",
                bottom: "4px"
              }}
            >
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
            </span>
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

  private options(): {
    nome: string;
    opcoes: { titulo: string; value: string }[];
  }[] {
    const cenas = this.props.cenas.filter(
      c =>
        c.tipo == "equipamentos" &&
        c.equipamentos.find(e => e.uid == this.props.equipamento.uid)
    ) as EquipamentosCena[];
    const a = [
      {
        nome: "Efeitos",
        opcoes: [
          { titulo: "Pulsar", value: "pulsar" },
          { titulo: "Piscar", value: "piscar" }
        ]
      }
    ];
    if (this.props.equipamento.configuracoes.length)
      a.push({
        nome: "Equipamento " + this.props.equipamento.nome,
        opcoes: this.props.equipamento.configuracoes.map((c, index) => ({
          titulo: c.nome,
          value: "equipamento:" + index
        }))
      });
    if (this.props.tipo.configuracoes.length)
      a.push({
        nome: this.props.tipo.nome,
        opcoes: this.props.tipo.configuracoes.map((c, index) => ({
          titulo: c.nome,
          value: "tipo:" + index
        }))
      });
    if (cenas.length)
      a.push({
        nome: "Cenas",
        opcoes: cenas.map(c => ({
          titulo: c.nome,
          value: "cena:" + c.uid
        }))
      });
    return a;
  }

  private aplicarOpcao(value: string) {
    if ( !value )return;
    if (value == "pulsar") {
      this.pulsar();
    } else if (value == "piscar") {
      this.piscar();
    } else {
      const match = value.match(/([^:]*):(.*)/);
      if (!match) throw "Match";
      const name = match[1];
      const number = parseInt(match[2]);
      if (name == "equipamento") {
        this.aplicarConfiguracao(number);
      } else if (name == "tipo") {
        this.aplicarEquipamentoTipoConfiguracao(number);
      } else if (name == "cena") {
        this.aplicarCena(number);
      }
    }
  }

  private configSalvos() {
    this.setState({
      ...this.state,
      configSalvos: true
    });
  }
  private aplicarConfiguracao(index: number) {
    action({
      type: "aplicar-equipamento-configuracao",
      index,
      equipamentoUid: this.props.equipamento.uid
    });
  }

  private aplicarEquipamentoTipoConfiguracao(index: number) {
    action({
      type: "aplicar-equipamento-tipo-configuracao",
      equipamentoUid: this.props.equipamento.uid,
      equipamentoTipoUid: this.props.tipo.uid,
      index
    });
  }

  private aplicarCena(uid: number) {
    action({
      type: "transicao-para-cena", // aplicar-cena-agora
      uid
    });
  }
}
