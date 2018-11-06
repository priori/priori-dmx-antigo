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
  // console.log(r,cor.substr(3,2),g,b)
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
