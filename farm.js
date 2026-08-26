/* ============================= LEVEL: GRANJA ============================= */
/* Torre = pisos de granero (tablones rojos con vigas blancas). Escenario =
   campos con animales (vaca, conejo, dos gallinas) y un granero de fondo,
   todo en el mismo lenguaje poligonal facetado del resto del juego.
   Igual que Ciudad y Bosque, llegar arriba desbloquea Marte. */
import { pick, lerpColor, shade, blockPalette, clamp } from '../js/utils.js';
import { svgIcon } from '../js/icons.js';
import { drawCloudLayer, drawSpaceApproach, drawStars } from '../js/decor-helpers.js';

const CLOUD_LIGHT = '#ffffff', CLOUD_DARK = '#c9d9c2';

function hash(seed) { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

/* blob facetado (abanico de triángulos con sombreado tipo sol arriba-izquierda),
   mismo lenguaje visual que nubes/planetas/copas de árbol -- usado para el
   cuerpo y la cabeza de los animales */
function facetedBlob(ctx, cx, cy, rx, ry, cLight, cDark, N) {
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / N) * Math.PI * 2 - Math.PI / 2;
    const shadeAmt = 0.15 + 0.85 * Math.max(0, Math.sin((a0 + a1) / 2 + 0.8));
    ctx.fillStyle = lerpColor(cDark, cLight, shadeAmt);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry);
    ctx.lineTo(cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry);
    ctx.closePath(); ctx.fill();
  }
}

/* --- campos ondulados de fondo, mismo truco de dos caras facetadas que las
   colinas de gomita del mapa Dulce --- */
function drawField(ctx, hx, base, w, h, colorBase) {
  const domeTop = base - h;
  const left = shade(colorBase, -0.14), right = shade(colorBase, 0.16);
  ctx.fillStyle = left;
  ctx.beginPath();
  ctx.moveTo(hx - w / 2, base); ctx.lineTo(hx - w * 0.05, domeTop); ctx.lineTo(hx, base - h * 0.86); ctx.lineTo(hx, base);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = right;
  ctx.beginPath();
  ctx.moveTo(hx, base); ctx.lineTo(hx, base - h * 0.86); ctx.lineTo(hx + w * 0.08, domeTop); ctx.lineTo(hx + w / 2, base);
  ctx.closePath(); ctx.fill();
}

/* --- granero de fondo: cuerpo + techo a dos aguas facetado + puerta blanca
   con tranqueros en aspa + ventanal del pajar --- */
function drawBarn(ctx, cx, base, scale) {
  const w = 150 * scale, h = 118 * scale;
  const red = '#B5432E', redDark = shade(red, -0.24), redLight = shade(red, 0.14);
  const roof = '#5E4632', roofDark = shade(roof, -0.22), roofLight = shade(roof, 0.14);
  const trim = '#F3ECD8';
  const x0 = cx - w / 2, x1 = cx + w / 2, top = base - h * 0.6;

  ctx.fillStyle = red; ctx.fillRect(x0, top, w, base - top);
  ctx.fillStyle = redDark; ctx.fillRect(x0, top, w * 0.14, base - top);
  ctx.fillStyle = redLight; ctx.fillRect(x1 - w * 0.1, top, w * 0.1, base - top);

  const roofPeakY = top - h * 0.5, shoulderY = top - h * 0.2;
  ctx.fillStyle = roofDark;
  ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x0 + w * 0.2, shoulderY); ctx.lineTo(cx, roofPeakY); ctx.lineTo(cx, top); ctx.closePath(); ctx.fill();
  ctx.fillStyle = roofLight;
  ctx.beginPath(); ctx.moveTo(x1, top); ctx.lineTo(x1 - w * 0.2, shoulderY); ctx.lineTo(cx, roofPeakY); ctx.lineTo(cx, top); ctx.closePath(); ctx.fill();
  ctx.fillStyle = roof;
  ctx.beginPath(); ctx.moveTo(x0 + w * 0.2, shoulderY); ctx.lineTo(cx, roofPeakY - h * 0.02); ctx.lineTo(x1 - w * 0.2, shoulderY); ctx.lineTo(cx, top - h * 0.02); ctx.closePath(); ctx.fill();

  ctx.fillStyle = trim;
  ctx.beginPath(); ctx.moveTo(cx - w * 0.08, top - h * 0.05); ctx.lineTo(cx, top - h * 0.16); ctx.lineTo(cx + w * 0.08, top - h * 0.05); ctx.lineTo(cx + w * 0.06, top + h * 0.02); ctx.lineTo(cx - w * 0.06, top + h * 0.02); ctx.closePath(); ctx.fill();

  const doorW = w * 0.3, doorH = h * 0.56;
  ctx.fillStyle = trim; ctx.fillRect(cx - doorW / 2, base - doorH, doorW, doorH);
  ctx.strokeStyle = redDark; ctx.lineWidth = Math.max(1.5, 3 * scale);
  ctx.beginPath(); ctx.moveTo(cx - doorW / 2, base - doorH); ctx.lineTo(cx + doorW / 2, base); ctx.moveTo(cx + doorW / 2, base - doorH); ctx.lineTo(cx - doorW / 2, base); ctx.stroke();
  ctx.strokeRect(cx - doorW / 2, base - doorH, doorW, doorH);
  ctx.fillStyle = trim; ctx.fillRect(x0, base - Math.max(3, 6 * scale), w, Math.max(3, 6 * scale));
}

