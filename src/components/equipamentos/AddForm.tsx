
import * as React from "react";
import { EquipamentoSimplesIS, Tipo, Uid } from "../../types/internal-state";

export interface AddFormProps {
  onSubmitSimples: (nome: string, tipo: Tipo, inicio: number, row?: number, col?: number) => void;
  onSubmitGrupo: (nome: string, equipamentos: Uid[], row?: number, col?: number ) => void;
  onCancelar: () => void;
  equipamentoTipos: Tipo[];
  equipamentos: EquipamentoSimplesIS[];
}
export interface AddFormState {
  tipoUid: Uid | null;
  nome: string;
  inicio: number;
  grupo: boolean;
  selecionados: Uid[];
  col?: number;
  row?: number;
}
export class AddForm extends React.Component<AddFormProps, AddFormState> {
  constructor(props: any) {
    super(props);
    this.state = {
      inicio: 1,
      nome: "",
      tipoUid: (props.equipamentoTipos[0] as Tipo).uid,
      grupo: false,
      selecionados: [],
      col: undefined,
      row: undefined
    };
  }

  render() {
    const sobram = this.props.equipamentos.filter(
      e => this.state.selecionados.indexOf(e.uid) == -1
    );
    const selecionados = this.props.equipamentos.filter(
      e => this.state.selecionados.indexOf(e.uid) != -1
    );
    return (
      <div className="add-form">
        Nome:{" "}
        <input
          type="text"
          value={this.state.nome}
          onChange={e =>
            this.setState({ ...this.state, nome: (e.target as any).value })
          }
        /><br/>
        Posição: linha:
        <input
            type="number"
            style={{width: "25px"}}
            value={this.state.row}
            onChange={(e: any) => this.setState({...this.state, row: e.target.value ? parseInt(e.target.value) : undefined})}
        /> coluna: <input
          type="number"
          style={{width: "25px"}}
          value={this.state.col}
          onChange={(e: any) => this.setState({...this.state, col: e.target.value ? parseInt(e.target.value) : undefined})}
      />
        <br />
        Tipo:{" "}
        <select
          onChange={(e: any) => {
            if (e.target.value == "grupo-de-equipamentos") {
              this.setState({ ...this.state, tipoUid: null, grupo: true });
            } else {
              this.setState({
                ...this.state,
                tipoUid: parseInt(e.target.value) as Uid,
                grupo: false
              });
            }
          }}
          value={
            this.state.grupo
              ? "grupo-de-equipamentos"
              : (this.state.tipoUid as Uid)
          }
        >
          {this.props.equipamentoTipos.map(t => (
            <option key={t.uid} value={t.uid}>
              {t.nome}
            </option>
          ))}
          {this.props.equipamentos.length ? (
            <option value="grupo-de-equipamentos">Grupo de Equipamentos</option>
          ) : null}
        </select>
        <br />
        {this.state.grupo ? (
          <div>
            <select
              value=""
              onChange={(e: any) =>
                this.select(parseInt(e.target.value) as Uid)
              }
              style={{ width: "100%" }}
            >
              <option value="" />
              {sobram.map(e => (
                <option value={e.uid} key={e.uid}>
                  {e.nome}
                </option>
              ))}
            </select>
            <br />
            {selecionados.map(e => (
              <div key={e.uid}>
                {e.nome}{" "}
                <button onClick={() => this.remove(e.uid)}>Remover</button>
              </div>
            ))}
          </div>
        ) : (
          <div>
            Início:{" "}
            <input
              type="number"
              min={1}
              max={255}
              value={this.state.inicio}
              onChange={e =>
                this.setState({
                  ...this.state,
                  inicio: parseInt((e.target as any).value)
                })
              }
            />
          </div>
        )}
        <button onClick={() => this.submit()}>Incluir</button>{" "}
        <button onClick={() => this.props.onCancelar()}>Cancelar</button>
      </div>
    );
  }

  private select(uid: Uid) {
    this.setState({
      ...this.state,
      selecionados: [...this.state.selecionados, uid]
    });
  }

  private remove(uid: Uid) {
    this.setState({
      ...this.state,
      selecionados: this.state.selecionados.filter(uid2 => uid2 != uid)
    });
  }

  private submit() {
    if (this.state.tipoUid)
      this.props.onSubmitSimples(
        this.state.nome,
        this.props.equipamentoTipos.find(
          e => e.uid == this.state.tipoUid
        ) as Tipo,
        this.state.inicio,
          this.state.row,
          this.state.col
      );
    else this.props.onSubmitGrupo(this.state.nome, this.state.selecionados,
        this.state.row,
        this.state.col);
  }
}