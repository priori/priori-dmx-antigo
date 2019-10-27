import * as React from "react";
import { AppInternalState, CenaIS, Uid } from "../types/internal-state";
import { action } from "../util/action";
import { FastInput } from "./util/FastInput";
import {
  SortableContainer,
  SortableElement,
  arrayMove
} from "react-sortable-hoc";
import Timer = NodeJS.Timer;

export interface CenasState {
  cenaSlide: number | undefined;
  editandoTempo: number;
  editandoNome: number;
  selected: Uid | null;
  cenasSort: Uid[] | null;
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
    cena: CenaIS;
    onClick: (cena: CenaIS) => void;
    onEdit: (cena: CenaIS, value: string) => void;
    onCancelEdit: (cena: CenaIS) => void;
    onPencil: (cena: CenaIS) => void;
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
    selected: Uid | null;
    cenas: CenaIS[];
    onClick: (cena: CenaIS) => void;
    onEdit: (cena: CenaIS, value: string) => void;
    onCancelEdit: (cena: CenaIS) => void;
    editing: number;
    onPencil: (cena: CenaIS) => void;
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

export class Cenas extends React.Component<AppInternalState, CenasState> {
  constructor(props: AppInternalState) {
    super(props);
    this.state = {
      editandoNome: -1,
      editandoTempo: -1,
      selected: null,
      cenasSort: null,
      cenaSlide: undefined
    };
  }

  aplicar(uid: Uid) {
    action({ type: "aplicar-cena-agora", uid });
  }

  componentWillReceiveProps(nextProps: AppInternalState) {
    this.setState(Cenas.getDerivedStateFromProps(nextProps, this.state));
  }

  static getDerivedStateFromProps(_: AppInternalState, state: CenasState) {
    return {
      ...state,
      cenasSort: null
    };
  }

  transicao(uid: Uid) {
    action({ type: "transicao-para-cena", uid });
  }

  salvarCena(uid: Uid) {
    if (!confirm("Deseja realmente sobrescrever esta cena?")) return;
    action({ type: "salvar-cena", uid });
  }

  novoNome(uid: Uid, nome: string) {
    action({ type: "editar-nome-da-cena", uid, nome });
    this.setState({
      ...this.state,
      editandoNome: -1
    });
  }

  novoTempo(uid: Uid, tempo: number) {
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
  }

  select(cena: CenaIS) {
    if (this.state.selected == cena.uid) {
      this.setState({
        ...this.state,
        selected: null
      });
    } else {
      this.setState({
        ...this.state,
        selected: cena.uid,
        cenaSlide: undefined
      });
    }
  }

  render() {
    const cena: CenaIS | null =
      this.props.cenas.find(c => c.uid == this.state.selected) || null;
    let cenas = this.props.cenas;
    if (this.state.cenasSort) {
      cenas = [...cenas];
      const sort = this.state.cenasSort as Uid[];
      cenas.sort((a, b) => sort.indexOf(a.uid) - sort.indexOf(b.uid));
    }
    return (
      <div className="cenas">
        {cena ? (
          <div className="cenas__controller">
            <input
              type="range"
              onChange={(e: any) => this.cenaSlide(parseFloat(e.target.value))}
              value={
                typeof this.state.cenaSlide != "undefined"
                  ? this.state.cenaSlide
                  : this.props.cenaSlide && this.props.cenaSlide.uid == cena.uid
                  ? this.props.cenaSlide.value
                  : "0"
              }
            />{" "}
            <button onClick={() => this.salvarCena(cena.uid)}>
              <span>Salvar </span>
              <i className="fa fa-save" />
            </button>{" "}
            <button onClick={() => this.removeCena(cena.uid)}>
              <span>Remover </span>
              <i className="fa fa-close" />
            </button>{" "}
            <button onClick={() => this.aplicar(cena.uid)}>
              <span>Agora </span>
              <i className="fa fa-check" />
            </button>{" "}
            <button onClick={() => this.transicao(cena.uid)}>
              <span>Transição </span>
              <i className="fa fa-play" />
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
                className="cenas__transicao-tempo"
                style={{}}
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
            <input readOnly={true} disabled={true} type="range" value={"0"} />{" "}
            <button disabled={true}>
              <span>Salvar </span>
              <i className="fa fa-save" />
            </button>{" "}
            <button disabled={true}>
              <span>Remover </span>
              <i className="fa fa-close" />
            </button>{" "}
            <button disabled={true}>
              <span>Agora </span>
              <i className="fa fa-check" />
            </button>{" "}
            <button disabled={true}>
              <span>Transição </span>
              <i className="fa fa-play" />
            </button>
            <span className="cenas__transicao-tempo" />
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
          distance={(window as any).webMode ? undefined : 5}
          pressDelay={(window as any).webMode ? 1000 : undefined}
          cenas={cenas}
          onClick={(cena: CenaIS) => this.select(cena)}
          onSortEnd={this.onSortEnd}
          selected={this.state.selected}
        />
      </div>
    );
  }

  private removeCena(uid: Uid) {
    if (confirm("Realmente deseja remover esta cena?")) {
      action({ type: "remove-cena", uid });
    }
  }

  private slideValueTimeout: Timer;
  private cenaSlide(value: number) {
    this.setState({
      ...this.state,
      cenaSlide: value
    });
    if (this.slideValueTimeout) clearTimeout(this.slideValueTimeout);
    this.slideValueTimeout = setTimeout(() => {
      this.setState({
        ...this.state,
        cenaSlide: undefined
      });
    }, 2000);
    action({ type: "slide-cena", uid: this.state.selected as Uid, value });
    // this.setState({...this.state,slide:parseFloat(e.target.value)})
  }
}
