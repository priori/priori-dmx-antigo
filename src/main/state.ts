import { BrowserWindow, ipcMain } from "electron";
import { AppState, IpcSender, IpcEvent, AppAction } from "../types";
import * as path from "path";
import * as fs from "fs";
import * as dmx from "./dmx";

let screen: BrowserWindow | null,
  appSender: IpcSender | null = null;

export const emptyState: AppState = {
  window: {
    criando: false,
    criada: false
  },
  dmx: {
    conectado: false,
    driver: "enttec-usb-dmx-pro",
    deviceId: "COM5"
  },
  ultimaCena: null,
  animacao: false,
  canais: {},
  equipamentos: [],
  cenas: []
};

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
const dir = getDir();
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}
const file = path.join(dir, "priori-dmx.json");
if (!fs.existsSync(file)) {
  fs.writeFileSync(file, JSON.stringify(state));
} else {
  const fileContent = fs.readFileSync(file).toString();
  if (fileContent) {
    const json = JSON.parse(fileContent) as AppState;
    if (json) {
      state = json;
      if (state.dmx.conectado) {
        dmx.connect(
          state.dmx.driver,
          state.dmx.deviceId
        );
        dmx.update(state.canais);
      }
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
export function setState(newState: AppState) {
  if (!appSender) throw "Sem appSender.";
  state = newState;
  if (timeoutThrotle) clearTimeout(timeoutThrotle);
  if (!firstThrotle) firstThrotle = new Date();
  else if (new Date().getTime() - firstThrotle.getTime() > maxThrotle) {
    firstThrotle = null;
    if (!appSender) throw "Sem appSender.";
    fs.writeFileSync(file, JSON.stringify(state));
    appSender.send("state", state);
    if (screenSender) screenSender.send("state", state);
    return;
  }
  timeoutThrotle = setTimeout(() => {
    if (!appSender) throw "Sem appSender.";
    fs.writeFileSync(file, JSON.stringify(state));
    appSender.send("state", state);
    if (screenSender) screenSender.send("state", state);
  }, throtleTime);
}

export function currentState() {
  return state;
}

export function on(func: (e: AppAction) => void) {
  ipcMain.on("action-call", (event: IpcEvent, e: AppAction) => {
    if (event.sender != appSender) throw "Invalid sender.";
    func(e);
  });
}

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
