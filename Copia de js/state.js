/* ============================= GAME CONSTANTS ============================= */
export const BH = 42;              // block height (world px)
export const ANCHOR_ROWS = 5;
export const PERFECT_PX = 6;
export const BASE_SPEED = 155;
export const SPEED_PER_BLOCK = 2.6;
export const MAX_SPEED = 560;
export const GROUND_MARGIN = 96;
export const SPACE_REACH_HEIGHT = 5200; // world height (camH) at which city/forest count as "reaching space"

/* ============================= GAME STATE ============================= */
export const G = {
  mode: 'demo',            // 'demo' | 'playing' | 'gameover' | 'paused'
  theme: null,
  blocks: [],              // placed blocks {x,w,bottom,top,colorIdx}
  moving: null,            // {x,w,bottom,top,dir,speed,colorIdx}
  debris: [],
  particles: [],
  camH: 0, camTarget: 0,
  score: 0, perfects: 0, combo: 0,
  running: false, lastT: 0,
  shake: 0,
  demoTimer: 0, demoColorIdx: 0,
  bestMarkShown: false,
  collapseAt: 0,
  time: 0
};

import { size } from './canvas.js';
export function groundScreenY() { return size.CH - GROUND_MARGIN; }
export function worldToScreenY(h) { return groundScreenY() - h + G.camH; }
