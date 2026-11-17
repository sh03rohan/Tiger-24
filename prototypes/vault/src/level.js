// Tiger 24 · Operation Vault — bank level: geometry, colliders, ray tests, doors, glass, props, navigation
import { THREE, CANNON, G, PI, M, B, RB, C, SP, PL, RX, add, canvasTex, rng, clamp, R, rr, A, FX, emitNoise, V3 } from './core.js';
import { buildWeapon } from './assets.js';

export const colliders = [];       // {min,max,mat,pen,low,on,mesh,body,door,glass,dyn,id}
export const doors = [];
export const glassPanes = [];
export const rooms = [];
export const interactables = [];   // {kind,pos,label,...}
const staticMeshes = [];
let dynamicObjects = [];           // objects to remove on reset

/* ================= materials ================= */
let MAT = null;
function makeMaterials() {
  const marble = canvasTex(1024, 1024, (g, w) => { const r = rng(7), n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const dk = (i + j) % 2 === 0; g.fillStyle = dk ? '#25262a' : '#d8d2c5'; g.fillRect(i * s, j * s, s, s);
      g.save(); g.beginPath(); g.rect(i * s, j * s, s, s); g.clip();
      for (let k = 0; k < 14; k++) { g.strokeStyle = dk ? `rgba(210,210,220,${0.04 + r() * 0.12})` : `rgba(90,80,70,${0.05 + r() * 0.16})`; g.lineWidth = 0.5 + r() * 2.4;
        g.beginPath(); let x = i * s + r() * s, y = j * s - 10; g.moveTo(x, y); for (let q = 0; q < 6; q++) { const nx = x + (r() - 0.5) * 90, ny = y + s / 5; g.quadraticCurveTo(x + (r() - 0.5) * 120, y + s * 0.1, nx, ny); x = nx; y = ny; } g.stroke(); }
      g.restore(); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(i * s, j * s, s, 2); g.fillRect(i * s, j * s, 2, s); } }, { repeat: [26 / 4, 18 / 4] });
  const noiseTex = (base, seed, rep, spots = 2500, alpha = 0.05) => canvasTex(256, 256, (g, w, h) => { const r = rng(seed); g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < spots; i++) { const c = r() < 0.5 ? 0 : 255; g.fillStyle = `rgba(${c},${c},${c},${alpha})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } }, { repeat: rep });
  const carpet = canvasTex(256, 256, (g, w, h) => { const r = rng(5); g.fillStyle = '#3a2a2c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? 20 : 120},${r() < 0.5 ? 10 : 60},${r() < 0.5 ? 10 : 60},0.12)`; g.fillRect(r() * w, r() * h, 1, 1); } g.strokeStyle = 'rgba(180,140,80,.12)'; g.lineWidth = 3; for (let i = 0; i < w; i += 64) { g.strokeRect(i + 8, i + 8, 48, 48); } }, { repeat: [6, 6] });
  const tile = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#9a9c98'; g.fillRect(0, 0, w, h); const r = rng(9); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = 140 + r() * 30; g.fillStyle = `rgb(${v},${v + 2},${v - 2})`; g.fillRect(i * 64 + 2, j * 64 + 2, 60, 60); } }, { repeat: [8, 8] });
  const deposit = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#6b6f74'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 64) for (let y = 0; y < h; y += 42) { const gr = g.createLinearGradient(x, y, x, y + 40); gr.addColorStop(0, '#a6abb1'); gr.addColorStop(1, '#7e8389'); g.fillStyle = gr; g.fillRect(x + 3, y + 3, 58, 36); g.fillStyle = '#3b3e42'; g.beginPath(); g.arc(x + 46, y + 21, 4, 0, PI * 2); g.fill(); g.fillStyle = '#c9b06a'; g.fillRect(x + 10, y + 17, 14, 7); } }, { repeat: [3, 1] });
  const corr = canvasTex(256, 256, (g, w, h) => { for (let x = 0; x < w; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, '#2d3236'); gr.addColorStop(0.5, '#41474c'); gr.addColorStop(1, '#262a2d'); g.fillStyle = gr; g.fillRect(x, 0, 16, h); } }, { repeat: [6, 2] });
  const brick = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#3d3532'; g.fillRect(0, 0, w, h); const r = rng(13); for (let y = 0; y < h; y += 32) for (let x = (y / 32 % 2) * 32; x < w + 64; x += 64) { const v = 70 + r() * 40; g.fillStyle = `rgb(${v + 30},${v},${v - 10})`; g.fillRect(x - 64 + 2, y + 2, 60, 28); } }, { repeat: [4, 2] });
  const asphalt = noiseTex('#16181b', 17, [12, 6], 6000, 0.08);
  MAT = {
    marble: M('#ffffff', 0.16, 0.05, { map: marble }), plaster: M('#ffffff', 0.92, 0, { map: noiseTex('#c9bda5', 12, [6, 2], 2000, 0.04) }),
    drywall: M('#ffffff', 0.95, 0, { map: noiseTex('#a9aca6', 14, [5, 2], 2000, 0.04) }), office: M('#ffffff', 0.95, 0, { map: noiseTex('#b7ab95', 15, [5, 2], 1500, 0.04) }),
    concrete: M('#ffffff', 0.85, 0.05, { map: noiseTex('#55585a', 31, [8, 8], 7000, 0.08) }), concreteWall: M('#ffffff', 0.9, 0, { map: noiseTex('#4a4e51', 32, [5, 2], 5000, 0.07) }),
    carpet: M('#ffffff', 0.98, 0, { map: carpet }), tile: M('#ffffff', 0.4, 0.05, { map: tile }), deposit: M('#ffffff', 0.35, 0.8, { map: deposit }), corr: M('#ffffff', 0.6, 0.5, { map: corr }), brick: M('#ffffff', 0.9, 0, { map: brick }),
    asphalt: M('#ffffff', 0.25, 0.3, { map: asphalt }), wood: M('#4a3122', 0.55, 0.05), woodLight: M('#7a5838', 0.6, 0.05), steel: M('#8b9096', 0.32, 0.9), darkSteel: M('#2c3236', 0.5, 0.7),
    brass: M('#b8913f', 0.3, 0.9), black: M('#141414', 0.5, 0.3), glass: new THREE.MeshStandardMaterial({ color: '#9cc7d6', roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.18, depthWrite: false }),
    ceiling: M('#d9d3c6', 0.95), ceilingDark: M('#8a8c88', 0.95), panel: new THREE.MeshStandardMaterial({ color: '#fff6e0', emissive: '#ffe7b8', emissiveIntensity: 1.6 }),
    fluo: new THREE.MeshStandardMaterial({ color: '#f2fbff', emissive: '#dff3ff', emissiveIntensity: 1.8 }), screen: new THREE.MeshStandardMaterial({ color: '#0a1a20', emissive: '#4fd1c5', emissiveIntensity: 0.6 }),
    cardboard: M('#a07a4a', 0.9), green: M('#2f5a2c', 0.8), fabric: M('#3b4552', 0.8), leather: M('#2a1d16', 0.5), red: M('#a3241a', 0.5, 0.2), yellow: M('#d9a21b', 0.6), white: M('#e8e6e0', 0.6), gold: M('#e2b54a', 0.25, 1),
    cash: M('#4d7a4a', 0.85), paper: M('#efece4', 0.9),
  };
  return MAT;
}
export function mat() { return MAT; }

