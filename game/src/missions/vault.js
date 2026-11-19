// Mission 01 — Operation Vault (Old Town): a large district held by an armed gang. IGI-style chain of objectives across the map:
//   1) kill the gang's radio jammer (Telecom yard) and wreck both getaway trucks (Truck yard), in any order
//   2) hack the bank's cameras from the security annex across Main Street
//   3) storm Aurum Central Bank: free the 12 hostages and defuse the vault bomb (its timer starts now)
//   4) extract from the helipad in Old Town Square
import { THREE, G, PI, M, B, RB, C, SP, PL, RX, add, canvasTex, rng, R, rr, V3, A, FX, emitNoise } from '../core.js';
import * as K from '../levelkit.js';
const { addCollider, wallX, wallZ, floor, ceiling, deco, pointLight, room, addGlass, prop, Door, lights } = K;

export const meta = { id: 'vault', no: '01', name: 'Operation Vault', art: 'bank', type: 'Open district · multi-objective', loc: 'Old Town · Aurum Central Bank', time: '02:40 hrs · brishti', diff: 'Hard',
  obj: ['Telecom yard e gang er radio jammer bondho', 'Truck yard e duita getaway truck nosto', 'Security annex theke bank er CCTV hack', 'Bank e 12 jon hostage uddhar ar vault bomb defuse', 'Old Town Square er helipad e extraction'],
  intel: 'Aj raate puro Old Town ekta armed gang er dokhole. Bank e 12 jon hostage, vault e bomb. Age oder radio ar palanor truck shesh korte hobe, na hole bank e dhukle ora shob khobor peye jabe. Map (M/Tab) e porer objective dekha jabe.' };

