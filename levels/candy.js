/* ============================= LEVEL: DULCE ============================= */
import { pick, shade, blockPalette } from '../js/utils.js';
import { svgIcon } from '../js/icons.js';
import { drawCloudLayer, drawStars } from '../js/decor-helpers.js';

const CLOUD_LIGHT = '#fff2fa', CLOUD_DARK = '#e0c3e8';

export default {
  id: 'candy', name: 'Dulce', icon: svgIcon('candy'),
  unlock: { type: 'coins', cost: 1000 },
  ground: '#8a5a9c',
  skyStops: [
    { k: 0, top: '#FFC9E8', bottom: '#FFF0CE' },
    { k: 900, top: '#C9B6FF', bottom: '#FFD9EE' },
    { k: 2200, top: '#9B8CFF', bottom: '#D9BCFF' },
    { k: 4000, top: '#5E5AC9', bottom: '#A98CE0' },
    { k: 6200, top: '#2C2470', bottom: '#5A4AA0' },
    { k: 9000, top: '#0E0A2C', bottom: '#231566' }
  ],
  blockColor: '#FF9AC0',
  blocks: [blockPalette('#FF9AC0')],
  blockStyle: 'candy',
  layout: null,

  buildLayout(rng) {
    const hills = [];
    for (let i = 0; i < 10; i++) hills.push({ x: i * 260 + (rng() * 60 - 30), w: 220 + rng() * 140, h: 80 + rng() * 90, c: pick(rng, ['#FF9AC0', '#8FE0B0', '#FFD97A', '#B3A0F5']) });
    const rainbows = [];
    for (let i = 0; i < 5; i++) rainbows.push({ x: rng() * 1400 - 200, y: 1600 + rng() * 2600, s: 0.7 + rng() * 0.8 });
    const crystals = [];
    for (let i = 0; i < 9; i++) crystals.push({ x: i * 230 + (rng() * 70 - 35), y: 900 + rng() * 3200, w: 44 + rng() * 36, h: 110 + rng() * 140, c: pick(rng, ['#FF9AC0', '#B3A0F5', '#8FE0B0', '#FFD97A']) });
    const clouds = [];
    for (let i = 0; i < 12; i++) clouds.push({ x: rng() * 2400 - 600, y: 250 + rng() * 2200, s: 0.6 + rng() * 1, drift: 6 + rng() * 10, bob: rng() * 6.28 });
    const stars = [];
    for (let i = 0; i < 90; i++) stars.push({ x: rng() * 1000, y: 4000 + rng() * 6000, r: 0.7 + rng() * 1.8, tw: rng() * 6.28 });
    return { hills, rainbows, crystals, clouds, stars };
  },

  drawDecor(ctx, api) {
    const { L, gY, camH, CW, CH, time } = api;
    drawStars(ctx, L.stars, 0.12, gY, camH, CW, CH, time, 3200, 2600);

    L.rainbows.forEach(r => {
      const sy = gY - r.y + camH * 0.3;
      if (sy < -260 || sy > CH + 120) return;
      const rx = ((r.x % (CW + 500)) + CW + 500) % (CW + 500) - 250;
      const cols = ['#FF9AC0', '#FFD97A', '#D4F3E0', '#B3A0F5'];
      for (let i = 0; i < cols.length; i++) {
        ctx.strokeStyle = cols[i]; ctx.lineWidth = 14 * r.s; ctx.beginPath();
        ctx.arc(rx, sy + 120 * r.s, 150 * r.s - i * 15 * r.s, Math.PI, 0); ctx.stroke();
      }
    });

    drawCloudLayer(ctx, L.clouds, 0.4, gY, camH, CW, CH, time, CLOUD_LIGHT, CLOUD_DARK, () => 0.8);

    L.crystals.forEach(c => {
      const top = gY - c.h + camH * 0.5;
      const bottom = gY + 30 + camH * 0.5;
      if (top > CH + 50 || bottom < -50) return;
      const cx2 = ((c.x % (CW + 260)) + CW + 260) % (CW + 260) - 130;
      const front = c.c, side = shade(c.c, -0.3), tip = shade(c.c, 0.35);
      ctx.fillStyle = side;
      ctx.beginPath(); ctx.moveTo(cx2 + c.w / 2, top + 18); ctx.lineTo(cx2 + c.w / 2 + 9, top + 10); ctx.lineTo(cx2 + c.w / 2 + 9, bottom - 6); ctx.lineTo(cx2 + c.w / 2, bottom); ctx.closePath(); ctx.fill();
      ctx.fillStyle = front;
      ctx.beginPath(); ctx.moveTo(cx2, top); ctx.lineTo(cx2 + c.w / 2, top + 18); ctx.lineTo(cx2 + c.w / 2, bottom); ctx.lineTo(cx2 - c.w / 2, bottom); ctx.lineTo(cx2 - c.w / 2, top + 18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = tip;
      ctx.beginPath(); ctx.moveTo(cx2, top); ctx.lineTo(cx2 + c.w / 2, top + 18); ctx.lineTo(cx2 - c.w / 2, top + 18); ctx.closePath(); ctx.fill();
    });

    L.hills.forEach(h => {
      const base = gY + 40 + camH * 0.5;
      if (base - h.h > CH + 50 || base < -50) return;
      const hx = ((h.x % (CW + 320)) + CW + 320) % (CW + 320) - 160;
      ctx.fillStyle = h.c;
      ctx.beginPath(); ctx.ellipse(hx, base, h.w / 2, h.h, 0, Math.PI, 0); ctx.fill();
    });

    const gy2 = gY + camH * 1.0;
    if (gy2 > -10 && gy2 < CH + 200) { ctx.fillStyle = this.ground; ctx.fillRect(0, gy2, CW, CH - gy2 + 300); }
  },

  drawBlockDetail(ctx, x0, x1, fY, yBottom, w) {
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 5;
    for (let d = -yBottom; d < w + (yBottom - fY); d += 16) {
      ctx.beginPath(); ctx.moveTo(x0 + d, yBottom); ctx.lineTo(x0 + d + (yBottom - fY), fY); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.fillRect(x0, fY, w, 4);
  }
};
