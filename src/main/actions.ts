import { dialog } from "electron";
import {
    Animacao,
    AppState,
    Cena,
    Equipamento,
    EquipamentosCena,
    EquipamentoTipo, MesaCena
} from "../types";
import { color2rgb, color2rgbw, extractColorInfo } from "../util/cores";
import * as dmx from "./dmx";
import {
  currentState,
  emptyState,
  on,
  readState,
  saveState,
  setState,
  uid
} from "./state";

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
  tipoUid: number;
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
        tipoUid,
        configuracoes: []
      }
    ]
  });
}

function buildCanaisFromCor(
  e: Equipamento,
  tipo: EquipamentoTipo,
  cor: string
) {
  const info = extractColorInfo(tipo);
  if (!info) {
    console.error("Tipo desconhecido. " + JSON.stringify(e));
    return {};
  }
  if (typeof info.w != "undefined") {
    const res = color2rgbw(cor);
    const r = res[0],
      g = res[1],
      b = res[2],
      w = res[3];
    const data = {
      [e.inicio + info.r]: r,
      [e.inicio + info.g]: g,
      [e.inicio + info.b]: b,
      [e.inicio + info.w]: w
    };
    if (typeof info.m != "undefined")
      data[e.inicio + info.m] = r || g || b || w ? 255 : 0;
    return data;
  } else {
    const res = color2rgb(cor),
      r = res[0],
      g = res[1],
      b = res[2];
    const data = {
      [e.inicio + info.r]: r,
      [e.inicio + info.g]: g,
      [e.inicio + info.b]: b
    };
    if (typeof info.m != "undefined")
      data[e.inicio + info.m] = r || g || b ? 255 : 0;
    return data;
  }
}

function changeColor(e: { cor: string; equipamento: number }): void {
  const state = currentState(),
    { cor } = e,
    uid = e.equipamento,
    equipamento = state.equipamentos.filter(e => e.uid == uid)[0] || null,
    tipo = state.equipamentoTipos.find(
      t => t.uid == equipamento.tipoUid
    ) as EquipamentoTipo,
    data = buildCanaisFromCor(equipamento, tipo, cor);
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
    ),
    slide: null
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
    },
      slide: null
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
  if (cena.tipo == "mesa") {
     cenaMesaAgora(state,cena);
  } else if ( cena.tipo == "equipamentos" ) {
     cenaEquipamentosAgora(state,cena);
  }
}
function cenaMesaAgora(state:AppState,cena:MesaCena){
  if (state.dmx.conectado) dmx.update(cena.canais);
  setState({
      ...state,
      canais: cena.canais,
      ultimaCena: cena.uid,
      animacao: false
  });
}
let animacao: Animacao | null = null;

function cenaEquipamentosAgora(state: AppState, cena: EquipamentosCena) {
  const novo = {};
  for ( const ce of cena.equipamentos ){
      const e = state.equipamentos.find(eq=>eq.uid == ce.uid );
      if ( !e ) {
          console.error("Equipamento não encontrado.");
          return;
      }
      const tipo = state.equipamentoTipos.find(t=>t.uid == e.tipoUid );
      if ( !tipo ) {
          console.error("Equipamento não encontrado.");
          return;
      }
      for ( let count=0; count < tipo.canais.length; count++ ){
          const canalIndex = count+e.inicio;
          const valor = ce.canais[count];
          if ( typeof novo[canalIndex] != 'undefined' && novo[canalIndex] != valor ) {
              console.error('Inconsistencia nas faixas dos equipamentos.');
              return;
          }
          novo[canalIndex] = valor;
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
      animacao: false
  });
}

