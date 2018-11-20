import { AppAction } from "../types/types";
// import ipcRenderer = Electron.ipcRenderer;

const webMode = !!(window as any).parcelRequire;
const electron = !webMode ? require("electron"): null;
const ipcRenderer = electron ? electron.ipcRenderer : null;
export function action(e: AppAction) {
  if ( ipcRenderer )
    ipcRenderer.send("action-call", e);
  else
    console.log("action-call",e);
}
