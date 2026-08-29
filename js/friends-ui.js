/* ============================= FRIENDS ============================= */
/* Sistema de amigos basado en códigos, sin servidor: cada quien genera su
   propio código (nombre + foto + nivel, codificados en texto), lo comparte
   por fuera del juego (WhatsApp, Discord, lo que sea) y quien lo recibe lo
   pega acá para agregarlo a su lista. No es sincronización en vivo -- el
   nivel del amigo se actualiza recién la próxima vez que vuelva a compartir
   su código -- pero es un sistema real, no una maqueta vacía. */
import { profile, saveProfile, AVATARS, AVATAR_FALLBACK } from './storage.js';
import { levelFromXP } from './leveling.js';
import { svgIcon } from './icons.js';
import { showScreen, toast } from './ui.js';
import { Audio1 } from './audio.js';

/* --- codificación del código de amigo: base64 "url-safe" propio (usa '.'
   y '_' en vez de '+' y '/') para poder usar '-' únicamente como separador
   decorativo de grupos, sin que se confunda con datos reales al decodificar --- */
function b64Encode(str) {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, '.').replace(/\//g, '_').replace(/=+$/, '');
}
function b64Decode(str) {
  let b64 = str.replace(/\./g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return decodeURIComponent(escape(atob(b64)));
}

function ensureFriendId() {
  if (!profile.friendId) {
    profile.friendId = Math.random().toString(36).slice(2, 7).toUpperCase() + Date.now().toString(36).slice(-3).toUpperCase();
    saveProfile();
  }
  return profile.friendId;
}

/* payload compacto separado por "~" (en vez de JSON) para que el código
   final sea bastante más corto -- se copia y pega entero de un botón, así
   que no hace falta que sea corto para tipear a mano, pero sí para que se
   vea prolijo dentro de la cajita */
function myFriendCode() {
  ensureFriendId();
  const safeName = (profile.username || 'Usuario').replace(/~/g, '');
  const payload = [profile.friendId, profile.avatar || 0, Math.round(profile.xp || 0), safeName].join('~');
  const raw = b64Encode(payload);
  return 'CP-' + (raw.match(/.{1,4}/g) || [raw]).join('-');
}

function addFriendFromCode(rawCode) {
  ensureFriendId();
  const cleaned = rawCode.trim().replace(/^cp-?/i, '').replace(/-/g, '').replace(/\s+/g, '');
  if (!cleaned) return { ok: false, reason: 'empty' };
  let parts;
  try { parts = b64Decode(cleaned).split('~'); } catch (e) { return { ok: false, reason: 'invalid' }; }
  if (parts.length < 4) return { ok: false, reason: 'invalid' };
  const [id, avatarStr, xpStr, ...nameParts] = parts;
  const username = nameParts.join('~');
  if (!id || !username) return { ok: false, reason: 'invalid' };
  if (id === profile.friendId) return { ok: false, reason: 'self' };
  const idx = profile.friends.findIndex(f => f.id === id);
  const friend = { id, username: username.slice(0, 16) || 'Usuario', avatar: Number(avatarStr) || 0, xp: Number(xpStr) || 0 };
  const wasUpdate = idx >= 0;
  if (wasUpdate) profile.friends[idx] = friend; else profile.friends.push(friend);
  saveProfile();
  return { ok: true, updated: wasUpdate, friend };
}

function removeFriend(id) {
  profile.friends = profile.friends.filter(f => f.id !== id);
  saveProfile();
}

function getRankedList() {
  ensureFriendId();
  const me = { id: profile.friendId, username: profile.username || 'Usuario', avatar: profile.avatar || 0, xp: profile.xp || 0, isMe: true };
  const all = [me, ...profile.friends.map(f => Object.assign({}, f, { isMe: false }))];
  all.forEach(p => { p.level = levelFromXP(p.xp).level; });
  all.sort((a, b) => b.xp - a.xp);
  return all;
}

function avatarSrc(i) { return AVATARS[((i % AVATARS.length) + AVATARS.length) % AVATARS.length]; }

const TROPHY_IMG = { 1: 'trofeo-oro.png', 2: 'trofeo-plata.png', 3: 'trofeo-bronce.png' };
const RANK_CLASS = { 1: 'podium-gold', 2: 'podium-silver', 3: 'podium-bronze' };

function friendCardHtml(person, rank) {
  const isPodium = rank <= 3;
  const avatarImg = `<img class="friend-avatar" src="${avatarSrc(person.avatar)}" alt="" onerror="this.onerror=null;this.src='${AVATAR_FALLBACK}';">`;
  const removeBtn = person.isMe ? '' : `<button class="friend-remove-btn" data-id="${person.id}" title="Quitar amigo">${svgIcon('close', 10)}</button>`;
  const nameHtml = `${person.username}${person.isMe ? '<span class="friend-you-tag">Vos</span>' : ''}`;

  if (isPodium) {
    return `
    <div class="friend-card podium ${RANK_CLASS[rank]}${person.isMe ? ' friend-card-me' : ''}">
      <div class="podium-trophy"><img src="${TROPHY_IMG[rank]}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="podium-trophy-fallback">${svgIcon('trophy', 20)}</div></div>
      <div class="friend-avatar-wrap podium-avatar-wrap">${avatarImg}<span class="podium-rank-badge">#${rank}</span></div>
      <div class="friend-info">
        <div class="friend-name">${nameHtml}</div>
        <div class="friend-level">Nivel ${person.level}</div>
      </div>
      ${removeBtn}
    </div>`;
  }
  return `
    <div class="friend-card${person.isMe ? ' friend-card-me' : ''}">
      <div class="friend-rank-badge">#${rank}</div>
      <div class="friend-avatar-wrap">${avatarImg}</div>
      <div class="friend-info">
        <div class="friend-name">${nameHtml}</div>
        <div class="friend-level">Nivel ${person.level}</div>
      </div>
      ${removeBtn}
    </div>`;
}

function renderFriends() {
  document.getElementById('my-friend-code').textContent = myFriendCode();
  const list = document.getElementById('friends-list');
  const ranked = getRankedList();
  list.innerHTML = ranked.map((p, i) => friendCardHtml(p, i + 1)).join('');
  list.querySelectorAll('.friend-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      Audio1.click();
      removeFriend(btn.dataset.id);
      renderFriends();
    });
  });
}

