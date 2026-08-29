/* ============================= PROFILE UI ============================= */
import { profile, saveProfile, AVATARS, AVATAR_UNLOCK } from './storage.js';
import { levelFromXP } from './leveling.js';
import { svgIcon } from './icons.js';
import { showScreen, updateTopbar, toast } from './ui.js';
import { Audio1 } from './audio.js';
import { setMusicEnabled } from './music.js';
import { ACHIEVEMENTS, isUnlocked, checkAchievements, achievementImgSrc } from './achievements.js';

let previousScreenId = 'screen-menu';

function avatarSrc(i) { return AVATARS[((i % AVATARS.length) + AVATARS.length) % AVATARS.length]; }

/* ---- pantalla de perfil: cabecera, nombre, XP ---- */
function refreshProfileHeader() {
  const li = levelFromXP(profile.xp);
  document.getElementById('profile-avatar-big').src = avatarSrc(profile.avatar);
  document.getElementById('profile-lvl-badge').textContent = li.level;
  document.getElementById('profile-level-num').textContent = li.level;
  document.getElementById('profile-xp-label').textContent = li.into + '/' + li.need + ' XP';
  document.getElementById('profile-xp-fill').style.width = Math.round(100 * li.into / li.need) + '%';
  document.getElementById('username-input').value = profile.username || 'Usuario';
  document.getElementById('toggle-sfx').checked = profile.sound;
  document.getElementById('toggle-music').checked = profile.music;
}

/* ---- carrusel de fotos de perfil: mismas reglas de desbloqueo que los
   mapas (gratis / monedas / nivel / marte / nivel+monedas), en carrusel
   horizontal para que no desborde con 9 opciones ---- */
function renderAvatarPicker() {
  const wrap = document.getElementById('avatar-picker');
  wrap.innerHTML = '';
  AVATARS.forEach((src, i) => {
    const unlocked = profile.unlockedAvatars.includes(i);
    const selected = profile.avatar === i;
    const rule = AVATAR_UNLOCK[i];
    const btn = document.createElement('button');
    btn.className = 'avatar-slot' + (selected ? ' selected' : '') + (unlocked ? '' : ' locked');
    let badge = '';
    if (!unlocked) {
      if (rule.type === 'coins') badge = `<span class="avatar-lock-chip">${svgIcon('lock', 10)} <img class="coin-icon" src="moneda.png" alt="monedas">${rule.cost}</span>`;
      else if (rule.type === 'level') badge = `<span class="avatar-lock-chip">${svgIcon('lock', 10)} Nv.${rule.level}</span>`;
      else if (rule.type === 'space') badge = `<span class="avatar-lock-chip">${svgIcon('lock', 10)} Marte</span>`;
      else if (rule.type === 'levelCoins') badge = `<span class="avatar-lock-chip">${svgIcon('lock', 10)} Nv.${rule.level}+<img class="coin-icon" src="moneda.png" alt="monedas">${rule.cost}</span>`;
    } else if (selected) {
      badge = `<span class="avatar-lock-chip selected-chip">${svgIcon('check', 10)}</span>`;
    }
    btn.innerHTML = `
      <img src="${src}" alt="Avatar ${i + 1}" onerror="this.onerror=null;this.src=&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23C9B6FF'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23fff'/%3E%3Cpath d='M50 62c-22 0-34 14-34 30h68c0-16-12-30-34-30Z' fill='%23fff'/%3E%3C/svg%3E&quot;">
      ${!unlocked ? `<span class="avatar-slot-veil">${svgIcon('lock', 16)}</span>` : ''}
      ${badge}`;
    btn.addEventListener('click', () => onAvatarClick(i, unlocked, rule));
    wrap.appendChild(btn);
  });
}

