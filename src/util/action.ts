import { AppAction } from "../types/types";

const webMode = !!(window as any).webMode;
const electron = !webMode ? require("electron") : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;
export function action(e: AppAction) {
  if (ipcRenderer) ipcRenderer.send("action-call", e);
  else if ((window as any).socket) {
    (window as any).socket.send(JSON.stringify(e));
  } else if (typeof fetch != "undefined") {
    fetch("/action-call", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify(e)
    });
  } else {
    console.log("action-call", e);
  }
}
