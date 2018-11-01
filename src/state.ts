
export interface Equipamento {
    inicio: number,
    tipo: 'glow64' | 'par16',
    uid: number,
    cor: string,
    nome: string
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
    
    equipamentos: Equipamento[]
}