export function openFriends() {
  renderFriends();
  showScreen('screen-friends');
}
function closeFriends() { showScreen('screen-menu'); }

document.getElementById('btn-friends').addEventListener('click', () => { Audio1.click(); openFriends(); });
document.getElementById('btn-friends-close').addEventListener('click', () => { Audio1.click(); closeFriends(); });

document.getElementById('btn-copy-code').addEventListener('click', async () => {
  Audio1.click();
  const code = myFriendCode();
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(code);
    else throw new Error('no clipboard api');
    toast('¡Código copiado!', 'copy');
  } catch (e) {
    toast('Mantené tocado el código para copiarlo', 'copy');
  }
});

const friendInput = document.getElementById('friend-code-input');
document.getElementById('btn-add-friend').addEventListener('click', () => {
  Audio1.click();
  const res = addFriendFromCode(friendInput.value);
  if (res.ok) {
    friendInput.value = '';
    Audio1.unlock();
    toast(res.updated ? '¡Progreso de tu amigo actualizado!' : '¡Amigo agregado!', 'people');
    renderFriends();
  } else if (res.reason === 'self') {
    toast('Ese es tu propio código 😊', 'lock');
  } else if (res.reason === 'empty') {
    toast('Pegá primero el código de tu amigo', 'lock');
  } else {
    toast('Ese código no es válido', 'lock');
  }
});
friendInput.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('btn-add-friend').click(); });

function paintIcon(id, name, size) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = svgIcon(name, size || 16);
}
paintIcon('icon-friends', 'people');
paintIcon('icon-friends-close', 'close', 16);
paintIcon('icon-copy-code', 'copy', 14);