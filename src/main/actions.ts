import { dialog } from "electron";
import {
    AppInternalState,
    CenaIS,
    EquipamentoSimplesIS,
    EquipamentosCenaIS,
    Tipo,
    MesaCenaIS,
    Uid,
    EquipamentoGrupoIS,
    EquipamentoIS,
    ArquivoType
} from "../types/internal-state";
import {
  canaisMesaCor,
  grupoCanaisMesaCor,
  canaisGrupoMesaCanais,
  extractColorInfo,
  grupoCanais,
  grupoCor,
  grupoCanaisMesa
} from "../util/cores";
import * as dmx from "./dmx";
import {
  currentState,
  emptyState,
  on,
  saveState,
  setState,
  generateUid,
  ativarTela
} from "./state";
import { Animacao } from "../types/types";
import { httpClose, httpOpen } from "./http-server";
import { readState } from "./state-util";
import { abrirTampa, fecharTampa } from "./tampa";

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
  tipoUid
}: {
  nome: string;
  inicio: number;
  tipoUid: Uid;
}): void {
  const state = currentState();
  setState({
    ...state,
    equipamentos: [
      ...state.equipamentos,
      {
        uid: generateUid(),
        grupo: false,
        nome,
        inicio,
        tipoUid,
        configuracoes: []
      } as EquipamentoSimplesIS
    ]
  });
}

