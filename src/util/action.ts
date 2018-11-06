import { ipcRenderer } from "electron";
import { AppAction } from "../types";

export function action(e: AppAction) {
  ipcRenderer.send("action-call", e);
}
