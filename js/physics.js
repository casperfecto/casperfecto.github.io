/* ============================= DROP LOGIC & PHYSICS ============================= */
import { size } from './canvas.js';
import { G, BH, PERFECT_PX, BASE_SPEED, SPEED_PER_BLOCK, MAX_SPEED, SPACE_REACH_HEIGHT, worldToScreenY, groundScreenY } from './state.js';
import { clamp, lerp } from './utils.js';
import { Audio1 } from './audio.js';
import { profile, saveProfile } from './storage.js';
import { triggerGameOver, trackHeight, checkSpaceUnlock } from './gameover.js';
import { checkAchievements } from './achievements.js';

export function colorIdx(theme, i) { return i % theme.blocks.length; }

export function resetTower(theme, forDemo) {
  G.theme = theme;
  G.blocks = [];
  G.debris = [];
  G.particles = [];
  const baseW = Math.min(size.CW * 0.62, 300);
  G.blocks.push({ x: size.CW / 2, w: baseW, bottom: 0, top: BH, colorIdx: 0, foundation: true });
  G.camH = 0; G.camTarget = 0; G.score = 0; G.perfects = 0; G.combo = 0; G.shake = 0; G.bestMarkShown = false; G.allPerfect = true; G.spaceReachedThisRun = false;
  spawnNext();
}
export function spawnNext() {
  const last = G.blocks[G.blocks.length - 1];
  const speed = clamp(BASE_SPEED + (G.blocks.length - 1) * SPEED_PER_BLOCK, BASE_SPEED, MAX_SPEED);
  const dir = Math.random() < 0.5 ? -1 : 1;
  const startX = dir > 0 ? last.w / 2 + 10 : size.CW - last.w / 2 - 10;
  G.moving = { x: startX, w: last.w, bottom: last.top, top: last.top + BH, dir, speed, colorIdx: colorIdx(G.theme, G.blocks.length) };
}

export function doDrop() {
  if (G.mode !== 'playing') return;
  const m = G.moving, last = G.blocks[G.blocks.length - 1];
  const dx = m.x - last.x;
  const overlap = last.w - Math.abs(dx);
  const dropScreenY = worldToScreenY((m.bottom + m.top) / 2);

  if (overlap <= 0.5) {
    G.debris.push(makeDebris(m.x, m.w, m.bottom, m.top, m.colorIdx, Math.sign(dx) || 1, 1));
    Audio1.fall();
    triggerGameOver();
    return;
  }

  const isPerfect = Math.abs(dx) <= PERFECT_PX;
  let newW, newX, leftoverW, leftoverX, leftoverSide;
  if (isPerfect) {
    newW = last.w; newX = last.x;
  } else {
    const mLeft = m.x - m.w / 2, mRight = m.x + m.w / 2;
    const lLeft = last.x - last.w / 2, lRight = last.x + last.w / 2;
    const nLeft = Math.max(mLeft, lLeft), nRight = Math.min(mRight, lRight);
    newW = nRight - nLeft; newX = (nLeft + nRight) / 2;
    if (mLeft < lLeft) { leftoverW = lLeft - mLeft; leftoverX = mLeft + leftoverW / 2; leftoverSide = -1; }
    else { leftoverW = mRight - lRight; leftoverX = lRight + leftoverW / 2; leftoverSide = 1; }
  }

  G.blocks.push({ x: newX, w: newW, bottom: m.bottom, top: m.top, colorIdx: m.colorIdx });
  trackHeight();

  if (isPerfect) {
    G.combo++;
    const gain = Math.round(12 + G.combo * 3);
    G.score += gain; G.perfects++;
    spawnBurst(newX, dropScreenY, G.theme);
    G.shake = 6;
    Audio1.perfect(G.combo);
    showFloatText(gain, 'PERFECTO', newX, dropScreenY);
  } else {
    G.combo = 0;
    G.allPerfect = false;
    const gain = Math.max(1, Math.round(6 * (newW / (last.w))));
    G.score += gain;
    if (leftoverW > 0.5) G.debris.push(makeDebris(leftoverX, leftoverW, m.bottom, m.top, m.colorIdx, leftoverSide, 0));
    Audio1.place();
    G.shake = 2;
  }

  document.getElementById('hud-score-num').textContent = G.score;
  const comboEl = document.getElementById('hud-combo');
  if (G.combo >= 2) { comboEl.textContent = '¡COMBO x' + G.combo + '!'; comboEl.classList.add('show'); }
  else comboEl.classList.remove('show');

  spawnNext();
}