function changeColor(e: { cor: string; equipamento: Uid }): void {
  const state = currentState(),
    { cor } = e,
    uid = e.equipamento,
    equipamento = state.equipamentos.filter(e => e.uid == uid)[0] || null;

  let canais: { [k: number]: number };
  if (equipamento.grupo) {
    canais = grupoCanaisMesaCor(equipamento, state, cor);
  } else {
    const tipo = state.equipamentoTipos.find(
      t => t.uid == equipamento.tipoUid
    ) as Tipo;
    canais = canaisMesaCor(equipamento, tipo, cor);
  }
  if (state.dmx.conectado) dmx.update(canais);
  setState({
    ...state,
    canais: {
      ...state.canais,
      ...canais
    },
    equipamentos: state.equipamentos.map(e =>
      e.uid == uid
        ? {
            ...e,
            cor
          }
        : e
    ),
    cenaSlide: null
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

function multipleSlide({
  canais
}: {
  canais: { [index: number]: number };
}): void {
  for (const i in canais) {
    const index = parseInt(i);
    const value = canais[index];
    if (typeof index != "number") {
      throw new Error("index invalido " + index + ". typeof " + typeof index);
    }
    if (typeof value != "number") {
      throw new Error("value invalido " + value + ". typeof " + typeof value);
    }
    if (index < 0 || index > 255) {
      throw new Error("index fora da faixa. " + index);
    }
    if (value < 0 || value > 255) {
      throw new Error("value fora da faixa. " + value);
    }
  }
  const state = currentState();
  if (state.dmx.conectado) dmx.update(canais);
  setState({
    ...state,
    canais: {
      ...state.canais,
      ...canais
    },
    cenaSlide: null
  });
}

function slide(e: { index: number; value: number }): void {
  if (typeof e.index != "number") {
    throw new Error("index invalido " + e.index + ". typeof " + typeof e.index);
  }
  if (typeof e.value != "number") {
    throw new Error("value invalido " + e.value + ". typeof " + typeof e.value);
  }
  if (e.index < 0 || e.index > 255) {
    throw new Error("index fora da faixa. " + e.index);
  }
  if (e.value < 0 || e.value > 255) {
    throw new Error("value fora da faixa. " + e.value);
  }
  const state = currentState();
  if (state.dmx.conectado) dmx.update({ [e.index]: e.value });
  setState({
    ...state,
    canais: {
      ...state.canais,
      [e.index]: e.value
    },
    cenaSlide: null
  });
}

function salvarCena({ uid }: { uid: Uid }): void {
  const state = currentState();
  const cenaIndex = state.cenas.findIndex(cena => cena.uid == uid),
    cena = state.cenas[cenaIndex] as MesaCenaIS;
  // TODO conferir se salvar cena equipamento não pode passar por aqui
  if (cena.tipo != "mesa") {
    throw new Error("Tipo inválido.");
  }
  setState({
    ...state,
    cenas: [
      ...state.cenas.filter((_: any, index: number) => index < cenaIndex),
      {
        ...cena,
        canais: { ...state.canais }
      },
      ...state.cenas.filter((_: any, index: number) => index > cenaIndex)
    ]
  });
}

function salvarMesa({ nome }: { nome: string }): void {
  const state = currentState();
  setState({
    ...state,
    cenas: [
      ...state.cenas,
      {
        transicaoTempo: 0,
        nome,
        uid: generateUid(),
        tipo: "mesa",
        canais: { ...state.canais }
      }
    ]
  });
}

function editarNomeDaCena({ uid, nome }: { uid: Uid; nome: string }): void {
  const state = currentState();
  const cenaIndex = state.cenas.findIndex(cena => cena.uid == uid);
  const cena = state.cenas[cenaIndex] as CenaIS;
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

function editarTempoDaCena({ uid, tempo }: { uid: Uid; tempo: number }) {
  const state = currentState();
  const cenaIndex = state.cenas.findIndex(cena => cena.uid == uid);
  const cena = state.cenas[cenaIndex] as CenaIS;
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
function aplicarCenaAgora({ uid }: { uid: Uid }) {
  const state = currentState();
  // canaisPrecisos = null;
  const cena = state.cenas.find(cena => cena.uid == uid) as CenaIS;
  if (cena.tipo == "mesa") {
    cenaMesaAgora(state, cena);
  } else if (cena.tipo == "equipamentos") {
    cenaEquipamentosAgora(state, cena);
  }
}
function cenaMesaAgora(state: AppInternalState, cena: MesaCenaIS) {
  if (state.dmx.conectado) dmx.update(cena.canais);
  setState({
    ...state,
    canais: cena.canais,
    ultimaCena: cena.uid,
    animacao: false,
    cenaSlide: null
  });
}
let animacao: Animacao | null = null;

// function grant<T>( v:T|null|undefined ) {
//   if ( typeof v == "undefined") throw new Error("undefiend!");
//   if ( v === null )throw new Error("null!");
//   return v;
// }

function getGrupoState(e: EquipamentoGrupoIS, state: AppInternalState) {
  // const canais = {} as {[k:number]:number};
  const canais = [] as (number | null)[];
  let cor: string | null = null;
  const canaisDoGrupo = grupoCanais(
    e,
    state.equipamentos.filter(e => !e.grupo) as EquipamentoSimplesIS[],
    state.equipamentoTipos,
    state.canais
  );
  for (const c of canaisDoGrupo) {
    // if ( !c.unknow ) novo[c.index+""] = c.value;
    canais.push(c.unknow ? null : parseFloat(c.value));
  }
  cor = grupoCor(e, state);
  return { canais, cor };
}

function cenaEquipamentosAgora(
  state: AppInternalState,
  cena: EquipamentosCenaIS
) {
  const novo = {};
  for (const ce of cena.equipamentos) {
    const e = state.equipamentos.find(eq => eq.uid == ce.uid);
    if (!e) {
      throw new Error("EquipamentoSimplesIS não encontrado.");
    }
    if (e.grupo) {
      const canais3 = canaisGrupoMesaCanais(e, state, ce.canais);
      for (const key in canais3) novo[key] = canais3[key];
      if (ce.cor) {
        const canais2 = grupoCanaisMesaCor(e, state, ce.cor);
        for (const key in canais2) novo[key] = canais2[key];
      }
    } else {
      const tipo = state.equipamentoTipos.find(t => t.uid == e.tipoUid);
      if (!tipo) {
        throw new Error("EquipamentoSimplesIS não encontrado.");
      }
      for (let count = 0; count < tipo.canais.length; count++) {
        const canalIndex = count + e.inicio;
        const valor = ce.canais[count];
        if (
          typeof novo[canalIndex] != "undefined" &&
          novo[canalIndex] != valor
        ) {
          throw new Error("Inconsistencia nas faixas dos equipamentos.");
        }
        novo[canalIndex] = valor;
      }
    }
  }
  if (state.dmx.conectado) dmx.update(novo);
  animacao = null;
  setState({
    ...state,
    canais: {
      ...state.canais,
      ...novo
    },
    ultimaCena: cena.uid,
    animacao: false,
    cenaSlide: null
  });
}

function transicaoParaCena({ uid }: { uid: Uid }): void {
  const state = currentState();
  // canaisPrecisos = null;
  const cena = state.cenas.find(cena => cena.uid == uid) as CenaIS,
    tempo = cena.transicaoTempo;
  if (cena.tipo == "mesa") {
    if (tempo) {
      const de = new Date();
      const ate = new Date();
      ate.setTime(de.getTime() + parseInt(tempo + ""));
      setState({
        ...state,
        ultimaCena: cena.uid,
        animacao: true,
        cenaSlide: null
      });
      animacao = {
        type: "transicao",
        de,
        cena: cena.uid,
        ate,
        canaisIniciais: state.canais
      };
    } else {
      cenaMesaAgora(state, cena);
    }
  } else {
    if (tempo) {
      const de = new Date();
      const ate = new Date();
      ate.setTime(de.getTime() + parseInt(tempo + ""));
      setState({
        ...state,
        ultimaCena: cena.uid,
        animacao: true,
        cenaSlide: null
      });
      animacao = {
        type: "slide-cena",
        de,
        cena: uid,
        ate
      };
    } else {
      cenaEquipamentosAgora(state, cena);
    }
  }
}

function smoth(val: number) {
  return (Math.sin(val * Math.PI - Math.PI / 2) + 1) / 2;
}
const intervalTime = 100;
const animationInterval = setInterval(() => {
  try {
    if (animacao) {
      if (animacao.type == "slide-cena" || animacao.type == "transicao") {
        const now = new Date();
        const passouTime = now.getTime() - animacao.de.getTime();
        const totalTime = animacao.ate.getTime() - animacao.de.getTime();
        const uid = animacao.cena;
        if (passouTime > totalTime) {
          animacao = null;
          slideCena({ uid, value: 100 });
          const state = currentState();
          setState({
            ...state,
            animacao: false
          });
          return;
        }
        const perc = passouTime / totalTime;
        const value = smoth(perc) * 100;
        slideCena({ uid, value });
      // } else if (animacao.type == "transicao") {
      //   const state = currentState();
      //   const now = new Date();
      //   const cena = state.cenas.find(
      //     c => c.uid == (animacao as any).cena
      //   ) as CenaIS;
      //   if (cena.tipo == "mesa") {
      //     const passouTime = now.getTime() - animacao.de.getTime();
      //     const totalTime = animacao.ate.getTime() - animacao.de.getTime();
      //     if (passouTime > totalTime) {
      //       // canaisPrecisos = null;
      //       animacao = null;
      //       setState({
      //         ...state,
      //         animacao: false,
      //         canais: cena.canais
      //       });
      //       if (state.dmx.conectado) dmx.update(cena.canais);
      //       return;
      //     }
      //     const canais = {} as { [k: number]: number };
      //     for (const index in cena.canais) {
      //       const valorInicial = animacao.canaisIniciais[index],
      //         valorObjetivo = cena.canais[index],
      //         proximoValor =
      //           valorInicial +
      //           ((valorObjetivo - valorInicial) * passouTime) / totalTime;
      //       canais[index] = Math.round(proximoValor);
      //     }
      //     if (state.dmx.conectado) dmx.update(canais);
      //     setState({
      //       ...state,
      //       canais: {
      //         ...state.canais,
      //         ...canais
      //       }
      //     });
      //   }
      } else if (animacao.type == "pulsar") {
        const inicial = animacao.valorInicial;
        const tempoQuePassou = new Date().getTime() - animacao.inicio.getTime();
        // const de = inicial;
        // const ate = inicial - 40;
        const info = extractColorInfo(animacao.tipo);
        if (!info || typeof info.m == "undefined") {
          throw new Error("EquipamentoSimplesIS sem master não pode pulsar.");
        }
        const index = animacao.equipamento.inicio + info.m;
        const state = currentState();

        const tamanhoDoCiclo = 2000;
        const aux = (tempoQuePassou % tamanhoDoCiclo) / (tamanhoDoCiclo / 2);
        const perc = aux > 1 ? 2 - aux : aux;
        const smothPerc = smoth(perc);

        const value = inicial - ((3 * inicial) / 4) * smothPerc;
        if (value == state[index]) return;
        const canais = {
          ...state.canais,
          [index]: Math.round(value)
        };
        if (state.dmx.conectado) dmx.update(canais);
        setState({
          ...state,
          canais
        });
      } else if (animacao.type == "piscar") {
        const inicial = animacao.valorInicial;
        const tempoQuePassou = new Date().getTime() - animacao.inicio.getTime();
        // const de = inicial;
        // const ate = inicial - 40;
        const info = extractColorInfo(animacao.tipo);
        if (!info || typeof info.m == "undefined") {
          throw new Error("EquipamentoSimplesIS sem master não pode pulsar.");
        }
        const index = animacao.equipamento.inicio + info.m;
        const state = currentState();
        const value = Math.floor(tempoQuePassou / 1000) % 2 ? inicial : 0;
        if (value == state[index]) return;
        const canais = {
          ...state.canais,
          [index]: value
        };
        if (state.dmx.conectado) dmx.update(canais);
        setState({
          ...state,
          canais
        });
      }
    }
  } catch (err) {
    if (err && err.stack) console.error(err.stack);
    else console.error(err);
    animacao = null;
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
      json.httpServer.open != state.httpServer.open ||
      state.httpServer.port != json.httpServer.port
    ) {
      if (state.httpServer.open) {
        httpClose();
      }
      if (json.httpServer.open) {
        httpOpen(json.httpServer.port);
      }
    }
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
    if (json.dmx.conectado) {
      dmx.connect(
        json.dmx.driver,
        json.dmx.deviceId
      );
      dmx.update(json.canais);
    }
  }
}

function salvar() {
  let name = dialog.showSaveDialog({
    title: "Salvar Configurações",
    filters: [{ name: "Configurações Priori DMX", extensions: ["priori-dmx"] }]
  });
  if (!name.endsWith(".priori-dmx")) name = name + ".priori-dmx";
  saveState(name, currentState());
}

function novo() {
  if (currentState().dmx.conectado) {
    dmx.close();
  }
  setState(emptyState());
}

function removeEquipamento({ uid }: { uid: Uid }) {
  const state = currentState();
  setState({
    ...state,
    equipamentos: state.equipamentos.filter(e => e.uid != uid)
  });
}

function editarEquipamentoNome({ uid, nome }: { uid: Uid; nome: string }) {
  const state = currentState();
  setState({
    ...state,
    equipamentos: state.equipamentos.map(e =>
      e.uid == uid ? { ...e, nome } : e
    )
  });
}

function removeCena({ uid }: { uid: Uid }) {
  const state = currentState();
  setState({
    ...state,
    cenas: state.cenas.filter(e => e.uid != uid)
  });
}

function equipamentoEditarInicio({
  uid,
  inicio
}: {
  uid: Uid;
  inicio: number;
}) {
  const state = currentState();
  setState({
    ...state,
    equipamentos: state.equipamentos.map(e =>
      e.uid == uid ? { ...e, inicio } : e
    )
  });
}

function pulsarEquipamento({ uid }: { uid: Uid }) {
  const state = currentState();
  const equipamento = state.equipamentos.find(
    e => e.uid == uid
  ) as EquipamentoSimplesIS;
  const tipo = state.equipamentoTipos.find(
    t => t.uid == equipamento.tipoUid
  ) as Tipo;
  const info = extractColorInfo(tipo);
  if (!info || typeof info.m == "undefined") {
    throw new Error(
      "EquipamentoSimplesIS sem master nao pode pulsar " +
        equipamento +
        tipo +
        info
    );
  }
  const valorInicial = state.canais[equipamento.inicio + info.m];
  animacao = {
    type: "pulsar",
    equipamento,
    tipo,
    inicio: new Date(),
    valorInicial
  };
}

function piscarEquipamento({ uid }: { uid: Uid }) {
  const state = currentState();
  const equipamento = state.equipamentos.find(
    e => e.uid == uid
  ) as EquipamentoSimplesIS;
  const tipo = state.equipamentoTipos.find(
    t => t.uid == equipamento.tipoUid
  ) as Tipo;
  const info = extractColorInfo(tipo);
  if (!info || typeof info.m == "undefined") {
    throw new Error(
      "EquipamentoSimplesIS sem master nao pode pulsar" +
        equipamento +
        tipo +
        info
    );
  }
  const valorInicial = state.canais[equipamento.inicio + info.m];
  animacao = {
    type: "piscar",
    tipo,
    equipamento,
    inicio: new Date(),
    valorInicial
  };
}

function equipamentosSort({ sort }: { sort: Uid[] }) {
  const state = currentState();
  const equipamentos = [...state.equipamentos];
  equipamentos.sort((a, b) => sort.indexOf(a.uid) - sort.indexOf(b.uid));
  setState({
    ...state,
    equipamentos
  });
}

function cenasSort({ sort }: { sort: Uid[] }) {
  const state = currentState(),
    cenas = [...state.cenas];
  cenas.sort((a, b) => sort.indexOf(a.uid) - sort.indexOf(b.uid));
  setState({
    ...state,
    cenas
  });
}

function extractCanais(
  state: AppInternalState,
  e: EquipamentoSimplesIS,
  tipo: Tipo
) {
  let count = e.inicio;
  const max = count + tipo.canais.length;
  const canais = [] as number[];
  while (count < max) {
    canais.push(state.canais[count]);
    count++;
  }
  return canais;
}

function salvarEquipamentoConfiguracao({
  uid,
  nome
}: {
  uid: Uid;
  nome: string;
}) {
  const state = currentState();
  const equipamento = state.equipamentos.find(
    e => e.uid == uid
  ) as EquipamentoSimplesIS;
  const tipo = state.equipamentoTipos.find(
    t => t.uid == equipamento.tipoUid
  ) as Tipo;
  if (equipamento.grupo) {
    throw new Error("Não implementado ainda.");
  } else {
    const canais = extractCanais(state, equipamento, tipo);
    const novaConfiguracao = {
      nome,
      canais
    };
    setState({
      ...state,
      equipamentos: state.equipamentos.map(e =>
        e.uid == uid
          ? ({
              ...e,
              configuracoes: [...e.configuracoes, novaConfiguracao]
            } as EquipamentoSimplesIS)
          : e
      )
    });
  }
}

function salvarTipoConfiguracao({ uid, nome }: { uid: Uid; nome: string }) {
  const state = currentState();
  const equipamento = state.equipamentos.find(
    e => e.uid == uid
  ) as EquipamentoSimplesIS;
  const tipo = state.equipamentoTipos.find(
    t => t.uid == equipamento.tipoUid
  ) as Tipo;
  const novaConfiguracao = {
    nome,
    canais: extractCanais(state, equipamento, tipo)
  };
  setState({
    ...state,
    equipamentoTipos: state.equipamentoTipos.map(t =>
      t.uid != equipamento.tipoUid
        ? t
        : {
            ...t,
            configuracoes: [...t.configuracoes, novaConfiguracao]
          }
    )
  });
}

function criarCenaEquipamento({ uid, nome }: { uid: Uid; nome: string }) {
  const state = currentState(),
    equipamento = state.equipamentos.find(e => e.uid == uid);
  if (!equipamento) throw new Error("EquipamentoIS não encontrado.");
  let canais;
  let cor = null;
  if (equipamento.grupo) {
    const gs = getGrupoState(equipamento, state);
    cor = gs.cor;
    canais = gs.canais;
  } else {
    const tipo = state.equipamentoTipos.find(
      t => t.uid == equipamento.tipoUid
    ) as Tipo;
    canais = extractCanais(state, equipamento, tipo);
  }
  const cenaEquipamento: EquipamentosCenaIS = {
    tipo: "equipamentos",
    uid: generateUid(),
    nome,
    transicaoTempo: 0,
    equipamentos: [
      {
        canais,
        cor,
        uid
      }
    ]
  };
  setState({
    ...state,
    cenas: [...state.cenas, cenaEquipamento]
  });
}

function adicionarEquipamentoACena({
  uid,
  cenaUid
}: {
  uid: Uid;
  cenaUid: Uid;
}) {
  const state = currentState();
  const equipamento = state.equipamentos.find(
    e => e.uid == uid
  ) as EquipamentoSimplesIS;
  const tipo = state.equipamentoTipos.find(
    t => t.uid == equipamento.tipoUid
  ) as Tipo;
  const canais = extractCanais(state, equipamento, tipo);
  setState({
    ...state,
    cenas: state.cenas.map(c =>
      c.uid != cenaUid || c.tipo != "equipamentos"
        ? c
        : {
            ...c,
            equipamentos: [
              ...c.equipamentos,
              {
                canais,
                uid,
                cor: null
              }
            ]
          }
    )
  });
}

function removeEquipamentoCena({
  cenaUid,
  equipamentoUid
}: {
  cenaUid: Uid;
  equipamentoUid: Uid;
}) {
  const state = currentState();
  setState({
    ...state,
    cenas: state.cenas.map(c =>
      c.uid == cenaUid
        ? {
            ...(c as EquipamentosCenaIS),
            equipamentos: (c as EquipamentosCenaIS).equipamentos.filter(
              e => e.uid != equipamentoUid
            )
          }
        : c
    )
  });
}

function removeEquipamentoConfiguracao({
  index,
  equipamentoUid
}: {
  index: number;
  equipamentoUid: Uid;
}) {
  const state = currentState();
  setState({
    ...state,
    equipamentos: state.equipamentos.map(e =>
      e.uid == equipamentoUid
        ? ({
            ...(e as EquipamentoIS),
            configuracoes: (e as any).configuracoes.filter(
              (_: any, i: number) => i != index
            )
          } as EquipamentoIS)
        : e
    )
  });
}

function removeTipoConfiguracao({
  equipamentoTipoUid,
  index
}: {
  equipamentoTipoUid: Uid;
  index: number;
}) {
  const state = currentState();
  setState({
    ...state,
    equipamentoTipos: state.equipamentoTipos.map(e =>
      e.uid == equipamentoTipoUid
        ? {
            ...e,
            configuracoes: e.configuracoes.filter((_, i) => i != index)
          }
        : e
    )
  });
}

function aplicarEquipamentoConfiguracao({
  equipamentoUid,
  index
}: {
  equipamentoUid: Uid;
  index: number;
}) {
  const state = currentState();
  const equipamento = state.equipamentos.find(e => e.uid == equipamentoUid);
  if (!equipamento) {
    throw new Error("EquipamentoSimplesIS não encontrado");
  }
  const conf = equipamento.configuracoes[index];
  const canais = {};
  if (equipamento.grupo) {
    throw new Error(
      "Não implementado ainda. aplicarEquipamentoConfiguracao grupo"
    );
  } else {
    for (const index in conf.canais) {
      canais[parseInt(index) + equipamento.inicio] = conf.canais[index];
    }
  }
  if (state.dmx.conectado) dmx.update(canais);
  setState({
    ...state,
    canais: {
      ...state.canais,
      ...canais
    }
  });
}

function aplicarTipoConfiguracao({
  equipamentoUid,
  index
}: {
  equipamentoUid: Uid;
  equipamentoTipoUid: Uid;
  index: number;
}) {
  const state = currentState();
  const equipamento = state.equipamentos.find(e => e.uid == equipamentoUid);
  if (!equipamento) {
    throw new Error("EquipamentoSimplesIS não encontrado");
  }
  const canais = {};
  if (equipamento.grupo) {
    throw new Error("Grupo de equipamentos não está vinculado a tipo.");
  } else {
    const tipo = state.equipamentoTipos.find(e => e.uid == equipamento.tipoUid);
    if (!tipo) {
      throw new Error("Tipo não encontrado");
    }
    const conf = tipo.configuracoes[index];
    for (const c in conf.canais) {
      canais[parseInt(c) + equipamento.inicio] = conf.canais[c];
    }
  }
  if (state.dmx.conectado) dmx.update(canais);
  setState({
    ...state,
    canais: {
      ...state.canais,
      ...canais
    }
  });
}

function cenaCanaisSlice(state: AppInternalState, cena: EquipamentosCenaIS) {
  const canais: { [key: number]: number } = {};
  cena.equipamentos.forEach(eConf => {
    const equipamento = state.equipamentos.find(e2 => e2.uid == eConf.uid);
    if (!equipamento) throw "EquipamentoSimplesIS nao encontrado";
    // const tipo = state.equipamentoTipos.find(t=>t.uid == equipamento.tipoUid);
    // if ( !tipo )throw 'Tipo nao encontrado';
    if (equipamento.grupo) {
      for (const index of grupoCanaisMesa(equipamento, state, eConf)) {
        canais[index] = state.canais[index];
      }
      if (eConf.cor) {
        const c3 = grupoCanaisMesaCor(equipamento, state, eConf.cor);
        if (c3) for (const k in c3) canais[k] = state.canais[k];
      }
    } else {
      eConf.canais.forEach((_, index) => {
        const key = equipamento.inicio + index;
        canais[key] = state.canais[key];
      });
    }
  });
  return canais;
}

function slideCena({ uid, value }: { uid: Uid; value: number }) {
  const state = currentState();
  const cena = state.cenas.find(c => c.uid == uid);
  if (!cena) {
    throw new Error("CenaIS não encontrada.");
  }
  const canaisAnterior: { [key: number]: number } =
    state.cenaSlide && state.cenaSlide.uid == uid
      ? state.cenaSlide.canaisAnterior
      : cena.tipo == "mesa"
      ? ({ ...state.canais } as any)
      : cenaCanaisSlice(state, cena);
  const canais: { [key: number]: number } = {};
  const perc = value / 100;
  if (cena.tipo == "mesa") {
    for (const key in canaisAnterior) {
      const prev = canaisAnterior[key];
      const next = cena.canais[key];
      canais[key] = Math.round(next * perc + prev * (1 - perc));
    }
  } else if (cena.tipo == "equipamentos") {
    cena.equipamentos.forEach(e => {
      const equipamento = state.equipamentos.find(e2 => e2.uid == e.uid);
      if (!equipamento) {
        throw new Error("EquipamentoSimplesIS não encontrado.");
      }
      if (equipamento.grupo) {
        const canais3 = canaisGrupoMesaCanais(equipamento, state, e.canais);
        for (const key in canais3) {
          const prev = canaisAnterior[key];
          const next = canais3[key];
          canais[key] = Math.round(next * perc + prev * (1 - perc));
        }
        if (e.cor) {
          const canais2 = grupoCanaisMesaCor(equipamento, state, e.cor);
          for (const key in canais2) {
            const prev = canaisAnterior[key];
            const next = canais2[key];
            canais[key] = Math.round(next * perc + prev * (1 - perc));
          }
        }
      } else {
        e.canais.forEach((next, index) => {
          if (next === null) return;
          const key = index + equipamento.inicio;
          const prev = canaisAnterior[key];
          canais[key] = Math.round(next * perc + prev * (1 - perc));
        });
      }
    });
  }
  if (state.dmx.conectado) dmx.update(canais);
  setState(
    {
      ...state,
      cenaSlide: {
        uid,
        value,
        canaisAnterior
      },
      canais: {
        ...state.canais,
        ...canais
      }
    },
    true
  );
}

function createEquipamentoGrupo({
  nome,
  equipamentos
}: {
  nome: string;
  equipamentos: Uid[];
}) {
  const state = currentState();
  setState({
    ...state,
    equipamentos: [
      ...state.equipamentos,
      {
        grupo: true,
        uid: generateUid(),
        nome,
        equipamentos,
        configuracoes: []
      }
    ]
  });
}

function httpCloseCall() {
  httpClose();
  const state = currentState();
  setState({
    ...state,
    httpServer: {
      ...state.httpServer,
      open: false
    }
  });
}

function httpOpenCall(port: number) {
  httpOpen(port);
  const state = currentState();
  setState({
    ...state,
    httpServer: {
      ...state.httpServer,
      port,
      open: true
    }
  });
}

function novosArquivos({ arquivos }: { arquivos: string[] }) {
  const state = currentState();
  setState({
    ...state,
    arquivos: [
      ...state.arquivos,
      ...arquivos.map(a => ({
        path: a,
        type: (a.match(/\.(mp4)$/i) ? "video" :
            a.match(/\.(ogg|mp3)$/i) ? "audio" :
            "img") as ArquivoType,
        nome: a.replace(/.*\/([^\\\/]+)/, "$1")
      }))
    ]
  });
}

function isAudio(state:AppInternalState,selected:string|null){
    const s = selected ? state.arquivos.filter(a=>a.path == selected)[0] : undefined;
    const audio = s && s.type == "audio";
    return !!audio;
}

function arquivoPlay({ path }: { path: string }) {
  const state = currentState();
  if (state.telas.aberta === null && !isAudio(state,path)) return;
  const func = () => {
    const state = currentState();
    setState({
      ...state,
      player: {
        ...state.player,
        arquivo: path,
        state: "play"
      }
    });
  };
  if ( (state.player.state == "stop" || state.player.arquivo && isAudio(state,state.player.arquivo) ) && !isAudio(state,path)  ) {
    abrirTampa(func);
  } else {
    if ( isAudio(state,path) && state.player.arquivo && !isAudio(state,state.player.arquivo) )
      fecharTampa();
    func();
  }
}

function arquivoStop() {
  const state = currentState();
  if (state.telas.aberta === null && !isAudio(state,state.player.arquivo)) return;
  if (state.player.state != "stop" && !isAudio(state,state.player.arquivo)) fecharTampa();
  setState({
    ...state,
    player: {
      ...state.player,
      state: "stop",
      arquivo: null
    }
  });
}

function arquivoPause() {
  const state = currentState();
  if (state.telas.aberta === null && !isAudio(state,state.player.arquivo)) return;
  setState({
    ...state,
    player: {
      ...state.player,
      state: "pause"
    }
  });
}
function removeArquivo({arquivo}:{arquivo:string}){
    const state = currentState();
    setState({
        ...state,
        arquivos: state.arquivos.filter(f=>f.path!=arquivo)
    });
}
function repeat(){
    const state = currentState();
    setState({
        ...state,
        player: {
          ...state.player,
            repeat: !state.player.repeat
        }
    });
}
function volume({volume}:{volume:number}){
    const state = currentState();
    setState({
        ...state,
        player: {
            ...state.player,
            volume
        }
    });
}

on(action => {
  if (action.type == "abrir") abrir();
  else if (action.type == "aplicar-cena-agora") aplicarCenaAgora(action);
  else if (action.type == "change-color") changeColor(action);
  else if (action.type == "create-equipamento") createEquipamento(action);
  else if (action.type == "create-equipamento-grupo")
    createEquipamentoGrupo(action);
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
  else if (action.type == "remove-arquivo") removeArquivo(action);
  else if (action.type == "multiple-slide") multipleSlide(action);
  else if (action.type == "transicao-para-cena") transicaoParaCena(action);
  else if (action.type == "remove-equipamento") removeEquipamento(action);
  else if (action.type == "editar-equipamento-nome")
    editarEquipamentoNome(action);
  else if (action.type == "remove-cena") removeCena(action);
  else if (action.type == "equipamento-editar-inicio")
    equipamentoEditarInicio(action);
  else if (action.type == "piscar-equipamento") piscarEquipamento(action);
  else if (action.type == "pulsar-equipamento") pulsarEquipamento(action);
  else if (action.type == "cenas-sort") cenasSort(action);
  else if (action.type == "equipamentos-sort") equipamentosSort(action);
  else if (action.type == "salvar-equipamento-configuracao")
    salvarEquipamentoConfiguracao(action);
  else if (action.type == "salvar-equipamento-tipo-configuracao")
    salvarTipoConfiguracao(action);
  else if (action.type == "criar-cena-equipamento")
    criarCenaEquipamento(action);
  else if (action.type == "adicionar-equipamento-a-cena")
    adicionarEquipamentoACena(action);
  else if (action.type == "remove-equipamento-cena")
    removeEquipamentoCena(action);
  else if (action.type == "remove-equipamento-configuracao")
    removeEquipamentoConfiguracao(action);
  else if (action.type == "remove-equipamento-tipo-configuracao")
    removeTipoConfiguracao(action);
  else if (action.type == "aplicar-equipamento-configuracao")
    aplicarEquipamentoConfiguracao(action);
  else if (action.type == "aplicar-equipamento-tipo-configuracao")
    aplicarTipoConfiguracao(action);
  else if (action.type == "slide-cena") slideCena(action);
  else if (action.type == "http-close") httpCloseCall();
  else if (action.type == "http-open") httpOpenCall(action.port);
  else if (action.type == "novos-arquivos") novosArquivos(action);
  else if (action.type == "ativar-tela") ativarTela(action);
  else if (action.type == "arquivo-play") arquivoPlay(action);
  else if (action.type == "arquivo-stop") arquivoStop();
  else if (action.type == "arquivo-pause") arquivoPause();
  else if (action.type == "volume") volume(action);
  else if (action.type == "repeat") repeat();
  else if (action.type != "app-start" && action.type != "screen-started")
    console.log(action);
});
