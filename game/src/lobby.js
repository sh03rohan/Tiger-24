// Tiger 24 — main lobby: 3D hangar scene with the squad, helicopter and hologram table
import { THREE, G, PI, M, B, RB, C, SP, PL, RX, add, canvasTex, rng, R, rr, V3, A, damp, rrect } from './core.js';
import { makeOperator, buildWeapon, solveArm, TEX } from './assets.js';
import { heliModel } from './levelkit.js';
import { PRIMARIES } from './player.js';

export const LOBBY = { group: null, ops: {}, shadow: null, cams: null, goal: null, tgt: V3(), screen: 'splash' };
const POLE_R = V3(-1, -0.9, -0.3), POLE_L = V3(1, -1, 0.2);
export function missionArt(kind){
  const c=document.createElement('canvas'); c.width=960; c.height=540; const g=c.getContext('2d'); g.scale(2,2); const r=rng(kind.length*97+3); const W=480,H=270;
  const sky=(a,b,cc)=>{ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,a); gr.addColorStop(0.65,b); gr.addColorStop(1,cc||b); g.fillStyle=gr; g.fillRect(0,0,W,H); };
  const glow=(x,y,rad,col)=>{ const gr=g.createRadialGradient(x,y,0,x,y,rad); gr.addColorStop(0,col); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(0,0,W,H); };
  const sil='#05070a';
  if(kind==='bank'){ sky('#05070f','#141d33'); glow(120,250,160,'rgba(255,40,40,.45)'); glow(360,250,160,'rgba(40,80,255,.45)'); g.fillStyle=sil; g.fillRect(90,90,300,180); g.beginPath(); g.moveTo(80,92); g.lineTo(240,40); g.lineTo(400,92); g.fill();
    g.fillStyle='#1a2236'; for(let i=0;i<6;i++) g.fillRect(110+i*48,120,16,120); g.fillStyle='rgba(255,210,140,.7)'; g.fillRect(205,200,70,70); }
  if(kind==='ship'){ sky('#0a0f16','#26313d','#0b1218'); g.strokeStyle='rgba(220,230,255,.9)'; g.lineWidth=3; g.beginPath(); let x=330,y=0; g.moveTo(x,y); while(y<120){ x+=(r()-.5)*40; y+=18; g.lineTo(x,y); } g.stroke(); glow(330,30,120,'rgba(180,200,255,.25)');
    g.fillStyle=sil; g.beginPath(); g.moveTo(40,190); g.lineTo(420,180); g.lineTo(400,225); g.lineTo(70,230); g.fill(); const cols=['#3a1f1a','#1f2f3a','#2f3a1f','#3a331f']; for(let i=0;i<14;i++){ g.fillStyle=cols[i%4]; g.fillRect(80+i*22,150-(i%3)*12,20,32+(i%3)*12); } g.fillStyle=sil; g.fillRect(360,120,40,62);
    g.fillStyle='#0d1820'; g.fillRect(0,225,W,45); g.strokeStyle='rgba(140,170,200,.3)'; for(let i=0;i<14;i++){ g.beginPath(); g.arc(r()*W,232+r()*35,20+r()*30,PI,0); g.stroke(); } }
  if(kind==='jungle'){ sky('#2a1408','#c4602a','#5a2a10'); glow(380,170,140,'rgba(255,170,80,.6)'); g.fillStyle=sil; for(let i=0;i<26;i++){ const x=r()*W, h=80+r()*120; g.beginPath(); g.moveTo(x,H); g.lineTo(x+14,H-h); g.lineTo(x+28,H); g.fill(); g.beginPath(); g.arc(x+14,H-h,18+r()*14,0,PI*2); g.fill(); }
    g.save(); g.translate(150,70); g.fillStyle=sil; g.beginPath(); g.ellipse(0,0,46,16,0,0,PI*2); g.fill(); g.fillRect(-100,-4,70,6); g.fillRect(-110,-16,8,22); g.fillRect(-90,-20,180,3); g.restore(); }
  if(kind==='sky'){ sky('#03050b','#101a2e'); for(let i=0;i<20;i++){ const bw=20+r()*40,bh=60+r()*130,x=r()*W; g.fillStyle='#070b14'; g.fillRect(x,H-bh,bw,bh); }
    g.fillStyle=sil; g.fillRect(200,20,80,250); g.fillStyle='rgba(160,190,255,.5)'; for(let y=30;y<260;y+=12) for(let x=208;x<272;x+=10) if(r()<0.35) g.fillRect(x,y,5,6); glow(240,50,90,'rgba(255,120,40,.75)'); }
  if(kind==='train'){ sky('#1a0f1f','#a0405a','#2a1420'); glow(90,170,120,'rgba(255,150,120,.5)'); g.fillStyle=sil; g.fillRect(0,200,W,10); for(let x=10;x<W;x+=50){ g.fillRect(x,210,8,60); g.beginPath(); g.moveTo(x,210); g.lineTo(x+25,240); g.lineTo(x+50,210); g.lineWidth=4; g.strokeStyle=sil; g.stroke(); }
    for(let i=0;i<5;i++) { rrect(g,40+i*86,160,80,40,6); g.fill(); } g.fillStyle='rgba(255,220,150,.6)'; for(let i=0;i<5;i++) for(let j=0;j<4;j++) g.fillRect(50+i*86+j*18,170,10,10); g.strokeStyle='rgba(255,255,255,.25)'; for(let i=0;i<10;i++){ g.beginPath(); g.moveTo(r()*W,140+r()*60); g.lineTo(r()*W-80,140+r()*60); g.stroke(); } }
  if(kind==='embassy'){ sky('#0a1018','#2a3646'); g.fillStyle=sil; g.fillRect(100,120,280,150); g.beginPath(); g.moveTo(90,122); g.lineTo(240,80); g.lineTo(390,122); g.fill(); g.fillRect(238,20,4,62); g.fillStyle='#3a5a8a'; g.fillRect(242,22,40,24);
    glow(60,40,200,'rgba(220,230,255,.18)'); g.fillStyle='rgba(255,255,255,.7)'; for(let i=0;i<120;i++) g.fillRect(r()*W,r()*H,2,2); g.fillStyle='rgba(255,220,150,.5)'; g.fillRect(150,170,30,40); g.fillRect(300,170,30,40); }
  if(kind==='crash'){ sky('#1a0805','#5a1f12','#2a0d08'); g.fillStyle='rgba(30,25,25,.8)'; for(let i=0;i<12;i++){ g.beginPath(); g.arc(250+(r()-.5)*60*i*0.3,200-i*16,20+i*4,0,PI*2); g.fill(); } glow(250,220,110,'rgba(255,120,40,.7)');
    g.fillStyle=sil; g.save(); g.translate(250,230); g.rotate(-0.3); g.beginPath(); g.ellipse(0,0,70,24,0,0,PI*2); g.fill(); g.fillRect(40,-6,120,10); g.restore(); g.fillRect(0,250,W,20); }
  if(kind==='hq'){ sky('#12030a','#400a1a','#1a0508'); g.fillStyle='#d03030'; g.beginPath(); g.arc(360,70,40,0,PI*2); g.fill(); g.fillStyle='#200610'; g.beginPath(); g.arc(378,62,36,0,PI*2); g.fill();
    g.fillStyle=sil; g.beginPath(); g.moveTo(0,H); g.lineTo(140,140); g.lineTo(240,170); g.lineTo(330,120); g.lineTo(W,H); g.fill(); g.fillRect(150,110,150,70); for(let i=0;i<5;i++) g.fillRect(150+i*36,96,18,16); g.fillStyle='rgba(255,60,40,.7)'; for(let i=0;i<6;i++) g.fillRect(165+i*22,135,6,8); }
  if(kind==='plane'){ sky('#03050c','#141c30','#0a0e18'); glow(400,60,140,'rgba(255,60,60,.25)'); g.fillStyle='#1a1e26'; g.fillRect(0,215,W,55); g.fillStyle='rgba(255,210,140,.9)'; for(let x=0;x<W;x+=18){ g.fillRect(x,228,3,2); g.fillRect(x+9,252,3,2); }
    g.fillStyle=sil; g.beginPath(); g.ellipse(250,165,190,24,0,0,PI*2); g.fill(); g.beginPath(); g.moveTo(400,160); g.lineTo(450,95); g.lineTo(470,95); g.lineTo(440,165); g.fill(); g.beginPath(); g.moveTo(220,170); g.lineTo(140,215); g.lineTo(175,215); g.lineTo(290,172); g.fill();
    g.fillStyle='rgba(255,220,160,.7)'; for(let x=110;x<380;x+=11) g.fillRect(x,158,4,4); glow(120,240,120,'rgba(255,40,40,.35)'); glow(300,240,120,'rgba(40,90,255,.35)'); }
  if(kind==='rig'){ sky('#05070c','#1a2430','#0a1016'); g.strokeStyle='rgba(220,230,255,.85)'; g.lineWidth=2; g.beginPath(); let x=90,y=0; g.moveTo(x,y); while(y<110){ x+=(r()-.5)*36; y+=16; g.lineTo(x,y); } g.stroke();
    g.fillStyle='#0b141a'; g.fillRect(0,210,W,60); g.fillStyle=sil; g.fillRect(140,150,240,26); for(const x of [160,350]) g.fillRect(x,176,16,60); g.beginPath(); g.moveTo(240,150); g.lineTo(262,40); g.lineTo(270,40); g.lineTo(292,150); g.fill(); g.fillRect(150,128,60,22);
    g.fillStyle='rgba(255,140,40,.9)'; g.beginPath(); g.arc(420,110,8,0,PI*2); g.fill(); glow(420,110,70,'rgba(255,140,40,.5)'); g.strokeStyle='rgba(140,160,190,.4)'; g.lineWidth=1; for(let i=0;i<80;i++){ const a=r()*W,b=r()*H; g.beginPath(); g.moveTo(a,b); g.lineTo(a-4,b+14); g.stroke(); } }
  if(kind==='metro'){ sky('#060807','#1a201c'); g.fillStyle='#202622'; g.beginPath(); g.moveTo(0,40); g.lineTo(W,40); g.lineTo(330,120); g.lineTo(150,120); g.fill(); g.fillStyle='#0a0c0b'; g.beginPath(); g.ellipse(240,150,48,38,0,0,PI*2); g.fill();
    g.fillStyle='rgba(235,250,230,.9)'; for(let i=0;i<6;i++){ const t=i/6; g.fillRect(40+t*110,50+t*60,80-t*60,3); g.fillRect(360-t*110-(80-t*60)+40,50+t*60,80-t*60,3); } g.fillStyle='#c9ccd0'; g.beginPath(); g.moveTo(170,270); g.lineTo(215,170); g.lineTo(265,170); g.lineTo(310,270); g.fill(); g.fillStyle='rgba(255,230,180,.8)'; g.fillRect(225,185,30,14);
    g.fillStyle='#d9b21b'; g.fillRect(0,236,150,3); g.fillRect(330,236,150,3); glow(240,150,90,'rgba(255,60,40,.35)'); }
  if(kind==='harbor'){ sky('#04060c','#1a2236','#0a0f16'); g.fillStyle='#0a141a'; g.fillRect(0,215,W,55); g.fillStyle=sil; g.fillRect(270,120,190,95); g.fillRect(380,80,60,40); g.fillRect(40,90,10,125); g.fillRect(40,90,180,8); g.fillRect(200,90,8,60);
    const cc=['#3a1f1a','#1f2f3a','#2f3a1f','#3a331f']; for(let i=0;i<9;i++){ g.fillStyle=cc[i%4]; g.fillRect(60+(i%5)*36,170-Math.floor(i/5)*22,34,20); } g.fillStyle='rgba(255,220,170,.9)'; g.fillRect(130,40,14,6); glow(137,60,110,'rgba(255,230,190,.3)');
    g.strokeStyle='rgba(140,160,190,.35)'; for(let i=0;i<90;i++){ const a=r()*W,b=r()*H; g.beginPath(); g.moveTo(a,b); g.lineTo(a-3,b+12); g.stroke(); } }
  g.fillStyle='rgba(0,0,0,.18)'; for(let y=0;y<H;y+=3) g.fillRect(0,y,W,1);
  return c.toDataURL('image/jpeg',0.86);
}

