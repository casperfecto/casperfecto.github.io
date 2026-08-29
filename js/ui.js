/* ============================= UI WIRING ============================= */
import { G } from './state.js';
import { profile, saveProfile, AVATARS } from './storage.js';
import { levelFromXP } from './leveling.js';
import { THEMES, THEME_ORDER } from './theme-registry.js';
import { Audio1 } from './audio.js';
import { svgIcon } from './icons.js';
import { resetTower } from './physics.js';
import { checkAchievements } from './achievements.js';
import { on } from './utils.js';

export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  // el chip de perfil + monedas solo tiene sentido en el menú principal --
  // en mapas/perfil/pausa/etc se ocultan para no encimarse con esas pantallas
  const topbar = document.getElementById('topbar-menu');
  if (topbar) topbar.classList.toggle('hidden', id !== 'screen-menu');
}

export function updateTopbar() {
  document.getElementById('coin-count').textContent = profile.coins;
  const li = levelFromXP(profile.xp);
  document.getElementById('lvl-badge').textContent = li.level;
  document.getElementById('xp-mini').textContent = li.into + '/' + li.need;
  document.getElementById('topbar-username').textContent = profile.username || 'Usuario';
  document.getElementById('topbar-avatar').src = AVATARS[((profile.avatar % AVATARS.length) + AVATARS.length) % AVATARS.length];
  const best = profile.best[profile.selectedTheme];
  document.getElementById('best-hint').textContent = best && best.score > 0 ? 'Mejor puntaje aquí: ' + best.score : 'Toca la pantalla para soltar el bloque';
}

export function goMenu() {
  G.mode = 'demo';
  document.getElementById('topbar-menu').classList.remove('hidden');
  document.getElementById('hud').classList.add('hidden');
  resetTower(THEMES[profile.selectedTheme], true);
  G.demoTimer = 0.9;
  updateTopbar();
  showScreen('screen-menu');
}
export function goMaps() {
  renderMaps();
  showScreen('screen-maps');
}
export function goShop() {
  showScreen('screen-shop');
}
export function startGame() {
  G.mode = 'playing';
  document.getElementById('topbar-menu').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('hud-combo').classList.remove('show');
  resetTower(THEMES[profile.selectedTheme], false);
  document.getElementById('hud-score-num').textContent = '0';
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const hint = document.getElementById('tap-hint');
  hint.style.opacity = '1';
  setTimeout(() => { hint.style.transition = 'opacity .6s'; hint.style.opacity = '0'; }, 1800);
}

export function renderMaps() {
  const list = document.getElementById('maps-list');
  list.innerHTML = '';
  THEME_ORDER.forEach(id => {
    const th = THEMES[id];
    const unlocked = profile.unlocked.includes(id);
    const selected = profile.selectedTheme === id;
    const best = profile.best[id];
    const card = document.createElement('div');
    card.className = 'map-card' + (selected ? ' selected' : '');
    card.dataset.theme = id;
    card.style.backgroundColor = th.skyStops[0].bottom;
    card.style.backgroundImage = `url('levels/${id}.png')`;

    let lockMarkup;
    if (selected) lockMarkup = `<span class="check-chip">${svgIcon('check', 12)} EN USO</span>`;
    else if (unlocked) lockMarkup = `<span class="check-chip" style="background:rgba(255,255,255,.85);color:#333;">ELEGIR</span>`;
    else if (th.unlock.type === 'level') lockMarkup = `<span class="lock-chip">${svgIcon('lock', 12)} Nivel ${th.unlock.level}</span>`;
    else if (th.unlock.type === 'coins') lockMarkup = `<span class="lock-chip">${svgIcon('lock', 12)} <img class="coin-icon" src="moneda.png" alt="monedas"> ${th.unlock.cost}</span>`;
    else if (th.unlock.type === 'levelCoins') lockMarkup = `<span class="lock-chip">${svgIcon('lock', 12)} Nivel ${th.unlock.level} · <img class="coin-icon" src="moneda.png" alt="monedas"> ${th.unlock.cost}</span>`;
    else lockMarkup = `<span class="lock-chip">${svgIcon('lock', 12)} Llega al espacio</span>`;

    card.innerHTML = `
      <div class="mc-info">
        <div>
          <div class="mc-name">${th.icon} ${th.name}</div>
          <div class="mc-best">${best.score > 0 ? 'Récord: ' + best.score : 'Sin jugar aún'}</div>
        </div>
      </div>
      <div class="mc-lock">${lockMarkup}</div>`;

    card.addEventListener('click', () => {
      Audio1.click();
      if (unlocked) {
        profile.selectedTheme = id; saveProfile();
        G.theme = THEMES[id]; resetTower(THEMES[id], true); G.demoTimer = 0.9;
        updateTopbar(); renderMaps();
      } else if (th.unlock.type === 'level') {
        const li = levelFromXP(profile.xp);
        if (li.level >= th.unlock.level) {
          profile.unlocked.push(id); profile.selectedTheme = id; saveProfile();
          Audio1.unlock(); toast('¡' + th.name + ' desbloqueado!', 'sparkle');
          resetTower(THEMES[id], true); updateTopbar(); renderMaps(); checkAchievements();
        } else {
          toast('Necesitas subir a nivel ' + th.unlock.level, 'lock');
        }
      } else if (th.unlock.type === 'coins') {
        if (profile.coins >= th.unlock.cost) {
          profile.coins -= th.unlock.cost; profile.unlocked.push(id); profile.selectedTheme = id; saveProfile();
          Audio1.unlock(); toast('¡' + th.name + ' desbloqueado!', 'sparkle');
          resetTower(THEMES[id], true); updateTopbar(); renderMaps(); checkAchievements();
        } else {
          toast('Necesitas ' + th.unlock.cost + ' monedas para desbloquear', 'lock');
        }
      } else if (th.unlock.type === 'levelCoins') {
        const li = levelFromXP(profile.xp);
        if (li.level < th.unlock.level) {
          toast('Necesitas ser nivel ' + th.unlock.level + ' para desbloquear', 'lock');
        } else if (profile.coins < th.unlock.cost) {
          toast('Necesitas ' + th.unlock.cost + ' monedas para desbloquear', 'lock');
        } else {
          profile.coins -= th.unlock.cost; profile.unlocked.push(id); profile.selectedTheme = id; saveProfile();
          Audio1.unlock(); toast('¡' + th.name + ' desbloqueado!', 'sparkle');
          resetTower(THEMES[id], true); updateTopbar(); renderMaps(); checkAchievements();
        }
      } else if (th.unlock.type === 'special') {
        toast('Llega hasta el espacio en cualquier otro mapa para desbloquear Marte', 'rocket');
      }
    });
    list.appendChild(card);
  });
}