/* ================= collider helpers ================= */
let cid = 0;
export function addCollider(x1, y1, z1, x2, y2, z2, o = {}) {
  const c = { id: cid++, min: V3(Math.min(x1, x2), Math.min(y1, y2), Math.min(z1, z2)), max: V3(Math.max(x1, x2), Math.max(y1, y2), Math.max(z1, z2)),
    mat: o.mat || 'concrete', pen: !!o.pen, low: (Math.max(y1, y2) < 1.4), on: true, door: o.door || null, glass: o.glass || null, dyn: !!o.dyn, mesh: null, body: null, nav: o.nav !== false };
  if (o.vis !== false) {
    const w = c.max.x - c.min.x, h = c.max.y - c.min.y, d = c.max.z - c.min.z;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), o.vm || MAT.concrete); m.position.set((c.min.x + c.max.x) / 2, (c.min.y + c.max.y) / 2, (c.min.z + c.max.z) / 2);
    m.castShadow = o.cast !== false; m.receiveShadow = true; G.scene.add(m); c.mesh = m;
    if (o.uv) scaleUV(m.geometry, w, h, d, o.uv);
    if (c.dyn) dynamicObjects.push(m); else staticMeshes.push(m);
  }
  if (o.body !== false) {
    const b = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3((c.max.x - c.min.x) / 2, (c.max.y - c.min.y) / 2, (c.max.z - c.min.z) / 2)) });
    b.position.set((c.min.x + c.max.x) / 2, (c.min.y + c.max.y) / 2, (c.min.z + c.max.z) / 2); G.world.addBody(b); c.body = b;
  }
  colliders.push(c); return c;
}
function scaleUV(geo, w, h, d, s) { // world-scaled UVs so textures don't stretch
  const uv = geo.attributes.uv, n = geo.attributes.normal;
  for (let i = 0; i < uv.count; i++) { const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)); let sx, sy; if (nx > 0.5) { sx = d; sy = h; } else if (ny > 0.5) { sx = w; sy = d; } else { sx = w; sy = h; } uv.setXY(i, uv.getX(i) * sx / s, uv.getY(i) * sy / s); }
  uv.needsUpdate = true;
}
export function setColliderOn(c, on) {
  if (c.on === on) return; c.on = on;
  if (c.body) { if (on) G.world.addBody(c.body); else G.world.removeBody(c.body); }
}
const T = 0.3;
function wallX(z, x1, x2, h, vm, openings = [], o = {}) { // wall running along X at z
  const ops = openings.slice().sort((a, b) => a.a - b.a); let x = x1;
  for (const op of ops) { if (op.a > x) addCollider(x, 0, z - T / 2, op.a, h, z + T / 2, { vm, uv: 2, ...o }); if (op.y1 < h) addCollider(op.a, op.y1, z - T / 2, op.b, h, z + T / 2, { vm, uv: 2, ...o }); if (op.y0 > 0) addCollider(op.a, 0, z - T / 2, op.b, op.y0, z + T / 2, { vm, uv: 2, ...o }); x = op.b; }
  if (x < x2) addCollider(x, 0, z - T / 2, x2, h, z + T / 2, { vm, uv: 2, ...o });
}
function wallZ(x, z1, z2, h, vm, openings = [], o = {}) {
  const ops = openings.slice().sort((a, b) => a.a - b.a); let z = z1;
  for (const op of ops) { if (op.a > z) addCollider(x - T / 2, 0, z, x + T / 2, h, op.a, { vm, uv: 2, ...o }); if (op.y1 < h) addCollider(x - T / 2, op.y1, op.a, x + T / 2, h, op.b, { vm, uv: 2, ...o }); if (op.y0 > 0) addCollider(x - T / 2, 0, op.a, x + T / 2, op.y0, op.b, { vm, uv: 2, ...o }); z = op.b; }
  if (z < z2) addCollider(x - T / 2, 0, z, x + T / 2, h, z2, { vm, uv: 2, ...o });
}
function floor(x1, z1, x2, z2, m, y = 0) { const f = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), m); f.rotation.x = -PI / 2; f.position.set((x1 + x2) / 2, y, (z1 + z2) / 2); f.receiveShadow = true; G.scene.add(f); staticMeshes.push(f); return f; }
function ceiling(x1, z1, x2, z2, h, m) { const f = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), m); f.rotation.x = PI / 2; f.position.set((x1 + x2) / 2, h, (z1 + z2) / 2); G.scene.add(f); staticMeshes.push(f); return f; }
function deco(geo, m, pos, rot, scl, shadow = true) { const o = add(G.scene, geo, m, pos, rot, scl, shadow); staticMeshes.push(o); return o; }
const anchors = []; const lightPool = [];
function pointLight(color, intensity, dist, x, y, z) { const a = { color: new THREE.Color(color), intensity, dist, pos: V3(x, y, z) }; anchors.push(a); return a; }
function assignLights() { const cp = G.camera.position; anchors.forEach(a => a.d = a.pos.distanceToSquared(cp) / (a.dist * a.dist)); const sorted = anchors.slice().sort((a, b) => a.d - b.d);
  lightPool.forEach((l, i) => { const a = sorted[i]; if (!a) { l.intensity = 0; return; } l.position.copy(a.pos); l.color.copy(a.color); l.intensity = a.intensity; l.distance = a.dist; }); }

