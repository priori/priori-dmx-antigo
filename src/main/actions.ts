import { dialog } from "electron";
import { Cena, Equipamento, EquipamentoTipo } from "../types";
import { color2rgb, color2rgbw } from "../util/cores";
import * as dmx from "./dmx";
import {currentState, emptyState, on, readState, saveState, setState, uid} from "./state";

function dmxConectar(e: { driver: string; deviceId: string }): void {
  const state = currentState();
  dmx.connect(
    e.driver,
    e.deviceId
  );
  dmx.update(state.canais);
  setState({
    ...state,
    dmx: {
      ...state.dmx,
      conectado: true,
      driver: e.driver,
      deviceId: e.deviceId
    }
  });
}

function createEquipamento({
  nome,
  inicio,
  tipo
}: {
  nome: string;
  inicio: number;
  tipo: EquipamentoTipo;
}): void {
  const state = currentState();
  setState({
    ...state,
    equipamentos: [
      ...state.equipamentos,
      {
        uid: uid(),
        nome,
        inicio,
        tipo
      }
    ]
  });
}

function buildCanaisFromCor(e: Equipamento, cor: string) {
  if (e.tipo == "glow64") {
    const res = color2rgbw(cor);
    const r = res[0],
      g = res[1],
      b = res[2],
      w = res[3];
    return {
      [e.inicio]: r,
      [e.inicio + 1]: g,
      [e.inicio + 2]: b,
      [e.inicio + 3]: w,
      [e.inicio + 4]: r || g || b || w ? 255 : 0
    };
  } else if (e.tipo == "par16") {
    const res = color2rgb(cor),
      r = res[0],
      g = res[1],
      b = res[2];
    return {
      [e.inicio]: r || g || b ? 255 : 0,
      [e.inicio + 1]: r,
      [e.inicio + 2]: g,
      [e.inicio + 3]: b
    };
  } else {
    console.error("Tipo desconhecido. " + JSON.stringify(e));
    return {};
  }
}

function changeColor(e: { cor: string; equipamento: number }): void {
  const state = currentState(),
    { cor } = e,
    uid = e.equipamento,
    equipamento = state.equipamentos.filter(e => e.uid == uid)[0] || null,
    data = buildCanaisFromCor(equipamento, cor);
  if (state.dmx.conectado) dmx.update(data);
  setState({
    ...state,
    canais: {
      ...state.canais,
      ...data
    },
    equipamentos: state.equipamentos.map(
      e =>
        e.uid == uid
          ? {
              ...e,
              cor
            }
          : e
    )
  });
}

function dmxDesconectar(): void {
  const state = currentState();
  dmx.close();
  setState({
    ...state,
    dmx: {
      ...state.dmx,
      conectado: false
    }
  });
}

function slide(e: { index: number; value: number }): void {
  if (typeof e.index != "number") {
    console.error("index invalido " + e.index + ". typeof " + typeof e.index);
    return;
  }
  if (typeof e.value != "number") {
    console.error("value invalido " + e.value + ". typeof " + typeof e.value);
    return;
  }
  if (e.index < 0 || e.index > 255) {
    console.error("index fora da faixa. " + e.index);
    return;
  }
  if (e.value < 0 || e.value > 255) {
    console.error("value fora da faixa. " + e.value);
    return;
  }
  const state = currentState();
  if (state.dmx.conectado) dmx.update({ [e.index]: e.value });
  setState({
    ...state,
    canais: {
      ...state.canais,
      [e.index]: e.value
    }
  });
}

function salvarCena({ uid }: { uid: number }): void {
  const save = {},
    state = currentState();
  for (let c = 1; c <= 255; c++) {
    save[c] = state.canais[c] || 0;
  }
  const cenaIndex = state.cenas.findIndex(cena => cena.uid == uid),
    cena = state.cenas[cenaIndex];
  setState({
    ...state,
    cenas: [
      ...state.cenas.filter((_: any, index: number) => index < cenaIndex),
      {
        ...cena,
        canais: save
      },
      ...state.cenas.filter((_: any, index: number) => index > cenaIndex)
    ]
  });
}

