/* ============================= ACHIEVEMENTS ============================= */
import { profile, saveProfile } from './storage.js';
import { levelFromXP } from './leveling.js';
import { THEME_ORDER } from './theme-registry.js';
import { svgIcon } from './icons.js';

export const ACHIEVEMENTS = [
  {
    id: 'first-steps', name: 'Primeros pasos', icon: 'play',
    desc: 'Juega el nivel de la Ciudad y consigue al menos 100 puntos en una partida.',
    check: p => !!(p.best.city && p.best.city.score >= 100)
  },
  {
    id: 'perfect-tower', name: 'Torre perfecta', icon: 'sparkle',
    desc: 'Construye una torre en cualquier nivel hasta llegar al espacio sin cometer un solo error.',
    check: p => !!p.perfectSpaceRun
  },
  {
    id: 'collector', name: 'Coleccionista', icon: 'map',
    desc: 'Desbloquea todos los mapas disponibles.',
    check: p => THEME_ORDER.every(id => p.unlocked.includes(id))
  },
  {
    id: 'to-space', name: 'Rumbo al espacio', icon: 'rocket',
    desc: 'Llega al espacio en cualquier nivel.',
    check: p => !!p.reachedSpace
  },
  {
    id: 'builder-master', name: 'Maestro de la construcción', icon: 'building',
    desc: 'Alcanza el nivel 100.',
    check: p => levelFromXP(p.xp).level >= 100
  },
  {
    id: 'saver', name: 'Ahorrador', icon: 'star',
    desc: 'Consigue 10.000 monedas en total (sumando todo lo ganado).',
    check: p => (p.totalCoinsEarned || 0) >= 10000
  },
  {
    id: 'artist', name: 'Artista', icon: 'camera',
    desc: 'Cambia tu foto de perfil y tu nombre de usuario.',
    check: p => !!p.everChangedAvatar && !!p.everChangedUsername
  },
  {
    id: 'legend', name: 'Soy leyenda', icon: 'trophy',
    desc: 'Consigue un puntaje mínimo de 1500 puntos en cada uno de los niveles.',
    check: p => THEME_ORDER.every(id => p.best[id] && p.best[id].score >= 1500)
  },
  {
    id: 'platinum', name: 'Platino', icon: 'crown',
    desc: 'Desbloquea el resto de los trofeos.',
    check: p => ACHIEVEMENTS.filter(a => a.id !== 'platinum').every(a => p.achievements[a.id])
  }
];

export function isUnlocked(id) { return !!profile.achievements[id]; }

const queue = [];
let showing = false;

export function checkAchievements() {
  let changed = false;
  ACHIEVEMENTS.forEach(a => {
    if (isUnlocked(a.id)) return;
    if (a.check(profile)) {
      profile.achievements[a.id] = true;
      changed = true;
      queue.push(a);
    }
  });
  if (changed) { saveProfile(); processQueue(); }
}

function processQueue() {
  if (showing || !queue.length) return;
  const a = queue.shift();
  const el = document.getElementById('trophy-toast');
  if (!el) return; // pantalla aún no lista (no debería pasar en la práctica)
  showing = true;
  el.innerHTML = `
    <div class="trophy-toast-shine"></div>
    <div class="trophy-toast-icon">${svgIcon(a.icon, 26)}</div>
    <div class="trophy-toast-text">
      <div class="trophy-toast-label">Logro desbloqueado</div>
      <div class="trophy-toast-name">${a.name}</div>
    </div>
  `;
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => { showing = false; processQueue(); }, 500);
  }, 3400);
}
