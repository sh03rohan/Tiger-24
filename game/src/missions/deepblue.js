// Mission 02 — Operation Deep Blue: hijacked cargo ship in a storm
import { THREE, G, PI, M, B, RB, C, SP, PL, RX, add, canvasTex, rng, R, rr, V3 } from '../core.js';
import * as K from '../levelkit.js';
const { addCollider, wallX, wallZ, floor, ceiling, deco, pointLight, room, prop, Door } = K;

export const meta = { id: 'deepblue', no: '02', name: 'Operation Deep Blue', art: 'ship', type: 'Ship assault', loc: 'MV Orion Star · Bay of Bengal', time: '23:10 hrs · toofan', diff: 'Hard',
  obj: ['8 jon crew member ke lifeboat e pathano', 'Engine room e engine bondho kora', 'Bridge theke coast guard ke signal pathano'], intel: 'Dheu 4 meter, ship dulbe. Container er majhe gali gulo shoru. Bridge e leader ar ekjon sniper.' };

let sea = null;
export function build() {
  K.beginLevel({ fill: 1.8, exposure: 1.3, skyEnv: true, grade: { sat: 0.95, contrast: 1.1, sh: [0.9, 1.0, 1.1], hi: [1.0, 1.02, 1.02] }, bg: '#04070a', fog: '#071016', fogD: 0.02, sun: 1.8, sunColor: '#8aa6d8', hemi: 3.5, hemiSky: '#5a6a88', sunPos: [-8, 14, 30], sunTarget: [0, 0, -4], shadowSize: 24, rain: [[-14, -46, 14, 36]], rainN: 3000, lightning: true,
    alarmPos: [0, 4.2, -30], alarmBulbs: [[0, 4.6, -27.8], [-4, 3.2, 17.8]], skyTop: '#03050a', skyBottom: '#141e2a', city: false, skyDist: 70,  hemiSky: '#334058' });
  const LG = K.LG, m = K.makeMaterials();
  const plate = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#4a4f50'; g.fillRect(0, 0, w, h); const r = rng(3); for (let i = 0; i < 3000; i++) { const c = r() < 0.5 ? 20 : 120; g.fillStyle = `rgba(${c},${c - 10},${c - 20},.12)`; g.fillRect(r() * w, r() * h, 2, 2); }
    g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 3; for (let i = 0; i <= w; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
    g.fillStyle = 'rgba(120,60,30,.25)'; for (let i = 0; i < 30; i++) { g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 20, 3 + r() * 10, r() * 3, 0, 7); g.fill(); } }, { repeat: [8, 36] });
  const deckM = M('#9a9a96', 0.75, 0.2, { map: plate }), hull = M('#5a1a14', 0.6, 0.4), white = M('#d8d8d2', 0.6, 0.3), rail = M('#c8b030', 0.5, 0.6);
  const waterTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#081620'; g.fillRect(0, 0, w, h); const r = rng(9); for (let i = 0; i < 400; i++) { g.strokeStyle = `rgba(${90 + r() * 80},${130 + r() * 80},${160 + r() * 60},${0.08 + r() * 0.15})`; g.lineWidth = 1 + r() * 2; g.beginPath(); const x = r() * w, y = r() * h; g.moveTo(x, y); g.quadraticCurveTo(x + 10, y - 4, x + 20 + r() * 20, y); g.stroke(); } }, { repeat: [40, 40] });
  sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 400, 60, 60), new THREE.MeshStandardMaterial({ color: '#ffffff', map: waterTex, roughness: 0.15, metalness: 0.4 })); sea.rotation.x = -PI / 2; sea.position.y = -3.5; LG.add(sea);
  room('Bridge', -7, -40, 7, -34, 'tile', 0.7); room('Mess room', -7, -34, 7, -28, 'tile', 0.8); room('Engine room', -4, 18, 4, 26, 'concrete', 0.55); room('Deck', -9, -46, 9, 36, 'wet', 0.55, false);
  floor(-8, -40, 8, 32, deckM);
  // hull & rails
  deco(B(16.4, 4, 72), hull, [0, -2.03, -4]); deco(B(16.6, 0.25, 72.2), white, [0, -0.2, -4], null, null, false);
  for (const x of [-8.15, 8.15]) { addCollider(x - 0.1, 0, -40, x + 0.1, 1.1, 32, { vm: rail, mat: 'metal' }); for (let z = -39; z < 32; z += 2.5) deco(C(0.04, 0.04, 1.1, 6), rail, [x, 0.55, z], null, null, false); }
  addCollider(-8, 0, 32, 8, 1.1, 32.3, { vm: rail, mat: 'metal' }); addCollider(-8, 0, -40.3, 8, 1.1, -40, { vm: rail, mat: 'metal' });
  // superstructure (stern)
  const sw = M('#d6d4cc', 0.7, 0.2);
  wallX(-28.15, -7, 7, 4.5, sw, [{ a: -0.6, b: 0.6, y0: 0, y1: 2.3 }, { a: -5, b: -2.5, y0: 1.2, y1: 2.4 }, { a: 2.5, b: 5, y0: 1.2, y1: 2.4 }]);
  wallX(-40.15, -7, 7, 4.5, sw); wallZ(-7.15, -40, -28, 4.5, sw, [{ a: -31.8, b: -30.6, y0: 0, y1: 2.3 }]); wallZ(7.15, -40, -28, 4.5, sw, [{ a: -31.8, b: -30.6, y0: 0, y1: 2.3 }]);
  wallX(-34.15, -7, 7, 3.2, m.drywall, [{ a: -0.6, b: 0.6, y0: 0, y1: 2.3 }]);
  ceiling(-7, -40, 7, -28, 3.2, m.ceilingDark); deco(B(14.4, 1.4, 12.4), sw, [0, 5.2, -34]); deco(B(4, 0.1, 0.8), m.fluo, [0, 3.15, -31], null, null, false); deco(B(4, 0.1, 0.8), m.fluo, [0, 3.15, -37], null, null, false);
  for (const x of [-5, 2.5]) { K.addGlass(x, 1.2, -28.2, x + 2.5, 2.4, -28.1); }
  addCollider(-6.4, 0, -39.9, 6.4, 1.0, -39.1, { vm: m.darkSteel, mat: 'metal' }); for (let i = 0; i < 6; i++) deco(PL(0.8, 0.45), m.screen, [-5 + i * 2, 1.25, -39.08], null, null, false);
  addCollider(-3, 0, -32, 3, 0.75, -30.8, { vm: m.woodLight, mat: 'wood', pen: true }); for (const x of [-2, 0, 2]) { prop('chair', x, 0, -32.6, 0); prop('chair', x, 0, -30.2, PI); }
  pointLight('#eef4ff', 7, 10, 0, 3, -31); pointLight('#9fd0ff', 6, 10, 0, 3, -37);
  // containers
  const cols = ['#8a2a1f', '#1f4a7a', '#2f6a3a', '#c58a20', '#6a6a6a', '#7a3a6a'];
  const ribTex = canvasTex(128, 128, (g, w, h) => { for (let x = 0; x < w; x += 8) { g.fillStyle = x % 16 ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.08)'; g.fillRect(x, 0, 8, h); } }, { repeat: [6, 1] });
  const container = (cx, cz, ci, open = null, stack = false) => { const mat = M(cols[ci % cols.length], 0.6, 0.35, { map: ribTex }); const x1 = cx - 1.2, x2 = cx + 1.2, z1 = cz - 3, z2 = cz + 3;
    if (!open) addCollider(x1, 0, z1, x2, 2.6, z2, { vm: mat, mat: 'metal' });
    else { addCollider(x1, 0, z1, x2, 2.6, z1 + 0.1, { vm: mat, mat: 'metal' }); addCollider(x1, 0, z2 - 0.1, x2, 2.6, z2, { vm: mat, mat: 'metal' }); const back = open === 'w' ? x2 - 0.1 : x1; addCollider(back, 0, z1, back + 0.1, 2.6, z2, { vm: mat, mat: 'metal' }); deco(B(2.4, 0.1, 6), mat, [cx, 2.55, cz]); }
    if (stack) deco(B(2.4, 2.6, 6), M(cols[(ci + 2) % cols.length], 0.6, 0.35, { map: ribTex }), [cx, 3.9, cz]); };
  let ci = 0;
  for (const z of [-21, -14, -7, 13]) { container(-4.9, z, ci++, null, z % 2 === 0); container(4.9, z, ci++, null, z === -14); }
  container(-4.9, 0, ci++, null, true); container(4.9, 6, ci++, 'w'); container(4.9, -0.8, ci++); container(-4.9, 6.5, ci++, null, true);
  container(0, -17.5, ci++); // blocks middle partially (cover)
  for (const [x, z] of [[1.6, -4], [-1.4, 2.5], [1.8, 9.5], [-1.6, -10], [1.2, 15]]) prop('box', x, 0, z);
  for (const [x, z] of [[-2.2, -25], [2.4, -24.5]]) addCollider(x - 0.6, 0, z - 0.6, x + 0.6, 1.0, z + 0.6, { vm: M('#3a4a3a', 0.8), mat: 'metal' });
  // engine room (bow)
  const er = M('#8a8c86', 0.7, 0.4);
  wallX(17.85, -4, 4, 3.2, er, [{ a: -0.6, b: 0.6, y0: 0, y1: 2.3 }]); wallX(26.15, -4, 4, 3.2, er); wallZ(-4.15, 18, 26, 3.2, er, [{ a: 21, b: 22.2, y0: 0, y1: 2.3 }]); wallZ(4.15, 18, 26, 3.2, er);
  ceiling(-4, 18, 4, 26, 3.2, m.ceilingDark); deco(B(14, 0.3, 8.6), er, [0, 3.35, 22], null, [0.6, 1, 1]);
  addCollider(-3.6, 0, 22.5, -1.2, 1.8, 25.6, { vm: m.darkSteel, mat: 'metal' }); addCollider(1, 0, 19, 3.6, 1.4, 21, { vm: m.darkSteel, mat: 'metal' }); for (let i = 0; i < 3; i++) deco(C(0.15, 0.15, 3, 8), m.steel, [-2.4 + i * 0.8, 1.5, 21], [0, 0, PI / 2]);
  pointLight('#ffb070', 6, 9, 0, 2.8, 22);
  // deck lights & mast
  for (const z of [-24, -8, 8, 24]) { deco(C(0.08, 0.08, 6, 8), m.darkSteel, [-7.6, 3, z]); deco(SP(0.18, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffe0a0', toneMapped: false }), [-7.6, 6, z], null, null, false); pointLight('#ffd8a0', 6, 14, -7, 5.5, z); }
  deco(C(0.15, 0.2, 12, 10), m.darkSteel, [0, 6, 30]); const nav = deco(SP(0.15, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff2a1a', toneMapped: false }), [0, 12.1, 30], null, null, false);
  // doors
  new Door({ axis: 'x', x1: -0.6, z: -28.15, w: 1.2, name: 'super' }); new Door({ axis: 'x', x1: -0.6, z: -34.15, w: 1.2, name: 'bridge' });
  new Door({ axis: 'z', x: -7.15, z1: -31.8, w: 1.2 }); new Door({ axis: 'z', x: 7.15, z1: -31.8, w: 1.2 });
  new Door({ axis: 'x', x1: -0.6, z: 17.85, w: 1.2, name: 'engine' }); new Door({ axis: 'z', x: -4.15, z1: 21, w: 1.2 });
  // interactables
  for (const [kind, pos, label] of [['ammo', V3(6.6, 0.2, -24.2), 'Ammo refill'], ['medkit', V3(-6.85, 1.2, -32.6), 'Medkit nao'], ['medkit', V3(3.85, 1.2, 24), 'Medkit nao'], ['ammo', V3(-1, 0.2, 30.2), 'Ammo refill']])
    K.addInteractable(kind, pos, label, K.pickupModel(kind, pos, pos.x < -6 || pos.x > 3 ? -PI / 2 : 0));
  K.addInteractable('task', V3(2.6, 0, 24.6), 'Engine emergency stop', K.pickupModel('lever', V3(2.6, 0, 24.6), PI), { id: 'engine', hold: 2, done: 'Engine bondho! Ship thamche' });
  K.addInteractable('task', V3(0, 1.0, -39.4), 'Coast guard ke signal pathao', K.pickupModel('console', V3(0, 1.0, -39.4)), { id: 'radio', hold: 2.5, done: 'Coast guard ke signal pathano holo' });
  K.buildCameras([]);
  const t0 = performance.now();
  return {
    id: 'deepblue', bounds: { x0: -10, z0: -42, x1: 10, z1: 34 },
    spawns: { stern: { pos: V3(6.6, 0, -25.6), yaw: PI, label: 'Stern ladder', desc: 'Speedboat theke pichoner ladder diye uthben. Superstructure er pashe, bridge kache.', risk: 'Risk: High · Bridge e druto' },
      bow: { pos: V3(-1.5, 0, 30.4), yaw: 0, label: 'Bow', desc: 'Shiper samner dik theke. Engine room kache, crew der agei pawa jabe.', risk: 'Risk: Medium' },
      side: { pos: V3(-7.1, 0, -2.5), yaw: -PI / 2, label: 'Port side hook', desc: 'Majhkhane grappling hook diye uthben. Container er gali te lukano shohoj.', risk: 'Risk: Low · Stealth' } },
    enemies: [
      { id: 'E1', pos: V3(0, 0, -3), yaw: 0, room: 'Deck', patrol: [V3(0, 0, -24), V3(0, 0, 15)] }, { id: 'E2', pos: V3(-7.1, 0, -18), yaw: 0, room: 'Deck', patrol: [V3(-7.1, 0, -24), V3(-7.1, 0, 16)] },
      { id: 'E3', pos: V3(7.1, 0, 10), yaw: PI, room: 'Deck', patrol: [V3(7.1, 0, 16), V3(7.1, 0, -20)] }, { id: 'E4', pos: V3(2.6, 0, 4.5), yaw: -PI / 2, room: 'Deck' },
      { id: 'E5', pos: V3(-2, 0, 20), yaw: 0.5, room: 'Engine room' }, { id: 'E6', pos: V3(2.5, 0, 22.8), yaw: -2, room: 'Engine room' }, { id: 'E7', pos: V3(3, 0, 29.5), yaw: PI, room: 'Deck' },
      { id: 'E8', pos: V3(-4, 0, -31), yaw: PI / 2, room: 'Mess room' }, { id: 'E9', pos: V3(-4, 0, -37), yaw: 0, room: 'Bridge' }, { id: 'E10', pos: V3(-1.6, 0, -26.6), yaw: PI, room: 'Deck' },
      { id: 'E11', pos: V3(-3, 0, 13), yaw: PI / 2, room: 'Deck', patrol: [V3(-2.4, 0, 9.5), V3(-2.4, 0, 16.5)] }, { id: 'LEADER', pos: V3(2.5, 0, -37), yaw: 0, room: 'Bridge', leader: true },
    ],
    hostages: [{ pos: V3(5.4, 0, 4.6), yaw: -PI / 2 }, { pos: V3(5.4, 0, 6), yaw: -PI / 2 }, { pos: V3(5.4, 0, 7.4), yaw: -PI / 2 }, { pos: V3(4.5, 0, -30), yaw: PI }, { pos: V3(5.6, 0, -30.4), yaw: PI },
      { pos: V3(4, 0, -32.6), yaw: 0 }, { pos: V3(-2.5, 0, 24.8), yaw: PI }, { pos: V3(-1.3, 0, 25), yaw: PI }],
    exits: [V3(7, 0, -26.4), V3(-7, 0, -26.4), V3(-1.5, 0, 31)], rescued: p => LV_EX(p),
    objectives: [{ type: 'rescue', label: 'Crew ke lifeboat e pathao' }, { type: 'neutralize' }, { type: 'task', id: 'engine', label: 'Engine room e engine bondho koro' }, { type: 'task', id: 'radio', label: 'Bridge theke coast guard ke signal' }],
    bonus: ['leader', 'stealth'], timer: { kind: 'deadline', s: { recruit: 1020, veteran: 840, elite: 660 } }, deadlineFail: 'Ship port e pouche geche.', executions: true, maxDead: 3, shieldRetreat: V3(0, 0, -38.5),
    hawk: V3(-12, 20, -6), hawkLine: ['Hawk on the helicopter. I can see the deck. Mark with Z.', 'Hawk: Helicopter theke deck dekhte pacchi. Z chaple mark koro.'],
    intro: { all: ['Tiger 24, we are on the Orion Star. Crew is held across the ship. Shut down the engine and signal the coast guard.', 'Rafi: Orion Star e uthe gechi. Crew ra shiper bibhinno jaygay. Engine bondho koro ar coast guard ke signal dao.'] },
    sway: 0.025,
    update(dt, t) { if (sea) { sea.material.map.offset.x = t * 0.02; sea.material.map.offset.y = t * 0.035; sea.position.y = -3.5 + Math.sin(t * 0.7) * 0.3; } nav.visible = (t % 1.6) < 0.2; },
    blueprint: { view: [-11, -42, 11, 34], markers: [[5.4, 6, '3 CREW', 'h'], [5, -31, '3', 'h'], [-2, 25, '2', 'h'], [0, -3, '', 'e'], [-7, -10, '', 'e'], [7, 5, '', 'e'], [0, 22, '', 'e'], [0, 29, '', 'e'], [-4, -31, '', 'e'], [0, -37, 'LEADER', 'e'], [2.6, 24.6, 'ENGINE', 'b'], [0, -39, 'RADIO', 'b']] },
  };
}
function LV_EX(p) { return [V3(7, 0, -26.4), V3(-7, 0, -26.4), V3(-1.5, 0, 31)].some(e => Math.hypot(p.x - e.x, p.z - e.z) < 1.5); }
