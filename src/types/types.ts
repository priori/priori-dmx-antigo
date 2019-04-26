import { EquipamentoSimplesIS, Tipo, Uid } from "./internal-state";

export interface IpcEvent {
  sender: IpcSender;
}

export interface IpcSender {
  send(name: string, val?: any): void;
}

export type AppAction =
  | { type: "app-start" }
  | { type: "repeat" }
  | { type: "volume"; volume: number }
  | { type: "http-open"; port: number }
  | { type: "novos-arquivos"; arquivos: string[] }
  | { type: "http-close" }
  | { type: "salvar-mesa"; nome: string }
  | { type: "novo" }
  | { type: "abrir" }
  | { type: "salvar" }
  | { type: "aplicar-cena-agora"; uid: Uid }
  | { type: "transicao-para-cena"; uid: Uid }
  | { type: "salvar-cena"; uid: Uid }
  | { type: "editar-nome-da-cena"; uid: Uid; nome: string }
  | { type: "editar-nome-do-arquivo"; path: string; nome: string }
  | { type: "editar-tempo-da-cena"; uid: Uid; tempo: number }
  | { type: "dmx-conectar"; driver: string; deviceId: string }
  | { type: "dmx-desconectar" }
| { type: "editar-equipamento-posicao"; uid: Uid; row?: number, col?: number }
  | { type: "change-color"; equipamento: Uid; cor: string }
  | {
    type: "create-equipamento-grupo";
    nome: string;
    equipamentos: Uid[];
  row?: number;
  col?: number;
  }
| {
    type: "create-equipamento";
    nome: string;
    inicio: number;
    tipoUid: Uid;
  row?: number;
  col?: number;
  }
  | { type: "screen-started" }
  | { type: "arquivo-play"; path: string }
  | { type: "arquivo-stop" }
  | { type: "arquivo-pause" }
  | { type: "slide"; index: number; value: number }
  | { type: "multiple-slide"; canais: { [k: number]: number } }
  | { type: "remove-equipamento"; uid: Uid }
  | { type: "editar-equipamento-nome"; uid: Uid; nome: string }
  | { type: "remove-cena"; uid: Uid }
  | { type: "equipamento-editar-inicio"; uid: Uid; inicio: number }
  | { type: "piscar-equipamento"; uid: Uid }
  | { type: "pulsar-equipamento"; uid: Uid }
  | { type: "cenas-sort"; sort: Uid[] }
  | { type: "equipamentos-sort"; sort: Uid[] }
  | { type: "criar-cena-equipamento"; uid: Uid; nome: string }
  | { type: "remove-arquivo"; arquivo: string }
  | {
      type: "salvar-equipamento-tipo-configuracao";
      uid: Uid;
      nome: string;
    }
  | { type: "salvar-equipamento-configuracao"; uid: Uid; nome: string }
  | {
      type: "aplicar-equipamento-configuracao";
      equipamentoUid: Uid;
      index: number;
    }
  | {
      type: "aplicar-equipamento-tipo-configuracao";
      equipamentoUid: Uid;
      equipamentoTipoUid: Uid;
      index: number;
    }
  | {
      type: "adicionar-equipamento-a-cena";
      uid: Uid;
      nome: string;
      cenaUid: Uid;
    }
  | {
      type: "remove-equipamento-configuracao";
      equipamentoUid: Uid;
      index: number;
    }
  | { type: "remove-equipamento-cena"; cenaUid: Uid; equipamentoUid: Uid }
  | {
      type: "remove-equipamento-tipo-configuracao";
      equipamentoTipoUid: Uid;
      index: number;
    }
  | { type: "slide-cena"; uid: Uid; value: number }
  | { type: "ativar-tela"; index: number };

export type Animacao =
  | {
      type: "transicao";
      de: Date;
      ate: Date;
      cena: Uid;
      canaisIniciais: { [key: number]: number };
    }
  | {
      type: "slide-cena";
      de: Date;
      ate: Date;
      cena: Uid;
    }
  | {
      type: "pulsar";
      equipamento: EquipamentoSimplesIS;
      tipo: Tipo;
      inicio: Date;
      valorInicial: number;
    }
  | {
      type: "piscar";
      equipamento: EquipamentoSimplesIS;
      tipo: Tipo;
      inicio: Date;
      valorInicial: number;
    };
