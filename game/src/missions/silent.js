// Mission 06 — Operation Silent Night: embassy stealth rescue in the snow (alarm = fail)
import { THREE, G, PI, M, B, RB, C, SP, PL, RX, add, canvasTex, rng, R, rr, V3 } from '../core.js';
import * as K from '../levelkit.js';
const { addCollider, wallX, wallZ, floor, ceiling, deco, pointLight, room, prop, Door } = K;

export const meta = { id: 'silent', no: '06', name: 'Operation Silent Night', art: 'embassy', type: 'Stealth VIP rescue', loc: 'Embassy compound · Hill district', time: '03:30 hrs · tushar', diff: 'Elite',
  obj: ['Kono alarm na bajiye Ambassador ke uddhar', 'Server room theke data copy', 'Ambassador ke extraction e pouchano'], intel: 'Dhora porle VIP ke sathe sathe sorie fela hobe. Security room er console diye CCTV bondho kora jay. Suppressed gun bebohar koro.' };

export function build() {
  K.beginLevel({ grade: { sat: 0.9, contrast: 1.08, sh: [0.92, 0.98, 1.1], hi: [1.0, 1.0, 1.02] }, bg: '#0a1018', fog: '#1a2230', fogD: 0.02, sun: 0.9, sunColor: '#b8ccff', sunPos: [20, 30, 30], sunTarget: [0, 0, -6], shadowSize: 32, hemi: 0.75, hemiSky: '#8aa0c8', hemiGround: '#d8e0f0',
    rain: [[-32, -32, 32, 32]], rainN: 2200, snow: true, alarmPos: [0, 3, -8], alarmBulbs: [[0, 3.4, -0.4]], skyTop: '#05080e', skyBottom: '#28344a', city: false, skyDist: 70 });
  const LG = K.LG, m = K.makeMaterials();
  const snow = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#dfe6f0'; g.fillRect(0, 0, w, h); const r = rng(2); for (let i = 0; i < 3000; i++) { const c = 200 + r() * 55; g.fillStyle = `rgba(${c - 10},${c},${c + 10},.4)`; g.fillRect(r() * w, r() * h, 2, 2); } }, { repeat: [30, 30] });
  const stone = M('#ffffff', 0.9, 0, { map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#8a8478'; g.fillRect(0, 0, w, h); const r = rng(3); for (let y = 0; y < h; y += 32) for (let x = (y / 32 % 2) * 24; x < w + 48; x += 48) { const v = 110 + r() * 40; g.fillStyle = `rgb(${v},${v - 4},${v - 12})`; g.fillRect(x - 46, y + 2, 44, 28); } }, { repeat: [6, 2] }) });
  const cream = M('#d8cdb4', 0.9), parquet = M('#ffffff', 0.6, 0, { map: canvasTex(256, 256, (g, w, h) => { const r = rng(4); for (let y = 0; y < h; y += 16) for (let x = (y / 16 % 2) * 32; x < w + 64; x += 64) { const v = 90 + r() * 40; g.fillStyle = `rgb(${v + 40},${v + 10},${v - 20})`; g.fillRect(x - 64, y, 63, 15); } }, { repeat: [6, 6] }) });
  room('Hall', -6, -8, 6, 0, 'marble', 0.75); room('Office', -14, -8, -6, 0, 'carpet', 0.6); room('Security', -14, -18, -6, -8, 'tile', 0.6); room('Server room', 6, -8, 14, 0, 'tile', 0.55);
  room('Ambassador suite', 6, -18, 14, -8, 'carpet', 0.55); room('Corridor', -6, -18, 6, -8, 'marble', 0.6); room('Compound', -30, -30, 30, 30, 'snow', 0.42, false); room('Outside', -100, -100, 100, 100, 'snow', 0.4, false);
  floor(-40, -40, 40, 40, M('#ffffff', 0.85, 0, { map: snow }), -0.005); floor(-14, -18, 14, 0, parquet);
  deco(PL(3, 28), M('#5a5a5a', 0.9), [0, 0.003, 14], [-PI / 2, 0, 0], null, false);
  // compound wall
  for (const [x1, z1, x2, z2] of [[-30, -30.3, 30, -30], [-30, 30, 22, 30.3], [26, 30, 30, 30.3], [-30.3, -30, -30, 30], [30, -30, 30.3, 30]]) addCollider(x1, 0, z1, x2, 3.5, z2, { vm: stone, uv: 3 });
  deco(B(4, 0.3, 0.3), m.black, [24, 3.4, 30.15]); for (const x of [22, 26]) deco(B(0.6, 4, 0.6), stone, [x, 2, 30.15]);
  addCollider(26.5, 0, 26, 29.6, 2.8, 29.6, { vm: cream }); deco(B(3.4, 0.2, 3.9), m.black, [28, 2.9, 27.8]);
  // building shell
  const winOps = (from, to) => { const o = []; for (let a = from + 1.2; a < to - 1.8; a += 3) o.push({ a, b: a + 1.4, y0: 1.0, y1: 2.4 }); return o; };
  const front = winOps(-14, 14).filter(o => o.b < -1.4 || o.a > 1.4);
  wallX(0.15, -14, 14, 3.8, stone, [{ a: -1, b: 1, y0: 0, y1: 2.6 }, ...front]); for (const o of front) K.addGlass(o.a, o.y0, 0.1, o.b, o.y1, 0.2);
  wallX(-18.15, -14, 14, 3.8, stone, winOps(-14, 14)); for (const o of winOps(-14, 14)) K.addGlass(o.a, o.y0, -18.2, o.b, o.y1, -18.1);
  wallZ(-14.15, -18, 0, 3.8, stone, [{ a: -5, b: -3.6, y0: 0, y1: 2.3 }]); wallZ(14.15, -18, 0, 3.8, stone);
  wallZ(-5.85, -8, 0, 3.6, cream, [{ a: -4.6, b: -3.4, y0: 0, y1: 2.3 }]); wallZ(5.85, -8, 0, 3.6, cream, [{ a: -4.6, b: -3.4, y0: 0, y1: 2.3 }]);
  wallX(-8.15, -14, 14, 3.6, cream, [{ a: -10.6, b: -9.4, y0: 0, y1: 2.3 }, { a: -0.6, b: 0.6, y0: 0, y1: 2.3 }, { a: 9.4, b: 10.6, y0: 0, y1: 2.3 }]);
  wallZ(-5.85, -18, -8, 3.6, cream, [{ a: -13.6, b: -12.4, y0: 0, y1: 2.3 }]); wallZ(5.85, -18, -8, 3.6, cream, [{ a: -13.6, b: -12.4, y0: 0, y1: 2.3 }]);
  ceiling(-14, -18, 14, 0, 3.6, m.ceiling); deco(B(29, 0.6, 19), M('#3a3e48', 0.7, 0.3), [0, 4.1, -9]);
  for (const [x, z] of [[0, -4], [-10, -4], [10, -4], [0, -13], [-10, -13], [10, -13]]) deco(C(0.35, 0.35, 0.08, 16), m.panel, [x, 3.55, z], null, null, false);
  // furniture
  addCollider(-2, 0, -6.4, 2, 1.0, -5.6, { vm: m.wood, mat: 'wood', pen: true }); deco(PL(3.2, 0.9), M('#ffffff', 0.5, 0.2, { map: canvasTex(512, 128, (g, w, h) => { g.fillStyle = '#1e2a44'; g.fillRect(0, 0, w, h); g.fillStyle = '#e0c06a'; g.font = '700 64px "Saira Condensed", serif'; g.textAlign = 'center'; g.fillText('EMBASSY', w / 2, 86); }) }), [0, 2.6, -7.98], null, null, false);
  for (const x of [-4, 4]) { deco(C(0.3, 0.3, 3.6, 14), stone, [x, 1.8, -1.5]); addCollider(x - 0.3, 0, -1.8, x + 0.3, 3.6, -1.2, { vis: false }); }
  addCollider(-13, 0, -6, -10, 0.78, -4.6, { vm: m.wood, mat: 'wood', pen: true }); addCollider(-13.9, 0, -1, -10, 2, -0.4, { vm: m.wood, mat: 'wood', pen: true }); prop('office', -11.5, 0, -6.6, 0);
  addCollider(-13.9, 0, -17.4, -9, 0.8, -16.4, { vm: m.darkSteel, mat: 'metal' }); for (let i = 0; i < 3; i++) deco(PL(0.8, 0.5), m.screen, [-13 + i * 1.3, 1.4, -17.38], null, null, false); prop('office', -11, 0, -15.4, PI);
  for (const z of [-6.8, -4, -1.2]) for (const x of [8, 10.4, 12.8]) { if (z === -4 && x === 8) continue; addCollider(x - 0.45, 0, z - 0.4, x + 0.45, 2.1, z + 0.4, { vm: m.darkSteel, mat: 'metal' }); }
  addCollider(8, 0, -17.6, 12, 0.6, -15, { vm: M('#5a2a3a', 0.8), mat: 'wood', pen: true }); addCollider(12.8, 0, -11.6, 13.9, 0.78, -9, { vm: m.wood, mat: 'wood', pen: true }); prop('office', 12, 0, -10.4, -PI / 2);
  addCollider(-3, 0, -13.4, 3, 0.9, -12.6, { vm: m.woodLight, mat: 'wood', pen: true });
  // compound: trees, cars, lamps
  for (const [x, z] of [[-24, -22], [-22, -8], [-25, 10], [-18, 22], [20, 18], [24, -10], [22, -24], [-8, 24], [10, 24], [-27, 0], [27, 6]]) { K.tree(x, z, 1.1); }
  for (const [x, z, ry] of [[-10, 12, 0.3], [9, 14, -0.2], [16, -24, PI / 2]]) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; LG.add(g); add(g, RB(1.9, 0.75, 4.4, 0.15, 2), M(['#1a1a1e', '#2a3040', '#4a4a50'][Math.floor(R() * 3)], 0.3, 0.6), [0, 0.6, 0]); add(g, RB(1.7, 0.55, 2.2, 0.12, 2), M('#0b0e12', 0.1, 0.8), [0, 1.15, -0.2]); deco(B(2, 0.06, 4.5), M('#ffffff', 0.9), [x, 1.48, z], [0, ry, 0], null, false); const c = Math.abs(Math.cos(ry)), s2 = Math.abs(Math.sin(ry)); const ex = c * 1 + s2 * 2.25, ez = s2 * 1 + c * 2.25; addCollider(x - ex, 0, z - ez, x + ex, 1.3, z + ez, { vis: false, mat: 'metal' }); }
  for (const [x, z] of [[-4, 6], [4, 6], [-4, 20], [4, 20], [20, 26], [-20, -26]]) { deco(C(0.06, 0.08, 4, 8), m.black, [x, 2, z]); deco(SP(0.2, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffe8b0', toneMapped: false }), [x, 4.1, z], null, null, false); pointLight('#ffe0a8', 5, 12, x, 3.8, z); }
  pointLight('#ffe8c0', 7, 11, 0, 3.2, -4); pointLight('#ffe0c0', 5, 9, -10, 3.2, -4); pointLight('#7fc8ff', 5, 9, -10, 3.2, -13); pointLight('#9fd8ff', 4, 9, 10, 3.2, -4); pointLight('#ffd0a0', 4, 9, 10, 3.2, -13); pointLight('#ffe8c0', 5, 10, 0, 3.2, -13);
  // doors
  new Door({ axis: 'x', x1: -1, z: 0.15, w: 1, h: 2.6 }); new Door({ axis: 'x', x1: 0, z: 0.15, w: 1, h: 2.6 }); new Door({ axis: 'z', x: -14.15, z1: -5, w: 1.4 });
  new Door({ axis: 'z', x: -5.85, z1: -4.6, w: 1.2 }); new Door({ axis: 'z', x: 5.85, z1: -4.6, w: 1.2 }); new Door({ axis: 'x', x1: -10.6, z: -8.15, w: 1.2 }); new Door({ axis: 'x', x1: -0.6, z: -8.15, w: 1.2 }); new Door({ axis: 'x', x1: 9.4, z: -8.15, w: 1.2 });
  new Door({ axis: 'z', x: -5.85, z1: -13.6, w: 1.2 }); new Door({ axis: 'z', x: 5.85, z1: -13.6, w: 1.2, name: 'suite' });
  // interactables
  K.addInteractable('console', V3(-11.6, 1.0, -16.9), 'CCTV bondho koro', K.pickupModel('console', V3(-11.6, 1.0, -16.9)));
  K.addInteractable('task', V3(8, 1.1, -4), 'Server theke data copy', K.pickupModel('console', V3(8, 1.1, -4)), { id: 'data', hold: 4, done: 'Data copy shesh' });
  for (const [kind, pos, label] of [['medkit', V3(-13.85, 1.2, -12), 'Medkit nao'], ['ammo', V3(-26, 0.2, 26), 'Ammo refill'], ['medkit', V3(13.85, 1.2, -6), 'Medkit nao']]) K.addInteractable(kind, pos, label, K.pickupModel(kind, pos, kind === 'medkit' ? (pos.x < 0 ? PI / 2 : -PI / 2) : 0));
  const cams = [{ pos: V3(-13.6, 3.3, -0.5), pitch: -0.35, at: V3(-2, 0, 10) }, { pos: V3(13.6, 3.3, -0.5), pitch: -0.35, at: V3(4, 0, 12) }, { pos: V3(5.5, 3.2, -8.6), pitch: -0.35, at: V3(-3, 0, -14) }, { pos: V3(-5.5, 3.2, -0.6), pitch: -0.35, at: V3(4, 0, -6) }];
  cams.forEach(c => c.yaw = K.camLook(c.pos, c.at)); K.buildCameras(cams);
  return {
    id: 'silent', bounds: { x0: -31, z0: -31, x1: 31, z1: 31 },
    spawns: { wall: { pos: V3(-27, 0, 27), yaw: -PI / 4, label: 'Compound wall', desc: 'Uttor-poshchim kone deyal tope dhukben. Pashchimer side door diye office.', risk: 'Risk: Low · Stealth' },
      gate: { pos: V3(24, 0, 28.6), yaw: PI * 0.9, label: 'Service gate', desc: 'Guard house er pasher service gate. Guard ke chupchap shamlate hobe.', risk: 'Risk: Medium' } },
    enemies: [
      { id: 'E1', pos: V3(27.8, 0, 25), yaw: PI, room: 'Compound' }, { id: 'E2', pos: V3(0, 0, 10), yaw: 0, room: 'Compound', patrol: [V3(-14, 0, 4), V3(14, 0, 4), V3(14, 0, 16), V3(-14, 0, 16)] },
      { id: 'E3', pos: V3(-20, 0, -14), yaw: PI / 2, room: 'Compound', patrol: [V3(-20, 0, -26), V3(-20, 0, 14)] }, { id: 'E4', pos: V3(20, 0, -12), yaw: -PI / 2, room: 'Compound', patrol: [V3(20, 0, -26), V3(20, 0, 12)] },
      { id: 'E5', pos: V3(-1.6, 0, -2), yaw: PI, room: 'Hall' }, { id: 'E6', pos: V3(-12, 0, -2.6), yaw: PI / 2, room: 'Office' }, { id: 'E7', pos: V3(-9, 0, -12), yaw: 0, room: 'Security' },
      { id: 'E8', pos: V3(9.2, 0, -2.6), yaw: -PI / 2, room: 'Server room' }, { id: 'E9', pos: V3(0, 0, -15), yaw: 0, room: 'Corridor', patrol: [V3(-4.6, 0, -15.4), V3(4.6, 0, -15.4)] },
      { id: 'E10', pos: V3(8, 0, -12), yaw: PI / 2, room: 'Ambassador suite' }, { id: 'E11', pos: V3(0, 0, -24), yaw: 0, room: 'Compound', patrol: [V3(-12, 0, -24), V3(12, 0, -24)] },
    ],
    hostages: [{ pos: V3(11.4, 0, -13.6), yaw: -PI / 2, vip: true, name: 'Ambassador', look: { shirt: '#ffffff', tie: '#1f2f5a', skin: '#c08a62', hair: '#9a9a9a', seed: 40 } }],
    exits: [V3(-27, 0, 27), V3(24, 0, 28.4)], rescued: p => Math.hypot(p.x + 27, p.z - 27) < 2.2 || Math.hypot(p.x - 24, p.z - 28.4) < 2.2,
    objectives: [{ type: 'stealth' }, { type: 'task', id: 'data', label: 'Server room theke data copy' }, { type: 'rescue', label: 'Ambassador ke extraction e pathao' }], bonus: [],
    timer: { kind: 'deadline', s: { recruit: 1200, veteran: 960, elite: 780 } }, deadlineFail: 'Bhor hoye geche, shift change.', executions: false, maxDead: 1,
    hawk: V3(0, 9, 46), hawkLine: ['Hawk on the hill south of the compound. Keep it quiet.', 'Hawk: Compound er dokkhine pahare achi. Chupchap thako.'],
    intro: { all: ['Silent Night. Nobody sees us, nobody hears us. If they raise the alarm, the Ambassador dies.', 'Rafi: Keu dekhbe na, keu shunbe na. Alarm bajle Ambassador ke mere felbe.'] },
    blueprint: { view: [-31, -31, 31, 31], markers: [[11.4, -13.6, 'VIP', 'h'], [8, -4, 'DATA', 'b'], [-11.6, -17, 'CCTV', 'b'], [27, 25, '', 'e'], [0, 10, '', 'e'], [-20, -10, '', 'e'], [20, -10, '', 'e'], [0, -2, '', 'e'], [-12, -3, '', 'e'], [-9, -12, '', 'e'], [9, -3, '', 'e'], [0, -15, '', 'e'], [8, -12, '', 'e'], [0, -24, '', 'e']] },
  };
}
