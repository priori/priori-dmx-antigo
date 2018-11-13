import * as React from "react";
import { Cena, Equipamento, EquipamentoTipo } from "../../types";
import { action } from "../../util/action";
import { EquipamentoComponent } from "./EquipamentoComponent";
import {
  SortableContainer,
  SortableElement,
  arrayMove
} from "react-sortable-hoc";

const SortableItem = SortableElement(
  ({
    equipamento,
    canais,
    cenas,
    tipo
  }: {
    equipamento: Equipamento;
    tipo: EquipamentoTipo;
    cenas: Cena[];
    canais: { [key: number]: number };
  }) => (
    <EquipamentoComponent
      equipamento={equipamento}
      tipo={tipo}
      canais={canais}
      cenas={cenas}
    />
  )
);

const SortableList = SortableContainer(
  ({
    equipamentos,
    canais,
    equipamentoTipos,
    cenas
  }: {
    equipamentos: Equipamento[];
    canais: { [key: number]: number };
    equipamentoTipos: EquipamentoTipo[];
    cenas: Cena[];
  }) => (
    <div className="equipamentos">
      {equipamentos.map((e: Equipamento, index: number) => (
        <SortableItem
          equipamento={e}
          key={e.uid}
          canais={canais}
          cenas={cenas}
          tipo={
            equipamentoTipos.find(t => t.uid == e.tipoUid) as EquipamentoTipo
          }
          index={index}
        />
      ))}
    </div>
  )
);

class AddForm extends React.Component<
  {
    onSubmit: (nome: string, tipo: EquipamentoTipo, inicio: number) => void;
    onCancelar: () => void;
    equipamentoTipos: EquipamentoTipo[];
  },
  {
    tipoUid: number;
    nome: string;
    inicio: number;
  }
> {
  constructor(props: any) {
    super(props);
    this.state = {
      inicio: 1,
      nome: "",
      tipoUid: (props.equipamentoTipos[0] as EquipamentoTipo).uid
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
        <br />
        Tipo:{" "}
        <select
          onChange={(e: any) =>
            this.setState({ ...this.state, tipoUid: parseInt(e.target.value) })
          }
          value={this.state.tipoUid}
        >
          {this.props.equipamentoTipos.map(t => (
            <option key={t.uid} value={t.uid}>
              {t.nome}
            </option>
          ))}
        </select>
        <br />
        <button
          onClick={() =>
            this.props.onSubmit(
              this.state.nome,
              this.props.equipamentoTipos.find(
                e => e.uid == this.state.tipoUid
              ) as EquipamentoTipo,
              this.state.inicio
            )
          }
        >
          Incluir
        </button>{" "}
        <button onClick={() => this.props.onCancelar()}>Cancelar</button>
      </div>
    );
  }
}

export interface EquipamentosProps {
  equipamentos: Equipamento[];
  equipamentoTipos: EquipamentoTipo[];
  cenas: Cena[];
  canais: {
    [key: number]: number;
  };
}

export interface EquipamentosState {
  add: boolean;
  equipamentosSort: number[] | null;
}

export class Equipamentos extends React.Component<
  EquipamentosProps,
  EquipamentosState
> {
  constructor(props: EquipamentosProps) {
    super(props);
    this.state = {
      add: false,
      equipamentosSort: null
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
      const sort = this.state.equipamentosSort as number[];
      equipamentos.sort((a, b) => sort.indexOf(a.uid) - sort.indexOf(b.uid));
    }
    return (
      <div>
        <div style={{ textAlign: "right", marginTop: "11px" }}>
          {/*Equipamentos{" "}*/}
          <button onClick={() => this.add()}>Novo Equipamento</button>
        </div>
        {this.state.add ? (
          <AddForm
            equipamentoTipos={this.props.equipamentoTipos}
            onSubmit={(nome: string, tipo: EquipamentoTipo, inicio: number) => {
              action({
                type: "create-equipamento",
                nome,
                inicio,
                tipoUid: tipo.uid
              });
              this.setState({ ...this.state, add: false });
            }}
            onCancelar={() => this.setState({ ...this.state, add: false })}
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
