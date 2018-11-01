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
    if ( !state.dmx.conectado )
        throw 'conexão DMX não encontrada';
    if ( typeof e.index != 'number' )
        throw 'index inválido '+e.index+' typeof'+typeof e.index;
    if ( typeof e.value != 'number' )
        throw 'index inválido '+e.value+' typeof'+typeof e.value;
    if ( e.index < 1 || e.index > 255 )
        throw 'index fora da faixa '+e.index;
    if ( e.value < 1 || e.value > 255 )
        throw 'index fora da faixa '+e.index;
    dmx.update({[e.index]: e.value});
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
