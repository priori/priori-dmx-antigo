import { app, BrowserWindow } from "electron";
import installExtension, {
  REACT_DEVELOPER_TOOLS
} from "electron-devtools-installer";
import { enableLiveReload } from "electron-compile";
import { close } from "./main/actions";
import {close as close2, start} from "./main/state";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: Electron.BrowserWindow | null = null;

const isDevMode = process.execPath.match(/[\\/]electron/);

if (isDevMode) {
  enableLiveReload({ strategy: "react-hmr" });
}

const createWindow = async () => {
  start();
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600
  });
  mainWindow.setMenu(null);
  mainWindow.loadURL(`file://${__dirname}/index.html`);
  if (isDevMode) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    await installExtension(REACT_DEVELOPER_TOOLS);
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
    close();
    close2();
  });
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
