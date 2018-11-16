import {
  AppInternalState,
  CanaisTipo,
  EquipamentoGrupoInternalState,
  EquipamentoSimples,
  Tipo
} from "../types/types";

function corParte(s: number) {
  const str = Math.round(s).toString(16);
  return (str.length == 1 ? "0" : "") + str;
}
const pesoDoBrancoRgb = 2;
const pesoDoBrancoNaLuzBranca = 1;

export function rgbw2Color(r: number, g: number, b: number, w: number) {
  // const max:number = Math.max(r,g,b), min:number = Math.min(r,g,b);
  const brancoParaAdicionar =
      (w * pesoDoBrancoNaLuzBranca) /
      (pesoDoBrancoRgb + pesoDoBrancoNaLuzBranca),
    faixaParaORgb = 255 - brancoParaAdicionar;
  return (
    "#" +
    corParte(Math.round(brancoParaAdicionar + (r / 255) * faixaParaORgb)) +
    corParte(Math.round(brancoParaAdicionar + (g / 255) * faixaParaORgb)) +
    corParte(Math.round(brancoParaAdicionar + (b / 255) * faixaParaORgb))
  );
}
export function color2rgb(cor: string) {
  let r = parseInt(cor.substr(1, 2), 16),
    g = parseInt(cor.substr(3, 2), 16),
    b = parseInt(cor.substr(5, 2), 16);
  return [r, g, b];
}

export function color2rgbw(cor: string) {
  let r = parseInt(cor.substr(1, 2), 16),
    g = parseInt(cor.substr(3, 2), 16),
    b = parseInt(cor.substr(5, 2), 16);
  let min = Math.min(r, g, b);
  if (min == 255) return [255, 255, 255, 255];
  r = ((r - min) / (255 - min)) * 255;
  g = ((g - min) / (255 - min)) * 255;
  b = ((b - min) / (255 - min)) * 255;
  let w =
    (min * (pesoDoBrancoNaLuzBranca + pesoDoBrancoRgb)) /
    pesoDoBrancoNaLuzBranca;
  if (w > 255) {
    const inc = ((w - 255) * pesoDoBrancoNaLuzBranca) / pesoDoBrancoRgb;
    r = inc + ((255 - inc) * r) / 255;
    g = inc + ((255 - inc) * g) / 255;
    b = inc + ((255 - inc) * b) / 255;
    w = 255;
  }
  return [Math.round(r), Math.round(g), Math.round(b), Math.round(w)];
}

export function rgb2Color(r: number, g: number, b: number) {
  return "#" + corParte(r) + corParte(g) + corParte(b);
}

export interface ColorInfo {
  r: number;
  g: number;
  b: number;
  m: number | undefined;
  w: number | undefined;
}
export function master(tipo: Tipo): number | undefined {
  let m;
  for (let index = 0; index < tipo.canais.length; index++) {
    const canal = tipo.canais[index];
    if (canal.tipo == "master") {
      if (typeof m != "undefined") {
        return undefined;
      }
      m = index;
    }
  }
  return m;
}
export function extractColorInfo(tipo: Tipo): ColorInfo | null {
  let r, g, b, w, m;
  for (let index = 0; index < tipo.canais.length; index++) {
    const canal = tipo.canais[index];
    if (canal.tipo == "red") {
      if (typeof r != "undefined") return null;
      r = index;
    } else if (canal.tipo == "green") {
      if (typeof g != "undefined") return null;
      g = index;
    } else if (canal.tipo == "blue") {
      if (typeof b != "undefined") return null;
      b = index;
    } else if (canal.tipo == "white") {
      if (typeof w != "undefined") return null;
      w = index;
    } else if (canal.tipo == "master") {
      if (typeof m != "undefined") {
        return null;
      }
      m = index;
    }
  }
  if (
    typeof r != "undefined" &&
    typeof g != "undefined" &&
    typeof b != "undefined"
  )
    return {
      r,
      g,
      b,
      w,
      m
    } as ColorInfo;
  return null;
}

export function buildCor(
  e: EquipamentoSimples,
  tipo: Tipo,
  canais: { [k: number]: number }
) {
  const colorInfo = extractColorInfo(tipo);
  if (!colorInfo) return null;
  if (typeof colorInfo.w != "undefined") {
    if (canais[e.inicio + 6] || canais[e.inicio + 7]) {
      return null;
    }
    const master =
        typeof colorInfo.m == "undefined"
          ? 1
          : canais[e.inicio + colorInfo.m] / 255,
      r = canais[e.inicio + colorInfo.r] * master,
      g = canais[e.inicio + colorInfo.g] * master,
      b = canais[e.inicio + colorInfo.b] * master,
      w = canais[e.inicio + colorInfo.w] * master;
    return rgbw2Color(r, g, b, w);
  } else {
    const master =
        typeof colorInfo.m == "undefined"
          ? 1
          : canais[e.inicio + colorInfo.m] / 255,
      r = canais[e.inicio + colorInfo.r] * master,
      g = canais[e.inicio + colorInfo.g] * master,
      b = canais[e.inicio + colorInfo.b] * master;
    return rgb2Color(r, g, b);
  }
}

