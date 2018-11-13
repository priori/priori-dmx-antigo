export type CanaisTipo =
  | "red"
  | "green"
  | "blue"
  | "white"
  | "master"
  | "piscar"
  | "hue"
  | "animacao"
  | "animacao-velocidade"
  | "other";

export interface EquipamentoTipoConfiguracao {
  nome: string;
  canais: number[];
}
export type EquipamentoTipo = {
  uid: number;
  nome: string;
  configuracoes: EquipamentoTipoConfiguracao[];
  canais: {
    tipo: CanaisTipo;
  }[];
};
export interface Equipamento {
  inicio: number;
  tipoUid: number;
  uid: number;
  nome: string;
  configuracoes: {
    nome: string;
    canais: number[];
  }[];
}

export interface EquipamentosCena {
  uid: number;
  tipo: "equipamentos";
  nome: string;
  equipamentos: {
    uid: number;
    canais: number[];
  }[];
}
export interface MesaCena {
  uid: number;
  tipo: "mesa";
  nome: string;
  transicaoTempo: number;
  canais: {
    [key: number]: number;
  };
}
export type Cena = MesaCena | EquipamentosCena;

export interface AppState {
  window: {
    criando: boolean;
    criada: boolean;
  };

  equipamentoTipos: EquipamentoTipo[];

  dmx: {
    conectado: boolean;
    deviceId: string;
    driver: string;
  };

  canais: {
    [key: number]: number;
  };

  cenas: Cena[];

  ultimaCena: number | null;

  animacao: boolean;

  equipamentos: Equipamento[];
}

export interface IpcEvent {
  sender: IpcSender;
}
export interface IpcSender {
  send(name: string, val?: any): void;
}

export type AppAction =
  | { type: "app-start" }
  | { type: "salvar-mesa"; nome: string }
  | { type: "novo" }
  | { type: "abrir" }
  | { type: "salvar" }
  | { type: "aplicar-cena-agora"; uid: number }
  | { type: "transicao-para-cena"; uid: number }
  | { type: "salvar-cena"; uid: number }
  | { type: "editar-nome-da-cena"; uid: number; nome: string }
  | { type: "editar-tempo-da-cena"; uid: number; tempo: number }
  | { type: "dmx-conectar"; driver: string; deviceId: string }
  | { type: "dmx-desconectar" }
  | { type: "change-color"; equipamento: number; cor: string }
  | {
      type: "create-equipamento";
      nome: string;
      inicio: number;
      tipoUid: number;
    }
  | { type: "screen-started" }
  | { type: "slide"; index: number; value: number }
  | { type: "remove-equipamento"; uid: number }
  | { type: "editar-equipamento-nome"; uid: number; nome: string }
  | { type: "remove-cena"; uid: number }
  | { type: "equipamento-editar-inicio"; uid: number; inicio: number }
  | { type: "piscar-equipamento"; uid: number }
  | { type: "pulsar-equipamento"; uid: number }
  | { type: "cenas-sort"; sort: number[] }
  | { type: "equipamentos-sort"; sort: number[] }
  | { type: "criar-cena-equipamento"; uid: number; nome: string }
  | {
      type: "salvar-equipamento-tipo-configuracao";
      uid: number;
      nome: string;
    }
  | { type: "salvar-equipamento-configuracao"; uid: number; nome: string }
  | {
      type: "adicionar-equipamento-a-cena";
      uid: number;
      nome: string;
      cenaUid: number;
    }
  | {
      type: "remove-equipamento-configuracao";
      equipamentoUid: number;
      index: number;
    }
  | { type: "remove-equipamento-cena"; cenaUid: number; equipamentoUid: number }
  | {
      type: "remove-equipamento-tipo-configuracao";
      equipamentoTipoUid: number;
      index: number;
    };

export type Animacao =
  | {
      type: "transicao";
      de: Date;
      ate: Date;
      cena: number;
      canaisIniciais: { [key: number]: number };
    }
  | {
      type: "pulsar";
      equipamento: Equipamento;
      tipo: EquipamentoTipo;
      inicio: Date;
      valorInicial: number;
    }
  | {
      type: "piscar";
      equipamento: Equipamento;
      tipo: EquipamentoTipo;
      inicio: Date;
      valorInicial: number;
    };
