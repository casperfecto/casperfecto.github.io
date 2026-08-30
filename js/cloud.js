/* ============================= CLOUD SYNC (Firebase) ============================= */
/* Cada jugador tiene una sesión anónima de Firebase (sin contraseñas ni
   registro visible para el usuario) que le da un UID estable en ese
   dispositivo/navegador. Ese UID es, a la vez, el "código de amigo" y el
   id del documento en Firestore donde se guarda su perfil público
   (nombre, foto, nivel/xp, monedas). Cuando agregás a alguien, en vez de
   guardar una foto fija de sus datos, te suscribís en tiempo real a su
   documento -- así que cuando esa persona cambia de nombre, de foto o
   sube de nivel, vos lo ves actualizado solo, sin hacer nada. */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, setDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { profile, setOnSaveHook } from './storage.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let myUid = null;
const readyCallbacks = [];
let pushTimer = null;

/* ---- identidad ---- */
export function getMyUid() { return myUid; }
export function onCloudReady(cb) {
  if (myUid) cb(myUid); else readyCallbacks.push(cb);
}

/* ---- publicar mi propio perfil (solo los campos que le interesan a mis
   amigos, no toda la partida guardada) ---- */
export async function pushMyProfile() {
  if (!myUid) return;
  try {
    await setDoc(doc(db, 'players', myUid), {
      username: profile.username || 'Usuario',
      avatar: Number(profile.avatar) || 0,
      xp: Math.round(profile.xp) || 0,
      coins: Math.round(profile.coins) || 0,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn('[Casi Perfecto] no se pudo sincronizar el perfil con la nube:', e.message);
  }
}

function schedulePush() {
  if (!myUid) return; // se sincroniza apenas la sesión esté lista (ver abajo)
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushMyProfile, 900);
}

/* ---- escuchar a un amigo en tiempo real -- varios llamadores pueden
   suscribirse al mismo uid, se comparte una única conexión con Firestore ---- */
const friendEntries = new Map(); // uid -> { unsub, callbacks:Set }

export function subscribeFriend(uid, callback) {
  let entry = friendEntries.get(uid);
  if (!entry) {
    const callbacks = new Set();
    const unsub = onSnapshot(doc(db, 'players', uid),
      snap => { const data = snap.exists() ? snap.data() : null; callbacks.forEach(cb => cb(data)); },
      err => console.warn('[Casi Perfecto] no se pudo escuchar a un amigo:', err.message)
    );
    entry = { unsub, callbacks };
    friendEntries.set(uid, entry);
  }
  entry.callbacks.add(callback);
}
export function unsubscribeFriend(uid, callback) {
  const entry = friendEntries.get(uid);
  if (!entry) return;
  entry.callbacks.delete(callback);
  if (entry.callbacks.size === 0) { entry.unsub(); friendEntries.delete(uid); }
}

/* ---- arranque: sesión anónima + enganchar el guardado local con la nube ---- */
export function initCloud() {
  setOnSaveHook(schedulePush);
  onAuthStateChanged(auth, user => {
    if (!user) return;
    myUid = user.uid;
    pushMyProfile();
    readyCallbacks.splice(0).forEach(cb => cb(myUid));
  });
  signInAnonymously(auth).catch(e => {
    console.warn('[Casi Perfecto] no se pudo iniciar sesión con Firebase (revisá firebase-config.js y que Anonymous esté habilitado):', e.message);
  });
}
