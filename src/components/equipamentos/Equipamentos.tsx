import * as React from "react";
import {
  CenaIS,
  EquipamentoGrupoIS,
  EquipamentoSimplesIS,
  Tipo,
  Uid
} from "../../types/internal-state";
import { action } from "../../util/action";
import {
  EquipamentoComponent,
  EquipamentoComponentProps
} from "./EquipamentoComponent";
import {
  SortableContainer,
  SortableElement,
  arrayMove
} from "react-sortable-hoc";
import { AddForm } from "./AddForm";

const SortableItem = SortableElement((props: EquipamentoComponentProps) =>
  React.createElement(EquipamentoComponent, props)
);

function buildProps(
  e: EquipamentoSimplesIS | EquipamentoGrupoIS,
  index: number,
  equipamentos: (EquipamentoSimplesIS | EquipamentoGrupoIS)[],
  canais: { [k: number]: number },
  equipamentoTipos: Tipo[],
  cenas: CenaIS[]
) {
  return {
    canais,
    tipo: e.grupo ? null : equipamentoTipos.find(e2 => e2.uid == e.tipoUid),
    cenas,
    equipamento: e,
    index,
    key: e.uid,
    equipamentos: e.grupo ? equipamentos : null,
    tipos: e.grupo ? equipamentoTipos : null
  } as EquipamentoComponentProps & { key: number; index: number };
}

const SortableList = SortableContainer(
  ({
    equipamentos,
    canais,
    equipamentoTipos,
    cenas
  }: {
    equipamentos: (EquipamentoSimplesIS | EquipamentoGrupoIS)[];
    canais: { [key: number]: number };
    equipamentoTipos: Tipo[];
    cenas: CenaIS[];
  }) => (
    <div className="equipamentos">
      {equipamentos.map((e: EquipamentoSimplesIS, index: number) =>
        React.createElement(
          SortableItem,
          buildProps(e, index, equipamentos, canais, equipamentoTipos, cenas)
        )
      )}
    </div>
  )
);

export interface EquipamentosProps {
  equipamentos: (EquipamentoSimplesIS | EquipamentoGrupoIS)[];
  equipamentoTipos: Tipo[];
  cenas: CenaIS[];
  canais: {
    [key: number]: number;
  };
}

export interface EquipamentosState {
  add: boolean;
  equipamentosSort: Uid[] | null;
  selected: string | undefined | Uid;
}

export class Equipamentos extends React.Component<
  EquipamentosProps,
  EquipamentosState
