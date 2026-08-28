/* ============================= THEME REGISTRY ============================= */
/* Cada nivel vive en su propio módulo dentro de /levels con su propio .js y .css
   (ver index.html). Para agregar un nivel nuevo: crear /levels/<id>.js + <id>.css
   e importarlo aquí — no hace falta tocar el resto del motor. */
import city from '../levels/city.js';
import forest from '../levels/forest.js';
import space from '../levels/space.js';
import candy from '../levels/candy.js';
import medieval from '../levels/medieval.js';
import farm from '../levels/farm.js';
import japan from '../levels/japan.js';
import { mulberry32 } from './utils.js';

const LEVEL_MODULES = [city, forest, space, candy, medieval, farm, japan];

export const THEMES = {};
LEVEL_MODULES.forEach(t => { THEMES[t.id] = t; });
export const THEME_ORDER = LEVEL_MODULES.map(t => t.id);

export function getLayout(theme) {
  if (!theme.layout) { const rng = mulberry32(theme.name.length * 777 + 1); theme.layout = theme.buildLayout(rng); }
  return theme.layout;
}