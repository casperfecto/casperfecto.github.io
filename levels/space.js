/* ============================= LEVEL: MARTE ============================= */
import { lerpColor, shade, blockPalette } from '../js/utils.js';
import { svgIcon } from '../js/icons.js';
import { drawLowPolyOrb } from '../js/decor-helpers.js';

export default {
  id: 'space', name: 'Marte', icon: svgIcon('planet'),
  unlock: { type: 'special', flag: 'reachedSpace' },
  ground: '#8a3a24',
  skyStops: [
    { k: 0, top: '#D97A4A', bottom: '#F2B27C' },
    { k: 900, top: '#B85A3E', bottom: '#E0946A' },
    { k: 2200, top: '#7C3B34', bottom: '#B36A4E' },
    { k: 4000, top: '#432234', bottom: '#7A4440' },
    { k: 6500, top: '#180B22', bottom: '#3A1F2C' },
    { k: 9500, top: '#020103', bottom: '#0F0810' }
  ],
  blockColor: '#C9AFA0',
  blocks: [blockPalette('#C9AFA0')],
  blockStyle: 'space',
  layout: null,

  buildLayout(rng) {
    const mesas = [];
    for (let i = 0; i < 12; i++) mesas.push({ x: i * 160 + (rng() * 40 - 20), w: 70 + rng() * 70, h: 160 + rng() * 320, tone: 0.6 + rng() * 0.4 });
    const craters = [];
    for (let i = 0; i < 16; i++) craters.push({ x: i * 120 + (rng() * 60 - 30), r: 14 + rng() * 30 });
    const rocks = [];
    for (let i = 0; i < 20; i++) rocks.push({ x: i * 90 + (rng() * 50 - 25), w: 10 + rng() * 16, h: 8 + rng() * 12 });
    const moons = [];
    moons.push({ x: 0.22, y: 900, r: 26, tone: 0.55 });
    moons.push({ x: 0.72, y: 1700, r: 15, tone: 0.4 });
    const dust = [];
    for (let i = 0; i < 24; i++) dust.push({ x: rng() * 1000, y: rng() * 9000, r: 1 + rng() * 2.2, drift: 6 + rng() * 10, bob: rng() * 6.28 });
    const stars = [];
    for (let i = 0; i < 140; i++) stars.push({ x: rng() * 1000, y: 2600 + rng() * 7000, r: 0.6 + rng() * 1.8, tw: rng() * 6.28 });
    return { mesas, craters, rocks, moons, dust, stars };
  },

  drawDecor(ctx, api) {
    const { L, gY, camH, CW, CH, time } = api;
    ctx.save();
    L.stars.forEach(s => {
      const sy = gY - s.y + camH * 0.14;
      if (sy < -10 || sy > CH + 10) return;
      const op = Math.max(0, Math.min(1, (camH - 1200) / 2400));
      if (op <= 0) return;
      ctx.globalAlpha = op * (0.6 + 0.4 * Math.sin(s.tw + camH * 0.003));
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc((s.x % CW + CW) % CW, sy, s.r, 0, 7); ctx.fill();
    });
    ctx.restore();
    ctx.globalAlpha = 1;

    L.moons.forEach(m => {
      const sy = gY - m.y + camH * 0.18;
      if (sy < -60 || sy > CH + 60) return;
      const mx = m.x * CW;
      drawLowPolyOrb(ctx, mx, sy, m.r, shade('#B7A99B', 0.15), shade('#7C6E62', -m.tone));
    });

    L.mesas.forEach(mm => {
      const top = gY - mm.h + camH * 0.5;
      const bottom = gY + 50 + camH * 0.5;
      if (top > CH + 50 || bottom < -50) return;
      const mx = ((mm.x % (CW + 280)) + CW + 280) % (CW + 280) - 140;
      const front = lerpColor('#B25A38', '#5A2A1C', 1 - mm.tone);
      const side = lerpColor('#7C3B26', '#3A1811', 1 - mm.tone);
      const capw = 8 + mm.w * 0.14;
      ctx.fillStyle = side;
      ctx.beginPath();
      ctx.moveTo(mx + mm.w, top); ctx.lineTo(mx + mm.w + capw, top - capw * 0.5); ctx.lineTo(mx + mm.w + capw, bottom - capw * 0.5); ctx.lineTo(mx + mm.w, bottom);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = front;
      ctx.fillRect(mx, top, mm.w, bottom - top);
      ctx.fillStyle = lerpColor(front, '#ffffff', 0.12);
      ctx.beginPath();
      ctx.moveTo(mx, top); ctx.lineTo(mx + capw, top - capw * 0.5); ctx.lineTo(mx + mm.w + capw, top - capw * 0.5); ctx.lineTo(mx + mm.w, top);
      ctx.closePath(); ctx.fill();
    });

    L.dust.forEach(d => {
      const sy = gY - d.y + camH * 0.6 + Math.sin(time * 0.6 + d.bob) * 3;
      if (sy < -10 || sy > CH + 10) return;
      const span = CW + 200;
      const dx = (((d.x + time * d.drift) % span) + span) % span - 100;
      ctx.globalAlpha = 0.35; ctx.fillStyle = '#E8B48F';
      ctx.beginPath(); ctx.arc(dx, sy, d.r, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    });

    const gy2 = gY + camH * 1.0;
    if (gy2 > -10 && gy2 < CH + 200) {
      ctx.fillStyle = this.ground;
      ctx.fillRect(0, gy2, CW, CH - gy2 + 300);
      L.craters.forEach(c => {
        const cx2 = ((c.x % (CW + 160)) + CW + 160) % (CW + 160) - 80;
        ctx.fillStyle = 'rgba(0,0,0,.18)';
        ctx.beginPath(); ctx.ellipse(cx2, gy2 + 10, c.r, c.r * 0.32, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,180,140,.25)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(cx2, gy2 + 8, c.r * 0.9, c.r * 0.28, 0, Math.PI, Math.PI * 2); ctx.stroke();
      });
      L.rocks.forEach(r => {
        const rx = ((r.x % (CW + 140)) + CW + 140) % (CW + 140) - 70;
        ctx.fillStyle = '#6E3521';
        ctx.beginPath(); ctx.moveTo(rx - r.w / 2, gy2 + 2); ctx.lineTo(rx - r.w * 0.15, gy2 - r.h); ctx.lineTo(rx + r.w / 2, gy2 + 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,190,150,.3)';
        ctx.beginPath(); ctx.moveTo(rx - r.w * 0.15, gy2 - r.h); ctx.lineTo(rx + r.w * 0.1, gy2 - r.h * 0.4); ctx.lineTo(rx - r.w * 0.05, gy2 + 2); ctx.closePath(); ctx.fill();
      });
    }
  },

  drawBlockDetail(ctx, x0, x1, fY, yBottom, w, cx) {
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(x0 + 6, fY + 5, w - 12, (yBottom - fY - 10));
    ctx.fillStyle = 'rgba(80,95,120,.55)';
    [[x0 + 8, fY + 7], [x1 - 8, fY + 7], [x0 + 8, yBottom - 7], [x1 - 8, yBottom - 7]].forEach(p => { ctx.beginPath(); ctx.arc(p[0], p[1], 2, 0, 7); ctx.fill(); });
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.beginPath(); ctx.arc(cx, (fY + yBottom) / 2, 4, 0, 7); ctx.fill();
  }
};
