(function(){
"use strict";

/* ============================= UTILS ============================= */
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function lerp(a,b,t){return a+(b-a)*t;}
function hexToRgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return[(n>>16)&255,(n>>8)&255,n&255];}
function rgbToHex(r,g,b){return '#'+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');}
function lerpColor(c1,c2,t){const a=hexToRgb(c1),b=hexToRgb(c2);return rgbToHex(lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t));}
function shade(hex,amt){ // amt>0 lighten toward white, amt<0 darken toward black
  const c=hexToRgb(hex);
  if(amt>=0) return rgbToHex(lerp(c[0],255,amt),lerp(c[1],255,amt),lerp(c[2],255,amt));
  return rgbToHex(lerp(c[0],0,-amt),lerp(c[1],0,-amt),lerp(c[2],0,-amt));
}
function blockPalette(base){
  return { top:shade(base,0.38), front:base, side:shade(base,-0.30), edge:shade(base,-0.5) };
}
function mulberry32(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function pick(rng,arr){return arr[Math.floor(rng()*arr.length)];}

/* interpolate a stop-list keyed by numeric key 'k' */
function sampleStops(stops,k,fields){
  if(k<=stops[0].k) return stops[0];
  if(k>=stops[stops.length-1].k) return stops[stops.length-1];
  for(let i=0;i<stops.length-1;i++){
    const a=stops[i], b=stops[i+1];
    if(k>=a.k && k<=b.k){
      const t=(k-a.k)/(b.k-a.k);
      const out={};
      fields.forEach(f=>{ out[f]= (typeof a[f]==='string') ? lerpColor(a[f],b[f],t) : lerp(a[f],b[f],t); });
      return out;
    }
  }
  return stops[stops.length-1];
}

/* ============================= STORAGE ============================= */
const SAVE_KEY='torrePerfectaSaveV1';
function defaultProfile(){
  return {
    coins:60, xp:0, selectedTheme:'city',
    unlocked:['city'],
    best:{ city:{score:0,height:0}, forest:{score:0,height:0}, space:{score:0,height:0}, candy:{score:0,height:0} },
    sound:true, totalGames:0, reachedSpace:false
  };
}
function loadProfile(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(!raw) return defaultProfile();
    const p=JSON.parse(raw);
    const d=defaultProfile();
    return Object.assign(d,p,{best:Object.assign(d.best,p.best||{})});
  }catch(e){ return defaultProfile(); }
}
function saveProfile(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(profile)); }catch(e){} }
let profile = loadProfile();

/* ============================= LEVELS ============================= */
function xpNeeded(level){ return Math.round(90 + (level-1)*55); }
function levelFromXP(xp){
  let level=1, remain=xp;
  while(remain>=xpNeeded(level)){ remain-=xpNeeded(level); level++; }
  return { level, into:remain, need:xpNeeded(level) };
}

