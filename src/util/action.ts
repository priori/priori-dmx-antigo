import { AppAction } from "../types/types";
// import ipcRenderer = Electron.ipcRenderer;

const ipcRenderer = require("electron").ipcRenderer;
export function action(e: AppAction) {
  ipcRenderer.send("action-call", e);
}