> {
  constructor(props: EquipamentosProps) {
    super(props);
    this.state = {
      add: false,
      equipamentosSort: null,
      selected: undefined
    };
  }

  add() {
    this.setState({
      ...this.state,
      add: true
    });
  }

  componentWillReceiveProps(nextProps: EquipamentosProps) {
    this.setState(Equipamentos.getDerivedStateFromProps(nextProps, this.state));
  }

  static getDerivedStateFromProps(
    _: EquipamentosProps,
    state: EquipamentosState
  ) {
    return {
      ...state,
      equipamentosSort: null
    };
  }

  select(i: number, j: number) {
    const selected = "!" + (j + 1) + "," + (i + 1);
    const selection = this.props.equipamentos.filter(e =>
      e.nome.endsWith(selected)
    );
    if (selection.length == 1) {
      this.setState({
        ...this.state,
        selected: selection[0].uid
      });
    } else if (selection.length) {
      this.setState({
        ...this.state,
        selected
      });
    } else {
      this.setState({
        ...this.state,
        selected: undefined
      });
    }
  }

  onSortEnd = ({
    oldIndex,
    newIndex
  }: {
    oldIndex: number;
    newIndex: number;
  }) => {
    let sort = this.props.equipamentos.map(c => c.uid);
    sort = arrayMove(sort, oldIndex, newIndex);
    this.setState({ ...this.state, equipamentosSort: sort });
    action({ type: "equipamentos-sort", sort });
  };

  render() {
    let equipamentos = this.props.equipamentos;
    if (this.state.equipamentosSort) {
      equipamentos = [...equipamentos];
      const sort = this.state.equipamentosSort as Uid[];
      equipamentos.sort((a, b) => sort.indexOf(a.uid) - sort.indexOf(b.uid));
    }
    const areas = [] as (EquipamentoSimplesIS)[][][];
    for (let c = 0; c < 4; c++) {
      const row = [] as (EquipamentoSimplesIS)[][];
      for (let c2 = 0; c2 < 5; c2++) {
        const cell = equipamentos.filter(
          (e: any) =>
            e.tipoUid && e.nome.endsWith("!" + (c2 + 1) + "," + (c + 1))
        ) as (EquipamentoSimplesIS)[];
        row.push(cell);
      }
      areas.push(row);
    }
    if (typeof this.state.selected == "string")
      equipamentos = equipamentos.filter(e =>
        e.nome.endsWith(this.state.selected as string)
      );
    else if (typeof this.state.selected == "number") {
      equipamentos = equipamentos.filter(
        e => e.uid == (this.state.selected as Uid)
      );
    }

    return (
      <div>
        <table className="equipamentos__mapa">
          <tbody>
            {areas.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    onClick={() => {
                      this.select(i, j);
                    }}
                  >
                    {cell
                      .map(e => e.nome.replace(/\s*![0-9],[0-9]\s*$/gi, ""))
                      .join(",")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div
          className="equipamentos-nomes"
          style={{
            borderBottom: "solid 1px #ccc",
            borderTop: "solid 1px #ccc"
          }}
        >
          <div
            className={
              "equipamento-option" + (!this.state.selected ? " selected" : "")
            }
            onClick={() =>
              this.setState({ ...this.state, selected: undefined })
            }
            style={{ fontWeight: "bold" }}
          >
            Todos
          </div>
          {(this.props.equipamentos.filter(
            e => e.grupo
          ) as EquipamentoGrupoIS[]).map((g, gi) => (
            <div
              className={
                "equipamento-option" +
                (this.state.selected == g.uid ? " selected" : "")
              }
              style={{
                fontWeight: "bold",
                borderTop: gi == 0 ? "solid 1px #ccc" : undefined
              }}
              key={g.uid}
              onClick={() => this.setState({ ...this.state, selected: g.uid })}
            >
              <i className="fa fa-cubes" />{" "}
              {g.nome.replace(/\s*![0-9],[0-9]\s*$/gi, "")}
            </div>
          ))}
          {(this.props.equipamentos.filter(
            e => !e.grupo
          ) as EquipamentoSimplesIS[]).map((g, gi) => (
            <div
              style={{
                borderTop: gi == 0 ? "solid 1px #ccc" : undefined
              }}
              className={
                "equipamento-option" +
                (this.state.selected == g.uid ? " selected" : "")
              }
              key={g.uid}
              onClick={() => this.setState({ ...this.state, selected: g.uid })}
            >
              {g.nome.replace(/\s*![0-9],[0-9]\s*$/gi, "")}
            </div>
          ))}
        </div>

        <div style={{ textAlign: "right", marginTop: "4px" }}>
          {/*Equipamentos{" "}*/}
          <button onClick={() => this.add()}>Novo Equipamento</button>
        </div>
        {this.state.add ? (
          <AddForm
            equipamentos={
              this.props.equipamentos.filter(
                e => !e.grupo
              ) as EquipamentoSimplesIS[]
            }
            equipamentoTipos={this.props.equipamentoTipos}
            onSubmitSimples={(nome: string, tipo: Tipo, inicio: number) => {
              action({
                type: "create-equipamento",
                nome,
                inicio,
                tipoUid: tipo.uid
              });
              this.setState({ ...this.state, add: false });
            }}
            onCancelar={() => this.setState({ ...this.state, add: false })}
            onSubmitGrupo={(nome: string, equipamentos: Uid[]) => {
              action({
                type: "create-equipamento-grupo",
                nome,
                equipamentos
              });
              this.setState({ ...this.state, add: false });
            }}
          />
        ) : (
          undefined
        )}
        <SortableList
          equipamentos={equipamentos}
          canais={this.props.canais}
          onSortEnd={this.onSortEnd}
          axis="xy"
          distance={5}
          equipamentoTipos={this.props.equipamentoTipos}
          cenas={this.props.cenas}
        />
        {/*getHelperDimensions={}*/}
      </div>
    );
  }
}
