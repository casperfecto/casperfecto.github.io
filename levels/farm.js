/* ============================= LEVEL: GRANJA ============================= */
/* Torre = pisos de granero (tablones rojos con vigas blancas). Escenario =
   campos con animales (vaca, conejo, dos gallinas), un granero centrado y
   un molino de viento al fondo en el mismo lenguaje poligonal facetado.
   Igual que Ciudad y Bosque, llegar arriba desbloquea Marte. */
import { pick, lerpColor, shade, blockPalette, clamp } from '../js/utils.js';
import { svgIcon } from '../js/icons.js';
import { drawCloudLayer, drawSpaceApproach, drawStars } from '../js/decor-helpers.js';

const CLOUD_LIGHT = '#ffffff', CLOUD_DARK = '#c9d9c2';

function hash(seed) { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function poly(ctx, pts, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath(); ctx.fill();
}

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

/* --- molino de viento de fondo con aspas --- */
function drawWindmill(ctx, cx, base, s, time) {
  const w = 45 * s, h = 110 * s;
  const bodyDark = '#7A6B5D', bodyLight = '#9C8B7A';
  const roofColor = '#5E4632';

  // Base cónica del molino
  poly(ctx, [{ x: cx - w / 2, y: base }, { x: cx - w * 0.3, y: base - h }, { x: cx, y: base - h }, { x: cx, y: base }], bodyDark);
  poly(ctx, [{ x: cx, y: base }, { x: cx, y: base - h }, { x: cx + w * 0.3, y: base - h }, { x: cx + w / 2, y: base }], bodyLight);

  // Techo del molino
  const roofTop = base - h - 20 * s;
  poly(ctx, [{ x: cx - w * 0.35, y: base - h }, { x: cx, y: roofTop }, { x: cx, y: base - h }], shade(roofColor, -0.2));
  poly(ctx, [{ x: cx + w * 0.35, y: base - h }, { x: cx, y: roofTop }, { x: cx, y: base - h }], shade(roofColor, 0.16));

  // Eje de las aspas
  const hubY = base - h + 10 * s;
  ctx.fillStyle = '#3A2E2B';
  ctx.beginPath(); ctx.arc(cx, hubY, 4 * s, 0, 7); ctx.fill();

  // Aspas giratorias
  const angle = time * 0.001;
  const bladeLength = 55 * s;
  const bladeWidth = 10 * s;

  for (let i = 0; i < 4; i++) {
    const a = angle + (i * Math.PI / 2);
    const cosA = Math.cos(a), sinA = Math.sin(a);
    const tipX = cx + cosA * bladeLength, tipY = hubY + sinA * bladeLength;
    const perpX = -sinA * bladeWidth * 0.5, perpY = cosA * bladeWidth * 0.5;

    poly(ctx, [
      { x: cx, y: hubY },
      { x: tipX + perpX, y: tipY + perpY },
      { x: tipX - perpX, y: tipY - perpY }
    ], i % 2 === 0 ? '#EFEBE4' : '#DCD5C9');
  }
}

/* --- silo adosado al granero: paneles verticales facetados + techo cónico --- */
function drawSilo(ctx, cx, base, height, radius, scale) {
  const bodyTop = base - height;
  const panels = 5;
  const light = '#E7EBEC', dark = '#95A3AB';
  for (let i = 0; i < panels; i++) {
    const t0 = i / panels, t1 = (i + 1) / panels;
    const px0 = cx - radius + t0 * radius * 2, px1 = cx - radius + t1 * radius * 2;
    const shadeAmt = Math.sin(((t0 + t1) / 2) * Math.PI);
    ctx.fillStyle = lerpColor(dark, light, shadeAmt);
    ctx.fillRect(px0, bodyTop, px1 - px0, base - bodyTop);
  }
  ctx.strokeStyle = 'rgba(0,0,0,.14)'; ctx.lineWidth = Math.max(1, scale);
  for (let i = 1; i < 4; i++) { const ry = bodyTop + (base - bodyTop) * (i / 4); ctx.beginPath(); ctx.moveTo(cx - radius, ry); ctx.lineTo(cx + radius, ry); ctx.stroke(); }
  const roofH = radius * 1.15;
  const roofColor = '#8C3A2A';
  poly(ctx, [{ x: cx - radius, y: bodyTop }, { x: cx, y: bodyTop - roofH }, { x: cx, y: bodyTop }], shade(roofColor, -0.22));
  poly(ctx, [{ x: cx + radius, y: bodyTop }, { x: cx, y: bodyTop - roofH }, { x: cx, y: bodyTop }], shade(roofColor, 0.16));
  ctx.fillStyle = shade(roofColor, -0.38);
  ctx.beginPath(); ctx.arc(cx, bodyTop - roofH, Math.max(1.4, 1.6 * scale), 0, 7); ctx.fill();
}

/* --- cúpula con veleta, remata la cumbrera del techo --- */
function drawCupola(ctx, cx, roofPeakY, h, scale) {
  const w = h * 0.95;
  const body = '#F3ECD8', bodyDark = shade(body, -0.16);
  const roofC = '#5E4632';
  const baseY = roofPeakY + h * 0.1, topBodyY = baseY - h * 0.55;
  ctx.fillStyle = bodyDark; ctx.fillRect(cx - w / 2, topBodyY, w * 0.42, baseY - topBodyY);
  ctx.fillStyle = body; ctx.fillRect(cx - w / 2 + w * 0.42, topBodyY, w * 0.58, baseY - topBodyY);
  const peakY = topBodyY - h * 0.42;
  poly(ctx, [{ x: cx - w / 2, y: topBodyY }, { x: cx, y: peakY }, { x: cx, y: topBodyY }], shade(roofC, -0.2));
  poly(ctx, [{ x: cx + w / 2, y: topBodyY }, { x: cx, y: peakY }, { x: cx, y: topBodyY }], shade(roofC, 0.16));
  ctx.strokeStyle = '#4a4238'; ctx.lineWidth = Math.max(1, scale);
  ctx.beginPath(); ctx.moveTo(cx, peakY); ctx.lineTo(cx, peakY - h * 0.4); ctx.stroke();
  poly(ctx, [{ x: cx, y: peakY - h * 0.42 }, { x: cx + h * 0.24, y: peakY - h * 0.26 }, { x: cx, y: peakY - h * 0.16 }], '#4a4238');
}

/* --- granero de fondo: cimiento de piedra, silo adosado, un par de ventanas
   facetadas, techo a dos aguas con cumbrera y cúpula con veleta, ventanal
   del pajar y puerta grande con tranqueros en aspa --- */
function drawBarn(ctx, cx, base, s) {
  const w = 150 * s, h = 118 * s;
  const red = '#B5432E', redDark = shade(red, -0.26), redLight = shade(red, 0.16);
  const roof = '#5E4632', roofDark = shade(roof, -0.24), roofLight = shade(roof, 0.16);
  const trim = '#F3ECD8', trimShade = shade(trim, -0.12);
  const x0 = cx - w / 2, x1 = cx + w / 2;

  const foundH = Math.max(3, h * 0.05);
  ctx.fillStyle = '#8C8478'; ctx.fillRect(x0 - 2 * s, base - foundH, w + 4 * s, foundH);
  ctx.fillStyle = shade('#8C8478', -0.2); ctx.fillRect(x0 - 2 * s, base - foundH, w * 0.5, foundH);
  const groundY = base - foundH, top = groundY - h * 0.6;

  drawSilo(ctx, x0 - w * 0.15, groundY, h * 0.9, w * 0.12, s);

  ctx.fillStyle = red; ctx.fillRect(x0, top, w, groundY - top);
  ctx.fillStyle = redDark; ctx.fillRect(x0, top, w * 0.14, groundY - top);
  ctx.fillStyle = redLight; ctx.fillRect(x1 - w * 0.1, top, w * 0.1, groundY - top);

  ctx.fillStyle = trim;
  [x0 + w * 0.2, x1 - w * 0.29].forEach(wx => ctx.fillRect(wx, top + h * 0.16, w * 0.09, w * 0.09));
  ctx.strokeStyle = redDark; ctx.lineWidth = Math.max(1, 1.6 * s);
  [x0 + w * 0.2, x1 - w * 0.29].forEach(wx => {
    ctx.strokeRect(wx, top + h * 0.16, w * 0.09, w * 0.09);
    ctx.beginPath(); ctx.moveTo(wx + w * 0.045, top + h * 0.16); ctx.lineTo(wx + w * 0.045, top + h * 0.16 + w * 0.09);
    ctx.moveTo(wx, top + h * 0.16 + w * 0.045); ctx.lineTo(wx + w * 0.09, top + h * 0.16 + w * 0.045); ctx.stroke();
  });

  const roofPeakY = top - h * 0.5, shoulderY = top - h * 0.2;
  poly(ctx, [{ x: x0, y: top }, { x: x0 + w * 0.2, y: shoulderY }, { x: cx, y: roofPeakY }, { x: cx, y: top }], roofDark);
  poly(ctx, [{ x: x1, y: top }, { x: x1 - w * 0.2, y: shoulderY }, { x: cx, y: roofPeakY }, { x: cx, y: top }], roofLight);
  poly(ctx, [{ x: x0 + w * 0.2, y: shoulderY }, { x: cx, y: roofPeakY - h * 0.02 }, { x: x1 - w * 0.2, y: shoulderY }, { x: cx, y: top - h * 0.02 }], roof);
  ctx.strokeStyle = roofDark; ctx.lineWidth = Math.max(1, 1.3 * s);
  ctx.beginPath(); ctx.moveTo(x0 + w * 0.2, shoulderY); ctx.lineTo(cx, roofPeakY); ctx.lineTo(x1 - w * 0.2, shoulderY); ctx.stroke();

  drawCupola(ctx, cx, roofPeakY, h * 0.24, s);

  const gable = [{ x: cx - w * 0.08, y: top - h * 0.05 }, { x: cx, y: top - h * 0.16 }, { x: cx + w * 0.08, y: top - h * 0.05 }, { x: cx + w * 0.06, y: top + h * 0.02 }, { x: cx - w * 0.06, y: top + h * 0.02 }];
  poly(ctx, gable, trim);
  ctx.strokeStyle = redDark; ctx.lineWidth = Math.max(1, 1.4 * s);
  ctx.beginPath(); gable.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)); ctx.closePath(); ctx.stroke();

  const doorW = w * 0.3, doorH = h * 0.56;
  ctx.fillStyle = trim; ctx.fillRect(cx - doorW / 2, groundY - doorH, doorW, doorH);
  ctx.fillStyle = trimShade; ctx.fillRect(cx - doorW / 2, groundY - doorH, doorW * 0.45, doorH);
  ctx.strokeStyle = redDark; ctx.lineWidth = Math.max(1.5, 3 * s);
  ctx.beginPath(); ctx.moveTo(cx - doorW / 2, groundY - doorH); ctx.lineTo(cx + doorW / 2, groundY); ctx.moveTo(cx + doorW / 2, groundY - doorH); ctx.lineTo(cx - doorW / 2, groundY); ctx.stroke();
  ctx.strokeRect(cx - doorW / 2, groundY - doorH, doorW, doorH);
  ctx.fillStyle = trim; ctx.fillRect(x0, groundY - Math.max(3, 6 * s), w, Math.max(3, 6 * s));
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

