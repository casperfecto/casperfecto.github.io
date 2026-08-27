/* ============================= STORAGE ============================= */
const SAVE_KEY = 'torrePerfectaSaveV1';

/* rutas de las 9 fotos de perfil disponibles -- van en la raíz del proyecto,
   junto a index.html / moneda.png / logo.png. Simplemente reemplazá esos 9
   archivos por las imágenes reales (mismo nombre) y listo. */
export const AVATARS = ['avatar1.png', 'avatar2.png', 'avatar3.png', 'avatar4.png', 'avatar5.png', 'avatar6.png', 'avatar7.png', 'avatar8.png', 'avatar9.png'];
export const AVATAR_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23C9B6FF'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23fff'/%3E%3Cpath d='M50 62c-22 0-34 14-34 30h68c0-16-12-30-34-30Z' fill='%23fff'/%3E%3C/svg%3E";

/* condiciones de desbloqueo por avatar (mismo espíritu que el desbloqueo de
   mapas): las 3 primeras son gratis, 3 cuestan monedas, una pide nivel,
   otra pide haber desbloqueado Marte y la última pide nivel + monedas */
export const AVATAR_UNLOCK = [
  { type: 'free' },
  { type: 'free' },
  { type: 'free' },
  { type: 'coins', cost: 500 },
  { type: 'coins', cost: 500 },
  { type: 'coins', cost: 500 },
  { type: 'level', level: 10 },
  { type: 'space' },
  { type: 'levelCoins', level: 20, cost: 500 }
];

export function defaultProfile() {
  return {
    coins: 60, xp: 0, selectedTheme: 'city',
    unlocked: ['city'],
    best: {
      city: { score: 0, height: 0 },
      forest: { score: 0, height: 0 },
      space: { score: 0, height: 0 },
      candy: { score: 0, height: 0 },
      medieval: { score: 0, height: 0 },
      farm: { score: 0, height: 0 }
    },
    sound: true, music: true, totalGames: 0, reachedSpace: false,
    username: 'Usuario', avatar: 0, unlockedAvatars: [0, 1, 2],
    totalCoinsEarned: 0, everChangedAvatar: false, everChangedUsername: false,
    perfectSpaceRun: false, achievements: {}
  };
}
function loadProfile() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultProfile();
    const p = JSON.parse(raw);
    const d = defaultProfile();
    return Object.assign(d, p, { best: Object.assign(d.best, p.best || {}) });
  } catch (e) { return defaultProfile(); }
}
export const profile = loadProfile();
export function saveProfile() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(profile)); } catch (e) {}
}