function salvarMesa({ nome }: { nome: string }): void {
  const state = currentState(),
    save = {};
  for (let c = 1; c <= 255; c++) {
    save[c] = state.canais[c] || 0;
  }
  setState({
    ...state,
    cenas: [
      ...state.cenas,
      {
        transicaoTempo: 0,
        nome,
        uid: uid(),
        tipo: "mesa",
        canais: save
      }
    ]
  });
}

function editarNomeDaCena({ uid, nome }: { uid: number; nome: string }): void {
  const state = currentState();
  const cenaIndex = state.cenas.findIndex(cena => cena.uid == uid);
  const cena = state.cenas[cenaIndex] as Cena;
  setState({
    ...state,
    cenas: [
      ...state.cenas.filter((_: any, index: number) => index < cenaIndex),
      {
        ...cena,
        nome
      },
      ...state.cenas.filter((_: any, index: number) => index > cenaIndex)
    ]
  });
}

function editarTempoDaCena({ uid, tempo }: { uid: number; tempo: number }) {
  const state = currentState();
  const cenaIndex = state.cenas.findIndex(cena => cena.uid == uid);
  const cena = state.cenas[cenaIndex] as Cena;
  setState({
    ...state,
    cenas: [
      ...state.cenas.filter((_: any, index: number) => index < cenaIndex),
      {
        ...cena,
        transicaoTempo: tempo
      },
      ...state.cenas.filter((_: any, index: number) => index > cenaIndex)
    ]
  });
}

// let canaisPrecisos:any = null;
function aplicarCenaAgora({ uid }: { uid: number }) {
  const state = currentState();
  // canaisPrecisos = null;
  const cena = state.cenas.find(cena => cena.uid == uid) as Cena;
  if (state.dmx.conectado) dmx.update(cena.canais);
  setState({
    ...state,
    canais: cena.canais,
    ultimaCena: cena.uid,
    animacao: false
  });
}
let animacao: {
  de: Date;
  ate: Date;
  cena: number;
  canaisIniciais: { [key: number]: number };
} | null = null;

function transicaoParaCena({ uid }: { uid: number }): void {
  const state = currentState();
  // canaisPrecisos = null;
  const cena = state.cenas.find(cena => cena.uid == uid) as Cena;
  const tempo = cena.transicaoTempo;
  if (tempo) {
    const de = new Date();
    const ate = new Date();
    ate.setTime(de.getTime() + parseInt(tempo + ""));
    animacao = {
      de,
      cena: cena.uid,
      ate,
      canaisIniciais: state.canais
    };
    setState({
      ...state,
      ultimaCena: cena.uid,
      animacao: true
    });
  } else {
    if (state.dmx.conectado) dmx.update(cena.canais);
    animacao = null;
    setState({
      ...state,
      canais: cena.canais,
      ultimaCena: cena.uid,
      animacao: false
    });
  }
}

const intervalTime = 100;
const animationInterval = setInterval(() => {
  const state = currentState();
  if (animacao) {
    // const animacao = state.animacao;
    const now = new Date();
    const cena = state.cenas.find(c => c.uid == (animacao as any).cena) as Cena;
    const passouTime = now.getTime() - animacao.de.getTime();
    const totalTime = animacao.ate.getTime() - animacao.de.getTime();
    if (passouTime > totalTime) {
      // canaisPrecisos = null;
      animacao = null;
      setState({
        ...state,
        animacao: false,
        canais: cena.canais
      });
      if (state.dmx.conectado) dmx.update(cena.canais);
      return;
    }
    const canais = { ...state.canais };
    for (const index in canais) {
      const valorInicial = animacao.canaisIniciais[index],
        valorObjetivo = cena.canais[index],
        proximoValor =
          valorInicial +
          ((valorObjetivo - valorInicial) * passouTime) / totalTime;
      canais[index] = Math.round(proximoValor);
    }
    if (state.dmx.conectado) dmx.update(canais);
    setState({
      ...state,
      canais
    });
  }
}, intervalTime);

