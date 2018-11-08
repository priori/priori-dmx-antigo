export type EquipamentoTipo = "glow64" | "par16";
export interface Equipamento {
  inicio: number;
  tipo: EquipamentoTipo;
  uid: number;
  nome: string;
}

export interface Cena {
  tipo: "mesa";
  uid: number;
  nome: string;
  transicaoTempo: number;
  canais: {
    [key: number]: number;
  };
}

export interface AppState {
  window: {
    criando: boolean;
    criada: boolean;
  };

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
      tipo: EquipamentoTipo;
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
  | { type: "equipamentos-sort"; sort: number[] };

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
      inicio: Date;
      valorInicial: number;
    }
  | {
      type: "piscar";
      equipamento: Equipamento;
      inicio: Date;
      valorInicial: number;
    };
