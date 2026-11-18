// Mission 15 — Operation Bazaar: shopping mall siege, two bombs, hostages in the food court and the supermarket
import { THREE, G, PI, M, B, RB, C, SP, PL, RX, add, canvasTex, rng, R, rr, V3 } from '../core.js';
import * as K from '../levelkit.js';
const { addCollider, wallX, wallZ, floor, ceiling, deco, pointLight, room, prop, Door } = K;

export const meta = { id: 'bazaar', no: '15', name: 'Operation Bazaar', art: 'mall', type: 'Bomb · rescue', loc: 'Jamuna City Mall · ground floor', time: '17:30 hrs · Eid er bhir', diff: 'Elite',
  obj: ['Mall e rakha 2 ta bomb defuse', '10 jon shopper ke entrance diye ber kora', 'Gunman der shamlano'], intel: 'Eid er shopping er majhe Red Tide mall dokhol koreche. Security office e CCTV ar bomb er wire er tottho ache. Atrium er skylight diye alo, kintu khola jayga, shabdhan.' };

let water = null;
export function build() {
  K.beginLevel({ grade: { sat: 1.08, contrast: 1.06, sh: [0.96, 0.99, 1.04], hi: [1.06, 1.0, 0.94] }, bg: '#2a2420', fog: '#2a2622', fogD: 0.01, sun: 1.0, sunColor: '#ffd8a8', sunPos: [-12, 40, 8], sunTarget: [0, 0, 0], shadowSize: 30, hemi: 0.55, hemiSky: '#d8d0c0', hemiGround: '#3a3028', envI: 0.4,
    alarmPos: [0, 6, 0], alarmBulbs: [[-14, 4, -14], [14, 4, 14], [-14, 4, 14], [14, 4, -14]], sky: false, alarmLight: true, dustOpacity: 0.45, dustColor: '#fff0d8' });
  const LG = K.LG, m = K.makeMaterials();
  const marble = M('#ffffff', 0.12, 0.05, { map: canvasTex(512, 512, (g, w, h) => { const r = rng(31); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const dk = (i + j) % 2; g.fillStyle = dk ? '#cfc6b6' : '#e8e2d6'; g.fillRect(i * 128, j * 128, 128, 128); for (let k = 0; k < 10; k++) { g.strokeStyle = `rgba(120,110,95,${0.05 + r() * 0.12})`; g.lineWidth = 0.6 + r() * 1.8; g.beginPath(); let x = i * 128 + r() * 128, y = j * 128; g.moveTo(x, y); for (let q = 0; q < 5; q++) { x += (r() - 0.5) * 50; y += 26; g.lineTo(x, y); } g.stroke(); } g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(i * 128, j * 128, 128, 1); g.fillRect(i * 128, j * 128, 1, 128); } }, { repeat: [14, 11] }), normal: 0.6 });
  room('Security office', -28, 14, -20, 22, 'tile', 0.7); room('Food court', -28, -10, -14, 10, 'tile', 0.8); room('Supermarket', 14, -10, 28, 10, 'tile', 0.85); room('Mall', -30, -24, 30, 24, 'marble', 0.85);
  floor(-28, -22, 28, 22, marble); floor(-6, -26, 6, -22, m.concrete); floor(-6, 22, 6, 26, m.concrete); ceiling(-28, -22, 28, 22, 7, M('#e8e2d8', 0.9));
  // skylight over the atrium
  deco(PL(14, 14), new THREE.MeshBasicMaterial({ color: '#fff4e0', toneMapped: false }), [0, 6.96, 0], [PI / 2, 0, 0], null, false);
  for (const [x, z] of [[-4, -4], [4, -4], [-4, 4], [4, 4], [0, 0]]) K.shaft(V3(x, 7, z), V3(0.18, -1, 0.06), 7.3, 1.4, 2.4, '#fff0d0', 0.035);
  // outer walls with two entrances
  const wallM = M('#ffffff', 0.7, 0, { map: canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#d8d0c4'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8ac98'; g.fillRect(0, h - 14, w, 14); }, { repeat: [6, 1] }) });
  wallX(-22, -28, 28, 7, wallM, [{ a: -4, b: 4, y0: 0, y1: 3.4 }]); wallX(22, -28, 28, 7, wallM, [{ a: -4, b: 4, y0: 0, y1: 3.4 }]); wallZ(-28, -22, 22, 7, wallM); wallZ(28, -22, 22, 7, wallM);
  for (const z of [-22, 22]) { addCollider(-6, 0, z < 0 ? -26 : 25.8, 6, 3, z < 0 ? -25.8 : 26, { vis: false }); addCollider(-6.2, 0, z < 0 ? -26 : 22, -6, 3, z < 0 ? -22 : 26, { vis: false }); addCollider(6, 0, z < 0 ? -26 : 22, 6.2, 3, z < 0 ? -22 : 26, { vis: false });
    deco(PL(8, 1.1), new THREE.MeshBasicMaterial({ map: canvasTex(512, 70, (g, w, h) => { g.fillStyle = '#1a1410'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffc860'; g.font = '700 46px "Saira Condensed", sans-serif'; g.textAlign = 'center'; g.fillText('JAMUNA CITY MALL', w / 2, 52); }), toneMapped: false }), [0, 4.1, z + (z < 0 ? 0.17 : -0.17)], [0, z < 0 ? 0 : PI, 0], null, false); }
  // shop units with glass fronts (north row front at z=14, south row front at z=-14)
  const glassSign = ['#e04a3a', '#3a8ae0', '#3ac08a', '#e0a83a', '#a85ae0', '#e05aa8'];
  const names = ['AARONG', 'BATA', 'RICHMAN', 'YELLOW', 'BOOKS', 'GADGET'];
  const shops = [[-28, -20], [-20, -12], [-12, -4], [4, 12], [12, 20], [20, 28]];
  shops.forEach(([x1, x2], i) => { for (const front of [14, -14]) { const back = front > 0 ? 22 : -22, mid = (x1 + x2) / 2;
    if (front > 0 && i === 0) return; // security office handled below
    wallZ(x2, Math.min(front, back), Math.max(front, back), 7, wallM);
    addCollider(x1, 3.4, front - 0.1, x2, 7, front + 0.1, { vm: wallM }); K.addGlass(x1 + 0.1, 0, front - 0.04, mid - 1, 3.4, front + 0.04); K.addGlass(mid + 1, 0, front - 0.04, x2 - 0.1, 3.4, front + 0.04);
    deco(B(0.1, 3.4, 0.14), m.black, [x1 + 0.05, 1.7, front], null, null, false); deco(B(0.1, 3.4, 0.14), m.black, [mid - 1, 1.7, front], null, null, false); deco(B(0.1, 3.4, 0.14), m.black, [mid + 1, 1.7, front], null, null, false);
    const c = glassSign[(i + (front > 0 ? 0 : 3)) % 6]; deco(PL(6, 0.8), new THREE.MeshBasicMaterial({ map: canvasTex(384, 52, (g, w, h) => { g.fillStyle = '#141210'; g.fillRect(0, 0, w, h); g.fillStyle = c; g.font = '800 38px "Saira Condensed", sans-serif'; g.textAlign = 'center'; g.fillText(names[(i + (front > 0 ? 0 : 2)) % 6], w / 2, 40); }), toneMapped: false }), [mid, 4, front + (front > 0 ? -0.12 : 0.12)], [0, front > 0 ? PI : 0, 0], null, false);
    const sd = front > 0 ? 1 : -1; addCollider(x1 + 0.6, 0, back - sd * 1.2, x2 - 0.6, 1.9, back - sd * 0.6, { vm: M('#e8e2d8', 0.6), mat: 'wood', pen: true }); addCollider(mid - 1.4, 0, front + sd * 3, mid + 1.4, 1.0, front + sd * 3.8, { vm: m.woodLight, mat: 'wood', pen: true });
    pointLight('#fff2e0', 5, 9, mid, 3.2, front + sd * 4); } });
  wallZ(-4, -22, -14, 7, wallM); wallZ(4, -22, -14, 7, wallM); wallZ(-4, 14, 22, 7, wallM); wallZ(4, 14, 22, 7, wallM);
  // security office (north-west unit): solid front with a door
  wallX(14, -28, -20, 7, wallM, [{ a: -24.6, b: -23.4, y0: 0, y1: 2.3 }]); wallZ(-20, 14, 22, 7, wallM); new Door({ axis: 'x', x1: -24.6, z: 14, w: 1.2, name: 'security' });
  ceiling(-28, 14, -20, 22, 3.2, m.ceiling); addCollider(-27.4, 0, 19.6, -22.6, 0.8, 20.6, { vm: m.darkSteel, mat: 'metal' }); for (let i = 0; i < 4; i++) deco(PL(0.9, 0.55), m.screen, [-26.8 + i * 1.15, 1.4, 21.85], [0, PI, 0], null, false); prop('office', -25, 0, 18.8, 0);
  // food court (west): counters + tables
  addCollider(-27.8, 0, -9, -26.6, 1.1, 9, { vm: M('#c84a2a', 0.6), mat: 'wood', pen: true }); for (let z = -7; z <= 7; z += 3.5) deco(PL(1.6, 0.7), new THREE.MeshBasicMaterial({ color: ['#ffb040', '#40d0ff', '#ff5070', '#80ff60', '#ffe050'][Math.round((z + 7) / 3.5) % 5], toneMapped: false }), [-27.95, 2.6, z], [0, PI / 2, 0], null, false);
  for (const [x, z] of [[-22, -6], [-22, -1], [-22, 4], [-17.5, -6], [-17.5, 4]]) { addCollider(x - 0.6, 0, z - 0.6, x + 0.6, 0.75, z + 0.6, { vm: m.white, mat: 'wood', pen: true }); for (const [ox, oz] of [[-1, 0], [1, 0]]) prop('chair', x + ox, 0, z + oz, ox < 0 ? PI / 2 : -PI / 2); }
  // supermarket (east): shelf rows
  for (const z of [-7, -3.5, 0, 3.5]) addCollider(17, 0, z - 0.45, 26, 1.7, z + 0.45, { vm: M('#ffffff', 0.6, 0, { map: canvasTex(128, 64, (g, w, h) => { g.fillStyle = '#ddd'; g.fillRect(0, 0, w, h); const r = rng(z * 7 + 40); for (let i = 0; i < 40; i++) { g.fillStyle = `hsl(${r() * 360},60%,${40 + r() * 25}%)`; g.fillRect(r() * w, (Math.floor(r() * 3) * h) / 3 + 2, 6 + r() * 8, h / 3 - 6); } }, { repeat: [3, 1] }) }), mat: 'wood', pen: true });
  for (const z of [7.4]) addCollider(14.6, 0, z - 0.4, 18.4, 1.0, z + 0.4, { vm: m.steel, mat: 'metal' });
  // atrium: fountain, escalator, planters, columns
  addCollider(-2.2, 0, -2.2, 2.2, 0.7, 2.2, { vm: M('#9a9488', 0.5), mat: 'concrete' }); water = deco(PL(4, 4), M('#2a6a8a', 0.05, 0.4, { transparent: true, opacity: 0.85 }), [0, 0.62, 0], [-PI / 2, 0, 0], null, false); deco(C(0.25, 0.4, 2.2, 14), M('#d8d0c4', 0.4), [0, 1.4, 0]);
  addCollider(-9, 0, 6, -7, 3.6, 12, { vm: M('#8a9096', 0.3, 0.7), mat: 'metal' }); deco(B(1.8, 0.1, 6.4), m.black, [-8, 3.65, 9], [0.5, 0, 0]);
  for (const [x, z] of [[-10, -10], [10, -10], [-10, 10], [10, 10]]) { addCollider(x - 0.5, 0, z - 0.5, x + 0.5, 7, z + 0.5, { vm: wallM, mat: 'concrete' }); }
  for (const [x, z] of [[-5, -9], [5, 9], [9, -5]]) { addCollider(x - 0.8, 0, z - 0.8, x + 0.8, 0.7, z + 0.8, { vm: M('#6a5a48', 0.8), mat: 'concrete', pen: true }); deco(SP(0.9, 10, 7), M('#2e5a28', 0.9), [x, 1.2, z], null, [1, 0.8, 1]); }
  // lights
  for (const [x, z] of [[-14, -16], [14, -16], [-14, 16], [14, 16], [-20, 0], [20, 0], [0, -12], [0, 12], [-10, 0], [10, 0]]) pointLight('#fff4e0', 7, 13, x, 5.5, z);
  pointLight('#ffffff', 10, 14, -25, 2.8, 18); pointLight('#ffd8a8', 8, 16, 0, 6, 0);
  // bombs + intel
  for (const [p, label, name] of [[V3(-6.4, 0.25, 7), 'Atrium bomb', 'Atrium'], [V3(26.4, 0.25, 6.4), 'Supermarket bomb', 'Supermarket']]) { const bm = K.bombModel(p); K.addInteractable('bomb', p, label, bm.g, { disp: bm.disp, name }); }
  K.addInteractable('intel', V3(-24, 0.95, 20.1), 'Bomb er wire diagram (CCTV)', K.pickupModel('intel', V3(-24, 0.95, 20.1)));
  K.addInteractable('console', V3(-26, 1.0, 20.1), 'Mall CCTV bondho koro', K.pickupModel('console', V3(-26, 1.0, 20.1)));
  for (const [kind, pos, label] of [['ammo', V3(2.6, 0.2, -24), 'Ammo refill'], ['medkit', V3(14.8, 1.2, 7.4), 'Medkit nao'], ['medkit', V3(-26.9, 1.3, -4), 'Medkit nao'], ['ammo', V3(-2.6, 0.2, 24), 'Ammo refill']]) K.addInteractable(kind, pos, label, K.pickupModel(kind, pos, kind === 'medkit' && pos.x < 0 ? PI / 2 : 0));
  for (let i = 0; i < 8; i++) prop(i % 3 === 0 ? 'bag' : i % 3 === 1 ? 'box' : 'bin', rr(-12, 12), 0, rr(-12, 12) > 0 ? rr(3, 12) : rr(-12, -3));
  K.buildCameras([{ pos: V3(-27.6, 5, -21.6), yaw: K.camLook(V3(-27.6, 0, -21.6), V3(-10, 0, -6)), pitch: -0.32 }, { pos: V3(27.6, 5, 21.6), yaw: K.camLook(V3(27.6, 0, 21.6), V3(10, 0, 6)), pitch: -0.32 }]);
  return {
    id: 'bazaar', bounds: { x0: -28.4, z0: -26.4, x1: 28.4, z1: 26.4 },
    spawns: { main: { pos: V3(0, 0, -24.4), yaw: PI, label: 'Main entrance', desc: 'Dokkhin er main gate diye shoja atrium. Druto, kintu shobar shamne.', risk: 'Risk: High · Direct' },
      north: { pos: V3(0, 0, 24.4), yaw: 0, label: 'North gate', desc: 'Parking er dik theke uttor er gate. Security office kache, CCTV bondho kora jabe.', risk: 'Risk: Medium' } },
    enemies: [
      { id: 'E1', pos: V3(-1.6, 0, -11.6), yaw: 0.4, room: 'Mall' }, { id: 'E2', pos: V3(1.8, 0, 11.4), yaw: PI + 0.4, room: 'Mall' },
      { id: 'E3', pos: V3(-6, 0, -4), yaw: PI / 2, room: 'Mall', patrol: [V3(-12, 0, -12), V3(12, 0, -12), V3(12, 0, 12), V3(-12, 0, 12)] }, { id: 'E4', pos: V3(5, 0, 4.6), yaw: -PI / 2, room: 'Mall', heavy: true },
      { id: 'E5', pos: V3(-20, 0, -8.6), yaw: 0, room: 'Food court' }, { id: 'E6', pos: V3(-15, 0, 1.4), yaw: -PI / 2, room: 'Food court' },
      { id: 'E7', pos: V3(15.6, 0, -5.2), yaw: PI / 2, room: 'Supermarket' }, { id: 'E8', pos: V3(22, 0, 8.6), yaw: PI, room: 'Supermarket', heavy: true }, { id: 'E9', pos: V3(-24, 0, 16.4), yaw: PI, room: 'Security office' },
      { id: 'E10', pos: V3(-16, 0, -19.4), yaw: 0, room: 'Mall' }, { id: 'E11', pos: V3(16, 0, 19.3), yaw: PI, room: 'Mall' },
      { id: 'LEADER', pos: V3(-4.4, 0, 8.8), yaw: PI, room: 'Mall', leader: true, name: 'Red Tide bomber' },
    ],
    hostages: [{ pos: V3(-24.4, 0, -3.4), yaw: PI / 2 }, { pos: V3(-24.4, 0, -2.2), yaw: PI / 2 }, { pos: V3(-24.4, 0, 1.4), yaw: PI / 2 }, { pos: V3(-24.4, 0, 2.6), yaw: PI / 2 },
      { pos: V3(21, 0, -5.2), yaw: 0 }, { pos: V3(22.4, 0, -1.8), yaw: 0 }, { pos: V3(20, 0, 1.8), yaw: PI }, { pos: V3(-3.4, 0, 3.6), yaw: 0.4 }, { pos: V3(3.6, 0, -3.6), yaw: PI }, { pos: V3(-3.6, 0, -3.4), yaw: -0.4 }],
    exits: [V3(0, 0, -24), V3(0, 0, 24)], rescued: p => Math.abs(p.z) > 22.6 && Math.abs(p.x) < 5,
    objectives: [{ type: 'defuse', intelHint: 'Security office e wire diagram ache' }, { type: 'rescue', label: 'Shopper der entrance diye ber koro' }, { type: 'neutralize' }], bonus: ['leader', 'stealth'],
    timer: { kind: 'bomb', s: { recruit: 1020, veteran: 840, elite: 660 } }, executions: true, maxDead: 3, shieldRetreat: V3(-6, 0, 11),
    hawk: null,
    intro: { all: ['Two bombs, ten civilians, and an open atrium. Security office has the wire diagram. Move.', 'Rafi: Dui ta bomb, dosh jon civilian, ar khola atrium. Security office e wire diagram. Cholo.'] },
    update(dt, t) { if (water) water.material.map && (water.material.map.offset.x += dt * 0.02); },
    winLine: ['Bombs safe, shoppers out. Jamuna City is clear. Outstanding work, Tiger 24.', 'Rafi: Bomb nishkriyo, shopper ra baire. Mall clear. Oshadharon kaj, Tiger 24!'],
    blueprint: { view: [-28, -26, 28, 26], markers: [[-6.4, 7, 'BOMB', 'b'], [26.4, 6.4, 'BOMB', 'b'], [-24, 20, 'INTEL', 'b'], [-24.4, -0.4, '4', 'h'], [21, -1.8, '3', 'h'], [0, 0, '3', 'h'], [-1.6, -11.6, '', 'e'], [1.8, 11.4, '', 'e'], [-6, -4, '', 'e'], [5, 4.6, '', 'e'], [-20, -8.6, '', 'e'], [-15, 1.4, '', 'e'], [15.6, -5.2, '', 'e'], [22, 8.6, '', 'e'], [-24, 16.4, '', 'e'], [-16, -18, '', 'e'], [16, 18, '', 'e'], [-4.4, 8.8, 'CMD', 'e']] },
  };
}
