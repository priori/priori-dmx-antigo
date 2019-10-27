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

function times(t:number):null[]{
  const a = [];
  while(t--){
    a.push(null);
  }
  return a;
}

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
  selected: Uid[];
  selections: { col?: number; row?: number}[]
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
      selected: [],
      selections: []
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
      const sort = this.state.equipamentosSort as Uid[];
      equipamentos.sort((a, b) => sort.indexOf(a.uid) - sort.indexOf(b.uid));
    }


    const rowsCount = equipamentos.map(e=>e.row).reduce((a,b)=>!a ? b : !b? a : a > b ? a : b, false ) || 0;
    const colsCount = equipamentos.map(e=>e.col).reduce((a,b)=>!a ? b : !b? a : a > b ? a : b, false ) || 0;
    const semPosicaoCount = this.props.equipamentos.filter(e=>typeof e.row == 'undefined' && typeof e.col == 'undefined').length;

    const mapa:(number[])[] = [];
    const rows:number[] = [];
    for (let c = 0; c < rowsCount; c++) {
      const row:number[] = [];
      for ( let c2=0; c2 <colsCount; c2++ ){
        row.push( equipamentos.filter(e=>e.row == c+1 && e.col == c2 + 1).length );
      }
      mapa.push(row);
      rows.push( equipamentos.filter(e=>e.row == c+1 && typeof e.col == 'undefined').length )
    }

    const equipamentosSelecionadosNoMapa = this.state.selections.length == 0 ? this.props.equipamentos :
        this.props.equipamentos.filter(e=> this.state.selections.filter(s=>s.col === e.col && s.row === e.row ).length );

    const equipamentosSelecionados = equipamentosSelecionadosNoMapa.filter(g=>
        this.state.selected.length == 0 ||
        this.state.selected.indexOf(g.uid)!= -1);

    return (
      <div>
        <div className="equipamentos__mapa"
             style={{paddingTop: semPosicaoCount ? 0: undefined}}>
          { semPosicaoCount ? <div
              className={this.state.selections.filter(s=>s.col === undefined && s.row === undefined ).length ?
                  'equipamentos__mapa__equipamentos-selecionados' : 'equipamentos__mapa__equipamentos'}
              style={{paddingTop:'10px',paddingBottom:'5px', paddingLeft: '5px'}}
              onClick={()=>this.addSelection({row:undefined,col:undefined})}
          >
          { semPosicaoCount ? times(semPosicaoCount).map((_,k)=><span
              key={k}
              className="equipamentos__mapa__equipamento"></span>): null }
          </div> : null }
          {rows.map((count,index)=><div
              key={index}
              className="equipamentos__mapa__linha"
              style={{paddingTop: count ? 0: undefined}}
          >
            {count ?
            <div style={{paddingTop:'10px',paddingBottom:'5px', paddingLeft:'10px'}}

                 className={this.state.selections.filter(s=>s.col === undefined && s.row === index+1 ).length ?
                     'equipamentos__mapa__equipamentos-selecionados' : 'equipamentos__mapa__equipamentos'}

                 onClick={()=>this.addSelection({row:index+1,col:undefined})}
            >
            {count ? times(count).map((_,k)=><span
                key={k} className="equipamentos__mapa__equipamento"></span>): null}
            </div>
                : null }
            <div style={{display:'flex'}}>
            {mapa[index].map((row,col)=><div
                key={col}
                onClick={()=>this.addSelection({row:index+1,col:col+1})}
                className={"equipamentos__mapa__celula "+(this.state.selections.filter(s=>s.col === col+1 && s.row === index+1 ).length ?
                    'equipamentos__mapa__equipamentos-selecionados' : 'equipamentos__mapa__equipamentos')}
                style={{ opacity: row ? 1 : 0.25}}

            >
              { row ? times(row).map((_,k)=><span
                  key={k} className="equipamentos__mapa__equipamento"
              ></span>): '' }
            </div>)}
            </div>
          </div>)}
        </div>

        <div
          className="equipamentos-nomes"
          style={{
            borderBottom: "solid 1px #ccc",
            borderTop: "solid 1px #ccc"
          }}
        >
          <div
            className={
              "equipamento-option" + (this.state.selected.length == 0 ? " selected" : "")
            }
            onClick={() =>
              this.setState({ ...this.state, selected: [] })
            }
            style={{ fontWeight: "bold" }}
          >
            Todos
          </div>
          {(equipamentosSelecionadosNoMapa.filter(
            e => e.grupo
          ) as EquipamentoGrupoIS[]).map((g, gi) => (
            <div
              className={
                "equipamento-option" +
                (this.state.selected.indexOf(g.uid) != -1 ? " selected" : "")
              }
              style={{
                fontWeight: "bold",
                borderTop: gi == 0 ? "solid 1px #ccc" : undefined
              }}
              key={g.uid}
              onClick={() => {
                if ( this.state.selected.indexOf(g.uid) == -1 )
                  this.setState({ ...this.state, selected: [...this.state.selected,g.uid] });
                else
                  this.setState({ ...this.state, selected: this.state.selected.filter(uid=>uid != g.uid) });
              }}
            >
              <i className="fa fa-cubes" />{" "}
              {g.nome.replace(/\s*![0-9],[0-9]\s*$/gi, "")}
            </div>
          ))}
          {(equipamentosSelecionadosNoMapa.filter(
            e => !e.grupo
          ) as EquipamentoSimplesIS[]).map((g, gi) => (
            <div
              style={{
                borderTop: gi == 0 ? "solid 1px #ccc" : undefined
              }}
              className={
                "equipamento-option" +
                (this.state.selected.indexOf(g.uid) != -1 ? " selected" : "")
              }
              key={g.uid}
              onClick={() => {
                if ( this.state.selected.indexOf(g.uid) == -1 )
                  this.setState({ ...this.state, selected: [...this.state.selected,g.uid] });
                else
                  this.setState({ ...this.state, selected: this.state.selected.filter(uid=>uid != g.uid) });
              }}
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
            onSubmitSimples={(nome: string, tipo: Tipo, inicio: number, row?:number, col?: number
            ) => {
              action({
                type: "create-equipamento",
                nome,
                inicio,
                tipoUid: tipo.uid,
                row, col
              });
              this.setState({ ...this.state, add: false });
            }}
            onCancelar={() => this.setState({ ...this.state, add: false })}
            onSubmitGrupo={(nome: string, equipamentos: Uid[], row?:number, col?: number) => {
              action({
                type: "create-equipamento-grupo",
                nome,
                equipamentos,
                row, col
              });
              this.setState({ ...this.state, add: false });
            }}
          />
        ) : (
          undefined
        )}
        <SortableList
          equipamentos={equipamentosSelecionados}
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

  addSelection( {col,row}: { col?: number; row?: number} ) {
    if ( this.state.selections.filter(s=>s.col===col && s.row === row ).length ) {
      this.setState({
        ...this.state,
        selections: this.state.selections.filter(s => !(s.col===col && s.row === row ) )
      });
    } else {
      this.setState({
        ...this.state,
        selections: [...this.state.selections,{col,row}]
      });
    }

  }
}
