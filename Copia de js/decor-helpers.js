/* ============================= SHARED DECOR HELPERS ============================= */
/* Low-poly / faceted "polygonal 3D" style shared across level modules, so every
   theme's clouds, planets and moons keep the same graphic identity. */
import { clamp, lerpColor } from './utils.js';

/* one faceted "puff": a flattened low-poly disc, lit from the upper-left */
function polyPuff(ctx, cx, cy, r, cLight, cDark) {
  const N = 8;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / N) * Math.PI * 2 - Math.PI / 2;
    const shadeAmt = 0.2 + 0.8 * Math.max(0, Math.sin((a0 + a1) / 2 + 0.9));
    ctx.fillStyle = lerpColor(cDark, cLight, shadeAmt);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r * 0.62);
    ctx.lineTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r * 0.62);
    ctx.closePath(); ctx.fill();
  }
}

/* faceted low-poly cloud made of overlapping puffs, matching the polygonal art style */
const CLOUD_PUFFS = [
  { dx: -38, dy: 3, r: 25 },
  { dx: -15, dy: -9, r: 29 },
  { dx: 14, dy: -6, r: 27 },
  { dx: 39, dy: 4, r: 19 },
  { dx: 0, dy: 10, r: 21 }
];
export function drawLowPolyCloud(ctx, x, y, s, cLight, cDark) {
  CLOUD_PUFFS.forEach(p => polyPuff(ctx, x + p.dx * s, y + p.dy * s, p.r * s, cLight, cDark));
}

/* natural drifting cloud layer: horizontal drift + gentle vertical bob, wraps around screen width */
export function drawCloudLayer(ctx, list, camFactor, gY, camH, CW, CH, time, cLight, cDark, alphaFn) {
  ctx.save();
  list.forEach(c => {
    const sy = gY - c.y + camH * camFactor + Math.sin(time * 0.5 + (c.bob || 0)) * 4;
    if (sy < -90 || sy > CH + 90) return;
    const span = CW + 400;
    const cx = (((c.x + time * (c.drift || 10)) % span) + span) % span - 200;
    ctx.globalAlpha = alphaFn ? alphaFn(sy) : 0.9;
    if (ctx.globalAlpha <= 0) return;
    drawLowPolyCloud(ctx, cx, sy, c.s, cLight, cDark);
  });
  ctx.restore();
}

/* low-poly faceted "orb" -- gives planets/moons a polygonal 3D look instead of a flat circle */
export function drawLowPolyOrb(ctx, cx, cy, r, cLight, cDark) {
  const N = 10;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
    const shadeAmt = 0.15 + 0.85 * Math.max(0, Math.sin((a0 + a1) / 2 + 0.7));
    ctx.fillStyle = lerpColor(cDark, cLight, shadeAmt);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r);
    ctx.lineTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
    ctx.closePath(); ctx.fill();
  }
}

export function drawMeteor(ctx, x, y, ang, len, alpha) {
  if (alpha <= 0) return;
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const grad = ctx.createLinearGradient(x, y, x - dx * len, y - dy * len);
  grad.addColorStop(0, 'rgba(255,255,255,' + (0.9 * alpha) + ')');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save();
  ctx.strokeStyle = grad; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - dx * len, y - dy * len); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
  ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 7); ctx.fill();
  ctx.restore();
}

/* renders the "reaching space" layer (low-poly planets + streaking meteors), reused by
   any level that wants a space-approach effect at high altitude */
export function drawSpaceApproach(ctx, L, gY, camH, CW, CH, time) {
  if (!L.planets) return;
  const op = clamp((camH - 3600) / 2600, 0, 1);
  if (op <= 0) return;
  ctx.save(); ctx.globalAlpha = op;
  L.planets.forEach(p => {
    const sy = gY - p.y + camH * 0.2;
    if (sy < -160 || sy > CH + 160) return;
    const px = ((p.x % (CW + 300)) + CW + 300) % (CW + 300) - 150;
    drawLowPolyOrb(ctx, px, sy, p.r, p.c1, p.c2);
  });
  ctx.restore();
  (L.meteors || []).forEach(m => {
    const sy = gY - m.y + camH * 0.22;
    if (sy < -40 || sy > CH + 40) return;
    const cyc = 1400;
    const prog = ((time * m.speed + m.seed * 37) % cyc) / cyc;
    const mx = prog * (CW + 260) - 130;
    const mAlpha = op * clamp(1 - Math.abs(prog - 0.5) * 1.6, 0, 1) * 0.9;
    drawMeteor(ctx, mx, sy, m.ang, m.len, mAlpha);
  });
}

/* shared starfield fade-in used by several themes */
export function drawStars(ctx, stars, parallax, gY, camH, CW, CH, time, fadeFrom, fadeSpan) {
  ctx.save();
  stars.forEach(s => {
    const sy = gY - s.y + camH * parallax;
    if (sy < -10 || sy > CH + 10) return;
    const op = clamp((camH - fadeFrom) / fadeSpan, 0, 1);
    if (op <= 0) return;
    ctx.globalAlpha = op * (0.5 + 0.5 * Math.sin(s.tw + camH * 0.002));
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc((s.x % CW + CW) % CW, sy, s.r, 0, 7); ctx.fill();
  });
  ctx.restore();
}
