// Mission 14 — Operation Whiteout: snowbound mountain radar outpost; steal the launch codes, kill the jammer, fly out
import { THREE, G, PI, M, B, RB, C, SP, PL, RX, add, canvasTex, rng, R, rr, V3 } from '../core.js';
import * as K from '../levelkit.js';
const { addCollider, wallX, wallZ, floor, ceiling, deco, pointLight, room, prop, Door } = K;

export const meta = { id: 'whiteout', no: '14', name: 'Operation Whiteout', art: 'snow', type: 'Infiltration · extract', loc: 'Sandakphu ridge radar post · 3600 m', time: '06:40 hrs · tushar', diff: 'Elite',
  obj: ['Command hut theke missile launch code churi', 'Radar control e jammer bondho', 'LZ te heli te extraction'], intel: 'Red Tide pahare ekta radar post dokhol koreche. Tushar e dekha kothin, kintu ora-o amader dekhte pabe na. Jammer bondho na korle heli namte parbe na.' };

let zone = null, heli = null;
export function build() {
  K.beginLevel({ skyEnv: true, grade: { sat: 0.82, contrast: 1.06, sh: [0.92, 0.98, 1.1], hi: [1.0, 1.02, 1.06] }, bg: '#aebccc', fog: '#b4c2d2', fogD: 0.017, sun: 2.0, sunColor: '#e4ecff', sunPos: [-30, 18, 20], sunTarget: [0, 0, 0], shadowSize: 34, hemi: 2.0, hemiSky: '#b8c8e0', hemiGround: '#e8eef4', envI: 0.5,
    rain: [[-42, -42, 42, 42]], rainN: 2200, snow: true, alarmPos: [0, 5, -6], alarmBulbs: [[-8, 2.6, -14], [6, 2.6, -14], [0, 2.4, -1]], skyTop: '#9fb2cc', skyBottom: '#e4ebf2', city: false, skyDist: 110, alarmLight: true });
  const LG = K.LG, m = K.makeMaterials();
  const snowTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#e9eef3'; g.fillRect(0, 0, w, h); const r = rng(9); for (let i = 0; i < 90; i++) { const x = r() * w, y = r() * h, s = 10 + r() * 50; const gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, `rgba(${180 + r() * 40},${195 + r() * 30},${215 + r() * 25},.35)`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2); } for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.6})`; g.fillRect(r() * w, r() * h, 1, 1); } }, { repeat: [24, 24] });
  const snowM = M('#ffffff', 0.85, 0, { map: snowTex, normal: 1.6 }), corr = M('#ffffff', 0.5, 0.55, { map: m.corr.map }), plank = M('#6a5038', 0.85), rock = M('#5a5e64', 0.95);
  room('Barracks', -16, -18, -8, -10, 'wood', 0.5); room('Command hut', 6, -18, 16, -10, 'wood', 0.55); room('Radar control', -4, -7, 4, -1, 'concrete', 0.5); room('Garage', 8, -4, 16, 3, 'concrete', 0.55, false);
  room('Compound', -18, -20, 18, 10, 'snow', 0.8, false); room('Mountain', -42, -42, 42, 42, 'snow', 0.85, false);
  floor(-60, -60, 60, 60, snowM);
  // huts
  const hut = (x1, z1, x2, z2, side, at, name) => { const h = 2.8, op = [{ a: at, b: at + 1.2, y0: 0, y1: 2.3 }];
    wallX(z1, x1, x2, h, corr, side === 'n' ? op : [], { mat: 'metal' }); wallX(z2, x1, x2, h, corr, side === 's' ? op : [], { mat: 'metal' }); wallZ(x1, z1, z2, h, corr, side === 'w' ? op : [], { mat: 'metal' }); wallZ(x2, z1, z2, h, corr, side === 'e' ? op : [], { mat: 'metal' });
    floor(x1, z1, x2, z2, plank, 0.012); ceiling(x1, z1, x2, z2, h, m.ceilingDark); const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    deco(B(x2 - x1 + 0.6, 0.3, z2 - z1 + 0.6), corr, [cx, h + 0.15, cz]); deco(B(x2 - x1 + 0.66, 0.16, z2 - z1 + 0.66), snowM, [cx, h + 0.38, cz]);
    if (side === 'n' || side === 's') new Door({ axis: 'x', x1: at, z: side === 'n' ? z1 : z2, w: 1.2, name }); else new Door({ axis: 'z', x: side === 'w' ? x1 : x2, z1: at, w: 1.2, name });
    pointLight('#ffe2b8', 7, 10, cx, 2.5, cz); };
  hut(-16, -18, -8, -10, 'e', -15, 'barracks'); hut(6, -18, 16, -10, 'w', -15, 'command'); hut(-4, -7, 4, -1, 's', -0.6, 'radar');
  for (const z of [-17.2, -14.4, -11.6]) { addCollider(-15.8, 0, z - 0.45, -13.6, 0.9, z + 0.45, { vm: M('#4a5a4a', 0.8), mat: 'wood', pen: true }); }
  addCollider(-11, 0, -17.8, -9, 1.8, -17.2, { vm: m.darkSteel, mat: 'metal' });
  addCollider(11.4, 0, -14.6, 14.6, 0.78, -13.4, { vm: m.wood, mat: 'wood', pen: true }); prop('office', 13, 0, -12.6, PI); addCollider(15.3, 0, -17.6, 15.9, 2, -14.6, { vm: m.darkSteel, mat: 'metal' });
  for (let i = 0; i < 3; i++) deco(PL(0.7, 0.45), m.screen, [12 + i * 0.9, 1.3, -17.9], null, null, false);
  addCollider(-2.6, 0, -6.9, 2.6, 0.95, -6.2, { vm: m.darkSteel, mat: 'metal' }); for (let x = -2.2; x < 2.4; x += 0.8) deco(PL(0.6, 0.38), new THREE.MeshBasicMaterial({ color: x < 0 ? '#3cff8a' : '#4fd1c5', toneMapped: false }), [x, 1.3, -6.92], null, null, false);
  for (const x of [-3.5, 3.5]) addCollider(x - 0.4, 0, -5.8, x + 0.4, 2.1, -3.2, { vm: m.darkSteel, mat: 'metal' });
  // garage shed with truck
  for (const [x, z] of [[8, -4], [16, -4], [8, 3], [16, 3]]) { deco(B(0.25, 3.2, 0.25), m.darkSteel, [x, 1.6, z]); addCollider(x - 0.15, 0, z - 0.15, x + 0.15, 3.2, z + 0.15, { vis: false, mat: 'metal' }); }
  deco(B(8.6, 0.25, 7.6), corr, [12, 3.3, -0.5]); deco(B(8.7, 0.16, 7.7), snowM, [12, 3.5, -0.5]);
  deco(B(2.3, 1.4, 5), M('#4a5a3a', 0.6, 0.3), [12, 1.2, -0.5]); deco(B(2.3, 1.1, 1.8), M('#4a5a3a', 0.6, 0.3), [12, 2.3, -2.1]); addCollider(10.85, 0, -3, 13.15, 2.8, 2, { vis: false, mat: 'metal' });
  for (const [x, z] of [[10.8, -2.2], [13.2, -2.2], [10.8, 1.2], [13.2, 1.2]]) deco(C(0.42, 0.42, 0.3, 14), m.black, [x, 0.42, z], [0, 0, PI / 2]);
  // fence with gate (south) and a cut gap (east)
  const fenceM = new THREE.MeshStandardMaterial({ color: '#6a7078', metalness: 0.6, roughness: 0.4, transparent: true, opacity: 0.6, map: canvasTex(64, 64, g => { g.clearRect(0, 0, 64, 64); g.strokeStyle = '#fff'; g.lineWidth = 2; for (let i = -64; i < 128; i += 12) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 64); g.stroke(); g.beginPath(); g.moveTo(i + 64, 0); g.lineTo(i, 64); g.stroke(); } }, { repeat: [10, 1.5] }), alphaTest: 0.3, side: THREE.DoubleSide });
  const fence = (x1, z1, x2, z2) => { addCollider(Math.min(x1, x2) - 0.05, 0, Math.min(z1, z2) - 0.05, Math.max(x1, x2) + 0.05, 2.4, Math.max(z1, z2) + 0.05, { vis: false, mat: 'metal', pen: true }); const L = Math.hypot(x2 - x1, z2 - z1); deco(PL(L, 2.4), fenceM, [(x1 + x2) / 2, 1.2, (z1 + z2) / 2], [0, x1 === x2 ? PI / 2 : 0, 0], null, false); };
  fence(-18, -20, 18, -20); fence(-18, -20, -18, 10); fence(18, -20, 18, -7); fence(18, -4.6, 18, 10); fence(-18, 10, -2.5, 10); fence(2.5, 10, 18, 10);
  for (let x = -18; x <= 18; x += 4) { deco(B(0.1, 2.6, 0.1), m.darkSteel, [x, 1.3, -20], null, null, false); deco(B(0.1, 2.6, 0.1), m.darkSteel, [x, 1.3, 10], null, null, false); }
  // radar dome on the hill behind the compound
  deco(C(3, 3.6, 6, 18), M('#c8ccd0', 0.6, 0.2), [0, 3, -30]); deco(SP(6, 24, 16), M('#f0f2f4', 0.4, 0.05), [0, 9, -30]); addCollider(-3.6, 0, -33.6, 3.6, 6, -26.4, { vis: false, mat: 'concrete' });
  // rocks, drifts, trees with snow
  const r2 = rng(17);
  for (const [x, z, s] of [[-24, -8, 2], [26, -14, 2.4], [-28, 14, 2.2], [22, 18, 1.8], [-8, 18, 1.4], [8, 22, 1.6], [-30, -26, 3], [30, 30, 2.6], [-14, 30, 2], [32, -2, 1.6], [-6, -24, 1.4], [10, -26, 1.8]]) {
    deco(SP(s, 9, 7), rock, [x, s * 0.4, z], [r2(), r2(), 0], [1.3, 0.75, 1.1]); deco(SP(s * 0.95, 9, 7), snowM, [x, s * 0.62, z], [r2(), r2(), 0], [1.25, 0.4, 1.05], false); addCollider(x - s, 0, z - s * 0.75, x + s, s * 0.95, z + s * 0.75, { vis: false, mat: 'concrete' }); }
  for (const [x, z, w] of [[-8, 4, 3], [6, 6, 2.6], [-12, -4, 2.4], [2, -14, 3], [-4, 14, 3], [12, 14, 2.4]]) { deco(SP(1, 10, 6), snowM, [x, 0.1, z], null, [w * 0.6, 0.55, 0.9]); addCollider(x - w * 0.55, 0, z - 0.75, x + w * 0.55, 0.65, z + 0.75, { vis: false, mat: 'concrete', pen: true }); }
  for (let i = 0; i < 70; i++) { const a = r2() * PI * 2, d = 24 + r2() * 30; const x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.abs(x) < 5 && z > 18) continue; if (x > 24 && z < -20) continue; K.tree(x, z, 0.9 + r2() * 0.9, d < 38); deco(C(0, 1.1, 1.3, 8), snowM, [x, 3.3, z], null, null, false); }
  for (const [x1, z1, x2, z2] of [[-42, -42, 42, -41.6], [-42, 41.6, 42, 42], [-42, -42, -41.6, 42], [41.6, -42, 42, 42]]) addCollider(x1, 0, z1, x2, 4, z2, { vis: false });
  // crates in the compound
  for (const [x, z] of [[-6, -12], [-4.6, -12.2], [3, -12], [-12, 4], [-10.6, 4.4], [4, 6]]) { addCollider(x - 0.6, 0, z - 0.6, x + 0.6, 1.2, z + 0.6, { vm: M('#ffffff', 0.85, 0, { map: canvasTex(64, 64, g => { g.fillStyle = '#5a6a4a'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#3a4a2a'; g.lineWidth = 4; g.strokeRect(2, 2, 60, 60); g.beginPath(); g.moveTo(2, 2); g.lineTo(62, 62); g.stroke(); }) }), mat: 'wood', pen: true }); deco(B(1.22, 0.1, 1.22), snowM, [x, 1.25, z], null, null, false); }
  // LZ + waiting helicopter (far)
  zone = deco(PL(8, 6), new THREE.MeshBasicMaterial({ color: '#30ff70', transparent: true, opacity: 0.0, depthWrite: false }), [0, 0.03, 28], [-PI / 2, 0, 0], null, false);
  for (const [x, z] of [[-4, 25], [4, 25], [-4, 31], [4, 31]]) { deco(SP(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff4020', toneMapped: false }), [x, 0.12, z], null, null, false); pointLight('#ff4020', 2.5, 5, x, 0.5, z); }
  heli = K.heliModel(V3(0, 40, 70), PI, '#3a4a3a');
  // floodlights
  for (const [x, z, dx, dz] of [[-17.6, 9.6, 0.5, -1], [17.6, -19.6, -0.6, 1]]) { deco(C(0.1, 0.12, 6, 8), m.darkSteel, [x, 3, z]); K.shaft(V3(x, 6, z), V3(dx, -1.1, dz), 12, 0.3, 4, '#fff4e0', 0.07); pointLight('#fff2dc', 16, 18, x + dx * 4, 3, z + dz * 4); }
  // items
  K.addInteractable('item', V3(13, 0.95, -14), 'Launch code case uthao', K.pickupModel('intel', V3(13, 0.95, -14)), { done: 'Launch code paowa gese! Jammer bondho kore LZ e jao' });
  K.addInteractable('task', V3(0, 1.0, -6.0), 'Radar jammer bondho koro', K.pickupModel('console', V3(0, 1.0, -6.0)), { id: 'jam', hold: 3, done: 'Jammer bondho! Heli ashche LZ e', onUse: () => { if (zone) zone.material.opacity = 0.25; } });
  for (const [kind, pos, label] of [['ammo', V3(-30, 0.2, 24), 'Ammo refill'], ['medkit', V3(-9.2, 1.2, -17.4), 'Medkit nao'], ['ammo', V3(9.4, 0.2, 2), 'Ammo refill'], ['medkit', V3(-3.4, 1.2, -2)
    , 'Medkit nao'], ['ammo', V3(28, 0.2, -28), 'Ammo refill']]) K.addInteractable(kind, pos, label, K.pickupModel(kind, pos));
  K.buildCameras([{ pos: V3(-3.8, 2.6, -1.2), yaw: K.camLook(V3(-3.8, 0, -1.2), V3(-2, 0, 8)), pitch: -0.3 }]);
  return {
    id: 'whiteout', bounds: { x0: -42, z0: -42, x1: 42, z1: 42 },
    spawns: { ridge: { pos: V3(-30, 0, 26), yaw: -PI * 0.75, label: 'South ridge', desc: 'Pahar theke neme main gate er dike. LZ kache, kintu khola mathe.', risk: 'Risk: High' },
      tunnel: { pos: V3(30, 0, -30), yaw: PI * 0.25, label: 'Service tunnel', desc: 'Purbo diker tunnel diye ber hoye fence er kata jayga diye. Command hut kache, chupchap.', risk: 'Risk: Medium · Stealth', surprise: ['Compound'] } },
    enemies: [
      { id: 'E1', pos: V3(-1, 0, 12), yaw: 0, room: 'Mountain' }, { id: 'E2', pos: V3(1.6, 0, 12.4), yaw: 0.3, room: 'Mountain' },
      { id: 'E3', pos: V3(-10, 0, 0), yaw: 0, room: 'Compound', patrol: [V3(-15, 0, 7), V3(-15, 0, -7), V3(-5, 0, -8.6), V3(-5, 0, 7)] }, { id: 'E4', pos: V3(8, 0, 8.2), yaw: PI, room: 'Compound', patrol: [V3(6, 0, 8.4), V3(16, 0, 8.2), V3(17, 0, -6), V3(6.4, 0, -6)] },
      { id: 'E5', pos: V3(-12, 0, -13), yaw: PI / 2, room: 'Barracks' }, { id: 'E6', pos: V3(-10, 0, -16), yaw: -PI / 2, room: 'Barracks' }, { id: 'E7', pos: V3(9, 0, -12), yaw: -PI / 2, room: 'Command hut' },
      { id: 'E8', pos: V3(1.6, 0, -3.6), yaw: PI, room: 'Radar control' }, { id: 'E9', pos: V3(12, 0, 4.6), yaw: 0, room: 'Garage', heavy: true }, { id: 'E10', pos: V3(0, 0, -16), yaw: PI, room: 'Compound', patrol: [V3(-6, 0, -18.6), V3(6, 0, -18.6)] },
      { id: 'E11', pos: V3(21, 0, -2), yaw: PI / 2, room: 'Mountain', patrol: [V3(21, 0, -8), V3(21, 0, 6)] }, { id: 'E12', pos: V3(-24, 0, 4), yaw: -PI / 2, room: 'Mountain', patrol: [V3(-24, 0, -4), V3(-24, 0, 16)] },
      { id: 'LEADER', pos: V3(13, 0, -16.4), yaw: 0, room: 'Command hut', leader: true, name: 'Red Tide colonel' },
    ],
    hostages: [], exits: [], rescued: () => false,
    objectives: [{ type: 'retrieve', label: 'Launch code churi koro' }, { type: 'task', id: 'jam', label: 'Radar jammer bondho koro' }, { type: 'extract', zone: { x1: -4, z1: 25, x2: 4, z2: 31 }, label: 'LZ e heli te uthe jao' }],
    bonus: ['leader', 'stealth'], timer: { kind: 'deadline', s: { recruit: 1320, veteran: 1080, elite: 900 } }, deadlineFail: 'Tushar jhor e heli ar opekkha korte parlo na.', executions: false,
    hawk: V3(-36, 9, 34), hawkLine: ['Hawk on the south ridge. Visibility is poor, but I can see the gate.', 'Hawk: Dokkhin er pahare achi. Tushar e kom dekha jay, tobe gate dekhte pacchi.'],
    intro: { all: ['Snow is your friend today. Codes from the command hut, jammer in the radar room, then the LZ south of the gate.', 'Rafi: Ajke tushar amader bondhu. Command hut theke code, radar room e jammer, tarpor gate er dokkhine LZ.'] },
    update(dt, t) { if (heli) { heli.userData.rotor.rotation.y += dt * 22; const jam = zone && zone.material.opacity > 0.1; const tgt = jam ? V3(0, 12, 46) : V3(0, 40, 80); heli.position.lerp(tgt, Math.min(1, dt * 0.25)); } if (zone && zone.material.opacity > 0.1) zone.material.opacity = 0.2 + Math.sin(t * 3) * 0.07; },
    winLine: ['Codes recovered, wheels up. Nobody even saw us coming. Good work, Tiger 24.', 'Rafi: Code amader hate, heli uthche. Keu bujhteo pare ni. Darun, Tiger 24!'],
    blueprint: { view: [-42, -42, 42, 42], markers: [[13, -14, 'CODES', 'b'], [0, -6, 'JAMMER', 'b'], [0, 28, 'LZ', 'b'], [13, -16.4, 'CMD', 'e'], [0, 12, '', 'e'], [-10, 0, '', 'e'], [8, 8.2, '', 'e'], [-12, -13, '', 'e'], [9, -12, '', 'e'], [1.6, -3.6, '', 'e'], [12, 4.6, '', 'e'], [0, -16, '', 'e'], [21, -2, '', 'e'], [-24, 4, '', 'e']] },
  };
}
