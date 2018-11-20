import { AppInternalState } from "../types/internal-state";

const wm = new WeakMap();

const webMode = !!(window as any).webMode;
const electron = webMode ? null : require("electron");
const ipcRenderer = electron ? electron.ipcRenderer : null;

export function close(func: (e: AppInternalState) => void) {
  if (ipcRenderer) ipcRenderer.removeListener("state", wm.get(func));
  else console.log("close-action-call", func);
}

export function listen(func: (e: AppInternalState) => void) {
  const func2 = (_: any, e: AppInternalState) => func(e);
  wm.set(func, func2);
  if (ipcRenderer) ipcRenderer.on("state", func2);
  else console.log("listen-call", func);
}
