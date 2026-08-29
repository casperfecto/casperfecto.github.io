/* ============================= LEVEL: DULCE ============================= */
import { pick, shade, lerpColor, blockPalette, clamp } from '../js/utils.js';
import { svgIcon } from '../js/icons.js';
import { drawStars, drawSpaceApproach } from '../js/decor-helpers.js';

/* paletas pastel que alternan entre los mechones de cada algodón de azúcar,
   para lograr el clásico remolino bicolor -- mismo lenguaje "poligonal facetado"
   que el resto del set (nubes/planetas), solo que más esponjoso y redondeado */
const COTTON_PALETTES = [
  { light: '#FFE4F5', dark: '#F2A8D6' }, // rosa
  { light: '#E6ECFF', dark: '#BBAEF7' }  // lila
];

const COTTON_PUFFS = [
  { dx: -40, dy: -3, r: 24, c: 0 },
  { dx: -19, dy: -17, r: 27, c: 1 },
  { dx: 9, dy: -19, r: 26, c: 0 },
  { dx: 36, dy: -7, r: 22, c: 1 },
  { dx: -5, dy: 7, r: 25, c: 1 },
  { dx: 21, dy: 9, r: 20, c: 0 },
  { dx: -29, dy: 13, r: 18, c: 1 }
];

function polyPuffRound(ctx, cx, cy, r, cLight, cDark) {
  const N = 8;

  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / N) * Math.PI * 2 - Math.PI / 2;
    const shadeAmt = 0.2 + 0.8 * Math.max(0, Math.sin((a0 + a1) / 2 + 0.9));

    ctx.fillStyle = lerpColor(cDark, cLight, shadeAmt);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(a0) * r,
      cy + Math.sin(a0) * r * 0.86
    );
    ctx.lineTo(
      cx + Math.cos(a1) * r,
      cy + Math.sin(a1) * r * 0.86
    );
    ctx.closePath();
    ctx.fill();
  }
}

/* algodón de azúcar flotando en un palito, mismo estilo facetado que las nubes originales */
function drawCottonCandy(ctx, x, y, s, twist) {
  const stickH = 30 * s;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(twist * 0.12);

  ctx.strokeStyle = '#E8C9A0';
  ctx.lineWidth = 3 * s;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(0, 16 * s);
  ctx.lineTo(0, 16 * s + stickH);
  ctx.stroke();

  COTTON_PUFFS.forEach(p => {
    const pal = COTTON_PALETTES[p.c];
    polyPuffRound(
      ctx,
      p.dx * s,
      p.dy * s,
      p.r * s,
      pal.light,
      pal.dark
    );
  });

  ctx.restore();
}

function drawCottonCandyLayer(ctx, list, camFactor, gY, camH, CW, CH, time, alphaFn) {
  ctx.save();

  list.forEach(c => {
    const sy =
      gY -
      c.y +
      camH * camFactor +
      Math.sin(time * 0.5 + (c.bob || 0)) * 4;

    if (sy < -90 || sy > CH + 90) return;

    const span = CW + 400;
    const cx =
      (((c.x + time * (c.drift || 10)) % span) + span) % span - 200;

    ctx.globalAlpha = alphaFn ? alphaFn(sy) : 0.95;

    if (ctx.globalAlpha <= 0) return;

    drawCottonCandy(ctx, cx, sy, c.s, c.twist || 0);
  });

  ctx.restore();
}

