import * as React from "react";
import { SoftPanel } from "../util/SoftPanel";
import {
    CenaIS,
    EquipamentoSimplesIS,
    Tipo,
    EquipamentoGrupoIS, Uid
} from "../../types/internal-state";
import { action } from "../../util/action";

export interface SalvarConfiguracaoProps {
  equipamento: EquipamentoSimplesIS | EquipamentoGrupoIS;
  tipo: Tipo | null;
  onClose: () => void;
  cenas: CenaIS[];
}
export interface SalvarConfiguracaoState {
  tipo: string;
  nome: string;
  cenaUid: Uid|null;
}

// TODO
// function conflitoDeFaixas(
// equipamento: EquipamentoSimplesIS,
// tipo: Tipo,
// cena: EquipamentosCenaIS
// ) {
//   const de = equipamento.inicio;
// const ate = de + tipo.canais.length;
// for (const c of cena.equipamentos) {
// }
// return false;
// }

export class SalvarConfiguracao extends React.Component<
  SalvarConfiguracaoProps,
  SalvarConfiguracaoState
> {
  constructor(props: SalvarConfiguracaoProps) {
    super(props);
    this.state = {
      tipo: "",
      nome: "",
      cenaUid: null
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
      if (this.state.cenaUid === null) {
        alert("Escolha uma cena para salvar.");
        return;
      }
      const cena = this.props.cenas.find(c => c.uid == this.state.cenaUid);
      if (!cena || cena.tipo == "mesa") {
        alert("CenaIS não encontrada.");
        return;
      }
      // TODO
      // if (conflitoDeFaixas(this.props.equipamento, this.props.tipo, cena)) {
      //   alert(
      //     "Conflito de faixas. Verifique todos as faixas de todos equipamentos desta cena."
      //   );
      //   return;
      // }
      action({
        type: "adicionar-equipamento-a-cena",
        uid: this.props.equipamento.uid,
        nome,
        cenaUid: this.state.cenaUid as Uid
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
    const tipo = this.props.tipo;
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
            {tipo ? <option value="tipo">Para Todos {tipo.nome}</option> : null}
            <option value="cena">Cena Existente</option>
            <option value="novacena">Nova Cena</option>
          </select>
          {this.state.tipo == "cena" ? (
            <div>
              <select
                onChange={(e: any) =>
                  this.setState({
                    ...this.state,
                    cenaUid: e.target.value ? parseInt(e.target.value) as Uid : null
                  })
                }
              >
                <option value="" />
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
