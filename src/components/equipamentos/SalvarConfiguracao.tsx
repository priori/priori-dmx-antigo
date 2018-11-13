import * as React from "react";
import { SoftPanel } from "../util/SoftPanel";
import { Cena, Equipamento, EquipamentoTipo } from "../../types";
import { action } from "../../util/action";

export interface SalvarConfiguracaoProps {
  equipamento: Equipamento;
  tipo: EquipamentoTipo;
  onClose: () => void;
  cenas: Cena[];
}
export interface SalvarConfiguracaoState {
  tipo: string;
  nome: string;
  cenaUid: number;
}
export class SalvarConfiguracao extends React.Component<
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
