/* ============================= LEVEL: CIUDAD ============================= */
import { pick, lerpColor, blockPalette } from '../js/utils.js';
import { svgIcon } from '../js/icons.js';
import { drawCloudLayer, drawSpaceApproach, drawStars } from '../js/decor-helpers.js';

const CLOUD_LIGHT = '#ffffff', CLOUD_DARK = '#b9c6de';

export default {
  id: 'city', name: 'Ciudad', icon: svgIcon('building'),
  unlock: { type: 'level', level: 1 },
  ground: '#3a3f52',
  skyStops: [
    { k: 0, top: '#FFB35C', bottom: '#FF7A6E' },
    { k: 600, top: '#8FCBEE', bottom: '#F6D9A8' },
    { k: 1600, top: '#4FA6E0', bottom: '#BFE3F2' },
    { k: 3000, top: '#2C6FBE', bottom: '#8FC5EA' },
    { k: 5200, top: '#123568', bottom: '#3E6FA8' },
    { k: 8000, top: '#050716', bottom: '#1B2350' }
  ],
  blockColor: '#8DA3C4',
  blocks: [blockPalette('#8DA3C4')],
  blockStyle: 'city',
  layout: null,

  buildLayout(rng) {
    const buildings = [];
    for (let i = 0; i < 26; i++) {
      buildings.push({ x: i * 90 + (rng() * 40 - 20), w: 54 + rng() * 46, h: 120 + rng() * 420, tone: 0.75 + rng() * 0.35 });
    }
    const haze = [];
    for (let i = 0; i < 18; i++) haze.push({ x: i * 130 + (rng() * 50 - 25), w: 70 + rng() * 70, h: 150 + rng() * 380 });
    // clouds spread from just above the ground up through the climb so they're visible
    // right from the start, not only once the tower gets very tall
    const clouds = [];
    for (let i = 0; i < 14; i++) clouds.push({ x: rng() * 2400 - 600, y: 250 + rng() * 2400, s: 0.6 + rng() * 1.2, drift: 8 + rng() * 14, bob: rng() * 6.28 });
    const stars = [];
    for (let i = 0; i < 90; i++) stars.push({ x: rng() * 1000, y: 2200 + rng() * 3200, r: 0.6 + rng() * 1.6, tw: rng() * 6.28 });
    const planets = [];
    for (let i = 0; i < 5; i++) planets.push({ x: rng() * 1200 - 200, y: 3400 + rng() * 3000, r: 34 + rng() * 70, c1: pick(rng, ['#E58AC9', '#7FDBDA', '#F5D76E', '#9CA8FF']), c2: pick(rng, ['#8C3A78', '#227271', '#9C7A22', '#5A66C9']) });
    const meteors = [];
    for (let i = 0; i < 5; i++) meteors.push({ seed: rng() * 1000, y: 3600 + rng() * 3200, speed: 220 + rng() * 140, len: 60 + rng() * 50, ang: 0.5 + rng() * 0.3 });
    return { buildings, haze, clouds, stars, planets, meteors };
  },

  drawDecor(ctx, api) {
    const { L, gY, camH, CW, CH, time } = api;
    drawStars(ctx, L.stars, 0.35, gY, camH, CW, CH, time, 2600, 2600);
    drawSpaceApproach(ctx, L, gY, camH, CW, CH, time);
    drawCloudLayer(ctx, L.clouds, 0.32, gY, camH, CW, CH, time, CLOUD_LIGHT, CLOUD_DARK, sy => 0.9 * (1 - (function () { const t = (camH - 4200) / 1800; return t < 0 ? 0 : t > 1 ? 1 : t; })()));

    ctx.save(); ctx.globalAlpha = 0.4;
    L.haze.forEach(b => {
      const top = gY - b.h + camH * 0.38;
      const bottom = gY + 60 + camH * 0.38;
      if (top > CH + 50 || bottom < -50) return;
      const bx = ((b.x % (CW + 260)) + CW + 260) % (CW + 260) - 130;
      ctx.fillStyle = '#7C8BAE';
      ctx.fillRect(bx, top, b.w, bottom - top);
    });
    ctx.restore();

    L.buildings.forEach(b => {
      const top = gY - b.h + camH * 0.55;
      const bottom = gY + 40 + camH * 0.55;
      if (top > CH + 50 || bottom < -50) return;
      const bx = ((b.x % (CW + 300)) + CW + 300) % (CW + 300) - 150;
      const front = lerpColor('#5b6478', '#1c2033', 1 - b.tone);
      const side = lerpColor('#3a4258', '#101322', 1 - b.tone);
      const roof = lerpColor(front, '#ffffff', 0.14);
      const bd = 8 + b.w * 0.16;
      ctx.fillStyle = side;
      ctx.beginPath();
      ctx.moveTo(bx + b.w, top); ctx.lineTo(bx + b.w + bd, top - bd * 0.55); ctx.lineTo(bx + b.w + bd, bottom - bd * 0.55); ctx.lineTo(bx + b.w, bottom);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = front;
      ctx.fillRect(bx, top, b.w, bottom - top);
      ctx.fillStyle = roof;
      ctx.beginPath();
      ctx.moveTo(bx, top); ctx.lineTo(bx + bd, top - bd * 0.55); ctx.lineTo(bx + b.w + bd, top - bd * 0.55); ctx.lineTo(bx + b.w, top);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,220,140,0.55)';
      for (let wy = top + 10; wy < bottom - 10; wy += 16) {
        for (let wx = bx + 6; wx < bx + b.w - 6; wx += 13) { if (((wx + wy) | 0) % 23 < 15) ctx.fillRect(wx, wy, 6, 8); }
      }
    });

    const gy2 = gY + camH * 1.0;
    if (gy2 > -10 && gy2 < CH + 200) {
      // banqueta: franja clara entre los edificios y la calle, con junta de
      // baldosas sutil y un bordillo más oscuro antes del asfalto
      const sidewalkH = 15, curbH = 5;
      const sidewalkY = gy2 - sidewalkH - curbH;
      ctx.fillStyle = '#d6d6d6ff';
      ctx.fillRect(0, sidewalkY, CW, sidewalkH);
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      ctx.fillRect(0, sidewalkY, CW, 2);
      ctx.strokeStyle = 'rgba(0,0,0,.14)'; ctx.lineWidth = 1;
      for (let x = 12; x < CW; x += 26) { ctx.beginPath(); ctx.moveTo(x, sidewalkY + 2); ctx.lineTo(x, sidewalkY + sidewalkH - 2); ctx.stroke(); }
      ctx.fillStyle = '#bbbbbbff';
      ctx.fillRect(0, sidewalkY + sidewalkH, CW, curbH);
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      ctx.fillRect(0, sidewalkY + sidewalkH, CW, 2);

      ctx.fillStyle = this.ground;
      ctx.fillRect(0, gy2, CW, CH - gy2 + 300);
      const vanishW = CW * 0.22;
      ctx.fillStyle = 'rgba(0,0,0,.16)';
      ctx.beginPath();
      ctx.moveTo(CW / 2 - vanishW / 2, gy2); ctx.lineTo(CW / 2 + vanishW / 2, gy2); ctx.lineTo(CW, gy2 + 120); ctx.lineTo(0, gy2 + 120);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.setLineDash([18, 14]); ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, gy2 + 30); ctx.lineTo(CW, gy2 + 30); ctx.stroke(); ctx.setLineDash([]);
    }
  },

  drawBlockDetail(ctx, x0, x1, fY, yBottom) {
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1;
    for (let wx = x0 + 14; wx < x1 - 4; wx += 14) { ctx.beginPath(); ctx.moveTo(wx, fY + 3); ctx.lineTo(wx, yBottom - 3); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x0 + 2, (fY + yBottom) / 2); ctx.lineTo(x1 - 2, (fY + yBottom) / 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    const w = x1 - x0;
    ctx.beginPath(); ctx.moveTo(x0, yBottom); ctx.lineTo(x0 + w * 0.32, fY); ctx.lineTo(x0 + w * 0.18, fY); ctx.lineTo(x0, yBottom - w * 0.14); ctx.closePath(); ctx.fill();
  }
};