function transicaoParaCena({ uid }: { uid: number }): void {
  const state = currentState();
  // canaisPrecisos = null;
  const cena = state.cenas.find(cena => cena.uid == uid) as Cena;
  if (cena.tipo == "mesa") {
    const tempo = cena.transicaoTempo;
    if (tempo) {
      const de = new Date();
      const ate = new Date();
      ate.setTime(de.getTime() + parseInt(tempo + ""));
      animacao = {
        type: "transicao",
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
      cenaMesaAgora(state,cena);
    }
  } else {
      cenaEquipamentosAgora(state,cena);
  }
}

function smoth(val: number) {
  return (Math.sin(val * Math.PI - Math.PI / 2) + 1) / 2;
}
const intervalTime = 100;
const animationInterval = setInterval(() => {
  const state = currentState();
  if (animacao) {
    if (animacao.type == "transicao") {
      const now = new Date();
      const cena = state.cenas.find(
        c => c.uid == (animacao as any).cena
      ) as Cena;
      if (cena.tipo == "mesa") {
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
    } else if (animacao.type == "pulsar") {
      const inicial = animacao.valorInicial;
      const tempoQuePassou = new Date().getTime() - animacao.inicio.getTime();
      // const de = inicial;
      // const ate = inicial - 40;
      const info = extractColorInfo(animacao.tipo);
      if (!info || typeof info.m == "undefined") {
        console.error("Equipamento sem master não pode pulsar.");
        return;
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
        console.error("Equipamento sem master não pode pulsar.");
        return;
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

function removeEquipamento({ uid }: { uid: number }) {
  const state = currentState();
  setState({
    ...state,
    equipamentos: state.equipamentos.filter(e => e.uid != uid)
  });
}

function editarEquipamentoNome({ uid, nome }: { uid: number; nome: string }) {
  const state = currentState();
  setState({
    ...state,
    equipamentos: state.equipamentos.map(
      e => (e.uid == uid ? { ...e, nome } : e)
    )
  });
}

function removeCena({ uid }: { uid: number }) {
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
  uid: number;
  inicio: number;
}) {
  const state = currentState();
  setState({
    ...state,
    equipamentos: state.equipamentos.map(
      e => (e.uid == uid ? { ...e, inicio } : e)
    )
  });
}

function pulsarEquipamento({ uid }: { uid: number }) {
  const state = currentState();
  const equipamento = state.equipamentos.find(e => e.uid == uid) as Equipamento;
  const tipo = state.equipamentoTipos.find(
    t => t.uid == equipamento.tipoUid
  ) as EquipamentoTipo;
  const info = extractColorInfo(tipo);
  if (!info || typeof info.m == "undefined") {
    console.error(
      "Equipamento sem master nao pode pulsar",
      equipamento,
      tipo,
      info
    );
    return;
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

function piscarEquipamento({ uid }: { uid: number }) {
  const state = currentState();
  const equipamento = state.equipamentos.find(e => e.uid == uid) as Equipamento;
  const tipo = state.equipamentoTipos.find(
    t => t.uid == equipamento.tipoUid
  ) as EquipamentoTipo;
  const info = extractColorInfo(tipo);
  if (!info || typeof info.m == "undefined") {
    console.error(
      "Equipamento sem master nao pode pulsar",
      equipamento,
      tipo,
      info
    );
    return;
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

function equipamentosSort({ sort }: { sort: number[] }) {
  const state = currentState();
  const equipamentos = [...state.equipamentos];
  equipamentos.sort((a, b) => sort.indexOf(a.uid) - sort.indexOf(b.uid));
  setState({
    ...state,
    equipamentos
  });
}

function cenasSort({ sort }: { sort: number[] }) {
  const state = currentState(),
    cenas = [...state.cenas];
  cenas.sort((a, b) => sort.indexOf(a.uid) - sort.indexOf(b.uid));
  setState({
    ...state,
    cenas
  });
}

function extractCanais(state: AppState, e: Equipamento, tipo: EquipamentoTipo) {
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
  uid: number;
  nome: string;
}) {
  const state = currentState();
  const equipamento = state.equipamentos.find(e => e.uid == uid) as Equipamento;
  const tipo = state.equipamentoTipos.find(
    t => t.uid == equipamento.tipoUid
  ) as EquipamentoTipo;
  const canais = extractCanais(state, equipamento, tipo);
  const novaConfiguracao = {
    nome,
    canais
  };
  setState({
    ...state,
    equipamentos: state.equipamentos.map(
      e =>
        e.uid == uid
          ? {
              ...e,
              configuracoes: [...e.configuracoes, novaConfiguracao]
            }
          : e
    )
  });
}

function salvarEquipamentoTipoConfiguracao({
  uid,
  nome
}: {
  uid: number;
  nome: string;
}) {
  const state = currentState();
  const equipamento = state.equipamentos.find(e => e.uid == uid) as Equipamento;
  const tipo = state.equipamentoTipos.find(
    t => t.uid == equipamento.tipoUid
  ) as EquipamentoTipo;
  const novaConfiguracao = {
    nome,
    canais: extractCanais(state, equipamento, tipo)
  };
  setState({
    ...state,
    equipamentoTipos: state.equipamentoTipos.map(
      t =>
        t.uid != equipamento.tipoUid
          ? t
          : {
              ...t,
              configuracoes: [...t.configuracoes, novaConfiguracao]
            }
    )
  });
}

const uniqueId = uid;
function criarCenaEquipamento({ uid, nome }: { uid: number; nome: string }) {
  const state = currentState();
  const equipamento = state.equipamentos.find(e => e.uid == uid) as Equipamento;
  const tipo = state.equipamentoTipos.find(
    t => t.uid == equipamento.tipoUid
  ) as EquipamentoTipo;
  const canais = extractCanais(state, equipamento, tipo);
  const cenaEquipamento: EquipamentosCena = {
    tipo: "equipamentos",
    uid: uniqueId(),
    nome,
    equipamentos: [
      {
        canais,
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
  uid: number;
  cenaUid: number;
}) {
  const state = currentState();
  const equipamento = state.equipamentos.find(e => e.uid == uid) as Equipamento;
  const tipo = state.equipamentoTipos.find(
    t => t.uid == equipamento.tipoUid
  ) as EquipamentoTipo;
  const canais = extractCanais(state, equipamento, tipo);
  setState({
    ...state,
    cenas: state.cenas.map(
      c =>
        c.uid != cenaUid || c.tipo != "equipamentos"
          ? c
          : {
              ...c,
              equipamentos: [
                ...c.equipamentos,
                {
                  canais,
                  uid
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
  cenaUid: number;
  equipamentoUid: number;
}) {
  const state = currentState();
  setState({
    ...state,
    cenas: state.cenas.map(
      c =>
        c.uid == cenaUid
          ? {
              ...(c as EquipamentosCena),
              equipamentos: (c as EquipamentosCena).equipamentos.filter(
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
  equipamentoUid: number;
}) {
  const state = currentState();
  setState({
    ...state,
    equipamentos: state.equipamentos.map(
      e =>
        e.uid == equipamentoUid
          ? {
              ...e,
              configuracoes: e.configuracoes.filter((_, i) => i != index)
            }
          : e
    )
  });
}

function removeEquipamentoTipoConfiguracao({
  equipamentoTipoUid,
  index
}: {
  equipamentoTipoUid: number;
  index: number;
}) {
  const state = currentState();
  setState({
    ...state,
    equipamentoTipos: state.equipamentoTipos.map(
      e =>
        e.uid == equipamentoTipoUid
          ? {
              ...e,
              configuracoes: e.configuracoes.filter((_, i) => i != index)
            }
          : e
    )
  });
}

function aplicarEquipamentoConfiguracao({equipamentoUid,index}: { equipamentoUid: number; index: number}) {

    const state = currentState();
    const equipamento = state.equipamentos.find(e=>e.uid == equipamentoUid);
    if ( !equipamento ){
      console.error('Equipamento não encontrado');
      return;
    }
    const conf = equipamento.configuracoes[index];
    const canais = {};
    for ( const index in conf.canais ) {
      canais[parseInt(index) + equipamento.inicio] = conf.canais[index];
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

function aplicarEquipamentoTipoConfiguracao({equipamentoUid,index}: { equipamentoUid: number; equipamentoTipoUid: number; index: number }) {

    const state = currentState();
    const equipamento = state.equipamentos.find(e=>e.uid == equipamentoUid);
    if ( !equipamento ){
        console.error('Equipamento não encontrado');
        return;
    }
    const tipo = state.equipamentoTipos.find(e=>e.uid == equipamento.tipoUid);
    if ( !tipo ){
      console.error('Tipo não encontrado');
      return;
    }
    const conf = tipo.configuracoes[index];
    const canais = {};
    for ( const c in conf.canais ) {
        canais[parseInt(c) + equipamento.inicio] = conf.canais[c];
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

function slideCena({uid,value}: { uid: number; value: number}) {

  const state = currentState();
  setState({
    ...state,
    slide: {
      uid,
      value
    }
  },true);
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
    salvarEquipamentoTipoConfiguracao(action);
  else if (action.type == "criar-cena-equipamento")
    criarCenaEquipamento(action);
  else if (action.type == "adicionar-equipamento-a-cena")
    adicionarEquipamentoACena(action);
  else if (action.type == "remove-equipamento-cena")
    removeEquipamentoCena(action);
  else if (action.type == "remove-equipamento-configuracao")
    removeEquipamentoConfiguracao(action);
  else if (action.type == "remove-equipamento-tipo-configuracao")
    removeEquipamentoTipoConfiguracao(action);
  else if ( action.type == "aplicar-equipamento-configuracao")
    aplicarEquipamentoConfiguracao(action);
  else if ( action.type == "aplicar-equipamento-tipo-configuracao")
    aplicarEquipamentoTipoConfiguracao(action);
  else if ( action.type == "slide-cena")
    slideCena(action);
});