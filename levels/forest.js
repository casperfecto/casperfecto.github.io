/* ============================= LEVEL: BOSQUE ============================= */
import { pick, lerpColor, shade, blockPalette, clamp } from '../js/utils.js';
import { svgIcon } from '../js/icons.js';
import { drawCloudLayer, drawSpaceApproach, drawStars } from '../js/decor-helpers.js';

const CLOUD_LIGHT = '#fbfff4', CLOUD_DARK = '#c3d8bd';

/* --- montañas low-poly: silueta de cordillera hecha de varios facetados,
   no un simple triángulo -- cada segmento de la cresta se rellena más claro
   u oscuro según hacia dónde "mira" la pendiente, como el resto del set --- */
function buildRidge(rng, n) {
  // puntos normalizados 0..1 en x, con alturas relativas 0..1 (0 = base)
  const pts = [{ t: 0, h: 0 }];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    pts.push({ t, h: 0.42 + rng() * 0.58 });
  }
  pts.push({ t: 1, h: 0 });
  // un par de picos se destacan más para romper la simetría
  const mainPeak = 1 + Math.floor(rng() * (n - 1));
  pts[mainPeak].h = 0.92 + rng() * 0.08;
  return pts;
}
function drawLowPolyMountain(ctx, mx, base, w, h, ridge, baseColor) {
  const light = shade(baseColor, 0.22), mid = baseColor, dark = shade(baseColor, -0.22);
  const snow = '#F3F8FF', snowShade = '#C7D8EE';
  for (let i = 0; i < ridge.length - 1; i++) {
    const a = ridge[i], b = ridge[i + 1];
    const ax = mx - w / 2 + a.t * w, ay = base - a.h * h;
    const bx = mx - w / 2 + b.t * w, by = base - b.h * h;
    const dy = b.h - a.h;
    ctx.fillStyle = dy > 0.03 ? light : dy < -0.03 ? dark : mid;
    ctx.beginPath();
    ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(bx, base); ctx.lineTo(ax, base);
    ctx.closePath(); ctx.fill();
    // nieve facetada en las crestas más altas
    if (Math.max(a.h, b.h) > 0.78) {
      const snowLine = 0.78;
      const capA = { x: ax, y: base - Math.max(a.h, snowLine) * h };
      const capB = { x: bx, y: base - Math.max(b.h, snowLine) * h };
      const peakA = { x: ax, y: ay }, peakB = { x: bx, y: by };
      ctx.fillStyle = dy > 0.03 ? snow : dy < -0.03 ? snowShade : snow;
      ctx.beginPath();
      ctx.moveTo(peakA.x, Math.min(peakA.y, base - snowLine * h));
      ctx.lineTo(peakB.x, Math.min(peakB.y, base - snowLine * h));
      ctx.lineTo(capB.x, capB.y); ctx.lineTo(capA.x, capA.y);
      ctx.closePath(); ctx.fill();
    }
  }
}

/* --- árboles low-poly: copa facetada (varios triángulos alrededor de un
   centro, iluminados como las nubes/planetas) en vez de dos triángulos planos --- */