/* ============================= AUDIO ============================= */
const Audio1 = (function(){
  let ctx=null;
  function ensure(){ if(!ctx){ try{ ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } return ctx; }
  function tone(freq,dur,type,gain,delay){
    if(!profile.sound) return;
    const c=ensure(); if(!c) return;
    const t0=c.currentTime+(delay||0);
    const osc=c.createOscillator(); const g=c.createGain();
    osc.type=type||'sine'; osc.frequency.setValueAtTime(freq,t0);
    g.gain.setValueAtTime(0.0001,t0);
    g.gain.exponentialRampToValueAtTime(gain||0.18,t0+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    osc.connect(g); g.connect(c.destination);
    osc.start(t0); osc.stop(t0+dur+0.02);
  }
  return{
    place(){ tone(320,0.11,'triangle',0.16); },
    perfect(combo){ const base=680+Math.min(combo,8)*40; tone(base,0.09,'square',0.12); tone(base*1.5,0.14,'sine',0.1,0.03); },
    fall(){ tone(140,0.35,'sawtooth',0.12); },
    levelup(){ tone(523,0.12,'sine',0.15); tone(659,0.12,'sine',0.15,0.09); tone(784,0.22,'sine',0.16,0.18); },
    unlock(){ tone(440,0.1,'sine',0.14); tone(660,0.18,'sine',0.14,0.08); },
    click(){ tone(300,0.05,'square',0.06); }
  };
})();

/* ============================= THEMES ============================= */
const THEMES = {
  city:{
    id:'city', name:'Ciudad', icon:'🏙️',
    unlock:{type:'level', level:1},
    ground:'#3a3f52',
    skyStops:[
      {k:0,   top:'#FFB35C', bottom:'#FF7A6E'},
      {k:600, top:'#8FCBEE', bottom:'#F6D9A8'},
      {k:1600,top:'#4FA6E0', bottom:'#BFE3F2'},
      {k:3000,top:'#2C6FBE', bottom:'#8FC5EA'},
      {k:5200,top:'#123568', bottom:'#3E6FA8'},
      {k:8000,top:'#050716', bottom:'#1B2350'}
    ],
    blockColor:'#8DA3C4',
    blocks:[blockPalette('#8DA3C4')],
    blockStyle:'city',
    layout:null,
    buildLayout(rng){
      const buildings=[];
      for(let i=0;i<26;i++){
        buildings.push({x:i*90+ (rng()*40-20), w:54+rng()*46, h:120+rng()*420, tone:0.75+rng()*0.35});
      }
      const haze=[];
      for(let i=0;i<18;i++) haze.push({x:i*130+(rng()*50-25), w:70+rng()*70, h:150+rng()*380});
      const clouds=[];
      for(let i=0;i<12;i++) clouds.push({x:rng()*2400-600,y:1500+rng()*900,s:0.6+rng()*1.2,drift:8+rng()*14,bob:rng()*6.28});
      const stars=[];
      for(let i=0;i<90;i++) stars.push({x:rng()*1000,y:3800+rng()*6000,r:0.6+rng()*1.6,tw:rng()*6.28});
      const planets=[];
      for(let i=0;i<5;i++) planets.push({x:rng()*1200-200,y:5600+rng()*4200,r:34+rng()*70,c1:pick(rng,['#E58AC9','#7FDBDA','#F5D76E','#9CA8FF']),c2:pick(rng,['#8C3A78','#227271','#9C7A22','#5A66C9'])});
      const meteors=[];
      for(let i=0;i<5;i++) meteors.push({seed:rng()*1000,y:5400+rng()*4400,speed:220+rng()*140,len:60+rng()*50,ang:0.5+rng()*0.3});
      return{buildings,haze,clouds,stars,planets,meteors};
    }
  },
  forest:{
    id:'forest', name:'Bosque', icon:'🌲',
    unlock:{type:'level', level:4},
    ground:'#3e5c34',
    skyStops:[
      {k:0,   top:'#BFE7A6', bottom:'#EFF6C8'},
      {k:900, top:'#8FD1C8', bottom:'#D9EFC4'},
      {k:2200,top:'#4FA8B8', bottom:'#A9DCC9'},
      {k:4000,top:'#1E5E86', bottom:'#5C9FB0'},
      {k:6200,top:'#0C2C52', bottom:'#2C5C7E'},
      {k:9000,top:'#050716', bottom:'#152449'}
    ],
    blockColor:'#8B5A2B',
    blocks:[blockPalette('#8B5A2B')],
    blockStyle:'wood',
    layout:null,
    buildLayout(rng){
      const trees=[];
      for(let i=0;i<30;i++) trees.push({x:i*80+(rng()*40-20), h:70+rng()*160, w:34+rng()*20, tone:0.7+rng()*0.4});
      const mountains=[];
      for(let i=0;i<10;i++) mountains.push({x:i*280+(rng()*90-40), y:900+rng()*1800, w:260+rng()*220, h:220+rng()*300});
      const clouds=[];
      for(let i=0;i<12;i++) clouds.push({x:rng()*2400-600,y:1700+rng()*1100,s:0.55+rng()*1.1,drift:7+rng()*13,bob:rng()*6.28});
      const stars=[];
      for(let i=0;i<80;i++) stars.push({x:rng()*1000,y:4200+rng()*6000,r:0.6+rng()*1.6,tw:rng()*6.28});
      const planets=[];
      for(let i=0;i<5;i++) planets.push({x:rng()*1200-200,y:6000+rng()*4200,r:32+rng()*68,c1:pick(rng,['#E58AC9','#7FDBDA','#F5D76E','#9CA8FF']),c2:pick(rng,['#8C3A78','#227271','#9C7A22','#5A66C9'])});
      const meteors=[];
      for(let i=0;i<5;i++) meteors.push({seed:rng()*1000,y:5800+rng()*4600,speed:200+rng()*140,len:60+rng()*50,ang:0.5+rng()*0.3});
      return{trees,mountains,clouds,stars,planets,meteors};
    }
  },
  space:{
    id:'space', name:'Marte', icon:'🪐',
    unlock:{type:'special', flag:'reachedSpace'},
    ground:'#8a3a24',
    skyStops:[
      {k:0,   top:'#D97A4A', bottom:'#F2B27C'},
      {k:900, top:'#B85A3E', bottom:'#E0946A'},
      {k:2200,top:'#7C3B34', bottom:'#B36A4E'},
      {k:4000,top:'#432234', bottom:'#7A4440'},
      {k:6500,top:'#180B22', bottom:'#3A1F2C'},
      {k:9500,top:'#020103', bottom:'#0F0810'}
    ],
    blockColor:'#C9AFA0',
    blocks:[blockPalette('#C9AFA0')],
    blockStyle:'space',
    layout:null,
    buildLayout(rng){
      const mesas=[];
      for(let i=0;i<12;i++) mesas.push({x:i*160+(rng()*40-20), w:70+rng()*70, h:160+rng()*320, tone:0.6+rng()*0.4});
      const craters=[];
      for(let i=0;i<16;i++) craters.push({x:i*120+(rng()*60-30), r:14+rng()*30});
      const rocks=[];
      for(let i=0;i<20;i++) rocks.push({x:i*90+(rng()*50-25), w:10+rng()*16, h:8+rng()*12});
      const moons=[];
      moons.push({x:0.22,y:900,r:26,tone:0.55});
      moons.push({x:0.72,y:1700,r:15,tone:0.4});
      const dust=[];
      for(let i=0;i<24;i++) dust.push({x:rng()*1000,y:rng()*9000,r:1+rng()*2.2,drift:6+rng()*10,bob:rng()*6.28});
      const stars=[];
      for(let i=0;i<140;i++) stars.push({x:rng()*1000,y:2600+rng()*7000,r:0.6+rng()*1.8,tw:rng()*6.28});
      return{mesas,craters,rocks,moons,dust,stars};
    }
  },
  candy:{
    id:'candy', name:'Dulce', icon:'🍬',
    unlock:{type:'coins', cost:1000},
    ground:'#8a5a9c',
    skyStops:[
      {k:0,   top:'#FFC9E8', bottom:'#FFF0CE'},
      {k:900, top:'#C9B6FF', bottom:'#FFD9EE'},
      {k:2200,top:'#9B8CFF', bottom:'#D9BCFF'},
      {k:4000,top:'#5E5AC9', bottom:'#A98CE0'},
      {k:6200,top:'#2C2470', bottom:'#5A4AA0'},
      {k:9000,top:'#0E0A2C', bottom:'#231566'}
    ],
    blockColor:'#FF9AC0',
    blocks:[blockPalette('#FF9AC0')],
    blockStyle:'candy',
    layout:null,
    buildLayout(rng){
      const hills=[];
      for(let i=0;i<10;i++) hills.push({x:i*260+(rng()*60-30), w:220+rng()*140, h:80+rng()*90, c:pick(rng,['#FF9AC0','#8FE0B0','#FFD97A','#B3A0F5'])});
      const rainbows=[];
      for(let i=0;i<5;i++) rainbows.push({x:rng()*1400-200,y:1600+rng()*2600,s:0.7+rng()*0.8});
      const crystals=[];
      for(let i=0;i<9;i++) crystals.push({x:i*230+(rng()*70-35), y:900+rng()*3200, w:44+rng()*36, h:110+rng()*140, c:pick(rng,['#FF9AC0','#B3A0F5','#8FE0B0','#FFD97A'])});
      const clouds=[];
      for(let i=0;i<10;i++) clouds.push({x:rng()*2400-600,y:1400+rng()*1600,s:0.6+rng()*1,drift:6+rng()*10,bob:rng()*6.28});
      const stars=[];
      for(let i=0;i<90;i++) stars.push({x:rng()*1000,y:4000+rng()*6000,r:0.7+rng()*1.8,tw:rng()*6.28});
      return{hills,rainbows,crystals,clouds,stars};
    }
  }
};
const THEME_ORDER=['city','forest','space','candy'];
function getLayout(theme){
  if(!theme.layout){ const rng=mulberry32(theme.name.length*777+1); theme.layout=theme.buildLayout(rng); }
  return theme.layout;
}

/* ============================= CANVAS SETUP ============================= */
const appEl=document.getElementById('app');
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
let CW=0, CH=0, DPR=1;
function resize(){
  const r=appEl.getBoundingClientRect();
  CW=r.width; CH=r.height; DPR=Math.min(window.devicePixelRatio||1,2.5);
  canvas.width=Math.round(CW*DPR); canvas.height=Math.round(CH*DPR);
  canvas.style.width=CW+'px'; canvas.style.height=CH+'px';
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener('resize',resize);
resize();

/* ============================= GAME CONSTANTS ============================= */
const BH=42;              // block height (world px)
const ANCHOR_ROWS=5;
const PERFECT_PX=6;
const BASE_SPEED=155;
const SPEED_PER_BLOCK=2.6;
const MAX_SPEED=560;
const GROUND_MARGIN=96;
const SPACE_REACH_HEIGHT=5200; // world height (camH) at which city/forest count as "reaching space"

/* ============================= GAME STATE ============================= */
const G = {
  mode:'demo',            // 'demo' | 'playing' | 'gameover' | 'paused'
  theme:THEMES[profile.selectedTheme]||THEMES.city,
  blocks:[],              // placed blocks {x,w,bottom,top,colorIdx}
  moving:null,            // {x,w,bottom,top,dir,speed,colorIdx}
  debris:[],
  particles:[],
  camH:0, camTarget:0,
  score:0, perfects:0, combo:0,
  running:false, lastT:0,
  shake:0,
  demoTimer:0, demoColorIdx:0,
  bestMarkShown:false,
  collapseAt:0,
  time:0
};

function colorIdx(theme,i){ return i % theme.blocks.length; }

function resetTower(theme, forDemo){
  G.theme=theme;
  G.blocks=[];
  G.debris=[];
  G.particles=[];
  const baseW=Math.min(CW*0.62,300);
  G.blocks.push({x:CW/2,w:baseW,bottom:0,top:BH,colorIdx:0,foundation:true});
  G.camH=0; G.camTarget=0; G.score=0; G.perfects=0; G.combo=0; G.shake=0; G.bestMarkShown=false;
  spawnNext();
}
function spawnNext(){
  const last=G.blocks[G.blocks.length-1];
  const speed=clamp(BASE_SPEED+(G.blocks.length-1)*SPEED_PER_BLOCK, BASE_SPEED, MAX_SPEED);
  const dir= Math.random()<0.5?-1:1;
  const startX = dir>0 ? last.w/2+10 : CW-last.w/2-10;
  G.moving={ x:startX, w:last.w, bottom:last.top, top:last.top+BH, dir, speed, colorIdx: colorIdx(G.theme,G.blocks.length) };
}

/* ---- world/screen mapping ---- */
function groundScreenY(){ return CH-GROUND_MARGIN; }
function worldToScreenY(h){ return groundScreenY() - h + G.camH; }

/* ============================= DROP LOGIC ============================= */
function doDrop(){
  if(G.mode!=='playing') return;
  const m=G.moving, last=G.blocks[G.blocks.length-1];
  const dx=m.x-last.x;
  const overlap=last.w-Math.abs(dx);
  const dropScreenY=worldToScreenY((m.bottom+m.top)/2);

  if(overlap<=0.5){
    // MISS -> game over
    G.debris.push(makeDebris(m.x,m.w,m.bottom,m.top,m.colorIdx, Math.sign(dx)||1, 1));
    Audio1.fall();
    triggerGameOver();
    return;
  }

  const isPerfect = Math.abs(dx)<=PERFECT_PX;
  let newW, newX, leftoverW, leftoverX, leftoverSide;
  if(isPerfect){
    newW=last.w; newX=last.x;
  } else {
    const mLeft=m.x-m.w/2, mRight=m.x+m.w/2;
    const lLeft=last.x-last.w/2, lRight=last.x+last.w/2;
    const nLeft=Math.max(mLeft,lLeft), nRight=Math.min(mRight,lRight);
    newW=nRight-nLeft; newX=(nLeft+nRight)/2;
    if(mLeft<lLeft){ leftoverW=lLeft-mLeft; leftoverX=mLeft+leftoverW/2; leftoverSide=-1; }
    else { leftoverW=mRight-lRight; leftoverX=lRight+leftoverW/2; leftoverSide=1; }
  }

  G.blocks.push({x:newX,w:newW,bottom:m.bottom,top:m.top,colorIdx:m.colorIdx});

  if(isPerfect){
    G.combo++;
    const gain=Math.round(12+G.combo*3);
    G.score+=gain; G.perfects++;
    spawnBurst(newX,dropScreenY,G.theme);
    G.shake=6;
    Audio1.perfect(G.combo);
    showFloatText(gain,'PERFECTO',newX,dropScreenY);
  } else {
    G.combo=0;
    const gain=Math.max(1,Math.round(6*(newW/(last.w))));
    G.score+=gain;
    if(leftoverW>0.5) G.debris.push(makeDebris(leftoverX,leftoverW,m.bottom,m.top,m.colorIdx,leftoverSide,0));
    Audio1.place();
    G.shake=2;
  }

  document.getElementById('hud-score-num').textContent=G.score;
  const comboEl=document.getElementById('hud-combo');
  if(G.combo>=2){ comboEl.textContent='¡COMBO x'+G.combo+'!'; comboEl.classList.add('show'); }
  else comboEl.classList.remove('show');

  spawnNext();
}

function makeDebris(x,w,bottom,top,ci,dir,heavy){
  const y=worldToScreenY(top);
  return{ x, y, w, h:BH, colorIdx:ci, vx:dir*(60+Math.random()*60), vy:heavy?-40:-70, rot:0, vrot:dir*(2.4+Math.random()*1.4), life:0, maxLife:1.8, grav:1000+Math.random()*200 };
}
function spawnBurst(x,y,theme){
  const c=theme.blocks[colorIdx(theme,G.blocks.length-1)];
  for(let i=0;i<16;i++){
    const a=Math.random()*Math.PI*2, sp=40+Math.random()*140;
    G.particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-60,life:0,maxLife:0.5+Math.random()*0.4,r:2+Math.random()*3,color: Math.random()<0.5?'#FFD23F':c.top});
  }
}
let floatTexts=[];
function showFloatText(val,label,x,y){
  floatTexts.push({x,y,val,label,life:0,maxLife:1.1});
}

/* ============================= GAME OVER ============================= */
function triggerGameOver(){
  G.mode='gameover-anim';
  document.getElementById('hud').classList.add('hidden');
  // topple all blocks
  for(let i=G.blocks.length-1;i>=1;i--){
    const b=G.blocks[i];
    const dir=Math.random()<0.5?-1:1;
    G.debris.push({x:b.x,y:worldToScreenY(b.top),w:b.w,h:BH,colorIdx:b.colorIdx,
      vx:dir*(30+Math.random()*90), vy:-100-Math.random()*160, rot:0, vrot:dir*(3+Math.random()*3),
      life:0, maxLife:2.4, grav:1300, delay:i*0.03});
  }
  G.blocks=[G.blocks[0]];
  setTimeout(finishGameOver, 620);
}
function finishGameOver(){
  G.mode='gameover';
  const themeId=G.theme.id;
  const runHeightBlocks = lastRunHeight;
  const xpGain=Math.round(G.score*0.8);
  const coinsGain=Math.floor(G.score/6)+G.perfects;
  const oldLevel=levelFromXP(profile.xp).level;
  profile.xp+=xpGain;
  profile.coins+=coinsGain;
  profile.totalGames++;
  const newLevel=levelFromXP(profile.xp).level;

  let isRecord=false;
  const best=profile.best[themeId];
  if(G.score>best.score){ best.score=G.score; isRecord=true; }
  if(runHeightBlocks>best.height){ best.height=runHeightBlocks; }
  saveProfile();

  // fill UI
  document.getElementById('go-score').textContent=0;
  animateCount(document.getElementById('go-score'),0,G.score,700);
  document.getElementById('go-height').textContent=runHeightBlocks;
  document.getElementById('go-perfects').textContent=G.perfects;
  document.getElementById('go-coins').textContent='+'+coinsGain;
  document.getElementById('go-record').classList.toggle('hidden',!isRecord);

  const li=levelFromXP(profile.xp);
  document.getElementById('go-lvl-label').textContent='Nivel '+li.level;
  document.getElementById('go-xp-label').textContent=li.into+'/'+li.need;
  const fill=document.getElementById('go-xp-fill');
  fill.style.width='0%';
  requestAnimationFrame(()=>{ fill.style.width=Math.round(100*li.into/li.need)+'%'; });

  showScreen('screen-gameover');

  if(newLevel>oldLevel){
    setTimeout(()=>{ checkAutoUnlocks(oldLevel,newLevel); showLevelUp(newLevel); }, 900);
  }
  updateTopbar();
}
let lastRunHeight=0;
function animateCount(el,from,to,dur){
  const t0=performance.now();
  function step(t){
    const p=clamp((t-t0)/dur,0,1);
    el.textContent=Math.round(lerp(from,to,1-Math.pow(1-p,3)));
    if(p<1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function checkAutoUnlocks(oldLvl,newLvl){
  let unlockedNew=[];
  THEME_ORDER.forEach(id=>{
    const th=THEMES[id];
    if(th.unlock.type==='level' && !profile.unlocked.includes(id) && th.unlock.level<=newLvl){
      profile.unlocked.push(id); unlockedNew.push(th.name);
    }
  });
  if(unlockedNew.length){ saveProfile(); setTimeout(()=>{ toast('🗺️ Nuevo mapa: '+unlockedNew.join(', ')); Audio1.unlock(); },1600); }
}
function checkSpaceUnlock(announce){
  if(profile.reachedSpace && !profile.unlocked.includes('space')){
    profile.unlocked.push('space'); saveProfile();
    if(announce){ toast('🪐 ¡Llegaste al espacio! Marte desbloqueado'); Audio1.unlock(); }
    if(document.getElementById('screen-maps').classList.contains('active')) renderMaps();
  }
}
function showLevelUp(level){
  const el=document.getElementById('levelup-toast');
  document.getElementById('lu-level').textContent='¡NIVEL '+level+'!';
  document.getElementById('lu-sub').textContent='Sigue apilando para más';
  el.classList.add('show');
  Audio1.levelup();
  setTimeout(()=>el.classList.remove('show'),1800);
}
function toast(msg){
  const el=document.getElementById('toast');
  el.textContent=msg; el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),2200);
}

/* ============================= UPDATE LOOP ============================= */
function update(dt){
  G.time += dt;
  // camera
  const topH = G.blocks.length? (G.blocks[G.blocks.length-1].top):0;
  G.camTarget = Math.max(0, topH - ANCHOR_ROWS*BH);
  G.camH = lerp(G.camH, G.camTarget, 1-Math.pow(0.0025, dt));

  if(G.mode==='playing' && (G.theme.id==='city'||G.theme.id==='forest') && !profile.reachedSpace && G.camH>=SPACE_REACH_HEIGHT){
    profile.reachedSpace=true; saveProfile();
    checkSpaceUnlock(true);
  }

  if(G.mode==='playing' && G.moving){
    const m=G.moving;
    m.x += m.dir*m.speed*dt;
    const minX=m.w/2, maxX=CW-m.w/2;
    if(m.x<minX){ m.x=minX; m.dir=1; }
    if(m.x>maxX){ m.x=maxX; m.dir=-1; }
  }

  // debris physics
  for(let i=G.debris.length-1;i>=0;i--){
    const d=G.debris[i];
    if(d.delay && d.delay>0){ d.delay-=dt; continue; }
    d.vy+=d.grav*dt;
    d.x+=d.vx*dt; d.y+=d.vy*dt; d.rot+=d.vrot*dt;
    d.life+=dt;
    if(d.life>d.maxLife || d.y>CH+140) G.debris.splice(i,1);
  }
  for(let i=G.particles.length-1;i>=0;i--){
    const p=G.particles[i];
    p.vy+=420*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.life+=dt;
    if(p.life>p.maxLife) G.particles.splice(i,1);
  }
  for(let i=floatTexts.length-1;i>=0;i--){
    floatTexts[i].life+=dt;
    if(floatTexts[i].life>floatTexts[i].maxLife) floatTexts.splice(i,1);
  }
  if(G.shake>0) G.shake=Math.max(0,G.shake-dt*20);

  if(G.mode==='demo') updateDemo(dt);
}

function updateDemo(dt){
  if(!G.moving) return;
  G.demoTimer-=dt;
  if(G.demoTimer<=0){
    // auto-place near-perfectly
    const m=G.moving, last=G.blocks[G.blocks.length-1];
    m.x = last.x + (Math.random()*8-4);
    const dx=m.x-last.x;
    const isPerfect=Math.abs(dx)<=PERFECT_PX;
    const newW=isPerfect?last.w:last.w-Math.abs(dx);
    G.blocks.push({x:last.x,w:newW,bottom:m.bottom,top:m.top,colorIdx:m.colorIdx});
    spawnBurst(last.x, worldToScreenY((m.bottom+m.top)/2), G.theme);
    if(G.blocks.length>22){
      resetTower(G.theme,true);
    } else {
      spawnNext();
    }
    G.demoTimer=0.85;
  }
}

/* ============================= RENDER ============================= */
function drawBackground(){
  const cam=G.camTarget>0?G.camH:0;
  const sample=sampleStops(G.theme.skyStops, Math.max(0,G.camH), ['top','bottom']);
  const grad=ctx.createLinearGradient(0,0,0,CH);
  grad.addColorStop(0, sample.top);
  grad.addColorStop(1, sample.bottom);
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,CW,CH);

  drawDecor();
}

function drawDecor(){
  const L=getLayout(G.theme);
  const gY=groundScreenY();
  const camH=G.camH;
  ctx.save();
  if(G.theme.id==='city'){
    // stars (parallax .12) fade in high up
    ctx.save();
    L.stars.forEach(s=>{
      const sy=gY-s.y+camH*0.12;
      if(sy<-10||sy>CH+10) return;
      const op=clamp((camH-2600)/2600,0,1);
      if(op<=0) return;
      ctx.globalAlpha=op*(0.5+0.5*Math.sin(s.tw+camH*0.002));
      ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc((s.x%CW+CW)%CW, sy, s.r,0,7); ctx.fill();
    });
    ctx.restore();
    // space-approach layer: low-poly planets + meteors, fades in high up
    drawSpaceApproach(L,gY,camH);
    // clouds: natural horizontal drift + gentle bob, sit below the space zone
    drawCloudLayer(L.clouds,0.32,gY,camH,'#ffffff',sy=>0.85*clamp(1-(camH-4200)/1800,0,1));
    // distant hazy skyline parallax .38 (atmospheric depth, faint & desaturated)
    ctx.save(); ctx.globalAlpha=0.4;
    L.haze.forEach(b=>{
      const top=gY-b.h+camH*0.38;
      const bottom=gY+60+camH*0.38;
      if(top>CH+50||bottom<-50) return;
      const bx=((b.x%(CW+260))+CW+260)%(CW+260)-130;
      ctx.fillStyle='#7C8BAE';
      ctx.fillRect(bx,top,b.w,bottom-top);
    });
    ctx.restore();
    // buildings parallax .55, drawn as pseudo-3D boxes (front + side + roof cap)
    L.buildings.forEach(b=>{
      const top=gY-b.h+camH*0.55;
      const bottom=gY+40+camH*0.55;
      if(top>CH+50||bottom<-50) return;
      const bx=((b.x%(CW+300))+CW+300)%(CW+300)-150;
      const front=lerpColor('#5b6478','#1c2033',1-b.tone);
      const side=lerpColor('#3a4258','#101322',1-b.tone);
      const roof=lerpColor(front,'#ffffff',0.14);
      const bd=8+b.w*0.16;
      // right side face
      ctx.fillStyle=side;
      ctx.beginPath();
      ctx.moveTo(bx+b.w,top); ctx.lineTo(bx+b.w+bd,top-bd*0.55); ctx.lineTo(bx+b.w+bd,bottom-bd*0.55); ctx.lineTo(bx+b.w,bottom);
      ctx.closePath(); ctx.fill();
      // front face
      ctx.fillStyle=front;
      ctx.fillRect(bx,top,b.w,bottom-top);
      // roof cap
      ctx.fillStyle=roof;
      ctx.beginPath();
      ctx.moveTo(bx,top); ctx.lineTo(bx+bd,top-bd*0.55); ctx.lineTo(bx+b.w+bd,top-bd*0.55); ctx.lineTo(bx+b.w,top);
      ctx.closePath(); ctx.fill();
      // windows on front face only
      ctx.fillStyle='rgba(255,220,140,0.55)';
      for(let wy=top+10; wy<bottom-10; wy+=16){
        for(let wx=bx+6; wx<bx+b.w-6; wx+=13){ if(((wx+wy)|0)%23<15) ctx.fillRect(wx,wy,6,8); }
      }
    });
    // ground street with perspective (narrows toward the horizon)
    const gy2=gY+camH*1.0;
    if(gy2>-10 && gy2<CH+200){
      ctx.fillStyle=G.theme.ground;
      ctx.fillRect(0,gy2,CW,CH-gy2+300);
      const vanishW=CW*0.22;
      ctx.fillStyle='rgba(0,0,0,.16)';
      ctx.beginPath();
      ctx.moveTo(CW/2-vanishW/2,gy2); ctx.lineTo(CW/2+vanishW/2,gy2); ctx.lineTo(CW,gy2+120); ctx.lineTo(0,gy2+120);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.setLineDash([18,14]); ctx.lineWidth=4;
      ctx.beginPath(); ctx.moveTo(0,gy2+30); ctx.lineTo(CW,gy2+30); ctx.stroke(); ctx.setLineDash([]);
    }
  } else if(G.theme.id==='forest'){
    ctx.save();
    L.stars.forEach(s=>{
      const sy=gY-s.y+camH*0.1;
      const op=clamp((camH-3200)/2600,0,1); if(op<=0) return;
      ctx.globalAlpha=op*(0.5+0.5*Math.sin(s.tw+camH*0.002)); ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc((s.x%CW+CW)%CW, sy, s.r,0,7); ctx.fill();
    });
    ctx.restore();
    drawSpaceApproach(L,gY,camH);
    drawCloudLayer(L.clouds,0.34,gY,camH,'#fbfff4',sy=>0.85*clamp(1-(camH-4600)/1800,0,1));
    L.mountains.forEach(m=>{
      const base=gY-m.y+camH*0.35;
      if(base-m.h>CH+50 || base<-50) return;
      const mx=((m.x%(CW+400))+CW+400)%(CW+400)-200;
      ctx.fillStyle='#6f8fae';
      ctx.beginPath(); ctx.moveTo(mx-m.w/2,base); ctx.lineTo(mx,base-m.h); ctx.lineTo(mx+m.w/2,base); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.5)';
      ctx.beginPath(); ctx.moveTo(mx-m.w*0.08,base-m.h*0.72); ctx.lineTo(mx,base-m.h); ctx.lineTo(mx+m.w*0.08,base-m.h*0.72); ctx.closePath(); ctx.fill();
    });
    L.trees.forEach(t=>{
      const base=gY+camH*0.7;
      const top=base-t.h;
      if(top>CH+50||base<-50) return;
      const tx=((t.x%(CW+200))+CW+200)%(CW+200)-100;
      const trunkH=t.h*0.3;
      const trunkTop=base-trunkH;
      const trunkW=Math.max(9,t.w*0.26);
      const tw0=tx-trunkW/2, tw1=tx+trunkW/2;
      // root flare (single café, darker)
      ctx.fillStyle='#5A3B1F';
      ctx.beginPath(); ctx.ellipse(tx,base,trunkW*0.85,4,0,0,Math.PI*2); ctx.fill();
      // trunk shadow side (café oscuro)
      ctx.fillStyle='#6B4423';
      ctx.beginPath(); ctx.moveTo(tw0+trunkW*0.28,trunkTop); ctx.lineTo(tw1,trunkTop+2); ctx.lineTo(tw1-trunkW*0.08,base); ctx.lineTo(tw0+trunkW*0.2,base); ctx.closePath(); ctx.fill();
      // trunk highlight side (café claro, mismo tono base)
      ctx.fillStyle='#8A5A34';
      ctx.beginPath(); ctx.moveTo(tw0,trunkTop+2); ctx.lineTo(tw0+trunkW*0.3,trunkTop); ctx.lineTo(tw0+trunkW*0.24,base); ctx.lineTo(tw0+trunkW*0.05,base); ctx.closePath(); ctx.fill();
      // bark texture
      ctx.strokeStyle='rgba(0,0,0,.22)'; ctx.lineWidth=1;
      for(let by=trunkTop+5; by<base-3; by+=6){ ctx.beginPath(); ctx.moveTo(tw0+1,by); ctx.lineTo(tw1-1,by+1.5); ctx.stroke(); }
      ctx.strokeStyle='rgba(0,0,0,.15)';
      ctx.beginPath(); ctx.moveTo(tw0+1,trunkTop+3); ctx.lineTo(tw0+2,base-2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tw1-1,trunkTop+3); ctx.lineTo(tw1-2,base-2); ctx.stroke();
      // canopy (layered pine, green family, gives the tree volume above the trunk)
      ctx.fillStyle=lerpColor('#2f5e2e','#4c8a45',t.tone);
      ctx.beginPath(); ctx.moveTo(tx-t.w/2,trunkTop+trunkH*0.15); ctx.lineTo(tx,top); ctx.lineTo(tx+t.w/2,trunkTop+trunkH*0.15); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(tx-t.w*0.4,base-t.h*0.5); ctx.lineTo(tx,base-t.h*0.75); ctx.lineTo(tx+t.w*0.4,base-t.h*0.5); ctx.closePath(); ctx.fill();
      // shadowed right edge of canopy for volume
      ctx.fillStyle='rgba(0,0,0,.12)';
      ctx.beginPath(); ctx.moveTo(tx,top); ctx.lineTo(tx+t.w/2,trunkTop+trunkH*0.15); ctx.lineTo(tx+t.w*0.36,trunkTop+trunkH*0.15); ctx.closePath(); ctx.fill();
    });
    const gy2=gY+camH*1.0;
    if(gy2>-10&&gy2<CH+200){ ctx.fillStyle=G.theme.ground; ctx.fillRect(0,gy2,CW,CH-gy2+300); }
  } else if(G.theme.id==='space'){
    // thin-atmosphere starfield, visible even fairly low on Mars
    L.stars.forEach(s=>{
      const sy=gY-s.y+camH*0.14;
      if(sy<-10||sy>CH+10) return;
      const op=clamp((camH-1200)/2400,0,1); if(op<=0) return;
      ctx.globalAlpha=op*(0.6+0.4*Math.sin(s.tw+camH*0.003)); ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc((s.x%CW+CW)%CW, sy, s.r,0,7); ctx.fill();
    });
    ctx.globalAlpha=1;
    // Phobos & Deimos: small low-poly moons, fixed in the high sky (slow parallax)
    L.moons.forEach(m=>{
      const sy=gY-m.y+camH*0.18;
      if(sy<-60||sy>CH+60) return;
      const mx=m.x*CW;
      drawLowPolyOrb(mx,sy,m.r,shade('#B7A99B',0.15),shade('#7C6E62',-m.tone));
    });
    // distant low-poly mesas (faceted rock towers, iso extrusion like the buildings but rust-toned)
    L.mesas.forEach(mm=>{
      const top=gY-mm.h+camH*0.5;
      const bottom=gY+50+camH*0.5;
      if(top>CH+50||bottom<-50) return;
      const mx=((mm.x%(CW+280))+CW+280)%(CW+280)-140;
      const front=lerpColor('#B25A38','#5A2A1C',1-mm.tone);
      const side=lerpColor('#7C3B26','#3A1811',1-mm.tone);
      const capw=8+mm.w*0.14;
      ctx.fillStyle=side;
      ctx.beginPath();
      ctx.moveTo(mx+mm.w,top); ctx.lineTo(mx+mm.w+capw,top-capw*0.5); ctx.lineTo(mx+mm.w+capw,bottom-capw*0.5); ctx.lineTo(mx+mm.w,bottom);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle=front;
      ctx.fillRect(mx,top,mm.w,bottom-top);
      ctx.fillStyle=lerpColor(front,'#ffffff',0.12);
      ctx.beginPath();
      ctx.moveTo(mx,top); ctx.lineTo(mx+capw,top-capw*0.5); ctx.lineTo(mx+mm.w+capw,top-capw*0.5); ctx.lineTo(mx+mm.w,top);
      ctx.closePath(); ctx.fill();
    });
    // drifting dust motes
    L.dust.forEach(d=>{
      const sy=gY-d.y+camH*0.6 + Math.sin(G.time*0.6+d.bob)*3;
      if(sy<-10||sy>CH+10) return;
      const span=CW+200;
      const dx=(((d.x+G.time*d.drift)%span)+span)%span-100;
      ctx.globalAlpha=0.35; ctx.fillStyle='#E8B48F';
      ctx.beginPath(); ctx.arc(dx,sy,d.r,0,7); ctx.fill(); ctx.globalAlpha=1;
    });
    // Mars ground: rusty terrain with crater rims + small polygonal rocks
    const gy2=gY+camH*1.0;
    if(gy2>-10 && gy2<CH+200){
      ctx.fillStyle=G.theme.ground;
      ctx.fillRect(0,gy2,CW,CH-gy2+300);
      L.craters.forEach(c=>{
        const cx2=((c.x%(CW+160))+CW+160)%(CW+160)-80;
        ctx.fillStyle='rgba(0,0,0,.18)';
        ctx.beginPath(); ctx.ellipse(cx2,gy2+10,c.r,c.r*0.32,0,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='rgba(255,180,140,.25)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.ellipse(cx2,gy2+8,c.r*0.9,c.r*0.28,0,Math.PI,Math.PI*2); ctx.stroke();
      });
      L.rocks.forEach(r=>{
        const rx=((r.x%(CW+140))+CW+140)%(CW+140)-70;
        ctx.fillStyle='#6E3521';
        ctx.beginPath(); ctx.moveTo(rx-r.w/2,gy2+2); ctx.lineTo(rx-r.w*0.15,gy2-r.h); ctx.lineTo(rx+r.w/2,gy2+2); ctx.closePath(); ctx.fill();
        ctx.fillStyle='rgba(255,190,150,.3)';
        ctx.beginPath(); ctx.moveTo(rx-r.w*0.15,gy2-r.h); ctx.lineTo(rx+r.w*0.1,gy2-r.h*0.4); ctx.lineTo(rx-r.w*0.05,gy2+2); ctx.closePath(); ctx.fill();
      });
    }
  } else if(G.theme.id==='candy'){
    ctx.save();
    L.stars.forEach(s=>{
      const sy=gY-s.y+camH*0.12;
      const op=clamp((camH-3200)/2600,0,1); if(op<=0) return;
      ctx.globalAlpha=op*(0.5+0.5*Math.sin(s.tw+camH*0.002)); ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc((s.x%CW+CW)%CW, sy, s.r,0,7); ctx.fill();
    });
    ctx.restore();
    L.rainbows.forEach(r=>{
      const sy=gY-r.y+camH*0.3;
      if(sy<-260||sy>CH+120) return;
      const rx=((r.x%(CW+500))+CW+500)%(CW+500)-250;
      const cols=['#FF9AC0','#FFD97A','#D4F3E0','#B3A0F5'];
      for(let i=0;i<cols.length;i++){
        ctx.strokeStyle=cols[i]; ctx.lineWidth=14*r.s; ctx.beginPath();
        ctx.arc(rx,sy+120*r.s,150*r.s - i*15*r.s,Math.PI,0); ctx.stroke();
      }
    });
    drawCloudLayer(L.clouds,0.4,gY,camH,'#fff2fa',()=>0.75);
    // faceted low-poly candy crystals, iso-extruded like the buildings
    L.crystals.forEach(c=>{
      const top=gY-c.h+camH*0.5;
      const bottom=gY+30+camH*0.5;
      if(top>CH+50||bottom<-50) return;
      const cx2=((c.x%(CW+260))+CW+260)%(CW+260)-130;
      const front=c.c, side=shade(c.c,-0.3), tip=shade(c.c,0.35);
      ctx.fillStyle=side;
      ctx.beginPath(); ctx.moveTo(cx2+c.w/2,top+18); ctx.lineTo(cx2+c.w/2+9,top+10); ctx.lineTo(cx2+c.w/2+9,bottom-6); ctx.lineTo(cx2+c.w/2,bottom); ctx.closePath(); ctx.fill();
      ctx.fillStyle=front;
      ctx.beginPath(); ctx.moveTo(cx2,top); ctx.lineTo(cx2+c.w/2,top+18); ctx.lineTo(cx2+c.w/2,bottom); ctx.lineTo(cx2-c.w/2,bottom); ctx.lineTo(cx2-c.w/2,top+18); ctx.closePath(); ctx.fill();
      ctx.fillStyle=tip;
      ctx.beginPath(); ctx.moveTo(cx2,top); ctx.lineTo(cx2+c.w/2,top+18); ctx.lineTo(cx2-c.w/2,top+18); ctx.closePath(); ctx.fill();
    });
    L.hills.forEach(h=>{
      const base=gY+40+camH*0.5;
      if(base-h.h>CH+50||base<-50) return;
      const hx=((h.x%(CW+320))+CW+320)%(CW+320)-160;
      ctx.fillStyle=h.c;
      ctx.beginPath(); ctx.ellipse(hx,base,h.w/2,h.h,0,Math.PI,0); ctx.fill();
    });
    const gy2=gY+camH*1.0;
    if(gy2>-10&&gy2<CH+200){ ctx.fillStyle=G.theme.ground; ctx.fillRect(0,gy2,CW,CH-gy2+300); }
  }
  ctx.restore();
}
function drawCloud(x,y,s,color){
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.ellipse(x,y,40*s,18*s,0,0,7);
  ctx.ellipse(x+30*s,y-8*s,26*s,16*s,0,0,7);
  ctx.ellipse(x-28*s,y-4*s,24*s,14*s,0,0,7);
  ctx.fill();
}
/* natural drifting cloud layer: horizontal drift + gentle vertical bob, wraps around screen width */
function drawCloudLayer(list,camFactor,gY,camH,color,alphaFn){
  ctx.save();
  list.forEach(c=>{
    const sy=gY-c.y+camH*camFactor + Math.sin(G.time*0.5+(c.bob||0))*4;
    if(sy<-80||sy>CH+80) return;
    const span=CW+400;
    const cx=(((c.x+G.time*(c.drift||10))%span)+span)%span-200;
    ctx.globalAlpha = alphaFn ? alphaFn(sy) : 0.85;
    if(ctx.globalAlpha<=0) return;
    drawCloud(cx,sy,c.s,color);
  });
  ctx.restore();
}
/* low-poly faceted "orb" -- gives planets/moons a polygonal 3D look instead of a flat circle */
function drawLowPolyOrb(cx,cy,r,cLight,cDark){
  const N=10;
  for(let i=0;i<N;i++){
    const a0=(i/N)*Math.PI*2, a1=((i+1)/N)*Math.PI*2;
    const shade=0.15+0.85*Math.max(0,Math.sin((a0+a1)/2+0.7));
    ctx.fillStyle=lerpColor(cDark,cLight,shade);
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.lineTo(cx+Math.cos(a0)*r,cy+Math.sin(a0)*r);
    ctx.lineTo(cx+Math.cos(a1)*r,cy+Math.sin(a1)*r);
    ctx.closePath(); ctx.fill();
  }
}
function drawMeteor(x,y,ang,len,alpha){
  if(alpha<=0) return;
  const dx=Math.cos(ang), dy=Math.sin(ang);
  const grad=ctx.createLinearGradient(x,y,x-dx*len,y-dy*len);
  grad.addColorStop(0,'rgba(255,255,255,'+(0.9*alpha)+')');
  grad.addColorStop(1,'rgba(255,255,255,0)');
  ctx.save();
  ctx.strokeStyle=grad; ctx.lineWidth=2.4; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-dx*len,y-dy*len); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,'+alpha+')';
  ctx.beginPath(); ctx.arc(x,y,2.2,0,7); ctx.fill();
  ctx.restore();
}
/* renders the "reaching space" layer (low-poly planets + streaking meteors) shared by city & forest at high altitude */
function drawSpaceApproach(L,gY,camH){
  if(!L.planets) return;
  const op=clamp((camH-3600)/2600,0,1);
  if(op<=0) return;
  ctx.save(); ctx.globalAlpha=op;
  L.planets.forEach(p=>{
    const sy=gY-p.y+camH*0.2;
    if(sy<-160||sy>CH+160) return;
    const px=((p.x%(CW+300))+CW+300)%(CW+300)-150;
    drawLowPolyOrb(px,sy,p.r,p.c1,p.c2);
  });
  ctx.restore();
  (L.meteors||[]).forEach(m=>{
    const sy=gY-m.y+camH*0.22;
    if(sy<-40||sy>CH+40) return;
    const cyc=1400;
    const prog=((G.time*m.speed+m.seed*37)%cyc)/cyc;
    const mx=prog*(CW+260)-130;
    const mAlpha=op*clamp(1-Math.abs(prog-0.5)*1.6,0,1)*0.9;
    drawMeteor(mx,sy,m.ang,m.len,mAlpha);
  });
}

