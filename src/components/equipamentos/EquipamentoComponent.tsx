
import * as React from "react";
import { FastInput } from "../util/FastInput";
import {
  CenaIS,
  EquipamentoSimplesIS,
  EquipamentosCenaIS,
  Tipo,
  EquipamentoGrupoIS,
  Uid
} from "../../types/internal-state";
import { action } from "../../util/action";
import {
  buildCor,
  extractColorInfo,
  grupoCanais,
  grupoCor2,
  master
} from "../../util/cores";
import { SalvarConfiguracao } from "./SalvarConfiguracao";
import { ConfiguracoesSalvas } from "./ConfiguracoesSalvas";

export type EquipamentoComponentProps =
  | {
      equipamento: EquipamentoSimplesIS;
      tipo: Tipo;
      canais: { [key: number]: number };
      cenas: CenaIS[];
      equipamentos: null;
      tipos: null;
    }
  | {
      equipamento: EquipamentoGrupoIS;
      tipo: null;
      equipamentos: EquipamentoSimplesIS[];
      canais: { [key: number]: number };
      cenas: CenaIS[];
      tipos: Tipo[];
    };
export interface EquipamentoComponentState {
  canais: { [key: number]: number };
  editNome: boolean;
  editInicio: boolean;
  salvarConfiguracao: boolean;
  configSalvos: boolean;
  editPosicao: boolean
}

interface PosicaoFormProps {row?:number,col?:number,onOk:(row?:number,col?:number)=>void,onCancel:()=>void};
class PosicaoForm extends React.Component<PosicaoFormProps,{
  row?:number,
  col?:number
}>{

  constructor(props:PosicaoFormProps){
    super(props);
    this.state = {
      row: props.row,
      col: props.col
    }
  }

  render() {
    return <div style={{
      position: 'absolute',
      right: '10px',
      background: '#fff',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
      padding: '10px',
      lineHeight: '1.5em',
      marginTop: '5px',
      zIndex: 1
    }}>
      Linha: <input type="number"
                    value={this.state.row}
                    onChange={(e: any) => this.setState({...this.state,
                      row: e.target.value ? parseInt(e.target.value) : undefined })}
    /><br/>
      Coluna: <input
        type="number"
        value={this.state.col}
        onChange={(e: any) => this.setState({...this.state,
          col: e.target.value ? parseInt(e.target.value) : undefined })}
    />
      <div style={{marginTop: '5px'}}>
        <button onClick={() => {
          this.props.onOk(this.state.row, this.state.col);
        }}>Ok
        </button>
        {" "}
        <button onClick={() => {
          this.props.onCancel()
        }}>Cancelar
        </button>
      </div>
    </div>
  }
}

export class EquipamentoComponent extends React.Component<
  EquipamentoComponentProps,
  EquipamentoComponentState
