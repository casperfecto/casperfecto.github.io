/* ============================= LEVEL: JAPÓN ============================= */
/* Torre = pisos de pagoda (madera lacada roja con vigas negras y filete
   dorado). Escenario = atardecer con el Monte Fuji, una pagoda de fondo,
   sakuras y pétalos cayendo todo el tiempo -- excepto al llegar al espacio,
   donde también hay estrellas/planetas como en el resto de mapas. */
import { pick, lerpColor, shade, blockPalette, clamp } from '../js/utils.js';
import { svgIcon } from '../js/icons.js';
import { drawCloudLayer, drawStars, drawSpaceApproach } from '../js/decor-helpers.js';

const CLOUD_LIGHT = '#fff5f8', CLOUD_DARK = '#e3b9cf';

function poly(ctx, pts, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath(); ctx.fill();
}
function facetedBlob(ctx, cx, cy, rx, ry, cLight, cDark, N) {
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / N) * Math.PI * 2 - Math.PI / 2;
    const shadeAmt = 0.15 + 0.85 * Math.max(0, Math.sin((a0 + a1) / 2 + 0.8));
    ctx.fillStyle = lerpColor(cDark, cLight, shadeAmt);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry);
    ctx.lineTo(cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry);
    ctx.closePath(); ctx.fill();
  }
}

/* --- Monte Fuji: un solo pico simétrico y facetado, con gorro de nieve de
   borde quebrado -- distinto del cordón montañoso de Bosque a propósito --- */
function drawFuji(ctx, cx, base, w, h) {
  const peakX = cx + w * 0.03, peakY = base - h;
  const rockL = '#8478A6', rockR = '#9B8FC0';
  const snowY = base - h * 0.58;
  poly(ctx, [{ x: cx - w / 2, y: base }, { x: peakX, y: peakY }, { x: cx + w * 0.02, y: base }], shade(rockL, -0.06));
  poly(ctx, [{ x: cx + w / 2, y: base }, { x: peakX, y: peakY }, { x: cx + w * 0.02, y: base }], shade(rockR, 0.08));
  const jL = { x: cx - w * 0.22, y: base - h * 0.34 };
  poly(ctx, [{ x: cx - w / 2, y: base }, { x: peakX, y: peakY }, { x: jL.x, y: jL.y }], shade(rockL, -0.2));
  const jR = { x: cx + w * 0.27, y: base - h * 0.28 };
  poly(ctx, [{ x: cx + w / 2, y: base }, { x: peakX, y: peakY }, { x: jR.x, y: jR.y }], shade(rockR, -0.08));
  const s1 = { x: cx - w * 0.15, y: snowY + 10 }, s2 = { x: cx - w * 0.04, y: snowY - 8 };
  const s3 = { x: cx + w * 0.03, y: snowY + 6 }, s4 = { x: cx + w * 0.17, y: snowY - 5 };
  poly(ctx, [s1, { x: peakX, y: peakY }, s2], '#F6F2FF');
  poly(ctx, [s2, { x: peakX, y: peakY }, s3], '#FFFFFF');
  poly(ctx, [s3, { x: peakX, y: peakY }, s4], '#DDD4F0');
}

/* --- pagoda de fondo: tres pisos decrecientes con techos facetados y
   remate dorado (sorin) --- */
function drawPagodaBg(ctx, cx, base, scale) {
  const wall = '#7A2020', wallDark = shade(wall, -0.26), wallLight = shade(wall, 0.12);
  const roofD = '#1E2430', roofDDark = shade(roofD, -0.2), roofDLight = shade(roofD, 0.2);
  const trim = '#D8B45A';
  let y = base, w = 96 * scale;
  for (let i = 0; i < 3; i++) {
    const wallH = 24 * scale;
    const x0 = cx - w / 2, x1 = cx + w / 2;
    ctx.fillStyle = wall; ctx.fillRect(x0, y - wallH, w, wallH);
    ctx.fillStyle = wallDark; ctx.fillRect(x0, y - wallH, w * 0.16, wallH);
    ctx.fillStyle = wallLight; ctx.fillRect(x1 - w * 0.1, y - wallH, w * 0.1, wallH);
    ctx.fillStyle = trim; ctx.fillRect(x0, y - wallH - 2 * scale, w, 3 * scale);
    const overhang = 18 * scale, roofH = 16 * scale;
    const rx0 = x0 - overhang, rx1 = x1 + overhang, ry = y - wallH - 2 * scale;
    poly(ctx, [{ x: rx0, y: ry }, { x: cx, y: ry - roofH }, { x: cx, y: ry }], roofDDark);
    poly(ctx, [{ x: rx1, y: ry }, { x: cx, y: ry - roofH }, { x: cx, y: ry }], roofDLight);
    poly(ctx, [{ x: rx0, y: ry }, { x: rx0 + overhang * 0.5, y: ry - 3 * scale }, { x: rx0 + overhang, y: ry + 1 * scale }], roofDDark);
    poly(ctx, [{ x: rx1, y: ry }, { x: rx1 - overhang * 0.5, y: ry - 3 * scale }, { x: rx1 - overhang, y: ry + 1 * scale }], roofDLight);
    y = ry - roofH * 0.68;
    w *= 0.7;
  }
  ctx.strokeStyle = trim; ctx.lineWidth = Math.max(1.3, 2 * scale);
  ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx, y - 30 * scale); ctx.stroke();
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = trim;
    ctx.beginPath(); ctx.ellipse(cx, y - 8 * scale - i * 7 * scale, 5 * scale - i * 1.1 * scale, 1.8 * scale, 0, 0, 7); ctx.fill();
  }
}

