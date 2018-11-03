
export interface Equipamento {
    inicio: number,
    tipo: 'glow64' | 'par16',
    uid: number,
    cor: string,
    nome: string
}

export interface Cena {
    tipo: 'mesa',
    uid: number,
    nome: string,
    transicaoTempo: number,
    canais: {
        [key:number]: number
    }
}

export interface AppState{

    window: {
        criando: boolean,
        criada: boolean
    },

    dmx: {
        conectado: boolean,
        deviceId: string,
        driver: string
    },

    canais: {
        [key:number]: number
    },
    
    cenas: Cena[],

    ultimaCena: number|null,

    animacao: {
        de: Date,
        ate: Date,
        cena: number
    }|null,
    
    equipamentos: Equipamento[]
}