> {
  private colorInput: HTMLInputElement;
  private canaisStateTimeout: NodeJS.Timer;
  constructor(props: EquipamentoComponentProps) {
    super(props);
    this.state = {
      canais: {},
      editNome: false,
      editInicio: false,
      salvarConfiguracao: false,
      configSalvos: false,
      editPosicao: false
    };
  }

  private removeEquipamento() {
    const uid = this.props.equipamento.uid;
    if (confirm("Realmente deseja remover este equipamento?")) {
      action({ type: "remove-equipamento", uid });
    }
  }

  private updateCanal(index: number, val: string) {
    const e = this.props.equipamento;
    if (e.grupo) {
      const canais = {} as { [k: number]: number };
      const es = this.props.equipamentos;
      const tipos = this.props.tipos;
      if (!es) throw new Error("Não encontrados equipamentos");
      if (!tipos) throw new Error("Não encontrados tipos");

      const info = grupoCanais(e, es, tipos, this.props.canais);
      const canalInfo = info[index - 1];
      const tipoNome = canalInfo.tipo;

      for (const uid of e.equipamentos) {
        const e = es.find(e2 => e2.uid == uid);
        if (!e) throw new Error("Não encontrado equipamento");
        const t = tipos.find(t => t.uid == e.tipoUid);
        if (!t) throw new Error("Não encontrado tipo");
        if (tipoNome == "red") {
          const colorinfo = extractColorInfo(t);
          if (!colorinfo) throw new Error("não encontrado color info");
          canais[colorinfo.r + e.inicio] = parseFloat(val);
        } else if (tipoNome == "green") {
          const colorinfo = extractColorInfo(t);
          if (!colorinfo) throw new Error("não encontrado color info");
          canais[colorinfo.g + e.inicio] = parseFloat(val);
        } else if (tipoNome == "blue") {
          const colorinfo = extractColorInfo(t);
          if (!colorinfo) throw new Error("não encontrado color info");
          canais[colorinfo.b + e.inicio] = parseFloat(val);
        } else if (tipoNome == "master") {
          const mIndex = master(t);
          if (typeof mIndex == "undefined") throw new Error("Master");
          canais[mIndex + e.inicio] = parseFloat(val);
        } else if (tipoNome == "white") {
          const colorinfo = extractColorInfo(t);
          if (!colorinfo) throw new Error("não encontrado color info");
          if (typeof colorinfo.w == "undefined")
            throw new Error("não encontrado master no color info");
          canais[colorinfo.w + e.inicio] = parseFloat(val);
        }
      }
      action({ type: "multiple-slide", canais });
    } else {
      const value = parseInt(val);
      this.setState({
        ...this.state,
        canais: {
          ...this.state.canais,
          [index]: value
        }
      });
      if (this.canaisStateTimeout) clearTimeout(this.canaisStateTimeout);
      this.canaisStateTimeout = setTimeout(() => {
        this.setState({
          ...this.state,
          canais: {}
        });
      }, 500);
      action({ type: "slide", index, value });
    }
  }

  private cor() {
    const e = this.props.equipamento;
    if (!e.grupo)
      return buildCor(e, this.props.tipo as Tipo, this.props.canais);
    return grupoCor2(
      e,
      this.props.equipamentos as EquipamentoSimplesIS[],
      this.props.tipos as Tipo[],
      this.props.canais
    );
  }

  private editNome() {
    return this.setState({
      ...this.state,
      editNome: true
    });
  }

  private changeColor(
    equipamento: EquipamentoSimplesIS | EquipamentoGrupoIS,
    cor: string
  ) {
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
    const tipo = this.props.tipo;
    const canais = this.canais();
    const cor = this.cor();

    return (
      <div className="equipamento">


        {this.state.editPosicao ?
            <PosicaoForm
                row={e.row}
                col={e.col}
                onCancel={()=>{
                  this.setState({
                    ...this.state,
                    editPosicao: false
                  });
                }}
                onOk={(row?:number,col?:number)=>{
                  action({type:"editar-equipamento-posicao",uid:e.uid,row,col});
                  this.setState({
                    ...this.state,
                    editPosicao: false
                  });
                }}
            /> : null
        }

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
              {e.nome.replace(/\s*![0-9],[0-9]\s*$/gi, "")}{" "}
              <i className="fa fa-pencil" onClick={() => this.editNome()} />{" "}
              <span
                  style={{ display: 'inline-block', fontSize: '13px', lineHeight: '11px', position: 'relative',
                    top: '1px', fontWeight: 'bold'}}
                  onClick={()=>{
                    this.setState({
                        ...this.state,
                      editPosicao: true
                    });
                  }}
              >linha: {typeof e.row == 'undefined'?'-':e.row}<br/>
                coluna: {typeof e.col == 'undefined'? '-':e.col}
              </span>
              <i
                className="fa fa-close"
                onClick={() => this.removeEquipamento()}
              />
            </span>
          )}
        </div>
        <div className="equipamento__main">
          {!cor ? (
            <span
              onClick={() => this.colorInput.click()}
              style={{
                position: "absolute",
                marginLeft: "25px",
                marginTop: "19px",
                fontWeight: "bold",
                fontSize: "30px",
                color: "white",
                opacity: 0.66
              }}
            >
              ?
            </span>
          ) : null}
          <input
            ref={el => (this.colorInput = el)}
            type="color"
            value={cor || "#000000"}
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
              <option value="" />
              {this.options().map((o, index) => (
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
                tipo={tipo}
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
                left: e.grupo ? "5px" : e.inicio < 100 ? "53px" : "60px",
                bottom: "4px"
              }}
            >
              {this.state.salvarConfiguracao ? (
                <SalvarConfiguracao
                  cenas={this.props.cenas}
                  equipamento={e}
                  tipo={tipo}
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
          {!e.grupo && this.state.editInicio ? (
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
          ) : e.grupo ? null : (
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
        {canais.length ? (
          <div className="equipamento__canais">
            {canais.map((canal, index) => (
              <div
                key={index}
                className={"equipamento__canal " + canal.tipo}
                style={{ opacity: canal.unknow ? 0.3 : 1 }}
              >
                <div className="equipamento__canal__index ">{canal.index}</div>
                <div className="equipamento__canal__input__wrapper">
                  <input
                    onChange={(event: any) =>
                      this.updateCanal(canal.index, event.target.value)
                    }
                    type="range"
                    min="0"
                    className="equipamento__canal__input"
                    max="255"
                    value={canal.value}
                  />
                </div>
                <div className="equipamento__canal__valor">{canal.value}</div>
              </div>
            ))}
          </div>
        ) : null}
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
    ) as EquipamentosCenaIS[];
    const a = [
      {
        nome: "Efeitos",
        opcoes: [
          { titulo: "Pulsar", value: "pulsar" },
          { titulo: "Piscar", value: "piscar" }
        ]
      }
    ];
    const e = this.props.equipamento;
    if (e.configuracoes.length)
      a.push({
        nome: "EquipamentoSimplesIS " + this.props.equipamento.nome,
        opcoes: (this.props.equipamento.configuracoes as {
          nome: string;
        }[]).map((c, index) => ({
          titulo: c.nome,
          value: "equipamento:" + index
        }))
      });
    const tipo = this.props.tipo;
    if (tipo && tipo.configuracoes.length)
      a.push({
        nome: tipo.nome,
        opcoes: tipo.configuracoes.map((c, index) => ({
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
    if (!value) return;
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
        this.aplicarTipoConfiguracao(number);
      } else if (name == "cena") {
        this.aplicarCena(number as Uid);
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

  private aplicarTipoConfiguracao(index: number) {
    action({
      type: "aplicar-equipamento-tipo-configuracao",
      equipamentoUid: this.props.equipamento.uid,
      equipamentoTipoUid: (this.props.tipo as Tipo).uid,
      index
    });
  }

  private aplicarCena(uid: Uid) {
    action({
      type: "transicao-para-cena", // aplicar-cena-agora
      uid
    });
  }

  private canais(): {
    index: number;
    value: string;
    tipo: string;
    unknow: boolean;
  }[] {
    const e = this.props.equipamento;
    const t = this.props.tipo;
    if (!e.grupo) {
      if (!t) throw new Error("Não foi encontrado Tipo");
      return t.canais.map((canal, index) => ({
        tipo: canal.tipo,
        index: e.inicio + index,
        unknow: false,
        value:
          typeof this.state.canais[index + e.inicio] != "undefined"
            ? this.state.canais[e.inicio + index] + ""
            : this.props.canais[index + e.inicio]
            ? this.props.canais[index + e.inicio] + "" || "0"
            : "0"
      }));
    }
    const tipos = this.props.tipos,
      equipamentos = this.props.equipamentos;
    if (!tipos) throw new Error("Tipos não encontrado.");
    if (!equipamentos) throw new Error("Equipamentos não encontrado.");
    return grupoCanais(e, equipamentos, tipos, this.props.canais);
  }
}