function facetedBlob(ctx, cx, cy, rx, ry, colorLight, colorDark, N) {
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / N) * Math.PI * 2 - Math.PI / 2;
    const shadeAmt = 0.15 + 0.85 * Math.max(0, Math.sin((a0 + a1) / 2 + 0.8));
    ctx.fillStyle = lerpColor(colorDark, colorLight, shadeAmt);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry);
    ctx.lineTo(cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry);
    ctx.closePath(); ctx.fill();
  }
}
function drawPolyTree(ctx, tx, base, h, w, tone, lobeSeed) {
  const trunkH = h * 0.3;
  const trunkTop = base - trunkH;
  const trunkW = Math.max(9, w * 0.26);
  const tw0 = tx - trunkW / 2, tw1 = tx + trunkW / 2;

  ctx.fillStyle = '#5A3B1F';
  ctx.beginPath(); ctx.ellipse(tx, base, trunkW * 0.85, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6B4423';
  ctx.beginPath(); ctx.moveTo(tw0 + trunkW * 0.28, trunkTop); ctx.lineTo(tw1, trunkTop + 2); ctx.lineTo(tw1 - trunkW * 0.08, base); ctx.lineTo(tw0 + trunkW * 0.2, base); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8A5A34';
  ctx.beginPath(); ctx.moveTo(tw0, trunkTop + 2); ctx.lineTo(tw0 + trunkW * 0.3, trunkTop); ctx.lineTo(tw0 + trunkW * 0.24, base); ctx.lineTo(tw0 + trunkW * 0.05, base); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 1;
  for (let by = trunkTop + 5; by < base - 3; by += 6) { ctx.beginPath(); ctx.moveTo(tw0 + 1, by); ctx.lineTo(tw1 - 1, by + 1.5); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(0,0,0,.15)';
  ctx.beginPath(); ctx.moveTo(tw0 + 1, trunkTop + 3); ctx.lineTo(tw0 + 2, base - 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tw1 - 1, trunkTop + 3); ctx.lineTo(tw1 - 2, base - 2); ctx.stroke();

  // copa: 2-3 lóbulos facetados y superpuestos para un follaje volumétrico
  // e irregular, en vez de dos triángulos planos
  const green = lerpColor('#2f5e2e', '#4c8a45', tone);
  const gLight = shade(green, 0.32), gDark = shade(green, -0.22);
  const lobes = [
    { dx: 0, dy: -h * 0.34, rx: w * 0.5, ry: h * 0.34, n: 7 },
    { dx: -w * (0.16 + lobeSeed * 0.08), dy: -h * 0.1, rx: w * 0.36, ry: h * 0.24, n: 6 },
    { dx: w * (0.18 - lobeSeed * 0.06), dy: -h * 0.16, rx: w * 0.32, ry: h * 0.22, n: 6 }
  ];
  lobes.forEach(l => facetedBlob(ctx, tx + l.dx, trunkTop + l.dy, l.rx, l.ry, gLight, gDark, l.n));
}

export default {
  id: 'forest', name: 'Bosque', icon: svgIcon('tree'),
  unlock: { type: 'level', level: 4 },
  ground: '#3e5c34',
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
    for (let i = 0; i < 30; i++) trees.push({ x: i * 80 + (rng() * 40 - 20), h: 70 + rng() * 160, w: 34 + rng() * 20, tone: 0.7 + rng() * 0.4, lobeSeed: rng() });
    // dos capas de cordillera (lejana y cercana) para dar profundidad,
    // cada montaña con su propia cresta facetada e irregular
    const mountainsFar = [];
    for (let i = 0; i < 9; i++) mountainsFar.push({ x: i * 340 + (rng() * 100 - 50), y: 2200 + rng() * 2600, w: 320 + rng() * 260, h: 260 + rng() * 260, tone: rng(), ridge: buildRidge(rng, 4 + Math.floor(rng() * 2)) });
    const mountains = [];
    for (let i = 0; i < 10; i++) mountains.push({ x: i * 280 + (rng() * 90 - 40), y: 900 + rng() * 1800, w: 260 + rng() * 220, h: 220 + rng() * 300, tone: rng(), ridge: buildRidge(rng, 3 + Math.floor(rng() * 3)) });
    const clouds = [];
    for (let i = 0; i < 14; i++) clouds.push({ x: rng() * 2400 - 600, y: 250 + rng() * 2600, s: 0.55 + rng() * 1.1, drift: 7 + rng() * 13, bob: rng() * 6.28 });
    const stars = [];
    for (let i = 0; i < 80; i++) stars.push({ x: rng() * 1000, y: 4200 + rng() * 6000, r: 0.6 + rng() * 1.6, tw: rng() * 6.28 });
    const planets = [];
    for (let i = 0; i < 5; i++) planets.push({ x: rng() * 1200 - 200, y: 6000 + rng() * 4200, r: 32 + rng() * 68, c1: pick(rng, ['#E58AC9', '#7FDBDA', '#F5D76E', '#9CA8FF']), c2: pick(rng, ['#8C3A78', '#227271', '#9C7A22', '#5A66C9']) });
    const meteors = [];
    for (let i = 0; i < 5; i++) meteors.push({ seed: rng() * 1000, y: 5800 + rng() * 4600, speed: 200 + rng() * 140, len: 60 + rng() * 50, ang: 0.5 + rng() * 0.3 });
    return { trees, mountains, mountainsFar, clouds, stars, planets, meteors };
  },

  drawDecor(ctx, api) {
    const { L, gY, camH, CW, CH, time } = api;
    drawStars(ctx, L.stars, 0.1, gY, camH, CW, CH, time, 3200, 2600);
    drawSpaceApproach(ctx, L, gY, camH, CW, CH, time);
    drawCloudLayer(ctx, L.clouds, 0.34, gY, camH, CW, CH, time, CLOUD_LIGHT, CLOUD_DARK, () => 0.9 * (1 - clamp((camH - 4600) / 1800, 0, 1)));

    // cordillera lejana, más tenue y con parallax más lento (detrás de todo)
    ctx.save(); ctx.globalAlpha = 0.55;
    L.mountainsFar.forEach(m => {
      const base = gY - m.y + camH * 0.22;
      if (base - m.h > CH + 50 || base < -50) return;
      const mx = ((m.x % (CW + 500)) + CW + 500) % (CW + 500) - 250;
      const baseColor = lerpColor('#5C7FA0', '#8FAFC9', m.tone);
      drawLowPolyMountain(ctx, mx, base, m.w, m.h, m.ridge, baseColor);
    });
    ctx.restore();

    // cordillera cercana, más nítida y con más parallax
    L.mountains.forEach(m => {
      const base = gY - m.y + camH * 0.35;
      if (base - m.h > CH + 50 || base < -50) return;
      const mx = ((m.x % (CW + 400)) + CW + 400) % (CW + 400) - 200;
      const baseColor = lerpColor('#5A7FA0', '#7C9DBE', m.tone);
      drawLowPolyMountain(ctx, mx, base, m.w, m.h, m.ridge, baseColor);
    });

    L.trees.forEach(t => {
      const base = gY + camH * 0.7;
      const top = base - t.h;
      if (top - 40 > CH + 50 || base < -50) return;
      const tx = ((t.x % (CW + 200)) + CW + 200) % (CW + 200) - 100;
      drawPolyTree(ctx, tx, base, t.h, t.w, t.tone, t.lobeSeed);
    });

    const gy2 = gY + camH * 1.0;
    if (gy2 > -10 && gy2 < CH + 200) { ctx.fillStyle = this.ground; ctx.fillRect(0, gy2, CW, CH - gy2 + 300); }
  },

  drawBlockDetail(ctx, x0, x1, fY, yBottom) {
    ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 2;
    const rows = 3;
    for (let i = 1; i < rows; i++) { const yy = fY + ((yBottom - fY) / rows) * i; ctx.beginPath(); ctx.moveTo(x0 + 3, yy); ctx.lineTo(x1 - 3, yy); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(0,0,0,.10)'; ctx.lineWidth = 1;
    for (let wx = x0 + 10; wx < x1 - 6; wx += 17) { ctx.beginPath(); ctx.moveTo(wx, fY + 2); ctx.bezierCurveTo(wx + 3, fY + (yBottom - fY) * 0.3, wx - 3, fY + (yBottom - fY) * 0.7, wx + 2, yBottom - 2); ctx.stroke(); }
  }
};