/* ============================= ICONS (SVG) ============================= */
/* Todos los iconos usan currentColor / fill fijo y viven como markup inline,
   así se pueden colorear y animar por CSS sin depender de fuentes emoji. */

const RAW = {
  play: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>`,
  map: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><rect x="6" y="4" width="4.5" height="16" rx="1.4"/><rect x="13.5" y="4" width="4.5" height="16" rx="1.4"/></svg>`,
  resume: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>`,
  restart: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11A8 8 0 1 0 18.3 16"/><path d="M20 5v6h-6"/></svg>`,
  home: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M12 3 3 10.5V21h6v-6h6v6h6V10.5z"/></svg>`,
  close: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 5l14 14M19 5 5 19"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V8a3 3 0 0 0-6 0z"/></svg>`,
  check: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9.5 18 20 6.5"/></svg>`,
  trophy: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M6 4h12v3a6 6 0 0 1-5 5.92V15h3v2H8v-2h3v-2.08A6 6 0 0 1 6 7Zm-3 1h3v2a3 3 0 0 1-3-3Zm18 0a3 3 0 0 1-3 3V5Z"/></svg>`,
  sparkle: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M12 2l1.8 5.9L20 10l-6.2 2.1L12 18l-1.8-5.9L4 10l6.2-2.1Z"/></svg>`,
  rocket: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M13 2c3 2 5 6 5 10l-3 3-2-2 3-3c0-2-1-5-3-6-2 1-3 4-3 6l3 3-2 2-3-3c0-4 2-8 5-10Z"/><path d="M8 15l-3 5 5-3z"/></svg>`,
  building: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M4 21V6l6-3 6 3v4l4 2v9h-6v-4H10v4Z"/></svg>`,
  tree: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M12 2 6 10h3l-5 7h7v5h2v-5h7l-5-7h3Z"/></svg>`,
  planet: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><circle cx="12" cy="12" r="5.5"/><ellipse cx="12" cy="12" rx="10" ry="3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
  candy: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M9 12a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z"/><path d="M6 6 2 4v5l4-1Zm12 0 4-2v5l-4-1ZM6 18l-4 2v-5l4 1Zm12 0 4 2v-5l-4 1Z"/></svg>`,
  castle: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M3 22V10h2V7h2v3h2V6h2v4h2V6h2v4h2V7h2v3h2v12Zm5-8v5h2v-3h4v3h2v-5Z"/></svg>`,
  barn: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M2 11 12 3l10 8v2h-2v9h-6v-6H10v6H4v-9H2Zm8 3h4v2h-4Z"/></svg>`,
  star: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.8L12 16.9 5.8 20.3l1.6-6.8L2.2 8.9l6.9-.6Z"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  speaker: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M4 9v6h4l5 5V4L8 9Z"/><path d="M16.2 8.8a5 5 0 0 1 0 6.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  musicnote: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M9 17.5A2.5 2.5 0 1 1 6.5 15c.36 0 .7.08 1 .22V6.1l9-1.8v9.4a2.5 2.5 0 1 1-2-2.45V6.3l-6 1.2v7.5c.34.11.63.28.9.5.06.16.1.32.1.5v.05Z"/></svg>`,
  camera: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M9 4 7.5 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.5L15 4Z"/><circle cx="12" cy="13" r="3.6" fill="rgba(255,255,255,.55)"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm9 3.5a8.9 8.9 0 0 0-.15-1.6l2-1.55-2-3.46-2.36.95a9 9 0 0 0-2.77-1.6L15.3 2h-4l-.42 2.24a9 9 0 0 0-2.77 1.6l-2.36-.95-2 3.46 2 1.55A8.9 8.9 0 0 0 3 12a8.9 8.9 0 0 0 .15 1.6l-2 1.55 2 3.46 2.36-.95a9 9 0 0 0 2.77 1.6L8.7 22h4l.42-2.24a9 9 0 0 0 2.77-1.6l2.36.95 2-3.46-2-1.55a8.9 8.9 0 0 0 .15-1.6Z"/></svg>`
};

export function svgIcon(name, size) {
  const s = size || 18;
  const svg = RAW[name] || '';
  return svg.replace('width="1em"', `width="${s}"`).replace('height="1em"', `height="${s}"`);
}