function makeDebris(x, w, bottom, top, ci, dir, heavy) {
  const y = worldToScreenY(top);
  return { x, y, w, h: BH, colorIdx: ci, vx: dir * (60 + Math.random() * 60), vy: heavy ? -40 : -70, rot: 0, vrot: dir * (2.4 + Math.random() * 1.4), life: 0, maxLife: 1.8, grav: 1000 + Math.random() * 200 };
}
function spawnBurst(x, y, theme) {
  const c = theme.blocks[colorIdx(theme, G.blocks.length - 1)];
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 140;
    G.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 0, maxLife: 0.5 + Math.random() * 0.4, r: 2 + Math.random() * 3, color: Math.random() < 0.5 ? '#FFD23F' : c.top });
  }
}
export const floatTexts = [];
function showFloatText(val, label, x, y) {
  floatTexts.push({ x, y, val, label, life: 0, maxLife: 1.1 });
}

/* used by the toppling animation in gameover.js */
export function pushToppleDebris(d) { G.debris.push(d); }

export function update(dt) {
  G.time += dt;
  const topH = G.blocks.length ? (G.blocks[G.blocks.length - 1].top) : 0;
  G.camTarget = Math.max(0, topH - 5 * BH);
  G.camH = lerp(G.camH, G.camTarget, 1 - Math.pow(0.0025, dt));

  if (G.mode === 'playing' && (G.theme.id === 'city' || G.theme.id === 'forest' || G.theme.id === 'farm') && !G.spaceReachedThisRun && G.camH >= SPACE_REACH_HEIGHT) {
    G.spaceReachedThisRun = true;
    if (G.allPerfect) profile.perfectSpaceRun = true;
    if (!profile.reachedSpace) { profile.reachedSpace = true; checkSpaceUnlock(true); }
    saveProfile();
    checkAchievements();
  }

  if (G.mode === 'playing' && G.moving) {
    const m = G.moving;
    m.x += m.dir * m.speed * dt;
    const minX = m.w / 2, maxX = size.CW - m.w / 2;
    if (m.x < minX) { m.x = minX; m.dir = 1; }
    if (m.x > maxX) { m.x = maxX; m.dir = -1; }
  }

  for (let i = G.debris.length - 1; i >= 0; i--) {
    const d = G.debris[i];
    if (d.delay && d.delay > 0) { d.delay -= dt; continue; }
    d.vy += d.grav * dt;
    d.x += d.vx * dt; d.y += d.vy * dt; d.rot += d.vrot * dt;
    d.life += dt;
    if (d.life > d.maxLife || d.y > size.CH + 140) G.debris.splice(i, 1);
  }
  for (let i = G.particles.length - 1; i >= 0; i--) {
    const p = G.particles[i];
    p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life += dt;
    if (p.life > p.maxLife) G.particles.splice(i, 1);
  }
  for (let i = floatTexts.length - 1; i >= 0; i--) {
    floatTexts[i].life += dt;
    if (floatTexts[i].life > floatTexts[i].maxLife) floatTexts.splice(i, 1);
  }
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 20);

  if (G.mode === 'demo') updateDemo(dt);
}

function updateDemo(dt) {
  if (!G.moving) return;
  G.demoTimer -= dt;
  if (G.demoTimer <= 0) {
    const m = G.moving, last = G.blocks[G.blocks.length - 1];
    m.x = last.x + (Math.random() * 8 - 4);
    const dx = m.x - last.x;
    const isPerfect = Math.abs(dx) <= PERFECT_PX;
    const newW = isPerfect ? last.w : last.w - Math.abs(dx);
    G.blocks.push({ x: last.x, w: newW, bottom: m.bottom, top: m.top, colorIdx: m.colorIdx });
    spawnBurst(last.x, worldToScreenY((m.bottom + m.top) / 2), G.theme);
    if (G.blocks.length > 22) {
      resetTower(G.theme, true);
    } else {
      spawnNext();
    }
    G.demoTimer = 0.85;
  }
}
