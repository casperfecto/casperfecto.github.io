/* ============================= RENDER ============================= */
import { ctx } from './canvas.js';
import { size } from './canvas.js';
import { G, BH, worldToScreenY, groundScreenY } from './state.js';
import { clamp, sampleStops } from './utils.js';
import { getLayout } from './theme-registry.js';
import { profile } from './storage.js';
import { floatTexts } from './physics.js';

const DEPTH_X = 13, DEPTH_Y = 9; // iso depth offset (up-and-right = "away" from camera)

function drawBlockShape(cx, yTop, yBottom, w) {
  const pal = G.theme.blocks[0];
  const x0 = cx - w / 2, x1 = cx + w / 2;
  const topH = 11;
  const fY = yTop + topH; // front face top edge

  ctx.fillStyle = pal.side;
  ctx.beginPath();
  ctx.moveTo(x1, fY);
  ctx.lineTo(x1 + DEPTH_X, fY - DEPTH_Y);
  ctx.lineTo(x1 + DEPTH_X, yBottom - DEPTH_Y);
  ctx.lineTo(x1, yBottom);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.14)';
  ctx.beginPath(); ctx.moveTo(x1, fY); ctx.lineTo(x1 + DEPTH_X, fY - DEPTH_Y); ctx.lineTo(x1 + DEPTH_X, yBottom - DEPTH_Y); ctx.lineTo(x1, yBottom); ctx.closePath(); ctx.fill();

  ctx.fillStyle = pal.front;
  ctx.fillRect(x0, fY, w, yBottom - fY);

  const fg = ctx.createLinearGradient(x0, 0, x1, 0);
  fg.addColorStop(0, 'rgba(255,255,255,.10)');
  fg.addColorStop(0.5, 'rgba(255,255,255,0)');
  fg.addColorStop(1, 'rgba(0,0,0,.10)');
  ctx.fillStyle = fg;
  ctx.fillRect(x0, fY, w, yBottom - fY);

  ctx.fillStyle = pal.top;
  ctx.beginPath();
  ctx.moveTo(x0, fY); ctx.lineTo(x0 + DEPTH_X, fY - DEPTH_Y); ctx.lineTo(x1 + DEPTH_X, fY - DEPTH_Y); ctx.lineTo(x1, fY);
  ctx.closePath(); ctx.fill();

  ctx.strokeStyle = pal.edge; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, fY); ctx.lineTo(x0 + DEPTH_X, fY - DEPTH_Y); ctx.lineTo(x1 + DEPTH_X, fY - DEPTH_Y); ctx.lineTo(x1, fY); ctx.lineTo(x0, fY);
  ctx.moveTo(x1, fY); ctx.lineTo(x1 + DEPTH_X, fY - DEPTH_Y);
  ctx.moveTo(x1, yBottom); ctx.lineTo(x1 + DEPTH_X, yBottom - DEPTH_Y);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,.16)';
  ctx.strokeRect(x0, fY, w, yBottom - fY);

  // ---- material detail on front face: delegated to the level module ----
  if (typeof G.theme.drawBlockDetail === 'function') {
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, fY, w, yBottom - fY); ctx.clip();
    G.theme.drawBlockDetail(ctx, x0, x1, fY, yBottom, w, cx);
    ctx.restore();
  }
}

function drawBackground() {
  const { CW, CH } = size;
  const sample = sampleStops(G.theme.skyStops, Math.max(0, G.camH), ['top', 'bottom']);
  const grad = ctx.createLinearGradient(0, 0, 0, CH);
  grad.addColorStop(0, sample.top);
  grad.addColorStop(1, sample.bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);
  drawDecor();
}

function drawDecor() {
  const theme = G.theme;
  const L = getLayout(theme);
  const gY = groundScreenY();
  const camH = G.camH;
  const { CW, CH } = size;
  ctx.save();
  theme.drawDecor(ctx, { L, gY, camH, CW, CH, time: G.time });
  ctx.restore();
}

function drawTower() {
  G.blocks.forEach(b => {
    const yTop = worldToScreenY(b.top), yBottom = worldToScreenY(b.bottom);
    if (yBottom < -40 || yTop > size.CH + 40) return;
    drawBlockShape(b.x, yTop, yBottom, b.w);
  });
  if (G.moving && (G.mode === 'playing' || G.mode === 'demo')) {
    const m = G.moving;
    const yTop = worldToScreenY(m.top), yBottom = worldToScreenY(m.bottom);
    drawBlockShape(m.x, yTop, yBottom, m.w);
  }
}

function drawBestMark() {
  if (G.mode !== 'playing') return;
  const best = profile.best[G.theme.id];
  if (!best || best.height <= 0) return;
  const curHeight = G.blocks.length - 1;
  if (curHeight >= best.height) return;
  const worldH = best.height * BH + BH;
  const sy = worldToScreenY(worldH);
  const { CW, CH } = size;
  if (sy < -20 || sy > CH + 20) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
  ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(CW, sy); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(23,11,46,.65)';
  const label = 'TU MEJOR MARCA';
  ctx.font = '700 10px Nunito, sans-serif';
  const tw = ctx.measureText(label).width;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(CW / 2 - tw / 2 - 8, sy - 20, tw + 16, 16, 8) : ctx.rect(CW / 2 - tw / 2 - 8, sy - 20, tw + 16, 16);
  ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(label, CW / 2, sy - 9);
  ctx.restore();
}

function drawDebris() {
  G.debris.forEach(d => {
    if (d.delay && d.delay > 0) return;
    const pal = G.theme.blocks[d.colorIdx % G.theme.blocks.length];
    const alpha = clamp(1 - d.life / d.maxLife * 1.2, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.fillStyle = pal.front;
    ctx.fillRect(-d.w / 2, 0, d.w, d.h * 0.7);
    ctx.fillStyle = pal.top;
    ctx.fillRect(-d.w / 2, -6, d.w, 8);
    ctx.restore();
  });
}
function drawParticles() {
  G.particles.forEach(p => {
    const alpha = clamp(1 - p.life / p.maxLife, 0, 1);
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); ctx.restore();
  });
}
function drawFloatTexts() {
  floatTexts.forEach(f => {
    const p = f.life / f.maxLife;
    ctx.save();
    ctx.globalAlpha = clamp(1 - p, 0, 1);
    ctx.translate(f.x, f.y - p * 46);
    ctx.textAlign = 'center';
    ctx.font = '800 15px Baloo 2, sans-serif';
    ctx.fillStyle = '#FFD23F';
    ctx.fillText(f.label, 0, -14);
    ctx.font = '800 20px Baloo 2, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('+' + f.val, 0, 8);
    ctx.restore();
  });
}

export function render() {
  ctx.save();
  if (G.shake > 0) {
    ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
  }
  drawBackground();
  drawBestMark();
  drawTower();
  drawDebris();
  drawParticles();
  drawFloatTexts();
  ctx.restore();
}
