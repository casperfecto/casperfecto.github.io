/* ============================= PROFILE UI ============================= */
import { profile, saveProfile, AVATARS } from './storage.js';
import { levelFromXP } from './leveling.js';
import { svgIcon } from './icons.js';
import { showScreen, updateTopbar } from './ui.js';
import { Audio1 } from './audio.js';

/* logros: por ahora es solo una vitrina visual, sin lógica de desbloqueo
   -- cuando se implemente el tracking real, esta lista pasa a tener un
   campo `unlocked` por logro y `renderAchievements` deja de pintarlos
   siempre como bloqueados */
const ACHIEVEMENTS = [
  { icon: 'play', name: 'Primeros pasos' },
  { icon: 'sparkle', name: 'Racha perfecta' },
  { icon: 'building', name: 'Torre alta' },
  { icon: 'map', name: 'Coleccionista' },
  { icon: 'rocket', name: 'Rumbo al espacio' },
  { icon: 'planet', name: 'Máxima altura' },
  { icon: 'star', name: 'Ahorrador' },
  { icon: 'trophy', name: 'Maestro constructor' },
  { icon: 'castle', name: 'Explorador total' }
];

let previousScreenId = 'screen-menu';

function avatarSrc(i) { return AVATARS[((i % AVATARS.length) + AVATARS.length) % AVATARS.length]; }

function refreshProfileScreen() {
  const li = levelFromXP(profile.xp);
  document.getElementById('profile-avatar-big').src = avatarSrc(profile.avatar);
  document.getElementById('profile-lvl-badge').textContent = li.level;
  document.getElementById('profile-level-num').textContent = li.level;
  document.getElementById('profile-xp-label').textContent = li.into + '/' + li.need + ' XP';
  const fill = document.getElementById('profile-xp-fill');
  fill.style.width = Math.round(100 * li.into / li.need) + '%';
  document.getElementById('username-input').value = profile.username || 'Usuario';
  document.querySelectorAll('.avatar-option').forEach(btn => {
    btn.classList.toggle('selected', Number(btn.dataset.avatar) === profile.avatar);
  });
  document.getElementById('toggle-sfx').checked = profile.sound;
  document.getElementById('toggle-music').checked = profile.music;
}

function renderAchievements() {
  const grid = document.getElementById('achievements-grid');
  if (grid.childElementCount) return; // se arma una sola vez
  grid.innerHTML = ACHIEVEMENTS.map(a => `
    <div class="achievement-card">
      <span class="achievement-lock">${svgIcon('lock', 9)}</span>
      <div class="achievement-icon-wrap">${svgIcon(a.icon, 20)}</div>
      <div class="achievement-name">${a.name}</div>
    </div>
  `).join('');
}

export function openProfile() {
  const active = document.querySelector('.screen.active');
  if (active && active.id !== 'screen-profile') previousScreenId = active.id;
  refreshProfileScreen();
  renderAchievements();
  showScreen('screen-profile');
}
function closeProfile() {
  showScreen(previousScreenId);
}

document.getElementById('profile-chip').addEventListener('click', () => { Audio1.click(); openProfile(); });
document.getElementById('btn-profile-close').addEventListener('click', () => { Audio1.click(); closeProfile(); });

const usernameInput = document.getElementById('username-input');
function commitUsername() {
  const v = usernameInput.value.trim().slice(0, 16) || 'Usuario';
  usernameInput.value = v;
  if (v !== profile.username) { profile.username = v; saveProfile(); updateTopbar(); }
}
usernameInput.addEventListener('change', commitUsername);
usernameInput.addEventListener('blur', commitUsername);
usernameInput.addEventListener('keydown', e => { if (e.key === 'Enter') usernameInput.blur(); });

document.querySelectorAll('.avatar-option').forEach(btn => {
  btn.addEventListener('click', () => {
    const idx = Number(btn.dataset.avatar);
    if (idx === profile.avatar) return;
    profile.avatar = idx; saveProfile();
    Audio1.click();
    refreshProfileScreen();
    updateTopbar();
  });
});

document.getElementById('toggle-sfx').addEventListener('change', e => {
  profile.sound = e.target.checked; saveProfile();
  if (profile.sound) Audio1.click();
});
document.getElementById('toggle-music').addEventListener('change', e => {
  // La música de fondo todavía no está implementada en el juego -- este
  // toggle solo guarda la preferencia para cuando se agregue el reproductor.
  profile.music = e.target.checked; saveProfile();
});

function paintIcon(id, name, size) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = svgIcon(name, size || 16);
}
paintIcon('icon-profile-close', 'close', 16);
paintIcon('icon-edit-username', 'edit', 13);
paintIcon('icon-avatar-section', 'camera', 14);
paintIcon('icon-prefs-section', 'gear', 14);
paintIcon('icon-achievements-section', 'trophy', 14);
paintIcon('icon-sfx', 'speaker', 15);
paintIcon('icon-music', 'musicnote', 15);