const DEPTH_X=13, DEPTH_Y=9; // iso depth offset (up-and-right = "away" from camera)
function drawBlockShape(cx,yTop,yBottom,w,ci,style){
  const pal=G.theme.blocks[0];
  const x0=cx-w/2, x1=cx+w/2;
  const topH=11;
  const fY=yTop+topH; // front face top edge

  // ---- RIGHT SIDE FACE (depth) ----
  ctx.fillStyle=pal.side;
  ctx.beginPath();
  ctx.moveTo(x1,fY);
  ctx.lineTo(x1+DEPTH_X,fY-DEPTH_Y);
  ctx.lineTo(x1+DEPTH_X,yBottom-DEPTH_Y);
  ctx.lineTo(x1,yBottom);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.14)';
  ctx.beginPath(); ctx.moveTo(x1,fY); ctx.lineTo(x1+DEPTH_X,fY-DEPTH_Y); ctx.lineTo(x1+DEPTH_X,yBottom-DEPTH_Y); ctx.lineTo(x1,yBottom); ctx.closePath(); ctx.fill();

  // ---- FRONT FACE ----
  ctx.fillStyle=pal.front;
  ctx.fillRect(x0,fY,w,yBottom-fY);

  // subtle vertical light falloff on front face (left brighter, right darker) for cylindrical/box roundness
  const fg=ctx.createLinearGradient(x0,0,x1,0);
  fg.addColorStop(0,'rgba(255,255,255,.10)');
  fg.addColorStop(0.5,'rgba(255,255,255,0)');
  fg.addColorStop(1,'rgba(0,0,0,.10)');
  ctx.fillStyle=fg;
  ctx.fillRect(x0,fY,w,yBottom-fY);

  // ---- TOP FACE ----
  ctx.fillStyle=pal.top;
  ctx.beginPath();
  ctx.moveTo(x0,fY); ctx.lineTo(x0+DEPTH_X,fY-DEPTH_Y); ctx.lineTo(x1+DEPTH_X,fY-DEPTH_Y); ctx.lineTo(x1,fY);
  ctx.closePath(); ctx.fill();

  // crisp edges to sell hard corners
  ctx.strokeStyle=pal.edge; ctx.lineWidth=1;
  ctx.beginPath();
  ctx.moveTo(x0,fY); ctx.lineTo(x0+DEPTH_X,fY-DEPTH_Y); ctx.lineTo(x1+DEPTH_X,fY-DEPTH_Y); ctx.lineTo(x1,fY); ctx.lineTo(x0,fY);
  ctx.moveTo(x1,fY); ctx.lineTo(x1+DEPTH_X,fY-DEPTH_Y);
  ctx.moveTo(x1,yBottom); ctx.lineTo(x1+DEPTH_X,yBottom-DEPTH_Y);
  ctx.stroke();
  ctx.strokeStyle='rgba(0,0,0,.16)';
  ctx.strokeRect(x0,fY,w,yBottom-fY);

  // ---- material detail on front face ----
  ctx.save();
  ctx.beginPath(); ctx.rect(x0,fY,w,yBottom-fY); ctx.clip();
  if(style==='city'){
    // glass mullions grid
    ctx.strokeStyle='rgba(255,255,255,.28)'; ctx.lineWidth=1;
    for(let wx=x0+14; wx<x1-4; wx+=14){ ctx.beginPath(); ctx.moveTo(wx,fY+3); ctx.lineTo(wx,yBottom-3); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x0+2,(fY+yBottom)/2); ctx.lineTo(x1-2,(fY+yBottom)/2); ctx.stroke();
    // diagonal specular sheen
    ctx.fillStyle='rgba(255,255,255,.16)';
    ctx.beginPath(); ctx.moveTo(x0,yBottom); ctx.lineTo(x0+w*0.32,fY); ctx.lineTo(x0+w*0.18,fY); ctx.lineTo(x0,yBottom-w*0.14); ctx.closePath(); ctx.fill();
  } else if(style==='wood'){
    // plank grain lines
    ctx.strokeStyle='rgba(0,0,0,.22)'; ctx.lineWidth=2;
    const rows=3;
    for(let i=1;i<rows;i++){ const yy=fY+((yBottom-fY)/rows)*i; ctx.beginPath(); ctx.moveTo(x0+3,yy); ctx.lineTo(x1-3,yy); ctx.stroke(); }
    ctx.strokeStyle='rgba(0,0,0,.10)'; ctx.lineWidth=1;
    for(let wx=x0+10; wx<x1-6; wx+=17){ ctx.beginPath(); ctx.moveTo(wx,fY+2); ctx.bezierCurveTo(wx+3,fY+(yBottom-fY)*0.3,wx-3,fY+(yBottom-fY)*0.7,wx+2,yBottom-2); ctx.stroke(); }
  } else if(style==='space'){
    // riveted metal panel
    ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=1.5;
    ctx.strokeRect(x0+6,fY+5,w-12,(yBottom-fY-10));
    ctx.fillStyle='rgba(80,95,120,.55)';
    [[x0+8,fY+7],[x1-8,fY+7],[x0+8,yBottom-7],[x1-8,yBottom-7]].forEach(p=>{ ctx.beginPath(); ctx.arc(p[0],p[1],2,0,7); ctx.fill(); });
    ctx.fillStyle='rgba(255,255,255,.5)';
    ctx.beginPath(); ctx.arc(cx,(fY+yBottom)/2,4,0,7); ctx.fill();
  } else if(style==='candy'){
    ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.lineWidth=5;
    for(let d=-yBottom; d<w+(yBottom-fY); d+=16){
      ctx.beginPath(); ctx.moveTo(x0+d,yBottom); ctx.lineTo(x0+d+(yBottom-fY),fY); ctx.stroke();
    }
    ctx.fillStyle='rgba(255,255,255,.35)';
    ctx.fillRect(x0,fY,w,4);
  }
  ctx.restore();
}

