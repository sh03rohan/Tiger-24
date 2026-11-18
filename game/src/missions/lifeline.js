// Mission 13 — Operation Lifeline: hospital siege during a power cut; get the generator back, free patients and the minister
import { THREE, G, PI, M, B, RB, C, SP, PL, RX, add, canvasTex, rng, R, rr, V3 } from '../core.js';
import * as K from '../levelkit.js';
const { addCollider, wallX, wallZ, floor, ceiling, deco, pointLight, room, prop, Door } = K;

export const meta = { id: 'lifeline', no: '13', name: 'Operation Lifeline', art: 'hospital', type: 'Rescue · VIP', loc: 'Dhaka General Hospital', time: '03:20 hrs · load shedding', diff: 'Elite',
  obj: ['Generator chalu kore hospital er bidyut fera', 'Rogi, doctor ar Health Minister ke ambulance bay te pouchano', 'Hospital e gunman der shamlano'], intel: 'Red Tide minister ke ICU te atke rekheche. Bidyut nei, shudhu emergency alo. Generator chalu korle CCTV ar alo fire ashbe.' };

let power = 0, dim = [], panels = null, sirenL = null;
export function build() {
  power = 0; dim = [];
  K.beginLevel({ grade: { sat: 0.9, contrast: 1.12, sh: [0.95, 0.98, 1.08], hi: [1.06, 0.98, 0.96] }, bg: '#05070b', fog: '#0a0c10', fogD: 0.016, sun: 0.9, sunColor: '#8fa4d8', sunPos: [10, 30, 30], sunTarget: [0, 0, 0], shadowSize: 30, hemi: 0.6,
    rain: [[-30, 12.4, 30, 26]], rainN: 1200, alarmPos: [0, 3, 2], alarmBulbs: [[-8, 3.2, 2], [8, 3.2, 2], [0, 3.2, -8]], skyTop: '#03050a', skyBottom: '#141c2c', city: true, skyDist: 70, alarmLight: true, police: [-6, 2.5, 18] });
  const LG = K.LG, m = K.makeMaterials();
  const tileF = M('#ffffff', 0.32, 0.05, { map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#b8bcb6'; g.fillRect(0, 0, w, h); const r = rng(5); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = 190 + r() * 25; g.fillStyle = `rgb(${v - 6},${v},${v - 4})`; g.fillRect(i * 64 + 1, j * 64 + 1, 62, 62); } for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.05})`; g.fillRect(r() * w, r() * h, 2, 2); } }, { repeat: [24, 18] }) });
  const wallM = M('#ffffff', 0.85, 0, { map: canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#c9d2cc'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a8a7a'; g.fillRect(0, h * 0.62, w, 6); g.fillStyle = '#9aa69e'; g.fillRect(0, h * 0.66, w, h * 0.34); const r = rng(7); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(80,60,40,${r() * 0.12})`; g.fillRect(r() * w, r() * h, 2 + r() * 8, 2 + r() * 20); } }, { repeat: [4, 1] }) });
  const ext = M('#ffffff', 0.9, 0, { map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#d8d4c8'; g.fillRect(0, 0, w, h); const r = rng(3); for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.05})`; g.fillRect(r() * w, r() * h, 2, 2); } }, { repeat: [6, 2] }) });
  room('ICU', 2, -16, 24, -4, 'tile', 0.45); room('Pharmacy', 2, -4, 24, 0, 'tile', 0.4); room('Generator room', -24, -4, -2, 0, 'concrete', 0.3); room('Operating theatre', -24, -16, -2, -4, 'tile', 0.4);
  room('Ward A', -24, 4, -8, 12, 'tile', 0.45); room('Ward B', 8, 4, 24, 12, 'tile', 0.45); room('Lobby', -8, 4, 8, 12, 'tile', 0.55); room('Corridor', -24, -16, 24, 4, 'tile', 0.45);
  room('Ambulance bay', -30, 12, 30, 24, 'asphalt', 0.5, false);
  floor(-24, -16, 24, 12, tileF); floor(-30, 12, 30, 24, m.asphalt); m.asphalt.map.repeat.set(10, 4); ceiling(-24, -16, 24, 12, 3.4, m.ceiling);
  // exterior + main entrance
  wallX(12, -24, 24, 3.4, ext, [{ a: -2, b: 2, y0: 0, y1: 2.6 }], { mat: 'concrete' }); wallX(-16, -24, 24, 3.4, ext, [], { mat: 'concrete' }); wallZ(-24, -16, 12, 3.4, ext, [], { mat: 'concrete' }); wallZ(24, -16, 12, 3.4, ext, [], { mat: 'concrete' });
  deco(B(48.4, 0.4, 28.4), ext, [0, 3.6, -2]); deco(PL(6, 1), new THREE.MeshBasicMaterial({ map: canvasTex(512, 86, (g, w, h) => { g.fillStyle = '#0a2a24'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8fff4'; g.font = '700 46px "Saira Condensed", sans-serif'; g.textAlign = 'center'; g.fillText('+  DHAKA GENERAL HOSPITAL', w / 2, 60); }), toneMapped: false }), [0, 3.1, 12.22], null, null, false);
  for (const [x1, z1, x2, z2] of [[-30, 23.8, 30, 24], [-30.2, 12, -30, 24], [30, 12, 30.2, 24]]) addCollider(x1, 0, z1, x2, 3, z2, { vis: false });
  // corridor + wards + lobby
  wallX(4, -24, -8, 3.4, wallM, [{ a: -14, b: -12.8, y0: 0, y1: 2.3 }]); wallZ(-8, 4, 12, 3.4, wallM); wallX(4, 8, 24, 3.4, wallM, [{ a: 12, b: 13.2, y0: 0, y1: 2.3 }]); wallZ(8, 4, 12, 3.4, wallM);
  wallX(0, -24, -2, 3.4, wallM, [{ a: -20, b: -18.8, y0: 0, y1: 2.3 }, { a: -6, b: -4.8, y0: 0, y1: 2.3 }]); wallX(0, 2, 24, 3.4, wallM, [{ a: 14, b: 15.2, y0: 0, y1: 2.3 }]);
  wallZ(-2, -16, 0, 3.4, wallM, [{ a: -12, b: -10.8, y0: 0, y1: 2.3 }]); wallZ(2, -16, 0, 3.4, wallM, [{ a: -9, b: -7.8, y0: 0, y1: 2.3 }]);
  wallX(-4, -24, -2, 3.4, wallM); wallX(-4, 2, 24, 3.4, wallM);
  new Door({ axis: 'x', x1: -14, z: 4, w: 1.2 }); new Door({ axis: 'x', x1: 12, z: 4, w: 1.2 }); new Door({ axis: 'x', x1: -20, z: 0, w: 1.2, name: 'gen' }); new Door({ axis: 'x', x1: -6, z: 0, w: 1.2 });
  new Door({ axis: 'x', x1: 14, z: 0, w: 1.2 }); new Door({ axis: 'z', x: -2, z1: -12, w: 1.2, name: 'or' }); new Door({ axis: 'z', x: 2, z1: -9, w: 1.2, name: 'icu' });
  // beds
  const bedM = M('#e8ece8', 0.7), frameM = M('#8a9096', 0.4, 0.6), blanket = M('#7ab0c8', 0.9);
  const bed = (x, z, rot) => { const w = rot ? 2.1 : 1.0, d = rot ? 1.0 : 2.1; addCollider(x - w / 2, 0, z - d / 2, x + w / 2, 0.62, z + d / 2, { vis: false, mat: 'metal', pen: true }); deco(B(1.0, 0.18, 2.0), bedM, [x, 0.55, z], [0, rot ? PI / 2 : 0, 0]); deco(B(0.96, 0.06, 1.3), blanket, [x, 0.66, z + (rot ? 0 : 0.25)], [0, rot ? PI / 2 : 0, 0]); deco(B(1.04, 0.45, 1.06 * 2), frameM, [x, 0.24, z], [0, rot ? PI / 2 : 0, 0]); deco(B(0.5, 0.1, 0.35), m.white, [x, 0.7, z - 0.75], [0, rot ? PI / 2 : 0, 0]); };
  for (const x of [-22, -19, -16, -13, -10]) { bed(x, 10.6, false); deco(B(0.03, 2.2, 2.2), M('#8ab4c4', 0.95, 0, { transparent: true, opacity: 0.85 }), [x + 1.4, 1.2, 10.4], null, null, false); }
  for (const x of [10, 13, 16, 19, 22]) { bed(x, 10.6, false); deco(B(0.03, 2.2, 2.2), M('#8ab4c4', 0.95, 0, { transparent: true, opacity: 0.85 }), [x - 1.4, 1.2, 10.4], null, null, false); }
  for (const x of [6, 10, 14, 18, 22]) { bed(x, -14.6, false); addCollider(x + 0.8, 0, -15.9, x + 1.3, 1.5, -15.4, { vm: m.darkSteel, mat: 'metal' }); deco(PL(0.4, 0.28), new THREE.MeshBasicMaterial({ color: '#3cff8a', toneMapped: false }), [x + 1.05, 1.3, -15.38], null, null, false); }
  // lobby: reception desk + waiting chairs
  addCollider(-3, 0, 6.6, 3, 1.05, 7.4, { vm: m.white, mat: 'wood', pen: true }); deco(B(6.1, 0.05, 0.9), m.woodLight, [0, 1.08, 7]);
  for (const z of [9.2, 10.6]) addCollider(3.6, 0, z - 0.3, 7.2, 0.5, z + 0.3, { vm: M('#3a7a8a', 0.8), mat: 'wood', pen: true });
  // operating theatre
  addCollider(-14.1, 0, -10.5, -11.9, 0.9, -9.5, { vm: m.steel, mat: 'metal' }); deco(C(0.6, 0.5, 0.15, 20), m.white, [-13, 3.2, -10]); deco(SP(0.3, 12, 8), new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#e8f8ff', emissiveIntensity: 1.2 }), [-13, 3.1, -10], null, [1, 0.3, 1], false);
  addCollider(-23.8, 0, -15.8, -21.4, 1.8, -15.2, { vm: m.steel, mat: 'metal' }); addCollider(-9, 0, -15.8, -6, 1.0, -15.1, { vm: m.steel, mat: 'metal' });
  // generator room
  addCollider(-23.6, 0, -3.6, -21, 1.6, -1.4, { vm: M('#4a6a3a', 0.6, 0.4), mat: 'metal' }); deco(C(0.25, 0.25, 1.4, 12), m.darkSteel, [-22.3, 2.2, -2.5]); for (let x = -16; x < -3; x += 3) addCollider(x, 0, -3.8, x + 1.6, 1.8, -3.2, { vm: m.cardboard, mat: 'wood', pen: true });
  // pharmacy shelves
  for (const x of [5, 9, 18, 22]) addCollider(x - 1, 0, -3.7, x + 1, 2, -3.2, { vm: M('#e8e8e0', 0.7), mat: 'wood', pen: true });
  // ambulance bay
  for (const [x, z, ry] of [[-10, 17, 0.1], [9, 18, -0.2]]) { deco(B(2.3, 2.4, 5.6), m.white, [x, 1.4, z], [0, ry, 0]); deco(B(2.32, 0.4, 5.62), m.red, [x, 1.2, z], [0, ry, 0], null, false); deco(B(1.6, 0.18, 0.4), new THREE.MeshBasicMaterial({ color: '#3a6aff', toneMapped: false }), [x, 2.7, z - 1.8], [0, ry, 0], null, false);
    const c = Math.abs(Math.cos(ry)), s2 = Math.abs(Math.sin(ry)); addCollider(x - (c * 1.15 + s2 * 2.8), 0, z - (s2 * 1.15 + c * 2.8), x + (c * 1.15 + s2 * 2.8), 2.6, z + (s2 * 1.15 + c * 2.8), { vis: false, mat: 'metal' }); }
  deco(B(10, 0.1, 6), M('#ffffff', 0.6, 0, { map: canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#20242a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e8d24a'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = '#e8d24a'; g.font = '700 36px sans-serif'; g.textAlign = 'center'; g.fillText('AMBULANCE', w / 2, 76); }) }), [0, 0.01, 17.5], null, null, false);
  // lights: emergency red until the generator runs
  const L = (c, i, d, x, y, z) => { const a = pointLight(c, i * 0.22, d, x, y, z); a.full = i; dim.push(a); return a; };
  for (const [x, z] of [[-16, 2], [-6, 2], [6, 2], [16, 2], [0, -6], [0, -13], [-16, 8], [16, 8], [0, 8], [12, -10], [-13, -10], [-12, -2], [12, -2]]) L('#fff4e6', 9, 12, x, 3.1, z);
  for (const [x, z] of [[-20, 2], [20, 2], [0, -14], [4, 9]]) pointLight('#ff2a1a', 3, 7, x, 2.8, z);
  pointLight('#cfe0ff', 7, 18, 0, 4, 18); sirenL = pointLight('#3a6aff', 0, 14, 9, 3, 17);
  panels = new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#f4fbff', emissiveIntensity: 0.15 });
  for (let x = -20; x <= 20; x += 5) deco(B(1.4, 0.04, 0.6), panels, [x, 3.37, 2], null, null, false); for (let z = -14; z <= -2; z += 4) deco(B(0.6, 0.04, 1.4), panels, [0, 3.37, z], null, null, false);
  K.shaft(V3(0, 2.6, 12.3), V3(0, -0.35, -1), 9, 1.6, 3.4, '#cfe0ff', 0.05);
  // tasks + items
  K.addInteractable('task', V3(-20.6, 0, -2.4), 'Generator chalu koro', K.pickupModel('lever', V3(-20.6, 0, -2.4), -PI / 2), { id: 'gen', hold: 3, done: 'Generator cholche! Alo ar CCTV fire esheche', onUse: () => { power = 1; } });
  for (const [kind, pos, label] of [['ammo', V3(-4, 0.2, 13.4), 'Ammo refill'], ['medkit', V3(5, 1.25, -3.1), 'Medkit nao'], ['medkit', V3(22, 1.25, -3.1), 'Medkit nao'], ['ammo', V3(-8.6, 0.2, -15.2), 'Ammo refill'], ['medkit', V3(-2.4, 1.2, 7), 'Medkit nao']]) K.addInteractable(kind, pos, label, K.pickupModel(kind, pos));
  for (let i = 0; i < 6; i++) prop(i % 2 ? 'chair' : 'bin', rr(-20, 20), 0, rr(0.6, 3.4)); prop('extinguisher', -1.6, 0, -1); prop('cart', 18, 0, 6.2);
  K.buildCameras([{ pos: V3(-7.6, 3.0, 11.6), yaw: K.camLook(V3(-7.6, 0, 11.6), V3(0, 0, 4)), pitch: -0.35 }, { pos: V3(23.6, 3.0, 3.6), yaw: K.camLook(V3(23.6, 0, 3.6), V3(10, 0, 1)), pitch: -0.3 }]);
  return {
    id: 'lifeline', bounds: { x0: -30.4, z0: -16.4, x1: 30.4, z1: 24.4 },
    spawns: { bay: { pos: V3(0, 0, 21), yaw: 0, label: 'Ambulance bay', desc: 'Ambulance er arale theke main entrance. Lobby te shoja dhukben.', risk: 'Risk: High · Direct' },
      roof: { pos: V3(0, 0, -15), yaw: PI, label: 'Roof stairwell', desc: 'Chhad theke siri diye north corridor e. ICU ar OT er majhe, surprise.', risk: 'Risk: High · Surprise', surprise: ['ICU', 'Operating theatre'] } },
    enemies: [
      { id: 'E1', pos: V3(-1, 0, 9), yaw: 0, room: 'Lobby', patrol: [V3(-6, 0, 9), V3(6, 0, 8.4)] }, { id: 'E2', pos: V3(-17, 0, 6.6), yaw: PI, room: 'Ward A' }, { id: 'E3', pos: V3(16, 0, 6.6), yaw: PI, room: 'Ward B' },
      { id: 'E4', pos: V3(-10, 0, 2), yaw: -PI / 2, room: 'Corridor', patrol: [V3(-22, 0, 2), V3(22, 0, 2)] }, { id: 'E5', pos: V3(0, 0, -6), yaw: 0, room: 'Corridor', heavy: true },
      { id: 'E6', pos: V3(-13, 0, -7.6), yaw: 0, room: 'Operating theatre' }, { id: 'E7', pos: V3(-12, 0, -2), yaw: PI / 2, room: 'Generator room' }, { id: 'E8', pos: V3(11, 0, -1.8), yaw: -PI / 2, room: 'Pharmacy' },
      { id: 'E9', pos: V3(8, 0, -10), yaw: PI / 2, room: 'ICU' }, { id: 'E10', pos: V3(19, 0, -8), yaw: PI, room: 'ICU', heavy: true }, { id: 'E11', pos: V3(4, 0, 18), yaw: 0, room: 'Ambulance bay' },
      { id: 'LEADER', pos: V3(15.6, 0, -11), yaw: -PI / 2, room: 'ICU', leader: true, name: 'Red Tide doctor' },
    ],
    hostages: [{ pos: V3(-22, 0, 8.4), yaw: PI }, { pos: V3(-16, 0, 8.4), yaw: PI }, { pos: V3(-10, 0, 8.4), yaw: PI }, { pos: V3(13, 0, 8.4), yaw: PI }, { pos: V3(19, 0, 8.4), yaw: PI },
      { pos: V3(-5, 0, 9.4), yaw: 0.4 }, { pos: V3(-6.4, 0, 9.8), yaw: 0.2 }, { pos: V3(22, 0, -8.6), yaw: -PI / 2, look: { shirt: '#ffffff', trousers: '#6a8aa0', skin: '#c08a62', seed: 71 } },
      { pos: V3(14, 0, -12), yaw: 0, vip: true, name: 'Health Minister', look: { shirt: '#ffffff', trousers: '#2a2c34', tie: '#6a1a1a', skin: '#a87652', hair: '#9a9a9a', seed: 72 } }],
    exits: [V3(0, 0, 17)], rescued: p => p.z > 13.4,
    objectives: [{ type: 'task', id: 'gen', label: 'Generator chalu koro' }, { type: 'rescue', label: 'Shobai ke ambulance bay te pathao' }, { type: 'protect', label: 'Health Minister ke bachao' }, { type: 'neutralize' }], bonus: ['leader', 'stealth'],
    timer: { kind: 'deadline', s: { recruit: 1320, veteran: 1080, elite: 900 } }, deadlineFail: 'Red Tide minister ke hospital theke shoriye niyeche.', executions: true, maxDead: 3, shieldRetreat: V3(23, 0, -15),
    hawk: V3(14, 9, 34), hawkLine: ['Hawk on the car park roof. I have the bay and the lobby glass.', 'Hawk: Parking er chhade achi. Ambulance bay ar lobby dekhte pacchi.'],
    intro: { all: ['Power is out, they are using the dark. Generator first if you can, then the wards. The minister is in the ICU.', 'Rafi: Bidyut nei, ora andhokar kaje lagacche. Somvob hole age generator, tarpor ward. Minister ICU te.'] },
    update(dt, t) { const k = 0.22 + 0.78 * Math.min(1, (this._p = (this._p || 0) + (power ? dt * 0.6 : 0))); for (const a of dim) a.intensity = a.full * (power ? k : 0.22 + (Math.sin(t * 9 + a.pos.x) > 0.97 ? 0.3 : 0)); panels.emissiveIntensity = power ? 0.15 + 1.5 * Math.min(1, this._p) : 0.15; if (sirenL) sirenL.intensity = Math.sin(t * 8) > 0 ? 9 : 0; },
    winLine: ['Minister secured, patients out, the hospital is ours. Outstanding, Tiger 24.', 'Rafi: Minister nirapod, rogi ra baire, hospital amader. Oshadharon, Tiger 24!'],
    blueprint: { view: [-30, -16, 30, 24], markers: [[14, -12, 'MINISTER', 'h'], [-16, 8.4, '3', 'h'], [16, 8.4, '2', 'h'], [-5.6, 9.6, '2', 'h'], [22, -8.6, '1', 'h'], [-20.6, -2.4, 'GEN', 'b'], [0, 17, 'EXIT', 'b'], [-1, 9, '', 'e'], [-17, 6.6, '', 'e'], [16, 6.6, '', 'e'], [-10, 2, '', 'e'], [0, -6, '', 'e'], [-13, -7.6, '', 'e'], [-12, -2, '', 'e'], [11, -1.8, '', 'e'], [8, -10, '', 'e'], [19, -8, '', 'e'], [4, 18, '', 'e'], [15.6, -11, 'CMD', 'e']] },
  };
}