export function build() {
  K.beginLevel({ fill: 0.45, exposure: 1.1, grade: { sat: 1.0, contrast: 1.08, sh: [0.93, 0.98, 1.08], hi: [1.05, 1.0, 0.94] }, bg: '#05070a', sun: 1.1, fog: '#0a0d12', fogD: 0.016, sunPos: [25, 40, 30], sunTarget: [0, 0, 0], shadowSize: 34, followShadow: true,
    rain: [[-30, 96, 30, 156]], rainN: 2600, rainFollow: true, alarmPos: [0, 5.7, 0], alarmBulbs: [[0, 5.75, -8.7], [-12.7, 5.5, 0], [12.7, 5.5, 0], [7.2, 3.8, -9.3], [-2, 3.8, -9.6]], skyDist: 230, skyTop: '#03050b', skyBottom: '#141c2c', city: true });
  const LG = K.LG; const m = K.makeMaterials();
  // ---- rooms (order matters: inner first) ----
  room('Vault', -3.5, -24, 3.5, -18, 'tile', 0.8); room('Vault antechamber', -8, -18, 6, -9, 'tile', 0.85);
  room('Security', -16, -15, -8, -9, 'tile', 0.7); room('Archive', -16, -24, -8, -15, 'concrete', 0.35);
  room('Corridor', 6, -24, 8.4, -9, 'tile', 0.75); room('Manager office', 8.4, -16, 16, -9, 'carpet', 0.8); room('Break room', 8.4, -24, 16, -16, 'tile', 0.7);
  room('Teller area', -13, -9, 6, -4.2, 'marble', 0.9); room('Lobby', -13, -9, 13, 9, 'marble', 1, true, 6);
  room('Street', -22, 9, 22, 27, 'wet', 0.75, false); room('Back alley', -22, -35, 22, -24, 'wet', 0.5, false); 
  // ---- floors ----
  floor(-13, -9, 13, 9, m.marble); floor(-8, -18, 6, -9, m.tile); floor(-3.5, -24, 3.5, -18, m.tile); floor(-16, -15, -8, -9, m.tile); floor(-16, -24, -8, -15, m.concrete);
  floor(6, -24, 8.4, -9, m.tile); floor(8.4, -16, 16, -9, m.carpet); floor(8.4, -24, 16, -16, m.tile);
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
  addCollider(-22, 0, 9.3, -13.3, 6, 9.6, { vm: m.brick, uv: 3 }); addCollider(13.3, 0, 9.3, 22, 6, 9.6, { vm: m.brick, uv: 3 });
  const policeCar = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; LG.add(g);
    add(g, RB(1.9, 0.7, 4.6, 0.15, 3), M('#e8e8ea', 0.35, 0.5), [0, 0.6, 0]); add(g, RB(1.7, 0.55, 2.4, 0.15, 3), M('#151a22', 0.2, 0.6), [0, 1.15, -0.2]); add(g, B(1.92, 0.25, 4.62), M('#1a2a55', 0.4, 0.4), [0, 0.55, 0]);
    for (const [wx, wz] of [[-0.9, 1.4], [0.9, 1.4], [-0.9, -1.5], [0.9, -1.5]]) add(g, C(0.36, 0.36, 0.25, 16), m.black, [wx, 0.36, wz], [0, 0, PI / 2]);
    const r = add(g, B(0.6, 0.12, 0.25), new THREE.MeshBasicMaterial({ color: '#ff2020', toneMapped: false }), [-0.35, 1.5, -0.2]); const b = add(g, B(0.6, 0.12, 0.25), new THREE.MeshBasicMaterial({ color: '#2050ff', toneMapped: false }), [0.35, 1.5, -0.2]);
    const c = Math.cos(ry), s = Math.sin(ry); const hw = 1.0, hl = 2.35; const ex = Math.abs(c) * hw + Math.abs(s) * hl, ez = Math.abs(s) * hw + Math.abs(c) * hl; addCollider(x - ex, 0, z - ez, x + ex, 1.3, z + ez, { vis: false, mat: 'metal' }); return [r, b]; };
  lights.bars.push(...policeCar(-5.5, 16, 0.35), ...policeCar(6, 17.5, -0.5));
  for (let i = 0; i < 6; i++) { const x = -9 + i * 3.6; deco(B(1.6, 0.9, 0.4), m.yellow, [x, 0.45, 20.5]); addCollider(x - 0.8, 0, 20.3, x + 0.8, 0.9, 20.7, { vis: false, mat: 'wood', pen: true }); }
  // ---- back alley ----
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
  const site = district(m);
  cams.push({ pos: V3(-74.4, 3.4, -55), pitch: -0.3 }, { pos: V3(74.4, 3.4, -41), pitch: -0.3 }, { pos: V3(-24.4, 3, 33.6), pitch: -0.32 });
  cams[3].yaw = K.camLook(cams[3].pos, V3(-62, 0, -46)); cams[4].yaw = K.camLook(cams[4].pos, V3(62, 0, -48)); cams[5].yaw = K.camLook(cams[5].pos, V3(-20, 0, 20));
  K.buildCameras(cams);
  const E = (id, x, z, yaw, room, o = {}) => ({ id, pos: V3(x, 0, z), yaw, room, ...o }); const pv = (...pts) => pts.map(([x, z]) => V3(x, 0, z));
  return {
    id: 'vault', bounds: { x0: -151, z0: -161, x1: 151, z1: 151 },
    spawns: {
      lz: { pos: V3(0, 0, 128), yaw: 0, insert: 'heli', label: 'Park LZ (south)', desc: 'Heli te Old Town park e namben. Shamne bank, pashchime telecom yard, purbe truck yard.', risk: 'Risk: Medium' },
      quay: { pos: V3(140, 0, 124), yaw: PI / 2, insert: 'boat', label: 'River quay (east)', desc: 'Speedboat e nodir ghat e. Truck yard kache, chupchap shuru kora jay.', risk: 'Risk: Low · Stealth' } },
    waterY: -1.6,
    enemies: [
      // bank
      E('E1', 2.6, -0.6, -0.5, 'Lobby'), E('E2', -9, 6, PI / 2, 'Lobby', { patrol: pv([-9, 6], [9, 6], [9, -2.5], [-9, -2.5]) }), E('E3', -3, -8.4, PI, 'Teller area', { patrol: pv([-6.5, -8.4], [4.5, -8.4]) }),
      E('E4', -12.6, -11.4, 0, 'Security'), E('E5', -9.6, -21, -PI / 2, 'Archive', { patrol: pv([-9.6, -21.5], [-9.6, -16.6], [-14.6, -16.6]) }), E('E6', 7.2, -11, PI, 'Corridor', { patrol: pv([7.2, -10.6], [7.2, -22.6]) }),
      E('E7', 10, -14.6, PI / 4, 'Manager office'), E('E8', 3.8, -11, -PI / 2, 'Vault antechamber', { patrol: pv([3.8, -10.4], [3.8, -16.4], [-5.5, -16.4]) }), E('LEADER', -0.6, -16.4, 0.2, 'Vault antechamber', { leader: true }),
      // telecom yard
      E('T1', -80, -46, PI / 2, 'Telecom yard'), E('T2', -80, -51, PI / 2, 'Telecom yard'), E('T3', -110, -55, 0, 'Telecom yard', { patrol: pv([-110, -55], [-88, -55], [-88, -24], [-118, -22]) }),
      E('T4', -100, -37, 0, 'Control hut'), E('T5', -126, -40, 0, 'Telecom yard', { patrol: pv([-126, -40], [-126, -72], [-96, -74]) }), E('T6', -114, -57, PI / 2, 'Telecom yard', { heavy: true }),
      // truck yard
      E('Y1', 79, -46, -PI / 2, 'Truck yard'), E('Y2', 79, -51, -PI / 2, 'Truck yard'), E('Y3', 106, -50, 0, 'Truck yard', { patrol: pv([106, -50], [132, -50], [132, -22], [86, -26]) }),
      E('Y4', 130, -45, -PI / 2, 'Yard office'), E('Y5', 110, -72, 0, 'Truck yard', { heavy: true }), E('Y6', 92, -34, PI / 2, 'Truck yard'),
      // security annex
      E('A1', -38, 31.6, PI, 'Main Street'), E('A2', -43, 40, PI / 2, 'Annex office'), E('A3', -27, 39, -PI / 2, 'Annex office'), E('A4', -42, 48, PI / 2, 'Server room'), E('A5', -27, 55.5, PI, 'Park'),
      // Old Town Square
      E('Q1', -20, -110, 0, 'Old Town Square'), E('Q2', 20, -112, 0, 'Old Town Square'), E('Q3', 0, -128, PI, 'Old Town Square'), E('Q4', 9, -141, PI, 'Old Town Square', { heavy: true }),
      E('Q5', -12, -118, 0, 'Old Town Square', { patrol: pv([-12, -118], [0, -106], [12, -118], [0, -128]) }), E('Q6', -40, -130, -PI / 2, 'Old Town Square'), E('Q7', 40, -128, PI / 2, 'Old Town Square'),
      // market lane + streets
      E('M1', 0, -60, 0, 'Market lane', { patrol: pv([0, -42], [0, -82]) }), E('M2', -3, -74, PI / 2, 'Market lane'),
      E('S1', -100, 20, PI / 2, 'Main Street', { patrol: pv([-140, 20], [-66, 20]) }), E('S2', 100, 20, -PI / 2, 'Main Street', { patrol: pv([66, 20], [140, 20]) }),
      E('S3', -56, -40, 0, 'West Avenue', { patrol: pv([-56, -90], [-56, 2]) }), E('S4', 56, -40, PI, 'East Avenue', { patrol: pv([56, -90], [56, 2]) }), E('S5', 0, -93, PI / 2, 'North Road', { patrol: pv([-100, -93], [100, -93]) }),
      E('S6', -40, -31, PI / 2, 'Back lane', { patrol: pv([-48, -31], [-22, -31]) }), E('S7', -56, 70, 0, 'West Avenue', { patrol: pv([-56, 40], [-56, 120]) }), E('S8', 56, 80, PI, 'East Avenue', { patrol: pv([56, 40], [56, 116]) }),
      E('R1', 138, 60, 0, 'Quay', { patrol: pv([138, 40], [138, 82]) }),
    ],
    hostages: [
      { pos: V3(-1.1, 0, -0.6), yaw: 0.3 }, { pos: V3(0, 0, -0.7), yaw: -0.2 }, { pos: V3(1.1, 0, -0.5), yaw: 0.1 }, { pos: V3(-0.6, 0, 0.5), yaw: 0.4 }, { pos: V3(0.5, 0, 0.5), yaw: -0.3 }, { pos: V3(1.6, 0, 0.6), yaw: 0 },
      { pos: V3(13.5, 0, -10.2), yaw: PI * 0.9 }, { pos: V3(14.6, 0, -10.4), yaw: PI * 1.1 }, { pos: V3(-6.6, 0, -11), yaw: PI / 2 }, { pos: V3(-6.6, 0, -12.2), yaw: PI / 2 }, { pos: V3(-6.4, 0, -13.4), yaw: PI / 2 },
      { pos: V3(-15.2, 0, -23.2), yaw: PI / 4 } ],
    exits: [V3(0, 0, 12.5), V3(7.2, 0, -27)], rescued: p => (p.z > 11.4 && p.z < 30 && Math.abs(p.x) < 22) || (p.z < -25.6 && p.z > -38 && Math.abs(p.x) < 22),
    objectives: [
      { type: 'task', id: 'jam', label: 'Telecom yard e radio jammer bondho koro', stage: 1, at: site.jam, where: 'Radio jammer' },
      { type: 'task', id: 'truck1', label: 'Getaway truck 1 e charge lagao', stage: 1, at: site.t1, where: 'Truck 1' },
      { type: 'task', id: 'truck2', label: 'Getaway truck 2 e charge lagao', stage: 1, at: site.t2, where: 'Truck 2' },
      { type: 'task', id: 'cctv', label: 'Security annex theke bank er CCTV hack koro', stage: 2, at: site.cctv, where: 'Security annex' },
      { type: 'rescue', label: 'Bank er hostage der police line e pathao', stage: 3, at: V3(0, 0, 9.6), where: 'Aurum Bank' },
      { type: 'defuse', intelHint: 'Annex er office ba bank er manager office e wire order', stage: 3, at: V3(0, 0, -22.4), where: 'Vault bomb' },
      { type: 'extract', zone: { x1: -6, z1: -144, x2: 6, z2: -132 }, label: 'Old Town Square er helipad e extraction', stage: 4, at: V3(0, 0, -138), where: 'Extraction' } ],
    bonus: ['leader', 'stealth'],
    timer: { kind: 'bomb', s: { recruit: 1080, veteran: 900, elite: 720 }, startStage: 3 }, executions: true, execCenter: V3(0, 0, -8), execRadius: 45, maxDead: 4, shieldRetreat: V3(0, 0, -21.5),
    stageLines: {
      2: ['Their radio is dead and so are the trucks. Now the security annex across Main Street: take over the bank cameras.', 'Rafi: Oder radio bondho, truck o shesh. Ebar Main Street er opare security annex, bank er camera amader hate nao.'],
      3: ['Cameras are ours. The bomb timer just started. Get into the bank, free the hostages and defuse that vault.', 'Rafi: Camera amader. Bomb er timer chalu hoye geche! Bank e dhuke hostage der chharao ar vault er bomb defuse koro.'],
      4: ['Bank is clear. Bird is waiting at Old Town Square, north. Fight your way to the pad.', 'Rafi: Bank clear. Heli uttore Old Town Square e opekkha korche. Lore helipad e pouchao.'] },
    hawk: V3(-3, 3.6, 24), hawkLine: ['Hawk on the police line in front of the bank. I have Main Street.', 'Hawk: Bank er shamne police line e achi. Main Street amar nojore.'],
    intro: { all: ['Tiger 24, Old Town belongs to them tonight. Kill their radio and both getaway trucks first, then we take the bank.', 'Rafi: Aj raate Old Town ora dokhol koreche. Age oder radio ar duita palanor truck shesh koro, tarpor bank.'] },
    siren: true,
    winLine: ['Wheels up. Hostages safe, vault safe, Old Town is ours again. Outstanding, Tiger 24.', 'Rafi: Heli uthche. Hostage nirapod, vault nirapod, Old Town abar amader. Oshadharon, Tiger 24!'],
    blueprint: { view: [-151, -161, 151, 151], markers: [[site.jam.x, site.jam.z, '1 JAMMER', 'b'], [site.t1.x, site.t1.z, '1 TRUCK', 'b'], [site.t2.x, site.t2.z, '1 TRUCK', 'b'], [site.cctv.x, site.cctv.z, '2 ANNEX', 'b'], [0, -4, '3 BANK · 12', 'h'], [0, -138, '4 EXTRACT', 'b'],
      [-100, -46, '', 'e'], [-120, -60, '', 'e'], [100, -46, '', 'e'], [118, -64, '', 'e'], [-36, 42, '', 'e'], [0, -120, '', 'e'], [0, -60, '', 'e'], [0, 0, '', 'e']] },
  };
}

