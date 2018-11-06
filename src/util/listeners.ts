import { ipcRenderer } from "electron";
import { AppState } from "../types";

const wm = new WeakMap();

export function close(func: (e: AppState) => void) {
  ipcRenderer.removeListener("state", wm.get(func));
}

export function listen(func: (e: AppState) => void) {
  const func2 = (_: any, e: AppState) => func(e);
  wm.set(func, func2);
  ipcRenderer.on("state", func2);
}
