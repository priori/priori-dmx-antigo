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

export interface TipoConf {
  readonly nome: string;
  readonly canais: number[];
}
export type Tipo = {
  readonly uid: Uid;
  readonly nome: string;
  readonly configuracoes: TipoConf[];
  readonly canais: {
    readonly tipo: CanaisTipo;
  }[];
};
export interface EquipamentoSimplesIS {
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

export interface EquipamentoGrupoIS {
  readonly equipamentos: Uid[];
  readonly nome: string;
  readonly uid: Uid;
  readonly grupo: true;
  readonly configuracoes: {
    readonly nome: string;
    readonly canais: (number | null)[];
    readonly cor: string | null;
  }[];
}

export interface EquipamentosCenaIS {
  readonly uid: Uid;
  readonly tipo: "equipamentos";
  readonly nome: string;
  readonly transicaoTempo: number;
  readonly equipamentos: {
    readonly uid: Uid;
    readonly canais: (number | null)[];
    readonly cor: string | null;
  }[];
}
export interface MesaCenaIS {
  readonly uid: Uid;
  readonly tipo: "mesa";
  readonly nome: string;
  readonly transicaoTempo: number;
  readonly canais: CanaisDmx;
}

export interface CenaSlideIS {
  readonly value: number;
  readonly uid: Uid;
  readonly canaisAnterior: {
    readonly [key: number]: number;
  };
}
export type CenaIS = MesaCenaIS | EquipamentosCenaIS;

export interface CanaisDmx {
  readonly [key: number]: number;
  __canaisdmx__: never;
}

export type ArquivoType = "img" | "video" | "audio";
export interface Arquivo {
  readonly type: ArquivoType;
  readonly path: string;
  readonly nome: string;
}
export type EquipamentoIS = EquipamentoSimplesIS | EquipamentoGrupoIS;

export type PlayerState = "play" | "stop" | "pause";

export interface AppInternalState {
  readonly window: {
    readonly criando: boolean;
    readonly criada: boolean;
  };

  readonly httpServer: {
    open: boolean;
    port: number;
  };

  readonly telas: {
    readonly aberta: number | null;
    readonly disponiveis: {
      readonly width: number;
      readonly height: number;
    }[];
  };

  readonly arquivos: Arquivo[];

  readonly cenaSlide: CenaSlideIS | null;

  readonly equipamentoTipos: Tipo[];

  readonly dmx: {
    readonly conectado: boolean;
    readonly deviceId: string;
    readonly driver: string;
  };

  readonly canais: CanaisDmx;

  readonly cenas: CenaIS[];

  readonly ultimaCena: number | null;

  readonly player: {
    arquivo: string | null;
    state: PlayerState;
    repeat: boolean;
    volume: number;
  };

  readonly animacao: boolean;

  readonly equipamentos: (EquipamentoIS)[];
}