/* ================= ray tests ================= */
const _hit = { t: 0, t1: 0, c: null, n: new THREE.Vector3(), p: new THREE.Vector3() };
function slab(o, d, mn, mx, maxT) {
  let t0 = -Infinity, t1 = Infinity, ax = -1;
  for (let i = 0; i < 3; i++) {
    const oi = i === 0 ? o.x : i === 1 ? o.y : o.z, di = i === 0 ? d.x : i === 1 ? d.y : d.z, a = i === 0 ? mn.x : i === 1 ? mn.y : mn.z, b = i === 0 ? mx.x : i === 1 ? mx.y : mx.z;
    if (Math.abs(di) < 1e-9) { if (oi < a || oi > b) return null; continue; }
    let ta = (a - oi) / di, tb = (b - oi) / di; if (ta > tb) { const tmp = ta; ta = tb; tb = tmp; }
    if (ta > t0) { t0 = ta; ax = i; } if (tb < t1) t1 = tb; if (t0 > t1 || t1 < 0 || t0 > maxT) return null;
  }
  return { t0: Math.max(0, t0), t1, ax };
}
// returns nearest collider hit {t, t1, c, n, p} or null. opts.ignore(c) to skip.
export function rayWorld(o, d, maxD, ignore = null) {
  let best = null, bt = maxD, bax = 0, bt1 = 0;
  for (const c of colliders) { if (!c.on) continue; if (ignore && ignore(c)) continue; const s = slab(o, d, c.min, c.max, bt); if (s && s.t0 < bt) { bt = s.t0; best = c; bax = s.ax; bt1 = s.t1; } }
  if (!best) return null;
  const n = new THREE.Vector3(); if (bax === 0) n.x = -Math.sign(d.x); else if (bax === 1) n.y = -Math.sign(d.y); else n.z = -Math.sign(d.z); if (bax < 0) n.copy(d).negate();
  return { t: bt, t1: bt1, c: best, n, p: o.clone().addScaledVector(d, bt) };
}
const _lo = new THREE.Vector3(), _ld = new THREE.Vector3();
export function los(a, b, seeThroughGlass = true) {
  _ld.subVectors(b, a); const L = _ld.length(); if (L < 1e-4) return true; _ld.divideScalar(L);
  for (const c of colliders) { if (!c.on) continue; if (seeThroughGlass && c.glass) continue; if (c.door && c.door.glassDoor && seeThroughGlass) continue; const s = slab(a, _ld, c.min, c.max, L - 0.05); if (s && s.t0 < L - 0.05 && s.t1 > 0.02) return false; }
  return true;
}
export function collideCircle(p, r, y0, y1, skipDyn = false) {
  let hit = false;
  for (let pass = 0; pass < 2; pass++) for (const c of colliders) {
    if (!c.on || c.max.y <= y0 || c.min.y >= y1) continue; if (skipDyn && c.glass) continue;
    if (p.x < c.min.x - r || p.x > c.max.x + r || p.z < c.min.z - r || p.z > c.max.z + r) continue;
    const cx = clamp(p.x, c.min.x, c.max.x), cz = clamp(p.z, c.min.z, c.max.z); let dx = p.x - cx, dz = p.z - cz; const d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue; hit = true;
    if (d2 > 1e-8) { const d = Math.sqrt(d2); p.x += dx / d * (r - d); p.z += dz / d * (r - d); }
    else { const l = p.x - c.min.x, rr2 = c.max.x - p.x, f = p.z - c.min.z, bk = c.max.z - p.z, m = Math.min(l, rr2, f, bk); if (m === l) p.x = c.min.x - r; else if (m === rr2) p.x = c.max.x + r; else if (m === f) p.z = c.min.z - r; else p.z = c.max.z + r; }
  }
  return hit;
}

/* ================= rooms ================= */
function room(name, x1, z1, x2, z2, surface, light, indoor = true, ceil = 4) { rooms.push({ name, x1, z1, x2, z2, surface, light, indoor, ceil }); }
export function roomAt(x, z) { for (const r of rooms) if (x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2) return r; return rooms[rooms.length - 1]; }

/* ================= doors ================= */
class Door {
  constructor(o) {
    Object.assign(this, { locked: false, broken: false, angle: 0, target: 0, glassDoor: false, h: 2.3 }, o);
    // axis 'x': door lies along x in a wall at z; hinge at (x1,z). axis 'z': along z in wall at x; hinge at (x, z1)
    this.pivot = new THREE.Group(); G.scene.add(this.pivot); dynamicObjects.push(this.pivot);
    const w = this.w;
    if (this.axis === 'x') { this.pivot.position.set(this.x1, 0, this.z); } else { this.pivot.position.set(this.x, 0, this.z1); }
    const leaf = this.glassDoor ? MAT.glass : MAT.woodLight;
    const geo = this.axis === 'x' ? new THREE.BoxGeometry(w, this.h, 0.06) : new THREE.BoxGeometry(0.06, this.h, w);
    this.mesh = new THREE.Mesh(geo, leaf); this.mesh.position.set(this.axis === 'x' ? w / 2 : 0, this.h / 2, this.axis === 'x' ? 0 : w / 2); this.mesh.castShadow = !this.glassDoor; this.mesh.receiveShadow = true; this.pivot.add(this.mesh);
    if (this.glassDoor) { const fr = new THREE.Mesh(this.axis === 'x' ? new THREE.BoxGeometry(w, 0.1, 0.08) : new THREE.BoxGeometry(0.08, 0.1, w), MAT.black); fr.position.copy(this.mesh.position); fr.position.y = 1.05; this.pivot.add(fr);
      const fr2 = fr.clone(); fr2.position.y = this.h - 0.05; this.pivot.add(fr2); const fr3 = fr.clone(); fr3.position.y = 0.05; this.pivot.add(fr3); }
    const knob = new THREE.Mesh(SP(0.035, 10, 8), MAT.brass); knob.position.set(this.axis === 'x' ? w - 0.12 : 0, 1.0, this.axis === 'x' ? 0 : w - 0.12); this.pivot.add(knob);
    if (this.axis === 'x') { const kb = knob.clone(); knob.position.z = 0.06; kb.position.z = -0.06; this.pivot.add(kb); } else { const kb = knob.clone(); knob.position.x = 0.06; kb.position.x = -0.06; this.pivot.add(kb); }
    const c = this.axis === 'x' ? addCollider(this.x1, 0, this.z - 0.06, this.x1 + w, this.h, this.z + 0.06, { vis: false, mat: this.glassDoor ? 'glass' : 'wood', pen: true, door: this, dyn: true })
      : addCollider(this.x - 0.06, 0, this.z1, this.x + 0.06, this.h, this.z1 + w, { vis: false, mat: this.glassDoor ? 'glass' : 'wood', pen: true, door: this, dyn: true });
    this.col = c; this.mesh.userData.door = this;
    this.center = this.axis === 'x' ? V3(this.x1 + w / 2, 1.1, this.z) : V3(this.x, 1.1, this.z1 + w / 2);
    doors.push(this);
  }
  get isOpen() { return Math.abs(this.angle) > 0.25 || this.broken; }
  side(p) { return this.axis === 'x' ? Math.sign(p.z - this.z) || 1 : Math.sign(p.x - this.x) || 1; }
  open(fromPos, by = 'player') {
    if (this.broken) return true;
    if (this.locked && by !== 'enemy') { A.door(this.center, 'locked'); return false; }
    if (this.locked && by === 'enemy') this.locked = false;
    const s = this.side(fromPos); this.target = (this.axis === 'x' ? s : -s) * 1.65; A.door(this.center, 'open'); emitNoise(this.center, by === 'player' ? 4 : 6, 'door'); return true;
  }
  close() { if (this.broken) return; this.target = 0; A.door(this.center, 'open'); }
  toggle(fromPos, by) { if (this.isOpen || Math.abs(this.target) > 0.1) { this.close(); return true; } return this.open(fromPos, by); }
  blow(fromPos) {
    if (this.broken) return; this.broken = true; this.locked = false; setColliderOn(this.col, false);
    this.mesh.updateMatrixWorld(); const wp = new THREE.Vector3(), wq = new THREE.Quaternion(); this.mesh.getWorldPosition(wp); this.mesh.getWorldQuaternion(wq);
    this.pivot.remove(this.mesh); G.scene.add(this.mesh); this.mesh.position.copy(wp); this.mesh.quaternion.copy(wq); dynamicObjects.push(this.mesh);
    const half = this.axis === 'x' ? new CANNON.Vec3(this.w / 2, this.h / 2, 0.03) : new CANNON.Vec3(0.03, this.h / 2, this.w / 2);
    const b = new CANNON.Body({ mass: 25, shape: new CANNON.Box(half) }); b.position.set(wp.x, wp.y, wp.z); b.quaternion.set(wq.x, wq.y, wq.z, wq.w);
    const dir = this.center.clone().sub(fromPos).setY(0).normalize(); b.velocity.set(dir.x * 9, 2.5, dir.z * 9); b.angularVelocity.set(rr(-3, 3), rr(-2, 2), rr(-3, 3)); G.world.addBody(b);
    G.props.push({ mesh: this.mesh, body: b, mat: 'wood', kind: 'door' }); this.pivot.visible = false;
  }
  update(dt) { if (this.broken) return; this.angle += (this.target - this.angle) * Math.min(1, dt * 7); this.pivot.rotation.y = this.angle; setColliderOn(this.col, Math.abs(this.angle) < 0.2); }
}
export function doorNear(p, maxD = 2.2) { let best = null, bd = maxD; for (const d of doors) { const dist = Math.hypot(d.center.x - p.x, d.center.z - p.z); if (dist < bd) { bd = dist; best = d; } } return best; }

