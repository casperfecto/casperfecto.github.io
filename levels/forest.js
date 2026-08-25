/* ============================= LEVEL: BOSQUE ============================= */
import { pick, lerpColor, blockPalette, clamp } from '../js/utils.js';
import { svgIcon } from '../js/icons.js';
import { drawCloudLayer, drawSpaceApproach, drawStars } from '../js/decor-helpers.js';

const CLOUD_LIGHT = '#fbfff4', CLOUD_DARK = '#c3d8bd';

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
    for (let i = 0; i < 30; i++) trees.push({ x: i * 80 + (rng() * 40 - 20), h: 70 + rng() * 160, w: 34 + rng() * 20, tone: 0.7 + rng() * 0.4 });
    const mountains = [];
    for (let i = 0; i < 10; i++) mountains.push({ x: i * 280 + (rng() * 90 - 40), y: 900 + rng() * 1800, w: 260 + rng() * 220, h: 220 + rng() * 300 });
    const clouds = [];
    for (let i = 0; i < 14; i++) clouds.push({ x: rng() * 2400 - 600, y: 250 + rng() * 2600, s: 0.55 + rng() * 1.1, drift: 7 + rng() * 13, bob: rng() * 6.28 });
    const stars = [];
    for (let i = 0; i < 80; i++) stars.push({ x: rng() * 1000, y: 4200 + rng() * 6000, r: 0.6 + rng() * 1.6, tw: rng() * 6.28 });
    const planets = [];
    for (let i = 0; i < 5; i++) planets.push({ x: rng() * 1200 - 200, y: 6000 + rng() * 4200, r: 32 + rng() * 68, c1: pick(rng, ['#E58AC9', '#7FDBDA', '#F5D76E', '#9CA8FF']), c2: pick(rng, ['#8C3A78', '#227271', '#9C7A22', '#5A66C9']) });
    const meteors = [];
    for (let i = 0; i < 5; i++) meteors.push({ seed: rng() * 1000, y: 5800 + rng() * 4600, speed: 200 + rng() * 140, len: 60 + rng() * 50, ang: 0.5 + rng() * 0.3 });
    return { trees, mountains, clouds, stars, planets, meteors };
  },

  drawDecor(ctx, api) {
    const { L, gY, camH, CW, CH, time } = api;
    drawStars(ctx, L.stars, 0.1, gY, camH, CW, CH, time, 3200, 2600);
    drawSpaceApproach(ctx, L, gY, camH, CW, CH, time);
    drawCloudLayer(ctx, L.clouds, 0.34, gY, camH, CW, CH, time, CLOUD_LIGHT, CLOUD_DARK, () => 0.9 * (1 - clamp((camH - 4600) / 1800, 0, 1)));

    L.mountains.forEach(m => {
      const base = gY - m.y + camH * 0.35;
      if (base - m.h > CH + 50 || base < -50) return;
      const mx = ((m.x % (CW + 400)) + CW + 400) % (CW + 400) - 200;
      ctx.fillStyle = '#6f8fae';
      ctx.beginPath(); ctx.moveTo(mx - m.w / 2, base); ctx.lineTo(mx, base - m.h); ctx.lineTo(mx + m.w / 2, base); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.beginPath(); ctx.moveTo(mx - m.w * 0.08, base - m.h * 0.72); ctx.lineTo(mx, base - m.h); ctx.lineTo(mx + m.w * 0.08, base - m.h * 0.72); ctx.closePath(); ctx.fill();
    });

    L.trees.forEach(t => {
      const base = gY + camH * 0.7;
      const top = base - t.h;
      if (top > CH + 50 || base < -50) return;
      const tx = ((t.x % (CW + 200)) + CW + 200) % (CW + 200) - 100;
      const trunkH = t.h * 0.3;
      const trunkTop = base - trunkH;
      const trunkW = Math.max(9, t.w * 0.26);
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
      ctx.fillStyle = lerpColor('#2f5e2e', '#4c8a45', t.tone);
      ctx.beginPath(); ctx.moveTo(tx - t.w / 2, trunkTop + trunkH * 0.15); ctx.lineTo(tx, top); ctx.lineTo(tx + t.w / 2, trunkTop + trunkH * 0.15); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(tx - t.w * 0.4, base - t.h * 0.5); ctx.lineTo(tx, base - t.h * 0.75); ctx.lineTo(tx + t.w * 0.4, base - t.h * 0.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.12)';
      ctx.beginPath(); ctx.moveTo(tx, top); ctx.lineTo(tx + t.w / 2, trunkTop + trunkH * 0.15); ctx.lineTo(tx + t.w * 0.36, trunkTop + trunkH * 0.15); ctx.closePath(); ctx.fill();
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
