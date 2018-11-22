import * as http from "http";

const abrirEndPoint = "http://192.168.137.30/move/1024";
const fecharEndPoint = "http://192.168.137.30/move/-1024";
const tampaPlayDelay = 500;
const tampaTime = 2500;

let abrindo = false;
let fechando = false;

let aberto: boolean | undefined = undefined;

export function abrirTampa(func: () => void) {
  if (abrindo || fechando) throw new Error("Aguarde a movimentação da tampa.");
  if (aberto === true) throw new Error("Tampa já aberta.");

  console.log("abrindo tampa...");

  http.get(abrirEndPoint).on("error", (e: any) => {
    console.error("GET error", abrirEndPoint, e && e.stack ? e.stack : e);
  });

  aberto = true;
  abrindo = true;

  setTimeout(() => {
    setTimeout(() => {
      abrindo = false;
    }, tampaTime - tampaPlayDelay);
    func();
  }, tampaPlayDelay);
}

export function fecharTampa() {
  if (abrindo || fechando) throw new Error("Aguarde a movimentação da tampa.");
  if (aberto === false) throw new Error("Tampa já fechada.");

  http.get(fecharEndPoint).on("error", (e: any) => {
    console.error("GET error", fecharEndPoint, e && e.stack ? e.stack : e);
  });
  fechando = true;
  aberto = false;

  setTimeout(() => {
    fechando = false;
  }, tampaTime);

  console.log("fechando tampa...");
}