function drawTower(){
  G.blocks.forEach((b,i)=>{
    const yTop=worldToScreenY(b.top), yBottom=worldToScreenY(b.bottom);
    if(yBottom<-40||yTop>CH+40) return;
    drawBlockShape(b.x,yTop,yBottom,b.w,b.colorIdx,G.theme.blockStyle);
  });
  if(G.moving && (G.mode==='playing'||G.mode==='demo')){
    const m=G.moving;
    const yTop=worldToScreenY(m.top), yBottom=worldToScreenY(m.bottom);
    drawBlockShape(m.x,yTop,yBottom,m.w,m.colorIdx,G.theme.blockStyle);
  }
}

function drawBestMark(){
  if(G.mode!=='playing') return;
  const best=profile.best[G.theme.id];
  if(!best || best.height<=0) return;
  const curHeight=G.blocks.length-1;
  if(curHeight>=best.height) return;
  const worldH=best.height*BH+BH;
  const sy=worldToScreenY(worldH);
  if(sy<-20||sy>CH+20) return;
  ctx.save();
  ctx.strokeStyle='rgba(255,255,255,.75)'; ctx.lineWidth=2; ctx.setLineDash([10,8]);
  ctx.beginPath(); ctx.moveTo(0,sy); ctx.lineTo(CW,sy); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle='rgba(23,11,46,.65)';
  const label='TU MEJOR MARCA';
  ctx.font='700 10px Nunito, sans-serif';
  const tw=ctx.measureText(label).width;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(CW/2-tw/2-8,sy-20,tw+16,16,8) : ctx.rect(CW/2-tw/2-8,sy-20,tw+16,16);
  ctx.fill();
  ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.fillText(label,CW/2,sy-9);
  ctx.restore();
}

