import { BrowserWindow, ipcMain} from 'electron';
import {AppState, Equipamento} from "../state";
const DMX = require('dmx'),
    dmx = new DMX;

interface IpcEvent {
    sender: IpcSender
}
interface IpcSender {
    send(name:string,val?:any):void
}
let screen:BrowserWindow|undefined;
let appSender:IpcSender|undefined = undefined;
let state:AppState = {
    window: {
        criando: false,
        criada: false
    },
    dmx: {
        conectado: false,
        driver: 'enttec-usb-dmx-pro',
        deviceId: 'COM5'
    },
    canais: {},
    equipamentos: []
};
let screenSender:IpcSender|undefined;
// ipcMain.on('state',(_:IpcEvent,newState:any)=>{
//     state = newState;
//     if ( screenSender )
//         screenSender.send('state',state);
// });

ipcMain.on('screen-start',(event:IpcEvent)=>{
    screenSender = event.sender;
    // screenSender.send('state',state);
    setState({
        ...state,
        window: {
            ...state.window,
            criando: false,
            criada: true
        }
    })
});

ipcMain.on('app-start',(event:IpcEvent)=>{
    if ( appSender && appSender != event.sender )
        throw 'Invalid sender.';
    appSender = event.sender;
    appSender.send('state',state);
});

function setState(newState:AppState){
    if ( !appSender )throw 'Sem appSender.';
    state = newState;
    appSender.send('state',state);
    if ( screenSender )
        screenSender.send('state',state);
}

function on(name:string,func:(e:any)=>void){
    ipcMain.on(name,(event:IpcEvent,e:any)=>{
        if ( event.sender != appSender )
            throw 'Invalid sender.';
        func(e);
    });
}
// ipcMain.on('dmx-update',(_:IpcEvent,values:any)=>{
//     dmx.update('main',values);
// });

on('dmx-conectar',(e:any)=>{
    dmx.addUniverse('main',e.driver,e.deviceId);
    setState({
        ...state,
        dmx: {
            ...state.dmx,
            conectado: true,
            driver: e.driver,
            deviceId: e.deviceId
        }
    })
});

let uidCount=1;
on('create-equipamento',({nome,inicio,tipo})=>{
    setState({
        ...state,
        equipamentos: [
            ...state.equipamentos,
            {
                uid: uidCount++,
                nome,
                inicio,
                tipo,
                cor: '#000000'
            }
        ]
    })
});

on('change-color',(e)=>{
    const {cor} = e;
    const uid = e.equipamento;
    const equipamento = state.equipamentos.filter(e=>e.uid == uid)[0] || null;
    let r = parseInt(cor.substr(1,2),16),
        g = parseInt(cor.substr(3,2),16),
        b = parseInt(cor.substr(5,2),16);

    if ( equipamento.tipo == 'glow64' ) {
        const brancoDosOutros = 3;
        let w = Math.min(r, g, b);
        r -= w;
        g -= w;
        b -= w;
        w = w * (brancoDosOutros+1);
        if ( w > 255 ) {
            const inc = Math.floor((w-255) / (brancoDosOutros) );
            r += inc;
            g += inc;
            b += inc;
            w = 255;
        }

        const data = {
            [equipamento.inicio]: r,
            [equipamento.inicio + 1]: g,
            [equipamento.inicio + 2]: b,
            [equipamento.inicio + 3]: w,
            [equipamento.inicio + 4]: r || g|| b|| w ? 255 : 0
        };
        dmx.update('main',data);
        setState({
            ...state,
            canais: {
                ...state.canais,
                ...data
            },
            equipamentos: state.equipamentos.map(e=> e.uid == uid ? {
                ...e,
                cor
            }: e)
        });
    } else if ( equipamento.tipo == 'par16' ) {

        const data = {
            [equipamento.inicio]: r||g||b  ? 255 : 0,
            [equipamento.inicio + 1]: r,
            [equipamento.inicio + 2]: g,
            [equipamento.inicio + 3]: b
        };
        dmx.update('main',data);
        setState({
            ...state,
            canais: {
                ...state.canais,
                ...data
            },
            equipamentos: state.equipamentos.map(e=> e.uid == uid ? {
                ...e,
                cor
            }: e)
        });
    } else {
        console.error(equipamento,cor,r,g,b);
    }
})

on('dmx-desconectar',()=>{
    dmx.universes.main.close();
    delete dmx.universes.main;
    setState({
        ...state,
        dmx: {
            ...state.dmx,
            conectado: false
        }
    });
});

on('slide',(e:any)=>{
    if ( !state.dmx.conectado ) {
        console.error('conexao DMX nao encontrada');
        return;
    }
    if ( typeof e.index != 'number' ) {
        console.error('index invalido ' + e.index + '. typeof ' + (typeof e.index));
        return;
    }
    if ( typeof e.value != 'number' ) {
        console.error('value invalido ' + e.value + '. typeof ' + (typeof e.value));
        return;
    }
    if ( e.index < 0 || e.index > 255 ) {
        console.error('index fora da faixa. ' + e.index);
        return;
    }
    if ( e.value < 0 || e.value > 255 ) {
        console.error('value fora da faixa. ' + e.value);
        return;
    }
    dmx.update('main',{[e.index]: e.value});
    setState({
        ...state,
        canais: {
            ...state.canais,
            [e.index]: e.value
        }
    })
});

on('novo-equipamento',(e:any)=>{
    setState({
        ...state,
        equipamentos: [...state.equipamentos,e as Equipamento]
    })
});

on('new-screen-request',(args:any)=> {
    if ( state.window.criada )
        throw 'Já existe janela.';
    if ( state.window.criando )
        throw 'Já está sendo criada.';
    setState({
        ...state,
        window: {
            criando: true,
            criada: false
        }
    });
    const id = args.id,
        electron = require('electron'),
        display = electron.screen.getAllDisplays().filter(d => d.id == id)[0];
    if (!screen) {
        screen = new BrowserWindow({
            webPreferences: {
                nodeIntegrationInWorker: true
            },
            width: display.workArea.width,
            height: display.workArea.height,
            x: display.workArea.x,
            y: display.workArea.y
        });
        screen.setMenu(null);
        screen.setFullScreen(true);
        // screen.setResizable(false);
        screen.loadURL(`file://${__dirname}/screen.html`);
        screen.on('closed', () => {
            screen = undefined;
            screenSender = undefined;
            appSender = undefined;
            setState({
                ...state,
                window: {
                    ...state.window,
                    criando: false,
                    criada: false
                }
            })
        });
        screen.webContents.openDevTools();
    } else {
        screen.setPosition( display.workArea.x, display.workArea.y );
        screen.setSize( display.workArea.width, display.workArea.height );
        screen.setFullScreen(true);
    }
});

export function close(){
    appSender = undefined;
    if ( screen ) {
        screen.close();
        screen = undefined;
    }
}
