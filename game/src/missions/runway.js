// Mission 09 — Operation Runway: hijacked airliner on the tarmac, narrow-cabin hostage rescue
import { THREE, G, PI, M, B, RB, C, SP, PL, RX, add, canvasTex, rng, R, rr, V3 } from '../core.js';
import * as K from '../levelkit.js';
const { addCollider, wallX, wallZ, floor, ceiling, deco, pointLight, room, prop, Door } = K;

export const meta = { id: 'runway', no: '09', name: 'Operation Runway', art: 'plane', type: 'Hijack · CQB', loc: 'Shahjalal Airport · Runway 14', time: '02:40 hrs', diff: 'Elite',
  obj: ['Plane er 9 jon jatri o pilot ke uddhar', 'Shoru aisle e gunman der shamlano', 'Cockpit e transponder abar chalu kora'], intel: 'Red Tide namer notun group plane hijack koreche. Aisle khub shoru, crossfire e jatri marte pare. Cockpit door lock kora, breach lagbe.' };

let beacon = null, ckDoor = null;
export function build() {
  K.beginLevel({ fill: 0, exposure: 0.92, grade: { sat: 0.98, contrast: 1.1, sh: [0.92, 0.98, 1.1], hi: [1.05, 1.0, 0.94] }, bg: '#04060c', fog: '#070a14', fogD: 0.012, sun: 0.7, sunColor: '#9fb4ff', sunPos: [-20, 30, 10], sunTarget: [0, 0, 0], shadowSize: 22, hemi: 0.45,
    alarmPos: [0, 2.2, 0], alarmBulbs: [], skyTop: '#02030a', skyBottom: '#141c30', city: true, skyDist: 80, alarmLight: false, police: [-9, -2.5, 9], dustOpacity: 0.3 });
  const LG = K.LG, m = K.makeMaterials();
  const white = M('#e9ebee', 0.32, 0.15), stripe = M('#c8202a', 0.4, 0.1), belly = M('#9aa0a8', 0.45, 0.3), cabinWall = M('#ffffff', 0.7, 0, { map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#d9d6cf'; g.fillRect(0, 0, w, h); const r = rng(3); for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.04})`; g.fillRect(r() * w, r() * h, 2, 2); } g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, 0, w, 3); }, { repeat: [8, 1] }) });
  const carpet = M('#ffffff', 0.95, 0, { map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#2a3348'; g.fillRect(0, 0, w, h); const r = rng(8); for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? 10 : 90},${r() < 0.5 ? 20 : 100},${r() < 0.5 ? 40 : 150},.15)`; g.fillRect(r() * w, r() * h, 1, 1); } for (let y = 0; y < h; y += 32) { g.fillStyle = 'rgba(160,140,90,.18)'; g.fillRect(0, y, w, 2); } }, { repeat: [2, 16] }) });
  const seatFab = M('#ffffff', 0.9, 0, { map: canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#26354f'; g.fillRect(0, 0, w, h); const r = rng(4); for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.06})`; g.fillRect(r() * w, r() * h, 1, 1); } g.fillStyle = 'rgba(200,40,50,.5)'; g.fillRect(0, 0, w, 10); }) });
  const bizFab = M('#5a3a2a', 0.55, 0.05);
  room('Cockpit', -1.2, -18.5, 1.2, -15.5, 'carpet', 0.5); room('Business', -1.95, -15.5, 1.95, -7, 'carpet', 0.7); room('Economy', -1.95, -7, 1.95, 16, 'carpet', 0.65);
  room('Jet bridge', -14.2, -15.4, -1.95, -13.6, 'metal', 0.6); room('Wing', 1.95, -2.6, 9.2, 2.6, 'metal', 0.3, false); room('Stairs', 1.95, 13.5, 4.3, 15.5, 'metal', 0.35, false); room('Tarmac', -16, -20, 11, 18, 'asphalt', 0.3, false);
  // ---------------- cabin interior
  floor(-1.95, -18.5, 1.95, 16, carpet); ceiling(-1.95, -18.5, 1.95, 16, 2.3, M('#e6e3dc', 0.85));
  const winTex = canvasTex(64, 96, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#05070f'); gr.addColorStop(1, '#1a2238'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = rng(9); for (let i = 0; i < 8; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,190,110,.9)' : 'rgba(160,200,255,.8)'; g.fillRect(r() * w, h * 0.6 + r() * h * 0.3, 2, 2); } });
  const winMat = new THREE.MeshBasicMaterial({ map: winTex }), frameMat = M('#c9c6be', 0.5);
  wallZ(-1.95, -15.5, 16, 2.3, cabinWall, [{ a: -15.35, b: -13.65, y0: 0, y1: 2.05 }], { mat: 'metal' });
  wallZ(1.95, -15.5, 16, 2.3, cabinWall, [{ a: -0.75, b: 0.75, y0: 0, y1: 1.9 }, { a: 13.6, b: 15.4, y0: 0, y1: 2.05 }], { mat: 'metal' });
  for (let z = -13.4; z < 15.6; z += 0.9) for (const sx of [-1, 1]) { if (sx > 0 && Math.abs(z) < 1.0) continue; if (sx > 0 && z > 13.2) continue; if (sx < 0 && z < -13.4) continue; deco(RB(0.04, 0.42, 0.3, 0.1), frameMat, [sx * 1.92, 1.32, z], null, null, false); deco(PL(0.22, 0.32), winMat, [sx * 1.895, 1.32, z], [0, -sx * PI / 2, 0], null, false); }
  wallX(-15.5, -1.95, 1.95, 2.3, m.white, [{ a: -0.5, b: 0.5, y0: 0, y1: 2.05 }], { mat: 'metal' });
  wallZ(-1.2, -18.5, -15.5, 2.3, m.darkSteel, [], { mat: 'metal' }); wallZ(1.2, -18.5, -15.5, 2.3, m.darkSteel, [], { mat: 'metal' }); wallX(-18.5, -1.2, 1.2, 2.3, m.black, [], { mat: 'metal' }); wallX(16, -1.95, 1.95, 2.3, m.white, [], { mat: 'metal' });
  // overhead bins + ceiling light strips
  for (const sx of [-1, 1]) { addCollider(sx * 1.95 - (sx > 0 ? 0.62 : 0), 1.72, -13, sx * 1.95 + (sx < 0 ? 0.62 : 0), 2.3, 13.6, { vm: M('#efece6', 0.5), mat: 'wood', pen: true, nav: false });
    deco(B(0.05, 0.03, 26.6), new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#ffe6c4', emissiveIntensity: 1.4 }), [sx * 1.3, 1.73, 0.3], null, null, false); }
  // seats (instanced)
  const seatCush = [], seatBack = [];
  const row = (z, xs, biz = false) => { for (const x of xs) { seatCush.push([x, z, biz]); seatBack.push([x, z, biz]); } };
  for (const z of [-12.2, -10.8, -9.4]) { row(z, [-1.55, -0.95, 0.95, 1.55], true); addCollider(-1.9, 0, z - 0.4, -0.62, 1.15, z + 0.38, { vis: false, mat: 'wood', pen: true }); addCollider(0.62, 0, z - 0.4, 1.9, 1.15, z + 0.38, { vis: false, mat: 'wood', pen: true }); }
  const eco = []; for (let z = -5.6; z < 13.2; z += 0.86) { if (z > -1.4 && z < 1.3) continue; eco.push(z); }
  for (const z of eco) { row(z, [-1.62, -1.17, -0.75, 0.75, 1.17, 1.62]); addCollider(-1.9, 0, z - 0.28, -0.56, 1.1, z + 0.26, { vis: false, mat: 'wood', pen: true }); addCollider(0.56, 0, z - 0.28, 1.9, 1.1, z + 0.26, { vis: false, mat: 'wood', pen: true }); }
  const im1 = new THREE.InstancedMesh(RB(0.42, 0.12, 0.46, 0.04), seatFab, seatCush.length), im2 = new THREE.InstancedMesh(RB(0.42, 0.66, 0.1, 0.04), seatFab, seatBack.length);
  const ib1 = new THREE.InstancedMesh(RB(0.56, 0.14, 0.58, 0.05), bizFab, 12), ib2 = new THREE.InstancedMesh(RB(0.56, 0.8, 0.12, 0.05), bizFab, 12);
  const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V3(1, 1, 1); let ie = 0, ib = 0;
  const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.12, 0, 0));
  for (let i = 0; i < seatCush.length; i++) { const [x, z, biz] = seatCush[i]; if (biz) { mm.compose(V3(x, 0.48, z), q, sc); ib1.setMatrixAt(ib, mm); mm.compose(V3(x, 0.92, z + 0.3), tilt, sc); ib2.setMatrixAt(ib, mm); ib++; } else { mm.compose(V3(x, 0.44, z - 0.02), q, sc); im1.setMatrixAt(ie, mm); mm.compose(V3(x, 0.8, z + 0.2), tilt, sc); im2.setMatrixAt(ie, mm); ie++; } }
  im1.count = im2.count = ie; for (const im of [im1, im2, ib1, ib2]) { im.castShadow = true; im.receiveShadow = true; im.instanceMatrix.needsUpdate = true; LG.add(im); }
  // galleys, lavatory, curtains
  addCollider(0.8, 0, -15.45, 1.9, 1.0, -14.8, { vm: m.steel, mat: 'metal' }); addCollider(-1.9, 0, -15.45, -0.9, 1.0, -15.1, { vm: m.steel, mat: 'metal' }); deco(B(1.0, 0.04, 0.6), m.steel, [1.35, 1.6, -15.2]);
  addCollider(-1.9, 0, 14.8, -0.6, 2.3, 16, { vm: m.white, mat: 'wood', pen: true }); addCollider(-1.9, 0, 13.4, -0.6, 1.0, 13.9, { vm: m.steel, mat: 'metal' });
  for (const sx of [-1, 1]) deco(B(0.7, 1.7, 0.03), M('#33384a', 0.95), [sx * 1.55, 1.3, -7], null, null, false);
  // cockpit
  addCollider(-1.1, 0, -18.45, 1.1, 1.05, -17.9, { vm: m.black, mat: 'metal' }); for (const x of [-0.5, 0.5]) { deco(RB(0.5, 0.12, 0.5, 0.04), bizFab, [x, 0.5, -17.2]); deco(RB(0.5, 0.8, 0.12, 0.04), bizFab, [x, 0.95, -16.9]); }
  for (let i = 0; i < 6; i++) deco(PL(0.3, 0.22), new THREE.MeshBasicMaterial({ color: i % 2 ? '#3ac0ff' : '#5aff9a', toneMapped: false }), [-0.85 + i * 0.34, 1.12, -17.88], [-0.5, 0, 0], null, false);
  deco(PL(2.2, 0.6), new THREE.MeshBasicMaterial({ color: '#0a1020' }), [0, 1.6, -18.44], null, null, false);
  // jet bridge (corridor to the terminal)
  floor(-14.2, -15.4, -1.95, -13.6, M('#3a3e44', 0.6, 0.4)); ceiling(-14.2, -15.4, -1.95, -13.6, 2.3, M('#bfc2c6', 0.7));
  wallX(-15.45, -14.2, -1.95, 2.3, M('#8a8f96', 0.5, 0.5), [], { mat: 'metal' }); wallX(-13.55, -14.2, -1.95, 2.3, M('#8a8f96', 0.5, 0.5), [], { mat: 'metal' }); wallZ(-14.25, -15.4, -13.6, 2.3, m.darkSteel, [], { mat: 'metal' });
  for (let x = -13; x < -2; x += 2.6) deco(B(0.05, 0.03, 1.4), m.fluo, [x, 2.27, -14.5], null, null, false);
  // rear stair truck platform + wing boundaries
  floor(1.95, 13.5, 4.3, 15.5, M('#5a5e64', 0.5, 0.6)); addCollider(1.95, 0, 13.45, 4.3, 1.05, 13.55, { vm: m.yellow, mat: 'metal', pen: true }); addCollider(1.95, 0, 15.45, 4.3, 1.05, 15.55, { vm: m.yellow, mat: 'metal', pen: true }); addCollider(4.3, 0, 13.5, 4.4, 1.05, 15.5, { vis: false });
  for (let i = 0; i < 9; i++) deco(B(1.0, 0.08, 0.4), M('#5a5e64', 0.5, 0.6), [4.9 + i * 0.4, -0.4 * i - 0.2, 14.5], null, null, false);
  for (const [x1, z1, x2, z2] of [[1.95, -2.7, 9.3, -2.6], [1.95, 2.6, 9.3, 2.7], [9.2, -2.7, 9.3, 2.7]]) addCollider(x1, 0, z1, x2, 1.6, z2, { vis: false });
  // ---------------- exterior: fuselage, nose, tail, wings, engines
  // fuselage built in segments so the doors and the overwing exit stay open (theta: 0.5PI = right side, 1.5PI = left side)
  const segs = [[-17.75, -15.35, null], [-15.35, -13.65, [1.22, 1.78]], [-13.65, -0.75, null], [-0.75, 0.75, [0.25, 0.75]], [0.75, 13.6, null], [13.6, 15.4, [0.22, 0.78]], [15.4, 16.75, null]];
  const arcsOf = gap => gap ? [[gap[1], 2 + gap[0]]] : [[0, 2]];
  const inter = (a, b) => { const out = []; for (const sh of [0, 2, -2]) { const s0 = Math.max(a[0], b[0] + sh), s1 = Math.min(a[1], b[1] + sh); if (s1 > s0) out.push([s0, s1]); } return out; };
  for (const [z0, z1, gap] of segs) { const L = z1 - z0, cz = (z0 + z1) / 2;
    for (const [a0, a1] of arcsOf(gap)) { const f = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, L, Math.max(6, Math.round(40 * (a1 - a0) / 2)), 1, true, a0 * PI, (a1 - a0) * PI), white); f.rotation.x = PI / 2; f.position.set(0, 0.6, cz); f.castShadow = true; LG.add(f);
      for (const st of [[0.42, 0.58], [1.42, 1.58]]) for (const [b0, b1] of inter([a0, a1], st)) { const sm = new THREE.Mesh(new THREE.CylinderGeometry(2.62, 2.62, L, 6, 1, true, b0 * PI, (b1 - b0) * PI), stripe); sm.rotation.x = PI / 2; sm.position.set(0, 0.6, cz); LG.add(sm); } } }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(2.6, 32, 16, 0, PI * 2, 0, PI / 2), white); nose.rotation.x = -PI / 2; nose.scale.set(1, 1.5, 1); nose.position.set(0, 0.6, -17.85); LG.add(nose);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 0.5, 9, 32, 1, true), white); tail.rotation.x = PI / 2; tail.position.set(0, 1.4, 21.2); LG.add(tail);
  deco(B(0.35, 6, 4.5), white, [0, 5.4, 23], [0.5, 0, 0]); deco(B(0.37, 2, 2.6), stripe, [0, 6.8, 23.6], [0.5, 0, 0], null, false);
  for (const sx of [-1, 1]) { deco(B(14.5, 0.25, 5.2), white, [sx * 9.6, -0.13, 0], [0, sx * 0.12, 0]); deco(B(6, 0.18, 2.4), white, [sx * 3.6, 1.4, 23.5]);
    const eng = deco(C(0.95, 0.85, 3.4, 24), M('#d0d3d8', 0.35, 0.4), [sx * 6.2, -1.3, -1.2], RX); deco(C(0.75, 0.75, 0.1, 24), m.black, [sx * 6.2, -1.3, -2.92], RX, null, false); eng.castShadow = true;
    deco(C(0.12, 0.12, 2.6, 8), belly, [sx * 2, -2.3, 2]); deco(C(0.45, 0.45, 0.35, 16), m.black, [sx * 2, -3.25, 2], [0, 0, PI / 2]); }
  deco(C(0.1, 0.1, 2.4, 8), belly, [0, -2.3, -14]); deco(C(0.38, 0.38, 0.3, 16), m.black, [0, -3.3, -14], [0, 0, PI / 2]);
  beacon = deco(SP(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: '#ff2020', toneMapped: false }), [0, 3.25, 2], null, null, false);
  // jet bridge exterior + terminal
  deco(B(12.4, 2.7, 2.2), M('#7a7f86', 0.5, 0.5), [-8.1, 1.15, -14.5]); deco(C(0.3, 0.3, 3.6, 10), m.darkSteel, [-10, -1.8, -14.5]);
  const tTex = canvasTex(512, 128, (g, w, h) => { g.fillStyle = '#0b0f18'; g.fillRect(0, 0, w, h); const r = rng(14); for (let x = 4; x < w; x += 16) for (let y = 8; y < h - 8; y += 20) if (r() < 0.55) { g.fillStyle = r() < 0.7 ? '#e9c88a' : '#a8c4ff'; g.globalAlpha = 0.5 + r() * 0.5; g.fillRect(x, y, 12, 12); g.globalAlpha = 1; } });
  deco(B(40, 12, 20), M('#ffffff', 0.6, 0.2, { map: tTex, emissive: '#ffffff', emissiveMap: tTex, emissiveIntensity: 0.6, normal: false }), [-36, 2.4, -10], null, null, false);
  // tarmac far below
  const tarmac = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#1c1e22'; g.fillRect(0, 0, w, h); const r = rng(21); for (let i = 0; i < 9000; i++) { const c = r() < 0.5 ? 0 : 255; g.fillStyle = `rgba(${c},${c},${c},.05)`; g.fillRect(r() * w, r() * h, 2, 2); } g.fillStyle = 'rgba(230,200,60,.75)'; g.fillRect(w / 2 - 3, 0, 6, h); g.fillStyle = 'rgba(240,240,240,.6)'; for (let y = 0; y < h; y += 64) g.fillRect(w * 0.25, y, 8, 34); }, { repeat: [8, 8] });
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M('#ffffff', 0.35, 0.2, { map: tarmac })); gnd.rotation.x = -PI / 2; gnd.position.y = -3.6; gnd.receiveShadow = true; LG.add(gnd);
  const rl = new THREE.MeshBasicMaterial({ color: '#ffd38a', toneMapped: false }), rb = new THREE.MeshBasicMaterial({ color: '#4a8aff', toneMapped: false });
  for (let z = -120; z < 120; z += 6) { deco(SP(0.09, 6, 4), rl, [26, -3.5, z], null, null, false); deco(SP(0.09, 6, 4), rl, [56, -3.5, z], null, null, false); deco(SP(0.07, 6, 4), rb, [14, -3.52, z + 3], null, null, false); }
  // emergency vehicles below
  for (const [x, z, ry, col] of [[-9, 10, 0.4, '#c81e1e'], [12, 16, -0.6, '#e8e8e8'], [-6, -26, 1.2, '#c81e1e']]) { deco(B(2.2, 1.6, 5.6), M(col, 0.4, 0.3), [x, -2.7, z], [0, ry, 0]); deco(B(2.25, 0.18, 0.5), new THREE.MeshBasicMaterial({ color: '#3a6aff', toneMapped: false }), [x, -1.8, z], [0, ry, 0], null, false); }
  K.shaft(V3(0, 2.25, -12), V3(0, -1, 0.05), 2.3, 0.3, 1.2, '#ffe6c4', 0.05); for (let z = -4; z < 14; z += 4.3) K.shaft(V3(0, 2.25, z), V3(0, -1, 0), 2.3, 0.35, 1.3, '#ffe6c4', 0.04);
  K.shaft(V3(-28, 8, -2), V3(1, -0.55, 0.1), 30, 0.6, 5, '#ffe8c0', 0.04);
  // lights
  for (let z = -12; z <= 13; z += 5) pointLight('#ffe2bc', 4.5, 7, 0, 2.1, z); pointLight('#9fd0ff', 3, 5, 0, 1.8, -16.8); pointLight('#ffffff', 5, 9, -8, 2.1, -14.5); pointLight('#ffb070', 5, 10, 4, 2.5, 14.5); pointLight('#bcd0ff', 3, 10, 5, 2.5, 0);
  // doors / items
  ckDoor = new Door({ axis: 'x', x1: -0.5, z: -15.5, w: 1.0, locked: true, name: 'cockpit', h: 2.05 });
  K.addInteractable('task', V3(0, 1.05, -17.95), 'Transponder chalu koro', K.pickupModel('console', V3(0, 1.05, -17.95)), { id: 'xpdr', hold: 2.5, done: 'Transponder chalu! Tower amader dekhte pacche' });
  for (const [kind, pos, label] of [['ammo', V3(-12.8, 0.2, -14.0), 'Ammo refill'], ['medkit', V3(1.3, 1.1, -15.0), 'Medkit nao'], ['medkit', V3(-1.2, 1.1, 13.6), 'Medkit nao'], ['ammo', V3(3.6, 0.2, 14.0), 'Ammo refill']]) K.addInteractable(kind, pos, label, K.pickupModel(kind, pos));
  for (const [x, z] of [[0.3, -6.6], [-0.2, 8.4], [1.2, 0.8]]) prop('bag', x, 0, z);
  K.buildCameras([]);
  return {
    id: 'runway', bounds: { x0: -15, z0: -19, x1: 10, z1: 17 },
    spawns: {
      bridge: { pos: V3(-12.4, 0, -14.5), yaw: -PI / 2, label: 'Jet bridge', desc: 'Terminal theke jet bridge diye front door. Galley te pouchhan, cockpit kache.', risk: 'Risk: High · Direct' },
      stairs: { pos: V3(3.4, 0, 14.5), yaw: PI / 2, label: 'Rear stairs', desc: 'Catering truck er siri diye pichoner door. Rear galley theke shamne agaben.', risk: 'Risk: Medium' },
      wing: { pos: V3(5, 0, 0), yaw: PI / 2, label: 'Overwing exit', desc: 'Andhokar e wing e uthe emergency exit khule majhkhane dhukben. Shobcheye surprise.', risk: 'Risk: High · Surprise', surprise: ['Economy'] } },
    enemies: [
      { id: 'E1', pos: V3(0.4, 0, -13.4), yaw: 0, room: 'Business' }, { id: 'E2', pos: V3(0, 0, -10.1), yaw: PI, room: 'Business', patrol: [V3(0, 0, -12.6), V3(0, 0, -6.4)] },
      { id: 'E3', pos: V3(0, 0, -4), yaw: PI, room: 'Economy', heavy: true }, { id: 'E4', pos: V3(-1.2, 0, 0.6), yaw: -PI / 2, room: 'Economy' },
      { id: 'E5', pos: V3(0, 0, 5.5), yaw: 0, room: 'Economy', patrol: [V3(0, 0, 2), V3(0, 0, 12.6)] }, { id: 'E6', pos: V3(0.8, 0, 13.6), yaw: 0, room: 'Economy' },
      { id: 'E7', pos: V3(0, 0, 10), yaw: PI, room: 'Economy' }, { id: 'LEADER', pos: V3(0.3, 0, -16.3), yaw: 0, room: 'Cockpit', leader: true, name: 'Red Tide hijacker' },
    ],
    hostages: [{ pos: V3(-0.9, 0, -13.8), yaw: 0 }, { pos: V3(0, 0, -13.5), yaw: 0.3 }, { pos: V3(-0.4, 0, -14.6), yaw: -0.3 }, { pos: V3(-1.3, 0, 0.4), yaw: PI / 2 }, { pos: V3(-0.6, 0, -0.5), yaw: PI },
      { pos: V3(0.3, 0, 0.7), yaw: 0 }, { pos: V3(0.3, 0, 13.9), yaw: PI }, { pos: V3(0.0, 0, 14.6), yaw: PI }, { pos: V3(-0.3, 0, -16.6), yaw: 0, name: 'Captain Rahman', look: { shirt: '#ffffff', trousers: '#1a1e2a', tie: '#1a1e2a', skin: '#a87652', seed: 61 } }],
    exits: [V3(-10.5, 0, -14.5), V3(3.4, 0, 14.5)], rescued: p => p.x < -4.5 || p.x > 2.6,
    objectives: [{ type: 'rescue', label: 'Jatri der jet bridge / siri diye ber koro' }, { type: 'neutralize' }, { type: 'task', id: 'xpdr', label: 'Cockpit e transponder chalu koro' }], bonus: ['leader', 'stealth'],
    timer: { kind: 'deadline', s: { recruit: 1080, veteran: 900, elite: 720 } }, deadlineFail: 'Hijacker ra engine chalu kore runway te chole gelo.', executions: true, maxDead: 2, shieldRetreat: V3(0, 0, -17),
    hawk: null,
    intro: { all: ['Tiger 24, the aisle is narrow. Check every shot, there are civilians in every row.', 'Rafi: Aisle khub shoru. Protita goli dekhe chalao, protita row te jatri.'] },
    update(dt, t) { if (beacon) beacon.visible = (t % 1.2) < 0.12; if (ckDoor && ckDoor.locked && !G.enemies.some(e => e.isHostile() && e.pos.z < -15.4)) ckDoor.locked = false; },
    winLine: ['All passengers off the aircraft. Runway is clear. Good work, Tiger 24.', 'Rafi: Shob jatri plane theke nirapode nemeche. Runway clear. Darun kaj!'],
    blueprint: { view: [-15, -19, 10, 17], markers: [[0, -16.6, 'CKPT', 'e'], [-0.4, -14, '3', 'h'], [-0.6, 0.2, '3', 'h'], [0, 14.2, '2', 'h'], [-12, -14.5, 'BRIDGE', 'b'], [3.4, 14.5, 'STAIRS', 'b'], [5, 0, 'WING', 'b'], [0.4, -13, '', 'e'], [0, -10, '', 'e'], [0, -4, '', 'e'], [-1.2, 0.6, '', 'e'], [0, 5.5, '', 'e'], [0, 10, '', 'e'], [0.8, 13.6, '', 'e']] },
  };
}
