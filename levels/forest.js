/* ============================= LEVEL: BOSQUE ============================= */
import { pick, lerpColor, shade, blockPalette, clamp } from '../js/utils.js';
import { svgIcon } from '../js/icons.js';
import { drawCloudLayer, drawSpaceApproach, drawStars } from '../js/decor-helpers.js';

const CLOUD_LIGHT = '#fbfff4', CLOUD_DARK = '#c3d8bd';

// roca decorativa del piso -- se carga una sola vez a nivel de módulo y se
// reutiliza en cada frame de drawDecor
const ROCK_IMG = new Image();
ROCK_IMG.src = 'assets/images/decoraciones/roca.png';

/* deterministic pseudo-random 0..1 from a numeric seed, used to jitter facets
   without needing to store extra random state per mountain */
function hash(seed) { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

/* --- montañas low-poly: masa ancha con UN pico dominante (no varias puntas
   parejas) y la superficie dividida en varios triángulos/facetas irregulares,
   como una roca facetada real -- más parecido a la referencia adjunta --- */
function buildRidge(rng, n) {
  const pts = [{ t: 0, h: 0 }];
  const peakIdx = 1 + Math.floor(rng() * (n - 1));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const h = (i === peakIdx) ? 0.82 + rng() * 0.18 : 0.22 + rng() * 0.28;
    pts.push({ t, h });
  }
  pts.push({ t: 1, h: 0 });
  return pts;
}
function drawLowPolyMountain(ctx, mx, base, w, h, ridge, baseColor, seed) {
  const snowLine = 0.56;
  const snowLight = '#F8FBFF', snowMid = '#DCE7F6', snowDark = '#B3C6E2';

  for (let i = 0; i < ridge.length - 1; i++) {
    const a = ridge[i], b = ridge[i + 1];
    const ax = mx - w / 2 + a.t * w, ay = base - a.h * h;
    const bx = mx - w / 2 + b.t * w, by = base - b.h * h;
    const rising = b.h - a.h;
    const macro = rising > 0.03 ? -0.05 : rising < -0.03 ? -0.34 : -0.18;

    // el segmento se divide en 3 triángulos alrededor de un punto interior
    // "quebrado" -- siempre por debajo de ambos extremos de la cresta, para
    // que la faceta se vea como un pliegue de roca limpio y no se cruce
    // consigo misma -- en vez de rellenar un trapecio liso
    const jx = (ax + bx) / 2 + (hash(seed + i * 3.1) - 0.5) * w * 0.02;
    const jy = lerp2(Math.max(ay, by), base, 0.38 + hash(seed + i * 3.1 + 1) * 0.16);
    const p = { x: jx, y: jy };
    const a0 = { x: ax, y: base }, b0 = { x: bx, y: base };
    const tri = (p0, p1, p2, jitterSeed) => {
      const amt = clamp(macro + (hash(jitterSeed) - 0.5) * 0.16, -0.5, 0.24);
      ctx.fillStyle = shade(baseColor, amt);
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.closePath(); ctx.fill();
    };
    tri(a0, { x: ax, y: ay }, p, seed + i * 5 + 0.2);
    tri({ x: ax, y: ay }, { x: bx, y: by }, p, seed + i * 5 + 0.4);
    tri({ x: bx, y: by }, b0, p, seed + i * 5 + 0.6);
  }

  // gorro de nieve: un pequeño abanico facetado propio alrededor de cada pico
  // que supera la línea de nieve -- se dibuja en una segunda pasada, por
  // encima de toda la roca, así ningún segmento vecino lo tapa
  for (let i = 1; i < ridge.length - 1; i++) {
    if (ridge[i].h <= snowLine) continue;
    const px = mx - w / 2 + ridge[i].t * w, py = base - ridge[i].h * h;
    const prevX = mx - w / 2 + ridge[i - 1].t * w, nextX = mx - w / 2 + ridge[i + 1].t * w;
    const footY = base - snowLine * h;
    const left = { x: px - (px - prevX) * 0.4, y: footY };
    const right = { x: px + (nextX - px) * 0.4, y: footY };
    const mid = { x: px + (hash(seed + i * 7.7) - 0.5) * (right.x - left.x) * 0.3, y: lerp2(py, footY, 0.4 + hash(seed + i * 7.7 + 1) * 0.22) };
    const snowTri = (p0, p1, p2, jitterSeed) => {
      const tone = hash(jitterSeed);
      ctx.fillStyle = tone > 0.66 ? snowLight : tone > 0.33 ? snowMid : snowDark;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.closePath(); ctx.fill();
    };
    snowTri(left, { x: px, y: py }, mid, seed + i * 7.7 + 2);
    snowTri({ x: px, y: py }, right, mid, seed + i * 7.7 + 3);
    snowTri(right, left, mid, seed + i * 7.7 + 4);
  }
}
function lerp2(a, b, t) { return a + (b - a) * t; }