function opModel(look) {
  const m = makeOperator(look); const op = { m, root: m.root, rig: m.rig, ph: R() * 9, look: 0, swap: 0 };
  op.setWeapon = kind => { if (m.weapon) m.rig.chest.remove(m.weapon.group); m.weapon = buildWeapon(kind); m.rig.chest.add(m.weapon.group); op.swap = 1; };
  op.setCamo = k => { m.uni.map = TEX[k] || TEX.multicam; m.uni.needsUpdate = true; };
  op.update = (t, dt) => { const r = m.rig, W = m.weapon; r.spine.rotation.x = 0.04 + Math.sin(t * 1.6 + op.ph) * 0.012; r.chest.rotation.y = Math.sin(t * 0.45 + op.ph) * 0.04 + op.look;
    r.head.rotation.y = Math.sin(t * 0.33 + op.ph) * 0.28 + op.look * 1.5; r.hips.position.y = 0.98 + Math.sin(t * 1.6 + op.ph) * 0.003;
    r.legs.L.thigh.rotation.set(-0.14, 0, 0.05); r.legs.L.knee.rotation.x = 0.2; r.legs.R.thigh.rotation.set(0.12, 0, -0.06); r.legs.R.knee.rotation.x = 0.12; r.legs.R.ankle.rotation.x = -0.24;
    op.swap = Math.max(0, op.swap - dt * 2.5); const lo = W.low; W.group.position.set(lo[0], lo[1] - op.swap * 0.25, lo[2]); W.group.rotation.set(lo[3] + op.swap * 0.9, 0, 0); W.group.updateMatrix();
    solveArm(r.arms.R, W.gripR.clone().applyMatrix4(W.group.matrix), POLE_R); solveArm(r.arms.L, W.gripL.clone().applyMatrix4(W.group.matrix), POLE_L); };
  return op;
}
export const SQUAD_INFO = [
  { id: 'rafi', name: 'Rafi', role: 'Team Lead', ability: 'Bhalo shooter, shobshomoy apnar pashe thake', stats: { Aim: 78, CQB: 84, Support: 70, Stealth: 60 }, look: { head: 'cap', vest: '#2a2c2e', skin: '#a5714d', camo: 'night', scale: 1.02, weapon: 'tg24', mask: false } },
  { id: 'hawk', name: 'Hawk', role: 'Sniper', ability: 'Bahire theke overwatch · Z chaple enemy mark kore snipe', stats: { Aim: 96, CQB: 42, Support: 58, Stealth: 82 }, look: { camo: 'woodland', head: 'boonie', vest: '#3d4628', skin: '#8d5a3b', weapon: 'm80', mask: false } },
  { id: 'bolt', name: 'Bolt', role: 'Breacher', ability: 'T chaple locked door e breach charge · bhitorer enemy stunned', stats: { Aim: 60, CQB: 95, Support: 55, Stealth: 30 }, look: { head: 'helmet', vest: '#4a4a34', skin: '#d6a47e', weapon: 'b12', scale: 1.07 } },
  { id: 'nila', name: 'Nila', role: 'Medic', ability: 'Apnar health kome gele +40 heal · down teammate ke tule dey', stats: { Aim: 66, CQB: 62, Support: 98, Stealth: 64 }, look: { camo: 'urban', head: 'helmet', helmet: '#3c4045', vest: '#3a3e42', skin: '#b9835c', weapon: 'k9', medic: true, scale: 0.95 } },
  { id: 'ghost', name: 'Ghost', role: 'Recon · Hacker', ability: 'Kache enemy auto detect · Y chaple drone scan e shob enemy map e', stats: { Aim: 70, CQB: 58, Support: 76, Stealth: 97 }, look: { camo: 'night', head: 'helmet', helmet: '#1c1e20', vest: '#1f2123', skin: '#e0b48e', weapon: 'k9', nvgDown: true, maskColor: '#141516' } },
];
const LINE = { rafi: [-0.6, 0.5, 0.35], hawk: [2.55, 0.4, -0.4], bolt: [-1.85, -0.3, 0.55], nila: [3.75, -0.4, -0.6], ghost: [-3.0, -1.3, 0.7] };
export const CAMS = {
  splash: { pos: [-1.4, 2.3, 11], tgt: [1.6, 1.7, -3] }, main: { pos: [-4.4, 1.8, 8.6], tgt: [-1.9, 1.25, -1.0] }, campaign: { pos: [-6.4, 3.3, 1.9], tgt: [-4.3, 0.8, -1.0] },
  squad: { pos: [0.8, 1.9, 9.6], tgt: [0.8, 0.6, 0] }, loadout: { pos: [-0.9, 1.45, 4.0], tgt: [0.55, 1.15, 1.5] }, settings: { pos: [-3.4, 2.6, 9.5], tgt: [2.5, 1.8, -6] },
};

