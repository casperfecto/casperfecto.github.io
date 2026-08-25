/* ============================= STORAGE ============================= */
const SAVE_KEY = 'torrePerfectaSaveV1';

export function defaultProfile() {
  return {
    coins: 60, xp: 0, selectedTheme: 'city',
    unlocked: ['city'],
    best: {
      city: { score: 0, height: 0 },
      forest: { score: 0, height: 0 },
      space: { score: 0, height: 0 },
      candy: { score: 0, height: 0 },
      medieval: { score: 0, height: 0 }
    },
    sound: true, totalGames: 0, reachedSpace: false
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