export function value(
  e: EquipamentoGrupoInternalState,
  equipamentos: EquipamentoSimples[],
  tipos: Tipo[],
  canais: { [key: number]: number },
  tipo: CanaisTipo
) {
  let value: string | undefined;
  for (const uid of e.equipamentos) {
    const e2 = equipamentos.find(e3 => e3.uid == uid);
    if (!e2) throw new Error("Equipamento não encontrado.");
    const t = tipos.find(t2 => t2.uid == e2.tipoUid);
    if (!t) throw new Error("Tipo não encontrado.");
    const index = t.canais.findIndex(ct => ct.tipo == tipo);
    if (index == -1)
      throw new Error(
        "Não encontrado canal " + tipo + " no tipo de equipamento."
      );
    const canalIndex = index + e2.inicio;
    const eValue = canais[canalIndex];
    if (typeof eValue == "undefined") {
      throw new Error("Canal não encontrado");
    }
    if (typeof value == "undefined") {
      value = eValue + "";
    } else if (value !== eValue + "") {
      return undefined;
    }
  }
  return value;
}

export function grupoCanais(
  e: EquipamentoGrupoInternalState,
  equipamentos: EquipamentoSimples[],
  tipos: Tipo[],
  canaisValues: { [p: number]: number }
) {
  const {
    todosTemMaster,
    todosTemWhite,
    todosTemRgb,
    algumTemWhite
  } = extractGrupoInfo(e, equipamentos, tipos);
  const canais = [] as {
    index: number;
    value: string;
    tipo: string;
    unknow: boolean;
  }[];
  if (todosTemRgb && (!algumTemWhite || todosTemWhite)) {
    const r = value(e, equipamentos, tipos, canaisValues, "red"),
      g = value(e, equipamentos, tipos, canaisValues, "green"),
      b = value(e, equipamentos, tipos, canaisValues, "blue");
    canais.push({
      index: canais.length + 1,
      value: r || "0",
      unknow: typeof r == "undefined",
      tipo: "red"
    });
    canais.push({
      index: canais.length + 1,
      value: g || "0",
      unknow: typeof g == "undefined",
      tipo: "green"
    });
    canais.push({
      index: canais.length + 1,
      value: b || "0",
      unknow: typeof b == "undefined",
      tipo: "blue"
    });
  }
  if (todosTemWhite) {
    const w = value(e, equipamentos, tipos, canaisValues, "white");
    canais.push({
      index: canais.length + 1,
      value: w || "0",
      unknow: typeof w == "undefined",
      tipo: "white"
    });
  }
  if (todosTemMaster) {
    const m = value(e, equipamentos, tipos, canaisValues, "master");
    canais.push({
      index: canais.length + 1,
      value: m || "0",
      unknow: typeof m == "undefined",
      tipo: "master"
    });
  }
  return canais;
}
export function extractGrupoInfo(
  e: EquipamentoGrupoInternalState,
  equipamentos: EquipamentoSimples[],
  tipos: Tipo[]
) {
  let todosTemWhite = true;
  let todosTemRgb = true;
  let algumTemWhite = false;
  let todosTemMaster = true;
  for (const uid of e.equipamentos) {
    const equipamento = equipamentos.find(e2 => e2.uid == uid);
    if (!equipamento) throw new Error("Equipamento não encontrado.");
    const tipo = tipos.find(t => t.uid == equipamento.tipoUid);
    if (!tipo) throw new Error("Tipo não encontrado.");
    const info = extractColorInfo(tipo);
    if (!info) {
      todosTemWhite = false;
      todosTemRgb = false;
      if (typeof master(tipo) == "undefined") {
        todosTemMaster = false;
      }
      continue;
    }
    if (
      typeof info.g == "undefined" ||
      typeof info.r == "undefined" ||
      typeof info.b == "undefined"
    ) {
      todosTemRgb = false;
    }
    if (typeof info.m == "undefined") todosTemMaster = false;
    if (typeof info.w == "undefined") todosTemWhite = false;
    else algumTemWhite = true;
  }
  return {
    todosTemWhite,
    todosTemMaster,
    todosTemRgb,
    algumTemWhite
  };
}

export function grupoCor(
  e: EquipamentoGrupoInternalState,
  state: AppInternalState
) {
  const equipamentos = state.equipamentos.filter(
      e => !e.grupo
    ) as EquipamentoSimples[],
    tipos = state.equipamentoTipos,
    canais = state.canais;
  return grupoCor2(e, equipamentos, tipos, canais);
}

export function grupoCor2(
  e: EquipamentoGrupoInternalState,
  equipamentos: EquipamentoSimples[],
  tipos: Tipo[],
  canais: { [p: number]: number }
) {
  let cor: string | null = null;
  for (const uid of e.equipamentos) {
    const e = equipamentos.find(e2 => e2.uid == uid);
    if (!e) throw new Error("Não encontrado equipamento");
    const t = tipos.find(t => t.uid == e.tipoUid);
    if (!t) throw new Error("Não encontrado tipo");
    const eCor = buildCor(e, t, canais);
    if (eCor === null) return null;
    if (cor === null) {
      cor = eCor;
    } else if (cor != eCor) {
      return null;
    }
  }
  return cor;
}