function drawDebris(){
  G.debris.forEach(d=>{
    if(d.delay && d.delay>0) return;
    const pal=G.theme.blocks[d.colorIdx % G.theme.blocks.length];
    const alpha=clamp(1-d.life/d.maxLife*1.2,0,1);
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.translate(d.x,d.y);
    ctx.rotate(d.rot);
    ctx.fillStyle=pal.front;
    ctx.fillRect(-d.w/2,0,d.w,d.h*0.7);
    ctx.fillStyle=pal.top;
    ctx.fillRect(-d.w/2,-6,d.w,8);
    ctx.restore();
  });
}
function drawParticles(){
  G.particles.forEach(p=>{
    const alpha=clamp(1-p.life/p.maxLife,0,1);
    ctx.save(); ctx.globalAlpha=alpha; ctx.fillStyle=p.color;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,7); ctx.fill(); ctx.restore();
  });
}
function drawFloatTexts(){
  floatTexts.forEach(f=>{
    const p=f.life/f.maxLife;
    ctx.save();
    ctx.globalAlpha=clamp(1-p,0,1);
    ctx.translate(f.x,f.y-p*46);
    ctx.textAlign='center';
    ctx.font='800 15px Baloo 2, sans-serif';
    ctx.fillStyle='#FFD23F';
    ctx.fillText(f.label,0,-14);
    ctx.font='800 20px Baloo 2, sans-serif';
    ctx.fillStyle='#fff';
    ctx.fillText('+'+f.val,0,8);
    ctx.restore();
  });
}

