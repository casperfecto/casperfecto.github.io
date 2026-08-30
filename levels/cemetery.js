/* ============================= LEVEL: CEMENTERIO ============================= */
import { pick, lerpColor, blockPalette } from '../js/utils.js';
import { svgIcon } from '../js/icons.js';
import { drawSpaceApproach, drawStars } from '../js/decor-helpers.js';

const GHOST_TONES = ['#EAF3FF', '#CFEFE0', '#D8D0F2', '#F2E9D8'];
const TOMB_NAMES = ['ANA', 'JOSÉ', 'MARÍA', 'LUIS', 'ROSA', 'PEDRO', 'ELENA', 'CARLOS', 'SOFÍA', 'DIEGO', 'INÉS', 'MANUEL'];

export default {
  id: 'cemetery', name: 'Cementerio', icon: svgIcon('skull'),
  unlock: { type: 'coins', cost: 2000 },
  ground: '#2b2733',
  skyStops: [
    { k: 0, top: '#1a1330', bottom: '#3a2a4a' },
    { k: 600, top: '#140f26', bottom: '#2a2050' },
    { k: 1600, top: '#0c0920', bottom: '#1c1640' },
    { k: 3000, top: '#08061a', bottom: '#120e30' },
    { k: 5200, top: '#040310', bottom: '#0a0820' },
    { k: 8000, top: '#020103', bottom: '#08061a' }
  ],
  blockColor: '#A9A4C4',
  blocks: [blockPalette('#A9A4C4')],
  blockStyle: 'cemetery',
  layout: null,

  buildLayout(rng) {
    const tombs = [];
    for (let i = 0; i < 22; i++) {
      tombs.push({
        x: i * 100 + (rng() * 40 - 20),
        w: 46 + rng() * 44,
        h: 60 + rng() * 170,
        tone: 0.7 + rng() * 0.4,
        variant: Math.floor(rng() * 3), // 0 lápida redonda, 1 cruz, 2 losa plana
        glow: rng() < 0.35,
        hasPlaque: rng() < 0.7,
        name: pick(rng, TOMB_NAMES),
        year1: 1880 + Math.floor(rng() * 90),
        year2: 1930 + Math.floor(rng() * 90)
      });
    }
    // iglesia grande, única, muy al fondo (menor paralaje que las tumbas)
    const church = {
      x: 460 + rng() * 260,
      w: 380 + rng() * 70,
      h: 520 + rng() * 100,
      towerW: 70 + rng() * 16
    };
    const fog = [];
    for (let i = 0; i < 16; i++) fog.push({ x: i * 150 + (rng() * 60 - 30), w: 110 + rng() * 90, h: 50 + rng() * 90 });
    // fantasmas repartidos por toda la subida para que se vean desde el arranque
    const ghosts = [];
    for (let i = 0; i < 16; i++) {
      ghosts.push({
        x: rng() * 2400 - 600,
        y: 150 + rng() * 6800,
        range: 1400 + rng() * 900,
        s: 0.55 + rng() * 0.85,
        speed: 45 + rng() * 55,
        wobAmp: 18 + rng() * 40,
        wobSpeed: 0.5 + rng() * 1.0,
        phase: rng() * 6.28,
        tone: pick(rng, GHOST_TONES)
      });
    }
    const stars = [];
    for (let i = 0; i < 90; i++) stars.push({ x: rng() * 1000, y: 2200 + rng() * 3200, r: 0.6 + rng() * 1.6, tw: rng() * 6.28 });
    const planets = [];
    for (let i = 0; i < 5; i++) planets.push({ x: rng() * 1200 - 200, y: 3400 + rng() * 3000, r: 34 + rng() * 70, c1: pick(rng, ['#8C3A78', '#3E6B5A', '#5A4E9C', '#B8482E']), c2: pick(rng, ['#4A1D3E', '#1E362D', '#2A244E', '#5E2417']) });
    const meteors = [];
    for (let i = 0; i < 5; i++) meteors.push({ seed: rng() * 1000, y: 3600 + rng() * 3200, speed: 220 + rng() * 140, len: 60 + rng() * 50, ang: 0.5 + rng() * 0.3 });
    const bones = [];
    for (let i = 0; i < 24; i++) bones.push({ x: rng() * 1100, type: rng() < 0.5 ? 'skull' : 'bone', rot: rng() * 0.6 - 0.3, s: 0.7 + rng() * 0.6 });
    return { tombs, church, fog, ghosts, stars, planets, meteors, bones };
  },

  drawDecor(ctx, api) {
    const { L, gY, camH, CW, CH, time } = api;
    drawStars(ctx, L.stars, 0.35, gY, camH, CW, CH, time, 2600, 2600);
    drawSpaceApproach(ctx, L, gY, camH, CW, CH, time);

    // ---- iglesia grande al fondo (muy poco paralaje, para que se sienta lejana) ----
    this._drawChurch(ctx, L.church, gY, camH, CW, CH);

    // ---- niebla de cementerio (equivalente a la neblina urbana) ----
    ctx.save(); ctx.globalAlpha = 0.28;
    L.fog.forEach(f => {
      const top = gY - f.h + camH * 0.38;
      const bottom = gY + 50 + camH * 0.38;
      if (top > CH + 50 || bottom < -50) return;
      const fx = ((f.x % (CW + 260)) + CW + 260) % (CW + 260) - 130;
      const grad = ctx.createLinearGradient(0, top, 0, bottom);
      grad.addColorStop(0, 'rgba(200,205,220,0)');
      grad.addColorStop(0.5, 'rgba(200,205,220,.9)');
      grad.addColorStop(1, 'rgba(200,205,220,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(fx, top, f.w, bottom - top);
    });
    ctx.restore();

    // ---- fantasmas: vuelo ondulante de abajo hacia arriba, estilo poligonal 3D ----
    L.ghosts.forEach(g => {
      const riseOffset = ((time * g.speed) % g.range + g.range) % g.range;
      const worldY = g.y + riseOffset;
      const screenY = gY - worldY + camH * 0.32;
      if (screenY < -80 || screenY > CH + 80) return;
      const wob = Math.sin(time * g.wobSpeed + g.phase) * g.wobAmp;
      const screenX = ((g.x + wob) % (CW + 200) + CW + 200) % (CW + 200) - 100;
      const fadeIn = Math.min(1, riseOffset / 120);
      const fadeOut = Math.min(1, (g.range - riseOffset) / 160);
      this._drawGhost(ctx, screenX, screenY, g.s, g.tone, time, g.phase, Math.min(fadeIn, fadeOut));
    });

    // ---- tumbas ----
    L.tombs.forEach(t => {
      const top = gY - t.h + camH * 0.55;
      const bottom = gY + 30 + camH * 0.55;
      if (top > CH + 50 || bottom < -50) return;
      const tx = ((t.x % (CW + 300)) + CW + 300) % (CW + 300) - 150;
      const front = lerpColor('#5c5468', '#221f2c', 1 - t.tone);
      const side = lerpColor('#3c3648', '#161420', 1 - t.tone);
      const cap = lerpColor(front, '#ffffff', 0.1);
      const bd = 7 + t.w * 0.14;

      ctx.fillStyle = side;
      ctx.beginPath();
      ctx.moveTo(tx + t.w, top); ctx.lineTo(tx + t.w + bd, top - bd * 0.5); ctx.lineTo(tx + t.w + bd, bottom - bd * 0.5); ctx.lineTo(tx + t.w, bottom);
      ctx.closePath(); ctx.fill();

      if (t.variant === 1) {
        // cruz
        const cw = t.w * 0.28, ch = t.h * 0.4;
        const cx = tx + t.w / 2 - cw / 2, cy = top;
        ctx.fillStyle = front;
        ctx.fillRect(tx + t.w * 0.3, cy + ch * 0.55, t.w * 0.4, bottom - (cy + ch * 0.55));
        ctx.fillRect(cx, cy, cw, ch);
        ctx.fillRect(tx, cy + ch * 0.3, t.w, cw * 0.7);
        ctx.fillStyle = cap;
        ctx.fillRect(cx, cy, cw, cw * 0.5);
      } else if (t.variant === 0) {
        // lápida redonda
        ctx.fillStyle = front;
        ctx.beginPath();
        ctx.moveTo(tx, bottom);
        ctx.lineTo(tx, top + t.w * 0.5);
        ctx.arc(tx + t.w / 2, top + t.w * 0.5, t.w / 2, Math.PI, 0);
        ctx.lineTo(tx + t.w, bottom);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = cap;
        ctx.beginPath();
        ctx.arc(tx + t.w / 2, top + t.w * 0.5, t.w / 2, Math.PI * 1.1, Math.PI * 1.9);
        ctx.fill();
      } else {
        // losa plana
        ctx.fillStyle = front;
        ctx.fillRect(tx, top, t.w, bottom - top);
        ctx.fillStyle = cap;
        ctx.beginPath();
        ctx.moveTo(tx, top); ctx.lineTo(tx + bd, top - bd * 0.5); ctx.lineTo(tx + t.w + bd, top - bd * 0.5); ctx.lineTo(tx + t.w, top);
        ctx.closePath(); ctx.fill();
      }

      // grietas / musgo
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tx + t.w * 0.3, top + t.h * 0.3); ctx.lineTo(tx + t.w * 0.45, top + t.h * 0.55); ctx.stroke();

      // placa grabada con nombre y años (ajustada al ancho real de piedra de cada variante)
      let stoneCX = tx + t.w / 2, stoneW = t.w, plaqueTop = top + t.h * 0.3;
      if (t.variant === 1) {
        // en la cruz solo existe piedra en el brazo vertical (ancho t.w*0.4)
        stoneW = t.w * 0.4;
        const ch = t.h * 0.4;
        plaqueTop = top + ch * 0.62;
      } else if (t.variant === 0) {
        plaqueTop = top + t.w * 0.58;
      }
      const minPlaqueW = 30;
      if (t.hasPlaque && bottom - plaqueTop > 34 && stoneW >= minPlaqueW) {
        const pW = Math.min(stoneW - 8, stoneW * 0.86);
        const pH = Math.min(40, (bottom - plaqueTop) * 0.55, pW * 0.66);
        const pX = stoneCX - pW / 2, pY = plaqueTop + 4;
        ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1;
        ctx.strokeRect(pX, pY, pW, pH);
        ctx.strokeStyle = 'rgba(255,255,255,.10)';
        ctx.strokeRect(pX + 2, pY + 2, pW - 4, pH - 4);
        ctx.fillStyle = 'rgba(20,16,26,.55)';
        const nameSize = Math.max(6, Math.min(pW * 0.16, pH * 0.32));
        ctx.font = `${nameSize}px Georgia, "Times New Roman", serif`;
        ctx.textAlign = 'center';
        ctx.save();
        ctx.beginPath(); ctx.rect(pX, pY, pW, pH); ctx.clip();
        ctx.fillText(t.name, stoneCX, pY + pH * 0.44);
        ctx.font = `${Math.max(5, nameSize * 0.62)}px Georgia, "Times New Roman", serif`;
        ctx.fillText(`${t.year1} - ${t.year2}`, stoneCX, pY + pH * 0.78);
        ctx.restore();
      }

      // sombra de contacto con el piso
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      ctx.beginPath(); ctx.ellipse(tx + t.w / 2, bottom + 2, t.w * 0.6, 4, 0, 0, 6.283); ctx.fill();

      if (t.glow) {
        const gx = tx + t.w * 0.5, gyw = bottom - 8;
        const flick = 0.4 + 0.3 * Math.sin(time * 3 + t.x);
        ctx.fillStyle = `rgba(140,255,180,${flick.toFixed(2)})`;
        ctx.beginPath(); ctx.arc(gx, gyw, 3.5, 0, 6.283); ctx.fill();
      }
    });

    // ---- suelo: camino de tierra con hilera de lápidas al fondo ----
    const gy2 = gY + camH * 1.0;
    if (gy2 > -10 && gy2 < CH + 200) {
      const grassH = 15, curbH = 5;
      const grassY = gy2 - grassH - curbH;
      ctx.fillStyle = '#3d4636';
      ctx.fillRect(0, grassY, CW, grassH);
      ctx.fillStyle = 'rgba(0,0,0,.2)';
      for (let x = 6; x < CW; x += 21) ctx.fillRect(x, grassY + 2, 2, grassH - 4);
      ctx.fillStyle = '#26232c';
      ctx.fillRect(0, grassY + grassH, CW, curbH);

      ctx.fillStyle = this.ground;
      ctx.fillRect(0, gy2, CW, CH - gy2 + 300);
      const vanishW = CW * 0.22;
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      ctx.beginPath();
      ctx.moveTo(CW / 2 - vanishW / 2, gy2); ctx.lineTo(CW / 2 + vanishW / 2, gy2); ctx.lineTo(CW, gy2 + 120); ctx.lineTo(0, gy2 + 120);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.setLineDash([16, 16]); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, gy2 + 30); ctx.lineTo(CW, gy2 + 30); ctx.stroke(); ctx.setLineDash([]);

      // huesos y calaveras dispersos en el camino
      L.bones.forEach(b => {
        const bx = ((b.x % CW) + CW) % CW;
        const by = gy2 + 34 + Math.sin(b.x) * 6;
        ctx.save();
        ctx.translate(bx, by); ctx.rotate(b.rot); ctx.scale(b.s, b.s);
        ctx.fillStyle = '#d9d3c4';
        if (b.type === 'skull') {
          ctx.beginPath(); ctx.arc(0, 0, 6, 0, 6.283); ctx.fill();
          ctx.fillRect(-4, 3, 3, 4); ctx.fillRect(1, 3, 3, 4);
          ctx.fillStyle = '#26232c';
          ctx.beginPath(); ctx.arc(-2.2, -0.5, 1.4, 0, 6.283); ctx.fill();
          ctx.beginPath(); ctx.arc(2.2, -0.5, 1.4, 0, 6.283); ctx.fill();
        } else {
          ctx.fillRect(-9, -1.5, 18, 3);
          ctx.beginPath(); ctx.arc(-9, 0, 2.5, 0, 6.283); ctx.fill();
          ctx.beginPath(); ctx.arc(9, 0, 2.5, 0, 6.283); ctx.fill();
        }
        ctx.restore();
      });
    }
  },

  _drawGhost(ctx, x, y, s, tone, time, phase, fade) {
    if (fade <= 0) return;
    const flicker = 0.55 + 0.25 * Math.sin(time * 2.4 + phase);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(time * 0.8 + phase) * 0.12);
    ctx.scale(s, s);

    const body = [
      [0, -30], [14, -22], [18, -6], [18, 10],
      [10, 5], [4, 14], [0, 5], [-4, 14], [-10, 5],
      [-18, 10], [-18, -6], [-14, -22]
    ];

    // estela (eco poligonal detrás, más tenue) sugiriendo el movimiento ascendente
    ctx.save();
    ctx.globalAlpha = fade * flicker * 0.28;
    ctx.translate(-Math.sin(time * g_ghostTrailSeed(phase)) * 3, 14);
    ctx.scale(0.85, 0.85);
    ctx.fillStyle = lerpColor(tone, '#100c1c', 0.6);
    drawPolyPath(ctx, body);
    ctx.fill();
    ctx.restore();

    // cara lateral (bisel) para el efecto 3D poligonal
    ctx.save();
    ctx.globalAlpha = fade * flicker * 0.9;
    ctx.translate(5, -3);
    ctx.fillStyle = lerpColor(tone, '#1c1830', 0.45);
    drawPolyPath(ctx, body);
    ctx.fill();
    ctx.restore();

    // cuerpo frontal
    ctx.globalAlpha = fade * flicker;
    ctx.fillStyle = tone;
    drawPolyPath(ctx, body);
    ctx.fill();

    // ojos
    ctx.globalAlpha = fade;
    ctx.fillStyle = '#241f38';
    ctx.beginPath(); ctx.arc(-6, -8, 2.3, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(6, -8, 2.3, 0, 6.283); ctx.fill();

    ctx.restore();
  },

  _drawChurch(ctx, c, gY, camH, CW, CH) {
    const parallax = 0.2; // muy al fondo: se mueve más lento que las tumbas
    const top = gY - c.h + camH * parallax;
    const bottom = gY + 30 + camH * parallax;
    if (top > CH + 80 || bottom < -80) return;
    const cx = ((c.x % (CW + 700)) + CW + 700) % (CW + 700) - 350;

    const front = '#211d2c', side = '#131019', roofFront = '#2a1f26', roofSide = '#160f14';
    const bd = 20;

    // halo de luna detrás, para que se recorte como silueta imponente
    const haloR = c.w * 1.05;
    const grad = ctx.createRadialGradient(cx + c.w / 2, top + c.h * 0.22, 4, cx + c.w / 2, top + c.h * 0.22, haloR);
    grad.addColorStop(0, 'rgba(120,120,180,.18)');
    grad.addColorStop(1, 'rgba(120,120,180,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx + c.w / 2, top + c.h * 0.22, haloR, 0, 6.283); ctx.fill();

    // niveles clave (de arriba hacia abajo)
    const yTip = top;                    // punta de la aguja
    const yRoofBase = top + c.h * 0.10;  // base del techito de la torre
    const yBelfryTop = yRoofBase;
    const yBelfryBot = top + c.h * 0.26; // base del cuerpo de campanas
    const yGableApex = top + c.h * 0.30; // cumbrera del frontón, donde nace la torre visible
    const yEave = top + c.h * 0.50;      // alero: donde el frontón se apoya en la fachada
    const yBottom = bottom;
    const tw = c.towerW, tx0 = cx + c.w / 2 - tw / 2;

    // --- torre: tramo que baja detrás del frontón (arranca justo debajo del campanario, sin hueco) ---
    this._bevelRect(ctx, tx0, yBelfryBot, tw, (yEave + 30) - yBelfryBot, bd * 0.4, front, side);

    // --- cuerpo de campanas con arco y campana ---
    this._bevelRect(ctx, tx0, yBelfryTop, tw, yBelfryBot - yBelfryTop, bd * 0.4, front, side);
    const archW = tw * 0.52, archX = tx0 + tw / 2 - archW / 2, archTop = yBelfryTop + tw * 0.22;
    ctx.fillStyle = 'rgba(5,4,8,.85)';
    ctx.beginPath();
    ctx.moveTo(archX, yBelfryBot - 3); ctx.lineTo(archX, archTop + archW / 2);
    ctx.arc(archX + archW / 2, archTop + archW / 2, archW / 2, Math.PI, 0);
    ctx.lineTo(archX + archW, yBelfryBot - 3);
    ctx.closePath(); ctx.fill();
    // campana asomando en el hueco
    const bellCX = archX + archW / 2, bellCY = yBelfryBot - archW * 0.42;
    ctx.fillStyle = 'rgba(150,130,90,.55)';
    ctx.beginPath();
    ctx.moveTo(bellCX - archW * 0.22, bellCY); ctx.quadraticCurveTo(bellCX - archW * 0.24, bellCY - archW * 0.4, bellCX, bellCY - archW * 0.42);
    ctx.quadraticCurveTo(bellCX + archW * 0.24, bellCY - archW * 0.4, bellCX + archW * 0.22, bellCY);
    ctx.lineTo(bellCX + archW * 0.28, bellCY + archW * 0.08); ctx.lineTo(bellCX - archW * 0.28, bellCY + archW * 0.08);
    ctx.closePath(); ctx.fill();

    // --- techito piramidal de la torre + aguja + cruz ---
    ctx.fillStyle = roofSide;
    ctx.beginPath();
    ctx.moveTo(tx0 + tw / 2, yTip + tw * 0.15); ctx.lineTo(tx0 + tw + 6, yRoofBase); ctx.lineTo(tx0 + tw / 2, yRoofBase + tw * 0.12);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = roofFront;
    ctx.beginPath();
    ctx.moveTo(tx0 + tw / 2, yTip + tw * 0.15); ctx.lineTo(tx0 - 6, yRoofBase); ctx.lineTo(tx0 + tw / 2, yRoofBase + tw * 0.12);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(10,8,14,.9)'; ctx.lineWidth = 2.6;
    const crossX = tx0 + tw / 2, crossY = yTip + tw * 0.15;
    ctx.beginPath(); ctx.moveTo(crossX, crossY - 18); ctx.lineTo(crossX, crossY + 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(crossX - 7, crossY - 11); ctx.lineTo(crossX + 7, crossY - 11); ctx.stroke();

    // --- frontón (pediment) triangular con cruz tallada ---
    this._bevelTri(ctx, cx - 16, yEave, cx + c.w / 2, yGableApex, cx + c.w + 16, yEave, bd * 0.6, roofFront, roofSide);
    ctx.strokeStyle = 'rgba(10,8,14,.85)'; ctx.lineWidth = 2.2;
    const gCrossX = cx + c.w / 2, gCrossY = (yGableApex + yEave) / 2 + 6;
    ctx.beginPath(); ctx.moveTo(gCrossX, gCrossY - 12); ctx.lineTo(gCrossX, gCrossY + 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gCrossX - 6, gCrossY - 6); ctx.lineTo(gCrossX + 6, gCrossY - 6); ctx.stroke();

    // --- fachada principal ---
    this._bevelRect(ctx, cx, yEave, c.w, yBottom - yEave, bd, front, side);

    // contrafuertes de piedra repartidos por toda la fachada (no solo en las esquinas)
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1;
    for (let sx of [cx + c.w * 0.05, cx + c.w * 0.16, cx + c.w * 0.5, cx + c.w * 0.84, cx + c.w * 0.95]) {
      for (let ly = yEave + 8; ly < yBottom - 6; ly += 11) { ctx.beginPath(); ctx.moveTo(sx - 5, ly); ctx.lineTo(sx + 5, ly); ctx.stroke(); }
    }

    // ventanas en arco con óculo redondo arriba, repartidas a ambos lados de la puerta
    [cx + c.w * 0.1, cx + c.w * 0.24, cx + c.w * 0.76, cx + c.w * 0.9].forEach(wx => {
      const oR = c.w * 0.022;
      ctx.fillStyle = 'rgba(150,140,200,.24)';
      ctx.beginPath(); ctx.arc(wx, yEave + c.h * 0.09, oR, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(10,8,14,.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(wx, yEave + c.h * 0.09, oR, 0, 6.283); ctx.stroke();

      const wW = c.w * 0.06, wH = c.h * 0.16, wTop = yEave + c.h * 0.16;
      ctx.fillStyle = 'rgba(150,140,200,.22)';
      ctx.beginPath();
      ctx.moveTo(wx - wW / 2, wTop + wH); ctx.lineTo(wx - wW / 2, wTop + wW / 2);
      ctx.arc(wx, wTop + wW / 2, wW / 2, Math.PI, 0);
      ctx.lineTo(wx + wW / 2, wTop + wH);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(10,8,14,.7)'; ctx.lineWidth = 1;
      ctx.stroke();
    });

    // puerta principal, arco grande
    const doorW = c.w * 0.2, doorH = (yBottom - yEave) * 0.62;
    const doorX = cx + c.w / 2 - doorW / 2, doorY = yBottom - doorH;
    ctx.fillStyle = 'rgba(5,4,8,.9)';
    ctx.beginPath();
    ctx.moveTo(doorX, yBottom); ctx.lineTo(doorX, doorY + doorW / 2);
    ctx.arc(doorX + doorW / 2, doorY + doorW / 2, doorW / 2, Math.PI, 0);
    ctx.lineTo(doorX + doorW, yBottom);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(doorX + doorW / 2, doorY + doorW * 0.15); ctx.lineTo(doorX + doorW / 2, yBottom); ctx.stroke();

    // zócalo de piedra en la base
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.fillRect(cx - 6, yBottom - 6, c.w + 12, 10);
  },

  _bevelRect(ctx, x, y, w, h, bd, frontColor, sideColor) {
    ctx.fillStyle = sideColor;
    ctx.beginPath();
    ctx.moveTo(x + w, y); ctx.lineTo(x + w + bd, y - bd * 0.5); ctx.lineTo(x + w + bd, y + h - bd * 0.5); ctx.lineTo(x + w, y + h);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = frontColor;
    ctx.fillRect(x, y, w, h);
  },

  _bevelTri(ctx, x0, y0, xApex, yApex, x1, y1, bd, frontColor, sideColor) {
    ctx.fillStyle = sideColor;
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x1 + bd, y1 - bd * 0.5); ctx.lineTo(xApex + bd, yApex - bd * 0.5); ctx.lineTo(xApex, yApex);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = frontColor;
    ctx.beginPath();
    ctx.moveTo(x0, y0); ctx.lineTo(xApex, yApex); ctx.lineTo(x1, y1); ctx.closePath(); ctx.fill();
  },

  drawBlockDetail(ctx, x0, x1, fY, yBottom) {
    // textura de piedra grabada, como una lápida vista de frente
    ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1;
    for (let wy = fY + 6; wy < yBottom - 4; wy += 7) { ctx.beginPath(); ctx.moveTo(x0 + 3, wy); ctx.lineTo(x1 - 3, wy); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo((x0 + x1) / 2, fY + 4); ctx.lineTo((x0 + x1) / 2, yBottom - 4); ctx.stroke();
    // musgo/brillo diagonal
    ctx.fillStyle = 'rgba(140,255,180,.10)';
    const w = x1 - x0;
    ctx.beginPath(); ctx.moveTo(x0, yBottom); ctx.lineTo(x0 + w * 0.3, fY); ctx.lineTo(x0 + w * 0.16, fY); ctx.lineTo(x0, yBottom - w * 0.12); ctx.closePath(); ctx.fill();
  }
};

function drawPolyPath(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

function g_ghostTrailSeed(phase) { return 1.6 + (phase % 1); }