export function grupoCanaisMesaCor(
  equipamento: EquipamentoGrupoInternalState,
  state: AppInternalState,
  cor: string
) {
  let canais: { [k: number]: number } = {};
  for (const uid of equipamento.equipamentos) {
    const e2 = state.equipamentos.find(e3 => e3.uid == uid);
    if (!e2) throw "Não encontrado equipamento do grupo";
    if (e2.grupo) throw "Não encontrado equipamento do grupo";
    const tipo = state.equipamentoTipos.find(t => t.uid == e2.tipoUid) as Tipo,
      data = canaisMesaCor(e2, tipo, cor);
    for (const k in data) canais[k] = data[k];
  }
  return canais;
}

export function grupoCanaisMesa(
  e: EquipamentoGrupoInternalState,
  state: AppInternalState
) {
  const info = grupoCanais(
    e,
    state.equipamentos.filter(e => !e.grupo) as EquipamentoSimples[],
    state.equipamentoTipos,
    state.canais
  );
  let novo = {} as { [k: number]: number };
  for (const canalInfo of info) {
    const index = canalInfo.index;
    const tipoNome = canalInfo.tipo;
    const val = state.canais[index];
    if (canalInfo.value === null) continue;

    for (const uid of e.equipamentos) {
      const e = state.equipamentos.find(
        e2 => e2.uid == uid
      ) as EquipamentoSimples;
      if (!e) throw new Error("Não encontrado equipamento");
      const t = state.equipamentoTipos.find(t => t.uid == e.tipoUid);
      if (!t) throw new Error("Não encontrado tipo");
      if (tipoNome == "red") {
        const colorinfo = extractColorInfo(t);
        if (!colorinfo) throw new Error("não encontrado color info");
        novo[colorinfo.r + e.inicio] = val;
      } else if (tipoNome == "green") {
        const colorinfo = extractColorInfo(t);
        if (!colorinfo) throw new Error("não encontrado color info");
        novo[colorinfo.g + e.inicio] = val;
      } else if (tipoNome == "blue") {
        const colorinfo = extractColorInfo(t);
        if (!colorinfo) throw new Error("não encontrado color info");
        novo[colorinfo.b + e.inicio] = val;
      } else if (tipoNome == "master") {
        const mIndex = master(t);
        if (typeof mIndex == "undefined") throw new Error("Master");
        novo[mIndex + e.inicio] = val;
      } else if (tipoNome == "white") {
        const colorinfo = extractColorInfo(t);
        if (!colorinfo) throw new Error("não encontrado color info");
        if (typeof colorinfo.w == "undefined")
          throw new Error("não encontrado master no color info");
        novo[colorinfo.w + e.inicio] = val;
      }
    }
  }
  return novo;
}

export function canaisGrupoMesaCanais(
  e: EquipamentoGrupoInternalState,
  state: AppInternalState,
  canais: (number | null)[]
) {
  const info = grupoCanais(
    e,
    state.equipamentos.filter(e => !e.grupo) as EquipamentoSimples[],
    state.equipamentoTipos,
    state.canais
  );
  let novo = {} as { [k: number]: number };
  for (const key in canais) {
    const val = canais[key];
    if (val === null) continue;
    const index = parseInt(key);
    const canalInfo = info[index];
    const tipoNome = canalInfo.tipo;

    for (const uid of e.equipamentos) {
      const e = state.equipamentos.find(
        e2 => e2.uid == uid
      ) as EquipamentoSimples;
      if (!e) throw new Error("Não encontrado equipamento");
      const t = state.equipamentoTipos.find(t => t.uid == e.tipoUid);
      if (!t) throw new Error("Não encontrado tipo");
      if (tipoNome == "red") {
        const colorinfo = extractColorInfo(t);
        if (!colorinfo) throw new Error("não encontrado color info");
        novo[colorinfo.r + e.inicio] = val;
      } else if (tipoNome == "green") {
        const colorinfo = extractColorInfo(t);
        if (!colorinfo) throw new Error("não encontrado color info");
        novo[colorinfo.g + e.inicio] = val;
      } else if (tipoNome == "blue") {
        const colorinfo = extractColorInfo(t);
        if (!colorinfo) throw new Error("não encontrado color info");
        novo[colorinfo.b + e.inicio] = val;
      } else if (tipoNome == "master") {
        const mIndex = master(t);
        if (typeof mIndex == "undefined") throw new Error("Master");
        novo[mIndex + e.inicio] = val;
      } else if (tipoNome == "white") {
        const colorinfo = extractColorInfo(t);
        if (!colorinfo) throw new Error("não encontrado color info");
        if (typeof colorinfo.w == "undefined")
          throw new Error("não encontrado master no color info");
        novo[colorinfo.w + e.inicio] = val;
      }
    }
  }
  return novo;
}

export function canaisMesaCor(e: EquipamentoSimples, tipo: Tipo, cor: string) {
  const info = extractColorInfo(tipo);
  if (!info) {
    throw new Error("Tipo desconhecido. " + JSON.stringify(e));
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