/* ================= glass ================= */
function addGlass(x1, y1, z1, x2, y2, z2) {
  const c = addCollider(x1, y1, z1, x2, y2, z2, { vm: MAT.glass, mat: 'glass', pen: true, cast: false, dyn: true });
  c.mesh.castShadow = false; c.mesh.renderOrder = 2; c.glass = { broken: false }; glassPanes.push(c); return c;
}
export function shatterGlass(c, point, dir) {
  if (!c.glass || c.glass.broken) return; c.glass.broken = true; setColliderOn(c, false); if (c.mesh) c.mesh.visible = false;
  A.glass(point); emitNoise(point, 16, 'glass');
  const sx = c.max.x - c.min.x, sy = c.max.y - c.min.y, sz = c.max.z - c.min.z, alongX = sx > sz;
  const nu = Math.max(2, Math.min(6, Math.round((alongX ? sx : sz) / 0.35))), nv = Math.max(2, Math.min(7, Math.round(sy / 0.35)));
  const shardMat = MAT.glass;
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    if (dynamicShards() > 160) break;
    const u = (alongX ? sx : sz) / nu, v = sy / nv, w = u * rr(0.6, 1.1), h = v * rr(0.6, 1.1);
    const px = alongX ? c.min.x + (i + 0.5) * u : (c.min.x + c.max.x) / 2, pz = alongX ? (c.min.z + c.max.z) / 2 : c.min.z + (i + 0.5) * u, py = c.min.y + (j + 0.5) * v;
    const geo = alongX ? new THREE.BoxGeometry(w, h, 0.012) : new THREE.BoxGeometry(0.012, h, w);
    const m = new THREE.Mesh(geo, shardMat); m.position.set(px, py, pz); G.scene.add(m); dynamicObjects.push(m);
    const b = new CANNON.Body({ mass: 0.3, shape: new CANNON.Box(alongX ? new CANNON.Vec3(w / 2, h / 2, 0.006) : new CANNON.Vec3(0.006, h / 2, w / 2)), linearDamping: 0.1 });
    b.position.set(px, py, pz); const away = new THREE.Vector3(px - point.x, py - point.y, pz - point.z); const dist = Math.max(0.2, away.length()); const k = 1.4 / dist;
    b.velocity.set(dir.x * 2.5 * k + away.x * k * 0.6, dir.y * 2 * k + away.y * 0.4, dir.z * 2.5 * k + away.z * k * 0.6); b.angularVelocity.set(rr(-10, 10), rr(-10, 10), rr(-10, 10));
    G.world.addBody(b); G.props.push({ mesh: m, body: b, mat: 'glass', kind: 'shard', life: 12 });
  }
  FX.emit(point, dir, 50, '#d8f2ff', 3, 0.6, 1.8);
  navDirty = true;
}
function dynamicShards() { let n = 0; for (const p of G.props) if (p.kind === 'shard') n++; return n; }