function render(){
  ctx.save();
  if(G.shake>0){
    ctx.translate((Math.random()-0.5)*G.shake,(Math.random()-0.5)*G.shake);
  }
  drawBackground();
  drawBestMark();
  drawTower();
  drawDebris();
  drawParticles();
  drawFloatTexts();
  ctx.restore();
}

/* ============================= MAIN LOOP ============================= */
function frame(t){
  const dt=Math.min(0.033,(t-(G.lastT||t))/1000);
  G.lastT=t;
  update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ============================= INPUT ============================= */
canvas.addEventListener('pointerdown', ()=>{
  if(G.mode==='playing') doDrop();
});

/* ============================= UI WIRING ============================= */
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function updateTopbar(){
  document.getElementById('coin-count').textContent=profile.coins;
  const li=levelFromXP(profile.xp);
  document.getElementById('lvl-badge').textContent=li.level;
  document.getElementById('xp-mini').textContent=li.into+'/'+li.need;
  const best=profile.best[profile.selectedTheme];
  document.getElementById('best-hint').textContent = best && best.score>0 ? 'Mejor puntaje aquí: '+best.score : 'Toca la pantalla para soltar el bloque';
}

function goMenu(){
  G.mode='demo';
  document.getElementById('topbar-menu').classList.remove('hidden');
  document.getElementById('hud').classList.add('hidden');
  resetTower(THEMES[profile.selectedTheme],true);
  G.demoTimer=0.9;
  updateTopbar();
  showScreen('screen-menu');
}
function goMaps(){
  renderMaps();
  showScreen('screen-maps');
}
function startGame(){
  G.mode='playing';
  document.getElementById('topbar-menu').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('hud-combo').classList.remove('show');
  resetTower(THEMES[profile.selectedTheme],false);
  document.getElementById('hud-score-num').textContent='0';
  lastRunHeight=0;
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const hint=document.getElementById('tap-hint');
  hint.style.opacity='1';
  setTimeout(()=>{ hint.style.transition='opacity .6s'; hint.style.opacity='0'; },1800);
}
// track live height for game-over stats (before blocks got reset to [foundation])
function trackHeight(){ lastRunHeight = Math.max(0,G.blocks.length-1); }

function renderMaps(){
  const list=document.getElementById('maps-list');
  list.innerHTML='';
  THEME_ORDER.forEach(id=>{
    const th=THEMES[id];
    const unlocked=profile.unlocked.includes(id);
    const selected=profile.selectedTheme===id;
    const best=profile.best[id];
    const card=document.createElement('div');
    card.className='map-card'+(selected?' selected':'');
    const grad=th.skyStops[0];
    card.style.background=`linear-gradient(180deg, ${th.skyStops[1].top}, ${th.skyStops[0].bottom})`;
    card.innerHTML = `
      <div class="mc-info">
        <div>
          <div class="mc-name">${th.icon} ${th.name}</div>
          <div class="mc-best">${best.score>0? 'Récord: '+best.score : 'Sin jugar aún'}</div>
        </div>
      </div>
      <div class="mc-lock">${
        selected ? '<span class="check-chip">✓ EN USO</span>' :
        unlocked ? '<span class="check-chip" style="background:rgba(255,255,255,.85);color:#333;">ELEGIR</span>' :
        th.unlock.type==='level' ? `<span class="lock-chip">🔒 Nivel ${th.unlock.level}</span>` :
        th.unlock.type==='coins' ? `<span class="lock-chip">🔒 🪙 ${th.unlock.cost}</span>` :
        `<span class="lock-chip">🔒 Llega al espacio</span>`
      }</div>`;
    card.addEventListener('click', ()=>{
      Audio1.click();
      if(unlocked){
        profile.selectedTheme=id; saveProfile();
        G.theme=THEMES[id]; resetTower(THEMES[id],true); G.demoTimer=0.9;
        updateTopbar(); renderMaps();
      } else if(th.unlock.type==='level'){
        const li=levelFromXP(profile.xp);
        if(li.level>=th.unlock.level){
          profile.unlocked.push(id); profile.selectedTheme=id; saveProfile();
          Audio1.unlock(); toast('🎉 ¡'+th.name+' desbloqueado!');
          resetTower(THEMES[id],true); updateTopbar(); renderMaps();
        } else {
          toast('Necesitas subir a nivel '+th.unlock.level+' 🔒');
        }
      } else if(th.unlock.type==='coins'){
        if(profile.coins>=th.unlock.cost){
          profile.coins-=th.unlock.cost; profile.unlocked.push(id); profile.selectedTheme=id; saveProfile();
          Audio1.unlock(); toast('🎉 ¡'+th.name+' desbloqueado!');
          resetTower(THEMES[id],true); updateTopbar(); renderMaps();
        } else {
          toast('Necesitas '+th.unlock.cost+' 🪙 para desbloquear');
        }
      } else if(th.unlock.type==='special'){
        toast('🌌 Llega hasta el espacio en Ciudad o Bosque para desbloquear Marte');
      }
    });
    list.appendChild(card);
  });
}

document.getElementById('btn-play').addEventListener('click', ()=>{ Audio1.click(); startGame(); });
document.getElementById('btn-maps').addEventListener('click', ()=>{ Audio1.click(); goMaps(); });
document.getElementById('btn-maps-back').addEventListener('click', ()=>{ Audio1.click(); goMenu(); });
document.getElementById('btn-pause').addEventListener('click', ()=>{
  if(G.mode!=='playing') return;
  G.mode='paused'; showScreen('screen-pause');
});
document.getElementById('btn-resume').addEventListener('click', ()=>{
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  G.mode='playing';
});
document.getElementById('btn-restart-pause').addEventListener('click', ()=>{ Audio1.click(); startGame(); });
document.getElementById('btn-menu-pause').addEventListener('click', ()=>{ Audio1.click(); goMenu(); });
document.getElementById('btn-retry').addEventListener('click', ()=>{ Audio1.click(); startGame(); });
document.getElementById('btn-go-maps').addEventListener('click', ()=>{ Audio1.click(); goMaps(); });
document.getElementById('btn-go-menu').addEventListener('click', ()=>{ Audio1.click(); goMenu(); });

/* hook height tracking into doDrop success paths */
const _origDoDrop=doDrop;
doDrop=function(){
  const before=G.blocks.length;
  _origDoDrop();
  if(G.blocks.length>before) trackHeight();
};

/* ============================= INIT ============================= */
checkAutoUnlocks(0, levelFromXP(profile.xp).level); // in case save already qualifies
checkSpaceUnlock(false);
saveProfile();
goMenu();

})();