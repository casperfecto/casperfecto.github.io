/* ============================= FRIENDS ============================= */
/* Sistema de amigos en tiempo real sobre Firestore: tu código de amigo es
   directamente tu identidad de sesión (ver cloud.js). Agregar a alguien no
   guarda una foto fija de sus datos -- te suscribe a su documento en vivo,
   así que cuando esa persona cambia de nombre, de foto o sube de nivel, tu
   lista se actualiza sola. */
import { profile, saveProfile, AVATARS, AVATAR_FALLBACK } from './storage.js';
import { levelFromXP } from './leveling.js';
import { svgIcon } from './icons.js';
import { showScreen, toast } from './ui.js';
import { Audio1 } from './audio.js';
import { getMyUid, onCloudReady, subscribeFriend, unsubscribeFriend } from './cloud.js';

const friendData = {};     // uid -> { username, avatar, xp, coins } (lo último que llegó de Firestore)
const friendCallbacks = {}; // uid -> función callback registrada (para poder des-suscribir)

function avatarSrc(i) { return AVATARS[((i % AVATARS.length) + AVATARS.length) % AVATARS.length]; }
function isFriendsScreenActive() {
  const el = document.getElementById('screen-friends');
  return !!(el && el.classList.contains('active'));
}
function formatCode(uid) { return 'CP-' + (uid.match(/.{1,4}/g) || [uid]).join('-'); }
function parseCode(raw) { return String(raw).trim().replace(/^cp-?/i, '').replace(/-/g, '').replace(/\s+/g, ''); }

function subscribeToFriendUid(uid) {
  if (friendCallbacks[uid]) return;
  const cb = data => {
    friendData[uid] = data; // null si el documento no existe (todavía) o fue borrado
    if (isFriendsScreenActive()) renderFriends();
  };
  friendCallbacks[uid] = cb;
  subscribeFriend(uid, cb);
}
function unsubscribeFriendUid(uid) {
  const cb = friendCallbacks[uid];
  if (!cb) return;
  unsubscribeFriend(uid, cb);
  delete friendCallbacks[uid];
  delete friendData[uid];
}
function subscribeToStoredFriends() {
  profile.friends.forEach(f => subscribeToFriendUid(f.id));
}

function myFriendCode() {
  const uid = getMyUid();
  return uid ? formatCode(uid) : 'Conectando…';
}

function addFriendFromCode(rawCode) {
  const uid = getMyUid();
  if (!uid) return { ok: false, reason: 'notready' };
  const cleaned = parseCode(rawCode);
  if (!cleaned) return { ok: false, reason: 'empty' };
  if (cleaned === uid) return { ok: false, reason: 'self' };
  if (profile.friends.some(f => f.id === cleaned)) return { ok: false, reason: 'duplicate' };
  profile.friends.push({ id: cleaned });
  saveProfile();
  subscribeToFriendUid(cleaned);
  return { ok: true };
}

function removeFriendById(id) {
  profile.friends = profile.friends.filter(f => f.id !== id);
  saveProfile();
  unsubscribeFriendUid(id);
}

function getRankedList() {
  const me = { id: getMyUid() || 'me', username: profile.username || 'Usuario', avatar: profile.avatar || 0, xp: profile.xp || 0, isMe: true, loading: false };
  const others = profile.friends.map(f => {
    const d = friendData[f.id];
    return { id: f.id, username: d ? d.username : 'Conectando…', avatar: d ? d.avatar : 0, xp: d ? d.xp : 0, isMe: false, loading: !d };
  });
  const all = [me, ...others];
  all.forEach(p => { p.level = levelFromXP(p.xp).level; });
  all.sort((a, b) => b.xp - a.xp);
  return all;
}

const TROPHY_IMG = { 1: 'trofeo-oro.png', 2: 'trofeo-plata.png', 3: 'trofeo-bronce.png' };
const RANK_CLASS = { 1: 'podium-gold', 2: 'podium-silver', 3: 'podium-bronze' };

function friendCardHtml(person, rank) {
  const isPodium = rank <= 3;
  const avatarImg = `<img class="friend-avatar" src="${avatarSrc(person.avatar)}" alt="" onerror="this.onerror=null;this.src='${AVATAR_FALLBACK}';">`;
  const removeBtn = person.isMe ? '' : `<button class="friend-remove-btn" data-id="${person.id}" title="Quitar amigo">${svgIcon('close', 10)}</button>`;
  const nameHtml = `${person.username}${person.isMe ? '<span class="friend-you-tag">Vos</span>' : ''}`;
  const levelHtml = person.loading ? 'Sincronizando…' : `Nivel ${person.level}`;

  if (isPodium) {
    return `
    <div class="friend-card podium ${RANK_CLASS[rank]}${person.isMe ? ' friend-card-me' : ''}${person.loading ? ' friend-card-loading' : ''}">
      <div class="podium-trophy"><img src="${TROPHY_IMG[rank]}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="podium-trophy-fallback">${svgIcon('trophy', 20)}</div></div>
      <div class="friend-avatar-wrap podium-avatar-wrap">${avatarImg}<span class="podium-rank-badge">#${rank}</span></div>
      <div class="friend-info">
        <div class="friend-name">${nameHtml}</div>
        <div class="friend-level">${levelHtml}</div>
      </div>
      ${removeBtn}
    </div>`;
  }
  return `
    <div class="friend-card${person.isMe ? ' friend-card-me' : ''}${person.loading ? ' friend-card-loading' : ''}">
      <div class="friend-rank-badge">#${rank}</div>
      <div class="friend-avatar-wrap">${avatarImg}</div>
      <div class="friend-info">
        <div class="friend-name">${nameHtml}</div>
        <div class="friend-level">${levelHtml}</div>
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
    btn.addEventListener('click', () => { Audio1.click(); removeFriendById(btn.dataset.id); renderFriends(); });
  });
}

export function openFriends() {
  renderFriends();
  showScreen('screen-friends');
}
function closeFriends() { showScreen('screen-menu'); }

// apenas la sesión con Firebase esté lista, nos suscribimos a los amigos ya
// guardados localmente y refrescamos la pantalla si está abierta
onCloudReady(() => {
  subscribeToStoredFriends();
  if (isFriendsScreenActive()) renderFriends();
});

document.getElementById('btn-friends').addEventListener('click', () => { Audio1.click(); openFriends(); });
document.getElementById('btn-friends-close').addEventListener('click', () => { Audio1.click(); closeFriends(); });

document.getElementById('btn-copy-code').addEventListener('click', async () => {
  Audio1.click();
  const code = myFriendCode();
  if (!getMyUid()) { toast('Esperá un segundo, todavía nos estamos conectando', 'lock'); return; }
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
    toast('¡Amigo agregado!', 'people');
    renderFriends();
  } else if (res.reason === 'self') {
    toast('Ese es tu propio código 😊', 'lock');
  } else if (res.reason === 'empty') {
    toast('Pegá primero el código de tu amigo', 'lock');
  } else if (res.reason === 'duplicate') {
    toast('Ese amigo ya está en tu lista', 'lock');
  } else if (res.reason === 'notready') {
    toast('Esperá un segundo, todavía nos estamos conectando', 'lock');
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