export function close() {
  clearInterval(animationInterval);
}

function abrir() {
  const state = currentState(),
    names = dialog.showOpenDialog({
      title: "Abrir Configurações",
      filters: [
        { name: "Configurações Priori DMX", extensions: ["priori-dmx"] }
      ],
      properties: ["openFile"]
    });
  if (!names.length) return;
  let name = names[0];
  if (!name.endsWith(".priori-dmx")) name = name + ".priori-dmx";
  const json = readState(name);
  if (json) {
    if (
      json.dmx.conectado == state.dmx.conectado &&
      json.dmx.deviceId == state.dmx.deviceId &&
      json.dmx.driver == state.dmx.driver
    ) {
      setState(json);
      return;
    }
    if (state.dmx.conectado) {
      dmx.close();
    }
    setState(json);
    if (state.dmx.conectado) {
      dmx.connect(
        state.dmx.driver,
        state.dmx.deviceId
      );
      dmx.update(state.canais);
    }
  }
}

function salvar() {
  let name = dialog.showSaveDialog({
    title: "Salvar Configurações",
    filters: [{ name: "Configurações Priori DMX", extensions: ["priori-dmx"] }]
  });
  if (!name.endsWith(".priori-dmx")) name = name + ".priori-dmx";
  saveState(name);
}

function novo() {
  if (currentState().dmx.conectado) {
    dmx.close();
  }
  setState(emptyState);
}

function removeEquipamento({uid}: { uid: number}) {
  const state = currentState();
  setState({
      ...state,
      equipamentos: state.equipamentos.filter(e=>e.uid!= uid)
  });
}

function editarEquipamentoNome({uid,nome}: { uid: number; nome: string }) {
    const state = currentState();
    setState({
        ...state,
        equipamentos: state.equipamentos.map(e=>e.uid== uid? {...e,nome}: e)
    });
}

function removeCena({uid}: { uid: number}) {
    const state = currentState();
    setState({
        ...state,
        cenas: state.cenas.filter(e=>e.uid!= uid)
    });
}

function equipamentoEditarInicio({uid,inicio}: {uid: number; inicio: number}) {
    const state = currentState();
    setState({
        ...state,
        equipamentos: state.equipamentos.map(e=>e.uid== uid? {...e,inicio}: e)
    });
}

on(action => {
  if (action.type == "abrir") abrir();
  else if (action.type == "aplicar-cena-agora") aplicarCenaAgora(action);
  else if (action.type == "change-color") changeColor(action);
  else if (action.type == "create-equipamento") createEquipamento(action);
  // else if ( action.type == "app-start")
  else if (action.type == "dmx-conectar") dmxConectar(action);
  else if (action.type == "dmx-desconectar") dmxDesconectar();
  else if (action.type == "editar-nome-da-cena") editarNomeDaCena(action);
  else if (action.type == "editar-tempo-da-cena") editarTempoDaCena(action);
  else if (action.type == "novo") novo();
  else if (action.type == "salvar") salvar();
  else if (action.type == "salvar-cena") salvarCena(action);
  else if (action.type == "salvar-mesa") salvarMesa(action);
  // else if ( action.type == "screen-started")
  // screenStarted
  else if (action.type == "slide") slide(action);
  else if (action.type == "transicao-para-cena") transicaoParaCena(action);
  else if (action.type == "remove-equipamento") removeEquipamento(action);
  else if (action.type == "editar-equipamento-nome") editarEquipamentoNome(action);
  else if (action.type == "remove-cena") removeCena(action);
  else if (action.type == "equipamento-editar-inicio") equipamentoEditarInicio(action);
});
