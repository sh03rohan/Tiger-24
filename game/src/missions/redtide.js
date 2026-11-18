// Mission 12 — Operation Red Tide: rainy night harbour, arrest the arms dealer, take his ledger, escape by speedboat
import { THREE, G, PI, M, B, RB, C, SP, PL, RX, add, canvasTex, rng, R, rr, V3 } from '../core.js';
import * as K from '../levelkit.js';
const { addCollider, wallX, wallZ, floor, ceiling, deco, pointLight, room, prop, Door } = K;

export const meta = { id: 'redtide', no: '12', name: 'Operation Red Tide', art: 'harbor', type: 'Arrest · recovery', loc: 'Chattogram Port · Dock 9', time: '01:30 hrs · brishti', diff: 'Elite',
  obj: ['Arms dealer Zaman ke jibito arrest', 'Warehouse office theke ledger uddhar', 'Pier e speedboat e extraction'], intel: 'Red Tide er pichone ache arms dealer Zaman. Ajke raat e jahaj e kore ostro pathabe. Tar ledger e shob buyer er naam. Kichukkhon por truck e reinforcement ashbe.' };

let water = null, boat = null, zone = null;
export function build() {
  K.beginLevel({ fill: 5, exposure: 1.5, fog: '#1a2230', skyEnv: true, grade: { sat: 0.9, contrast: 1.12, sh: [0.9, 0.98, 1.1], hi: [1.06, 1.0, 0.92] }, bg: '#05070b', fogD: 0.015, sun: 2.4, sunColor: '#9ab4e0', sunPos: [-20, 35, -15], sunTarget: [0, 0, 0], shadowSize: 34, hemi: 4.2, hemiSky: '#56648a', envI: 0.5, hemiGround: '#0a0a0c',
    rain: [[-32, -28, 30, 26]], rainN: 3200, lightning: true, alarmPos: [-16, 6.5, -13], alarmBulbs: [[-6.2, 4.8, -10.4], [-6.2, 4.8, -16.6]], skyTop: '#04060c', skyBottom: '#1a2236', city: true, skyDist: 95, alarmLight: true });
  const LG = K.LG, m = K.makeMaterials();
  const conc = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#3a3c3e'; g.fillRect(0, 0, w, h); const r = rng(41); for (let i = 0; i < 9000; i++) { const c = r() < 0.5 ? 0 : 255; g.fillStyle = `rgba(${c},${c},${c},.045)`; g.fillRect(r() * w, r() * h, 2, 2); } g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3; for (let x = 0; x <= w; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); g.beginPath(); g.moveTo(0, x); g.lineTo(w, x); g.stroke(); }
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(10,12,16,${0.2 + r() * 0.3})`; g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 50, 6 + r() * 26, r() * 3, 0, 7); g.fill(); } g.fillStyle = 'rgba(230,190,40,.6)'; g.fillRect(w * 0.5 - 4, 0, 8, h); }, { repeat: [10, 10] });
  room('Office', -26, -22, -19, -16, 'concrete', 0.6); room('Warehouse', -26, -22, -6, -4, 'concrete', 0.5); room('Pier', -10, 22, -2, 26, 'wood', 0.3, false); room('Docks', -32, -28, 26, 22, 'concrete', 0.35, false);
  floor(-34, -30, 28, 22.2, M('#ffffff', 0.3, 0.1, { map: conc, normal: 0.8 }));
  const wood = M('#ffffff', 0.75, 0, { map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#3a2c20'; g.fillRect(0, 0, w, h); const r = rng(8); for (let x = 0; x < w; x += 32) { g.fillStyle = `rgb(${50 + r() * 20},${38 + r() * 14},${26 + r() * 10})`; g.fillRect(x + 1, 0, 30, h); for (let k = 0; k < 20; k++) { g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x + 2 + r() * 28, r() * h, 1, 10 + r() * 40); } } }, { repeat: [2, 3] }) });
  floor(-10, 22, -2, 26.4, wood, 0.01); deco(B(8, 0.4, 4.4), M('#2a221a', 0.9), [-6, -0.2, 24.2]); for (const x of [-9.6, -2.4]) for (const z of [23, 25.8]) deco(C(0.18, 0.18, 3, 8), M('#2a221a', 0.9), [x, -1.5, z]);
  // water + quay edge
  const wv = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#0a141a'; g.fillRect(0, 0, w, h); const r = rng(55); for (let i = 0; i < 300; i++) { const x = r() * w, y = r() * h, s = 8 + r() * 30; const gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(110,140,160,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2); } }, { repeat: [50, 50] });
  water = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), M('#ffffff', 0.06, 0.3, { map: wv, normal: 2.5 })); water.rotation.x = -PI / 2; water.position.y = -1.6; LG.add(water);
  deco(B(0.5, 2, 52), m.concreteWall, [26.25, -1, -3]); deco(B(36, 2, 0.5), m.concreteWall, [-16, -1, 22.45]); deco(B(28, 2, 0.5), m.concreteWall, [12, -1, 22.45]);
  for (const [x1, z1, x2, z2] of [[26, -28, 26.2, 22.2], [-32, 22, -10, 22.2], [-2, 22, 26.2, 22.2], [-10.2, 22, -10, 26.4], [-2, 22, -1.8, 26.4], [-10, 26.3, -2, 26.5], [-32.2, -28, -32, 22], [-32, -28.2, 4, -28], [10, -28.2, 26, -28]]) addCollider(x1, 0, z1, x2, 3, z2, { vis: false });
  const yel = M('#d9a21b', 0.5, 0.3);
  for (let z = -24; z < 22; z += 7) { deco(C(0.22, 0.28, 0.6, 12), M('#1a1a1a', 0.5, 0.5), [25.4, 0.3, z]); addCollider(25.15, 0, z - 0.25, 25.65, 0.6, z + 0.25, { vis: false, mat: 'metal' }); }
  deco(B(0.2, 0.05, 50), yel, [25.6, 0.02, -3], null, null, false);
  // perimeter fence (north + west) with gate
  const fenceM = new THREE.MeshStandardMaterial({ color: '#6a7078', metalness: 0.6, roughness: 0.4, transparent: true, opacity: 0.55, map: canvasTex(64, 64, g => { g.clearRect(0, 0, 64, 64); g.strokeStyle = '#fff'; g.lineWidth = 2; for (let i = -64; i < 128; i += 12) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 64); g.stroke(); g.beginPath(); g.moveTo(i + 64, 0); g.lineTo(i, 64); g.stroke(); } }, { repeat: [20, 2] }), alphaTest: 0.3, side: THREE.DoubleSide });
  for (const [x, z, w, ry] of [[-14, -28.1, 36, 0], [18, -28.1, 16, 0], [-32.1, -3, 50, PI / 2]]) deco(PL(w, 2.8), fenceM, [x, 1.4, z], [0, ry, 0], null, false);
  deco(B(0.3, 3.6, 0.3), m.darkSteel, [4, 1.8, -28.1]); deco(B(0.3, 3.6, 0.3), m.darkSteel, [10, 1.8, -28.1]);
  // ---- warehouse
  const corr = M('#ffffff', 0.55, 0.55, { map: canvasTex(256, 256, (g, w, h) => { for (let x = 0; x < w; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, '#4a5258'); gr.addColorStop(0.5, '#6a737a'); gr.addColorStop(1, '#3e454a'); g.fillStyle = gr; g.fillRect(x, 0, 16, h); } const r = rng(4); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(110,60,30,${r() * 0.3})`; g.fillRect(r() * w, r() * h * 0.4 + h * 0.6, 3 + r() * 6, 10 + r() * 50); } }, { repeat: [6, 2] }) });
  wallX(-22, -26, -6, 7, corr, [{ a: -10, b: -8.8, y0: 0, y1: 2.3 }], { mat: 'metal' }); wallX(-4, -26, -6, 7, corr, [{ a: -20, b: -18.8, y0: 0, y1: 2.3 }], { mat: 'metal' });
  wallZ(-26, -22, -4, 7, corr, [], { mat: 'metal' }); wallZ(-6, -22, -4, 7, corr, [{ a: -16, b: -11, y0: 0, y1: 4.5 }], { mat: 'metal' });
  deco(B(0.12, 2.5, 5.1), M('#7a5a2a', 0.5, 0.4), [-6, 5.75, -13.5]); for (let i = 0; i < 8; i++) deco(B(0.14, 0.08, 5.1), m.darkSteel, [-6, 4.55 + i * 0.3, -13.5], null, null, false);
  ceiling(-26, -22, -6, -4, 7, m.ceilingDark); deco(B(20.6, 0.2, 18.6), corr, [-16, 7.1, -13]);
  floor(-26, -22, -6, -4, M('#ffffff', 0.5, 0.05, { map: m.concrete.map }), 0.005);
  for (const [x, z] of [[-21, -12], [-11, -12]]) { deco(PL(3, 3), new THREE.MeshBasicMaterial({ color: '#8fa6c8', transparent: true, opacity: 0.6 }), [x, 6.98, z], [PI / 2, 0, 0], null, false); K.shaft(V3(x, 7, z), V3(0.15, -1, 0.1), 7.2, 1.1, 2.4, '#a8bce0', 0.06); }
  for (const [x, z] of [[-16, -19], [-10.5, -19], [-16, -8], [-10.5, -8], [-22.5, -9]]) { addCollider(x - 1, 0, z - 1, x + 1, 2.1, z + 1, { vm: M('#ffffff', 0.85, 0, { map: wood.map }), mat: 'wood', pen: true }); deco(B(1.4, 1.2, 1.4), M('#ffffff', 0.85, 0, { map: wood.map }), [x + rr(-0.2, 0.2), 2.7, z + rr(-0.2, 0.2)], [0, rr(-0.3, 0.3), 0]); }
  for (const z of [-12.5, -10.5]) addCollider(-25.6, 0, z - 0.5, -23.2, 1.3, z + 0.5, { vm: M('#2a3a2a', 0.8), mat: 'wood', pen: true });
  for (let i = 0; i < 5; i++) deco(C(0.03, 0.03, 0.9, 6), m.black, [-25.3 + i * 0.5, 1.4, -12.5], [0, 0, PI / 2], null, false);
  // office
  wallX(-16, -26, -19, 3, m.drywall, [{ a: -21, b: -19.8, y0: 0, y1: 2.3 }]); wallZ(-19, -22, -16, 3, m.drywall, [{ a: -21, b: -17.5, y0: 1.0, y1: 2.2 }]); K.addGlass(-19.04, 1.0, -21, -18.96, 2.2, -17.5);
  ceiling(-26, -22, -19, -16, 3, m.ceiling); addCollider(-25, 0, -20.2, -22.6, 0.78, -19, { vm: m.wood, mat: 'wood', pen: true }); prop('office', -23.8, 0, -21, 0); addCollider(-25.9, 0, -17.5, -25.3, 2, -16.2, { vm: m.darkSteel, mat: 'metal' });
  new Door({ axis: 'x', x1: -21, z: -16, w: 1.2, name: 'office' }); new Door({ axis: 'x', x1: -10, z: -22, w: 1.2 }); new Door({ axis: 'x', x1: -20, z: -4, w: 1.2 });
  // ---- container yard
  const cols = ['#2a5a8a', '#8a3a2a', '#3a6a3a', '#7a6a2a', '#6a2a5a', '#2a6a6a', '#8a5a2a'];
  const cont = (x, z, ry, tiers) => { const w = ry ? 2.45 : 6.06, d = ry ? 6.06 : 2.45; addCollider(x - w / 2, 0, z - d / 2, x + w / 2, 2.6 * tiers, z + d / 2, { vis: false, mat: 'metal' });
    for (let t = 0; t < tiers; t++) deco(B(6.06, 2.6, 2.45), M(cols[Math.floor(R() * cols.length)], 0.6, 0.25, { map: m.corr.map }), [x, 1.3 + t * 2.6, z], [0, (ry ? PI / 2 : 0) + rr(-0.01, 0.01), 0]); };
  for (const [x, z, ry, t] of [[3, -20, 0, 2], [3, -13, 0, 1], [3, -5, 0, 2], [3, 3, 0, 2], [14, -20, 0, 2], [14, -16.5, 0, 1], [14, -6, 0, 2], [14, 2, 0, 1], [9, 10, 1, 2], [20, 10, 0, 1], [-14, 6, 0, 1], [-22, 12, 1, 2], [-3, -24.5, 0, 1]]) cont(x, z, ry, t);
  // gantry crane over quay
  for (const z of [-12, 4]) for (const x of [21.6, 24.6]) { deco(B(0.8, 16, 0.8), M('#c84a1a', 0.5, 0.4), [x, 8, z]); addCollider(x - 0.4, 0, z - 0.4, x + 0.4, 16, z + 0.4, { vis: false, mat: 'metal' }); }
  deco(B(1.2, 1.4, 40), M('#c84a1a', 0.5, 0.4), [23.1, 16.6, -4], null, null, true); deco(B(3.5, 2.6, 3.5), M('#d8d0c0', 0.6), [23.1, 14.6, -1]);
  // freighter
  deco(B(16, 9, 46), M('#1c2a36', 0.6, 0.4), [36, 1.0, -3]); deco(B(16.2, 1.2, 46.2), M('#7a1c1a', 0.7, 0.2), [36, -2.8, -3], null, null, false);
  deco(B(12, 7, 9), m.white, [36, 9, 14]); for (let i = 0; i < 4; i++) deco(B(12.1, 0.6, 0.1), new THREE.MeshBasicMaterial({ color: '#ffd89a', toneMapped: false }), [36, 7 + i * 1.5, 9.45], null, null, false);
  for (let i = 0; i < 10; i++) deco(B(6, 2.6, 2.4), M(cols[i % cols.length], 0.6, 0.4), [33 + (i % 2) * 6.2, 6.8 + Math.floor(i / 6) * 2.6, -20 + (i % 5) * 5.4]);
  // speedboat + extraction zone
  boat = new THREE.Group(); LG.add(boat); add(boat, B(2.4, 0.9, 6.5), M('#e8e8e8', 0.3, 0.2), [0, 0, 0]); add(boat, B(2.0, 0.8, 1.6), M('#1a1a20', 0.2, 0.5), [0, 0.8, 0.6]); add(boat, B(2.45, 0.2, 6.55), M('#c8202a', 0.4), [0, -0.3, 0]); boat.position.set(-0.4, -1.2, 25.5);
  zone = deco(PL(6, 3), new THREE.MeshBasicMaterial({ color: '#30ff70', transparent: true, opacity: 0.2, depthWrite: false }), [-6, 0.03, 24.4], [-PI / 2, 0, 0], null, false);
  // light towers with floodlight shafts
  for (const [x, z, dx, dz] of [[-2, -24, 0.3, 1], [22, -24, -0.6, 0.8], [-2, 16, 0.2, -1], [20, 16, -0.5, -0.8], [-29, -2, 1, 0.2]]) { deco(C(0.2, 0.3, 12, 8), m.darkSteel, [x, 6, z]); addCollider(x - 0.3, 0, z - 0.3, x + 0.3, 12, z + 0.3, { vis: false, mat: 'metal' });
    for (const o of [-0.6, 0, 0.6]) deco(B(0.5, 0.35, 0.25), new THREE.MeshBasicMaterial({ color: '#fff2d8', toneMapped: false }), [x + o * dz, 12, z - o * dx], [0, Math.atan2(dx, dz), 0], null, false);
    K.shaft(V3(x, 12, z), V3(dx, -1.25, dz), 18, 0.5, 5, '#ffeccc', 0.07); pointLight('#ffeccc', 22, 24, x + dx * 6, 4, z + dz * 6); }
  pointLight('#ffd8a0', 6, 12, -16, 5.5, -13); pointLight('#ffd8a0', 6, 12, -10, 5.5, -19); pointLight('#fff4e0', 5, 8, -22.5, 2.7, -19); pointLight('#30ff70', 3, 8, -6, 1, 24); pointLight('#ffb070', 5, 12, 30, 8, 9);
  // items
  K.addInteractable('item', V3(-23.8, 0.95, -19.6), 'Zaman er ledger uthao', K.pickupModel('intel', V3(-23.8, 0.95, -19.6)), { done: 'Ledger paowa gese! Pier e speedboat e jao' });
  for (const [kind, pos, label] of [['ammo', V3(6.6, 0.2, -26.6), 'Ammo refill'], ['medkit', V3(-25.85, 1.2, -16.8), 'Medkit nao'], ['ammo', V3(-8.4, 0.2, 21.2), 'Ammo refill'], ['medkit', V3(-6.2, 1.2, -6.8), 'Medkit nao']]) K.addInteractable(kind, pos, label, K.pickupModel(kind, pos, kind === 'medkit' ? PI / 2 : 0));
  for (let i = 0; i < 6; i++) prop(i % 3 ? 'box' : 'bin', rr(-4, 20), 0, rr(-2, 18));
  K.buildCameras([{ pos: V3(-6.4, 4.4, -4.4), yaw: K.camLook(V3(-6.4, 0, -4.4), V3(4, 0, 8)), pitch: -0.3 }, { pos: V3(-6.4, 4.4, -21.6), yaw: K.camLook(V3(-6.4, 0, -21.6), V3(4, 0, -12)), pitch: -0.3 }]);
  return {
    id: 'redtide', bounds: { x0: -32.4, z0: -28.4, x1: 26.4, z1: 26.6 },
    spawns: { gate: { pos: V3(7, 0, -26.6), yaw: PI, label: 'North gate', desc: 'Truck er pichone lukiye main gate diye. Container yard er moddhe diye warehouse.', risk: 'Risk: High' },
      pier: { pos: V3(-6, 0, 24.6), yaw: 0, label: 'Speedboat', desc: 'Pani theke speedboat e eshe pier e namben. Warehouse er shamne khola jayga.', risk: 'Risk: Medium · Stealth', surprise: ['Docks'] } },
    enemies: [
      { id: 'E1', pos: V3(6.4, 0, -23), yaw: PI, room: 'Docks' }, { id: 'E2', pos: V3(8.6, 0, -9), yaw: PI, room: 'Docks', patrol: [V3(8.6, 0, -24), V3(8.6, 0, 7)] },
      { id: 'E3', pos: V3(19, 0, -10.4), yaw: -PI / 2, room: 'Docks', heavy: true }, { id: 'E4', pos: V3(-2, 0, 0), yaw: PI / 2, room: 'Docks', patrol: [V3(-3, 0, -1), V3(-3, 0, 18), V3(-20, 0, 18), V3(-20, 0, -1)] },
      { id: 'E5', pos: V3(-4.4, 0, -12), yaw: PI / 2, room: 'Docks' }, { id: 'E6', pos: V3(-4.4, 0, -15.4), yaw: PI / 2, room: 'Docks' },
      { id: 'E7', pos: V3(14, 0, 14), yaw: 0, room: 'Docks' }, { id: 'E8', pos: V3(-26, 0, 2), yaw: -PI / 2, room: 'Docks', patrol: [V3(-29, 0, 0), V3(-29, 0, 19)] },
      { id: 'E9', pos: V3(-13, 0, -13.5), yaw: -PI / 2, room: 'Warehouse' }, { id: 'E10', pos: V3(-18, 0, -6.5), yaw: 0, room: 'Warehouse', heavy: true }, { id: 'E11', pos: V3(-9, 0, -20), yaw: 0, room: 'Warehouse' },
      { id: 'E12', pos: V3(-21.6, 0, -18.4), yaw: PI, room: 'Office' }, { id: 'E13', pos: V3(23.1, 0, -4), yaw: PI / 2, room: 'Docks' },
      { id: 'ZAMAN', pos: V3(-17.4, 0, -13.5), yaw: PI / 2, room: 'Warehouse', leader: true, name: 'Zaman' },
    ],
    hostages: [], exits: [], rescued: () => false,
    objectives: [{ type: 'arrest', target: 'ZAMAN', label: 'Arms dealer Zaman ke jibito arrest', sub: 'Flashbang/taser e stun koro, V chaple surrender' }, { type: 'retrieve', label: 'Office theke ledger uddhar' }, { type: 'extract', zone: { x1: -9, z1: 22.9, x2: -3, z2: 25.9 }, label: 'Pier e speedboat e jao' }],
    bonus: ['stealth'], timer: { kind: 'deadline', s: { recruit: 1320, veteran: 1080, elite: 900 } }, deadlineFail: 'Zaman er jahaj bondor chere gelo.', executions: false,
    waves: { start: { recruit: 420, veteran: 360, elite: 300 }.veteran, every: { recruit: 75, veteran: 60, elite: 45 }, count: 3, total: { recruit: 6, veteran: 9, elite: 12 }, maxAlive: 9, heavy: 0.2, spawns: [V3(7, 0, -27), V3(-30, 0, 18)], target: V3(-6, 0, 21) },
    hawk: V3(20, 12.5, 16), hawkLine: ['Hawk on the light tower, south-east. Rain is heavy, I have the yard.', 'Hawk: Dokkhin-purber light tower e achi. Brishti beshi, kintu yard amar nojore.'],
    intro: { all: ['Zaman is in the warehouse. I want him breathing, and I want that ledger. Reinforcements are on the way.', 'Rafi: Zaman warehouse e. Oke jibito chai, ar ledger ta. Reinforcement ashche, druto koro.'] },
    onItem() { zone.material.opacity = 0.35; },
    update(dt, t) { if (water) { water.material.map.offset.x += dt * 0.01; water.material.map.offset.y -= dt * 0.005; } if (boat) { boat.position.y = -1.2 + Math.sin(t * 1.3) * 0.12; boat.rotation.z = Math.sin(t * 0.9) * 0.04; boat.rotation.x = Math.sin(t * 1.1) * 0.03; } if (zone) zone.material.opacity = (G.missionTimer !== undefined ? 0.2 : 0.2) + Math.sin(t * 3) * 0.06; },
    winLine: ['Zaman in custody, ledger secured. Every buyer on that list is ours now. Tiger 24, outstanding.', 'Rafi: Zaman grephtar, ledger amader hate. Oi list er protita buyer ke dhorbo. Tiger 24, oshadharon!'],
    blueprint: { view: [-32, -28, 26, 26], markers: [[-17.4, -13.5, 'ZAMAN', 'e'], [-23.8, -19.6, 'LEDGER', 'b'], [-6, 24.4, 'BOAT', 'b'], [7, -26.6, 'GATE', 'b'], [6.4, -23, '', 'e'], [8.6, -9, '', 'e'], [19, -10.4, '', 'e'], [-2, 0, '', 'e'], [-4.4, -12, '', 'e'], [-4.4, -15.4, '', 'e'], [14, 14, '', 'e'], [-26, 2, '', 'e'], [-13, -13.5, '', 'e'], [-18, -6.5, '', 'e'], [-9, -20, '', 'e'], [-21.6, -18.4, '', 'e'], [23.1, -4, '', 'e']] },
  };
}
