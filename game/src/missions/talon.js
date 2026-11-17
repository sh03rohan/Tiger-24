// Mission 03 — Operation Talon: jungle base raid, recover the drone chip, extract by helicopter
import { THREE, G, PI, M, B, RB, C, SP, PL, RX, add, canvasTex, rng, R, rr, V3 } from '../core.js';
import * as K from '../levelkit.js';
const { addCollider, wallX, wallZ, floor, ceiling, deco, pointLight, room, prop, Door } = K;

export const meta = { id: 'talon', no: '03', name: 'Operation Talon', art: 'jungle', type: 'Raid · recovery', loc: 'Black Crescent forward base · Jungle', time: '18:20 hrs · godhuli', diff: 'Hard',
  obj: ['Lab theke chori kora drone chip uddhar', 'Base er enemy der shamlano', 'LZ te giye helicopter e extraction'], intel: 'Base e anti-air gun ache, tai heli 40 meter dure LZ te. Pashchim dike fence bhanga, chupchap dhokar rasta.' };

let heli = null;
export function build() {
  K.beginLevel({ skyEnv: true, grade: { sat: 1.1, contrast: 1.08, sh: [0.94, 1.0, 1.04], hi: [1.08, 1.02, 0.9] }, dustColor: '#ffe0b0', bg: '#2a1810', fog: '#3a2618', fogD: 0.013, sun: 2.4, sunColor: '#ffb070', sunPos: [-40, 14, -10], sunTarget: [0, 0, -8], shadowSize: 34, shadowFar: 120, hemi: 0.75, hemiSky: '#ffb488', hemiGround: '#2a2a14', envI: 0.35,
    alarmPos: [0, 7, -14], alarmBulbs: [[-12, 3.2, -19.8], [11, 3.4, -17.8]], skyTop: '#3a1a10', skyBottom: '#d07a40', city: false, skyDist: 90 });
  const LG = K.LG, m = K.makeMaterials();
  const grass = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#3a4422'; g.fillRect(0, 0, w, h); const r = rng(5); for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(${40 + r() * 60},${50 + r() * 70},${20 + r() * 20},.5)`; g.fillRect(r() * w, r() * h, 1, 2 + r() * 3); } for (let i = 0; i < 20; i++) { g.fillStyle = 'rgba(90,70,40,.35)'; g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 30, 6 + r() * 16, r() * 3, 0, 7); g.fill(); } }, { repeat: [40, 40] });
  const dirt = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#5a4a32'; g.fillRect(0, 0, w, h); const r = rng(6); for (let i = 0; i < 4000; i++) { const c = 60 + r() * 60; g.fillStyle = `rgba(${c + 20},${c},${c - 20},.35)`; g.fillRect(r() * w, r() * h, 2, 2); } }, { repeat: [10, 10] });
  const plank = M('#5a3e22', 0.85, 0.05), metalHut = M('#5a6048', 0.6, 0.4), sand = M('#8a7a52', 0.95), canvasM = M('#4a5038', 0.9);
  room('Lab', 6, -28, 16, -18, 'tile', 0.75); room('Barracks', -16, -28, -8, -20, 'wood', 0.5); room('Base', -20, -32, 20, 8, 'dirt', 0.75, false); room('Jungle', -60, -60, 60, 60, 'grass', 0.65, false);
  floor(-60, -60, 60, 60, M('#ffffff', 0.95, 0, { map: grass }), -0.005); floor(-20, -32, 20, 8, M('#ffffff', 0.95, 0, { map: dirt }));
  deco(PL(5, 26), M('#ffffff', 0.95, 0, { map: dirt }), [0, 0.002, 21], [-PI / 2, 0, 0], null, false);
  // palisade fence
  const fence = (x1, z1, x2, z2) => { if (z1 === z2) addCollider(Math.min(x1, x2), 0, z1 - 0.15, Math.max(x1, x2), 2.6, z1 + 0.15, { vm: plank, mat: 'wood', pen: true, uv: 1 }); else addCollider(x1 - 0.15, 0, Math.min(z1, z2), x1 + 0.15, 2.6, Math.max(z1, z2), { vm: plank, mat: 'wood', pen: true, uv: 1 }); };
  fence(-20, 8, -2.5, 8); fence(2.5, 8, 20, 8); fence(-20, -32, 20, -32); fence(20, -32, 20, 8); fence(-20, -32, -20, -14); fence(-20, -11, -20, 8);
  for (const [x, z] of [[-2.5, 8], [2.5, 8]]) deco(B(0.5, 3.6, 0.5), plank, [x, 1.8, z]);
  // barracks
  wallX(-28.15, -16, -8, 3, plank, [], { mat: 'wood', pen: true }); wallX(-19.85, -16, -8, 3, plank, [{ a: -12.6, b: -11.4, y0: 0, y1: 2.2 }, { a: -15, b: -14, y0: 1.2, y1: 2 }], { mat: 'wood', pen: true });
  wallZ(-16.15, -28, -20, 3, plank, [], { mat: 'wood', pen: true }); wallZ(-7.85, -28, -20, 3, plank, [{ a: -25, b: -24, y0: 1.2, y1: 2 }], { mat: 'wood', pen: true });
  deco(B(8.8, 0.2, 9), metalHut, [-12, 3.1, -24], [0, 0, 0]); for (const z of [-27, -25.6]) for (const x of [-15, -9.6]) addCollider(x - 0.5, 0, z - 0.4, x + 0.5, 0.6, z + 0.4, { vm: m.darkSteel, mat: 'metal' });
  // lab
  wallX(-28.15, 6, 16, 3.4, m.concreteWall); wallX(-17.85, 6, 16, 3.4, m.concreteWall, [{ a: 10.4, b: 11.6, y0: 0, y1: 2.3 }, { a: 7, b: 9, y0: 1.2, y1: 2.2 }]);
  wallZ(5.85, -28, -18, 3.4, m.concreteWall, [{ a: -23.6, b: -22.4, y0: 0, y1: 2.3 }]); wallZ(16.15, -28, -18, 3.4, m.concreteWall);
  ceiling(6, -28, 16, -18, 3.4, m.ceilingDark); deco(B(10.6, 0.3, 10.6), m.concreteWall, [11, 3.55, -23]); deco(B(2.4, 0.06, 0.5), m.fluo, [11, 3.35, -23], null, null, false);
  K.addGlass(7, 1.2, -17.92, 9, 2.2, -17.78);
  addCollider(12, 0, -26, 14.6, 0.85, -24.4, { vm: m.white, mat: 'metal' }); addCollider(6.4, 0, -27.6, 8.4, 1.9, -26.4, { vm: m.darkSteel, mat: 'metal' }); deco(PL(1.6, 1), m.screen, [7.4, 1.3, -26.38], null, null, false);
  addCollider(14.8, 0, -21, 15.9, 2.0, -18.6, { vm: m.darkSteel, mat: 'metal' });
  pointLight('#e8fff4', 8, 10, 11, 3, -23); pointLight('#ffb070', 5, 10, -12, 2.8, -24);
  // comms tent, AA gun, sandbags
  for (const [x, z] of [[-6, -14], [0, -14], [-6, -8], [0, -8]]) { deco(C(0.06, 0.06, 2.6, 6), plank, [x, 1.3, z]); addCollider(x - 0.1, 0, z - 0.1, x + 0.1, 2.6, z + 0.1, { vis: false, mat: 'wood' }); }
  deco(B(6.4, 0.08, 6.4), canvasM, [-3, 2.6, -11], [0, 0, 0.05]); addCollider(-5, 0, -12.6, -1, 0.8, -11.6, { vm: plank, mat: 'wood', pen: true }); deco(RB(0.5, 0.3, 0.05, 0.01), m.black, [-3, 1.0, -12.1]);
  addCollider(1.2, 0, -7.4, 3.8, 0.9, -4.8, { vm: metalHut, mat: 'metal' }); const aa = new THREE.Group(); aa.position.set(2.5, 0.9, -6.1); LG.add(aa); add(aa, C(0.5, 0.6, 0.6, 12), metalHut, [0, 0.3, 0]); for (const sx of [-0.25, 0.25]) add(aa, C(0.06, 0.06, 2.4, 8), m.black, [sx, 1.1, 1.0], [PI / 2 - 0.6, 0, 0]);
  const bags = (x, z, w, d) => addCollider(x - w / 2, 0, z - d / 2, x + w / 2, 0.95, z + d / 2, { vm: sand, mat: 'concrete' });
  bags(0, 4, 3, 0.6); bags(-8, -4, 0.6, 3); bags(9, -6, 3, 0.6); bags(-14, -14, 3, 0.6); bags(14, -12, 0.6, 3); bags(5, -14.5, 2.4, 0.6);
  for (const [x, z] of [[17, -2], [17.6, -3], [16.4, -2.8], [-17, -4]]) prop('bin', x, 0, z);
  for (let i = 0; i < 6; i++) prop('box', rr(-4, 4), 0, rr(-30, -29));
  // watchtowers (visual)
  for (const [x, z] of [[-18.5, -30.5], [18.5, -30.5], [18.5, 6.5], [-18.5, 6.5]]) { for (const [dx, dz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) deco(B(0.15, 5, 0.15), plank, [x + dx, 2.5, z + dz]); deco(B(2.2, 0.15, 2.2), plank, [x, 5, z]); deco(B(2.4, 1.6, 2.4), canvasM, [x, 6.4, z], null, [1, 0.1, 1]); pointLight('#ffcf8a', 3, 10, x, 4.5, z); }
  // jungle
  const rr2 = rng(77);
  for (let i = 0; i < 150; i++) { const x = (rr2() - 0.5) * 110, z = (rr2() - 0.5) * 110; if (x > -23 && x < 23 && z > -35 && z < 11) continue; if (Math.abs(x) < 4.5 && z > 8 && z < 46) continue; if (x > -9 && x < 9 && z > 30 && z < 46) continue; if (x < -26 && x > -40 && z > -16 && z < -8) continue; K.tree(x, z, 0.8 + rr2() * 0.9, Math.hypot(x, z) < 52); }
  for (let i = 0; i < 70; i++) { const x = (rr2() - 0.5) * 100, z = (rr2() - 0.5) * 100; if (x > -21 && x < 21 && z > -33 && z < 9) continue; if (Math.abs(x) < 3 && z > 8) continue; K.bush(x, z, 0.7 + rr2()); }
  // invisible map edge
  for (const [x1, z1, x2, z2] of [[-46, -46, 46, -45.6], [-46, 49.6, 46, 50], [-46, -46, -45.6, 50], [45.6, -46, 46, 50]]) addCollider(x1, 0, z1, x2, 4, z2, { vis: false });
  // LZ + helicopter
  heli = K.heliModel(V3(0, 0, 40.5), PI, '#2f342b'); addCollider(-1.1, 0, 37.5, 1.1, 2.6, 46, { vis: false, mat: 'metal' });
  const lzTex = canvasTex(256, 256, g => { g.clearRect(0, 0, 256, 256); g.strokeStyle = 'rgba(240,240,220,.7)'; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 110, 0, 7); g.stroke(); g.fillStyle = 'rgba(240,240,220,.7)'; g.fillRect(70, 60, 26, 136); g.fillRect(160, 60, 26, 136); g.fillRect(70, 115, 116, 26); });
  deco(PL(9, 9), new THREE.MeshStandardMaterial({ map: lzTex, transparent: true, depthWrite: false }), [0, 0.01, 38], [-PI / 2, 0, 0], null, false);
  const zone = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.1, 32, 1, true), new THREE.MeshBasicMaterial({ color: '#3cff8a', transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false })); zone.position.set(0, 0.05, 35); zone.scale.y = 30; zone.visible = false; LG.add(zone);
  pointLight('#ffffff', 5, 14, 0, 4, 38);
  // doors
  new Door({ axis: 'x', x1: -12.6, z: -19.85, w: 1.2 }); new Door({ axis: 'x', x1: 10.4, z: -17.85, w: 1.2, name: 'lab' }); new Door({ axis: 'z', x: 5.85, z1: -23.6, w: 1.2 });
  // interactables
  K.addInteractable('item', V3(13.3, 0.9, -25.2), 'Drone chip uthao', K.pickupModel('chip', V3(13.3, 0.9, -25.2)), { done: 'Chip paowa gese! LZ e jao' });
  for (const [kind, pos, label] of [['ammo', V3(2, 0.2, 34), 'Ammo refill'], ['medkit', V3(-12, 0.75, -27), 'Medkit nao'], ['medkit', V3(15.2, 2.1, -20), 'Medkit nao'], ['ammo', V3(-29, 0.2, -11), 'Ammo refill']]) K.addInteractable(kind, pos, label, K.pickupModel(kind, pos));
  K.buildCameras([{ pos: V3(10.2, 3.1, -17.6), yaw: K.camLook(V3(10.2, 0, -17.6), V3(4, 0, -6)), pitch: -0.3 }]);
  const tt = { t: 0 };
  return {
    id: 'talon', bounds: { x0: -46, z0: -46, x1: 46, z1: 50 },
    spawns: { lz: { pos: V3(0, 0, 34.5), yaw: 0, label: 'Landing zone', desc: 'Heli theke LZ te namben, shoja rasta diye base er main gate.', risk: 'Risk: High · Direct' },
      west: { pos: V3(-33, 0, -12.5), yaw: -PI / 2, label: 'West fence', desc: 'Jungle er bhetor diye pashchimer bhanga fence. Lab er kache, chupchap.', risk: 'Risk: Low · Stealth' } },
    enemies: [
      { id: 'E1', pos: V3(-3.4, 0, 10.6), yaw: 0, room: 'Base' }, { id: 'E2', pos: V3(3.4, 0, 10.6), yaw: 0, room: 'Base' },
      { id: 'E3', pos: V3(-10, 0, 20), yaw: PI / 2, room: 'Jungle', patrol: [V3(-12, 0, 20), V3(12, 0, 22), V3(12, 0, 14), V3(-12, 0, 14)] },
      { id: 'E4', pos: V3(-26, 0, -4), yaw: 0, room: 'Jungle', patrol: [V3(-26, 0, -20), V3(-26, 0, 4)] },
      { id: 'E5', pos: V3(0.5, 0, -4.2), yaw: 0.3, room: 'Base' }, { id: 'E6', pos: V3(4.6, 0, -7.6), yaw: -0.3, room: 'Base' },
      { id: 'E7', pos: V3(-13.6, 0, -24.6), yaw: 0, room: 'Barracks' }, { id: 'E8', pos: V3(-10, 0, -21.4), yaw: PI, room: 'Barracks' },
      { id: 'E9', pos: V3(8.4, 0, -21.4), yaw: PI / 2, room: 'Lab' }, { id: 'E10', pos: V3(13.4, 0, -20.4), yaw: PI, room: 'Lab' },
      { id: 'E11', pos: V3(10, 0, -10), yaw: 0, room: 'Base', patrol: [V3(10, 0, -10), V3(-10, 0, -10), V3(-10, 0, 2), V3(10, 0, 2)] },
      { id: 'LEADER', pos: V3(-3, 0, -10.4), yaw: 0, room: 'Base', leader: true },
    ],
    hostages: [], exits: [], rescued: () => false,
    objectives: [{ type: 'retrieve', label: 'Lab theke drone chip uddhar' }, { type: 'extract', zone: { x1: -4.2, z1: 30.8, x2: 4.2, z2: 39.2 }, label: 'LZ te heli e uthe jao' }],
    bonus: ['leader', 'stealth'], timer: { kind: 'deadline', s: { recruit: 1200, veteran: 960, elite: 780 } }, deadlineFail: 'Helicopter er fuel shesh, extraction bondho.', executions: false, noAlarm: false,
    hawk: V3(-36, 8, 26), hawkLine: ['Hawk on the ridge west of the LZ. I have the gate and the courtyard.', 'Hawk: LZ er pashchime pahare achi. Gate ar uthan dekhte pacchi.'],
    intro: { all: ['Tiger 24, boots on the ground. The chip is in the lab on the east side. Grab it and get back to the LZ.', 'Rafi: Neme gechi. Chip ta purbo diker lab e. Niye LZ e fire asho.'] },
    onItem() { zone.visible = true; for (const e of G.enemies) if (e.isHostile() && e.state !== 'combat') e.investigate(V3(11, 0, -21), true); },
    update(dt, t) { if (heli) heli.userData.rotor.rotation.y += dt * 3; if (zone.visible) zone.material.opacity = 0.18 + Math.sin(t * 3) * 0.08; },
    winLine: ['Package secure, wheels up. Good work, Tiger 24.', 'Rafi: Chip amader kache, heli uthche. Darun kaj!'],
    blueprint: { view: [-40, -40, 40, 48], markers: [[13, -25, 'CHIP', 'b'], [0, 36, 'LZ', 'b'], [-3, 10, '', 'e'], [3, 10, '', 'e'], [0, 18, '', 'e'], [-26, -6, '', 'e'], [2, -6, '', 'e'], [-12, -24, '', 'e'], [11, -21, '', 'e'], [-3, -11, 'CMD', 'e']] },
  };
}
