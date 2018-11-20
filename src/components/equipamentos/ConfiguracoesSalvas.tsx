import * as React from "react";
import {
  CenaIS,
  EquipamentoSimplesIS,
  EquipamentosCenaIS,
  Tipo,
  EquipamentoGrupoIS,
  Uid
} from "../../types/internal-state";
import { SoftPanel } from "../util/SoftPanel";
import { action } from "../../util/action";

export interface ConfiguracoesSalvasProps {
  equipamento: EquipamentoSimplesIS | EquipamentoGrupoIS;
  tipo: Tipo | null;
  onClose: () => void;
  cenas: CenaIS[];
}
export interface ConfiguracoesSalvasState {}
export class ConfiguracoesSalvas extends React.Component<
  ConfiguracoesSalvasProps,
  ConfiguracoesSalvasState
> {
  constructor(props: ConfiguracoesSalvasProps) {
    super(props);
    this.state = {};
  }
  render() {
    const cenas = this.props.cenas.filter(
      c =>
        c.tipo == "equipamentos" &&
        c.equipamentos.find(e => e.uid == this.props.equipamento.uid)
    ) as EquipamentosCenaIS[];
    const tipo = this.props.tipo;
    return (
      <SoftPanel
        onBlur={() => {
          this.props.onClose();
        }}
        className="equipamentos"
      >
        <div>
          {this.props.equipamento.configuracoes.length == 0 &&
          tipo &&
          tipo.configuracoes.length == 0 &&
          cenas.length == 0 ? (
            <div>Nenhuma configuração salva.</div>
          ) : null}
          {this.props.equipamento.configuracoes.length ? (
            <div>
              <h2 style={{ margin: 0 }}>
                Equipamento {this.props.equipamento.nome}
              </h2>
              {(this.props.equipamento.configuracoes as { nome: string }[]).map(
                (e, index: number) => (
                  <div key={index}>
                    {e.nome}{" "}
                    <button onClick={() => this.remover(index)}>Remover</button>
                  </div>
                )
              )}
            </div>
          ) : null}
          {tipo && tipo.configuracoes.length ? (
            <div>
              <h2 style={{ margin: 0 }}>{tipo.nome}</h2>
              {tipo.configuracoes.map((c, i) => (
                <div key={i}>
                  {c.nome}{" "}
                  <button onClick={() => this.removerNoTipo(i)}>Remover</button>
                </div>
              ))}
            </div>
          ) : null}
          {cenas.length ? (
            <div>
              <h2 style={{ margin: 0 }}>Cenas</h2>
              {cenas.map(c => (
                <div key={c.uid}>
                  {c.nome}{" "}
                  {c.equipamentos.length > 1 ? (
                    <button
                      onClick={() => this.removerEquipamentoNaCena(c.uid)}
                    >
                      Remover Equipamento
                    </button>
                  ) : (
                    <button onClick={() => this.removerCena(c.uid)}>
                      Remover Cena
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : null}
          <div>
            <button onClick={() => this.props.onClose()}>Cancelar</button>
          </div>
        </div>
      </SoftPanel>
    );
  }

  private remover(index: number) {
    action({
      type: "remove-equipamento-configuracao",
      index,
      equipamentoUid: this.props.equipamento.uid
    });
  }

  private removerEquipamentoNaCena(uid: Uid) {
    action({
      type: "remove-equipamento-cena",
      cenaUid: uid,
      equipamentoUid: this.props.equipamento.uid
    });
  }

  private removerNoTipo(i: number) {
    const tipo = this.props.tipo as Tipo;
    action({
      type: "remove-equipamento-tipo-configuracao",
      equipamentoTipoUid: tipo.uid,
      index: i
    });
  }

  private removerCena(uid: Uid) {
    action({ type: "remove-cena", uid });
  }
}
