/* ============================= MAIN ============================= */
import './canvas.js';
import { G } from './state.js';
import { render } from './render-core.js';
import { doDrop, update } from './physics.js';
import { profile, saveProfile } from './storage.js';
import { levelFromXP } from './leveling.js';
import { checkAutoUnlocks, checkSpaceUnlock } from './gameover.js';
import { goMenu } from './ui.js';
import { canvas } from './canvas.js';
import './profile-ui.js';
import './friends-ui.js';
import { unlockMusicOnFirstInteraction } from './music.js';

/* ---- main loop ---- */
function frame(t) {
  const dt = Math.min(0.033, (t - (G.lastT || t)) / 1000);
  G.lastT = t;
  update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---- input ---- */
canvas.addEventListener('pointerdown', () => {
  if (G.mode === 'playing') doDrop();
});

// los navegadores bloquean el audio con sonido hasta el primer toque del
// usuario -- apenas ocurre cualquier toque en la pantalla, se desbloquea
document.addEventListener('pointerdown', () => unlockMusicOnFirstInteraction(), { once: true });

/* ---- init ---- */
checkAutoUnlocks(0, levelFromXP(profile.xp).level); // in case save already qualifies
checkSpaceUnlock(false);
saveProfile();
goMenu();