/* --- cerca de madera --- */
function drawFencePost(ctx, x, base, h) {
  ctx.fillStyle = '#B08655'; ctx.fillRect(x - 3, base - h, 6, h);
  ctx.fillStyle = '#8A6539'; ctx.fillRect(x - 3, base - h, 2.4, h);
}
function drawFenceRails(ctx, x0, x1, base, h) {
  ctx.strokeStyle = '#A3763F'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x0, base - h * 0.68); ctx.lineTo(x1, base - h * 0.68); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0, base - h * 0.3); ctx.lineTo(x1, base - h * 0.3); ctx.stroke();
}

/* --- animales, todos hechos con el mismo blob facetado + detalles simples --- */
function drawCow(ctx, x, base, s, seed, dir) {
  const white = '#FDFDFB', shadow = '#D6D2C6', black = '#2E2B29', blackLight = shade(black, 0.22);
  const bodyCy = base - 26 * s, bodyRx = 30 * s, bodyRy = 17 * s;
  ctx.fillStyle = shadow;
  [-16, -5, 6, 17].forEach(o => ctx.fillRect(x + o * s - 2.6 * s, base - 16 * s, 5.2 * s, 16 * s));
  ctx.fillStyle = black;
  [-16, 6].forEach(o => ctx.fillRect(x + o * s - 2.6 * s, base - 16 * s, 2.4 * s, 16 * s));
  facetedBlob(ctx, x, bodyCy, bodyRx, bodyRy, white, shadow, 8);
  // manchas pequeñas y redondeadas (más facetas = borde suave) sobre el lomo,
  // lejos de la cabeza para no confundir la silueta
  const spots = [
    { dx: -12 - dir * 4, dy: -9, r: 7.5 }, { dx: -1 - dir * 6, dy: 2, r: 6 },
    { dx: -19 - dir * 2, dy: 4, r: 5 }, { dx: 6 - dir * 8, dy: -6, r: 4.6 }
  ];
  spots.forEach(sp => facetedBlob(ctx, x + sp.dx * s, bodyCy + sp.dy * s, sp.r * s, sp.r * 0.78 * s, blackLight, black, 10));
  const headCx = x + dir * (bodyRx + 8 * s), headCy = bodyCy - 3 * s;
  facetedBlob(ctx, headCx, headCy, 12 * s, 10 * s, white, shadow, 6);
  ctx.fillStyle = shadow;
  ctx.beginPath(); ctx.moveTo(headCx - dir * 4 * s, headCy - 9 * s); ctx.lineTo(headCx - dir * 1 * s, headCy - 15 * s); ctx.lineTo(headCx + dir * 3 * s, headCy - 9 * s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#4a4642';
  ctx.beginPath(); ctx.ellipse(headCx + dir * 8 * s, headCy + 4 * s, 4.4 * s, 3.4 * s, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = shadow; ctx.lineWidth = 2.2 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - dir * bodyRx, bodyCy + 2 * s); ctx.lineTo(x - dir * (bodyRx + 7 * s), bodyCy + 15 * s); ctx.stroke();
}
function drawRabbit(ctx, x, base, s, seed, dir) {
  const white = '#FFFFFF', shadow = '#DAD3C6';
  const bodyCy = base - 13 * s;
  facetedBlob(ctx, x, bodyCy, 15 * s, 11 * s, white, shadow, 7);
  const headCx = x + dir * 10 * s, headCy = bodyCy - 9 * s;
  facetedBlob(ctx, headCx, headCy, 8.5 * s, 7.5 * s, white, shadow, 6);
  ctx.fillStyle = shadow;
  ctx.beginPath(); ctx.moveTo(headCx - 3 * s, headCy - 6 * s); ctx.lineTo(headCx - 5 * s, headCy - 22 * s); ctx.lineTo(headCx, headCy - 7 * s); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(headCx + 2 * s, headCy - 6 * s); ctx.lineTo(headCx + 4.5 * s, headCy - 22 * s); ctx.lineTo(headCx + 6 * s, headCy - 6 * s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#F2A5B0';
  ctx.beginPath(); ctx.arc(headCx + dir * 6 * s, headCy + 2 * s, 1.6 * s, 0, 7); ctx.fill();
  ctx.fillStyle = white;
  ctx.beginPath(); ctx.arc(x - dir * 13 * s, bodyCy + 3 * s, 4 * s, 0, 7); ctx.fill();
  ctx.fillStyle = shadow;
  ctx.fillRect(x - 7 * s, base - 5 * s, 4 * s, 5 * s);
  ctx.fillRect(x + 4 * s, base - 5 * s, 4 * s, 5 * s);
}
function drawChicken(ctx, x, base, s, seed, dir, bodyColor) {
  const dark = shade(bodyColor, -0.2);
  const bodyCy = base - 12 * s;
  facetedBlob(ctx, x, bodyCy, 11 * s, 10 * s, bodyColor, dark, 7);
  const headCx = x + dir * 9 * s, headCy = bodyCy - 8 * s;
  facetedBlob(ctx, headCx, headCy, 5.5 * s, 5.5 * s, bodyColor, dark, 6);
  ctx.fillStyle = '#D6432C';
  ctx.beginPath(); ctx.moveTo(headCx - 2 * s, headCy - 5.5 * s); ctx.lineTo(headCx, headCy - 10 * s); ctx.lineTo(headCx + 2 * s, headCy - 5.5 * s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#F0A93A';
  ctx.beginPath(); ctx.moveTo(headCx + dir * 4.5 * s, headCy); ctx.lineTo(headCx + dir * 9 * s, headCy + 1.6 * s); ctx.lineTo(headCx + dir * 4.5 * s, headCy + 3.4 * s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.moveTo(x - dir * 9 * s, bodyCy - 3 * s); ctx.lineTo(x - dir * 16 * s, bodyCy - 12 * s); ctx.lineTo(x - dir * 5 * s, bodyCy - 5 * s); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#E0A23A'; ctx.lineWidth = Math.max(1.4, 2 * s);
  ctx.beginPath(); ctx.moveTo(x - 2.6 * s, base - 5 * s); ctx.lineTo(x - 2.6 * s, base); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 2.6 * s, base - 5 * s); ctx.lineTo(x + 2.6 * s, base); ctx.stroke();
}

export default {
  id: 'farm', name: 'Granja', icon: svgIcon('barn'),
  unlock: { type: 'levelCoins', level: 10, cost: 1000 },
  ground: '#5c7a3b',
  skyStops: [
    { k: 0, top: '#BFE3F5', bottom: '#FDEFC7' },
    { k: 900, top: '#8FCBEA', bottom: '#E7E3B8' },
    { k: 2200, top: '#5AA0D8', bottom: '#AACBE0' },
    { k: 4000, top: '#255C96', bottom: '#6E93BE' },
    { k: 6200, top: '#0E2452', bottom: '#2F4E80' },
    { k: 9000, top: '#050716', bottom: '#141B3A' }
  ],
  blockColor: '#B5432E',
  blocks: [blockPalette('#B5432E')],
  blockStyle: 'barn',
  layout: null,

  buildLayout(rng) {
    const fields = [];
    for (let i = 0; i < 7; i++) fields.push({ x: i * 230 - 260 + (rng() * 60 - 30), w: 280 + rng() * 160, h: 34 + rng() * 46, tone: rng() });
    const barns = [
      { x: -30 + rng() * 40, scale: 1.05 + rng() * 0.2 },
      { x: 300 + rng() * 60, scale: 0.6 + rng() * 0.12 }
    ];
    const fencePosts = [];
    for (let i = 0; i < 26; i++) fencePosts.push({ x: i * 46 + (rng() * 6 - 3) });
    const animals = [];
    const kinds = ['cow', 'rabbit', 'chicken', 'chicken', 'rabbit', 'cow'];
    for (let i = 0; i < 9; i++) animals.push({ x: i * 108 + (rng() * 50 - 25), kind: pick(rng, kinds), dir: rng() > 0.5 ? 1 : -1, scale: 1.25 + rng() * 0.55, seed: rng() * 1000, colorSeed: rng() });
    const clouds = [];
    for (let i = 0; i < 13; i++) clouds.push({ x: rng() * 2400 - 600, y: 220 + rng() * 2400, s: 0.6 + rng() * 1.1, drift: 7 + rng() * 12, bob: rng() * 6.28 });
    const stars = [];
    for (let i = 0; i < 90; i++) stars.push({ x: rng() * 1000, y: 2200 + rng() * 3200, r: 0.6 + rng() * 1.6, tw: rng() * 6.28 });
    const planets = [];
    for (let i = 0; i < 5; i++) planets.push({ x: rng() * 1200 - 200, y: 3400 + rng() * 3000, r: 32 + rng() * 68, c1: pick(rng, ['#E58AC9', '#7FDBDA', '#F5D76E', '#9CA8FF']), c2: pick(rng, ['#8C3A78', '#227271', '#9C7A22', '#5A66C9']) });
    const meteors = [];
    for (let i = 0; i < 5; i++) meteors.push({ seed: rng() * 1000, y: 3600 + rng() * 3200, speed: 200 + rng() * 140, len: 60 + rng() * 50, ang: 0.5 + rng() * 0.3 });
    return { fields, barns, fencePosts, animals, clouds, stars, planets, meteors };
  },

  drawDecor(ctx, api) {
    const { L, gY, camH, CW, CH, time } = api;
    drawStars(ctx, L.stars, 0.35, gY, camH, CW, CH, time, 3200, 2600);
    drawSpaceApproach(ctx, L, gY, camH, CW, CH, time);
    drawCloudLayer(ctx, L.clouds, 0.34, gY, camH, CW, CH, time, CLOUD_LIGHT, CLOUD_DARK, () => 0.9 * (1 - clamp((camH - 4600) / 1800, 0, 1)));

    // todo lo del suelo comparte el mismo factor de cámara (0.7) que el
    // relleno de piso, para que nunca se despeguen y dejen un hueco visible
    const groundFactor = 0.7;

    L.fields.forEach(f => {
      const base = gY + 30 + camH * groundFactor;
      if (base > CH + 200) return;
      const col = lerpColor('#6f9146', '#4f7332', f.tone);
      drawField(ctx, f.x, base, f.w, f.h, col);
    });

    L.barns.forEach(b => {
      const base = gY + 22 + camH * groundFactor;
      if (base > CH + 260) return;
      drawBarn(ctx, b.x, base, b.scale);
    });

    const fenceBase = gY + 8 + camH * groundFactor;
    if (fenceBase < CH + 60) {
      L.fencePosts.forEach(p => {
        const px = ((p.x % (CW + 80)) + CW + 80) % (CW + 80) - 40;
        drawFencePost(ctx, px, fenceBase, 26);
      });
      drawFenceRails(ctx, -20, CW + 20, fenceBase, 26);
    }

    L.animals.forEach(a => {
      const base = gY + camH * groundFactor;
      if (base > CH + 100) return;
      const ax = ((a.x % (CW + 220)) + CW + 220) % (CW + 220) - 110;
      if (a.kind === 'cow') drawCow(ctx, ax, base, a.scale, a.seed, a.dir);
      else if (a.kind === 'rabbit') drawRabbit(ctx, ax, base, a.scale, a.seed, a.dir);
      else drawChicken(ctx, ax, base, a.scale, a.seed, a.dir, a.colorSeed > 0.5 ? '#FFFFFF' : '#C97B3D');
    });

    const gy2 = gY + camH * 1.0;
    if (gy2 > -10 && gy2 < CH + 200) { ctx.fillStyle = this.ground; ctx.fillRect(0, gy2, CW, CH - gy2 + 300); }
  },

  drawBlockDetail(ctx, x0, x1, fY, yBottom, w) {
    ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 1;
    for (let wx = x0 + 11; wx < x1 - 4; wx += 11) { ctx.beginPath(); ctx.moveTo(wx, fY + 2); ctx.lineTo(wx, yBottom - 2); ctx.stroke(); }
    ctx.fillStyle = 'rgba(248,240,220,.85)';
    ctx.fillRect(x0, fY, w, 3);
  }
};