/* ============================= CALLE DE CHOCOLATE ============================= */
/*
   La calle sustituye únicamente al suelo plano original.
   Se mantiene en la misma posición y con las mismas dimensiones de referencia,
   pero ahora se representa como una tableta de chocolate low-poly:
   - cara superior
   - lateral frontal
   - lateral de profundidad
   - cuadrícula de porciones
   - pequeños biseles facetados
*/
function drawChocolateRoad(ctx, gy, CW, CH) {
  const roadH = Math.max(190, CH - gy + 40);

  const depth = Math.min(26, Math.max(18, roadH * 0.12));
  const topY = gy;
  const bottomY = gy + roadH;
  const sideY = Math.min(bottomY, topY + depth);

  const tileW = 58;
  const tileH = 42;

  /* Cara superior completa */
  ctx.fillStyle = '#6B2A18';
  ctx.fillRect(0, topY, CW, roadH);

  /* Faceta superior de iluminación */
  ctx.fillStyle = '#7C3520';
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(CW, topY);
  ctx.lineTo(CW, topY + 8);
  ctx.lineTo(0, topY + 8);
  ctx.closePath();
  ctx.fill();

  /*
     Porciones de chocolate.
     Las líneas no salen de la tableta y se mantienen discretas para conservar
     el aspecto limpio y poligonal del escenario.
  */
  const usableH = Math.max(1, roadH);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, topY, CW, usableH);
  ctx.clip();

  const rows = Math.ceil(usableH / tileH) + 1;
  const cols = Math.ceil(CW / tileW) + 1;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * tileW;
      const y = topY + row * tileH;

      /*
         Cada porción recibe una pequeña variación geométrica para evitar
         que parezca una textura plana.
      */
      const inset = 4;
      const w = tileW - inset * 2;
      const h = tileH - inset * 2;

      const light = ((row + col) % 3 === 0)
        ? '#7A321D'
        : '#692718';

      const dark = ((row + col) % 2 === 0)
        ? '#4B1C10'
        : '#43170D';

      /* Cara principal de la porción */
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.moveTo(x + inset, y + inset);
      ctx.lineTo(x + inset + w - 5, y + inset);
      ctx.lineTo(x + inset + w, y + inset + 5);
      ctx.lineTo(x + inset + w, y + inset + h);
      ctx.lineTo(x + inset + 5, y + inset + h);
      ctx.lineTo(x + inset, y + inset + h - 5);
      ctx.closePath();
      ctx.fill();

      /* Faceta superior */
      ctx.fillStyle = shade(light, 0.16);
      ctx.beginPath();
      ctx.moveTo(x + inset, y + inset);
      ctx.lineTo(x + inset + w - 5, y + inset);
      ctx.lineTo(x + inset + w - 9, y + inset + 5);
      ctx.lineTo(x + inset + 6, y + inset + 5);
      ctx.closePath();
      ctx.fill();

      /* Faceta lateral */
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(x + inset + w - 5, y + inset);
      ctx.lineTo(x + inset + w, y + inset + 5);
      ctx.lineTo(x + inset + w, y + inset + h);
      ctx.lineTo(x + inset + w - 5, y + inset + h - 5);
      ctx.closePath();
      ctx.fill();

      /* Separación profunda entre porciones */
      ctx.strokeStyle = 'rgba(45, 14, 7, .72)';
      ctx.lineWidth = 3;

      if (x + tileW < CW - 1) {
        ctx.beginPath();
        ctx.moveTo(x + tileW, y + 3);
        ctx.lineTo(x + tileW, y + tileH - 3);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(x + 3, y + tileH);
      ctx.lineTo(x + tileW - 3, y + tileH);
      ctx.stroke();
    }
  }

  /* Brillos geométricos mínimos sobre algunas porciones */
  ctx.fillStyle = 'rgba(255, 196, 142, .16)';

  for (let col = 0; col < cols; col += 2) {
    const x = col * tileW + 11;

    ctx.beginPath();
    ctx.moveTo(x, topY + 12);
    ctx.lineTo(x + 22, topY + 12);
    ctx.lineTo(x + 16, topY + 17);
    ctx.lineTo(x + 5, topY + 17);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();

}

