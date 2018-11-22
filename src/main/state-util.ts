import { AppInternalState } from "../types/internal-state";
import * as fs from "fs";
import { deepFreeze } from "../util/equals";
import { initialTipos } from "./state";
import { telasDisponiveis } from "./telas";

export function readState(file: string): AppInternalState | undefined {
  const fileContent = fs.readFileSync(file).toString();
  if (fileContent) {
    const json = JSON.parse(fileContent) as AppInternalState;
    if (!json.equipamentoTipos) (json as any).equipamentoTipos = initialTipos;
    for (const e of json.equipamentos) {
      if (!e.configuracoes) (e as any).configuracoes = [];
      if ((e as any).tipo == "glow64") {
        delete (e as any).tipo;
        (e as any).tipoUid = 1;
      } else if ((e as any).tipo == "par16") {
        delete (e as any).tipo;
        (e as any).tipoUid = 2;
      } else if ((e as any).tipo) {
        throw new Error("Json inválido");
      }
    }
    for (const t of json.equipamentoTipos) {
      if (!t.configuracoes) (t as any).configuracoes = [];
    }
    (json as any).animacao = false;
    if (!json.arquivos) {
      (json as any).arquivos = [];
    }
    if (!json.telas) {
      (json as any).telas = {
        aberta: null
      };
    }
    // if (!json.player) {
    (json as any).player = {
      arquivo: null,
      state: "stop"
    };
    //}
    (json as any).telas.disponiveis = telasDisponiveis();
    if (!json.httpServer)
      (json as any).httpServer = {
        open: false,
        port: 8080
      };
    deepFreeze(json);
    return json;
  }
  return undefined;
}