/* --- árboles: pino apilado en niveles con borde festoneado/quebrado (como
   la referencia), cada nivel facetado luz/sombra en vez de follaje redondo --- */
function drawPineTier(ctx, cx, topY, bottomY, halfW, gLight, gDark, bumps, seed) {
  const N = bumps * 2;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = cx - halfW + t * halfW * 2;
    const dip = (i % 2 === 1) ? -halfW * 0.16 : 0;
    pts.push({ x, y: bottomY + dip });
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const midT = clamp(((a.x + b.x) / 2 - (cx - halfW)) / (halfW * 2), 0, 1);
    const jitter = (hash(seed + i * 2.2) - 0.5) * 0.12;
    ctx.fillStyle = lerpColor(gLight, gDark, clamp(midT + jitter, 0, 1));
    ctx.beginPath(); ctx.moveTo(cx, topY); ctx.lineTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.closePath(); ctx.fill();
  }
}
function drawPolyTree(ctx, tx, base, h, w, tone, seed) {
  const trunkH = h * 0.17;
  ctx.fillStyle = '#5A3B1F';
  ctx.fillRect(tx - w * 0.075, base - trunkH, w * 0.15, trunkH);
  ctx.fillStyle = '#7C5230';
  ctx.fillRect(tx - w * 0.075, base - trunkH, w * 0.06, trunkH);

  const green = lerpColor('#2E6B3E', '#57A15A', tone);
  const gLight = shade(green, 0.30), gDark = shade(green, -0.26);
  const tiers = 4;
  const canopyH = h - trunkH;
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const tw = w * (1 - t * 0.74);
    const tierBottom = base - trunkH - t * canopyH * 0.72;
    const tierTop = tierBottom - canopyH * (0.4 - t * 0.06);
    drawPineTier(ctx, tx, tierTop, tierBottom, tw / 2, gLight, gDark, 3, seed + i * 11);
  }
}

