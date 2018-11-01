
export interface Equipamento {
    
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