import * as React from "react";
import { AppState, Cena } from "../types";
import { action } from "../util/action";
import { FastInput } from "./util/FastInput";
import {
  SortableContainer,
  SortableElement,
  arrayMove
} from "react-sortable-hoc";

export interface CenasState {
  editandoTempo: number;
  editandoNome: number;
  selected: number;
  cenasSort: number[] | null;
}

const SortableItem = SortableElement(
  ({
    cena,
    onClick,
    selected,
    editing,
    onEdit,
    onCancelEdit,
    onPencil
  }: {
    cena: Cena;
    onClick: (cena: Cena) => void;
    onEdit: (cena: Cena, value: string) => void;
    onCancelEdit: (cena: Cena) => void;
    onPencil: (cena: Cena) => void;
    selected: boolean;
    editing: boolean;
  }) => (
    <div
      className={"cena" + (selected ? " selected" : "")}
      onClick={() => onClick(cena)}
    >
      {editing ? (
        <FastInput
          className="cena__nome"
          initialValue={cena.nome}
          onMouseDown={(e: any) => {
            e.stopPropagation();
          }}
          onClick={(e: any) => {
            e.stopPropagation();
          }}
          onChange={(value: string) => {
            onEdit(cena, value);
          }}
          onCancel={() => onCancelEdit(cena)}
        />
      ) : (
        cena.nome
      )}
      {selected && !editing ? (
        <i
          className="fa fa-pencil"
          onClick={(e: any) => {
            onPencil(cena);
            e.stopPropagation();
            e.preventDefault();
          }}
        />
      ) : null}
    </div>
  )
);
const SortableList = SortableContainer(
  ({
    selected,
    cenas,
    onClick,
    onEdit,
    onCancelEdit,
    editing,
    onPencil
  }: {
    selected: number;
    cenas: Cena[];
    onClick: (cena: Cena) => void;
    onEdit: (cena: Cena, value: string) => void;
    onCancelEdit: (cena: Cena) => void;
    editing: number;
    onPencil: (cena: Cena) => void;
  }) => {
    return (
      <div>
        <div className="cenas">
          {cenas.map((c, index) => (
            <SortableItem
              key={c.uid}
              index={index}
              cena={c}
              onClick={onClick}
              selected={selected == c.uid}
              onEdit={onEdit}
              onCancelEdit={onCancelEdit}
              editing={editing == c.uid}
              onPencil={onPencil}
            />
          ))}
        </div>
      </div>
    );
  }
);

export class Cenas extends React.Component<AppState, CenasState> {
  constructor(props: AppState) {
    super(props);
    this.state = {
      editandoNome: -1,
      editandoTempo: -1,
      selected: -1,
      cenasSort: null
    };
  }

  aplicar(uid: number) {
    action({ type: "aplicar-cena-agora", uid });
  }

  componentWillReceiveProps(nextProps: AppState) {
    this.setState(Cenas.getDerivedStateFromProps(nextProps, this.state));
  }

  static getDerivedStateFromProps(_: AppState, state: CenasState) {
    return {
      ...state,
      cenasSort: null
    };
  }

  transicao(uid: number) {
    action({ type: "transicao-para-cena", uid });
  }

  salvarCena(uid: number) {
    action({ type: "salvar-cena", uid });
  }

  novoNome(uid: number, nome: string) {
    action({ type: "editar-nome-da-cena", uid, nome });
    this.setState({
      ...this.state,
      editandoNome: -1
    });
  }

  novoTempo(uid: number, tempo: number) {
    if (tempo < 0) {
      alert("Valor inválido!");
      return;
    }
    action({ type: "editar-tempo-da-cena", uid, tempo });
    this.setState({
      ...this.state,
      editandoTempo: -1
    });
  }

  onSortEnd = ({
    oldIndex,
    newIndex
  }: {
    oldIndex: number;
    newIndex: number;
  }) => {
    let sort = this.props.cenas.map(c => c.uid);
    sort = arrayMove(sort, oldIndex, newIndex);
    this.setState({ ...this.state, cenasSort: sort });
    action({ type: "cenas-sort", sort });
  };

  select(cena: Cena) {
    if (this.state.selected == cena.uid) {
      this.setState({
        ...this.state,
        selected: -1
      });
    } else {
      this.setState({ ...this.state, selected: cena.uid });
    }
  }

  render() {
    const cena: Cena | null =
      this.props.cenas.find(c => c.uid == this.state.selected) || null;
    let cenas = this.props.cenas;
    if (this.state.cenasSort) {
      cenas = [...cenas];
      const sort = this.state.cenasSort as number[];
      cenas.sort((a, b) => sort.indexOf(a.uid) - sort.indexOf(b.uid));
    }
    return (
      <div className="cenas">
        {cena ? (
          <div className="cenas__controller">
            <button onClick={() => this.salvarCena(this.state.selected)}>
              Salvar <i className="fa fa-save" />
            </button>{" "}
            <button onClick={() => this.removeCena(this.state.selected)}>
              Remover <i className="fa fa-close" />
            </button>{" "}
            <button onClick={() => this.aplicar(this.state.selected)}>
              Agora <i className="fa fa-check" />
            </button>{" "}
            <button onClick={() => this.transicao(this.state.selected)}>
              Transição <i className="fa fa-play" />
            </button>
            {this.state.editandoTempo != -1 ? (
              <FastInput
                className="cena__tempo"
                type="number"
                initialValue={((cena as any).transicaoTempo || "0") + ""}
                onChange={value => this.novoTempo(cena.uid, parseInt(value))}
                onCancel={() =>
                  this.setState({ ...this.state, editandoTempo: -1 })
                }
              />
            ) : (
              <span
                style={{ display: "inline-block", width: "60px" }}
                onDoubleClick={() =>
                  this.setState({ ...this.state, editandoTempo: cena.uid })
                }
              >
                {cena ? ((cena as any).transicaoTempo || 0) + "ms" : ""}
              </span>
            )}
          </div>
        ) : (
          <div className="cenas__controller" style={{ opacity: 0.5 }}>
            <button disabled={true}>
              Salvar <i className="fa fa-save" />
            </button>{" "}
            <button disabled={true}>
              Remover <i className="fa fa-close" />
            </button>{" "}
            <button disabled={true}>
              Agora <i className="fa fa-check" />
            </button>{" "}
            <button disabled={true}>
              Transição <i className="fa fa-play" />
            </button>
            <span style={{ display: "inline-block", width: "60px" }} />
          </div>
        )}
        <SortableList
          onPencil={cena =>
            this.setState({
              ...this.state,
              editandoNome: cena.uid
            })
          }
          editing={this.state.editandoNome}
          onCancelEdit={() =>
            this.setState({ ...this.state, editandoNome: -1 })
          }
          onEdit={(cena, nome) => this.novoNome(cena.uid, nome)}
          distance={5}
          cenas={cenas}
          onClick={(cena: Cena) => this.select(cena)}
          onSortEnd={this.onSortEnd}
          selected={this.state.selected}
        />
      </div>
    );
  }

  private removeCena(uid: number) {
    if (confirm("Realmente deseja remover esta cena?")) {
      action({ type: "remove-cena", uid });
    }
  }
}
