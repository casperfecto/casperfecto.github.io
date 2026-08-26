/* ============================= CANVAS SETUP ============================= */
export const appEl = document.getElementById('app');
export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');

export const size = { CW: 0, CH: 0, DPR: 1 };

export function resize() {
  const r = appEl.getBoundingClientRect();
  size.CW = r.width; size.CH = r.height; size.DPR = Math.min(window.devicePixelRatio || 1, 2.5);
  canvas.width = Math.round(size.CW * size.DPR); canvas.height = Math.round(size.CH * size.DPR);
  canvas.style.width = size.CW + 'px'; canvas.style.height = size.CH + 'px';
  ctx.setTransform(size.DPR, 0, 0, size.DPR, 0, 0);
}
window.addEventListener('resize', resize);
resize();