export function buildLobby() {
  const g = LOBBY.group = new THREE.Group(); g.name = 'lobby'; G.scene.add(g);
  const conc = canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#3c3f40'; c.fillRect(0, 0, w, h); const r = rng(31); for (let i = 0; i < 9000; i++) { const v = Math.floor(50 + r() * 50); c.fillStyle = `rgba(${v},${v},${v},.3)`; c.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } }, { repeat: [10, 8] });
  const fl = add(g, new THREE.PlaneGeometry(40, 32), M('#ffffff', 0.55, 0.1, { map: conc }), [0, 0, -2], [-PI / 2, 0, 0], null, false);
  const lineM = M('#d9a21b', 0.6); for (const x of [-7.5, 10]) add(g, new THREE.PlaneGeometry(0.15, 26), lineM, [x, 0.003, -3], [-PI / 2, 0, 0], null, false);
  const padTex = canvasTex(512, 512, c => { c.strokeStyle = 'rgba(230,230,220,.75)'; c.lineWidth = 16; c.beginPath(); c.arc(256, 256, 230, 0, PI * 2); c.stroke(); c.fillStyle = 'rgba(230,230,220,.75)'; c.fillRect(150, 120, 50, 272); c.fillRect(312, 120, 50, 272); c.fillRect(150, 232, 212, 48); });
  add(g, new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial({ map: padTex, transparent: true, depthWrite: false }), [3, 0.004, -7], [-PI / 2, 0, 0], null, false);
  const logoTex = canvasTex(512, 512, c => { c.fillStyle = 'rgba(242,155,43,.55)'; for (let i = 0; i < 5; i++) { const y = 110 + i * 30; c.beginPath(); c.moveTo(40, y); c.lineTo(170, y + 14); c.lineTo(40, y + 24); c.fill(); c.beginPath(); c.moveTo(472, y); c.lineTo(342, y + 14); c.lineTo(472, y + 24); c.fill(); }
    c.textAlign = 'center'; c.font = '800 150px "Saira Condensed", "Arial Narrow", sans-serif'; c.fillText('TIGER', 256, 330); c.font = '800 170px "Saira Condensed", "Arial Narrow", sans-serif'; c.fillText('24', 256, 480); });
  add(g, new THREE.PlaneGeometry(4, 4), new THREE.MeshStandardMaterial({ map: logoTex, transparent: true, depthWrite: false }), [-2.5, 0.005, 4.2], [-PI / 2, 0, 0.25], null, false);
  const corr = canvasTex(256, 256, (c, w, h) => { for (let x = 0; x < w; x += 16) { const gr = c.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, '#2a2f33'); gr.addColorStop(0.5, '#3d4348'); gr.addColorStop(1, '#22272a'); c.fillStyle = gr; c.fillRect(x, 0, 16, h); } }, { repeat: [14, 3] });
  const wallM = M('#ffffff', 0.6, 0.5, { map: corr });
  add(g, B(0.3, 12, 32), wallM, [-16, 6, -2]); add(g, B(0.3, 12, 32), wallM, [16, 6, -2]); add(g, B(32, 12, 0.3), wallM, [0, 6, 14]); add(g, B(4, 12, 0.3), wallM, [-14, 6, -18]); add(g, B(4, 12, 0.3), wallM, [14, 6, -18]); add(g, B(32, 2.6, 0.3), wallM, [0, 10.7, -18]);
  add(g, new THREE.PlaneGeometry(32, 32), M('#1a1d20', 0.8, 0.3), [0, 12, -2], [PI / 2, 0, 0], null, false);
  const steel = M('#2c3236', 0.5, 0.7); for (let z = -16; z <= 12; z += 4) { add(g, B(32, 0.35, 0.25), steel, [0, 11.4, z], null, null, false); for (const x of [-15.6, 15.6]) add(g, B(0.35, 11.4, 0.35), steel, [x, 5.7, z]); }
  add(g, C(0.5, 0.5, 24, 16), M('#3a4045', 0.5, 0.6), [0, 9.3, -17.6], [0, 0, PI / 2]);
  const lampM = new THREE.MeshStandardMaterial({ color: '#fff4dd', emissive: '#ffe9c2', emissiveIntensity: 3 }); for (const [x, z] of [[-6, -4], [6, -4], [-6, 6], [6, 6], [0, 1]]) { add(g, C(0.5, 0.6, 0.35, 16), M('#202428', 0.4, 0.7), [x, 10.6, z]); add(g, C(0.5, 0.5, 0.02, 16), lampM, [x, 10.42, z], null, null, false); }
  const crateTex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#4d5236'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2f3322'; c.lineWidth = 12; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = 'rgba(230,230,210,.75)'; c.font = '800 40px "Saira Condensed", sans-serif'; c.textAlign = 'center'; c.fillText('T24 · AMMO', w / 2, h / 2 + 8); });
  const crateM = M('#ffffff', 0.8, 0.05, { map: crateTex }); for (const [x, y, z, ry] of [[-10, 0.45, -9, 0.2], [-9, 0.45, -9.4, -0.1], [-9.6, 1.35, -9.2, 0.3], [11, 0.45, -2, 0.1], [11.2, 0.45, -0.8, -0.2], [12.5, 0.45, 4, 0.4], [-12, 0.45, 2.5, 0.6]]) add(g, RB(1.44, 0.81, 0.81, 0.03), crateM, [x, y, z], [0, ry, 0]);
  const rack = new THREE.Group(); rack.position.set(-7, 0, -10.5); rack.rotation.y = 0.35; g.add(rack); add(rack, B(3.2, 0.08, 0.5), steel, [0, 0.4, 0]); add(rack, B(3.2, 0.08, 0.3), steel, [0, 1.6, -0.1]); for (const x of [-1.55, 1.55]) add(rack, B(0.08, 1.8, 0.5), steel, [x, 0.9, 0]);
  ['tg24', 'm80', 'k9', 'b12', 'tg24', 'k9'].forEach((k, i) => { const r2 = buildWeapon(k); r2.group.rotation.set(-PI / 2 + 0.08, 0, 0); r2.group.position.set(-1.25 + i * 0.5, 0.85, 0.05); rack.add(r2.group); });
  // tactical table
  const table = new THREE.Group(); table.position.set(-5.2, 0, -0.8); table.rotation.y = 0.25; g.add(table); add(table, RB(2.6, 0.85, 1.6, 0.05), M('#1b1f22', 0.5, 0.6), [0, 0.425, 0]);
  const mapTex = canvasTex(1024, 640, (c, w, h) => { c.fillStyle = '#04161a'; c.fillRect(0, 0, w, h); const r = rng(51); c.strokeStyle = 'rgba(79,209,197,.18)'; for (let x = 0; x < w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y < h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.strokeStyle = 'rgba(79,209,197,.6)'; c.lineWidth = 5; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(r() * w, 0); c.bezierCurveTo(r() * w, h * 0.3, r() * w, h * 0.7, r() * w, h); c.stroke(); } c.fillStyle = 'rgba(79,209,197,.22)'; for (let i = 0; i < 70; i++) c.fillRect(r() * w, r() * h, 14 + r() * 40, 14 + r() * 40); });
  add(table, new THREE.PlaneGeometry(2.45, 1.45), new THREE.MeshStandardMaterial({ map: mapTex, emissive: '#ffffff', emissiveMap: mapTex, emissiveIntensity: 1.4 }), [0, 0.852, 0], [-PI / 2, 0, 0], null, false);
  const holoM = new THREE.MeshBasicMaterial({ color: '#4fd1c5', transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }); const holoE = new THREE.LineBasicMaterial({ color: '#4fd1c5', transparent: true, opacity: 0.55 });
  const hr = rng(77); LOBBY.holo = []; for (let i = 0; i < 18; i++) { const w = 0.08 + hr() * 0.12, hh = 0.06 + hr() * 0.42, x = (hr() - 0.5) * 2.1, z = (hr() - 0.5) * 1.2; const mm = new THREE.Mesh(B(w, hh, w), holoM); mm.position.set(x, 0.86 + hh / 2, z); table.add(mm); const e = new THREE.LineSegments(new THREE.EdgesGeometry(B(w, hh, w)), holoE); e.position.copy(mm.position); table.add(e); LOBBY.holo.push(mm, e); }
  // heli
  LOBBY.heli = heliModel(V3(3.2, 0, -7.4), 0.55, '#2f342b', g);
  // outside sky + rain
  const skyTex = canvasTex(1024, 512, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#05070b'); gr.addColorStop(1, '#1a2230'); c.fillStyle = gr; c.fillRect(0, 0, w, h); const r = rng(9); c.fillStyle = '#040507'; for (let i = 0; i < 30; i++) { const bw = 20 + r() * 60, bh = 30 + r() * 120, x = r() * w; c.fillRect(x, h - bh, bw, bh); } });
  LOBBY.skyM = new THREE.MeshBasicMaterial({ map: skyTex, fog: false }); const sky = new THREE.Mesh(new THREE.PlaneGeometry(110, 40), LOBBY.skyM); sky.position.set(0, 14, -55); g.add(sky);
  add(g, new THREE.PlaneGeometry(80, 40), M('#07090b', 0.2, 0.3), [0, -0.02, -38], [-PI / 2, 0, 0], null, false);
  const n = 1800, pos = new Float32Array(n * 6), vel = new Float32Array(n); for (let i = 0; i < n; i++) { const x = rr(-18, 18), y = rr(0, 16), z = rr(-38, -18.5); pos.set([x, y, z, x + 0.02, y - 0.45, z], i * 6); vel[i] = rr(14, 20); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); LOBBY.rain = { mesh: new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: '#8fa6c0', transparent: true, opacity: 0.35 })), pos, vel, n }; LOBBY.rain.mesh.frustumCulled = false; g.add(LOBBY.rain.mesh);
  // lights
  g.add(new THREE.HemisphereLight('#5d6a7a', '#14100c', 0.45));
  const key = new THREE.SpotLight('#ffe7c4', 260, 30, 0.55, 0.55, 1.6); key.position.set(1.5, 10.4, 5); key.target.position.set(1.4, 0, 0); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.normalBias = 0.03; g.add(key, key.target);
  const key2 = new THREE.SpotLight('#ffe2b8', 150, 28, 0.6, 0.6, 1.6); key2.position.set(5, 10.4, -5); key2.target.position.set(3, 0, -7); g.add(key2, key2.target);
  const key3 = new THREE.SpotLight('#ffe2b8', 90, 24, 0.6, 0.7, 1.6); key3.position.set(-6, 10.4, -2); key3.target.position.set(-6, 0, -3); g.add(key3, key3.target);
  const rim = new THREE.DirectionalLight('#7f9cff', 1.1); rim.position.set(2, 6, -20); g.add(rim); const holoL = new THREE.PointLight('#4fd1c5', 6, 5, 2); holoL.position.set(-5.2, 1.4, -0.8); g.add(holoL);
  LOBBY.flash = new THREE.DirectionalLight('#b9ccff', 0); LOBBY.flash.position.set(-10, 30, -60); g.add(LOBBY.flash);
  const coneTex = canvasTex(64, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,230,190,0.32)'); gr.addColorStop(1, 'rgba(255,230,190,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
  for (const [x, z, r] of [[1.5, 5, 3.2], [6, -4, 3.6], [-6, -4, 3.4]]) { const cone = new THREE.Mesh(new THREE.ConeGeometry(r, 10.2, 32, 1, true), new THREE.MeshBasicMaterial({ map: coneTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, opacity: 0.5, fog: false })); cone.position.set(x, 5.3, z); g.add(cone); }
  // squad
  const ringGeo = new THREE.RingGeometry(0.42, 0.46, 48);
  const mkRing = color => { const r2 = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, toneMapped: false })); r2.rotation.x = -PI / 2; r2.position.y = 0.006; g.add(r2); return r2; };
  LOBBY.shadow = opModel({ camo: 'multicam', weapon: 'tg24' }); LOBBY.shadow.root.position.set(1.0, 0, 1.6); LOBBY.shadow.root.rotation.y = -0.25; g.add(LOBBY.shadow.root);
  LOBBY.shadowRing = mkRing('#4fd1c5'); LOBBY.shadowRing.position.set(1.0, 0.006, 1.6);
  for (const s of SQUAD_INFO) { const op = opModel(s.look); const [x, z, ry] = LINE[s.id]; op.root.position.set(x, 0, z); op.root.rotation.y = ry; g.add(op.root); op.ring = mkRing('#f29b2b'); op.ring.position.set(x, 0.006, z); LOBBY.ops[s.id] = op; }
  LOBBY.goal = { pos: V3(...CAMS.splash.pos), tgt: V3(...CAMS.splash.tgt) }; LOBBY.tgt.copy(LOBBY.goal.tgt);
  LOBBY.nextBolt = 5; LOBBY.boltT = 0;
}
export function setLobbyCam(id, snap = false) { const c = CAMS[id] || CAMS.main; LOBBY.goal.pos.set(...c.pos); LOBBY.goal.tgt.set(...c.tgt); if (snap) { G.camera.position.copy(LOBBY.goal.pos); LOBBY.tgt.copy(LOBBY.goal.tgt); } }
export function showLobby(on) {
  LOBBY.group.visible = on;
  if (on) { G.scene.background = new THREE.Color('#06080a'); G.scene.fog = new THREE.FogExp2('#080b0d', 0.028); G.scene.environmentIntensity = 0.3; G.camera.fov = 38; G.camera.updateProjectionMatrix(); }
}
const mouse = new THREE.Vector2(); window.addEventListener('pointermove', e => { mouse.set(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1); });
export function updateLobby(dt, t, picked, focus) {
  const k = 1 - Math.exp(-dt * 2.6); const cam = G.camera; cam.position.lerp(LOBBY.goal.pos, k); LOBBY.tgt.lerp(LOBBY.goal.tgt, k);
  const base = cam.position.clone(); cam.position.x += mouse.x * 0.35 + Math.sin(t * 0.13) * 0.25; cam.position.y -= mouse.y * 0.12 + Math.sin(t * 0.21) * 0.06; cam.lookAt(LOBBY.tgt); cam.position.copy(base);
  const sq = LOBBY.screen === 'squad';
  LOBBY.shadow.look = LOBBY.screen === 'loadout' ? 0.3 : 0; LOBBY.shadow.update(t, dt); LOBBY.shadowRing.material.opacity = sq || LOBBY.screen === 'loadout' ? 0.9 : 0;
  for (const s of SQUAD_INFO) { const op = LOBBY.ops[s.id]; op.look = focus === s.id ? 0.25 : 0; op.update(t, dt); op.ring.material.opacity = sq ? (picked.includes(s.id) ? 0.95 : 0.15) : 0; op.ring.material.color.set(focus === s.id ? '#ffffff' : '#f29b2b'); }
  LOBBY.heli.userData.rotor.rotation.y += dt * 0.35; LOBBY.holo.forEach((m2, i) => { m2.material.opacity = (m2.isLineSegments ? 0.45 : 0.14) + Math.sin(t * 3 + i) * 0.04; });
  const R2 = LOBBY.rain; for (let i = 0; i < R2.n; i++) { const j = i * 6, dy = R2.vel[i] * dt; R2.pos[j + 1] -= dy; R2.pos[j + 4] -= dy; if (R2.pos[j + 4] < 0) { const y = 14 + R() * 3; R2.pos[j + 1] = y; R2.pos[j + 4] = y - 0.45; } } R2.mesh.geometry.attributes.position.needsUpdate = true;
  LOBBY.nextBolt -= dt; if (LOBBY.nextBolt <= 0) { LOBBY.boltT = 0.5; LOBBY.nextBolt = rr(6, 15); A.thunder(); }
  if (LOBBY.boltT > 0) { LOBBY.boltT -= dt; const f = (LOBBY.boltT > 0.38 || (LOBBY.boltT > 0.2 && LOBBY.boltT < 0.28)) ? 1 : 0; LOBBY.flash.intensity = f * 6; LOBBY.skyM.color.setScalar(1 + f * 2.5); } else { LOBBY.flash.intensity = 0; LOBBY.skyM.color.setScalar(1); }
}
export function tagPositions(rect) {
  const out = {}; G.camera.updateMatrixWorld(); const tmp = V3();
  const list = [['shadow', LOBBY.shadow], ...SQUAD_INFO.map(s => [s.id, LOBBY.ops[s.id]])];
  for (const [id, op] of list) { op.root.updateWorldMatrix(true, false); tmp.set(0, 1.98, 0); op.root.localToWorld(tmp); const p = tmp.clone().project(G.camera); out[id] = { x: (p.x + 1) / 2 * rect.width, y: (1 - p.y) / 2 * rect.height, vis: p.z < 1 }; }
  return out;
}
