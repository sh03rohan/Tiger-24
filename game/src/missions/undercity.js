// Mission 11 — Operation Undercity: metro station siege, chemical device on the platform, commuters held hostage
import { THREE, G, PI, M, B, RB, C, SP, PL, RX, add, canvasTex, rng, R, rr, V3 } from '../core.js';
import * as K from '../levelkit.js';
const { addCollider, wallX, wallZ, floor, ceiling, deco, pointLight, room, prop, Door } = K;

export const meta = { id: 'undercity', no: '11', name: 'Operation Undercity', art: 'metro', type: 'Bomb · rescue', loc: 'Motijheel Metro Station · underground', time: '08:05 hrs · rush hour', diff: 'Elite',
  obj: ['Platform e rakha chemical device defuse', '7 jon jatri ke ticket hall e pouchano', 'Station e gunman der shamlano'], intel: 'Red Tide station e chemical bomb rekheche. Station office e device er wire diagram ache. Thama train ta platform er majhe deyal er moto, dui dik theke ghure jete hobe.' };

let flick = [];
export function build() {
  K.beginLevel({ grade: { sat: 0.92, contrast: 1.1, sh: [0.93, 1.0, 1.04], hi: [1.02, 1.04, 0.96] }, bg: '#040506', fog: '#0a0c0c', fogD: 0.022, sun: 0.0, sunPos: [0, 30, 0], sunTarget: [0, 0, 0], shadowSize: 34, hemi: 0.55, hemiSky: '#cfd8d0', hemiGround: '#1a1814',
    alarmPos: [0, 4, 0], alarmBulbs: [[-29.8, 3.6, -9], [-29.8, 3.6, 9], [29.8, 3.6, -9], [29.8, 3.6, 9]], sky: false, alarmLight: true, dustOpacity: 0.5, dustColor: '#e8f0e0', envI: 0.35 });
  const LG = K.LG, m = K.makeMaterials();
  const subway = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#6a6c66'; g.fillRect(0, 0, w, h); const r = rng(12); for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 64) { const v = 205 + r() * 25; g.fillStyle = `rgb(${v},${v + 2},${v - 6})`; g.fillRect(x + 2, y + 2, 60, 28); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 4, y + 3, 56, 4); if (r() < 0.08) { g.fillStyle = `rgba(70,60,40,${0.2 + r() * 0.3})`; g.fillRect(x + 2, y + 2, 60, 28); } } g.fillStyle = '#1f6a4a'; g.fillRect(0, h * 0.45, w, 20); }, { repeat: [10, 1.6] });
  const tileW = M('#ffffff', 0.25, 0.05, { map: subway, normal: 1.4 });
  const stone = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#5a5850'; g.fillRect(0, 0, w, h); const r = rng(19); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = 90 + r() * 30; g.fillStyle = `rgb(${v + 6},${v + 4},${v})`; g.fillRect(i * 128 + 2, j * 128 + 2, 124, 124); for (let k = 0; k < 300; k++) { g.fillStyle = `rgba(${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},.06)`; g.fillRect(i * 128 + r() * 128, j * 128 + r() * 128, 2, 2); } } }, { repeat: [30, 12] });
  const floorM = M('#ffffff', 0.22, 0.05, { map: stone }), tactile = M('#d9b21b', 0.6, 0.1, { map: canvasTex(64, 64, g => { g.fillStyle = '#c9a21b'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#a8861a'; for (let x = 8; x < 64; x += 16) for (let y = 8; y < 64; y += 16) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); } }, { repeat: [120, 1] }), normal: 2 });
  room('Station office', 18, 6, 30, 12.6, 'tile', 0.7); room('Ticket hall', -36.5, -8, -30, 8, 'stone', 0.8); room('Service corridor', 30, 6, 34.5, 12.6, 'concrete', 0.35);
  room('Platform A', -30, -12.6, 30, -2.5, 'stone', 0.75); room('Platform B', -30, 2.5, 30, 12.6, 'stone', 0.7); room('Station', -37, -13, 35, 13, 'stone', 0.6);
  floor(-30, -12.6, 30, -2.5, floorM); floor(-30, 2.5, 30, 12.6, floorM); floor(-30, -2.5, -28, 2.5, floorM); floor(22, -2.5, 24, 2.5, M('#4a4a44', 0.7, 0.4));
  floor(-36.5, -8, -30, 8, floorM); floor(30, 6, 34.5, 12.6, m.concrete);
  ceiling(-36.5, -12.6, 30, 12.6, 4.5, M('#3a3c3a', 0.9)); ceiling(30, 6, 34.5, 12.6, 3, m.ceilingDark);
  for (const z of [-2.75, 2.75]) deco(PL(58, 0.5), tactile, [1, 0.006, z], [-PI / 2, 0, 0], null, false);
  // track pit
  const pit = M('#2a2620', 0.95), rail = M('#9a9a9a', 0.25, 0.9);
  deco(PL(58, 5), pit, [1, -1.2, 0], [-PI / 2, 0, 0], null, false); for (const z of [-0.72, 0.72]) deco(B(58, 0.12, 0.08), rail, [1, -1.08, z], null, null, false);
  for (let x = -27.5; x < 30; x += 0.7) deco(B(0.22, 0.1, 2.4), M('#4a3a2a', 0.9), [x, -1.16, 0], null, null, false);
  for (const z of [-2.5, 2.5]) deco(B(58, 1.2, 0.1), m.concreteWall, [1, -0.6, z], null, null, false);
  for (const [a, b] of [[-28, 22], [24, 30]]) for (const z of [-2.55, 2.55]) addCollider(a, 0, z - 0.05, b, 1.0, z + 0.05, { vis: false, mat: 'concrete', pen: true });
  for (const x of [-28, 22, 24]) addCollider(x - 0.05, 0, -2.5, x + 0.05, 1.0, 2.5, { vis: false, mat: 'concrete', pen: true });
  // stopped train in the pit (cover wall between the platforms)
  const trainM = M('#c9ccd0', 0.35, 0.6), trainBand = M('#1f6a4a', 0.4, 0.3), winM = new THREE.MeshStandardMaterial({ color: '#1a2024', emissive: '#e8f4d8', emissiveIntensity: 0.55, roughness: 0.1 });
  for (const [x0, x1] of [[-22, -2.2], [-1.8, 18]]) { const cx = (x0 + x1) / 2, L = x1 - x0; deco(RB(L, 3.4, 3.0, 0.25, 2), trainM, [cx, 0.5, 0]); deco(B(L + 0.02, 0.35, 3.04), trainBand, [cx, 0.2, 0], null, null, false);
    for (let x = x0 + 1.2; x < x1 - 1; x += 1.9) for (const z of [-1.52, 1.52]) deco(PL(1.3, 0.8), winM, [x, 1.25, z], [0, z < 0 ? PI : 0, 0], null, false);
    for (let x = x0 + 3; x < x1 - 2; x += 6) for (const z of [-1.53, 1.53]) deco(PL(1.2, 2.0), M('#8a9094', 0.3, 0.7), [x, 0.6, z], [0, z < 0 ? PI : 0, 0], null, false);
    addCollider(x0, 0, -1.5, x1, 2.2, 1.5, { vis: false, mat: 'metal' }); }
  // walls
  wallX(-12.6, -30, 30, 4.5, tileW); wallX(12.6, -30, 30, 4.5, tileW);
  wallZ(-30, -12.6, 12.6, 4.5, tileW, [{ a: -8, b: 8, y0: 0, y1: 3.4 }]); wallZ(30, -12.6, 12.6, 4.5, tileW, [{ a: -2.5, b: 2.5, y0: -2, y1: 4.0 }, { a: 8.4, b: 9.6, y0: 0, y1: 2.3 }]);
  addCollider(29.9, 0, -2.5, 31, 4, 2.5, { vis: false });
  deco(PL(5, 5.4), new THREE.MeshBasicMaterial({ color: '#000000' }), [30.2, 1.5, 0], [0, -PI / 2, 0], null, false);
  // ticket hall
  wallX(-8, -36.5, -30, 3.4, m.concreteWall); wallX(8, -36.5, -30, 3.4, m.concreteWall); wallZ(-36.5, -8, 8, 3.4, m.concreteWall, [{ a: -2, b: 2, y0: 0, y1: 2.6 }]);
  ceiling(-36.5, -8, -30, 8, 3.4, m.ceilingDark);
  for (let z = -6.6; z <= 6.6; z += 1.65) { if (Math.abs(z) < 0.5) continue; addCollider(-32.4, 0, z - 0.45, -32.1, 1.0, z + 0.45, { vm: m.steel, mat: 'metal' }); deco(B(0.05, 0.05, 0.6), new THREE.MeshBasicMaterial({ color: '#30ff70', toneMapped: false }), [-32.25, 1.02, z]); }
  deco(PL(4, 0.9), new THREE.MeshBasicMaterial({ map: canvasTex(512, 116, (g, w, h) => { g.fillStyle = '#0a3a2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8f0e0'; g.font = '700 64px "Saira Condensed", sans-serif'; g.textAlign = 'center'; g.fillText('MOTIJHEEL', w / 2, 80); }), toneMapped: false }), [-30.1, 3.9, 0], [0, PI / 2, 0], null, false);
  // station office
  wallX(6, 18, 30, 4.5, m.drywall, [{ a: 19, b: 20.2, y0: 0, y1: 2.3 }, { a: 22, b: 27, y0: 1.0, y1: 2.2 }]); wallZ(18, 6, 12.6, 4.5, m.drywall); K.addGlass(22, 1.0, 5.96, 27, 2.2, 6.04);
  addCollider(23, 0, 9.5, 27, 0.78, 10.6, { vm: m.wood, mat: 'wood', pen: true }); prop('office', 25, 0, 11.3, PI); addCollider(29.2, 0, 10.4, 29.95, 2, 12.4, { vm: m.darkSteel, mat: 'metal' });
  for (let i = 0; i < 6; i++) deco(PL(0.5, 0.32), m.screen, [23.4 + i * 0.6, 1.25, 12.55], [0, PI, 0], null, false);
  new Door({ axis: 'x', x1: 19, z: 6, w: 1.2, name: 'office' }); new Door({ axis: 'z', x: 30, z1: 8.4, w: 1.2, name: 'service', locked: false });
  // service corridor
  wallX(6, 30, 34.5, 3, m.concreteWall); wallZ(34.5, 6, 12.6, 3, m.concreteWall); addCollider(30, 0, 12.6, 34.5, 3, 12.9, { vis: false });
  // pillars, benches, vending, kiosk, ads
  for (let x = -24; x <= 24; x += 8) for (const z of [-7.6, 7.6]) { if (x >= 18 && z > 0 && x <= 30) continue; addCollider(x - 0.4, 0, z - 0.4, x + 0.4, 4.5, z + 0.4, { vm: tileW, mat: 'concrete' }); }
  for (const [x, z] of [[-20, -11.9], [-4, -11.9], [12, -11.9], [-20, 11.9], [-4, 11.9], [4, 11.9]]) { addCollider(x - 1.1, 0, z - 0.3, x + 1.1, 0.48, z + 0.3, { vm: m.wood, mat: 'wood', pen: true }); }
  for (const [x, z, ry] of [[-26, -12.1, 0], [8, -12.1, 0], [-12, 12.1, PI]]) { addCollider(x - 0.5, 0, z - 0.5, x + 0.5, 1.9, z + 0.5, { vm: m.red, mat: 'metal' }); deco(PL(0.7, 1.0), new THREE.MeshBasicMaterial({ color: '#ffe8c8', toneMapped: false }), [x, 1.2, z + (ry ? -0.51 : 0.51)], [0, ry, 0], null, false); }
  addCollider(14, 0, -10.2, 17, 1.1, -8.8, { vm: m.woodLight, mat: 'wood', pen: true }); deco(B(3, 1.2, 0.1), m.white, [15.5, 2.4, -10.2]);
  const adTex = (seed, a, b, txt) => canvasTex(256, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.9)'; g.font = '800 30px "Saira Condensed", sans-serif'; g.fillText(txt, 14, 70); g.font = '500 14px sans-serif'; g.fillText('Tiger 24 · Nirapod Bangladesh', 14, 100); });
  const ads = [adTex(1, '#d0402a', '#5a1010', 'CHA ER DOKAN'), adTex(2, '#2a6ad0', '#101a5a', 'MEGHNA BANK'), adTex(3, '#1f8a4a', '#0a3a1a', 'METRO PASS'), adTex(4, '#d09a2a', '#5a3a10', 'RADIO 24')];
  let ai = 0; for (let x = -26; x <= 26; x += 8) for (const z of [-12.5, 12.5]) { if (z > 0 && x > 17) continue; const mt = new THREE.MeshStandardMaterial({ map: ads[ai++ % 4], emissive: '#ffffff', emissiveMap: ads[ai % 4], emissiveIntensity: 0.55 }); deco(PL(3, 1.5), mt, [x + 4, 2.2, z + (z < 0 ? 0.06 : -0.06)], [0, z < 0 ? 0 : PI, 0], null, false); }
  for (let x = -28; x <= 28; x += 4) for (const z of [-7.6, 7.6]) { if (x > 17 && z > 0) continue; const lt = deco(B(2.4, 0.06, 0.2), new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#eef8e8', emissiveIntensity: 1.6 }), [x, 4.35, z], null, null, false); if (R() < 0.12) flick.push(lt); }
  for (let x = -24; x <= 24; x += 8) for (const z of [-7.6, 7.6]) K.shaft(V3(x, 4.4, z), V3(0, -1, 0), 4.4, 0.6, 2.2, '#eef8e8', 0.035);
  for (const z of [-7, 7]) deco(PL(3, 0.6), new THREE.MeshBasicMaterial({ map: canvasTex(384, 77, (g, w, h) => { g.fillStyle = '#0a0a0a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff9a2a'; g.font = '700 34px monospace'; g.fillText(z < 0 ? 'UTTARA  --  BILAMBITO' : 'KAMALAPUR  --  BONDHO', 10, 50); }), toneMapped: false }), [0, 3.4, z + (z < 0 ? 1.0 : -1.0)], [0, z < 0 ? 0 : PI, 0], null, false);
  // lights
  for (let x = -24; x <= 24; x += 8) { pointLight('#eef8e8', 7, 11, x, 3.8, -7.6); pointLight('#eef8e8', 7, 11, x, 3.8, 7.6); }
  pointLight('#fff4e0', 8, 12, -33, 3, 0); pointLight('#d8f0ff', 6, 10, 24, 3.6, 9.4); pointLight('#ffb070', 3, 8, 32, 2.6, 9.4); pointLight('#ff3020', 3, 8, 30.5, 1.5, 0);
  // bomb + items
  const bp = V3(7.8, 0.25, 9.6); const bm = K.bombModel(bp); K.addInteractable('bomb', bp, 'Chemical device', bm.g, { disp: bm.disp, name: 'Chemical' });
  K.addInteractable('intel', V3(24, 0.95, 10), 'Device er wire diagram', K.pickupModel('intel', V3(24, 0.95, 10)));
  for (const [kind, pos, label] of [['ammo', V3(-34.6, 0.2, -6.6), 'Ammo refill'], ['medkit', V3(14.2, 1.3, -9.5), 'Medkit nao'], ['medkit', V3(29.15, 1.2, 11.2), 'Medkit nao'], ['ammo', V3(33.6, 0.2, 11.6), 'Ammo refill']]) K.addInteractable(kind, pos, label, K.pickupModel(kind, pos, kind === 'medkit' ? (pos.x < 20 ? 0 : -PI / 2) : 0));
  for (let i = 0; i < 5; i++) prop(i % 2 ? 'bag' : 'bin', rr(-20, 20), 0, i % 2 ? rr(-11, -4) : rr(4, 11));
  K.buildCameras([{ pos: V3(-29.6, 3.6, -12.2), yaw: K.camLook(V3(-29.6, 0, -12.2), V3(-14, 0, -6)), pitch: -0.3 }, { pos: V3(17.8, 3.6, 12.2), yaw: K.camLook(V3(17.8, 0, 12.2), V3(6, 0, 6)), pitch: -0.3 }]);
  return {
    id: 'undercity', bounds: { x0: -37, z0: -13, x1: 35, z1: 13 },
    spawns: { hall: { pos: V3(-35, 0, 0), yaw: -PI / 2, label: 'Ticket hall', desc: 'Raster siri diye neme ticket hall e. Platform A er hostage der kache, kintu shamne theke.', risk: 'Risk: High · Direct' },
      service: { pos: V3(32.6, 0, 9.2), yaw: PI / 2, label: 'Service tunnel', desc: 'Pasher tunnel er service door diye platform B er pichone. Bomb ar office er kache.', risk: 'Risk: Medium · Flank', surprise: ['Platform B'] } },
    enemies: [
      { id: 'E1', pos: V3(-27, 0, -4), yaw: -PI / 2, room: 'Platform A' }, { id: 'E2', pos: V3(-8, 0, -4), yaw: 0, room: 'Platform A', patrol: [V3(-24, 0, -4), V3(20, 0, -4)] },
      { id: 'E3', pos: V3(4, 0, -9.6), yaw: PI / 2, room: 'Platform A' }, { id: 'E4', pos: V3(18, 0, -5), yaw: PI / 2, room: 'Platform A', heavy: true },
      { id: 'E5', pos: V3(-20, 0, 5), yaw: -PI / 2, room: 'Platform B', patrol: [V3(-26, 0, 4.4), V3(14, 0, 4.4)] }, { id: 'E6', pos: V3(0, 0, 10), yaw: PI, room: 'Platform B' },
      { id: 'E7', pos: V3(12, 0, 6.5), yaw: PI / 2, room: 'Platform B', heavy: true }, { id: 'E8', pos: V3(26, 0, 4), yaw: PI / 2, room: 'Platform B' },
      { id: 'E9', pos: V3(21, 0, 9), yaw: -PI / 2, room: 'Station office' }, { id: 'E10', pos: V3(-26, 0, 9.6), yaw: -PI / 2, room: 'Platform B' },
      { id: 'LEADER', pos: V3(5, 0, 9.4), yaw: PI, room: 'Platform B', leader: true, name: 'Red Tide bomber' },
    ],
    hostages: [{ pos: V3(-6, 0, -9.4), yaw: 0 }, { pos: V3(-4.8, 0, -9.6), yaw: 0.3 }, { pos: V3(-3.6, 0, -9.4), yaw: -0.2 }, { pos: V3(-2.4, 0, -9.7), yaw: 0 }, { pos: V3(-5.4, 0, -10.8), yaw: 0.2 }, { pos: V3(6.4, 0, 11.6), yaw: PI }, { pos: V3(9.4, 0, 11.4), yaw: PI }],
    exits: [V3(-34.5, 0, 0)], rescued: p => p.x < -32.6,
    objectives: [{ type: 'defuse', intelHint: 'Station office e wire diagram ache' }, { type: 'rescue', label: 'Jatri der ticket hall e pathao' }, { type: 'neutralize' }], bonus: ['leader', 'stealth'],
    timer: { kind: 'bomb', s: { recruit: 960, veteran: 780, elite: 600 } }, executions: true, maxDead: 2, shieldRetreat: V3(16, 0, 11.6),
    hawk: null,
    intro: { all: ['Chemical device on platform B. The train splits the station in two, use both ends.', 'Rafi: Platform B te chemical bomb. Train ta station ke dui bhage bhag koreche, dui matha diye ghuro.'] },
    update(dt, t) { for (const f of flick) f.material.emissiveIntensity = Math.sin(t * 37 + f.position.x) > 0.6 || Math.sin(t * 3.1 + f.position.x) > 0.95 ? 0.2 : 1.6; },
    winLine: ['Device safe, commuters out. Undercity is clear. Brilliant work, Tiger 24.', 'Rafi: Bomb nishkriyo, jatri ra baire. Station clear. Darun kaj, Tiger 24!'],
    blueprint: { view: [-37, -13, 35, 13], markers: [[7.8, 9.6, 'BOMB', 'b'], [24, 10, 'INTEL', 'b'], [-4.5, -9.8, '5', 'h'], [8, 11.6, '2', 'h'], [-34.5, 0, 'EXIT', 'b'], [-27, -4, '', 'e'], [-8, -4, '', 'e'], [4, -9.6, '', 'e'], [18, -5, '', 'e'], [-20, 5, '', 'e'], [0, 10, '', 'e'], [12, 6.5, '', 'e'], [26, 4, '', 'e'], [21, 9, '', 'e'], [-26, 9.6, '', 'e']] },
  };
}