/* --- sakura: tronco + 3 lóbulos facetados en rosa, mismo lenguaje que las
   copas de Bosque pero con follaje redondeado y color de cerezo --- */
function drawSakura(ctx, x, base, h, w, tone, seed) {
  const trunkH = h * 0.32, trunkW = Math.max(8, w * 0.22);
  ctx.fillStyle = '#5A4033'; ctx.fillRect(x - trunkW / 2, base - trunkH, trunkW, trunkH);
  ctx.fillStyle = '#402C22'; ctx.fillRect(x - trunkW / 2, base - trunkH, trunkW * 0.4, trunkH);
  const pink = lerpColor('#FFC2DC', '#FF9EC4', tone), pinkLight = shade(pink, 0.22), pinkDark = shade(pink, -0.18);
  const lobes = [
    { dx: 0, dy: -h * 0.36, rx: w * 0.5, ry: h * 0.34, n: 7 },
    { dx: -w * (0.14 + (seed % 1) * 0.08), dy: -h * 0.12, rx: w * 0.34, ry: h * 0.22, n: 6 },
    { dx: w * (0.16 - (seed % 1) * 0.06), dy: -h * 0.18, rx: w * 0.3, ry: h * 0.2, n: 6 }
  ];
  lobes.forEach(l => facetedBlob(ctx, x + l.dx, base - trunkH + l.dy, l.rx, l.ry, pinkLight, pinkDark, l.n));
}

