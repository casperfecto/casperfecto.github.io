/* ============================= UTILS ============================= */
export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function hexToRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}
export function lerpColor(c1, c2, t) {
  const a = hexToRgb(c1), b = hexToRgb(c2);
  return rgbToHex(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
}
// amt>0 lighten toward white, amt<0 darken toward black
export function shade(hex, amt) {
  const c = hexToRgb(hex);
  if (amt >= 0) return rgbToHex(lerp(c[0], 255, amt), lerp(c[1], 255, amt), lerp(c[2], 255, amt));
  return rgbToHex(lerp(c[0], 0, -amt), lerp(c[1], 0, -amt), lerp(c[2], 0, -amt));
}
export function blockPalette(base) {
  return { top: shade(base, 0.38), front: base, side: shade(base, -0.30), edge: shade(base, -0.5) };
}
export function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

/* interpolate a stop-list keyed by numeric key 'k' */
export function sampleStops(stops, k, fields) {
  if (k <= stops[0].k) return stops[0];
  if (k >= stops[stops.length - 1].k) return stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (k >= a.k && k <= b.k) {
      const t = (k - a.k) / (b.k - a.k);
      const out = {};
      fields.forEach(f => { out[f] = (typeof a[f] === 'string') ? lerpColor(a[f], b[f], t) : lerp(a[f], b[f], t); });
      return out;
    }
  }
  return stops[stops.length - 1];
}

/* conecta un evento a un elemento por id sin reventar el resto del juego si
   ese elemento no existe todavía en el HTML (por un archivo desactualizado,
   un typo, etc.) -- en vez de tirar el módulo entero, simplemente esa
   conexión puntual queda sin hacer y el resto sigue funcionando */
export function on(id, event, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, handler);
  else console.warn('[Casi Perfecto] no se encontró #' + id + ' para conectar "' + event + '"');
  return el;
}