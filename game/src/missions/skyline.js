// Mission 04 — Operation Skyline: skyscraper floor 58, three bombs, hostages
import { THREE, G, PI, M, B, RB, C, SP, PL, RX, add, canvasTex, rng, R, rr, V3 } from '../core.js';
import * as K from '../levelkit.js';
const { addCollider, wallX, wallZ, floor, ceiling, deco, pointLight, room, prop, Door } = K;

export const meta = { id: 'skyline', no: '04', name: 'Operation Skyline', art: 'sky', type: 'Bomb defuse', loc: 'Meridian Tower · tola 58', time: '21:00 hrs', diff: 'Hard',
  obj: ['Floor e lukano 3 ta bomb defuse', '6 jon office staff ke stairwell diye ber kora', 'Gunman der shamlano'], intel: 'Lift bondho. Reception desk e bomb er wire order er note ache. Bomb timer shuru hoye geche.' };

export function build() {
  K.beginLevel({ grade: { sat: 1.0, contrast: 1.08, sh: [0.92, 0.98, 1.1], hi: [1.04, 1.0, 0.96] }, bg: '#03050b', fog: '#050812', fogD: 0.006, sun: 0.6, sunColor: '#8aa0d8', sunPos: [30, 40, 20], sunTarget: [0, 0, 0], shadowSize: 24, hemi: 0.5,
    alarmPos: [0, 3, 0], alarmBulbs: [[0, 3.1, 3.2], [-15, 3.1, -15], [15, 3.1, 15]], skyTop: '#02040a', skyBottom: '#1a2236', city: true, skyDist: 55, alarmLight: true });
  const LG = K.LG, m = K.makeMaterials();
  // ground far below
  const cityGround = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#05070c'; g.fillRect(0, 0, w, h); const r = rng(4); for (let i = 0; i < 1600; i++) { g.fillStyle = r() < 0.6 ? 'rgba(255,200,120,.8)' : 'rgba(160,200,255,.7)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } g.strokeStyle = 'rgba(255,190,100,.35)'; g.lineWidth = 3; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(0, r() * h); g.lineTo(w, r() * h); g.stroke(); g.beginPath(); g.moveTo(r() * w, 0); g.lineTo(r() * w, h); g.stroke(); } }, { repeat: [6, 6] });
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshBasicMaterial({ map: cityGround, fog: false })); gp.rotation.x = -PI / 2; gp.position.y = -170; LG.add(gp);
  for (let i = 0; i < 18; i++) { const a = i / 18 * PI * 2, d = 70 + R() * 60, h = 120 + R() * 140; const b = new THREE.Mesh(new THREE.BoxGeometry(18 + R() * 14, h, 18 + R() * 14), new THREE.MeshStandardMaterial({ color: '#0b0e16', emissive: '#1a2034', emissiveIntensity: 0.4, roughness: 0.6 })); b.position.set(Math.cos(a) * d, -170 + h / 2, Math.sin(a) * d); LG.add(b); }
  room('Server room', 12, -20, 20, -12, 'tile', 0.6); room('Conference', -12, 8, -2, 16, 'carpet', 0.85); room('Executive office', 12, 10, 20, 20, 'carpet', 0.75); room('Kitchen', -20, 10, -14, 20, 'tile', 0.8);
  room('Stairwell', -20, -20, -15, -15, 'concrete', 0.6); room('Office floor', -20, -20, 20, 20, 'carpet', 0.85);
  floor(-20, -20, 20, 20, m.carpet); m.carpet.map.repeat.set(10, 10); ceiling(-20, -20, 20, 20, 3.2, m.ceiling);
  for (let x = -16; x <= 16; x += 8) for (let z = -16; z <= 16; z += 8) deco(B(2.4, 0.05, 0.6), m.panel, [x, 3.17, z], null, null, false);
  // curtain wall
  const sill = M('#2a2e34', 0.6, 0.4);
  const facade = (axis, fixed, from, to, skip = []) => { for (let a = from; a < to - 0.01; a += 2.5) { const b2 = Math.min(to, a + 2.5); const skipIt = skip.some(([s1, s2]) => a >= s1 - 0.01 && b2 <= s2 + 0.01);
      if (axis === 'x') { addCollider(a, 0, fixed - 0.1, b2, 0.3, fixed + 0.1, { vm: sill }); if (!skipIt) K.addGlass(a + 0.04, 0.3, fixed - 0.04, b2 - 0.04, 3.0, fixed + 0.04); deco(B(0.08, 3.2, 0.14), m.black, [a, 1.6, fixed], null, null, false); }
      else { addCollider(fixed - 0.1, 0, a, fixed + 0.1, 0.3, b2, { vm: sill }); if (!skipIt) K.addGlass(fixed - 0.04, 0.3, a + 0.04, fixed + 0.04, 3.0, b2 - 0.04); deco(B(0.14, 3.2, 0.08), m.black, [fixed, 1.6, a], null, null, false); } }
    if (axis === 'x') addCollider(from, 3.0, fixed - 0.1, to, 3.2, fixed + 0.1, { vm: sill }); else addCollider(fixed - 0.1, 3.0, from, fixed + 0.1, 3.2, to, { vm: sill }); };
  facade('x', -20, -15, 20); facade('x', 20, -20, 20); facade('z', -20, -15, 20); facade('z', 20, -20, 20, [[0, 2.5]]);
  for (const [x1, z1, x2, z2] of [[-21, -21, 21, -20.6], [-21, 20.6, 21, 21], [-21, -21, -20.6, 21], [20.6, -21, 21, 21]]) addCollider(x1, 0, z1, x2, 3.2, z2, { vis: false });
  // stairwell (NW)
  wallX(-15.15, -20, -15, 3.2, m.concreteWall, []); wallZ(-15.15, -20, -15, 3.2, m.concreteWall, [{ a: -18.6, b: -17.4, y0: 0, y1: 2.3 }]); addCollider(-20, 0, -20.3, -15, 3.2, -20, { vm: m.concreteWall }); addCollider(-20.3, 0, -20, -20, 3.2, -15, { vm: m.concreteWall });
  deco(PL(1.2, 0.4), new THREE.MeshBasicMaterial({ color: '#2aff6a', toneMapped: false }), [-15.0, 2.6, -18], [0, PI / 2, 0], null, false);
  // core
  addCollider(-3, 0, -3, 3, 3.2, 3, { vm: m.concreteWall, uv: 2 }); for (const [x, z, ry] of [[-1.2, 3.01, 0], [1.2, 3.01, 0], [-1.2, -3.01, PI], [1.2, -3.01, PI]]) deco(PL(1.1, 2.3), m.steel, [x, 1.15, z], [0, ry, 0], null, false);
  // server room
  wallX(-11.85, 12, 20, 3.2, m.drywall); wallZ(11.85, -20, -12, 3.2, m.drywall, [{ a: -16.6, b: -15.4, y0: 0, y1: 2.3 }]);
  for (const x of [14, 16.4, 18.6]) { addCollider(x - 0.4, 0, -19.4, x + 0.4, 2.1, -14.6, { vm: m.darkSteel, mat: 'metal' }); for (let z = -19; z < -14.8; z += 0.4) deco(B(0.02, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: R() < 0.5 ? '#3cff8a' : '#4fd1c5', toneMapped: false }), [x - 0.41, 0.5 + R() * 1.4, z], null, null, false); }
  // conference (glass)
  for (const [x1, z1, x2, z2] of [[-12, 7.96, -7.6, 8.04], [-6.4, 7.96, -2, 8.04], [-12, 15.96, -2, 16.04]]) K.addGlass(x1, 0, z1, x2, 2.6, z2); for (const [x1, z1, x2, z2] of [[-12.04, 8, -11.96, 16], [-2.04, 8, -1.96, 16]]) K.addGlass(x1, 0, z1, x2, 2.6, z2);
  addCollider(-12, 2.6, 7.9, -2, 3.2, 8.1, { vm: m.drywall }); addCollider(-12, 2.6, 15.9, -2, 3.2, 16.1, { vm: m.drywall });
  addCollider(-10, 0, 10.8, -4, 0.75, 13.2, { vm: m.wood, mat: 'wood', pen: true }); for (let i = 0; i < 4; i++) { prop('office', -9.2 + i * 1.6, 0, 10.2, PI); prop('office', -9.2 + i * 1.6, 0, 13.8, 0); }
  // executive office
  wallX(9.85, 12, 20, 3.2, m.office); wallZ(11.85, 10, 20, 3.2, m.office, [{ a: 12.4, b: 13.6, y0: 0, y1: 2.3 }]);
  addCollider(15, 0, 15.6, 18, 0.78, 16.8, { vm: m.wood, mat: 'wood', pen: true }); addCollider(19.4, 0, 10.5, 19.9, 2.2, 14, { vm: m.wood, mat: 'wood', pen: true }); prop('office', 16.5, 0, 17.6, PI);
  // kitchen
  wallX(9.85, -20, -14, 3.2, m.drywall, [{ a: -16.6, b: -15.4, y0: 0, y1: 2.3 }]); wallZ(-13.85, 10, 20, 3.2, m.drywall);
  addCollider(-19.9, 0, 11, -19.2, 0.9, 19, { vm: m.white, mat: 'wood', pen: true }); addCollider(-17.6, 0, 14, -15.8, 0.8, 16, { vm: m.woodLight, mat: 'wood', pen: true }); addCollider(-19.9, 0, 19.2, -18.9, 1.9, 19.9, { vm: m.steel, mat: 'metal' });
  // reception desk
  addCollider(-2.4, 0, 5, 2.4, 1.05, 5.8, { vm: m.woodLight, mat: 'wood', pen: true }); deco(PL(3.4, 0.6), M('#ffffff', 0.4, 0.3, { map: canvasTex(512, 96, (g, w, h) => { g.fillStyle = '#1a1e26'; g.fillRect(0, 0, w, h); g.fillStyle = '#c9d6ff'; g.font = '700 54px "Saira Condensed", sans-serif'; g.textAlign = 'center'; g.fillText('MERIDIAN · 58', w / 2, 66); }) }), [0, 2.4, 3.02], null, null, false);
  // cubicles
  const part = M('#5a6470', 0.8);
  const cubes = (x0, z0, nx, nz) => { for (let i = 0; i <= nx; i++) addCollider(x0 + i * 3 - 0.04, 0, z0, x0 + i * 3 + 0.04, 1.35, z0 + nz * 3 - 1.2, { vm: part, mat: 'wood', pen: true }); for (let j = 0; j < nz; j++) addCollider(x0, 0, z0 + j * 3 - 0.04, x0 + nx * 3, 1.35, z0 + j * 3 + 0.04, { vm: part, mat: 'wood', pen: true });
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { deco(B(1.4, 0.04, 0.7), m.woodLight, [x0 + i * 3 + 1.5, 0.74, z0 + j * 3 + 0.6]); deco(RB(0.5, 0.32, 0.04, 0.01), m.black, [x0 + i * 3 + 1.5, 1.0, z0 + j * 3 + 0.4]); if (R() < 0.5) prop('office', x0 + i * 3 + 1.5, 0, z0 + j * 3 + 1.4, PI + rr(-0.5, 0.5)); } };
  cubes(-13, -13, 3, 3); cubes(4, -9, 2, 2); cubes(4, 0.5, 2, 2);
  for (const [x, z] of [[-6, 4], [7, 7], [-12, -2], [8, -11]]) prop('bin', x, 0, z);
  // lights
  pointLight('#fff4e0', 8, 14, -10, 3, -8); pointLight('#fff4e0', 8, 14, 8, 3, -4); pointLight('#fff4e0', 8, 14, 0, 3, 8); pointLight('#ffe8c8', 6, 10, -7, 2.8, 12); pointLight('#9fd8ff', 6, 10, 16, 2.8, -16);
  pointLight('#ffdcae', 6, 10, 16, 2.8, 15); pointLight('#fff', 5, 10, -17, 2.8, 15); pointLight('#ccffd8', 4, 8, -17.5, 2.8, -17.5); pointLight('#fff4e0', 7, 13, 12, 3, 4);
  for (const z of [-12, -4, 6]) K.shaft(V3(21, 3.6, z), V3(-1, -0.45, 0.15), 10, 0.9, 2.4, '#8fa6e0', 0.05);
  for (let x = -16; x <= 16; x += 8) K.shaft(V3(x, 3.15, -8), V3(0, -1, 0), 3.1, 0.6, 1.6, '#fff0d0', 0.035);
  // doors
  new Door({ axis: 'z', x: -15.15, z1: -18.6, w: 1.2, name: 'stairs' }); new Door({ axis: 'z', x: 11.85, z1: -16.6, w: 1.2, name: 'server' }); new Door({ axis: 'z', x: 11.85, z1: 12.4, w: 1.2, name: 'exec' });
  new Door({ axis: 'x', x1: -16.6, z: 9.85, w: 1.2 }); new Door({ axis: 'x', x1: -7.6, z: 8, w: 1.2, glassDoor: true });
  // bombs & items
  const bombsAt = [[V3(17.2, 0.25, -13.2), 'Server room bomb', 'Server'], [V3(-7, 0.9, 12), 'Conference bomb', 'Conference'], [V3(16.4, 0.25, 14.2), 'Executive bomb', 'Executive']];
  for (const [p, label, name] of bombsAt) { const bm = K.bombModel(p); K.addInteractable('bomb', p, label, bm.g, { disp: bm.disp, name }); }
  K.addInteractable('intel', V3(1.2, 1.1, 5.4), 'Bomb er wire note pora', K.pickupModel('intel', V3(1.2, 1.1, 5.4)));
  for (const [kind, pos, label] of [['ammo', V3(-18.4, 0.2, -16.4), 'Ammo refill'], ['medkit', V3(-19.85, 1.3, 13), 'Medkit nao'], ['medkit', V3(12.0, 1.2, -13), 'Medkit nao'], ['ammo', V3(18.2, 0.2, 3.6), 'Ammo refill']]) K.addInteractable(kind, pos, label, K.pickupModel(kind, pos, kind === 'medkit' ? (pos.x < 0 ? PI / 2 : -PI / 2) : 0));
  K.addInteractable('console', V3(1.8, 1.25, 5.4), 'Building CCTV bondho koro', K.pickupModel('console', V3(1.8, 1.25, 5.4)));
  K.buildCameras([{ pos: V3(-14.6, 2.9, -14.6), yaw: K.camLook(V3(-14.6, 0, -14.6), V3(-6, 0, -6)), pitch: -0.3 }, { pos: V3(11.6, 2.9, 2), yaw: K.camLook(V3(11.6, 0, 2), V3(2, 0, -6)), pitch: -0.3 }]);
  return {
    id: 'skyline', bounds: { x0: -21, z0: -21, x1: 21, z1: 21 },
    spawns: { stairs: { pos: V3(-17.6, 0, -18), yaw: -PI / 2, label: 'Stairwell', desc: 'Siri diye 58 tolay uthe stairwell er door diye dhukben.', risk: 'Risk: Medium' },
      window: { pos: V3(18.6, 0, 1.25), yaw: PI / 2, rappel: 2.9, label: 'Window rappel', desc: 'Chhad theke rope e neme purbo diker bhanga janala diye dhukben. Executive office kache.', risk: 'Risk: High · Surprise', surprise: ['Office floor'] } },
    enemies: [
      { id: 'E1', pos: V3(-8, 0, -6), yaw: 0, room: 'Office floor', patrol: [V3(-14.5, 0, -14.5), V3(-1.5, 0, -14.5), V3(-1.5, 0, -4.5), V3(-14.5, 0, -4.5)] }, { id: 'E2', pos: V3(15, 0, -15), yaw: -PI / 2, room: 'Server room' },
      { id: 'E3', pos: V3(-7, 0, 9.4), yaw: PI, room: 'Conference' }, { id: 'E4', pos: V3(0, 0, 7.4), yaw: 0, room: 'Office floor' }, { id: 'E5', pos: V3(10, 0, 8), yaw: PI / 2, room: 'Office floor', patrol: [V3(10, 0, -11), V3(10, 0, 8.5), V3(3, 0, 8.5)] },
      { id: 'E6', pos: V3(-17, 0, 12.4), yaw: PI, room: 'Kitchen' }, { id: 'E7', pos: V3(5, 0, -16), yaw: 0, room: 'Office floor' }, { id: 'E8', pos: V3(-4, 0, 18), yaw: PI / 2, room: 'Office floor', patrol: [V3(-12, 0, 18), V3(10, 0, 18)] },
      { id: 'E9', pos: V3(14, 0, 12), yaw: -PI / 2, room: 'Executive office' }, { id: 'LEADER', pos: V3(17.6, 0, 12), yaw: PI, room: 'Executive office', leader: true },
    ],
    hostages: [{ pos: V3(-6, 0, -1.6), yaw: 0 }, { pos: V3(-4.8, 0, -1.4), yaw: 0.3 }, { pos: V3(-7.2, 0, -1.8), yaw: -0.3 }, { pos: V3(-16.6, 0, 17.6), yaw: PI }, { pos: V3(-15.4, 0, 17.8), yaw: PI }, { pos: V3(17, 0, 18.6), yaw: PI }],
    exits: [V3(-17.6, 0, -17.6)], rescued: p => p.x < -15.4 && p.z < -15.4,
    objectives: [{ type: 'defuse', intelHint: 'Reception desk e wire note ache' }, { type: 'rescue', label: 'Staff ke stairwell e pathao' }, { type: 'neutralize' }], bonus: ['leader', 'stealth'],
    timer: { kind: 'bomb', s: { recruit: 900, veteran: 720, elite: 540 } }, executions: true, maxDead: 3, shieldRetreat: V3(18.6, 0, 18.6),
    hawk: V3(46, 2, 2), hawkLine: ['Hawk on the next tower, east side. I see through the glass.', 'Hawk: Pasher tower e achi, purbo dik theke kach diye dekhte pacchi.'],
    intro: { all: ['Three bombs on this floor and the clock is running. Find the wire note at reception.', 'Rafi: Ei floor e 3 ta bomb, timer cholche. Reception e wire er note khojo.'] },
    blueprint: { view: [-21, -21, 21, 21], markers: [[17, -13, 'BOMB', 'b'], [-7, 12, 'BOMB', 'b'], [16.4, 14, 'BOMB', 'b'], [-6, -1.6, '3', 'h'], [-16, 17.6, '2', 'h'], [17, 18.6, '1', 'h'], [1.2, 5.4, 'INTEL', 'b'], [-8, -8, '', 'e'], [15, -15, '', 'e'], [-7, 9.4, '', 'e'], [0, 7, '', 'e'], [10, 0, '', 'e'], [-17, 12, '', 'e'], [5, -16, '', 'e'], [0, 18, '', 'e'], [15, 12, '', 'e']] },
  };
}