export function showLevelUp(level) {
  const el = document.getElementById('levelup-toast');
  document.getElementById('lu-level').textContent = '¡NIVEL ' + level + '!';
  document.getElementById('lu-sub').textContent = 'Sigue apilando para más';
  el.classList.add('show');
  Audio1.levelup();
  setTimeout(() => el.classList.remove('show'), 1800);
}
export function toast(msg, iconName) {
  const el = document.getElementById('toast');
  el.innerHTML = (iconName ? `<span class="toast-icon">${svgIcon(iconName, 14)}</span>` : '') + msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

/* ---- button wiring ---- */
on('btn-play', 'click', () => { Audio1.click(); startGame(); });
on('btn-maps', 'click', () => { Audio1.click(); goMaps(); });
on('btn-maps-back', 'click', () => { Audio1.click(); goMenu(); });
on('coin-pill', 'click', () => { Audio1.click(); goShop(); });
on('btn-shop-close', 'click', () => { Audio1.click(); goMenu(); });
document.querySelectorAll('.shop-buy-btn').forEach(btn => {
  // sin lógica de compra todavía -- solo un aviso amistoso, nada se cobra ni se acredita
  btn.addEventListener('click', () => { Audio1.click(); toast('La tienda estará disponible muy pronto', 'sparkle'); });
});
on('btn-pause', 'click', () => {
  if (G.mode !== 'playing') return;
  G.mode = 'paused'; showScreen('screen-pause');
});
on('btn-resume', 'click', () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  G.mode = 'playing';
});
on('btn-restart-pause', 'click', () => { Audio1.click(); startGame(); });
on('btn-menu-pause', 'click', () => { Audio1.click(); goMenu(); });
on('btn-retry', 'click', () => { Audio1.click(); startGame(); });
on('btn-go-maps', 'click', () => { Audio1.click(); goMaps(); });
on('btn-go-menu', 'click', () => { Audio1.click(); goMenu(); });

/* ---- static icon injection (buttons defined in index.html keep plain text labels
   in the markup for no-JS/SEO fallback; here we swap in the SVG glyphs) ---- */
function paintIcon(id, name, size) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = svgIcon(name, size || 18);
}
paintIcon('icon-play', 'play');
paintIcon('icon-maps', 'map');
paintIcon('icon-maps-back', 'close');
paintIcon('icon-pause', 'pause');
paintIcon('icon-resume', 'resume');
paintIcon('icon-restart-pause', 'restart');
paintIcon('icon-menu-pause', 'home');
paintIcon('icon-retry', 'restart');
paintIcon('icon-go-maps', 'map');
paintIcon('icon-go-menu', 'home');
paintIcon('icon-record', 'trophy', 14);
paintIcon('icon-shop-close', 'close', 16);