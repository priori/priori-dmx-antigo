import { BrowserWindow, screen } from "electron";
import { onCloseTela } from "./state";

export function telasDisponiveis() {
  const telas = screen.getAllDisplays().map(d => ({
    width: d.size.width,
    height: d.size.height
  }));
  return telas;
}

export function abrirTela(index: number) {
  const electron = require("electron");
  const screens = electron.screen.getAllDisplays();
  const display = screens[index] || screens[screens.length - 1];
  const screen = new BrowserWindow({
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
  screen.loadURL(`file://${__dirname}/../screen.html`);
  screen.on("closed", () => {
    onCloseTela();
  });
  screen.webContents.openDevTools();
  return screen;
}
export function moverTela(screen: any, index: number) {
  const electron = require("electron");
  const screens = electron.screen.getAllDisplays();
  const display = screens[index] || screens[screens.length - 1];
  screen.setPosition(display.workArea.x, display.workArea.y);
  screen.setSize(display.workArea.width, display.workArea.height);
  screen.setFullScreen(true);
}