/* ================= props ================= */
function prop(kind, x, y, z, ry = 0) {
  let mesh, shape, mass, matk = 'wood';
  const g = new THREE.Group();
  if (kind === 'chair') { add(g, RB(0.48, 0.08, 0.46, 0.02), MAT.fabric, [0, 0.46, 0]); add(g, RB(0.48, 0.5, 0.06, 0.02), MAT.fabric, [0, 0.76, -0.22]); for (const sx of [-0.2, 0.2]) for (const sz of [-0.2, 0.2]) add(g, C(0.015, 0.015, 0.46, 6), MAT.darkSteel, [sx, 0.23, sz]);
    g.children.forEach(c => c.position.y -= 0.5); shape = new CANNON.Box(new CANNON.Vec3(0.24, 0.5, 0.24)); mass = 6; matk = 'metal'; y += 0.5; }
  else if (kind === 'office') { add(g, RB(0.5, 0.1, 0.5, 0.03), MAT.leather, [0, 0.0, 0]); add(g, RB(0.5, 0.6, 0.08, 0.03), MAT.leather, [0, 0.35, -0.22]); add(g, C(0.03, 0.03, 0.4, 8), MAT.darkSteel, [0, -0.25, 0]); add(g, C(0.28, 0.28, 0.04, 10), MAT.darkSteel, [0, -0.45, 0]);
    shape = new CANNON.Box(new CANNON.Vec3(0.26, 0.45, 0.26)); mass = 9; matk = 'metal'; y += 0.47; }
  else if (kind === 'box') { const s = rr(0.35, 0.55); add(g, B(s, s * 0.8, s), MAT.cardboard, [0, 0, 0]); add(g, B(s * 1.01, 0.04, s * 0.3), M('#c8a868', 0.6), [0, s * 0.4, 0]); shape = new CANNON.Box(new CANNON.Vec3(s / 2, s * 0.4, s / 2)); mass = 4; y += s * 0.4; }
  else if (kind === 'bin') { add(g, C(0.18, 0.15, 0.45, 14), MAT.darkSteel, [0, 0, 0]); shape = new CANNON.Cylinder(0.18, 0.15, 0.45, 10); mass = 3; matk = 'metal'; y += 0.225; }
  else if (kind === 'bag') { add(g, SP(0.3, 14, 10), M('#8a7b5f', 0.95), [0, 0, 0], null, [1, 0.85, 1]); add(g, C(0.06, 0.1, 0.14, 8), M('#8a7b5f', 0.95), [0, 0.27, 0]); shape = new CANNON.Sphere(0.27); mass = 12; matk = 'flesh'; y += 0.26; }
  else if (kind === 'cart') { add(g, RB(0.9, 0.5, 0.55, 0.03), MAT.steel, [0, 0.1, 0]); for (let i = 0; i < 6; i++) add(g, B(0.16, 0.06, 0.08), MAT.cash, [-0.3 + (i % 3) * 0.3, 0.38, -0.12 + Math.floor(i / 3) * 0.24]); for (const sx of [-0.38, 0.38]) for (const sz of [-0.2, 0.2]) add(g, C(0.05, 0.05, 0.04, 8), MAT.black, [sx, -0.33, sz], [0, 0, PI / 2]);
    shape = new CANNON.Box(new CANNON.Vec3(0.45, 0.35, 0.28)); mass = 30; matk = 'metal'; y += 0.36; }
  else if (kind === 'monitor') { add(g, RB(0.5, 0.32, 0.04, 0.01), MAT.black, [0, 0.1, 0]); add(g, PL(0.46, 0.28), MAT.screen, [0, 0.1, 0.021]); add(g, B(0.05, 0.12, 0.05), MAT.black, [0, -0.1, 0]); add(g, B(0.2, 0.02, 0.15), MAT.black, [0, -0.16, 0]);
    shape = new CANNON.Box(new CANNON.Vec3(0.25, 0.17, 0.08)); mass = 4; matk = 'metal'; y += 0.17; }
  else if (kind === 'extinguisher') { add(g, C(0.07, 0.07, 0.45, 12), MAT.red, [0, 0, 0]); add(g, B(0.05, 0.06, 0.12), MAT.black, [0, 0.27, 0.03]); shape = new CANNON.Cylinder(0.07, 0.07, 0.45, 8); mass = 5; matk = 'metal'; y += 0.23; }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  mesh = g; mesh.position.set(x, y, z); mesh.rotation.y = ry; G.scene.add(mesh); dynamicObjects.push(mesh);
  const b = new CANNON.Body({ mass, shape, linearDamping: 0.05, angularDamping: 0.1 }); b.position.set(x, y, z); b.quaternion.setFromEuler(0, ry, 0); b.allowSleep = true; b.sleepSpeedLimit = 0.15; G.world.addBody(b); b.sleep();
  const p = { mesh, body: b, mat: matk, kind }; mesh.traverse(o => o.userData.prop = p); G.props.push(p); return p;
}
export function updateProps(dt) {
  for (let i = G.props.length - 1; i >= 0; i--) { const p = G.props[i];
    if (p.life !== undefined) { p.life -= dt; if (p.life <= 0) { G.scene.remove(p.mesh); G.world.removeBody(p.body); G.props.splice(i, 1); continue; } }
    if (p.body.sleepState === CANNON.Body.SLEEPING) continue; p.mesh.position.copy(p.body.position); p.mesh.quaternion.copy(p.body.quaternion); }
}
export function propMeshes() { const a = []; for (const p of G.props) a.push(p.mesh); return a; }