export default {
  id: 'candy',
  name: 'Dulce',
  icon: svgIcon('candy'),

  unlock: { type: 'coins', cost: 1000 },

  ground: '#8a5a9c',

  skyStops: [
    { k: 0, top: '#FFC9E8', bottom: '#FFF0CE' },
    { k: 900, top: '#C9B6FF', bottom: '#FFD9EE' },
    { k: 2200, top: '#9B8CFF', bottom: '#D9BCFF' },
    { k: 4000, top: '#5E5AC9', bottom: '#A98CE0' },
    { k: 6200, top: '#2C2470', bottom: '#5A4AA0' },
    { k: 9000, top: '#0E0A2C', bottom: '#231566' }
  ],

  blockColor: '#FF9AC0',
  blocks: [blockPalette('#FF9AC0')],
  blockStyle: 'candy',
  layout: null,

  buildLayout(rng) {
    const hills = [];

    for (let i = 0; i < 10; i++) {
      hills.push({
        x: i * 260 + (rng() * 60 - 30),
        w: 220 + rng() * 140,
        h: 80 + rng() * 90,
        c: pick(rng, [
          '#FF9AC0',
          '#8FE0B0',
          '#FFD97A',
          '#B3A0F5'
        ])
      });
    }

    const rainbows = [];

    for (let i = 0; i < 5; i++) {
      rainbows.push({
        x: rng() * 1400 - 200,
        y: 1600 + rng() * 2600,
        s: 0.7 + rng() * 0.8
      });
    }

    const crystals = [];

    for (let i = 0; i < 9; i++) {
      crystals.push({
        x: i * 230 + (rng() * 70 - 35),
        y: 900 + rng() * 3200,
        w: 44 + rng() * 36,
        h: 110 + rng() * 140,
        c: pick(rng, [
          '#FF9AC0',
          '#B3A0F5',
          '#8FE0B0',
          '#FFD97A'
        ])
      });
    }

    // algodones de azúcar flotando: repartidos desde ras de piso hasta bien arriba
    // para que se vean apenas arranca la partida
    const clouds = [];

    for (let i = 0; i < 13; i++) {
      clouds.push({
        x: rng() * 2400 - 600,
        y: 220 + rng() * 2300,
        s: 0.6 + rng() * 0.9,
        drift: 5 + rng() * 9,
        bob: rng() * 6.28,
        twist: rng() * 2 - 1
      });
    }

    const stars = [];

    for (let i = 0; i < 90; i++) {
      stars.push({
        x: rng() * 1000,
        y: 2200 + rng() * 3200,
        r: 0.7 + rng() * 1.8,
        tw: rng() * 6.28
      });
    }

    // planetas y meteoros: aparecen al llegar al espacio, igual que en
    // Ciudad/Bosque/Granja -- Dulce también cuenta para desbloquear Marte
    const planets = [];

    for (let i = 0; i < 5; i++) {
      planets.push({
        x: rng() * 1200 - 200,
        y: 3400 + rng() * 3000,
        r: 32 + rng() * 68,
        c1: pick(rng, [
          '#E58AC9',
          '#7FDBDA',
          '#F5D76E',
          '#9CA8FF'
        ]),
        c2: pick(rng, [
          '#8C3A78',
          '#227271',
          '#9C7A22',
          '#5A66C9'
        ])
      });
    }

    const meteors = [];

    for (let i = 0; i < 5; i++) {
      meteors.push({
        seed: rng() * 1000,
        y: 3600 + rng() * 3200,
        speed: 200 + rng() * 140,
        len: 60 + rng() * 50,
        ang: 0.5 + rng() * 0.3
      });
    }

    return {
      hills,
      rainbows,
      crystals,
      clouds,
      stars,
      planets,
      meteors
    };
  },

  drawDecor(ctx, api) {
    const { L, gY, camH, CW, CH, time } = api;

    drawStars(
      ctx,
      L.stars,
      0.35,
      gY,
      camH,
      CW,
      CH,
      time,
      3200,
      2600
    );

    drawSpaceApproach(
      ctx,
      L,
      gY,
      camH,
      CW,
      CH,
      time
    );

    L.rainbows.forEach(r => {
      const sy = gY - r.y + camH * 0.3;

      if (sy < -260 || sy > CH + 120) return;

      const rx =
        ((r.x % (CW + 500)) + CW + 500) % (CW + 500) - 250;

      const cols = [
        '#FF9AC0',
        '#FFD97A',
        '#D4F3E0',
        '#B3A0F5'
      ];

      for (let i = 0; i < cols.length; i++) {
        ctx.strokeStyle = cols[i];
        ctx.lineWidth = 14 * r.s;
        ctx.beginPath();
        ctx.arc(
          rx,
          sy + 120 * r.s,
          150 * r.s - i * 15 * r.s,
          Math.PI,
          0
        );
        ctx.stroke();
      }
    });

    drawCottonCandyLayer(
      ctx,
      L.clouds,
      0.4,
      gY,
      camH,
      CW,
      CH,
      time,
      () => 0.95 * (1 - clamp((camH - 4600) / 1800, 0, 1))
    );

    // cristales de caramelo -- ahora con una chispa de brillo facetada encima
    L.crystals.forEach(c => {
      const top = gY - c.h + camH * 0.5;
      const bottom = gY + 30 + camH * 0.5;

      if (top > CH + 50 || bottom < -50) return;

      const cx2 =
        ((c.x % (CW + 260)) + CW + 260) % (CW + 260) - 130;

      const front = c.c;
      const side = shade(c.c, -0.3);
      const tip = shade(c.c, 0.35);

      ctx.fillStyle = side;
      ctx.beginPath();
      ctx.moveTo(cx2 + c.w / 2, top + 18);
      ctx.lineTo(cx2 + c.w / 2 + 9, top + 10);
      ctx.lineTo(cx2 + c.w / 2 + 9, bottom - 6);
      ctx.lineTo(cx2 + c.w / 2, bottom);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = front;
      ctx.beginPath();
      ctx.moveTo(cx2, top);
      ctx.lineTo(cx2 + c.w / 2, top + 18);
      ctx.lineTo(cx2 + c.w / 2, bottom);
      ctx.lineTo(cx2 - c.w / 2, bottom);
      ctx.lineTo(cx2 - c.w / 2, top + 18);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = tip;
      ctx.beginPath();
      ctx.moveTo(cx2, top);
      ctx.lineTo(cx2 + c.w / 2, top + 18);
      ctx.lineTo(cx2 - c.w / 2, top + 18);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.beginPath();
      ctx.moveTo(cx2 - 2, top + 22);
      ctx.lineTo(cx2 + 4, top + 34);
      ctx.lineTo(cx2 - 2, top + 46);
      ctx.lineTo(cx2 - 8, top + 34);
      ctx.closePath();
      ctx.fill();
    });

    // colinas de gomita: ahora facetadas (dos caras low-poly + brillo) en vez de
    // una simple elipse plana, para que se sientan parte del mismo mundo poligonal
    L.hills.forEach(h => {
      const base = gY + 40 + camH * 0.5;

      if (base - h.h > CH + 50 || base < -50) return;

      const hx =
        ((h.x % (CW + 320)) + CW + 320) % (CW + 320) - 160;

      const domeTop = base - h.h;

      const left = lerpColor(h.c, '#1a0a20', 0.18);
      const right = shade(h.c, 0.22);

      ctx.fillStyle = left;
      ctx.beginPath();
      ctx.moveTo(hx - h.w / 2, base);
      ctx.lineTo(hx - h.w * 0.06, domeTop);
      ctx.lineTo(hx, base - h.h * 0.88);
      ctx.lineTo(hx, base);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = right;
      ctx.beginPath();
      ctx.moveTo(hx, base);
      ctx.lineTo(hx, base - h.h * 0.88);
      ctx.lineTo(hx + h.w * 0.1, domeTop);
      ctx.lineTo(hx + h.w / 2, base);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,.4)';
      ctx.beginPath();
      ctx.ellipse(
        hx - h.w * 0.12,
        domeTop + h.h * 0.22,
        h.w * 0.1,
        h.h * 0.14,
        -0.4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    /*
       ÚNICO CAMBIO DEL ESCENARIO:
       el suelo/calle plano original se sustituye por una tableta de chocolate
       facetada, manteniendo exactamente su zona de dibujo y su posición.
    */
    const gy2 = gY + camH * 1.0;

    if (gy2 > -10 && gy2 < CH + 200) {
      drawChocolateRoad(ctx, gy2, CW, CH);
    }
  },

  drawBlockDetail(ctx, x0, x1, fY, yBottom, w) {
    ctx.strokeStyle = 'rgba(255,255,255,.6)';
    ctx.lineWidth = 5;

    for (let d = -yBottom; d < w + (yBottom - fY); d += 16) {
      ctx.beginPath();
      ctx.moveTo(x0 + d, yBottom);
      ctx.lineTo(
        x0 + d + (yBottom - fY),
        fY
      );
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.fillRect(x0, fY, w, 4);
  }
};