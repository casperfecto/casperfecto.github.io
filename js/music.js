/* ============================= MUSIC ============================= */
/* Un pista por mapa, cargada bajo demanda desde levels/<id>.mp4 -- cambia
   sola cuando cambia el tema activo (ver el hook en physics.js:resetTower).
   Los navegadores bloquean el autoplay con sonido hasta el primer toque del
   usuario, así que queda "armada" y arranca apenas se desbloquea. */
import { profile } from './storage.js';

const el = new Audio();
el.loop = true;
el.volume = 0.15;
el.preload = 'auto';

let currentThemeId = null;
let unlocked = false;

function attemptPlay() {
  if (!profile.music || !unlocked || !currentThemeId) return;
  el.play().catch(() => {}); // si el archivo todavía no existe o el navegador lo bloquea, no rompe nada
}

export function playThemeMusic(themeId) {
  if (!themeId) return;
  if (themeId !== currentThemeId) {
    currentThemeId = themeId;
    el.src = `levels/${themeId}.mp3`;
    el.currentTime = 0;
  }
  attemptPlay();
}

export function setMusicEnabled(enabled) {
  profile.music = enabled;
  if (enabled) attemptPlay();
  else el.pause();
}

export function unlockMusicOnFirstInteraction() {
  if (unlocked) return;
  unlocked = true;
  attemptPlay();
}