function onAvatarClick(i, unlocked, rule) {
  Audio1.click();
  if (unlocked) {
    selectAvatar(i);
    return;
  }
  const li = levelFromXP(profile.xp);
  if (rule.type === 'coins') {
    if (profile.coins < rule.cost) { toast('Necesitas ' + rule.cost + ' monedas para desbloquear', 'lock'); return; }
    profile.coins -= rule.cost;
  } else if (rule.type === 'level') {
    if (li.level < rule.level) { toast('Necesitas ser nivel ' + rule.level, 'lock'); return; }
  } else if (rule.type === 'space') {
    if (!profile.unlocked.includes('space')) { toast('Primero desbloqueá Marte llegando al espacio', 'lock'); return; }
  } else if (rule.type === 'levelCoins') {
    if (li.level < rule.level) { toast('Necesitas ser nivel ' + rule.level, 'lock'); return; }
    if (profile.coins < rule.cost) { toast('Necesitas ' + rule.cost + ' monedas para desbloquear', 'lock'); return; }
    profile.coins -= rule.cost;
  }
  profile.unlockedAvatars.push(i);
  saveProfile();
  Audio1.unlock();
  toast('¡Nueva foto de perfil desbloqueada!', 'sparkle');
  selectAvatar(i);
  checkAchievements();
}

function selectAvatar(i) {
  const isNew = profile.avatar !== i;
  profile.avatar = i;
  if (isNew) profile.everChangedAvatar = true;
  saveProfile();
  refreshProfileHeader();
  renderAvatarPicker();
  updateTopbar();
  if (isNew) checkAchievements();
}

/* ---- logros: tarjetas que se voltean al tocarlas para ver la descripción.
   El frente es la imagen del trofeo (el nombre ya viene dibujado en el
   arte); si la imagen todavía no existe, se ve un ícono + nombre de
   respaldo en su lugar para que nunca se vea roto --- */
function renderAchievements() {
  const grid = document.getElementById('achievements-grid');
  grid.innerHTML = ACHIEVEMENTS.map(a => {
    const unlocked = isUnlocked(a.id);
    return `
    <div class="achievement-card${unlocked ? ' unlocked' : ''}" data-id="${a.id}">
      <div class="achievement-card-inner">
        <div class="achievement-face achievement-front">
          ${!unlocked ? `<span class="achievement-lock">${svgIcon('lock', 9)}</span>` : ''}
          <img class="achievement-img" src="${achievementImgSrc(a.id)}" alt="${a.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="achievement-img-fallback">${svgIcon(a.icon, 22)}<span>${a.name}</span></div>
        </div>
        <div class="achievement-face achievement-back">
          <div class="achievement-back-desc">${a.desc}</div>
        </div>
      </div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.achievement-card').forEach(card => {
    card.addEventListener('click', () => { Audio1.click(); card.classList.toggle('flipped'); });
  });
}

export function openProfile() {
  const active = document.querySelector('.screen.active');
  if (active && active.id !== 'screen-profile') previousScreenId = active.id;
  refreshProfileHeader();
  renderAvatarPicker();
  renderAchievements();
  showScreen('screen-profile');
}
function closeProfile() { showScreen(previousScreenId); }

document.getElementById('profile-chip').addEventListener('click', () => { Audio1.click(); openProfile(); });
document.getElementById('btn-profile-close').addEventListener('click', () => { Audio1.click(); closeProfile(); });

const usernameInput = document.getElementById('username-input');
function commitUsername() {
  const v = usernameInput.value.trim().slice(0, 16) || 'Usuario';
  usernameInput.value = v;
  if (v !== profile.username && v !== 'Usuario') {
    profile.username = v; profile.everChangedUsername = true; saveProfile(); updateTopbar(); checkAchievements();
  } else if (v !== profile.username) {
    profile.username = v; saveProfile(); updateTopbar();
  }
}
usernameInput.addEventListener('change', commitUsername);
usernameInput.addEventListener('blur', commitUsername);
usernameInput.addEventListener('keydown', e => { if (e.key === 'Enter') usernameInput.blur(); });

document.getElementById('toggle-sfx').addEventListener('change', e => {
  profile.sound = e.target.checked; saveProfile();
  if (profile.sound) Audio1.click();
});
document.getElementById('toggle-music').addEventListener('change', e => {
  setMusicEnabled(e.target.checked);
  saveProfile();
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