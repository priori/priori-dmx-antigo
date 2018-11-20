import { actionCall, currentState } from "./state";
import * as path from "path";
import { AppInternalState } from "../types/internal-state";

const express = require("express");
var bodyParser = require("body-parser");

const app = express();
var expressWs = require("express-ws")(app) as any;

app.get("/state", (_: any, res: any) => {
  res.json(currentState());
});
app.get("/", function(_: any, res: any) {
  res.sendFile(path.join(__dirname, "..", "..", "/public/web.html"));
});
app.ws("/state", function(ws: any) {
  ws.send(JSON.stringify(currentState()));
});

export function httpServerListener(state: AppInternalState) {
  for (const ws of expressWs.getWss().clients) {
    ws.send(JSON.stringify(state));
  }
}

app.use(bodyParser.json());

app.post("/action-call", (req: any, res: any) => {
  // req.body.type == "app-start" throw error
  actionCall(req.body);
  res.json(1);
});

app.use(express.static("public"));

let listening: any = null;

export function httpOpen(port: number) {
  if (listening)
    listening.close(() => {
      listening = null;
    });
  listening = app.listen(port);
}

export function httpClose() {
  if (listening)
    listening.close(() => {
      listening = null;
    });
  listening = null;
}
