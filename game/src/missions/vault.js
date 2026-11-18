// Mission 01 — Operation Vault: Aurum Central Bank hostage rescue
import { THREE, G, PI, M, B, RB, C, SP, PL, RX, add, canvasTex, rng, R, rr, V3 } from '../core.js';
import * as K from '../levelkit.js';
const { addCollider, wallX, wallZ, floor, ceiling, deco, pointLight, room, addGlass, prop, Door, lights } = K;

export const meta = { id: 'vault', no: '01', name: 'Operation Vault', art: 'bank', type: 'Hostage rescue', loc: 'Aurum Central Bank · Old Town', time: '02:40 hrs · brishti', diff: 'Medium',
  obj: ['12 jon hostage ke jibito ber kora', 'Vault er bhitore bomb defuse kora', 'Gunman der leader ke grephtar kora'], intel: 'Bank er bhitore 9 jon armed gunman. Pichoner loading dock er door khola, kintu corridor e CCTV cholche.' };

export function build() {
  K.beginLevel({ fill: 0.25, exposure: 1.05, grade: { sat: 1.0, contrast: 1.08, sh: [0.93, 0.98, 1.08], hi: [1.05, 1.0, 0.94] }, bg: '#05070a', sun: 0.85, fog: '#06080b', fogD: 0.014, sunPos: [5, 12, 26], sunTarget: [0, 0, -2], shadowSize: 16, rain: [[-22, 9.5, 22, 30], [-22, -36, 22, -24.5]], lightning: true, police: [0, 2.2, 15],
    alarmPos: [0, 5.7, 0], alarmBulbs: [[0, 5.75, -8.7], [-12.7, 5.5, 0], [12.7, 5.5, 0], [7.2, 3.8, -9.3], [-2, 3.8, -9.6]], skyDist: 46 });
  const LG = K.LG; const m = K.makeMaterials();
  // ---- rooms (order matters: inner first) ----
  room('Vault', -3.5, -24, 3.5, -18, 'tile', 0.8); room('Vault antechamber', -8, -18, 6, -9, 'tile', 0.85);
  room('Security', -16, -15, -8, -9, 'tile', 0.7); room('Archive', -16, -24, -8, -15, 'concrete', 0.35);
  room('Corridor', 6, -24, 8.4, -9, 'tile', 0.75); room('Manager office', 8.4, -16, 16, -9, 'carpet', 0.8); room('Break room', 8.4, -24, 16, -16, 'tile', 0.7);
  room('Teller area', -13, -9, 6, -4.2, 'marble', 0.9); room('Lobby', -13, -9, 13, 9, 'marble', 1, true, 6);
  room('Street', -22, 9, 22, 27, 'wet', 0.75, false); room('Back alley', -22, -35, 22, -24, 'wet', 0.5, false); room('Outside', -100, -100, 100, 100, 'wet', 0.6, false);
  // ---- floors ----
  floor(-13, -9, 13, 9, m.marble); floor(-8, -18, 6, -9, m.tile); floor(-3.5, -24, 3.5, -18, m.tile); floor(-16, -15, -8, -9, m.tile); floor(-16, -24, -8, -15, m.concrete);
  floor(6, -24, 8.4, -9, m.tile); floor(8.4, -16, 16, -9, m.carpet); floor(8.4, -24, 16, -16, m.tile);
  const st = floor(-30, 9, 30, 32, m.asphalt, -0.01); m.asphalt.map.repeat.set(12, 5); floor(-30, -38, 30, -24, m.asphalt, -0.01);
  // ---- lobby walls ----
  wallX(9.15, -13, 13, 6, m.plaster, [{ a: -11, b: -7, y0: 0.8, y1: 4.6 }, { a: -3, b: 3, y0: 0, y1: 4.6 }, { a: 7, b: 11, y0: 0.8, y1: 4.6 }]);
  wallZ(-13.15, -9, 9.3, 6, m.plaster); wallZ(13.15, -9, 9.3, 6, m.plaster);
  wallX(-9.15, -16.3, 16.3, 6, m.plaster, [{ a: -12.2, b: -11.0, y0: 0, y1: 2.3 }, { a: -2, b: 2, y0: 0, y1: 3.4 }, { a: 6.6, b: 7.8, y0: 0, y1: 2.3 }]);
  for (const [x1, x2] of [[-13, 13]]) { deco(B(x2 - x1, 1.1, 0.04), m.wood, [(x1 + x2) / 2, 0.55, 8.98]); deco(B(x2 - x1, 1.1, 0.04), m.wood, [(x1 + x2) / 2, 0.55, -8.98]); }
  deco(B(0.04, 1.1, 18), m.wood, [-12.98, 0.55, 0]); deco(B(0.04, 1.1, 18), m.wood, [12.98, 0.55, 0]);
  // front glass: windows + side panels beside the main doors
  addCollider(-1.5, 2.6, 9.0, 1.5, 4.6, 9.3, { vm: m.black });
  for (const x of [-11, -7, 7, 11, -3, 3, -1.5, 1.5]) deco(B(0.1, 4.6, 0.16), m.black, [x, 2.3, 9.15], null, null, false);
  ceiling(-13, -9, 13, 9, 6, m.ceiling);
  for (const x of [-7, 0, 7]) for (const z of [-5, 2]) deco(B(2.6, 0.06, 1.1), m.panel, [x, 5.97, z], null, null, false);
  deco(new THREE.CircleGeometry(1.4, 32), new THREE.MeshStandardMaterial({ color: '#0c1420', emissive: '#1a2a44', emissiveIntensity: 0.6 }), [0, 5.98, 1.2], [PI / 2, 0, 0], null, false); // skylight
  // columns
  for (const x of [-6.8, 6.8]) for (const z of [-1.6, 4.2]) { addCollider(x - 0.42, 0, z - 0.42, x + 0.42, 6, z + 0.42, { vis: false, mat: 'marble' }); deco(C(0.42, 0.42, 5.4, 24), M('#e6e0d4', 0.25, 0.05, { map: m.marble.map }), [x, 3, z]); deco(B(1.0, 0.3, 1.0), m.plaster, [x, 0.15, z]); deco(B(1.0, 0.3, 1.0), m.plaster, [x, 5.85, z]); }
  // teller counter + glass
  addCollider(-8, 0, -5, 6, 1.05, -4.2, { vm: m.wood, mat: 'wood', pen: true });
  deco(B(14.2, 0.08, 0.95), M('#f0ebe1', 0.2, 0.05, { map: m.marble.map }), [-1, 1.09, -4.6], null, null, true);
  for (let i = 0; i <= 7; i++) deco(B(0.05, 1.3, 0.05), m.brass, [-8 + i * 2, 1.78, -4.6], null, null, false);
  deco(B(14, 0.06, 0.06), m.brass, [-1, 2.42, -4.6], null, null, false);
  // teller desks behind counter
  for (const x of [-5.5, -1.5, 2.5]) { addCollider(x - 1, 0, -7.6, x + 1, 0.76, -6.9, { vm: m.woodLight, mat: 'wood', pen: true }); }
  // customer desks
  for (const x of [-10.5, 10.5]) { addCollider(x - 0.9, 0, 3.6, x + 0.9, 0.8, 4.4, { vm: m.woodLight, mat: 'wood', pen: true }); deco(RB(0.5, 0.32, 0.04, 0.01), m.black, [x, 1.0, 3.9]); deco(PL(0.46, 0.28), m.screen, [x, 1.0, 3.922], null, null, false); }
  // benches
  for (const x of [-12.5, 12.5]) addCollider(x - 0.3, 0, -0.5, x + 0.3, 0.48, 2.5, { vm: m.fabric, mat: 'wood', pen: true });
  // plants
  for (const [x, z] of [[-12.2, 8.2], [12.2, 8.2], [12.2, -8.2]]) { deco(C(0.32, 0.25, 0.6, 16), m.black, [x, 0.3, z]); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; deco(SP(0.22, 8, 6), m.green, [x + Math.cos(a) * 0.2, 0.9 + R() * 0.5, z + Math.sin(a) * 0.2], null, [0.6, 1.6, 0.6]); } addCollider(x - 0.35, 0, z - 0.35, x + 0.35, 0.6, z + 0.35, { vis: false, mat: 'wood' }); }
  // sign
  const signTex = canvasTex(1024, 128, (g, w, h) => { g.fillStyle = '#1e1a14'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8913f'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = '#e0bb68'; g.font = '700 70px "Saira Condensed", "Arial Narrow", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('AURUM CENTRAL BANK  ·  EST. 1962', w / 2, h / 2 + 4); });
  deco(PL(8, 1), M('#ffffff', 0.4, 0.3, { map: signTex, emissive: '#3a2a10', emissiveIntensity: 0.4 }), [0, 4.7, -8.98], null, null, false);
  // papers on floor
  for (let i = 0; i < 30; i++) deco(PL(0.21, 0.29), m.paper, [rr(-4, 4), 0.003 + i * 0.0002, rr(-3, 3)], [-PI / 2, 0, R() * PI], null, false);
  // ---- back wing outer walls ----
  wallX(-24.15, -16.3, 16.3, 4, m.concreteWall, [{ a: 6.6, b: 7.8, y0: 0, y1: 2.3 }]);
  wallZ(-16.15, -24, -9, 4, m.concreteWall); wallZ(16.15, -24, -9, 4, m.concreteWall);
  // west wing
  wallX(-15.15, -16, -8, 4, m.drywall, [{ a: -12.6, b: -11.4, y0: 0, y1: 2.3 }]);
  wallZ(-8.15, -24, -9, 4, m.drywall);
  // antechamber / vault
  wallX(-18.15, -8, 6, 4, m.concreteWall, [{ a: -1.4, b: 1.4, y0: 0, y1: 3.0 }]);
  addCollider(-8, 0, -24, -3.65, 4, -18.3, { vm: m.concreteWall, uv: 2 }); addCollider(3.65, 0, -24, 6, 4, -18.3, { vm: m.concreteWall, uv: 2 });
  addCollider(-3.65, 0, -24, -3.35, 4, -18, { vm: m.steel }); addCollider(3.35, 0, -24, 3.65, 4, -18, { vm: m.steel });
  wallZ(6.15, -18, -9, 4, m.drywall, [{ a: -14.6, b: -13.4, y0: 0, y1: 2.3 }]);
  // east wing
  wallZ(8.55, -24, -9, 4, m.office, [{ a: -13.2, b: -12, y0: 0, y1: 2.3 }, { a: -20.6, b: -19.4, y0: 0, y1: 2.3 }]);
  wallX(-16.15, 8.4, 16, 4, m.office);
  // ceilings back wing
  ceiling(-16, -24, 16, -9, 4, m.ceilingDark);
  for (const [x, z, w, d, mm] of [[-2, -13.5, 3, 0.4, m.fluo], [-12, -12, 2.4, 0.4, m.fluo], [-12, -19.5, 1.6, 0.3, m.fluo], [7.2, -12, 0.4, 2.4, m.fluo], [7.2, -20, 0.4, 2.4, m.fluo], [12, -12.5, 2.4, 0.5, m.panel], [12, -20, 2.4, 0.5, m.fluo], [0, -21, 2.4, 0.4, m.panel]]) deco(B(w, 0.05, d), mm, [x, 3.97, z], null, null, false);
  // antechamber decor
  deco(PL(13.8, 3.6), m.deposit, [-1, 1.95, -17.99], null, null, false); deco(PL(8.6, 3.6), m.deposit, [-7.84, 1.95, -13.5], [0, PI / 2, 0], null, false);
  addCollider(-2.5, 0, -14, 2.5, 0.85, -13, { vm: m.steel, mat: 'metal' });
  addCollider(-7.6, 0, -10.4, -7.0, 0.45, -9.6, { vm: m.leather, mat: 'wood', pen: true });
  // vault door (open) + interior
  deco(new THREE.TorusGeometry(1.75, 0.22, 14, 48), m.steel, [0, 1.75, -18.0]);
  const vd = new THREE.Group(); vd.position.set(1.6, 1.75, -17.8); vd.rotation.y = 1.25; LG.add(vd);
  add(vd, C(1.6, 1.6, 0.45, 48), m.steel, [-1.6, 0, 0], RX); add(vd, new THREE.TorusGeometry(0.45, 0.05, 10, 30), m.brass, [-1.6, 0, 0.26]); for (let i = 0; i < 3; i++) add(vd, C(0.035, 0.035, 0.9, 8), m.brass, [-1.6, 0, 0.26], [0, 0, i * PI / 3]);
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; add(vd, C(0.06, 0.06, 0.4, 10), M('#cfd3d8', 0.25, 0.95), [-1.6 + Math.cos(a) * 1.45, Math.sin(a) * 1.45, 0], [0, 0, a + PI / 2]); }
  addCollider(1.25, 0, -18.1, 2.3, 3.2, -15.6, { vis: false, mat: 'metal' });
  for (const x of [-3.0, 3.0]) { addCollider(x - 0.3, 0, -23.6, x + 0.3, 2.4, -18.6, { vm: m.darkSteel, mat: 'metal' }); for (let y = 0.4; y < 2.4; y += 0.5) for (let z = -23.2; z < -18.8; z += 0.5) deco(B(0.12, 0.08, 0.25), m.gold, [x + (x < 0 ? 0.32 : -0.32), y + 0.04, z], null, null, false); }
  addCollider(-1.0, 0, -23.4, 1.0, 0.5, -21.6, { vm: m.woodLight, mat: 'wood', pen: true });
  for (let i = 0; i < 12; i++) deco(B(0.16, 0.06, 0.07), m.cash, [rr(-0.85, 0.85), 0.53 + (i % 3) * 0.06, rr(-23.3, -21.7)], [0, R() * PI, 0], null, false);
  // security room
  addCollider(-15.6, 0, -10.6, -13.0, 0.78, -9.4, { vm: m.darkSteel, mat: 'metal' });
  const camTex = canvasTex(256, 160, (g, w, h) => { g.fillStyle = '#0c1410'; g.fillRect(0, 0, w, h); for (let i = 0; i < 800; i++) { const v = 30 + R() * 60; g.fillStyle = `rgba(${v},${v + 20},${v},.5)`; g.fillRect(R() * w, R() * h, 2, 1); } g.strokeStyle = 'rgba(120,200,140,.6)'; g.strokeRect(20, 60, 90, 60); g.strokeRect(140, 40, 80, 90); g.fillStyle = '#ff4030'; g.beginPath(); g.arc(240, 16, 5, 0, PI * 2); g.fill(); g.fillStyle = 'rgba(200,255,210,.8)'; g.font = '14px monospace'; g.fillText('CAM 0' + Math.floor(R() * 9), 10, 20); });
  for (let i = 0; i < 3; i++) { deco(RB(0.8, 0.5, 0.06, 0.01), m.black, [-15.1 + i * 0.85, 1.45, -9.5]); deco(PL(0.74, 0.45), new THREE.MeshStandardMaterial({ map: camTex, emissive: '#ffffff', emissiveMap: camTex, emissiveIntensity: 0.9 }), [-15.1 + i * 0.85, 1.45, -9.465], null, null, false); }
  for (let i = 0; i < 4; i++) addCollider(-15.9, 0, -14.8 + i * 0.6, -15.4, 2.0, -14.25 + i * 0.6, { vm: m.steel, mat: 'metal' });
  // archive shelves
  for (const z of [-17.4, -19.9, -22.4]) { addCollider(-15.2, 0, z - 0.25, -10.6, 2.2, z + 0.25, { vm: m.darkSteel, mat: 'metal', pen: false });
    for (let x = -15; x < -10.8; x += 0.5) for (const y of [0.45, 1.15, 1.85]) if (R() < 0.8) deco(B(0.42, 0.35, 0.42), m.cardboard, [x + 0.2, y, z], [0, R() * 0.2, 0], null, false); }
  // corridor
  deco(C(0.15, 0.15, 1.1, 12), M('#e8f0f4', 0.3), [6.3, 0.55, -16.5]); deco(C(0.14, 0.14, 0.4, 12), M('#6fb3e0', 0.1, 0, { transparent: true, opacity: 0.7 }), [6.3, 1.3, -16.5]);
  deco(PL(1.2, 0.8), M('#3a5a3a', 0.9), [8.38, 1.6, -17], [0, -PI / 2, 0], null, false);
  // manager office
  addCollider(11, 0, -13.2, 14, 0.78, -12, { vm: m.wood, mat: 'wood', pen: true }); deco(RB(0.5, 0.32, 0.04, 0.01), m.black, [13.2, 1.0, -12.8], [0, -0.3, 0]); deco(PL(0.46, 0.28), m.screen, [13.2, 1.0, -12.778], [0, -0.3, 0], null, false);
  addCollider(15.4, 0, -15.6, 15.9, 2.2, -11, { vm: m.wood, mat: 'wood', pen: true }); for (let i = 0; i < 24; i++) deco(B(0.2, 0.3, 0.04), M(['#7a2a2a', '#2a4a7a', '#2a6a3a', '#7a6a2a'][i % 4], 0.8), [15.3, 0.4 + Math.floor(i / 8) * 0.7, -15.4 + (i % 8) * 0.55], null, null, false);
  addCollider(9, 0, -15.9, 12.4, 0.6, -15.1, { vm: m.leather, mat: 'wood', pen: true });
  // break room
  addCollider(11, 0, -21, 13.5, 0.76, -19.5, { vm: m.white, mat: 'wood', pen: true }); addCollider(15.2, 0, -17.6, 15.9, 1.9, -16.4, { vm: M('#2a3a6a', 0.4, 0.3), mat: 'metal' }); deco(PL(0.6, 1.0), M('#9ad', 0.2, 0, { emissive: '#4a8aff', emissiveIntensity: 0.6 }), [15.19, 1.2, -17], [0, -PI / 2, 0], null, false);
  addCollider(15.1, 0, -19.2, 15.9, 1.8, -18.4, { vm: m.white, mat: 'metal' }); addCollider(9, 0, -23.9, 14, 0.9, -23.3, { vm: m.woodLight, mat: 'wood', pen: true });
  // ---- outside front ----
  for (const x of [-22, 22]) addCollider(x - 0.2, 0, 9.3, x + 0.2, 4, 30, { vm: m.brick, uv: 3 }); addCollider(-22, 0, 29.8, 22, 4, 30.2, { vis: false });
  addCollider(-22, 0, 9.3, -13.3, 6, 9.6, { vm: m.brick, uv: 3 }); addCollider(13.3, 0, 9.3, 22, 6, 9.6, { vm: m.brick, uv: 3 });
  const policeCar = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; LG.add(g);
    add(g, RB(1.9, 0.7, 4.6, 0.15, 3), M('#e8e8ea', 0.35, 0.5), [0, 0.6, 0]); add(g, RB(1.7, 0.55, 2.4, 0.15, 3), M('#151a22', 0.2, 0.6), [0, 1.15, -0.2]); add(g, B(1.92, 0.25, 4.62), M('#1a2a55', 0.4, 0.4), [0, 0.55, 0]);
    for (const [wx, wz] of [[-0.9, 1.4], [0.9, 1.4], [-0.9, -1.5], [0.9, -1.5]]) add(g, C(0.36, 0.36, 0.25, 16), m.black, [wx, 0.36, wz], [0, 0, PI / 2]);
    const r = add(g, B(0.6, 0.12, 0.25), new THREE.MeshBasicMaterial({ color: '#ff2020', toneMapped: false }), [-0.35, 1.5, -0.2]); const b = add(g, B(0.6, 0.12, 0.25), new THREE.MeshBasicMaterial({ color: '#2050ff', toneMapped: false }), [0.35, 1.5, -0.2]);
    const c = Math.cos(ry), s = Math.sin(ry); const hw = 1.0, hl = 2.35; const ex = Math.abs(c) * hw + Math.abs(s) * hl, ez = Math.abs(s) * hw + Math.abs(c) * hl; addCollider(x - ex, 0, z - ez, x + ex, 1.3, z + ez, { vis: false, mat: 'metal' }); return [r, b]; };
  lights.bars.push(...policeCar(-5.5, 16, 0.35), ...policeCar(6, 17.5, -0.5));
  for (let i = 0; i < 6; i++) { const x = -9 + i * 3.6; deco(B(1.6, 0.9, 0.4), m.yellow, [x, 0.45, 20.5]); addCollider(x - 0.8, 0, 20.3, x + 0.8, 0.9, 20.7, { vis: false, mat: 'wood', pen: true }); }
  // ---- back alley ----
  for (const x of [-22, 22]) addCollider(x - 0.2, 0, -36, x + 0.2, 4, -24.3, { vm: m.brick, uv: 3 }); addCollider(-22, 0, -36.2, 22, 6, -35.8, { vm: m.brick, uv: 3 });
  { const g = new THREE.Group(); g.position.set(-2, 0, -29.5); LG.add(g); add(g, RB(2.0, 2.0, 5.0, 0.2, 3), M('#2a2c2e', 0.5, 0.4), [0, 1.2, 0]); add(g, RB(1.9, 0.6, 1.2, 0.1, 2), M('#0b0e12', 0.1, 0.8), [0, 1.8, 2.0]); for (const [wx, wz] of [[-1, 1.6], [1, 1.6], [-1, -1.6], [1, -1.6]]) add(g, C(0.38, 0.38, 0.3, 16), m.black, [wx, 0.38, wz], [0, 0, PI / 2]);
    addCollider(-3.05, 0, -32.05, -0.95, 2.2, -26.95, { vis: false, mat: 'metal' }); }
  addCollider(11, 0, -26.2, 13, 1.4, -25, { vm: M('#2f4a2f', 0.6, 0.5), mat: 'metal' });
  pointLight('#ffd9a0', 11, 14, -7, 5.5, 1); pointLight('#ffd9a0', 11, 14, 7, 5.5, 1); pointLight('#ffd9a0', 9, 13, 0, 5.5, -6);
  pointLight('#e8f4ff', 9, 12, -1, 3.6, -13.5); pointLight('#ffbe5c', 10, 8, 0, 2.8, -21); pointLight('#7fc8ff', 6, 9, -12, 3.4, -12); pointLight('#c8d8e8', 2.5, 9, -12, 3.4, -20);
  for (const [x, z] of [[-7, 2], [7, 2], [0, -5]]) K.shaft(V3(x, 5.9, z), V3(0, -1, 0), 5.9, 0.35, 1.9, '#ffe2b0', 0.07);
  K.shaft(V3(0, 3.3, -21), V3(0, -1, 0), 3.3, 0.25, 1.3, '#ffc070', 0.09); for (const x of [-9, 9, -5, 5]) K.shaft(V3(x, 4.0, 9.0), V3(0, -0.45, -1), 7, 0.9, 2.0, '#9fb4d8', 0.045);
  pointLight('#eef6ff', 6, 12, 7.2, 3.6, -16); pointLight('#ffdcae', 7, 10, 12, 3.4, -12.5); pointLight('#eef6ff', 5, 10, 12, 3.4, -20); pointLight('#ffaa55', 7, 16, 4, 4, -30);
  addGlass(-11, 0.8, 9.12, -7, 4.6, 9.18); addGlass(7, 0.8, 9.12, 11, 4.6, 9.18); addGlass(-3, 0, 9.12, -1.5, 4.6, 9.18); addGlass(1.5, 0, 9.12, 3, 4.6, 9.18);
  for (let i = 0; i < 7; i++) addGlass(-8 + i * 2 + 0.03, 1.13, -4.62, -8 + (i + 1) * 2 - 0.03, 2.4, -4.58);
  new Door({ axis: 'x', x1: -1.5, z: 9.15, w: 1.5, glassDoor: true, h: 2.6 }); new Door({ axis: 'x', x1: 0, z: 9.15, w: 1.5, glassDoor: true, h: 2.6 });
  new Door({ axis: 'x', x1: -12.2, z: -9.15, w: 1.2 }); new Door({ axis: 'x', x1: -12.6, z: -15.15, w: 1.2 });
  new Door({ axis: 'x', x1: 6.6, z: -9.15, w: 1.2, locked: true, name: 'staff' });
  new Door({ axis: 'z', x: 8.55, z1: -13.2, w: 1.2 }); new Door({ axis: 'z', x: 8.55, z1: -20.6, w: 1.2 });
  new Door({ axis: 'z', x: 6.15, z1: -14.6, w: 1.2, locked: true, name: 'ante' });
  new Door({ axis: 'x', x1: 6.6, z: -24.15, w: 1.2, name: 'back' });
  // props
  for (let i = 0; i < 4; i++) { prop('chair', -11.7, 0, -1.8 - i * 0.7 + 4.5, PI / 2); prop('chair', 11.7, 0, -1.8 - i * 0.7 + 4.5, -PI / 2); }
  prop('chair', -2.6, 0, 1.8, 0.7); prop('chair', 3.2, 0, 2.6, -1.2);
  for (const x of [-5.5, -1.5, 2.5]) prop('office', x, 0, -8.1, PI);
  for (const [x, z] of [[-12, 6], [12, 6], [-4, -8.5], [9, -12]]) prop('bin', x, 0, z);
  prop('cart', -4.6, 0, -16.2, 0.2); prop('cart', 4.6, 0, -12.6, -0.4);
  for (const [x, z] of [[-1.6, -20.4], [1.6, -20.6], [-0.4, -19.4], [2.2, -22.8]]) prop('bag', x, 0, z);
  prop('office', -13, 0, -11, 0.4); prop('office', 12.5, 0, -11.4, PI);
  for (const [x, z] of [[11.4, -18.9], [13.1, -18.9], [11.4, -21.6], [13.1, -21.6]]) prop('chair', x, 0, z, z > -20 ? PI : 0);
  for (let i = 0; i < 10; i++) prop('box', rr(-15.5, -10.5), 0, [-16.3, -18.6, -21.1, -23.5][i % 4]);
  for (const [x, z] of [[-11.8, -24.6], [12, -27.5], [13, -27.8]]) prop('box', x, 0, z < -24.4 ? z : z);
  prop('monitor', -15.0, 0.78, -10.1, 0); prop('extinguisher', 8.2, 0, -10.2);
  for (let i = 0; i < 5; i++) prop('box', rr(9.5, 14.5), 0, rr(-27, -30));
  // interactables
  for (const [kind, pos, label, ry] of [['medkit', V3(-8.38, 1.2, -12.5), 'Medkit nao', -PI / 2], ['medkit', V3(15.92, 1.1, -22.4), 'Medkit nao', -PI / 2], ['ammo', V3(1.8, 0.2, 13.2), 'Ammo refill', 0], ['ammo', V3(9, 0.2, -27.4), 'Ammo refill', 0], ['intel', V3(12.2, 0.84, -12.5), 'Intel note pora', 0]])
    K.addInteractable(kind, pos, label, K.pickupModel(kind, pos, ry));
  K.addInteractable('console', V3(-13.6, 1.0, -10.0), 'CCTV bondho koro', K.pickupModel('console', V3(-13.6, 1.0, -10.0)));
  { const bp = V3(0, 0.62, -22.4); const bm = K.bombModel(bp); K.addInteractable('bomb', bp, 'Bomb defuse koro', bm.g, { disp: bm.disp }); }
  const cams = [{ pos: V3(12.6, 5.3, 8.6), pitch: -0.35 }, { pos: V3(-12.6, 5.3, -8.6), pitch: -0.35 }, { pos: V3(7.2, 3.4, -23.6), pitch: -0.25 }];
  cams[0].yaw = K.camLook(cams[0].pos, V3(0, 0, 0)); cams[1].yaw = K.camLook(cams[1].pos, V3(0, 0, 8)); cams[2].yaw = K.camLook(cams[2].pos, V3(7.2, 0, -10));
  K.buildCameras(cams);
  const def = {
  spawns: { front: { pos: V3(0, 0, 14.5), yaw: 0 }, back: { pos: V3(7.2, 0, -28), yaw: PI }, roof: { pos: V3(0, 0, 1.2), yaw: 0 } },
  exits: [V3(0, 0, 12.5), V3(7.2, 0, -27)],
  enemies: [
    { id: 'E1', pos: V3(2.6, 0, -0.6), yaw: -0.5, room: 'Lobby', look: true },
    { id: 'E2', pos: V3(-9, 0, 6), yaw: PI / 2, room: 'Lobby', patrol: [V3(-9, 0, 6), V3(9, 0, 6), V3(9, 0, -2.5), V3(-9, 0, -2.5)] },
    { id: 'E3', pos: V3(-3, 0, -8.4), yaw: PI, room: 'Teller area', patrol: [V3(-6.5, 0, -8.4), V3(4.5, 0, -8.4)] },
    { id: 'E4', pos: V3(-12.6, 0, -11.4), yaw: 0, room: 'Security' },
    { id: 'E5', pos: V3(-9.6, 0, -21), yaw: -PI / 2, room: 'Archive', patrol: [V3(-9.6, 0, -21.5), V3(-9.6, 0, -16.6), V3(-14.6, 0, -16.6)] },
    { id: 'E6', pos: V3(7.2, 0, -11), yaw: PI, room: 'Corridor', patrol: [V3(7.2, 0, -10.6), V3(7.2, 0, -22.6)] },
    { id: 'E7', pos: V3(10, 0, -14.6), yaw: PI / 4, room: 'Manager office' },
    { id: 'E8', pos: V3(3.8, 0, -11), yaw: -PI / 2, room: 'Vault antechamber', patrol: [V3(3.8, 0, -10.4), V3(3.8, 0, -16.4), V3(-5.5, 0, -16.4)] },
    { id: 'LEADER', pos: V3(-0.6, 0, -16.4), yaw: 0.2, room: 'Vault antechamber', leader: true },
  ],
  hostages: [
    { pos: V3(-1.1, 0, -0.6), yaw: 0.3 }, { pos: V3(0, 0, -0.7), yaw: -0.2 }, { pos: V3(1.1, 0, -0.5), yaw: 0.1 }, { pos: V3(-0.6, 0, 0.5), yaw: 0.4 }, { pos: V3(0.5, 0, 0.5), yaw: -0.3 }, { pos: V3(1.6, 0, 0.6), yaw: 0 },
    { pos: V3(13.5, 0, -10.2), yaw: PI * 0.9 }, { pos: V3(14.6, 0, -10.4), yaw: PI * 1.1 },
    { pos: V3(-6.6, 0, -11), yaw: PI / 2 }, { pos: V3(-6.6, 0, -12.2), yaw: PI / 2 }, { pos: V3(-6.4, 0, -13.4), yaw: PI / 2 },
    { pos: V3(-15.2, 0, -23.2), yaw: PI / 4 },
  ],
  pickups: [
    { kind: 'medkit', pos: V3(-8.36, 1.2, -12.5), label: 'Medkit nao', ry: -PI / 2 }, { kind: 'medkit', pos: V3(15.95, 1.1, -22.4), label: 'Medkit nao', ry: -PI / 2 },
    { kind: 'ammo', pos: V3(1.8, 0.2, 13.2), label: 'Ammo refill' }, { kind: 'ammo', pos: V3(9, 0.2, -27.4), label: 'Ammo refill' },
    { kind: 'intel', pos: V3(12.2, 0.84, -12.5), label: 'Intel note pora' },
  ],
  console: V3(-13.6, 1.0, -10.0), bomb: V3(0, 0.62, -22.4),
  cameras: [{ pos: V3(12.6, 5.3, 8.6), yaw: PI * 0.25 + PI, pitch: -0.35 }, { pos: V3(-12.6, 5.3, -8.6), yaw: PI * 0.75 + PI, pitch: -0.35 }, { pos: V3(7.2, 3.4, -23.6), yaw: PI, pitch: -0.25 }],
  hawk: V3(-3, 3.6, 24),
  };
  Object.assign(def, {
    id: 'vault', bounds: { x0: -17, z0: -31, x1: 17, z1: 26 },
    spawns: { front: { pos: V3(0, 0, 14.5), yaw: 0, label: 'Main entrance', desc: 'Front glass door diye shoja lobby te. Police cover ache, kintu lobby te 3 jon gunman.', risk: 'Risk: High · Speed: Fast' },
      roof: { pos: V3(0, 0, 1.2), yaw: 0, rappel: 5.6, label: 'Roof skylight', desc: 'Skylight diye rappel kore lobby er majhkhane namben. Lobby er gunman ra hotobhombo thakbe.', risk: 'Risk: Medium · Surprise', surprise: ['Lobby', 'Teller area'] },
      back: { pos: V3(7.2, 0, -28), yaw: PI, label: 'Loading dock', desc: 'Pichoner door khola. Stealth route, kintu corridor e CCTV ar ekjon patrol.', risk: 'Risk: Low · Stealth' } },
    exits: [V3(0, 0, 12.5), V3(7.2, 0, -27)], rescued: p => p.z > 11.4 || p.z < -25.6,
    objectives: [{ type: 'rescue' }, { type: 'neutralize' }, { type: 'defuse' }], bonus: ['leader', 'stealth'],
    timer: { kind: 'bomb', s: { recruit: 1080, veteran: 900, elite: 720 } }, executions: true, maxDead: 4, shieldRetreat: V3(0, 0, -21.5),
    intro: { front: ['Tiger 24, we go through the front doors. Hostages are in the lobby. Check your targets.', 'Rafi: Front door diye dhukbo. Lobby te hostage. Target confirm kore goli korbe.'],
      back: ['Back door is unlocked. Corridor camera is live. Stay quiet.', 'Rafi: Pichoner door khola. Corridor e camera cholche. Chupchap.'],
      roof: ['Rappelling through the skylight. Go, go, go!', 'Rafi: Skylight diye namchi. Go, go, go!'] },
    siren: true,
    blueprint: { view: [-18, -27, 18, 19], markers: [[0, 0, '6 HOSTAGE', 'h'], [14, -10.3, '2', 'h'], [-6.5, -12.2, '3', 'h'], [-15.2, -23.2, '1', 'h'], [2, 1, '', 'e'], [-8, 5, '', 'e'], [-12.5, -11.5, '', 'e'], [7.2, -15, '', 'e'], [10, -14.6, '', 'e'], [3, -12, '', 'e'], [-10, -20, '', 'e'], [0, -8, '', 'e'], [0, -22, 'BOMB', 'b']] },
  });
  delete def.pickups; delete def.console; delete def.bomb; delete def.cameras;
  return def;
}
