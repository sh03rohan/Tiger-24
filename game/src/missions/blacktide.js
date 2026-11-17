// Mission 10 — Operation Black Tide: offshore oil rig in a storm; shut the gas valves, free the crew, evacuate by helipad
import { THREE, G, PI, M, B, RB, C, SP, PL, RX, add, canvasTex, rng, R, rr, V3, FX } from '../core.js';
import * as K from '../levelkit.js';
const { addCollider, wallX, wallZ, floor, ceiling, deco, pointLight, room, prop, Door } = K;

export const meta = { id: 'blacktide', no: '10', name: 'Operation Black Tide', art: 'rig', type: 'Sabotage · rescue', loc: 'Bay of Bengal · Rig Meghna-7', time: '23:15 hrs · jhor', diff: 'Elite',
  obj: ['3 ta gas valve bondho kora', '5 jon rig worker ke helipad e pouchano', 'Red Tide er gunman der shamlano'], intel: 'Red Tide rig er gas line khule diyeche, jekono shomoy agun lagte pare. Worker ra mess hall e atka. Jhorer karone heli shudhu helipad e namte parbe.' };

let water = null, flare = null, flareL = null, beacons = [];
export function build() {
  K.beginLevel({ skyEnv: true, grade: { sat: 0.88, contrast: 1.12, sh: [0.9, 0.98, 1.1], hi: [1.02, 1.02, 1.0] }, bg: '#05080c', fog: '#141c24', fogD: 0.014, sun: 2.2, sunColor: '#9ab0d0', sunPos: [-15, 30, 20], sunTarget: [0, 0, 0], shadowSize: 28, hemi: 4.0, hemiSky: '#5a6a84', envI: 0.45, hemiGround: '#0a0c10',
    rain: [[-26, -22, 26, 22]], rainN: 3200, lightning: true, alarmPos: [0, 6, 0], alarmBulbs: [[-8.2, 3, 8], [8.2, 3, 11], [0, 4, -3.2]], skyTop: '#05070c', skyBottom: '#1a2430', city: false, skyDist: 110, alarmLight: true });
  const LG = K.LG, m = K.makeMaterials();
  const grate = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#3a3e42'; g.fillRect(0, 0, w, h); g.strokeStyle = '#22262a'; g.lineWidth = 3; for (let i = 0; i <= w; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } const r = rng(3); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(90,60,30,${r() * 0.25})`; g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 20, 4 + r() * 12, r() * 3, 0, 7); g.fill(); } }, { repeat: [12, 10] });
  const deckM = M('#ffffff', 0.45, 0.6, { map: grate }), yellow = M('#d9a21b', 0.55, 0.3), red = M('#a8261c', 0.5, 0.3), white = M('#d8dad6', 0.6, 0.2), rust = M('#6a4a32', 0.8, 0.4);
  room('Mess hall', -22, 4, -15, 18, 'metal', 0.75); room('Quarters', -15, 4, -8, 18, 'metal', 0.6); room('Control room', 8, 6, 20, 16, 'metal', 0.8);
  room('Helipad', 12, -18, 22, -8, 'metal', 0.35, false); room('Drill floor', -3.5, -3.5, 3.5, 3.5, 'metal', 0.55, false); room('Deck', -23, -19, 23, 19, 'metal', 0.4, false);
  floor(-23, -19, 23, 19, deckM); deco(B(46, 1.6, 38), rust, [0, -0.82, 0]);
  // sea + legs
  const wv = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#0d1a22'; g.fillRect(0, 0, w, h); const r = rng(77); for (let i = 0; i < 260; i++) { const x = r() * w, y = r() * h, s = 10 + r() * 40; const gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(120,150,170,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2); } }, { repeat: [40, 40] });
  water = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), M('#ffffff', 0.08, 0.3, { map: wv, normal: 3 })); water.rotation.x = -PI / 2; water.position.y = -24; LG.add(water);
  for (const [x, z] of [[-19, -15], [19, -15], [-19, 15], [19, 15]]) { deco(C(1.8, 2.2, 24, 20), M('#c9b23a', 0.6, 0.4), [x, -13, z]); for (let y = -20; y < -2; y += 6) deco(C(0.25, 0.25, 30, 8), rust, [x === 19 ? 0 : 0, y, z], [0, 0, PI / 2], null, false); }
  for (let y = -20; y < -2; y += 6) for (const x of [-19, 19]) deco(C(0.25, 0.25, 30, 8), rust, [x, y, 0], RX, null, false);
  // rails (low cover) + invisible outer wall
  const railM = M('#d9a21b', 0.5, 0.4);
  for (const [x1, z1, x2, z2] of [[-23, -19, 23, -18.9], [-23, 18.9, 23, 19], [-23, -19, -22.9, 19], [22.9, -19, 23, 19]]) { addCollider(x1, 0, z1, x2, 1.1, z2, { vis: false, mat: 'metal', pen: true }); addCollider(x1, 1.1, z1, x2, 4, z2, { vis: false, nav: false }); }
  for (let x = -22.5; x <= 22.5; x += 1.5) for (const z of [-18.95, 18.95]) deco(B(0.06, 1.1, 0.06), railM, [x, 0.55, z], null, null, false);
  for (let z = -18.5; z <= 18.5; z += 1.5) for (const x of [-22.95, 22.95]) deco(B(0.06, 1.1, 0.06), railM, [x, 0.55, z], null, null, false);
  for (const z of [-18.95, 18.95]) for (const y of [0.5, 1.08]) deco(B(46, 0.05, 0.05), railM, [0, y, z], null, null, false);
  for (const x of [-22.95, 22.95]) for (const y of [0.5, 1.08]) deco(B(0.05, 0.05, 38), railM, [x, y, 0], null, null, false);
  // ---- living quarters (mess hall + corridor)
  const wallM = M('#ffffff', 0.7, 0.2, { map: canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#c9cbc6'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x, 0, 2, h); } const r = rng(5); for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(110,70,40,${r() * 0.18})`; g.fillRect(r() * w, r() * h * 0.3 + h * 0.7, 2 + r() * 6, 10 + r() * 30); } }, { repeat: [4, 1] }) });
  wallX(4, -22, -8, 3.2, wallM, [{ a: -13, b: -11.8, y0: 0, y1: 2.3 }, { a: -20, b: -18.2, y0: 1.1, y1: 2.2 }], { mat: 'metal' }); wallX(18, -22, -8, 3.2, wallM, [], { mat: 'metal' });
  wallZ(-22, 4, 18, 3.2, wallM, [], { mat: 'metal' }); wallZ(-8, 4, 18, 3.2, wallM, [{ a: 9, b: 10.2, y0: 0, y1: 2.3 }], { mat: 'metal' }); wallZ(-15, 4, 18, 3.2, m.drywall, [{ a: 12, b: 13.2, y0: 0, y1: 2.3 }, { a: 6, b: 7.2, y0: 0, y1: 2.3 }]);
  K.addGlass(-20, 1.1, 3.96, -18.2, 2.2, 4.04);
  floor(-22, 4, -8, 18, M('#ffffff', 0.4, 0.05, { map: m.tile.map }), 0.005); ceiling(-22, 4, -8, 18, 3.2, m.ceilingDark);
  for (const z of [7.5, 11, 14.5]) { addCollider(-19.9, 0, z - 0.5, -16.0, 0.76, z + 0.5, { vm: m.woodLight, mat: 'wood', pen: true }); for (const x of [-19.3, -17.95, -16.6]) { prop('chair', x, 0, z - 0.9, 0); prop('chair', x, 0, z + 0.9, PI); } }
  addCollider(-21.9, 0, 16.6, -18, 1.0, 17.9, { vm: m.steel, mat: 'metal' }); deco(B(3.8, 0.05, 1.2), m.darkSteel, [-19.95, 1.02, 17.25]);
  for (const z of [5, 8, 15.5]) { addCollider(-14.9, 0, z, -12.9, 0.6, z + 1.9, { vm: M('#4a5a6a', 0.8), mat: 'wood', pen: true }); deco(B(2, 0.06, 1.9), m.white, [-13.9, 1.6, z + 0.95]); }
  for (const x of [-18.5, -11.5]) for (const z of [8, 14]) deco(B(1.4, 0.05, 0.3), m.fluo, [x, 3.17, z], null, null, false);
  new Door({ axis: 'x', x1: -13, z: 4, w: 1.2, name: 'quarters' }); new Door({ axis: 'z', x: -8, z1: 9, w: 1.2 }); new Door({ axis: 'z', x: -15, z1: 12, w: 1.2, name: 'mess' }); new Door({ axis: 'z', x: -15, z1: 6, w: 1.2 });
  // ---- control room (glass front)
  wallX(16, 8, 20, 3.2, wallM, [], { mat: 'metal' }); wallZ(20, 6, 16, 3.2, wallM, [], { mat: 'metal' }); wallZ(8, 6, 16, 3.2, wallM, [{ a: 10, b: 11.2, y0: 0, y1: 2.3 }], { mat: 'metal' });
  wallX(6, 8, 20, 3.2, wallM, [{ a: 9.5, b: 19, y0: 1.0, y1: 2.6 }], { mat: 'metal' }); K.addGlass(9.5, 1.0, 5.96, 19, 2.6, 6.04);
  floor(8, 6, 20, 16, m.office.map ? M('#ffffff', 0.9, 0, { map: m.carpet.map }) : m.carpet, 0.005); ceiling(8, 6, 20, 16, 3.2, m.ceiling);
  addCollider(10, 0, 7, 19, 0.95, 7.9, { vm: m.darkSteel, mat: 'metal' }); for (let x = 10.6; x < 19; x += 1.1) deco(PL(0.8, 0.45), new THREE.MeshBasicMaterial({ color: x % 2.2 < 1.1 ? '#3ac0ff' : '#ffb03a', toneMapped: false }), [x, 1.2, 7.95], [-0.4, PI, 0], null, false);
  addCollider(12, 0, 11, 16, 0.76, 12.6, { vm: m.wood, mat: 'wood', pen: true }); for (const x of [12.8, 15.2]) prop('office', x, 0, 13.4, PI); addCollider(19.3, 0, 12, 19.95, 2.2, 15.8, { vm: m.darkSteel, mat: 'metal' });
  new Door({ axis: 'z', x: 8, z1: 10, w: 1.2, name: 'control' }); for (const x of [11, 17]) deco(B(1.4, 0.05, 0.3), m.fluo, [x, 3.17, 11], null, null, false);
  // ---- drill floor + derrick
  addCollider(-3.5, 0, -3.5, -2.9, 2.5, -2.9, { vm: red, mat: 'metal' }); addCollider(2.9, 0, -3.5, 3.5, 2.5, -2.9, { vm: red, mat: 'metal' }); addCollider(-3.5, 0, 2.9, -2.9, 2.5, 3.5, { vm: red, mat: 'metal' }); addCollider(2.9, 0, 2.9, 3.5, 2.5, 3.5, { vm: red, mat: 'metal' });
  addCollider(-2.2, 0, 1.2, -0.6, 1.5, 2.6, { vm: M('#2a4a6a', 0.6, 0.4), mat: 'metal' }); deco(C(0.35, 0.35, 1.2, 14), m.steel, [0.6, 0.6, -0.6]); addCollider(0.25, 0, -0.95, 0.95, 1.2, -0.25, { vis: false, mat: 'metal' });
  const der = new THREE.Group(); LG.add(der); const legs = [[-3.2, -3.2], [3.2, -3.2], [-3.2, 3.2], [3.2, 3.2]];
  for (const [x, z] of legs) { const top = V3(x * 0.25, 30, z * 0.25), bot = V3(x, 2.5, z); const len = top.distanceTo(bot); const l = add(der, B(0.28, len, 0.28), red, [(x + top.x) / 2, (2.5 + 30) / 2, (z + top.z) / 2]); l.lookAt(top); l.rotateX(PI / 2); }
  for (let y = 4; y < 29; y += 3.2) { const s = 3.2 - (y - 2.5) / 27.5 * 2.4; for (const [a, b, c, d] of [[-s, -s, s, -s], [-s, s, s, s], [-s, -s, -s, s], [s, -s, s, s]]) { const l = add(der, B(Math.hypot(c - a, d - b), 0.12, 0.12), red, [(a + c) / 2, y, (b + d) / 2]); l.rotation.y = -Math.atan2(d - b, c - a); } }
  beacons.push(add(der, SP(0.2, 10, 8), new THREE.MeshBasicMaterial({ color: '#ff2020', toneMapped: false }), [0, 30.4, 0], null, null, false));
  // ---- pipe racks, containers, tanks
  for (const [x1, x2] of [[-19, -10], [-7, 4]]) { addCollider(x1, 0, -10.6, x2, 1.05, -9.4, { vis: false, mat: 'metal' }); for (let i = 0; i < 4; i++) deco(C(0.22, 0.22, x2 - x1, 12), i % 2 ? yellow : m.steel, [(x1 + x2) / 2, 0.25 + Math.floor(i / 2) * 0.48, -10.3 + (i % 2) * 0.55], [0, 0, PI / 2]); for (let x = x1 + 0.5; x < x2; x += 3) deco(B(0.12, 1.1, 1.3), m.darkSteel, [x, 0.55, -10]); }
  const cont = (x, z, ry, col) => { const w = ry ? 2.45 : 6.06, d = ry ? 6.06 : 2.45; addCollider(x - w / 2, 0, z - d / 2, x + w / 2, 2.6, z + d / 2, { vis: false, mat: 'metal' }); const g = deco(B(6.06, 2.6, 2.45), M(col, 0.55, 0.45, { map: K.makeMaterials().corr.map }), [x, 1.3, z], [0, ry ? PI / 2 : 0, 0]); return g; };
  cont(-12, -4, 0, '#2a5a8a'); cont(9, -3, 1, '#8a3a2a'); cont(-18.5, -15.5, 0, '#3a6a3a'); cont(6, -15, 0, '#7a6a2a'); cont(-4, 9.8, 0, '#6a2a5a');
  for (const [x, z] of [[17.5, 0], [20.5, 0]]) { deco(C(1.3, 1.3, 3.6, 20), white, [x, 1.8, z]); addCollider(x - 1.3, 0, z - 1.3, x + 1.3, 3.6, z + 1.3, { vis: false, mat: 'metal' }); }
  // ---- helipad
  const hp = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#2a4a3a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e8e2c0'; g.lineWidth = 14; g.beginPath(); g.arc(w / 2, h / 2, w * 0.38, 0, PI * 2); g.stroke(); g.fillStyle = '#e8e2c0'; g.font = '900 230px sans-serif'; g.textAlign = 'center'; g.fillText('H', w / 2, h / 2 + 80); g.strokeStyle = '#d9a21b'; g.lineWidth = 18; g.strokeRect(9, 9, w - 18, h - 18); });
  deco(PL(10, 10), M('#ffffff', 0.6, 0.1, { map: hp }), [17, 0.01, -13], [-PI / 2, 0, 0], null, false);
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; beacons.push(deco(SP(0.07, 6, 4), new THREE.MeshBasicMaterial({ color: '#40ff70', toneMapped: false }), [17 + Math.cos(a) * 4.8, 0.06, -13 + Math.sin(a) * 4.8], null, null, false)); }
  // ---- crane + flare boom
  deco(C(1, 1.2, 8, 14), yellow, [20, 4, 16.5]); deco(B(2.4, 2.2, 2.6), yellow, [20, 9, 16.5]); const boom = deco(B(0.6, 0.6, 22), yellow, [14, 13, 9], [0.45, -0.7, 0]); boom.castShadow = true;
  addCollider(18.8, 0, 15.3, 21.2, 3, 17.7, { vis: false, mat: 'metal' });
  const fb = deco(B(0.5, 0.5, 18), rust, [-28, 6, -24], [0.35, -0.78, 0]); flare = deco(SP(1.0, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffb040', toneMapped: false, transparent: true, opacity: 0.9 }), [-34.5, 9.2, -30.5], null, null, false); flareL = pointLight('#ff9030', 26, 40, -30, 8, -27);
  // floodlights with shafts
  for (const [x, z, dx, dz] of [[-21.5, -1, 1, 0.2], [21.5, -6, -1, -0.3], [-2, -18, 0.2, 1], [4, 17.5, -0.1, -1]]) { deco(C(0.12, 0.15, 7, 8), m.darkSteel, [x, 3.5, z]); deco(B(0.7, 0.4, 0.3), m.black, [x, 7, z], [0, Math.atan2(dx, dz), 0]); deco(PL(0.6, 0.3), new THREE.MeshBasicMaterial({ color: '#fff4dc', toneMapped: false }), [x + dx * 0.17, 7, z + dz * 0.17], [0, Math.atan2(dx, dz), 0], null, false);
    K.shaft(V3(x, 7, z), V3(dx, -0.85, dz), 11, 0.25, 3.4, '#fff0d0', 0.09); pointLight('#fff2dc', 22, 22, x + dx * 4, 3, z + dz * 4); }
  pointLight('#ffffff', 6, 12, -18.5, 2.9, 11); pointLight('#fff4e0', 5, 10, -11.5, 2.9, 11); pointLight('#bfe4ff', 6, 12, 14, 2.9, 11); pointLight('#ff4040', 3, 8, 0, 3, 0); pointLight('#40ff70', 4, 10, 17, 1, -13);
  // tasks (valves) + items
  const valve = (id, pos, ry, label) => K.addInteractable('task', pos, label, K.pickupModel('lever', pos, ry), { id, hold: 2.5, done: 'Valve bondho!' });
  valve('vA', V3(-14.5, 0, -9.1), 0, 'Gas valve A bondho koro'); valve('vB', V3(1.8, 0, -1.4), PI / 2, 'Gas valve B bondho koro (drill floor)'); valve('vC', V3(17.5, 0, 1.6), 0, 'Gas valve C bondho koro (tank)');
  for (const [kind, pos, label] of [['ammo', V3(-20.4, 0.2, -13.6), 'Ammo refill'], ['medkit', V3(-21.85, 1.3, 15.6), 'Medkit nao'], ['medkit', V3(19.3, 1.2, 9), 'Medkit nao'], ['ammo', V3(14.2, 0.2, -6.4), 'Ammo refill']]) K.addInteractable(kind, pos, label, K.pickupModel(kind, pos, kind === 'medkit' ? (pos.x < 0 ? PI / 2 : -PI / 2) : 0));
  for (let i = 0; i < 6; i++) prop(i % 2 ? 'box' : 'bin', rr(-6, 6), 0, rr(12, 16)); prop('extinguisher', -8.4, 0, 6);
  K.buildCameras([{ pos: V3(-8.3, 2.9, 4.3), yaw: K.camLook(V3(-8.3, 0, 4.3), V3(0, 0, -4)), pitch: -0.3 }]);
  return {
    id: 'blacktide', bounds: { x0: -23.2, z0: -19.2, x1: 23.2, z1: 19.2 },
    spawns: {
      heli: { pos: V3(16, 0, -12.5), yaw: PI / 2, rappel: 6, label: 'Helipad rappel', desc: 'Jhorer moddhe heli theke rope e helipad e namben. Shoja deck er majhe.', risk: 'Risk: High · Exposed' },
      ladder: { pos: V3(-21.4, 0, -17.4), yaw: -PI / 2, label: 'Leg ladder', desc: 'Speedboat theke rig er paa beye uthben. Container er arale, chupchap.', risk: 'Risk: Medium · Stealth', surprise: ['Deck'] } },
    enemies: [
      { id: 'E1', pos: V3(10, 0, -12), yaw: PI / 2, room: 'Deck', patrol: [V3(10, 0, -16.5), V3(10, 0, -7), V3(-2, 0, -7), V3(-2, 0, -16.5)] }, { id: 'E2', pos: V3(-6, 0, -6.5), yaw: 0, room: 'Deck' },
      { id: 'E3', pos: V3(0, 0, -4.4), yaw: PI, room: 'Drill floor', heavy: true }, { id: 'E4', pos: V3(4.2, 0, 4), yaw: 0, room: 'Deck', patrol: [V3(5, 0, 4), V3(5, 0, 17), V3(-6, 0, 17)] },
      { id: 'E5', pos: V3(13, 0, 2), yaw: -PI / 2, room: 'Deck' }, { id: 'E6', pos: V3(-12, 0, 2.5), yaw: 0, room: 'Deck' },
      { id: 'E7', pos: V3(-17.4, 0, 6), yaw: PI, room: 'Mess hall' }, { id: 'E8', pos: V3(-11, 0, 15), yaw: PI, room: 'Quarters' }, { id: 'E9', pos: V3(-11, 0, 7.5), yaw: 0, room: 'Quarters', patrol: [V3(-11, 0, 5.5), V3(-11, 0, 16.5)] },
      { id: 'E10', pos: V3(11, 0, 9), yaw: PI, room: 'Control room' }, { id: 'E11', pos: V3(18, 0, 13.8), yaw: -PI / 2, room: 'Control room', heavy: true }, { id: 'E12', pos: V3(-20, 0, -7), yaw: -PI / 2, room: 'Deck' },
      { id: 'LEADER', pos: V3(14, 0, 9.4), yaw: PI, room: 'Control room', leader: true, name: 'Red Tide commander' },
    ],
    hostages: [{ pos: V3(-21.0, 0, 9.0), yaw: -PI / 2 }, { pos: V3(-21.0, 0, 10.3), yaw: -PI / 2 }, { pos: V3(-21.0, 0, 12.9), yaw: -PI / 2 }, { pos: V3(-16.2, 0, 16), yaw: -PI / 2 }, { pos: V3(-17.6, 0, 5.3), yaw: 0 }].map((h, i) => ({ ...h, look: { shirt: ['#e8762a', '#d9a21b', '#e8762a', '#3a5a8a', '#e8762a'][i], trousers: '#2a3240', skin: ['#a87652', '#c08a62', '#8a5a3a', '#b07a50', '#9a6a48'][i], seed: 80 + i } })),
    exits: [V3(17, 0, -13)], rescued: p => p.x > 12 && p.z < -8,
    objectives: [{ type: 'task', id: 'vA', label: 'Gas valve A (pipe rack)' }, { type: 'task', id: 'vB', label: 'Gas valve B (drill floor)' }, { type: 'task', id: 'vC', label: 'Gas valve C (storage tank)' }, { type: 'rescue', label: 'Worker der helipad e pathao' }, { type: 'neutralize' }],
    bonus: ['leader', 'stealth'], timer: { kind: 'deadline', s: { recruit: 1200, veteran: 990, elite: 840 } }, deadlineFail: 'Gas e agun dhore gelo, rig e bisphoron.', executions: true, maxDead: 2, shieldRetreat: V3(19, 0, 14),
    hawk: V3(20, 10.2, 16.5), hawkLine: ['Hawk in the crane cab. Wind is brutal, but I have the deck.', 'Hawk: Crane er cabin e achi. Bhoyonkor batash, kintu deck amar nojore.'],
    intro: { all: ['Gas is leaking all over the deck. No grenades near the valves. Close them and get the crew to the pad.', 'Rafi: Pura deck e gas chorache. Valve gulo bondho koro, worker der helipad e niye jao.'] },
    update(dt, t) { if (water) { water.material.map.offset.x += dt * 0.012; water.material.map.offset.y += dt * 0.006; water.position.y = -24 + Math.sin(t * 0.5) * 0.4; }
      if (flare) { flare.scale.setScalar(1 + Math.sin(t * 13) * 0.18 + Math.sin(t * 5.3) * 0.1); flareL.intensity = 22 + Math.sin(t * 11) * 6; if (R() < dt * 8) FX.emit(V3(-34.5, 9.5, -30.5), V3(0.3, 1, 0), 3, '#ffa040', 2, 1.2, 0.8, 0.3); }
      const on = (t % 1.4) < 0.15; for (const b of beacons) b.visible = on || b.position.y < 1; },
    winLine: ['Valves closed, crew on the helicopter. The rig is safe. Outstanding, Tiger 24.', 'Rafi: Valve bondho, worker ra heli te. Rig nirapod. Darun, Tiger 24!'],
    blueprint: { view: [-23, -19, 23, 19], markers: [[-14.5, -9, 'VALVE A', 'b'], [1.8, -1.4, 'VALVE B', 'b'], [17.5, 1.6, 'VALVE C', 'b'], [-20.6, 10.5, '5', 'h'], [17, -13, 'HELI', 'b'], [14, 9.4, 'CMD', 'e'], [10, -12, '', 'e'], [-6, -6.5, '', 'e'], [0, -4.4, '', 'e'], [4, 4, '', 'e'], [13, 2, '', 'e'], [-12, 2.5, '', 'e'], [-17.4, 6, '', 'e'], [-11, 15, '', 'e'], [-11, 7.5, '', 'e'], [11, 9, '', 'e'], [18, 13.8, '', 'e'], [-20, -7, '', 'e']] },
  };
}