/* ================= Old Town district around the bank ================= */
function district(m) {
  const LG = K.LG;
  const tiled = (base, rx, rz) => { const t = base.clone(); for (const k of ['map', 'normalMap', 'roughnessMap']) if (t[k]) { t[k] = t[k].clone(); t[k].repeat.set(rx, rz); t[k].needsUpdate = true; } return t; };
  const ground = (x1, z1, x2, z2, base, tile = 4, y = -0.01) => floor(x1, z1, x2, z2, tiled(base, (x2 - x1) / tile, (z2 - z1) / tile), y);
  // facade textures: 4x4 window bays per 16 m tile, some windows lit
  const facade = (seed, wall, lit) => { const r = rng(seed); const draw = (g, w, h, em) => { g.fillStyle = em ? '#000' : wall; g.fillRect(0, 0, w, h);
      if (!em) for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.06})`; g.fillRect(r() * w, r() * h, 3, 3); }
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = i * 128 + 34, y = j * 128 + 30, on = r() < lit;
        if (em) { if (on) { g.fillStyle = r() < 0.5 ? '#ffcf8a' : '#d8e4ff'; g.globalAlpha = 0.5 + r() * 0.5; g.fillRect(x, y, 60, 70); g.globalAlpha = 1; } }
        else { g.fillStyle = '#20262e'; g.fillRect(x - 4, y - 4, 68, 78); g.fillStyle = on ? '#6a5a40' : '#0b0f14'; g.fillRect(x, y, 60, 70); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x, y + 34, 60, 3); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x - 6, y + 74, 72, 6); } }
      if (!em) { g.fillStyle = 'rgba(0,0,0,.25)'; for (let j = 0; j < 4; j++) g.fillRect(0, j * 128 + 122, w, 6); } };
    const map = canvasTex(512, 512, (g, w, h) => draw(g, w, h, false)); const em = canvasTex(512, 512, (g, w, h) => draw(g, w, h, true));
    return M('#ffffff', 0.85, 0, { map, emissive: '#ffffff', emissiveMap: em, emissiveIntensity: 0.9 }); };
  const FAC = [facade(11, '#5b524a', 0.28), facade(12, '#4a4f57', 0.22), facade(13, '#6b5e50', 0.32), facade(14, '#3e4248', 0.18)];
  const roofM = M('#23262a', 0.9); let fi = 0;
  const bldg = (x1, z1, x2, z2, h, o = {}) => { const c = addCollider(x1, 0, z1, x2, h, z2, { vm: o.vm || FAC[fi++ % FAC.length], uv: 16, mat: 'concrete' }); deco(B(x2 - x1 + 0.4, 0.5, z2 - z1 + 0.4), roofM, [(x1 + x2) / 2, h + 0.25, (z1 + z2) / 2], null, null, false);
    deco(B(x2 - x1 + 0.1, 0.8, z2 - z1 + 0.1), M('#2a2724', 0.9), [(x1 + x2) / 2, 0.4, (z1 + z2) / 2], null, null, false); return c; };
  const far = (x1, z1, x2, z2, h) => deco(B(x2 - x1, h, z2 - z1), FAC[fi++ % FAC.length], [(x1 + x2) / 2, h / 2, (z1 + z2) / 2], null, null, false); // outskirts, visual only
  const wallM = tiled(m.concreteWall, 1, 1), brick = m.brick, steel = m.darkSteel;
  const yardWall = (axis, at, a, b, gaps = []) => (axis === 'x' ? wallX : wallZ)(at, a, b, 2.8, wallM, gaps.map(([ga, gb]) => ({ a: ga, b: gb, y0: 0, y1: 2.8 })), { mat: 'concrete' });
  const crate = (x, z, s = 1.2, h = 1.15) => addCollider(x - s / 2, 0, z - s / 2, x + s / 2, h, z + s / 2, { vm: m.woodLight || m.wood, uv: 1.2, mat: 'wood', pen: true });
  const sandbag = (x, z, len, rot) => { const w = rot ? 0.9 : len, d = rot ? len : 0.9; addCollider(x - w / 2, 0, z - d / 2, x + w / 2, 1.05, z + d / 2, { vm: M('#6d6247', 0.95, 0, { normal: 1 }), mat: 'concrete' }); };
  const contM = ['#7a2a22', '#2a4a6a', '#3d5a34', '#8a6a2a'].map(c => M(c, 0.6, 0.4, { map: canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 10) { g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x, 0, 3, h); } g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6); }) }));
  const container = (x, z, rot = false, ci = 0, stack = 1) => { const w = rot ? 2.45 : 6.1, d = rot ? 6.1 : 2.45; for (let s = 0; s < stack; s++) addCollider(x - w / 2, s * 2.6, z - d / 2, x + w / 2, s * 2.6 + 2.6, z + d / 2, { vm: contM[(ci + s) % 4], mat: 'metal' }); };
  const lamp = (x, z, dir = 0, col = '#ffc98a', I = 40) => { deco(C(0.07, 0.1, 6, 8), steel, [x, 3, z]); const hx = x + Math.sin(dir) * 1.2, hz = z + Math.cos(dir) * 1.2; deco(B(0.16, 0.08, 1.3), steel, [(x + hx) / 2, 6, (z + hz) / 2], [0, dir, 0], null, false);
    deco(B(0.5, 0.12, 0.3), new THREE.MeshBasicMaterial({ color: col, toneMapped: false }), [hx, 5.92, hz], [0, dir, 0], null, false); pointLight(col, I, 20, hx, 5.7, hz); };
  const flood = (x, y, z, col = '#dfe8ff', I = 55, dist = 26) => { deco(B(0.5, 0.35, 0.3), new THREE.MeshBasicMaterial({ color: col, toneMapped: false }), [x, y, z], null, null, false); pointLight(col, I, dist, x, y - 0.4, z); };
  const carCols = ['#2b2f36', '#6a1a16', '#c8c8c0', '#1c2a44', '#3a3f2a'];
  const car = (x, z, ry, ci = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; LG.add(g); const body = M(carCols[ci % carCols.length], 0.35, 0.6);
    add(g, RB(1.8, 0.7, 4.3, 0.2, 2), body, [0, 0.62, 0]); add(g, RB(1.6, 0.55, 2.2, 0.2, 2), M('#0d1218', 0.1, 0.8), [0, 1.22, -0.2]); for (const sx of [-0.85, 0.85]) for (const sz of [-1.35, 1.35]) add(g, C(0.33, 0.33, 0.24, 14), m.black, [sx, 0.33, sz], [0, 0, PI / 2]);
    add(g, B(0.3, 0.1, 0.03), new THREE.MeshBasicMaterial({ color: '#ff2a1a' }), [0.6, 0.75, 2.16], null, null, false); add(g, B(0.3, 0.1, 0.03), new THREE.MeshBasicMaterial({ color: '#ff2a1a' }), [-0.6, 0.75, 2.16], null, null, false);
    const hw = Math.abs(Math.cos(ry)) > 0.5 ? [0.95, 2.2] : [2.2, 0.95]; addCollider(x - hw[0], 0, z - hw[1], x + hw[0], 1.25, z + hw[1], { vis: false, mat: 'metal', pen: true }); };
  const truck = (x, z) => { const g = new THREE.Group(); g.position.set(x, 0, z); LG.add(g); const paint = M('#d8d4c8', 0.5, 0.3), cab = M('#7a1410', 0.35, 0.5);
    add(g, B(7.6, 2.7, 2.5), paint, [-1.2, 2.0, 0]); add(g, RB(2.2, 2.3, 2.4, 0.15), cab, [3.9, 1.6, 0]); add(g, B(0.05, 0.9, 2.0), M('#0d1218', 0.1, 0.8), [5.0, 2.1, 0], null, null, false);
    for (const sx of [-4, -2.6, 3.8]) for (const sz of [-1.1, 1.1]) add(g, C(0.5, 0.5, 0.35, 14), m.black, [sx, 0.5, sz], [PI / 2, 0, 0]); add(g, B(9.6, 0.25, 2.3), steel, [-0.2, 0.7, 0]);
    addCollider(x - 5.0, 0, z - 1.3, x + 5.1, 3.35, z + 1.3, { vis: false, mat: 'metal' }); return g; };
  const desk = (x, z, w = 1.6, d = 0.8) => { addCollider(x - w / 2, 0, z - d / 2, x + w / 2, 0.78, z + d / 2, { vm: m.wood, mat: 'wood', pen: true }); };
  const hut = (name, x1, z1, x2, z2, door, h = 3.2) => { // door: {side:'n'|'s'|'e'|'w', at}
    room(name, x1, z1, x2, z2, 'concrete', 0.6, true, h); floor(x1, z1, x2, z2, m.concrete, 0.005); ceiling(x1, z1, x2, z2, h, m.ceiling); deco(B(x2 - x1 + 0.5, 0.25, z2 - z1 + 0.5), roofM, [(x1 + x2) / 2, h + 0.12, (z1 + z2) / 2], null, null, false);
    const op = s => door.side === s ? [{ a: door.at, b: door.at + 1.3, y0: 0, y1: 2.3 }] : [];
    wallX(z1, x1, x2, h, brick, op('n')); wallX(z2, x1, x2, h, brick, op('s')); wallZ(x1, z1, z2, h, brick, op('w')); wallZ(x2, z1, z2, h, brick, op('e'));
    if (door.side === 'n' || door.side === 's') new Door({ axis: 'x', x1: door.at, z: door.side === 'n' ? z1 : z2, w: 1.3 }); else new Door({ axis: 'z', x: door.side === 'w' ? x1 : x2, z1: door.at, w: 1.3 });
    pointLight('#f4f0e0', 18, 9, (x1 + x2) / 2, h - 0.3, (z1 + z2) / 2); deco(B(1.2, 0.05, 0.2), M('#ffffff', 0.4, 0, { emissive: '#fff6e0', emissiveIntensity: 2 }), [(x1 + x2) / 2, h - 0.03, (z1 + z2) / 2], null, null, false); };

  // ---------- ground ----------
  const asph = m.asphalt, pave = m.tile, grass = M('#ffffff', 0.95, 0, { map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#1d2b18'; g.fillRect(0, 0, w, h); const r = rng(5); for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${40 + r() * 40},${60 + r() * 50},${20 + r() * 30},.35)`; g.fillRect(r() * w, r() * h, 1, 3); } }), normal: 0.5 });
  const plaza = M('#ffffff', 0.55, 0.05, { map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#4a4640'; g.fillRect(0, 0, w, h); const r = rng(9); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = `hsl(30,6%,${22 + r() * 9}%)`; g.fillRect(i * 32 + 1, j * 32 + 1, 30, 30); } }), normal: 0.7 });
  ground(-151, -161, 151, 151, grass, 6, -0.03); // base everywhere
  ground(-151, 9.3, 151, 30, asph, 6); ground(-50, -38, 50, -24.6, asph, 6); ground(-151, -100, 151, -86, asph, 6); ground(-62, -100, -50, 151, asph, 6); ground(50, -100, 62, 151, asph, 6);
  ground(-6, -86, 6, -38, plaza, 4, -0.005); ground(-60, -161, 60, -100, plaza, 4, -0.005); ground(-140, -80, -75, -15, m.concrete ? tiled(m.concrete, 1, 1) : asph, 5, -0.005); ground(75, -80, 140, -15, asph, 6, -0.005);
  ground(-150, 30, -62, 151, asph, 6, -0.02); ground(62, 30, 151, 151, asph, 6, -0.02); ground(62, -15, 151, 9.3, asph, 6, -0.02); ground(-151, -15, -62, 9.3, asph, 6, -0.02);
  ground(-151, -86, -62, -80, pave, 3, -0.008); ground(62, -86, 151, -80, pave, 3, -0.008);
  // road markings
  const mark = new THREE.MeshBasicMaterial({ color: '#b8b090' }); for (let x = -146; x < 146; x += 6) if (Math.abs(x) > 24) deco(PL(3, 0.15), mark, [x, 0.005, 19.6], [-PI / 2, 0, 0], null, false);
  for (let z = -96; z < 146; z += 6) { deco(PL(0.15, 3), mark, [-56, 0.005, z], [-PI / 2, 0, 0], null, false); deco(PL(0.15, 3), mark, [56, 0.005, z], [-PI / 2, 0, 0], null, false); }
  // outdoor rooms are registered last so huts/annex (indoor) match first
  const outdoorRooms = () => {
  room('Telecom yard', -140, -80, -75, -15, 'concrete', 0.55, false); room('Truck yard', 75, -80, 140, -15, 'wet', 0.55, false);
  room('Market lane', -6, -86, 6, -38, 'wet', 0.5, false); room('Old Town Square', -62, -161, 62, -100, 'wet', 0.6, false);
  room('Main Street', -151, 9.3, 151, 30, 'wet', 0.7, false); room('Back lane', -50, -38, 50, -24.6, 'wet', 0.45, false); room('North Road', -151, -100, 151, -86, 'wet', 0.55, false);
  room('West Avenue', -62, -100, -50, 151, 'wet', 0.6, false); room('East Avenue', 50, -100, 62, 151, 'wet', 0.6, false); room('Park', -50, 30, 50, 151, 'grass', 0.4, false); room('Quay', 126, 30, 151, 151, 'concrete', 0.5, false);
    room('Old Town', -152, -162, 152, 152, 'wet', 0.55, false); };

  // ---------- perimeter ----------
  for (const [a, b, c, d] of [[-152, -162, 152, -161], [-152, 151, 152, 152], [-152, -162, -151, 152], [151, -162, 152, 152]]) addCollider(a, 0, b, c, 8, d, { vis: false });
  far(-160, -175, 160, -161, 22); far(-175, -170, -151, 160, 18); far(-160, 152, 40, 166, 14); // skyline walls

  // ---------- blocks beside the bank (alleys at x=±13..22 and ±34..37) ----------
  bldg(-34, -25, -22, 9.3, 15); bldg(-50, -25, -37, 9.3, 18); bldg(22, -25, 34, 9.3, 14); bldg(37, -25, 50, 9.3, 19);
  // north blocks between Back lane and North Road (Market lane at x -6..6)
  bldg(-50, -86, -28, -62, 16); bldg(-25, -86, -6, -62, 13); bldg(-50, -59, -28, -38, 12); bldg(-25, -59, -6, -38, 17);
  bldg(6, -86, 25, -62, 15); bldg(28, -86, 50, -62, 18); bldg(6, -59, 25, -38, 12); bldg(28, -59, 50, -38, 14);
  // south of the yards, along Main Street
  bldg(-145, -12, -118, 4, 12); bldg(-110, -12, -85, 4, 10); bldg(85, -12, 110, 4, 10); bldg(118, -12, 145, 4, 13);
  // residential west / east of the park
  for (const [x1, x2] of [[-145, -118], [-110, -70]]) for (const [z1, z2] of [[38, 76], [86, 116], [124, 146]]) bldg(x1, z1, x2, z2, 9 + ((x1 * 7 + z1) & 7));
  for (const [x1, x2] of [[70, 92], [100, 120]]) for (const [z1, z2] of [[38, 76], [86, 116], [124, 146]]) bldg(x1, z1, x2, z2, 9 + ((x1 * 5 + z1) & 7));
  // around the square
  bldg(-150, -150, -66, -106, 14); bldg(66, -150, 150, -106, 15); bldg(-150, -160, -66, -152, 8); bldg(66, -160, 150, -152, 8);
  bldg(-60, -160, -14, -155, 16); bldg(14, -160, 60, -155, 16); bldg(-150, -82, -142, -18, 10); bldg(142, -82, 150, -18, 10);

  // ---------- street furniture ----------
  for (let x = -140; x <= 140; x += 24) if (Math.abs(x) > 26) { lamp(x, 30.4, PI); lamp(x + 12, 9.6, 0); }
  for (let z = -90; z <= 140; z += 26) { lamp(-62.4, z, PI / 2); lamp(62.4, z + 13, -PI / 2); }
  for (let x = -40; x <= 40; x += 26) lamp(x, -24.8, PI);
  for (let x = -130; x <= 130; x += 28) lamp(x, -86.2, PI);
  [[-80, 14, 0], [-74, 25, PI], [-120, 14, 0], [44, 26, PI], [96, 14, 0], [130, 25, PI], [-30, 26, PI], [-59, -10, PI / 2], [53, 44, PI / 2], [-59, 98, PI / 2], [59, 60, PI / 2], [-30, -91, 0], [70, -96, PI], [-110, -90, 0], [-20, -34, PI / 2], [26, -29, PI / 2]].forEach(([x, z, r], i) => car(x, z, Math.abs(r) === PI / 2 ? 0 : r + PI / 2, i));
  for (const [x, z] of [[-40, 28], [40, 28], [-90, 28], [-130, 28], [90, 28], [130, 28]]) { addCollider(x - 0.4, 0, z - 0.4, x + 0.4, 1.0, z + 0.4, { vm: M('#2f5a2a', 0.5, 0.3), mat: 'metal' }); }
  for (const [x, z] of [[-30, -28], [30, -36], [-44, -30], [44, -30]]) { addCollider(x - 0.9, 0, z - 0.6, x + 0.9, 1.3, z + 0.6, { vm: M('#24402a', 0.6, 0.4), mat: 'metal' }); } // dumpsters
  // market lane stalls
  for (let z = -82; z <= -42; z += 8) { for (const sx of [-4.4, 4.4]) { addCollider(sx - 0.8, 0, z - 1.4, sx + 0.8, 1.0, z + 1.4, { vm: m.wood, mat: 'wood', pen: true }); deco(B(2.2, 0.05, 3.4), M(['#7a2020', '#20507a', '#6a6a20'][(z / 8 + 12) % 3 | 0], 0.8), [sx, 2.4, z], [0, 0, sx > 0 ? -0.15 : 0.15], null, false); } if (z % 16 === 0) crate(rr(-1.2, 1.2), z + 4); }
  for (let z = -80; z <= -44; z += 12) pointLight('#ffb070', 22, 11, 0, 3.2, z);

  // ---------- STAGE 1A: telecom yard (west) ----------
  yardWall('z', -75, -80, -15, [[-52, -44]]); yardWall('z', -140, -80, -15); yardWall('x', -80, -140, -75, [[-112, -106]]); yardWall('x', -15, -140, -75, [[-90, -86]]);
  for (const z of [-52, -44]) deco(B(0.5, 3.6, 0.5), steel, [-75, 1.8, z]);
  // radio mast: lattice tower with blinking light
  { const mx = -120, mz = -60; addCollider(mx - 1.6, 0, mz - 1.6, mx + 1.6, 1.2, mz + 1.6, { vm: m.concrete, mat: 'concrete' }); const g = new THREE.Group(); g.position.set(mx, 1.2, mz); LG.add(g); const lat = M('#8a8f94', 0.5, 0.7);
    for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4; add(g, C(0.07, 0.09, 30, 6), lat, [Math.cos(a) * 1.0, 15, Math.sin(a) * 1.0], [Math.sin(a) * 0.05, 0, -Math.cos(a) * 0.05], null, false); }
    for (let y = 2; y < 30; y += 2.5) add(g, new THREE.TorusGeometry(1.05 - y * 0.02, 0.03, 4, 4), lat, [0, y, 0], [PI / 2, 0, PI / 4], null, false);
    for (const [y, r] of [[18, 0], [23, 2.1], [26, 4]]) add(g, C(0.7, 0.7, 0.25, 16), M('#d8d8d0', 0.5), [Math.cos(r) * 1.1, y, Math.sin(r) * 1.1], [PI / 2, 0, r], null, false);
    add(g, SP(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff2a1a', toneMapped: false }), [0, 30.3, 0], null, null, false); pointLight('#ff3020', 6, 10, mx, 30, mz); }
  hut('Control hut', -105, -40, -93, -30, { side: 's', at: -100.6 });
  desk(-99, -39.2, 3.2, 0.9); desk(-103.8, -35, 0.9, 2.4); for (const x of [-100.2, -98.6]) prop('monitor', x, 0.78, -39.3);
  const jamPos = V3(-97.4, 1.0, -39.2); const jamG = K.pickupModel('console', jamPos); add(jamG, B(0.5, 0.4, 0.3), M('#1a1d22', 0.5, 0.5), [0.6, 0.0, 0]);
  K.addInteractable('task', jamPos, 'Radio jammer bondho koro', jamG, { id: 'jam', hold: 3, done: 'Jammer bondho! Gang er radio dead', onUse: () => { pointLight('#30ff70', 4, 4, jamPos.x, 1.4, jamPos.z); } });
  addCollider(-92.8, 0, -38, -91, 2.2, -33.5, { vm: m.darkSteel, mat: 'metal' }); // generator outside hut
  for (const [x, z, r, ci, s] of [[-126, -30, false, 0, 2], [-126, -24, false, 1, 1], [-86, -70, true, 2, 1], [-108, -72, false, 3, 2], [-132, -48, true, 1, 1], [-90, -24, false, 2, 1]]) container(x, z, r, ci, s);
  for (const [x, z] of [[-84, -40], [-85.5, -40], [-84, -58], [-111, -46], [-111, -47.4], [-116, -30], [-96, -60], [-97.3, -61], [-130, -64]]) crate(x, z);
  sandbag(-81, -38, 3.6, true); sandbag(-81, -58, 3.6, true);
  for (const [x, z] of [[-76, -40], [-76, -56], [-139, -78], [-139, -17], [-100, -79]]) flood(x + (x < -100 ? 0.6 : -0.6), 4.2, z);

  // ---------- STAGE 1B: truck yard (east) ----------
  yardWall('z', 75, -80, -15, [[-52, -44]]); yardWall('z', 140, -80, -15); yardWall('x', -80, 75, 140, [[106, 112]]); yardWall('x', -15, 75, 140, [[86, 90]]);
  for (const z of [-52, -44]) deco(B(0.5, 3.6, 0.5), steel, [75, 1.8, z]);
  truck(100, -40); truck(118, -62);
  const mkCharge = (pos, id, label) => { const g = new THREE.Group(); g.position.copy(pos); LG.add(g); add(g, B(0.3, 0.3, 0.12), M('#3a3a2a', 0.7), [0, 0, 0]); add(g, B(0.08, 0.04, 0.02), new THREE.MeshBasicMaterial({ color: '#ff2020', toneMapped: false }), [0, 0.08, 0.07], null, null, false); g.visible = false;
    K.addInteractable('task', pos, label, g, { id, hold: 2.5, done: 'Charge laga hoyeche · 5 second!', onUse: () => { g.visible = true; setTimeout(() => { if (G.state === 'lobby' || !g.parent) return; const p = V3(pos.x, 1.6, pos.z); A.boom(p); FX.light(p, '#ffa040', 500, 1.2, 50); FX.puff(p, { count: 30, size: 2.2, life: 6, rise: 1.4, color: '#1a1714', spread: 2.5 }); FX.emit(p, V3(0, 1, 0), 120, '#ffb050', 14, 0.6, 3); emitNoise(p, 70, 'explosion');
        pointLight('#ff7a30', 30, 14, pos.x, 2.5, pos.z); FX.puff(V3(pos.x, 3.2, pos.z), { count: 18, size: 2.5, life: 14, rise: 1.6, color: '#151210', spread: 1.5 }); g.visible = false; }, 5000); } }); };
  mkCharge(V3(100.5, 1.1, -38.6), 'truck1', 'Truck 1 e charge lagao'); mkCharge(V3(118.5, 1.1, -60.6), 'truck2', 'Truck 2 e charge lagao');
  hut('Yard office', 124, -50, 136, -40, { side: 'w', at: -45.6 }); desk(130, -48.8, 2.4, 0.8); prop('monitor', 130, 0.78, -48.9);
  for (const [x, z, r, ci, s] of [[90, -70, false, 0, 2], [98, -76, false, 1, 1], [132, -24, false, 3, 2], [126, -30, false, 2, 1], [86, -24, true, 0, 1], [110, -26, false, 1, 2], [134, -70, true, 2, 1]]) container(x, z, r, ci, s);
  for (const [x, z] of [[82, -40], [83.4, -40], [82, -58], [108, -52], [109.4, -52], [96, -56], [120, -44], [126, -66]]) crate(x, z);
  sandbag(81, -38, 3.6, true); sandbag(81, -58, 3.6, true);
  for (const [x, z] of [[76, -38], [76, -58], [139, -78], [139, -17], [110, -79]]) flood(x + (x > 100 ? -0.6 : 0.6), 4.2, z);

  // ---------- STAGE 2: security annex (park, across Main Street) ----------
  { const x1 = -46, x2 = -24, z1 = 34, z2 = 52, h = 3.6; room('Server room', x1, 43, x2, z2, 'tile', 0.55, true, h); room('Annex office', x1, z1, x2, 43, 'tile', 0.75, true, h);
    floor(x1, z1, x2, z2, m.tile, 0.005); ceiling(x1, z1, x2, z2, h, m.ceiling); deco(B(x2 - x1 + 0.6, 0.3, z2 - z1 + 0.6), roofM, [(x1 + x2) / 2, h + 0.15, (z1 + z2) / 2], null, null, false);
    wallX(z1, x1, x2, h, m.plaster, [{ a: -36, b: -34.7, y0: 0, y1: 2.3 }, { a: -44, b: -40, y0: 1.0, y1: 2.6 }, { a: -30, b: -26, y0: 1.0, y1: 2.6 }]); wallX(z2, x1, x2, h, m.plaster, [{ a: -30, b: -28.7, y0: 0, y1: 2.3 }]);
    wallZ(x1, z1, z2, h, m.plaster, [{ a: 37, b: 40, y0: 1.0, y1: 2.6 }]); wallZ(x2, z1, z2, h, m.plaster, [{ a: 37, b: 40, y0: 1.0, y1: 2.6 }]); wallX(43, x1, x2, h, m.drywall || m.plaster, [{ a: -36, b: -34.7, y0: 0, y1: 2.3 }]);
    for (const [a, b] of [[-44, -40], [-30, -26]]) addGlass(a, 1.0, z1 - 0.04, b, 2.6, z1 + 0.04); addGlass(x1 - 0.04, 1.0, 37, x1 + 0.04, 2.6, 40); addGlass(x2 - 0.04, 1.0, 37, x2 + 0.04, 2.6, 40);
    new Door({ axis: 'x', x1: -36, z: z1, w: 1.3, glassDoor: true }); new Door({ axis: 'x', x1: -30, z: z2, w: 1.3, locked: true, name: 'annexBack' }); new Door({ axis: 'x', x1: -36, z: 43, w: 1.3 });
    desk(-42, 38, 1.8, 0.8); desk(-28, 38, 1.8, 0.8); desk(-35, 40.6, 3.0, 0.8); prop('office', -42, 0, 39); prop('office', -28, 0, 39); prop('monitor', -35.5, 0.78, 40.6); prop('monitor', -34.3, 0.78, 40.6); prop('box', -45, 0, 35.2);
    for (let x = -44; x <= -32; x += 2.4) addCollider(x - 0.4, 0, 48.6, x + 0.4, 2.1, 50, { vm: M('#15181c', 0.4, 0.6), mat: 'metal' }); // server racks
    for (let x = -44; x <= -32; x += 2.4) deco(PL(0.6, 1.6), new THREE.MeshBasicMaterial({ color: '#103a2a', toneMapped: false }), [x, 1.1, 48.58], [0, PI, 0], null, false);
    desk(-27, 47.5, 0.9, 3.0); for (const [x, z] of [[-34.5, 37.5], [-34.5, 48]]) { pointLight('#e8f0ff', 22, 10, x, h - 0.3, z); deco(B(1.2, 0.05, 0.2), M('#ffffff', 0.4, 0, { emissive: '#eef4ff', emissiveIntensity: 2 }), [x, h - 0.03, z], null, null, false); }
    K.addInteractable('intel', V3(-41.6, 0.8, 37.8), 'Bomb er wire order note', K.pickupModel('intel', V3(-41.6, 0.8, 37.8)));
    K.addInteractable('ammo', V3(-44.6, 0.3, 46), 'Ammo refill', K.pickupModel('ammo', V3(-44.6, 0.3, 46)));
    flood(-35, 3.3, 33.75, '#ffe0b0', 6, 9); }
  const cctvPos = V3(-27, 1.0, 47.5); const cctvG = K.pickupModel('console', cctvPos, -PI / 2);
  K.addInteractable('task', cctvPos, 'Bank er CCTV hack koro', cctvG, { id: 'cctv', hold: 3.5, done: 'Bank er camera amader dokhole!', req: () => (G.stage || 1) >= 2, onUse: () => { G.hooks.console && G.hooks.console({}); } });

  // ---------- park (LZ) ----------
  for (let i = 0; i < 46; i++) { const x = rr(-46, 46), z = rr(58, 148); if (Math.abs(x) < 9 && z > 112) continue; if (Math.abs(x) < 3) continue; K.tree(x, z, rr(0.9, 1.4)); }
  for (let i = 0; i < 14; i++) { const x = rr(-18, 46), z = rr(32, 56); K.tree(x, z, rr(0.9, 1.3)); }
  for (let i = 0; i < 40; i++) K.bush(rr(-48, 48), rr(32, 148), rr(0.8, 1.6));
  ground(-2.5, 30, 2.5, 150, plaza, 4, -0.01); ground(-48, 88, 48, 92, plaza, 4, -0.01);
  for (const z of [60, 90, 120]) for (const sx of [-4, 4]) addCollider(sx - 0.3, 0, z - 1, sx + 0.3, 0.5, z + 1, { vm: m.wood, mat: 'wood', pen: true }); // benches
  { addCollider(-4, 0, 68, 4, 0.6, 76, { vm: m.concrete, mat: 'concrete' }); deco(C(0.6, 0.9, 3, 10), m.concrete, [0, 2.1, 72]); } // war memorial plinth
  for (let z = 40; z < 150; z += 22) { lamp(3.2, z, -PI / 2, '#ffd8a0', 30); }
  ground(-8, 120, 8, 136, M('#3a3a36', 0.7), 4, 0.0); deco(new THREE.RingGeometry(4, 4.5, 32), new THREE.MeshBasicMaterial({ color: '#c8c4b0' }), [0, 0.012, 128], [-PI / 2, 0, 0], null, false);

  // ---------- quay (east, river) ----------
  addCollider(146, 0, 30, 147, 1.0, 151, { vm: m.darkSteel, mat: 'metal' }); deco(B(40, 0.1, 140), M('#081016', 0.05, 0.3, { transparent: true, opacity: 0.92 }), [167, -1.6, 90], null, null, false);
  for (const z of [40, 70, 100]) container(136, z, true, z / 10 | 0, 1); for (const [x, z] of [[132, 56], [133.4, 56], [140, 84], [131, 112]]) crate(x, z); for (let z = 36; z < 150; z += 22) flood(145.4, 5, z, '#ffd090', 30, 18);

  // ---------- STAGE 4: Old Town Square ----------
  { addCollider(-5, 0, -123, 5, 0.85, -113, { vm: M('#8a8478', 0.6, 0, { normal: 0.8 }), mat: 'concrete' }); deco(C(1.2, 1.5, 2.4, 16), M('#8a8478', 0.6), [0, 2.0, -118]); deco(C(4.3, 4.3, 0.05, 32), M('#0a1a22', 0.05, 0.4), [0, 0.86, -118], null, null, false); }
  for (const [x, z] of [[-30, -112], [30, -112], [-30, -140], [30, -140]]) { addCollider(x - 1.2, 0, z - 1.2, x + 1.2, 1.2, z + 1.2, { vm: M('#8a8478', 0.6), mat: 'concrete' }); deco(C(0.35, 0.45, 3.6, 10), M('#6a645a', 0.5, 0.2), [x, 3.0, z]); } // statues
  for (const [x, z, l, r] of [[-14, -108, 4, false], [14, -108, 4, false], [-20, -126, 4, true], [20, -126, 4, true], [-8, -144, 3.6, false], [8, -144, 3.6, false], [-42, -122, 4, true], [42, -122, 4, true], [0, -103, 5, false]]) sandbag(x, z, l, r);
  for (const [x, z] of [[-48, -108], [48, -108], [-48, -146], [48, -146]]) { addCollider(x - 1.6, 0, z - 1.2, x + 1.6, 2.4, z + 1.2, { vm: M('#5a3a24', 0.8), mat: 'wood', pen: true }); deco(B(3.8, 0.1, 2.8), M('#7a2020', 0.8), [x, 2.6, z], null, null, false); } // kiosks
  for (const [x, z, r] of [[-24, -134, 0], [24, -134, PI], [-36, -104, PI / 2]]) car(x, z, r, (x + 99) | 0);
  container(-50, -132, true, 1, 1); container(50, -132, true, 3, 1);
  for (const [x, z] of [[-56, -104], [56, -104], [-56, -156], [56, -156], [-20, -154], [20, -154], [-58, -130], [58, -130]]) lamp(x, z, x < 0 ? PI / 2 : -PI / 2, '#ffcf90', 40);
  // helipad + extraction bird
  deco(C(7, 7, 0.06, 40), M('#3a3c40', 0.7), [0, 0.03, -138], null, null, false); deco(new THREE.RingGeometry(5.6, 6.0, 40), new THREE.MeshBasicMaterial({ color: '#e8e0c0' }), [0, 0.07, -138], [-PI / 2, 0, 0], null, false);
  deco(PL(0.8, 4.4), new THREE.MeshBasicMaterial({ color: '#e8e0c0' }), [-1.3, 0.071, -138], [-PI / 2, 0, 0], null, false); deco(PL(0.8, 4.4), new THREE.MeshBasicMaterial({ color: '#e8e0c0' }), [1.3, 0.071, -138], [-PI / 2, 0, 0], null, false); deco(PL(1.8, 0.7), new THREE.MeshBasicMaterial({ color: '#e8e0c0' }), [0, 0.071, -138], [-PI / 2, 0, 0], null, false);
  for (let i = 0; i < 8; i++) { const a = i * PI / 4; deco(SP(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: '#30ff60', toneMapped: false }), [Math.cos(a) * 6.6, 0.15, -138 + Math.sin(a) * 6.6], null, null, false); }
  K.heliModel(V3(0, 0, -151.5), 0, '#2f342b'); pointLight('#d8ffe0', 30, 18, 0, 6, -138);
  outdoorRooms();
  return { jam: V3(jamPos.x, 0, jamPos.z), t1: V3(100.5, 0, -38.6), t2: V3(118.5, 0, -60.6), cctv: V3(cctvPos.x, 0, cctvPos.z) };
}