export default {
  id: 'japan', name: 'Japón', icon: svgIcon('pagoda'),
  unlock: { type: 'coins', cost: 2000 },
  ground: '#4a3f52',
  skyStops: [
    { k: 0, top: '#FFD9B8', bottom: '#FFB0C6' },
    { k: 900, top: '#F1A6CB', bottom: '#F7CADC' },
    { k: 2200, top: '#B98CDE', bottom: '#E3A8CE' },
    { k: 4000, top: '#5A5AA8', bottom: '#9878B8' },
    { k: 6200, top: '#1C1C4A', bottom: '#3A3070' },
    { k: 9000, top: '#050716', bottom: '#141B3A' }
  ],
  blockColor: '#9C2B2B',
  blocks: [blockPalette('#9C2B2B')],
  blockStyle: 'japan',
  layout: null,

  buildLayout(rng) {
    const fuji = { x: -30 + rng() * 60, w: 620 + rng() * 120, h: 420 + rng() * 80 };
    const pagodas = [
      { x: -250 + rng() * 40, scale: 1.1 + rng() * 0.15 },
      { x: 260 + rng() * 50, scale: 0.6 + rng() * 0.12 }
    ];
    const hills = [];
    for (let i = 0; i < 6; i++) hills.push({ x: i * 300 - 320 + (rng() * 60 - 30), w: 340 + rng() * 160, h: 40 + rng() * 60, tone: rng() });
    const sakuras = [];
    for (let i = 0; i < 22; i++) sakuras.push({ x: i * 96 + (rng() * 46 - 23), h: 66 + rng() * 130, w: 40 + rng() * 26, tone: rng(), seed: rng() * 4 });
    // pétalos cayendo: efecto de "clima" en espacio de pantalla, independiente
    // del scroll del mundo, para que siempre estén cayendo mientras se juega
    const petals = [];
    for (let i = 0; i < 26; i++) petals.push({
      xFrac: rng(), seedY: rng() * 3000, speed: 34 + rng() * 34,
      swayFreq: 0.5 + rng() * 0.7, swayPhase: rng() * 6.28, swayAmp: 9 + rng() * 14,
      spin: (rng() - 0.5) * 2.2, size: 4.5 + rng() * 4.5,
      color: pick(rng, ['#FFD9E8', '#FFC2DC', '#FFFFFF', '#F7A8CB'])
    });
    const clouds = [];
    for (let i = 0; i < 12; i++) clouds.push({ x: rng() * 2400 - 600, y: 240 + rng() * 2300, s: 0.6 + rng() * 1, drift: 6 + rng() * 10, bob: rng() * 6.28 });
    const stars = [];
    for (let i = 0; i < 90; i++) stars.push({ x: rng() * 1000, y: 2200 + rng() * 3200, r: 0.6 + rng() * 1.6, tw: rng() * 6.28 });
    const planets = [];
    for (let i = 0; i < 5; i++) planets.push({ x: rng() * 1200 - 200, y: 3400 + rng() * 3000, r: 32 + rng() * 68, c1: pick(rng, ['#E58AC9', '#7FDBDA', '#F5D76E', '#9CA8FF']), c2: pick(rng, ['#8C3A78', '#227271', '#9C7A22', '#5A66C9']) });
    const meteors = [];
    for (let i = 0; i < 5; i++) meteors.push({ seed: rng() * 1000, y: 3600 + rng() * 3200, speed: 200 + rng() * 140, len: 60 + rng() * 50, ang: 0.5 + rng() * 0.3 });
    return { fuji, pagodas, hills, sakuras, petals, clouds, stars, planets, meteors };
  },

  drawDecor(ctx, api) {
    const { L, gY, camH, CW, CH, time } = api;
    const spaceOp = clamp((camH - 4600) / 1800, 0, 1);

    drawStars(ctx, L.stars, 0.35, gY, camH, CW, CH, time, 3200, 2600);
    drawSpaceApproach(ctx, L, gY, camH, CW, CH, time);
    drawCloudLayer(ctx, L.clouds, 0.3, gY, camH, CW, CH, time, CLOUD_LIGHT, CLOUD_DARK, () => 0.85 * (1 - spaceOp));

    const groundFactor = 0.7;

    const fujiBase = gY + 60 + camH * groundFactor;
    const fujiX = CW * 0.4 + L.fuji.x;
    if (fujiBase < CH + 500) drawFuji(ctx, fujiX, fujiBase, L.fuji.w, L.fuji.h);

    L.hills.forEach(h => {
      const base = gY + 34 + camH * groundFactor;
      if (base > CH + 200) return;
      const hx = ((h.x % (CW + 380)) + CW + 380) % (CW + 380) - 190;
      const domeTop = base - h.h;
      const col = lerpColor('#4A3F6E', '#6B5A94', h.tone);
      poly(ctx, [{ x: hx - h.w / 2, y: base }, { x: hx - h.w * 0.06, y: domeTop }, { x: hx, y: base - h.h * 0.86 }, { x: hx, y: base }], shade(col, -0.1));
      poly(ctx, [{ x: hx, y: base }, { x: hx, y: base - h.h * 0.86 }, { x: hx + h.w * 0.08, y: domeTop }, { x: hx + h.w / 2, y: base }], shade(col, 0.1));
    });

    L.pagodas.forEach(p => {
      const base = gY + 20 + camH * groundFactor;
      if (base > CH + 260) return;
      drawPagodaBg(ctx, p.x, base, p.scale);
    });

    L.sakuras.forEach(t => {
      const base = gY + camH * groundFactor;
      const top = base - t.h;
      if (top - 40 > CH + 50 || base < -50) return;
      const tx = ((t.x % (CW + 200)) + CW + 200) % (CW + 200) - 100;
      drawSakura(ctx, tx, base, t.h, t.w, t.tone, t.seed);
    });

    const gy2 = gY + camH * 1.0;
    if (gy2 > -10 && gy2 < CH + 200) { ctx.fillStyle = this.ground; ctx.fillRect(0, gy2, CW, CH - gy2 + 300); }

    // pétalos cayendo todo el tiempo -- se apagan al llegar al espacio
    const petalAlpha = 0.9 * (1 - spaceOp);
    if (petalAlpha > 0) {
      ctx.save(); ctx.globalAlpha = petalAlpha;
      const cyclePeriod = CH + 120;
      L.petals.forEach(p => {
        const y = (((p.seedY + time * p.speed) % cyclePeriod) + cyclePeriod) % cyclePeriod - 60;
        const sway = Math.sin(time * p.swayFreq + p.swayPhase) * p.swayAmp;
        const x = (((p.xFrac * CW + sway) % CW) + CW) % CW;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(time * p.spin + p.swayPhase);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size); ctx.lineTo(p.size * 0.6, 0); ctx.lineTo(0, p.size * 1.3); ctx.lineTo(-p.size * 0.6, 0);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      });
      ctx.restore();
    }
  },

  drawBlockDetail(ctx, x0, x1, fY, yBottom, w) {
    ctx.strokeStyle = 'rgba(15,5,5,.4)'; ctx.lineWidth = 2;
    const midY = (fY + yBottom) / 2;
    ctx.beginPath(); ctx.moveTo(x0 + 2, midY); ctx.lineTo(x1 - 2, midY); ctx.stroke();
    ctx.lineWidth = 1;
    for (let wx = x0 + 10; wx < x1 - 6; wx += 16) { ctx.beginPath(); ctx.moveTo(wx, fY + 2); ctx.lineTo(wx, yBottom - 2); ctx.stroke(); }
    ctx.fillStyle = 'rgba(216,180,90,.85)';
    ctx.fillRect(x0, fY, w, 3);
  }
};
