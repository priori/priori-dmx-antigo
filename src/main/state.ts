import { BrowserWindow, ipcMain } from "electron";
import {
    AppInternalState,
    Tipo,
    Uid, CanaisDmx
} from "../types/internal-state";
import {
    IpcSender,
    IpcEvent,
    AppAction,
} from "../types/types";
import * as path from "path";
import * as fs from "fs";
import * as dmx from "./dmx";
import {deepFreeze} from "../util/equals";
import {httpOpen, httpServerListener} from "./http-server";
import {readState} from "./state-util";

let screen: BrowserWindow | null,
  appSender: IpcSender | null = null;

const emptyCanais = {} as CanaisDmx;
for ( let c=1; c<=255; c++ )
  (emptyCanais as any)[c] = 0;
deepFreeze(emptyCanais);

export const emptyState: AppInternalState = {
  window: {
    criando: false,
    criada: false
  },
  dmx: {
    conectado: false,
    driver: "enttec-usb-dmx-pro",
    deviceId: "COM5"
  },
  httpServer: {
    open: false,
    port: 8080
  },
  cenaSlide: null,
  ultimaCena: null,
  animacao: false,
  canais: emptyCanais,
  equipamentos: [],
  equipamentoTipos: [],
  cenas: []
};
deepFreeze(emptyState);

let state = emptyState;

function getDir() {
  if ((global as any).process.env.APPDATA) {
    return (global as any).process.env.APPDATA;
  } else if ((global as any).process.env.HOME) {
    return (global as any).process.env.HOME;
  } else {
    return null;
  }
}

export function generateUid(): Uid {
  const state = currentState();
  return ((state.equipamentos.length || state.cenas.length
    ? Math.max(
        ...state.equipamentos.map(e => e.uid as number),
        ...state.cenas.map(c => c.uid as number),
        ...state.equipamentoTipos.map(c => c.uid as number)
      ) + 1
    : 1) as any) as Uid;
}

function getFile() {
  const dir = getDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  return path.join(dir, "priori-dmx.json");
}
export function saveState(file: string, state:AppInternalState) {
  fs.writeFileSync(file, JSON.stringify(state));
}
export const initialTipos = [
  {
    // glow64
    nome: "LED 64 GLOW",
    uid: 1 as Uid,
    canais: [
      { tipo: "red" },
      { tipo: "green" },
      { tipo: "blue" },
      { tipo: "white" },
      { tipo: "master" },
      { tipo: "piscar" },
      { tipo: "hue" },
      { tipo: "animacao" },
      { tipo: "animacao-velocidade" }
    ]
  },
  {
    // par16
    nome: "PAR LED 16",
    uid: 2 as Uid,
    canais: [
      { tipo: "master" },
      { tipo: "red" },
      { tipo: "green" },
      { tipo: "blue" }
    ]
  }
] as Tipo[];
const file = getFile();
if (!fs.existsSync(file)) {
  saveState(file,state);
} else {
  const json = readState(file);
  if (json) {
    state = json;
    if (state.dmx.conectado) {
      dmx.connect(
        state.dmx.driver,
        state.dmx.deviceId
      );
      dmx.update(state.canais);
    }
    if ( state.httpServer.open ) {
      httpOpen(state.httpServer.port);
    }
  }
}

let screenSender: IpcSender | null;
// ipcMain.on('state',(_:IpcEvent,newState:any)=>{
//     state = newState;
//     if ( screenSender )
//         screenSender.send('state',state);
// });

// ipcMain.on('action',(event:IpcEvent,action:AppAction)=>{
//     if ( action.type == 'screen-start' ){
//         screenSender = event.sender;
//         // screenSender.send('state',state);
//         setState({
//             ...state,
//             window: {
//                 ...state.window,
//                 criando: false,
//                 criada: true
//             }
//         })
//     }
// });

ipcMain.on("action-call", (event: IpcEvent, action: AppAction) => {
  if (action.type == "app-start") {
    if (appSender && appSender != event.sender) throw "Invalid sender.";
    appSender = event.sender;
    appSender.send("state", state);
  }
});

