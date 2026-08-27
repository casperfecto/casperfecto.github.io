/* ============================= GAME OVER ============================= */
import { G, BH, worldToScreenY } from './state.js';
import { clamp, lerp } from './utils.js';
import { profile, saveProfile } from './storage.js';
import { levelFromXP } from './leveling.js';
import { THEMES, THEME_ORDER } from './theme-registry.js';
import { showScreen, updateTopbar, toast, showLevelUp } from './ui.js';
import { checkAchievements } from './achievements.js';

let lastRunHeight = 0;
export function trackHeight() { lastRunHeight = Math.max(0, G.blocks.length - 1); }

export function triggerGameOver() {
  G.mode = 'gameover-anim';
  document.getElementById('hud').classList.add('hidden');
  for (let i = G.blocks.length - 1; i >= 1; i--) {
    const b = G.blocks[i];
    const dir = Math.random() < 0.5 ? -1 : 1;
    G.debris.push({
      x: b.x, y: worldToScreenY(b.top), w: b.w, h: BH, colorIdx: b.colorIdx,
      vx: dir * (30 + Math.random() * 90), vy: -100 - Math.random() * 160, rot: 0, vrot: dir * (3 + Math.random() * 3),
      life: 0, maxLife: 2.4, grav: 1300, delay: i * 0.03
    });
  }
  G.blocks = [G.blocks[0]];
  setTimeout(finishGameOver, 620);
}

function finishGameOver() {
  G.mode = 'gameover';
  const themeId = G.theme.id;
  const runHeightBlocks = lastRunHeight;
  const xpGain = Math.round(G.score * 0.8);
  const coinsGain = Math.floor(G.score / 6) + G.perfects;
  const oldLevel = levelFromXP(profile.xp).level;
  profile.xp += xpGain;
  profile.coins += coinsGain;
  profile.totalCoinsEarned = (profile.totalCoinsEarned || 0) + coinsGain;
  profile.totalGames++;
  const newLevel = levelFromXP(profile.xp).level;

  let isRecord = false;
  const best = profile.best[themeId];
  if (G.score > best.score) { best.score = G.score; isRecord = true; }
  if (runHeightBlocks > best.height) { best.height = runHeightBlocks; }
  saveProfile();

  document.getElementById('go-score').textContent = 0;
  animateCount(document.getElementById('go-score'), 0, G.score, 700);
  document.getElementById('go-height').textContent = runHeightBlocks;
  document.getElementById('go-perfects').textContent = G.perfects;
  document.getElementById('go-coins').textContent = '+' + coinsGain;
  document.getElementById('go-record').classList.toggle('hidden', !isRecord);

  const li = levelFromXP(profile.xp);
  document.getElementById('go-lvl-label').textContent = 'Nivel ' + li.level;
  document.getElementById('go-xp-label').textContent = li.into + '/' + li.need;
  const fill = document.getElementById('go-xp-fill');
  fill.style.width = '0%';
  requestAnimationFrame(() => { fill.style.width = Math.round(100 * li.into / li.need) + '%'; });

  showScreen('screen-gameover');

  if (newLevel > oldLevel) {
    setTimeout(() => { checkAutoUnlocks(oldLevel, newLevel); showLevelUp(newLevel); }, 900);
  }
  updateTopbar();
  checkAchievements();
}

function animateCount(el, from, to, dur) {
  const t0 = performance.now();
  function step(t) {
    const p = clamp((t - t0) / dur, 0, 1);
    el.textContent = Math.round(lerp(from, to, 1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export function checkAutoUnlocks(oldLvl, newLvl) {
  let unlockedNew = [];
  THEME_ORDER.forEach(id => {
    const th = THEMES[id];
    if (th.unlock.type === 'level' && !profile.unlocked.includes(id) && th.unlock.level <= newLvl) {
      profile.unlocked.push(id); unlockedNew.push(th.name);
    }
  });
  if (unlockedNew.length) { saveProfile(); checkAchievements(); setTimeout(() => { toast('Nuevo mapa: ' + unlockedNew.join(', '), 'map'); }, 1600); }
}
export function checkSpaceUnlock(announce) {
  if (profile.reachedSpace && !profile.unlocked.includes('space')) {
    profile.unlocked.push('space'); saveProfile(); checkAchievements();
    if (announce) toast('¡Llegaste al espacio! Marte desbloqueado', 'planet');
    if (document.getElementById('screen-maps').classList.contains('active')) {
      import('./ui.js').then(m => m.renderMaps());
    }
  }
}
