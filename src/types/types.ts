export type Uid = { __uid__: never } & number;
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

export interface TipoConfiguracao {
  readonly nome: string;
  readonly canais: number[];
}
export type Tipo = {
  readonly uid: Uid;
  readonly nome: string;
  readonly configuracoes: TipoConfiguracao[];
  readonly canais: {
    readonly tipo: CanaisTipo;
  }[];
};
export interface EquipamentoSimples {
  readonly grupo: false;
  readonly inicio: number;
  readonly tipoUid: Uid;
  readonly uid: Uid;
  readonly nome: string;
  readonly configuracoes: {
    readonly nome: string;
    readonly canais: number[];
  }[];
}

export interface EquipamentoGrupoInternalState {
  readonly equipamentos: Uid[];
  readonly nome: string;
  readonly uid: Uid;
  readonly grupo: true;
  readonly configuracoes: {
    readonly nome: string;
    readonly canais: (number|null)[];
    readonly cor: string|null;
  }[];
}

export interface EquipamentosCena {
  readonly uid: Uid;
  readonly tipo: "equipamentos";
  readonly nome: string;
  readonly transicaoTempo: number;
  readonly equipamentos: {
    readonly uid: Uid;
    readonly canais: (number|null)[];
    readonly cor: string|null;
  }[];
}
export interface MesaCena {
  readonly uid: Uid;
  readonly tipo: "mesa";
  readonly nome: string;
  readonly transicaoTempo: number;
  readonly canais: CanaisDmx;
}

export interface CenaSlide {
  readonly value: number;
  readonly uid: Uid;
  readonly canaisAnterior: {
    readonly [key: number]: number;
  };
}
export type Cena = MesaCena | EquipamentosCena;

export interface CanaisDmx {
  readonly [key: number]: number;
  __canaisdmx__: never;
}

export type Equipamento = EquipamentoSimples | EquipamentoGrupoInternalState;

export interface AppInternalState {
  readonly window: {
    readonly criando: boolean;
    readonly criada: boolean;
  };

  readonly cenaSlide: CenaSlide | null;

  readonly equipamentoTipos: Tipo[];

  readonly dmx: {
    readonly conectado: boolean;
    readonly deviceId: string;
    readonly driver: string;
  };

  readonly canais: CanaisDmx;

  readonly cenas: Cena[];

  readonly ultimaCena: number | null;

  readonly animacao: boolean;

  readonly equipamentos: (Equipamento)[];
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
  | { type: "aplicar-cena-agora"; uid: Uid }
  | { type: "transicao-para-cena"; uid: Uid }
  | { type: "salvar-cena"; uid: Uid }
  | { type: "editar-nome-da-cena"; uid: Uid; nome: string }
  | { type: "editar-tempo-da-cena"; uid: Uid; tempo: number }
  | { type: "dmx-conectar"; driver: string; deviceId: string }
  | { type: "dmx-desconectar" }
  | { type: "change-color"; equipamento: Uid; cor: string }
  | {
      type: "create-equipamento-grupo";
      nome: string;
      equipamentos: Uid[];
    }
  | {
      type: "create-equipamento";
      nome: string;
      inicio: number;
      tipoUid: Uid;
    }
  | { type: "screen-started" }
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
  | { type: "slide-cena"; uid: Uid; value: number };

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
      equipamento: EquipamentoSimples;
      tipo: Tipo;
      inicio: Date;
      valorInicial: number;
    }
  | {
      type: "piscar";
      equipamento: EquipamentoSimples;
      tipo: Tipo;
      inicio: Date;
      valorInicial: number;
    };