export default {
  id: 'forest', name: 'Bosque', icon: svgIcon('tree'),
  unlock: { type: 'level', level: 4 },
  ground: '#8a9e3aff',
  skyStops: [
    { k: 0, top: '#BFE7A6', bottom: '#EFF6C8' },
    { k: 900, top: '#8FD1C8', bottom: '#D9EFC4' },
    { k: 2200, top: '#4FA8B8', bottom: '#A9DCC9' },
    { k: 4000, top: '#1E5E86', bottom: '#5C9FB0' },
    { k: 6200, top: '#0C2C52', bottom: '#2C5C7E' },
    { k: 9000, top: '#050716', bottom: '#152449' }
  ],
  blockColor: '#8B5A2B',
  blocks: [blockPalette('#8B5A2B')],
  blockStyle: 'wood',
  layout: null,

  buildLayout(rng) {
    const trees = [];
    for (let i = 0; i < 30; i++) trees.push({ x: i * 80 + (rng() * 40 - 20), h: 70 + rng() * 160, w: 34 + rng() * 20, tone: 0.7 + rng() * 0.4, seed: rng() * 1000 });
    // rocas decorativas, una en cada extremo del piso
    const rocks = [
      { side: 'left', scale: 0.8 + rng() * 0.3 },
      { side: 'right', scale: 0.8 + rng() * 0.3 }
    ];
    // montañas visibles casi desde el arranque (antes empezaban demasiado
    // arriba en el mundo y nunca llegaban a entrar en cuadro)
    // montañas ancladas justo por debajo de la línea de árboles/suelo (nunca
    // por encima), para que su base quede siempre tapada por el bosque y el
    // relleno del piso -- sin la franja de cielo visible entre ambos
    const mountainsFar = [];
    for (let i = 0; i < 5; i++) mountainsFar.push({ x: i * 300 - 300 + (rng() * 70 - 35), yOff: 24 + rng() * 26, w: 420 + rng() * 200, h: 260 + rng() * 200, tone: rng(), ridge: buildRidge(rng, 3), seed: rng() * 5000 });
    const mountains = [];
    for (let i = 0; i < 6; i++) mountains.push({ x: i * 220 - 240 + (rng() * 60 - 30), yOff: 10 + rng() * 20, w: 380 + rng() * 220, h: 220 + rng() * 260, tone: rng(), ridge: buildRidge(rng, 3), seed: rng() * 5000 });
    const clouds = [];
    for (let i = 0; i < 14; i++) clouds.push({ x: rng() * 2400 - 600, y: 250 + rng() * 2600, s: 0.55 + rng() * 1.1, drift: 7 + rng() * 13, bob: rng() * 6.28 });
    const stars = [];
    for (let i = 0; i < 80; i++) stars.push({ x: rng() * 1000, y: 2200 + rng() * 3200, r: 0.6 + rng() * 1.6, tw: rng() * 6.28 });
    const planets = [];
    for (let i = 0; i < 5; i++) planets.push({ x: rng() * 1200 - 200, y: 3400 + rng() * 3000, r: 32 + rng() * 68, c1: pick(rng, ['#E58AC9', '#7FDBDA', '#F5D76E', '#9CA8FF']), c2: pick(rng, ['#8C3A78', '#227271', '#9C7A22', '#5A66C9']) });
    const meteors = [];
    for (let i = 0; i < 5; i++) meteors.push({ seed: rng() * 1000, y: 3600 + rng() * 3200, speed: 200 + rng() * 140, len: 60 + rng() * 50, ang: 0.5 + rng() * 0.3 });
    return { trees, mountains, mountainsFar, clouds, stars, planets, meteors, rocks };
  },

  drawDecor(ctx, api) {
    const { L, gY, camH, CW, CH, time } = api;
    drawStars(ctx, L.stars, 0.35, gY, camH, CW, CH, time, 3200, 2600);
    drawSpaceApproach(ctx, L, gY, camH, CW, CH, time);
    drawCloudLayer(ctx, L.clouds, 0.34, gY, camH, CW, CH, time, CLOUD_LIGHT, CLOUD_DARK, () => 0.9 * (1 - clamp((camH - 4600) / 1800, 0, 1)));

    // cordillera lejana: más tenue y desaturada para leerse "de fondo" --
    // usa el mismo anclaje vertical que los árboles/suelo (sin factor de
    // parallax propio) para que su base nunca se despegue de la línea de
    // tierra al subir, que era justo lo que dejaba ver el hueco
    ctx.save(); ctx.globalAlpha = 0.55;
    L.mountainsFar.forEach(m => {
      const base = gY + m.yOff + camH * 0.7;
      if (base - m.h > CH + 50 || base < -50) return;
      const baseColor = lerpColor('#5C7FA0', '#8FAFC9', m.tone);
      drawLowPolyMountain(ctx, m.x, base, m.w, m.h, m.ridge, baseColor, m.seed);
    });
    ctx.restore();

    // cordillera cercana: más nítida y saturada
    L.mountains.forEach(m => {
      const base = gY + m.yOff + camH * 0.7;
      if (base - m.h > CH + 50 || base < -50) return;
      const baseColor = lerpColor('#546F8C', '#7391AE', m.tone);
      drawLowPolyMountain(ctx, m.x, base, m.w, m.h, m.ridge, baseColor, m.seed);
    });

    L.trees.forEach(t => {
      const base = gY + camH * 0.7;
      const top = base - t.h;
      if (top - 40 > CH + 50 || base < -50) return;
      const tx = ((t.x % (CW + 200)) + CW + 200) % (CW + 200) - 100;
      drawPolyTree(ctx, tx, base, t.h, t.w, t.tone, t.seed);
    });

    // relleno del piso primero para que no tape las rocas
    const gy2 = gY + camH * 1.0;
    if (gy2 > -10 && gy2 < CH + 200) { ctx.fillStyle = this.ground; ctx.fillRect(0, gy2, CW, CH - gy2 + 300); }

    // rocas decorativas, una en cada extremo -- se dibujan al final sobre el piso
    if (ROCK_IMG.complete && ROCK_IMG.naturalWidth) {
      const base = gY + camH * 0.7;
      const baseW = 60, ar = ROCK_IMG.naturalHeight / ROCK_IMG.naturalWidth;
      const margin = 25;
      L.rocks.forEach(r => {
        const rw = baseW * r.scale, rh = rw * ar;
        const yOffset = r.side === 'left' ? 50 : 15; 
        const ry = base - rh + yOffset;
        if (ry + rh < -50 || ry > CH + 50) return;
        const rx = r.side === 'left' ? margin + rw / 2 : CW - margin - rw / 2;
        if (r.side === 'right') {
          ctx.save(); ctx.translate(rx, 0); ctx.scale(-1, 1);
          ctx.drawImage(ROCK_IMG, -rw / 2, ry, rw, rh);
          ctx.restore();
        } else {
          ctx.drawImage(ROCK_IMG, rx - rw / 2, ry, rw, rh);
        }
      });
    }
  },

  drawBlockDetail(ctx, x0, x1, fY, yBottom) {
    ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 2;
    const rows = 3;
    for (let i = 1; i < rows; i++) { const yy = fY + ((yBottom - fY) / rows) * i; ctx.beginPath(); ctx.moveTo(x0 + 3, yy); ctx.lineTo(x1 - 3, yy); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(0,0,0,.10)'; ctx.lineWidth = 1;
    for (let wx = x0 + 10; wx < x1 - 6; wx += 17) { ctx.beginPath(); ctx.moveTo(wx, fY + 2); ctx.bezierCurveTo(wx + 3, fY + (yBottom - fY) * 0.3, wx - 3, fY + (yBottom - fY) * 0.7, wx + 2, yBottom - 2); ctx.stroke(); }
  }
};