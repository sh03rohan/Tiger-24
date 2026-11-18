// Mission 08 — Operation Tiger's Roar: assault on the Black Crescent HQ, arrest the traitor
import { THREE, G, PI, M, B, RB, C, SP, PL, RX, add, canvasTex, rng, R, rr, V3 } from '../core.js';
import * as K from '../levelkit.js';
const { addCollider, wallX, wallZ, floor, ceiling, deco, pointLight, room, prop, Door } = K;

export const meta = { id: 'roar', no: '08', name: "Operation Tiger's Roar", art: 'hq', type: 'Full assault', loc: 'Black Crescent HQ · Pahar', time: '01:00 hrs · lal chand', diff: 'Elite',
  obj: ['HQ dokhol kore shob enemy shamlano', 'Bondi 4 jon journalist ke uddhar', 'Traitor Major Karim ke jibito arrest'], intel: 'Tiger 24 er bhitore traitor: Major Karim. Command bunker e lukiye ache. Take mara jabe na, arrest korte hobe.' };

export function build() {
  const moonSky = canvasTex(1024, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a0206'); gr.addColorStop(1, '#3a0e14'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#d03030'; g.beginPath(); g.arc(760, 110, 46, 0, 7); g.fill();
    const r = rng(8); g.fillStyle = '#06030a'; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 32) g.lineTo(x, h - 120 - r() * 160); g.lineTo(w, h); g.fill(); for (let i = 0; i < 200; i++) { g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(r() * w, r() * h * 0.5, 1, 1); } });
  K.beginLevel({ fill: 4, exposure: 1.4, skyEnv: true, grade: { sat: 0.95, contrast: 1.12, sh: [1.0, 0.94, 1.0], hi: [1.06, 0.98, 0.94] }, bg: '#0a0408', fog: '#180a10', fogD: 0.016, sun: 1.1, sunColor: '#ff8a8a', sunPos: [20, 25, 25], sunTarget: [0, 0, -8], shadowSize: 32, hemi: 0.45, hemiSky: '#6a3040', hemiGround: '#100808',
    alarmPos: [0, 4, -18], alarmBulbs: [[0, 4.2, -9.8], [-20, 4.6, 0], [20, 4.6, 0]], skyTex: moonSky, skyDist: 80 });
  const LG = K.LG, m = K.makeMaterials();
  const rockT = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#3a3634'; g.fillRect(0, 0, w, h); const r = rng(9); for (let i = 0; i < 5000; i++) { const c = 40 + r() * 50; g.fillStyle = `rgba(${c + 8},${c},${c - 4},.5)`; g.fillRect(r() * w, r() * h, 2, 2); } }, { repeat: [30, 30] });
  const fort = M('#ffffff', 0.9, 0, { map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#4a4440'; g.fillRect(0, 0, w, h); const r = rng(10); for (let y = 0; y < h; y += 40) for (let x = (y / 40 % 2) * 30; x < w + 60; x += 60) { const v = 60 + r() * 30; g.fillStyle = `rgb(${v + 6},${v},${v - 4})`; g.fillRect(x - 58, y + 2, 56, 36); } }, { repeat: [8, 2] }) });
  const redCloth = M('#7a1418', 0.85);
  room('Great hall', -6, -18, 6, -10, 'tile', 0.6); room('War room', 6, -18, 14, -10, 'carpet', 0.6); room('Prison', -14, -18, -6, -10, 'concrete', 0.4); room('Command bunker', -6, -28, 6, -18, 'concrete', 0.55);
  room('Armory', 6, -28, 14, -18, 'concrete', 0.5); room('Storage', -14, -28, -6, -18, 'concrete', 0.4); room('Courtyard', -26, -30, 26, 14, 'concrete', 0.45, false); room('Mountain', -100, -100, 100, 100, 'concrete', 0.4, false);
  floor(-60, -60, 60, 60, M('#ffffff', 0.95, 0, { map: rockT }), -0.005); floor(-14, -28, 14, -10, m.concrete);
  // fortress walls
  const fw = (x1, z1, x2, z2) => addCollider(x1, 0, z1, x2, 5, z2, { vm: fort, uv: 3 });
  fw(-26, 13.7, -3, 14.3); fw(3, 13.7, 26, 14.3); fw(-26, -30.3, 26, -29.7); fw(-26.3, -30, -25.7, 14); fw(25.7, -30, 26.3, -24); fw(25.7, -21, 26.3, 14);
  for (const [x, z] of [[-26, 14], [26, 14], [-26, -30], [26, -30], [-3, 14], [3, 14]]) { deco(B(2, 7, 2), fort, [x, 3.5, z]); }
  for (const x of [-18, -10, 10, 18]) deco(PL(1.6, 3), redCloth, [x, 3.2, 14.32], null, null, false);
  // main hall building
  wallX(-9.85, -14, 14, 4.5, fort, [{ a: -1, b: 1, y0: 0, y1: 2.8 }, { a: -11, b: -9, y0: 1.4, y1: 2.6 }, { a: 9, b: 11, y0: 1.4, y1: 2.6 }]);
  wallX(-28.15, -14, 14, 4.5, fort); wallZ(-14.15, -28, -10, 4.5, fort); wallZ(14.15, -28, -10, 4.5, fort, [{ a: -24, b: -22.6, y0: 0, y1: 2.3 }]);
  wallZ(-5.85, -18, -10, 4.2, m.concreteWall, [{ a: -14.6, b: -13.4, y0: 0, y1: 2.3 }]); wallZ(5.85, -18, -10, 4.2, m.concreteWall, [{ a: -14.6, b: -13.4, y0: 0, y1: 2.3 }]);
  wallX(-18.15, -14, 14, 4.2, m.concreteWall, [{ a: -10.6, b: -9.4, y0: 0, y1: 2.3 }, { a: -0.6, b: 0.6, y0: 0, y1: 2.3 }, { a: 9.4, b: 10.6, y0: 0, y1: 2.3 }]);
  wallZ(-5.85, -28, -18, 4.2, m.concreteWall); wallZ(5.85, -28, -18, 4.2, m.concreteWall);
  ceiling(-14, -28, 14, -10, 4.2, m.ceilingDark); deco(B(29, 0.6, 19), fort, [0, 4.6, -19]);
  for (const x of [-11, 11]) K.addGlass(x - 1, 1.4, -9.9, x + 1, 2.6, -9.8);
  // great hall
  for (const [x, z] of [[-3.5, -12.5], [3.5, -12.5], [-3.5, -16], [3.5, -16]]) { deco(C(0.35, 0.4, 4.2, 12), fort, [x, 2.1, z]); addCollider(x - 0.38, 0, z - 0.38, x + 0.38, 4.2, z + 0.38, { vis: false }); }
  deco(PL(3, 4), redCloth, [0, 2.6, -17.84], null, null, false); deco(PL(1.6, 1.6), M('#ffffff', 0.8, 0, { map: canvasTex(128, 128, g => { g.fillStyle = '#111'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#c4271b'; g.beginPath(); g.arc(64, 64, 44, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(82, 56, 40, 0, 7); g.fill(); }) }), [0, 2.8, -17.83], null, null, false);
  addCollider(-2, 0, -15, 2, 0.8, -14, { vm: m.wood, mat: 'wood', pen: true });
  // war room
  addCollider(8, 0, -15.6, 12.4, 0.85, -12.4, { vm: m.wood, mat: 'wood', pen: true }); deco(PL(4.2, 3), new THREE.MeshStandardMaterial({ color: '#0a1a14', emissive: '#3a8a5a', emissiveIntensity: 0.6 }), [10.2, 0.86, -14], [-PI / 2, 0, 0], null, false);
  for (let i = 0; i < 3; i++) deco(PL(1.2, 0.8), m.screen, [7 + i * 1.6 + 0.6, 2.2, -17.84], null, null, false);
  // prison
  for (const x of [-12, -9.4]) { for (let k = 0; k < 7; k++) deco(C(0.03, 0.03, 3, 6), m.darkSteel, [x + 1.2, 1.5, -17.6 + k * 0.5], null, null, false); }
  for (const z of [-17, -13]) addCollider(-13.9, 0, z, -13.2, 0.5, z + 2, { vm: M('#3a3a34', 0.9), mat: 'wood', pen: true });
  // bunker
  addCollider(-5.6, 0, -27.6, 5.6, 2.2, -26.6, { vm: m.darkSteel, mat: 'metal' }); for (let i = 0; i < 8; i++) deco(B(0.02, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: R() < 0.5 ? '#ff3020' : '#3cff8a', toneMapped: false }), [-5 + i * 1.4, 1.2 + R(), -26.58], null, null, false);
  addCollider(-2.2, 0, -23, 2.2, 0.8, -21.6, { vm: m.darkSteel, mat: 'metal' }); deco(PL(1.6, 0.9), m.screen, [0, 1.4, -22.2], [-0.3, 0, 0], null, false);
  // armory & storage
  for (let i = 0; i < 4; i++) addCollider(13.2, 0, -27.5 + i * 2, 13.9, 2, -26.2 + i * 2, { vm: m.darkSteel, mat: 'metal' });
  for (let i = 0; i < 6; i++) prop('box', rr(-13.5, -7), 0, rr(-27.5, -19));
  // courtyard
  const truck = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; LG.add(g); add(g, RB(2.2, 1.6, 2.4, 0.15, 2), M('#3a3e30', 0.7, 0.4), [0, 1.3, 2.2]); add(g, RB(2.3, 2.2, 4.6, 0.1, 1), canvasM2, [0, 1.6, -1.2]); for (const [wx, wz] of [[-1.05, 2.2], [1.05, 2.2], [-1.05, -2.4], [1.05, -2.4]]) add(g, C(0.45, 0.45, 0.3, 14), m.black, [wx, 0.45, wz], [0, 0, PI / 2]); const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry)); const ex = c * 1.2 + s * 3.6, ez = s * 1.2 + c * 3.6; addCollider(x - ex, 0, z - ez, x + ex, 2.6, z + ez, { vis: false, mat: 'metal' }); };
  const canvasM2 = M('#4a4a34', 0.9); truck(-14, 4, 0.3); truck(15, 2, -0.2);
  const sand = M('#6a5e44', 0.95); for (const [x, z, w, d] of [[0, 8, 4, 0.6], [-8, -2, 0.6, 3.5], [8, -4, 0.6, 3.5], [-18, -12, 3.5, 0.6], [18, -14, 3.5, 0.6], [0, -5, 3, 0.6], [-20, 8, 0.6, 3], [20, 9, 0.6, 3]]) addCollider(x - w / 2, 0, z - d / 2, x + w / 2, 1.0, z + d / 2, { vm: sand });
  for (const [x, z] of [[-22, -20], [22, -26], [-23, 10], [23, 11]]) { deco(C(0.6, 0.6, 1.0, 12), m.darkSteel, [x, 0.5, z]); addCollider(x - 0.6, 0, z - 0.6, x + 0.6, 1, z + 0.6, { vis: false, mat: 'metal' }); }
  for (const [x, z] of [[-24, -27], [24, -27], [-24, 11], [24, 11], [0, 12], [-14, -8.8], [14, -8.8]]) { deco(C(0.08, 0.1, 4, 8), m.black, [x, 2, z]); deco(SP(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffb080', toneMapped: false }), [x, 4.1, z], null, null, false); pointLight('#ffa070', 5, 14, x, 3.8, z); }
  pointLight('#ffd0a0', 6, 11, 0, 3.6, -14); pointLight('#a0ffc0', 5, 9, 10, 3.4, -14); pointLight('#ffa0a0', 3, 9, -10, 3.4, -14); pointLight('#ff6040', 5, 10, 0, 3.4, -23); pointLight('#ffe0c0', 3, 9, 10, 3.2, -23); pointLight('#ffe0c0', 2.5, 9, -10, 3.2, -23);
  // outer world limits
  for (const [x1, z1, x2, z2] of [[-34, 13.7, -26, 14.3], [26, 13.7, 34, 14.3], [-34, 30, 34, 30.4], [-34, 14, -33.6, 30], [33.6, 14, 34, 30], [26, -32, 34, -31.6], [33.6, -32, 34, 14]]) addCollider(x1, 0, z1, x2, 6, z2, { vis: false });
  for (let i = 0; i < 26; i++) { const x = rr(-32, 32), z = rr(17, 29); if (Math.abs(x) < 4) continue; deco(SP(rr(1, 2.6), 7, 5), M('#2a2624', 0.95), [x, 0.6, z], [R(), R(), 0], [1.3, 0.7, 1.1]); }
  // doors
  new Door({ axis: 'x', x1: -1, z: -9.85, w: 1, h: 2.8 }); new Door({ axis: 'x', x1: 0, z: -9.85, w: 1, h: 2.8 }); new Door({ axis: 'z', x: 14.15, z1: -24, w: 1.4 });
  new Door({ axis: 'z', x: -5.85, z1: -14.6, w: 1.2 }); new Door({ axis: 'z', x: 5.85, z1: -14.6, w: 1.2 }); new Door({ axis: 'x', x1: -10.6, z: -18.15, w: 1.2 }); new Door({ axis: 'x', x1: -0.6, z: -18.15, w: 1.2, name: 'bunker' }); new Door({ axis: 'x', x1: 9.4, z: -18.15, w: 1.2 });
  // interactables
  K.addInteractable('task', V3(0, 1.0, -22.6), 'Black Crescent er data mucho', K.pickupModel('console', V3(0, 1.0, -22.6)), { id: 'wipe', hold: 3, done: 'Server wipe shesh' });
  for (const [kind, pos, label] of [['ammo', V3(12.5, 0.2, -20), 'Ammo refill'], ['medkit', V3(13.85, 1.2, -25), 'Medkit nao'], ['ammo', V3(1.8, 0.2, 19), 'Ammo refill'], ['medkit', V3(-5.65, 1.2, -12), 'Medkit nao'], ['ammo', V3(29, 0.2, -21), 'Ammo refill']]) K.addInteractable(kind, pos, label, K.pickupModel(kind, pos, kind === 'medkit' ? (pos.x < 0 ? PI / 2 : -PI / 2) : 0));
  K.addInteractable('console', V3(8.4, 1.05, -12.6), 'HQ CCTV bondho koro', K.pickupModel('console', V3(8.4, 1.05, -12.6)));
  const cams = [{ pos: V3(-25, 4.6, 13.4), pitch: -0.35, at: V3(-6, 0, 4) }, { pos: V3(25, 4.6, 13.4), pitch: -0.35, at: V3(6, 0, 4) }, { pos: V3(0, 4, -10.4), pitch: -0.3, at: V3(0, 0, 6) }];
  cams.forEach(c => c.yaw = K.camLook(c.pos, c.at)); K.buildCameras(cams);
  return {
    id: 'roar', bounds: { x0: -34, z0: -32, x1: 34, z1: 30 },
    spawns: { gate: { pos: V3(0, 0, 21), yaw: 0, label: 'Main gate', desc: 'Shoja main gate diye courtyard e. Shobcheye beshi enemy, shobcheye druto.', risk: 'Risk: Extreme' },
      cliff: { pos: V3(30, 0, -22.5), yaw: PI / 2, label: 'Cliff path', desc: 'Paharer pichoner rasta diye purbo deyaler fatol. Armory er pashe.', risk: 'Risk: High · Flank' } },
    enemies: [
      { id: 'E1', pos: V3(-2.4, 0, 10.6), yaw: 0, room: 'Courtyard' }, { id: 'E2', pos: V3(2.4, 0, 10.6), yaw: 0, room: 'Courtyard', heavy: true },
      { id: 'E3', pos: V3(-10, 0, 2), yaw: 0, room: 'Courtyard', patrol: [V3(-20, 0, 4), V3(-4, 0, 4), V3(-4, 0, -6), V3(-20, 0, -6)] }, { id: 'E4', pos: V3(10, 0, 0), yaw: 0, room: 'Courtyard', patrol: [V3(20, 0, -6), V3(4, 0, -6), V3(4, 0, 6), V3(20, 0, 6)] },
      { id: 'E5', pos: V3(-18, 0, -14), yaw: 0, room: 'Courtyard' }, { id: 'E6', pos: V3(18, 0, -16), yaw: 0, room: 'Courtyard', heavy: true }, { id: 'E7', pos: V3(22, 0, -22.6), yaw: -PI / 2, room: 'Courtyard' },
      { id: 'E8', pos: V3(-2, 0, -12), yaw: 0, room: 'Great hall' }, { id: 'E9', pos: V3(2.4, 0, -16.6), yaw: 0, room: 'Great hall' },
      { id: 'E10', pos: V3(-9, 0, -12), yaw: 0, room: 'Prison' }, { id: 'E11', pos: V3(7.4, 0, -11.4), yaw: PI, room: 'War room' }, { id: 'E12', pos: V3(12.8, 0, -16.6), yaw: -PI / 2, room: 'War room', heavy: true },
      { id: 'E13', pos: V3(9, 0, -24), yaw: 0, room: 'Armory' }, { id: 'E14', pos: V3(-3.5, 0, -20), yaw: 0, room: 'Command bunker' },
      { id: 'LEADER', pos: V3(11, 0, -11.4), yaw: PI, room: 'War room', leader: true, name: 'Black Crescent chief' },
      { id: 'TRAITOR', pos: V3(3, 0, -24.6), yaw: 0, room: 'Command bunker', traitor: true, name: 'Major Karim', officer: { head: 'cap', camo: 'night', vest: '#1f2123', skin: '#9a6a48', scale: 1.02, mask: false } },
    ],
    hostages: [{ pos: V3(-12.6, 0, -16.4), yaw: PI / 2 }, { pos: V3(-12.6, 0, -15), yaw: PI / 2 }, { pos: V3(-12.6, 0, -11.8), yaw: PI / 2 }, { pos: V3(12.6, 0, -11.2), yaw: -PI / 2 }],
    exits: [V3(0, 0, 18), V3(29, 0, -22.5)], rescued: p => p.z > 17 || p.x > 28,
    objectives: [{ type: 'arrest', target: 'TRAITOR', label: 'Major Karim ke jibito arrest', sub: 'Flashbang/taser diye stun koro, V chaple surrender' }, { type: 'rescue', label: 'Journalist der uddhar koro' }, { type: 'task', id: 'wipe', label: 'Command bunker e data wipe' }, { type: 'neutralize' }],
    bonus: ['leader', 'stealth'], timer: { kind: 'deadline', s: { recruit: 1320, veteran: 1080, elite: 900 } }, deadlineFail: 'Black Crescent er reinforcement pouche geche.', executions: true, maxDead: 2, shieldRetreat: V3(12.8, 0, -16.8),
    hawk: V3(-30, 12, 28), hawkLine: ['Hawk on the ridge. The whole courtyard is mine. Do not touch Karim, he is yours.', 'Hawk: Pahare achi, courtyard amar nojore. Karim ke chhuo na, o tomar.'],
    intro: { all: ['This is it. Black Crescent HQ. Karim is inside, and I want him alive. For every Tiger who trusted him.', 'Rafi: Eitai shesh. Black Crescent HQ. Karim bhitore ache, jibito chai. Je Tiger ra take bishwash korechilo, tader jonno.'] },
    winLine: ['Karim in custody, Black Crescent is finished. Tiger 24, it has been an honor.', 'Rafi: Karim grephtar, Black Crescent shesh. Tiger 24, tomader shathe kaj kora shonmaner.'],
    blueprint: { view: [-34, -32, 34, 26], markers: [[3, -24.6, 'KARIM', 'e'], [11, -11.4, 'CHIEF', 'e'], [-12.6, -14.5, '3', 'h'], [12.6, -11.2, '1', 'h'], [0, -22.6, 'DATA', 'b'], [-2, 10, '', 'e'], [2, 10, '', 'e'], [-12, 0, '', 'e'], [12, 0, '', 'e'], [-18, -14, '', 'e'], [18, -16, '', 'e'], [0, -14, '', 'e'], [9, -24, '', 'e']] },
  };
}
