/* ============================= LEVELS (XP) ============================= */
export function xpNeeded(level) { return Math.round(90 + (level - 1) * 55); }
export function levelFromXP(xp) {
  let level = 1, remain = xp;
  while (remain >= xpNeeded(level)) { remain -= xpNeeded(level); level++; }
  return { level, into: remain, need: xpNeeded(level) };
}