/* ================= navigation ================= */
const NAV = { x0: -17, z0: -31, cs: 0.4, nx: 85, nz: 143, block: null, dyn: null };
let navDirty = false;
function buildNav() {
  colMap = new Map(colliders.map(c => [c.id, c]));
  const { x0, z0, cs, nx, nz } = NAV; NAV.block = new Uint8Array(nx * nz); NAV.dyn = new Int32Array(nx * nz).fill(-1);
  const r = 0.28;
  for (const c of colliders) {
    if (!c.nav || c.min.y > 1.3 || c.max.y < 0.15) continue;
    const ix1 = Math.max(0, Math.floor((c.min.x - r - x0) / cs)), ix2 = Math.min(nx - 1, Math.floor((c.max.x + r - x0) / cs));
    const iz1 = Math.max(0, Math.floor((c.min.z - r - z0) / cs)), iz2 = Math.min(nz - 1, Math.floor((c.max.z + r - z0) / cs));
    for (let ix = ix1; ix <= ix2; ix++) for (let iz = iz1; iz <= iz2; iz++) {
      const k = iz * nx + ix;
      if (c.door || c.glass) { if (NAV.dyn[k] < 0) NAV.dyn[k] = c.id; } else NAV.block[k] = 1;
    }
  }
  // door openings: clear the wall padding across the doorway so agents can pass
  for (const d of doors) { const c = d.col;
    for (let ix = 0; ix < nx; ix++) for (let iz = 0; iz < nz; iz++) {
      const cx = x0 + (ix + 0.5) * cs, cz = z0 + (iz + 0.5) * cs; let along, perp;
      if (d.axis === 'x') { along = cx > d.x1 + 0.26 && cx < d.x1 + d.w - 0.26; perp = Math.abs(cz - d.z); } else { along = cz > d.z1 + 0.26 && cz < d.z1 + d.w - 0.26; perp = Math.abs(cx - d.x); }
      if (!along || perp > 0.75) continue; const k = iz * nx + ix; NAV.block[k] = 0; if (perp < 0.3) NAV.dyn[k] = c.id;
    } }
}
let colMap = new Map(); const colById = id => colMap.get(id);
function passable(k, opt) {
  if (NAV.block[k]) return false; const id = NAV.dyn[k]; if (id < 0) return true;
  const c = colById(id); if (!c) return true;
  if (c.door) { const d = c.door; if (d.broken) return true; if (d.locked) return !!opt.locked; return true; }
  if (c.glass) return c.glass.broken;
  return !c.on;
}
const cellOf = (x, z) => [Math.floor((x - NAV.x0) / NAV.cs), Math.floor((z - NAV.z0) / NAV.cs)];
const centerOf = (ix, iz) => V3(NAV.x0 + (ix + 0.5) * NAV.cs, 0, NAV.z0 + (iz + 0.5) * NAV.cs);
function nearestFree(ix, iz, opt) { for (let rad = 0; rad < 6; rad++) for (let dx = -rad; dx <= rad; dx++) for (let dz = -rad; dz <= rad; dz++) { const x = ix + dx, z = iz + dz; if (x < 0 || z < 0 || x >= NAV.nx || z >= NAV.nz) continue; if (passable(z * NAV.nx + x, opt)) return [x, z]; } return null; }
export function walkable(x, z, opt = {}) { const [ix, iz] = cellOf(x, z); if (ix < 0 || iz < 0 || ix >= NAV.nx || iz >= NAV.nz) return false; return passable(iz * NAV.nx + ix, opt); }
export function findPath(from, to, opt = {}) {
  const { nx, nz } = NAV; let [sx, sz] = cellOf(from.x, from.z), [tx, tz] = cellOf(to.x, to.z);
  const s = nearestFree(sx, sz, opt), t = nearestFree(tx, tz, opt); if (!s || !t) return null; [sx, sz] = s; [tx, tz] = t;
  const N = nx * nz, gS = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const start = sz * nx + sx, goal = tz * nx + tx; gS[start] = 0;
  const heap = [[0, start]]; const push = (f, k) => { heap.push([f, k]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  const h = (ix, iz) => { const dx = Math.abs(ix - tx), dz = Math.abs(iz - tz); return (dx + dz) + (1.4142 - 2) * Math.min(dx, dz); };
  let iter = 0; const dirs = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4142], [1, -1, 1.4142], [-1, 1, 1.4142], [-1, -1, 1.4142]];
  while (heap.length && iter++ < 25000) {
    const [, k] = pop(); if (closed[k]) continue; closed[k] = 1; if (k === goal) break;
    const ix = k % nx, iz = (k / nx) | 0;
    for (const [dx, dz, cost] of dirs) { const x = ix + dx, z = iz + dz; if (x < 0 || z < 0 || x >= nx || z >= nz) continue; const nk = z * nx + x; if (closed[nk] || !passable(nk, opt)) continue;
      if (dx && dz && (!passable(iz * nx + x, opt) || !passable(z * nx + ix, opt))) continue;
      const ng = gS[k] + cost; if (ng < gS[nk]) { gS[nk] = ng; came[nk] = k; push(ng + h(x, z), nk); } }
  }
  if (came[goal] < 0 && goal !== start) return null;
  const cells = []; for (let k = goal; k !== -1; k = came[k]) { cells.push(k); if (k === start) break; } cells.reverse();
  // string pulling on the grid
  const pts = []; let i = 0; const ck = k => [k % nx, (k / nx) | 0];
  pts.push(centerOf(...ck(cells[0])));
  while (i < cells.length - 1) { let j = cells.length - 1; while (j > i + 1 && !gridLine(ck(cells[i]), ck(cells[j]), opt)) j--; pts.push(centerOf(...ck(cells[j]))); i = j; }
  pts[pts.length - 1] = V3(to.x, 0, to.z); if (!walkable(to.x, to.z, opt)) pts[pts.length - 1] = centerOf(tx, tz);
  return pts;
}
function gridLine(a, b, opt) { let [x0, z0] = a; const [x1, z1] = b; const dx = Math.abs(x1 - x0), dz = Math.abs(z1 - z0), sx = x0 < x1 ? 1 : -1, sz = z0 < z1 ? 1 : -1; let err = dx - dz;
  for (let n = 0; n < 400; n++) { if (!passable(z0 * NAV.nx + x0, opt)) return false; if (x0 === x1 && z0 === z1) return true; const e2 = 2 * err; if (e2 > -dz) { err -= dz; x0 += sx; } if (e2 < dx) { err += dx; z0 += sz; } if (e2 > -dz && e2 < dx && (!passable(z0 * NAV.nx + (x0 - sx), opt) && !passable((z0 - sz) * NAV.nx + x0, opt))) return false; } return true; }