/* --- vaca: silueta hecha a mano (no un blob genérico), inspirada en la
   referencia -- cuerpo faceteado con sombreado variable, manchas grandes e
   irregulares de "vaca lechera" superpuestas, ubre y hocico rosados,
   cuernos y oreja --- */
function drawCow(ctx, x, base, s, seed, dir) {
  const T = (lx, ly) => ({ x: x + lx * dir * s, y: base + ly * s });
  const white = '#F6F5F1', black = '#2B2825', blackSoft = shade(black, 0.16);
  const pink = '#E8A6AE', tan = '#D9B27C', tanDark = shade(tan, -0.28), earBrown = '#5B3B28', hoofDark = '#3A332E';
  const shadowGray = shade(white, -0.18);

  const bodyLocal = [[-30, -32], [-36, -20], [-30, -14], [-16, -9], [6, -5], [18, -12], [18, -28], [-2, -35]];
  const headLocal = [[18, -28], [26, -38], [38, -36], [48, -28], [52, -18], [44, -12], [28, -16]];

  // patas (detrás del cuerpo, para que el vientre las tape en la unión)
  const legW = 5 * s;
  [-26, -17, 6, 15].forEach((lx, i) => {
    const p = T(lx, 0);
    ctx.fillStyle = (i % 2 === 0) ? shade(shadowGray, -0.1) : shadowGray;
    ctx.fillRect(p.x - legW / 2, base - 14 * s, legW, 14 * s);
    ctx.fillStyle = hoofDark;
    ctx.fillRect(p.x - legW / 2, base - 3 * s, legW, 3 * s);
  });

  // cuerpo: abanico facetado con sombreado variable (no un tono liso)
  const bodyPts = bodyLocal.map(([lx, ly]) => T(lx, ly));
  const M = bodyPts.reduce((a, p) => ({ x: a.x + p.x / bodyPts.length, y: a.y + p.y / bodyPts.length }), { x: 0, y: 0 });
  const bodyShades = [0.05, -0.10, 0.12, 0.17, 0.03, -0.06, -0.16, -0.02];
  for (let i = 0; i < bodyPts.length; i++) {
    const a = bodyPts[i], b = bodyPts[(i + 1) % bodyPts.length];
    poly(ctx, [M, a, b], shade(white, bodyShades[i]));
  }

  // ubre rosada bajo el vientre
  poly(ctx, [T(-6, -8), T(8, -6), T(10, -2), T(-4, -3)], pink);

  // cabeza: mismo truco de abanico facetado
  const headPts = headLocal.map(([lx, ly]) => T(lx, ly));
  const HM = headPts.reduce((a, p) => ({ x: a.x + p.x / headPts.length, y: a.y + p.y / headPts.length }), { x: 0, y: 0 });
  const headShades = [0.10, -0.05, 0.08, 0.14, 0.02, -0.08, 0.0];
  for (let i = 0; i < headPts.length; i++) {
    const a = headPts[i], b = headPts[(i + 1) % headPts.length];
    poly(ctx, [HM, a, b], shade(white, headShades[i]));
  }

  // manchas oscuras grandes e irregulares (cuello+cabeza y grupa), con
  // jitter propio por vaca para que no salgan todas idénticas
  const j = n => (hash(seed + n) - 0.5) * 4;
  poly(ctx, [T(-2 + j(1), -35 + j(2)), T(18, -28), T(28 + j(3), -16), T(38 + j(4), -36), T(26, -38)], black);
  poly(ctx, [T(-2 + j(1), -35 + j(2)), T(28 + j(3), -16), T(48, -28), T(38 + j(4), -36)], blackSoft);
  poly(ctx, [T(-30, -32), T(-36, -20), T(-24 + j(5), -15), T(-14 + j(6), -30)], black);

  // hocico rosado
  poly(ctx, [T(48, -28), T(52, -18), T(44, -12), T(41, -20)], pink);
  ctx.fillStyle = shade(pink, -0.25);
  const nostril = T(47, -19); ctx.beginPath(); ctx.arc(nostril.x, nostril.y, 1.3 * s, 0, 7); ctx.fill();

  // cuernos + oreja
  poly(ctx, [T(24, -38), T(22, -46), T(28, -40)], tan);
  poly(ctx, [T(24, -38), T(28, -40), T(27, -37)], tanDark);
  poly(ctx, [T(30, -38), T(36, -42), T(34, -33)], earBrown);

  // ojo
  ctx.fillStyle = '#201D1B';
  const eye = T(34, -30); ctx.beginPath(); ctx.arc(eye.x, eye.y, 1.4 * s, 0, 7); ctx.fill();

  // cola, larga y con mechón oscuro en la punta (dibujada al final, por
  // encima de todo, ya que cuelga fuera de la silueta del cuerpo)
  const tailBase = T(-30, -30), tailMid = T(-42, -6), tailTip = T(-37, 11);
  ctx.strokeStyle = shadowGray; ctx.lineWidth = 2 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(tailBase.x, tailBase.y); ctx.quadraticCurveTo(tailMid.x, tailMid.y, tailTip.x, tailTip.y); ctx.stroke();
  poly(ctx, [{ x: tailTip.x - 3 * s, y: tailTip.y - 2 * s }, { x: tailTip.x + 3 * s, y: tailTip.y - 2 * s }, { x: tailTip.x, y: tailTip.y + 7 * s }], black);
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
  const dark = shade(bodyColor, -0.2), light = shade(bodyColor, 0.14);
  const bodyCy = base - 12 * s;
  // cola en capas, apuntando hacia arriba y atrás como la referencia
  const tailBaseX = x - dir * 6 * s, tailBaseY = bodyCy - 2 * s;
  [{ dx: -14, dy: -24, w: 7 }, { dx: -9, dy: -19, w: 8 }, { dx: -3, dy: -13, w: 6.5 }].forEach((f, i) => {
    const dxw = dir * f.dx * s, dyw = f.dy * s;
    const len = Math.hypot(dxw, dyw) || 1;
    const px = -dyw / len, py = dxw / len; // perpendicular unitario
    const halfW = f.w * 0.5 * s;
    poly(ctx, [
      { x: tailBaseX + px * halfW, y: tailBaseY + py * halfW },
      { x: tailBaseX + dxw, y: tailBaseY + dyw },
      { x: tailBaseX - px * halfW, y: tailBaseY - py * halfW }
    ], i % 2 === 0 ? dark : bodyColor);
  });
  facetedBlob(ctx, x, bodyCy, 11 * s, 10 * s, bodyColor, dark, 7);
  // línea de ala
  ctx.strokeStyle = shade(bodyColor, -0.14); ctx.lineWidth = Math.max(1, 1.2 * s);
  ctx.beginPath(); ctx.moveTo(x - dir * 6 * s, bodyCy - 4 * s); ctx.quadraticCurveTo(x, bodyCy + 2 * s, x - dir * 2 * s, bodyCy + 7 * s); ctx.stroke();
  const headCx = x + dir * 9 * s, headCy = bodyCy - 8 * s;
  facetedBlob(ctx, headCx, headCy, 5.5 * s, 5.5 * s, light, dark, 6);
  ctx.fillStyle = '#D6432C';
  ctx.beginPath();
  ctx.moveTo(headCx - 3.5 * s, headCy - 4 * s); ctx.lineTo(headCx - 2.4 * s, headCy - 9.5 * s); ctx.lineTo(headCx - 0.6 * s, headCy - 6 * s);
  ctx.lineTo(headCx + 0.8 * s, headCy - 10.5 * s); ctx.lineTo(headCx + 2.2 * s, headCy - 6 * s); ctx.lineTo(headCx + 3.2 * s, headCy - 4.5 * s);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#F0A93A';
  ctx.beginPath(); ctx.moveTo(headCx + dir * 4.5 * s, headCy); ctx.lineTo(headCx + dir * 9 * s, headCy + 1.6 * s); ctx.lineTo(headCx + dir * 4.5 * s, headCy + 3.4 * s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#201D1B';
  ctx.beginPath(); ctx.arc(headCx + dir * 1.5 * s, headCy - 1 * s, 0.9 * s, 0, 7); ctx.fill();
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
    const windmill = { offset: -160 + (rng() * 40 - 20), scale: 0.7 + rng() * 0.1 };
    const fencePosts = [];
    for (let i = 0; i < 26; i++) fencePosts.push({ x: i * 46 + (rng() * 6 - 3) });
    const animals = [];
    const kinds = ['rabbit', 'chicken', 'chicken', 'rabbit'];
    for (let i = 0; i < 7; i++) animals.push({ x: i * 120 + (rng() * 50 - 25), kind: pick(rng, kinds), dir: rng() > 0.5 ? 1 : -1, scale: 1.25 + rng() * 0.55, seed: rng() * 1000, colorSeed: rng() });
    const backCow = { x: -80, scale: 1.4, seed: 123, dir: 1 };
    const frontCow = { x: 140, scale: 1.8, seed: 456, dir: -1 };
    const clouds = [];
    for (let i = 0; i < 13; i++) clouds.push({ x: rng() * 2400 - 600, y: 220 + rng() * 2400, s: 0.6 + rng() * 1.1, drift: 7 + rng() * 12, bob: rng() * 6.28 });
    const stars = [];
    for (let i = 0; i < 90; i++) stars.push({ x: rng() * 1000, y: 2200 + rng() * 3200, r: 0.6 + rng() * 1.6, tw: rng() * 6.28 });
    const planets = [];
    for (let i = 0; i < 5; i++) planets.push({ x: rng() * 1200 - 200, y: 3400 + rng() * 3000, r: 32 + rng() * 68, c1: pick(rng, ['#E58AC9', '#7FDBDA', '#F5D76E', '#9CA8FF']), c2: pick(rng, ['#8C3A78', '#227271', '#9C7A22', '#5A66C9']) });
    const meteors = [];
    for (let i = 0; i < 5; i++) meteors.push({ seed: rng() * 1000, y: 3600 + rng() * 3200, speed: 200 + rng() * 140, len: 60 + rng() * 50, ang: 0.5 + rng() * 0.3 });
    return { fields, windmill, fencePosts, animals, backCow, frontCow, clouds, stars, planets, meteors };
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

    // Molino de viento dibujado al fondo
    if (L.windmill) {
      const base = gY + 26 + camH * groundFactor;
      if (base <= CH + 260) {
        drawWindmill(ctx, CW / 2 + L.windmill.offset, base, L.windmill.scale, time);
      }
    }

    // Granero principal centrado y mucho más grande
    const barnBase = gY + 22 + camH * groundFactor;
    if (barnBase <= CH + 350) {
      drawBarn(ctx, CW / 2, barnBase, 2.2);
    }

    const fenceBase = gY + 8 + camH * groundFactor;
    if (fenceBase < CH + 60) {
      L.fencePosts.forEach(p => {
        const px = ((p.x % (CW + 80)) + CW + 80) % (CW + 80) - 40;
        drawFencePost(ctx, px, fenceBase, 26);
      });
      drawFenceRails(ctx, -20, CW + 20, fenceBase, 26);
    }

    // Vaca de fondo (detrás de los bloques)
    if (L.backCow) {
      const base = gY + camH * groundFactor;
      if (base <= CH + 100) {
        const ax = ((L.backCow.x % (CW + 220)) + CW + 220) % (CW + 220) - 110;
        drawCow(ctx, ax, base, L.backCow.scale, L.backCow.seed, L.backCow.dir);
      }
    }

    L.animals.forEach(a => {
      const base = gY + camH * groundFactor;
      if (base > CH + 100) return;
      const ax = ((a.x % (CW + 220)) + CW + 220) % (CW + 220) - 110;
      if (a.kind === 'rabbit') drawRabbit(ctx, ax, base, a.scale, a.seed, a.dir);
      else drawChicken(ctx, ax, base, a.scale, a.seed, a.dir, a.colorSeed > 0.5 ? '#FFFFFF' : '#C97B3D');
    });

    const gy2 = gY + camH * 1.0;
    if (gy2 > -10 && gy2 < CH + 200) { ctx.fillStyle = this.ground; ctx.fillRect(0, gy2, CW, CH - gy2 + 300); }
  },

  drawForeground(ctx, api) {
    const { L, gY, camH, CW, CH } = api;
    const groundFactor = 0.7;

    // Vaca frontal (dibujada por delante de los bloques)
    if (L.frontCow) {
      const base = gY + camH * groundFactor + 10;
      if (base <= CH + 150) {
        const ax = ((L.frontCow.x % (CW + 220)) + CW + 220) % (CW + 220) - 110;
        drawCow(ctx, ax, base, L.frontCow.scale, L.frontCow.seed, L.frontCow.dir);
      }
    }
  },

  drawBlockDetail(ctx, x0, x1, fY, yBottom, w) {
    ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 1;
    for (let wx = x0 + 11; wx < x1 - 4; wx += 11) { ctx.beginPath(); ctx.moveTo(wx, fY + 2); ctx.lineTo(wx, yBottom - 2); ctx.stroke(); }
    ctx.fillStyle = 'rgba(248,240,220,.85)';
    ctx.fillRect(x0, fY, w, 3);
  }
};