/* ============================= LEVEL: ERA MEDIEVAL ============================= */
/* Torre = castillo de piedra. Escenario = campo con árboles low-poly poligonales.
   Se compra únicamente con monedas (1000). */
import { pick, lerpColor, shade, blockPalette } from '../js/utils.js';
import { svgIcon } from '../js/icons.js';
import { drawCloudLayer, drawStars } from '../js/decor-helpers.js';

const CLOUD_LIGHT = '#ffffff', CLOUD_DARK = '#c9d6c2';

/* low-poly faceted pine: a stack of triangular facets, lit from the upper-left,
   same "polygonal 3D" language as the clouds/planets */
function drawPolyPine(ctx, x, base, h, w, toneT) {
  const tiers = 3;
  const trunkH = h * 0.16;
  ctx.fillStyle = '#6B4A2E';
  ctx.fillRect(x - w * 0.06, base - trunkH, w * 0.12, trunkH);
  const green = lerpColor('#2E6B3E', '#5AA85C', toneT);
  const greenDark = shade(green, -0.28);
  const greenLight = shade(green, 0.18);
  let tierBase = base - trunkH;
  const tierH = (h - trunkH) / tiers;
  for (let i = 0; i < tiers; i++) {
    const tw = w * (1 - i * 0.24);
    const top = tierBase - tierH * 1.15;
    ctx.fillStyle = greenDark;
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + tw / 2, tierBase); ctx.lineTo(x, tierBase); ctx.closePath(); ctx.fill();
    ctx.fillStyle = greenLight;
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, tierBase); ctx.lineTo(x - tw / 2, tierBase); ctx.closePath(); ctx.fill();
    tierBase -= tierH * 0.68;
  }
}

export default {
  id: 'medieval', name: 'Era medieval', icon: svgIcon('castle'),
  unlock: { type: 'coins', cost: 1000 },
  ground: '#4a6b3a',
  skyStops: [
    { k: 0, top: '#BFE0F5', bottom: '#F7E9C6' },
    { k: 900, top: '#8FC2E8', bottom: '#DCEEDD' },
    { k: 2200, top: '#5C9BD6', bottom: '#A9CBE0' },
    { k: 4000, top: '#2C5A9E', bottom: '#6E96C4' },
    { k: 6200, top: '#101E42', bottom: '#33507E' },
    { k: 9000, top: '#050716', bottom: '#141B3A' }
  ],
  blockColor: '#B9AC96',
  blocks: [blockPalette('#B9AC96')],
  blockStyle: 'castle',
  layout: null,

  buildLayout(rng) {
    const hills = [];
    for (let i = 0; i < 10; i++) hills.push({ x: i * 260 + (rng() * 70 - 35), w: 240 + rng() * 160, h: 70 + rng() * 80, tone: rng() });
    const trees = [];
    for (let i = 0; i < 26; i++) trees.push({ x: i * 92 + (rng() * 44 - 22), h: 60 + rng() * 130, w: 30 + rng() * 22, tone: rng() });
    const flags = [];
    for (let i = 0; i < 6; i++) flags.push({ x: i * 420 + (rng() * 100 - 50), y: 260 + rng() * 3200, h: 40 + rng() * 30 });
    const clouds = [];
    for (let i = 0; i < 13; i++) clouds.push({ x: rng() * 2400 - 600, y: 250 + rng() * 2400, s: 0.6 + rng() * 1.1, drift: 7 + rng() * 12, bob: rng() * 6.28 });
    const stars = [];
    for (let i = 0; i < 90; i++) stars.push({ x: rng() * 1000, y: 3600 + rng() * 6200, r: 0.6 + rng() * 1.6, tw: rng() * 6.28 });
    return { hills, trees, flags, clouds, stars };
  },

  drawDecor(ctx, api) {
    const { L, gY, camH, CW, CH, time } = api;
    drawStars(ctx, L.stars, 0.12, gY, camH, CW, CH, time, 3400, 2800);
    drawCloudLayer(ctx, L.clouds, 0.33, gY, camH, CW, CH, time, CLOUD_LIGHT, CLOUD_DARK, () => 0.9);

    // low-poly rolling hills, faceted top ridge like the rest of the polygonal set
    L.hills.forEach(h => {
      const base = gY + 60 + camH * 0.5;
      if (base - h.h > CH + 50 || base < -50) return;
      const hx = ((h.x % (CW + 320)) + CW + 320) % (CW + 320) - 160;
      const c1 = lerpColor('#5C8A46', '#7BB05A', h.tone);
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.moveTo(hx - h.w / 2, base);
      ctx.lineTo(hx - h.w * 0.18, base - h.h);
      ctx.lineTo(hx + h.w * 0.12, base - h.h * 0.82);
      ctx.lineTo(hx + h.w / 2, base);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      ctx.beginPath();
      ctx.moveTo(hx - h.w * 0.18, base - h.h); ctx.lineTo(hx + h.w * 0.12, base - h.h * 0.82); ctx.lineTo(hx - h.w * 0.05, base - h.h * 0.7);
      ctx.closePath(); ctx.fill();
    });

    // small pennant flags dotted around at altitude, purely decorative festival touch
    L.flags.forEach(f => {
      const sy = gY - f.y + camH * 0.45;
      if (sy < -60 || sy > CH + 60) return;
      const fx = ((f.x % (CW + 200)) + CW + 200) % (CW + 200) - 100;
      ctx.strokeStyle = '#7a6a52'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(fx, sy); ctx.lineTo(fx, sy - f.h); ctx.stroke();
      ctx.fillStyle = '#C6473A';
      ctx.beginPath(); ctx.moveTo(fx, sy - f.h); ctx.lineTo(fx + 16, sy - f.h + 6); ctx.lineTo(fx, sy - f.h + 12); ctx.closePath(); ctx.fill();
    });

    L.trees.forEach(t => {
      const base = gY + camH * 0.7;
      if (base - t.h > CH + 50 || base < -50) return;
      const tx = ((t.x % (CW + 200)) + CW + 200) % (CW + 200) - 100;
      drawPolyPine(ctx, tx, base, t.h, t.w, 0.35 + t.tone * 0.5);
    });

    const gy2 = gY + camH * 1.0;
    if (gy2 > -10 && gy2 < CH + 200) { ctx.fillStyle = this.ground; ctx.fillRect(0, gy2, CW, CH - gy2 + 300); }
  },

  drawBlockDetail(ctx, x0, x1, fY, yBottom, w) {
    // stacked stone brick pattern with mortar lines, offset every other row
    ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1;
    const rowH = 10;
    let row = 0;
    for (let yy = fY + rowH; yy < yBottom; yy += rowH) {
      ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
      const offset = (row % 2 === 0) ? 0 : 9;
      for (let xx = x0 + offset; xx < x1; xx += 18) { ctx.beginPath(); ctx.moveTo(xx, yy - rowH); ctx.lineTo(xx, yy); ctx.stroke(); }
      row++;
    }
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.fillRect(x0, fY, w, 3);
  }
};
