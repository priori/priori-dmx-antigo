import { ipcRenderer } from "electron";
import { AppInternalState } from "../types/types";

const wm = new WeakMap();

export function close(func: (e: AppInternalState) => void) {
  ipcRenderer.removeListener("state", wm.get(func));
}

export function listen(func: (e: AppInternalState) => void) {
  const func2 = (_: any, e: AppInternalState) => func(e);
  wm.set(func, func2);
  ipcRenderer.on("state", func2);
}