/* ================= level data ================= */
export const LV = {
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
LV.cameras[0].yaw = Math.atan2(-(-12.6), -(-8.6)); LV.cameras[1].yaw = Math.atan2(-(12.6), -(8.6)); LV.cameras[2].yaw = Math.atan2(0, -1);

/* ================= build ================= */
export const lights = {};
export function buildLevel() {
  makeMaterials();
  const m = MAT;
  // ---- rooms (order matters: inner first) ----
  room('Vault', -3.5, -24, 3.5, -18, 'tile', 0.8); room('Vault antechamber', -8, -18, 6, -9, 'tile', 0.85);
  room('Security', -16, -15, -8, -9, 'tile', 0.7); room('Archive', -16, -24, -8, -15, 'concrete', 0.35);
  room('Corridor', 6, -24, 8.4, -9, 'tile', 0.75); room('Manager office', 8.4, -16, 16, -9, 'carpet', 0.8); room('Break room', 8.4, -24, 16, -16, 'tile', 0.7);
  room('Teller area', -13, -9, 6, -4.2, 'marble', 0.9); room('Lobby', -13, -9, 13, 9, 'marble', 1, true, 6);
  room('Street', -22, 9, 22, 27, 'wet', 0.75, false); room('Back alley', -22, -35, 22, -24, 'wet', 0.5, false); room('Outside', -100, -100, 100, 100, 'wet', 0.6, false);
  // ---- floors ----
  { const gb = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() }); gb.quaternion.setFromEuler(-PI / 2, 0, 0); G.world.addBody(gb); }
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
  const vd = new THREE.Group(); vd.position.set(1.6, 1.75, -17.8); vd.rotation.y = 1.25; G.scene.add(vd); staticMeshes.push(vd);
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
  const policeCar = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.scene.add(g); staticMeshes.push(g);
    add(g, RB(1.9, 0.7, 4.6, 0.15, 3), M('#e8e8ea', 0.35, 0.5), [0, 0.6, 0]); add(g, RB(1.7, 0.55, 2.4, 0.15, 3), M('#151a22', 0.2, 0.6), [0, 1.15, -0.2]); add(g, B(1.92, 0.25, 4.62), M('#1a2a55', 0.4, 0.4), [0, 0.55, 0]);
    for (const [wx, wz] of [[-0.9, 1.4], [0.9, 1.4], [-0.9, -1.5], [0.9, -1.5]]) add(g, C(0.36, 0.36, 0.25, 16), m.black, [wx, 0.36, wz], [0, 0, PI / 2]);
    const r = add(g, B(0.6, 0.12, 0.25), new THREE.MeshBasicMaterial({ color: '#ff2020', toneMapped: false }), [-0.35, 1.5, -0.2]); const b = add(g, B(0.6, 0.12, 0.25), new THREE.MeshBasicMaterial({ color: '#2050ff', toneMapped: false }), [0.35, 1.5, -0.2]);
    const c = Math.cos(ry), s = Math.sin(ry); const hw = 1.0, hl = 2.35; const ex = Math.abs(c) * hw + Math.abs(s) * hl, ez = Math.abs(s) * hw + Math.abs(c) * hl; addCollider(x - ex, 0, z - ez, x + ex, 1.3, z + ez, { vis: false, mat: 'metal' }); return [r, b]; };
  lights.bars = [...policeCar(-5.5, 16, 0.35), ...policeCar(6, 17.5, -0.5)];
  for (let i = 0; i < 6; i++) { const x = -9 + i * 3.6; deco(B(1.6, 0.9, 0.4), m.yellow, [x, 0.45, 20.5]); addCollider(x - 0.8, 0, 20.3, x + 0.8, 0.9, 20.7, { vis: false, mat: 'wood', pen: true }); }
  // ---- back alley ----
  for (const x of [-22, 22]) addCollider(x - 0.2, 0, -36, x + 0.2, 4, -24.3, { vm: m.brick, uv: 3 }); addCollider(-22, 0, -36.2, 22, 6, -35.8, { vm: m.brick, uv: 3 });
  { const g = new THREE.Group(); g.position.set(-2, 0, -29.5); G.scene.add(g); staticMeshes.push(g); add(g, RB(2.0, 2.0, 5.0, 0.2, 3), M('#2a2c2e', 0.5, 0.4), [0, 1.2, 0]); add(g, RB(1.9, 0.6, 1.2, 0.1, 2), M('#0b0e12', 0.1, 0.8), [0, 1.8, 2.0]); for (const [wx, wz] of [[-1, 1.6], [1, 1.6], [-1, -1.6], [1, -1.6]]) add(g, C(0.38, 0.38, 0.3, 16), m.black, [wx, 0.38, wz], [0, 0, PI / 2]);
    addCollider(-3.05, 0, -32.05, -0.95, 2.2, -26.95, { vis: false, mat: 'metal' }); }
  addCollider(11, 0, -26.2, 13, 1.4, -25, { vm: M('#2f4a2f', 0.6, 0.5), mat: 'metal' });
  // ---- lights ----
  G.scene.add(new THREE.HemisphereLight('#3a4660', '#120e0a', 0.42));
  const moon = new THREE.DirectionalLight('#9fb8ff', 1.4); moon.position.set(5, 12, 26); moon.target.position.set(0, 0, -2); G.scene.add(moon, moon.target);
  moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -16, right: 16, top: 14, bottom: -14, near: 5, far: 60 }); moon.shadow.bias = -0.0005; moon.shadow.normalBias = 0.04;
  lights.lobby = [pointLight('#ffd9a0', 11, 14, -7, 5.5, 1), pointLight('#ffd9a0', 11, 14, 7, 5.5, 1), pointLight('#ffd9a0', 9, 13, 0, 5.5, -6)];
  pointLight('#e8f4ff', 9, 12, -1, 3.6, -13.5); pointLight('#ffbe5c', 10, 8, 0, 2.8, -21); pointLight('#7fc8ff', 6, 9, -12, 3.4, -12); pointLight('#c8d8e8', 2.5, 9, -12, 3.4, -20);
  pointLight('#eef6ff', 6, 12, 7.2, 3.6, -16); pointLight('#ffdcae', 7, 10, 12, 3.4, -12.5); pointLight('#eef6ff', 5, 10, 12, 3.4, -20);
  lights.police = pointLight('#ff2a2a', 0, 28, 0, 2.2, 15); lights.alley = pointLight('#ffaa55', 7, 16, 4, 4, -30);
  for (let i = 0; i < 5; i++) { const l = new THREE.PointLight('#ffffff', 0, 10, 1.8); G.scene.add(l); lightPool.push(l); }
  lights.alarm = new THREE.SpotLight('#ff2a1a', 0, 22, 0.45, 0.6, 1.5); lights.alarm.position.set(0, 5.7, 0); G.scene.add(lights.alarm, lights.alarm.target);
  lights.alarmBulbs = []; for (const [x, y, z] of [[0, 5.75, -8.7], [-12.7, 5.5, 0], [12.7, 5.5, 0], [7.2, 3.8, -9.3], [-2, 3.8, -9.6]]) { const b = deco(SP(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: '#401010' }), [x, y, z], null, null, false); lights.alarmBulbs.push(b); }
  lights.moon = moon;
  // ---- sky, rain ----
  const skyTex = canvasTex(1024, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#05070c'); gr.addColorStop(1, '#141b28'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = rng(21);
    for (let i = 0; i < 30; i++) { const bw = 30 + r() * 70, bh = 120 + r() * 300, x = r() * w; g.fillStyle = '#07090d'; g.fillRect(x, h - bh, bw, bh); for (let yy = h - bh + 8; yy < h - 6; yy += 12) for (let xx = x + 5; xx < x + bw - 6; xx += 10) if (r() < 0.2) { g.fillStyle = r() < .5 ? '#e7c27a' : '#9cb4d8'; g.globalAlpha = 0.35 + r() * 0.5; g.fillRect(xx, yy, 5, 6); g.globalAlpha = 1; } } });
  lights.skyMat = new THREE.MeshBasicMaterial({ map: skyTex, fog: false });
  for (const [z, ry] of [[40, PI], [-46, 0]]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(130, 40), lights.skyMat); s.position.set(0, 14, z); s.rotation.y = ry; G.scene.add(s); }
  const n = 2400, pos = new Float32Array(n * 6), vel = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = rr(-22, 22), y = rr(0, 14), z = i < n * 0.6 ? rr(9.5, 30) : rr(-36, -24.5); pos.set([x, y, z, x + 0.02, y - 0.45, z], i * 6); vel[i] = rr(14, 20); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  lights.rain = { mesh: new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: '#8fa6c0', transparent: true, opacity: 0.32 })), pos, vel, n }; lights.rain.mesh.frustumCulled = false; G.scene.add(lights.rain.mesh);
  lights.nextBolt = 8;
  // CCTV visuals
  lights.cams = LV.cameras.map(c => { const g = new THREE.Group(); g.position.copy(c.pos); g.rotation.y = c.yaw; G.scene.add(g); staticMeshes.push(g);
    const head = new THREE.Group(); head.rotation.x = c.pitch; g.add(head); add(head, RB(0.16, 0.14, 0.34, 0.03), M('#d8d8d4', 0.4, 0.3), [0, 0, -0.12]); add(head, C(0.05, 0.05, 0.05, 12), m.black, [0, 0, -0.3], RX);
    const led = add(head, SP(0.02, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff2a1a', toneMapped: false }), [0.05, 0.06, -0.25], null, null, false);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 9, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#ff3020', transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    cone.rotation.x = PI / 2; cone.position.z = -4.6; cone.geometry.rotateY(0); head.add(cone);
    const hb = new THREE.Mesh(B(0.3, 0.3, 0.5), new THREE.MeshBasicMaterial({ visible: false })); hb.position.z = -0.15; head.add(hb);
    return { g, head, led, cone, hb, data: c, alive: true, sweep: R() * 6, base: c.yaw };
  });
  buildDynamic();
  buildNav();
}

/* dynamic parts that reset with the mission */
export function buildDynamic() {
  const m = MAT;
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
  // pickups / interactables
  for (const p of LV.pickups) {
    const g = new THREE.Group(); g.position.copy(p.pos); G.scene.add(g); dynamicObjects.push(g);
    if (p.kind === 'medkit') { add(g, RB(0.3, 0.22, 0.12, 0.02), M('#d8d8d0', 0.5), [0, 0, 0]); add(g, B(0.1, 0.03, 0.125), m.red, [0, 0, 0]); add(g, B(0.03, 0.1, 0.125), m.red, [0, 0, 0]); g.rotation.y = p.ry || 0; }
    else if (p.kind === 'ammo') { add(g, RB(0.7, 0.3, 0.35, 0.08), M('#2f3326', 0.9), [0, 0, 0]); add(g, PL(0.15, 0.15), M('#ffffff', 0.8, 0, { map: canvasTex(64, 64, gg => { gg.fillStyle = '#f29b2b'; gg.fillRect(0, 0, 64, 64); gg.fillStyle = '#111'; gg.font = '800 22px sans-serif'; gg.fillText('T24', 10, 40); }) }), [0, 0, 0.176], null, null, false); }
    else if (p.kind === 'intel') { add(g, PL(0.21, 0.29), M('#f3efd8', 0.8), [0, 0.001, 0], [-PI / 2, 0, 0.3], null, false); add(g, B(0.03, 0.002, 0.03), M('#ffd34d', 0.4, 0, { emissive: '#ffb300', emissiveIntensity: 1 }), [0.06, 0.003, -0.08]); }
    interactables.push({ kind: p.kind, pos: p.pos.clone(), label: p.label, obj: g, used: false });
  }
  { const g = new THREE.Group(); g.position.copy(LV.console); G.scene.add(g); dynamicObjects.push(g); add(g, RB(0.6, 0.06, 0.3, 0.01), m.black, [0, -0.2, 0]); for (let i = 0; i < 12; i++) add(g, B(0.04, 0.015, 0.04), new THREE.MeshBasicMaterial({ color: i % 3 ? '#4fd1c5' : '#ff5340', toneMapped: false }), [-0.24 + (i % 6) * 0.09, -0.16, -0.06 + Math.floor(i / 6) * 0.1], null, null, false);
    interactables.push({ kind: 'console', pos: LV.console.clone(), label: 'CCTV bondho koro', obj: g, used: false }); }
  { const g = new THREE.Group(); g.position.copy(LV.bomb); G.scene.add(g); dynamicObjects.push(g);
    add(g, RB(0.6, 0.25, 0.35, 0.03), M('#2a2c22', 0.7), [0, 0, 0]); for (let i = 0; i < 4; i++) add(g, C(0.05, 0.05, 0.5, 10), M('#8a5a2a', 0.8), [0, 0.06, -0.12 + i * 0.08], [0, 0, PI / 2]);
    const disp = add(g, PL(0.2, 0.08), new THREE.MeshBasicMaterial({ color: '#ff3020', toneMapped: false }), [0, 0.13, 0.176], [0, 0, 0], null, false);
    ['#d22', '#26f', '#2c4', '#ec2'].forEach((col, i) => add(g, C(0.006, 0.006, 0.3, 6), new THREE.MeshBasicMaterial({ color: col }), [-0.1 + i * 0.07, 0.16, 0.05], [0, 0, PI / 2 + 0.3], null, false));
    interactables.push({ kind: 'bomb', pos: LV.bomb.clone(), label: 'Bomb defuse koro', obj: g, used: false, disp }); }
}
export function clearDynamic() {
  for (const o of dynamicObjects) { if (o.parent) o.parent.remove(o); }
  dynamicObjects = [];
  for (const p of G.props) { G.world.removeBody(p.body); if (p.mesh.parent) p.mesh.parent.remove(p.mesh); } G.props.length = 0;
  for (let i = colliders.length - 1; i >= 0; i--) { const c = colliders[i]; if (c.dyn) { if (c.body && c.on) G.world.removeBody(c.body); if (c.mesh && c.mesh.parent) c.mesh.parent.remove(c.mesh); colliders.splice(i, 1); } }
  doors.length = 0; glassPanes.length = 0; interactables.length = 0;
  for (const cam of lights.cams) { cam.alive = true; cam.g.visible = true; cam.head.rotation.z = 0; }
}
export function resetLevel() { clearDynamic(); buildDynamic(); buildNav(); }

let flashT = 0;
export function updateLevel(dt, t, alarm) {
  for (const d of doors) d.update(dt);
  if (navDirty) { navDirty = false; }
  updateProps(dt);
  // police light bars
  const ph = Math.floor(t * 3.2) % 2, strobe = Math.sin(t * 40) > 0 ? 1 : 0.25;
  lights.police.color.set(ph ? '#ff2a2a' : '#2a5cff'); lights.police.intensity = 16 * strobe; assignLights();
  lights.bars[0].visible = lights.bars[2].visible = !!ph; lights.bars[1].visible = lights.bars[3].visible = !ph;
  // alarm
  lights.alarm.intensity = alarm ? 70 : 0; if (alarm) lights.alarm.target.position.set(Math.cos(t * 2.4) * 8, 0, Math.sin(t * 2.4) * 6);
  const on = alarm && (t % 0.8) < 0.4; for (const b of lights.alarmBulbs) b.material.color.set(on ? '#ff2a1a' : '#401010');
  // rain
  const Rn = lights.rain; for (let i = 0; i < Rn.n; i++) { const j = i * 6, dy = Rn.vel[i] * dt; Rn.pos[j + 1] -= dy; Rn.pos[j + 4] -= dy; if (Rn.pos[j + 4] < 0) { const y = 13 + R() * 3; Rn.pos[j + 1] = y; Rn.pos[j + 4] = y - 0.45; } } Rn.mesh.geometry.attributes.position.needsUpdate = true;
  // lightning
  lights.nextBolt -= dt; if (lights.nextBolt <= 0) { flashT = 0.5; lights.nextBolt = rr(9, 20); A.thunder(); }
  if (flashT > 0) { flashT -= dt; const f = (flashT > 0.38 || (flashT > 0.2 && flashT < 0.28)) ? 1 : 0; lights.moon.intensity = 1.4 + f * 5; lights.skyMat.color.setScalar(1 + f * 2.5); } else { lights.moon.intensity = 1.4; lights.skyMat.color.setScalar(1); }
}