const maxThrotle = 1000;
const throtleTime = 20;
let timeoutThrotle: any;
let firstThrotle: Date | null = null;

function sendState(state: AppInternalState) {
    if (!appSender) throw "Sem appSender.";
    appSender.send("state", state);
    if (screenSender) screenSender.send("state", state);
    httpServerListener(state);
}

export function setState(newState: AppInternalState, force = false) {
    if ( Object.keys(newState.canais).length != 255 )
      throw new Error("Canais inválido."+"\n"+JSON.stringify(newState.canais));
  for ( const key in newState.canais ) {
    const index = parseInt(key);
    if ( index < 1 || index > 255 || index != index || typeof index != "number" )
        throw new Error("Canais inválido. Index: "+index+"\n"+JSON.stringify(newState.canais));
    const value = newState.canais[key];
    if ( value === null || typeof value == "undefined" || typeof value != "number" || value < 0 || value > 255 || value != value )
      throw new Error("Valor inválido para canal. "+value+"\n"+JSON.stringify(newState.canais));
  }
  if (!appSender) throw "Sem appSender.";
  deepFreeze(newState);
  state = newState;

    if (timeoutThrotle) clearTimeout(timeoutThrotle);
    if (force) {
        sendState(state);
    }
    if (!firstThrotle) firstThrotle = new Date();
    else if (new Date().getTime() - firstThrotle.getTime() > maxThrotle) {
        firstThrotle = null;
        if (!appSender) throw "Sem appSender.";
        saveState(file,newState);
        if (!force) {
            sendState(state);
        }
        return;
    }
    timeoutThrotle = setTimeout(() => {
        if (!appSender) throw "Sem appSender.";
        saveState(file,newState);
        if (!force) {
            sendState(state);
        }
    }, throtleTime);

}



let listeners:((_:AppAction)=>void)[] = [];

export function currentState() {
  return state;
}

export function on(func: (e: AppAction) => void) {
  listeners.push(func);
}

export function actionCall(e: AppAction) {
    try {
        for ( const l of listeners )
            l(e);
    }catch (err) {
        if ( err && err.stack )
            console.error(err.stack);
        else
            console.error(err);
    }
}

ipcMain.on("action-call", (event: IpcEvent, e: AppAction) => {
    try {
        if (event.sender != appSender) throw "Invalid sender.";
        actionCall(e);
    }catch (err) {
        if ( err && err.stack )
            console.error(err.stack);
        else
            console.error(err);
    }
});

// ipcMain.on('action',(event:IpcEvent,e:AppAction)=>{
//     if ( event.sender != appSender )
//         throw 'Invalid sender.';
//     if ( e.type == 'new-screen-request' ) {
//         if (state.window.criada)
//             throw 'Já existe janela.';
//         if (state.window.criando)
//             throw 'Já está sendo criada.';
//         setState({
//             ...state,
//             window: {
//                 criando: true,
//                 criada: false
//             }
//         });
//         const id = e.id,
//             electron = require('electron'),
//             display = electron.screen.getAllDisplays().filter(d => d.id == id)[0];
//         if (!screen) {
//             screen = new BrowserWindow({
//                 webPreferences: {
//                     nodeIntegrationInWorker: true
//                 },
//                 width: display.workArea.width,
//                 height: display.workArea.height,
//                 x: display.workArea.x,
//                 y: display.workArea.y
//             });
//             screen.setMenu(null);
//             screen.setFullScreen(true);
//             // screen.setResizable(false);
//             screen.loadURL(`file://${__dirname}/screen.html`);
//             screen.on('closed', () => {
//                 screen = null;
//                 screenSender = null;
//                 appSender = null;
//                 setState({
//                     ...state,
//                     window: {
//                         ...state.window,
//                         criando: false,
//                         criada: false
//                     }
//                 })
//             });
//             screen.webContents.openDevTools();
//         } else {
//             screen.setPosition(display.workArea.x, display.workArea.y);
//             screen.setSize(display.workArea.width, display.workArea.height);
//             screen.setFullScreen(true);
//         }
//     }
// });

export function close() {
  appSender = null;
  if (screen) {
    screen.close();
    screen = null;
  }
}
