// Mission 05 — Operation Iron Rail: hijacked express train, reach the engine and stop it before the bridge
import { THREE, G, PI, M, B, RB, C, SP, PL, RX, add, canvasTex, rng, R, rr, V3 } from '../core.js';
import * as K from '../levelkit.js';
const { addCollider, wallX, wallZ, floor, ceiling, deco, pointLight, room, prop, Door } = K;

export const meta = { id: 'ironrail', no: '05', name: 'Operation Iron Rail', art: 'train', type: 'Moving train', loc: 'Express 409 · Northern line', time: '17:45 hrs', diff: 'Elite',
  obj: ['Engine e giye emergency brake', 'Passenger der pichoner coach e pathano', 'Hijacker der shamlano'], intel: 'Train 110 km/h e cholche. 10 minute por bhanga bridge. Coach gulo shoru, cover kom.' };

const CARS = [['Rear coach', 'pass'], ['Coach B', 'pass'], ['Dining car', 'dine'], ['Cargo car', 'cargo'], ['Coach A', 'pass'], ['Engine', 'engine']];
const carZ = i => [-42 + i * 13.2, -42 + i * 13.2 + 12];
let scen = [], groundTex = null;
export function build() {
  K.beginLevel({ skyEnv: true, grade: { sat: 1.05, contrast: 1.08, sh: [0.94, 0.96, 1.08], hi: [1.08, 1.0, 0.92] }, bg: '#2a1a24', fog: '#3a2630', fogD: 0.012, sun: 1.8, sunColor: '#ffb090', sunPos: [-40, 18, 10], sunTarget: [0, 0, 0], shadowSize: 30, hemi: 0.6, hemiSky: '#e0a0a0', hemiGround: '#2a2a20',
    alarmPos: [0, 2.3, 0], alarmBulbs: CARS.map((c, i) => [0, 2.35, carZ(i)[0] + 6]), skyTop: '#2a1a3a', skyBottom: '#e08a70', city: false, skyDist: 120, alarmLight: false });
  const LG = K.LG, m = K.makeMaterials();
  groundTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#4a4232'; g.fillRect(0, 0, w, h); const r = rng(8); for (let i = 0; i < 6000; i++) { const c = 50 + r() * 80; g.fillStyle = `rgba(${c},${c - 5},${c - 20},.5)`; g.fillRect(r() * w, r() * h, 2, 2); } }, { repeat: [60, 60] });
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1 })); gp.rotation.x = -PI / 2; gp.position.y = -1.2; LG.add(gp);
  const rail = M('#6a6a6a', 0.3, 0.9); for (const x of [-0.75, 0.75]) deco(B(0.08, 0.1, 400), rail, [x, -1.1, 0], null, null, false); const rail2 = deco(B(1.8, 0.1, 400), M('#2a2420', 1), [0, -1.16, 0], null, null, false);
  const shell = M('#c8ccd0', 0.4, 0.6), stripe = M('#1f4a8a', 0.5, 0.4), inner = M('#d8d2c4', 0.85), seat = M('#2a3a6a', 0.8), floorM = M('#4a4440', 0.85);
  CARS.forEach(([name, type], i) => {
    const [z1, z2] = carZ(i); room(name, -1.6, z1 - 0.6, 1.6, z2 + 0.6, type === 'engine' ? 'concrete' : 'carpet', type === 'cargo' ? 0.45 : 0.75);
    floor(-1.5, z1, 1.5, z2, floorM); ceiling(-1.5, z1, 1.5, z2, 2.4, inner);
    deco(B(3.4, 3.2, 12), shell, [0, 0.4, (z1 + z2) / 2], null, [1, 1, 1]).visible = false;
    // side walls with windows
    for (const sx of [-1.6, 1.6]) { const ops = []; if (type !== 'cargo' && type !== 'engine') for (let z = z1 + 1; z < z2 - 1.5; z += 2.2) ops.push({ a: z, b: z + 1.4, y0: 0.9, y1: 1.9 }); if (type === 'engine') ops.push({ a: z2 - 3, b: z2 - 0.6, y0: 0.9, y1: 1.9 });
      wallZ(sx, z1, z2, 2.4, inner, ops); for (const o of ops) K.addGlass(sx - 0.03, o.y0, o.a, sx + 0.03, o.y1, o.b);
      deco(B(0.06, 0.25, 12), stripe, [sx + Math.sign(sx) * 0.13, 0.6, (z1 + z2) / 2], null, null, false); deco(B(0.05, 2.6, 12.2), shell, [sx + Math.sign(sx) * 0.18, 1.1, (z1 + z2) / 2], null, null, false); }
    deco(B(3.6, 0.15, 12.2), shell, [0, 2.55, (z1 + z2) / 2]); deco(B(3.4, 0.5, 12), M('#2a2a2a', 0.8, 0.5), [0, -0.3, (z1 + z2) / 2]);
    // end walls with doorways
    wallX(z1, -1.5, 1.5, 2.4, inner, [{ a: -0.72, b: 0.72, y0: 0, y1: 2.1 }]);
    if (i < CARS.length - 1) wallX(z2, -1.5, 1.5, 2.4, inner, [{ a: -0.5, b: 0.5, y0: 0, y1: 2.1 }]); else wallX(z2, -1.5, 1.5, 2.4, M('#2a2e34', 0.5, 0.5));
    if (i < CARS.length - 1) { floor(-0.7, z2, 0.7, z2 + 1.2, M('#3a3a3a', 0.6, 0.6)); for (const sx of [-0.75, 0.75]) addCollider(sx - 0.05, 0, z2, sx + 0.05, 2.2, z2 + 1.2, { vm: M('#222', 0.9) }); deco(B(1.5, 0.1, 1.2), M('#222', 0.9), [0, 2.2, z2 + 0.6]); }
    deco(B(0.5, 0.04, 10), m.fluo, [0, 2.38, (z1 + z2) / 2], null, null, false); pointLight(type === 'cargo' ? '#ffd8a0' : '#f2f6ff', type === 'cargo' ? 4 : 6, 9, 0, 2.2, (z1 + z2) / 2);
    // contents
    if (type === 'pass') for (let z = z1 + 1.2; z < z2 - 1.2; z += 1.6) for (const [a, b] of [[-1.5, -0.6], [0.6, 1.5]]) { addCollider(a, 0, z, b, 0.95, z + 0.5, { vm: seat, mat: 'wood', pen: true }); deco(B(b - a, 0.5, 0.12), seat, [(a + b) / 2, 1.15, z + 0.44]); }
    if (type === 'dine') { for (let z = z1 + 2; z < z2 - 3.4; z += 2.6) for (const [a, b] of [[-1.5, -0.6], [0.6, 1.5]]) { addCollider(a, 0, z, b, 0.75, z + 0.9, { vm: m.white, mat: 'wood', pen: true }); } addCollider(-1.5, 0, z2 - 1.8, -0.8, 1.05, z2 - 0.6, { vm: m.woodLight, mat: 'wood', pen: true }); }
    if (type === 'cargo') { for (const [x, z, h] of [[-1.05, z1 + 2.2, 1.6], [1.05, z1 + 4.6, 1.2], [-1.05, z1 + 7.6, 1.8], [1.05, z1 + 10.0, 1.5]]) addCollider(x - 0.4, 0, z - 0.75, x + 0.4, h, z + 0.75, { vm: M('#ffffff', 0.8, 0, { map: canvasTex(64, 64, g => { g.fillStyle = '#7a5a34'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#4a321a'; g.lineWidth = 6; g.strokeRect(3, 3, 58, 58); }) }), mat: 'wood', pen: true }); for (let k = 0; k < 4; k++) prop('box', k % 2 ? 1.1 : -1.1, 0, z1 + 3.4 + k * 1.7); deco(B(0.9, 0.04, 0.9), M('#555', 0.6, 0.6), [0, 2.38, z1 + 6]); }
    if (type === 'engine') { addCollider(-1.5, 0, z2 - 1.4, 1.5, 1.1, z2 - 0.2, { vm: m.darkSteel, mat: 'metal' }); for (let k = 0; k < 5; k++) deco(PL(0.4, 0.25), m.screen, [-1 + k * 0.5, 1.2, z2 - 1.39], [-0.5, PI, 0], null, false); addCollider(-1.5, 0, z1 + 1, -0.62, 2.0, z1 + 5, { vm: m.darkSteel, mat: 'metal' }); addCollider(0.62, 0, z1 + 1, 1.5, 2.0, z1 + 5, { vm: m.darkSteel, mat: 'metal' }); }
  });
  // invisible outer hull so nobody leaves the train
  addCollider(-3, 0, -43, 3, 3, -42.6, { vis: false }); addCollider(-3, 0, 36.2, 3, 3, 36.6, { vis: false });
  // scenery that scrolls past
  const poleM = M('#3a3a34', 0.7, 0.4), trunk = M('#3a2a1c', 0.95), leafs = [M('#3a4a22', 0.9), M('#4a5a2a', 0.9), M('#5a4a2a', 0.9)];
  for (let i = 0; i < 26; i++) { const g = new THREE.Group(); const side = i % 2 ? 1 : -1; g.position.set(side * 3.2, -1.2, -200 + i * 16); add(g, B(0.15, 6, 0.15), poleM, [0, 3, 0], null, null, false); add(g, B(1.4, 0.08, 0.08), poleM, [-side * 0.6, 5.8, 0], null, null, false); LG.add(g); scen.push({ g, speed: 1 }); }
  for (let i = 0; i < 60; i++) { const g = new THREE.Group(); const side = R() < 0.5 ? -1 : 1; g.position.set(side * rr(7, 40), -1.2, rr(-200, 200)); const s = rr(0.8, 2); g.scale.setScalar(s); add(g, C(0.1, 0.18, 3, 6), trunk, [0, 1.5, 0], null, null, false); add(g, SP(1.2, 7, 5), leafs[i % 3], [0, 3.6, 0], null, [1, 1.3, 1], false); LG.add(g); scen.push({ g, speed: 1 }); }
  // doors between cars
  CARS.forEach((c, i) => { if (i < CARS.length - 1) new Door({ axis: 'x', x1: -0.5, z: carZ(i)[1], w: 1.0, h: 2.1, name: 'gang' + i }); });
  // interactables
  K.addInteractable('task', V3(0.6, 0, 33.2), 'Emergency brake tano', K.pickupModel('lever', V3(0.6, 0, 33.2), PI), { id: 'brake', hold: 2.5, done: 'Brake laglo! Train thamche', onUse: () => { stopping = true; } });
  for (const [kind, pos, label] of [['ammo', V3(-1, 0.2, -40.8), 'Ammo refill'], ['medkit', V3(1.45, 1.4, -10), 'Medkit nao'], ['ammo', V3(1, 0.2, 2), 'Ammo refill'], ['medkit', V3(-1.45, 1.4, 16), 'Medkit nao']]) K.addInteractable(kind, pos, label, K.pickupModel(kind, pos, kind === 'medkit' ? (pos.x > 0 ? -PI / 2 : PI / 2) : 0));
  K.buildCameras([]);
  let speed = 31, stopping = false;
  const cz = i => (carZ(i)[0] + carZ(i)[1]) / 2;
  return {
    id: 'ironrail', bounds: { x0: -3, z0: -44, x1: 3, z1: 37 },
    spawns: { rear: { insert: 'fade', pos: V3(0, 0, -40.6), yaw: PI, label: 'Rear coach', desc: 'Pichoner coach er door diye dhukben, ek coach por por samne egoben.', risk: 'Risk: Medium' },
      roof: { pos: V3(0, 0, cz(3) - 4.5), yaw: PI, rappel: 2.2, label: 'Roof hatch', desc: 'Heli theke train er chhade neme cargo car er hatch diye dhukben. Engine kache, kintu duidik theke attack.', risk: 'Risk: High · Surprise', surprise: ['Cargo car'] } },
    enemies: [
      { id: 'E1', pos: V3(0, 0, -34), yaw: PI, room: 'Rear coach' }, { id: 'E2', pos: V3(0, 0, -24), yaw: 0, room: 'Coach B', patrol: [V3(0, 0, -27.8), V3(0, 0, -18)] }, { id: 'E3', pos: V3(0, 0, -20), yaw: PI, room: 'Coach B' },
      { id: 'E4', pos: V3(0, 0, -12), yaw: PI, room: 'Dining car' }, { id: 'E5', pos: V3(0, 0, -7.4), yaw: 0.6, room: 'Dining car' }, { id: 'E6', pos: V3(0, 0, 0), yaw: PI, room: 'Cargo car' },
      { id: 'E7', pos: V3(0, 0, 8), yaw: PI, room: 'Cargo car' }, { id: 'E8', pos: V3(0, 0, 14), yaw: PI, room: 'Coach A', patrol: [V3(0, 0, 11.8), V3(0, 0, 21.8)] }, { id: 'E9', pos: V3(0, 0, 21), yaw: PI, room: 'Coach A' },
      { id: 'E10', pos: V3(0, 0, 26.8), yaw: PI, room: 'Engine' }, { id: 'LEADER', pos: V3(-0.6, 0, 32), yaw: PI, room: 'Engine', leader: true },
    ],
    hostages: [{ pos: V3(-1.05, 0, -22.4), yaw: PI / 2 }, { pos: V3(1.05, 0, -20.8), yaw: -PI / 2 }, { pos: V3(-1.05, 0, -9.6), yaw: PI / 2 }, { pos: V3(1.05, 0, -7), yaw: -PI / 2 },
      { pos: V3(-1.05, 0, 16.4), yaw: PI / 2 }, { pos: V3(1.05, 0, 18), yaw: -PI / 2 }, { pos: V3(0.6, 0, 31.6), yaw: PI, look: { shirt: '#2a3a5a', skin: '#8d5a3b', seed: 31, tie: '#c4a020' } }],
    exits: [V3(0, 0, -40.8)], rescued: p => p.z < -39.5,
    objectives: [{ type: 'task', id: 'brake', label: 'Engine e emergency brake tano' }, { type: 'rescue', label: 'Passenger der rear coach e pathao' }, { type: 'neutralize' }], bonus: ['leader'],
    timer: { kind: 'deadline', s: { recruit: 720, veteran: 600, elite: 480 } }, deadlineFail: 'Train bhanga bridge e pouche geche.', executions: true, maxDead: 3, shieldRetreat: V3(0, 0, 33),
    hawk: null, shake: 0.006,
    intro: { all: ['We are on the Express 409. The bridge is out ahead. Fight your way to the engine and pull the brake.', 'Rafi: Express 409 e achi. Samne bridge bhanga. Engine porjonto lore giye brake tano.'] },
    update(dt, t) { if (stopping) speed = Math.max(0, speed - dt * 4); const ds = speed * dt; for (const s of scen) { s.g.position.z -= ds; if (s.g.position.z < -200) s.g.position.z += 400; } groundTex.offset.y += ds / (400 / 60); G.shakeAmb = speed > 1 ? 0.006 * (speed / 31) : 0; },
    winLine: ['Train stopped, passengers safe. Well done, Tiger 24.', 'Rafi: Train theme geche, passenger ra nirapod. Shabash!'],
    blueprint: { view: [-6, -44, 6, 37], markers: [[0, -21, '2', 'h'], [0, -8, '2', 'h'], [0, 17, '2', 'h'], [0, 31.6, 'DRIVER', 'h'], [0, 33.2, 'BRAKE', 'b'], [0, -34, '', 'e'], [0, -22, '', 'e'], [0, -12, '', 'e'], [0, 2, '', 'e'], [0, 16, '', 'e'], [0, 28, '', 'e']] },
  };
}
