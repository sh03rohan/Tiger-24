// Tiger 24 — level kit: shared geometry helpers, colliders, ray tests, doors, glass, props, navigation, environment
import { THREE, CANNON, G, PI, TAU, M, B, RB, C, SP, PL, RX, add, canvasTex, rng, clamp, R, rr, A, FX, emitNoise, V3, setSkyEnv } from './core.js';

export const colliders = [];       // {min,max,mat,pen,low,on,mesh,body,door,glass,dyn,id}
export const doors = [];
export const glassPanes = [];
export const rooms = [];
export const interactables = [];   // {kind,pos,label,...}
export let LG = null;               // current level group
const levelBodies = [];

/* ================= materials ================= */
let MAT = null;
export function makeMaterials() {
  if (MAT) return MAT;
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
    m.castShadow = o.cast !== false; m.receiveShadow = true; LG.add(m); c.mesh = m;
    if (o.uv) scaleUV(m.geometry, w, h, d, o.uv);
    
  }
  if (o.body !== false) {
    const b = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3((c.max.x - c.min.x) / 2, (c.max.y - c.min.y) / 2, (c.max.z - c.min.z) / 2)) });
    b.position.set((c.min.x + c.max.x) / 2, (c.min.y + c.max.y) / 2, (c.min.z + c.max.z) / 2); G.world.addBody(b); c.body = b; levelBodies.push(b);
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
export function wallX(z, x1, x2, h, vm, openings = [], o = {}) { // wall running along X at z
  const ops = openings.slice().sort((a, b) => a.a - b.a); let x = x1;
  for (const op of ops) { if (op.a > x) addCollider(x, 0, z - T / 2, op.a, h, z + T / 2, { vm, uv: 2, ...o }); if (op.y1 < h) addCollider(op.a, op.y1, z - T / 2, op.b, h, z + T / 2, { vm, uv: 2, ...o }); if (op.y0 > 0) addCollider(op.a, 0, z - T / 2, op.b, op.y0, z + T / 2, { vm, uv: 2, ...o }); x = op.b; }
  if (x < x2) addCollider(x, 0, z - T / 2, x2, h, z + T / 2, { vm, uv: 2, ...o });
}
export function wallZ(x, z1, z2, h, vm, openings = [], o = {}) {
  const ops = openings.slice().sort((a, b) => a.a - b.a); let z = z1;
  for (const op of ops) { if (op.a > z) addCollider(x - T / 2, 0, z, x + T / 2, h, op.a, { vm, uv: 2, ...o }); if (op.y1 < h) addCollider(x - T / 2, op.y1, op.a, x + T / 2, h, op.b, { vm, uv: 2, ...o }); if (op.y0 > 0) addCollider(x - T / 2, 0, op.a, x + T / 2, op.y0, op.b, { vm, uv: 2, ...o }); z = op.b; }
  if (z < z2) addCollider(x - T / 2, 0, z, x + T / 2, h, z2, { vm, uv: 2, ...o });
}
export function floor(x1, z1, x2, z2, m, y = 0) { const f = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), m); f.rotation.x = -PI / 2; f.position.set((x1 + x2) / 2, y, (z1 + z2) / 2); f.receiveShadow = true; LG.add(f); return f; }
export function ceiling(x1, z1, x2, z2, h, m) { const f = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), m); f.rotation.x = PI / 2; f.position.set((x1 + x2) / 2, h, (z1 + z2) / 2); LG.add(f); return f; }
export function deco(geo, m, pos, rot, scl, shadow = true) { const o = add(LG, geo, m, pos, rot, scl, shadow); return o; }
export const anchors = []; export const lightPool = [];
export function pointLight(color, intensity, dist, x, y, z) { const a = { color: new THREE.Color(color), intensity, dist, pos: V3(x, y, z) }; anchors.push(a); return a; }
export function assignLights() { const cp = G.camera.position; anchors.forEach(a => a.d = a.pos.distanceToSquared(cp) / (a.dist * a.dist)); const sorted = anchors.slice().sort((a, b) => a.d - b.d);
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
export const smokes = [];
function smokeBlocks(a, d, L) { for (const s of smokes) { if (s.t <= 0) continue; const ox = s.pos.x - a.x, oy = s.pos.y - a.y, oz = s.pos.z - a.z; const t = clamp(ox * d.x + oy * d.y + oz * d.z, 0, L); const px = a.x + d.x * t - s.pos.x, py = a.y + d.y * t - s.pos.y, pz = a.z + d.z * t - s.pos.z; if (px * px + py * py + pz * pz < s.r * s.r) return true; } return false; }
export function los(a, b, seeThroughGlass = true) {
  _ld.subVectors(b, a); const L = _ld.length(); if (L < 1e-4) return true; _ld.divideScalar(L);
  if (smokes.length && smokeBlocks(a, _ld, L)) return false;
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
export function room(name, x1, z1, x2, z2, surface, light, indoor = true, ceil = 4) { rooms.push({ name, x1, z1, x2, z2, surface, light, indoor, ceil }); }
export function roomAt(x, z) { for (const r of rooms) if (x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2) return r; return rooms[rooms.length - 1]; }

/* ================= doors ================= */
export class Door {
  constructor(o) {
    Object.assign(this, { locked: false, broken: false, angle: 0, target: 0, glassDoor: false, h: 2.3 }, o);
    // axis 'x': door lies along x in a wall at z; hinge at (x1,z). axis 'z': along z in wall at x; hinge at (x, z1)
    this.pivot = new THREE.Group(); LG.add(this.pivot); 
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
    this.pivot.remove(this.mesh); LG.add(this.mesh); this.mesh.position.copy(wp); this.mesh.quaternion.copy(wq);
    const half = this.axis === 'x' ? new CANNON.Vec3(this.w / 2, this.h / 2, 0.03) : new CANNON.Vec3(0.03, this.h / 2, this.w / 2);
    const b = new CANNON.Body({ mass: 25, shape: new CANNON.Box(half) }); b.position.set(wp.x, wp.y, wp.z); b.quaternion.set(wq.x, wq.y, wq.z, wq.w);
    const dir = this.center.clone().sub(fromPos).setY(0).normalize(); b.velocity.set(dir.x * 9, 2.5, dir.z * 9); b.angularVelocity.set(rr(-3, 3), rr(-2, 2), rr(-3, 3)); G.world.addBody(b);
    G.props.push({ mesh: this.mesh, body: b, mat: 'wood', kind: 'door' }); this.pivot.visible = false;
  }
  update(dt) { if (this.broken) return; this.angle += (this.target - this.angle) * Math.min(1, dt * 7); this.pivot.rotation.y = this.angle; setColliderOn(this.col, Math.abs(this.angle) < 0.2); }
}
export function doorNear(p, maxD = 2.2) { let best = null, bd = maxD; for (const d of doors) { const dist = Math.hypot(d.center.x - p.x, d.center.z - p.z); if (dist < bd) { bd = dist; best = d; } } return best; }

/* ================= glass ================= */
export function addGlass(x1, y1, z1, x2, y2, z2) {
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
    const m = new THREE.Mesh(geo, shardMat); m.position.set(px, py, pz); LG.add(m);
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
export function prop(kind, x, y, z, ry = 0) {
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
  mesh = g; mesh.position.set(x, y, z); mesh.rotation.y = ry; LG.add(mesh); 
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
export const NAV = { x0: -17, z0: -31, cs: 0.4, nx: 85, nz: 143, block: null, dyn: null };
let navDirty = false;
export function buildNav(b) {
  if (b) { NAV.x0 = b.x0; NAV.z0 = b.z0; NAV.nx = Math.ceil((b.x1 - b.x0) / NAV.cs); NAV.nz = Math.ceil((b.z1 - b.z0) / NAV.cs); }
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

/* ================= mission data (current level) ================= */
export const LV = {};
export const lights = { cams: [], bars: [], alarmBulbs: [] };
let ENV = {};

export function unloadLevel() {
  if (LG) { G.scene.remove(LG); LG.traverse(o => { if (o.geometry && !o.geometry.userData.shared) { /* geometries may be cached; keep */ } }); }
  for (const b of levelBodies) G.world.removeBody(b); levelBodies.length = 0;
  for (const c of colliders) if (c.body && c.on) G.world.removeBody(c.body);
  for (const p of G.props) { G.world.removeBody(p.body); p.mesh.parent && p.mesh.parent.remove(p.mesh); } G.props.length = 0;
  colliders.length = 0; doors.length = 0; glassPanes.length = 0; rooms.length = 0; interactables.length = 0; anchors.length = 0; lightPool.length = 0;
  lights.cams = []; lights.bars = []; lights.alarmBulbs = []; lights.rain = null; lights.police = null; lights.alarm = null; lights.moon = null; lights.skyMat = null;
  for (const k of Object.keys(LV)) delete LV[k]; smokes.length = 0; lights.dust = null; lights.shafts = [];
  if (G.pmrem) setSkyEnv(null); LG = null;
}
export function beginLevel(env = {}) {
  unloadLevel(); makeMaterials(); ENV = env;
  LG = new THREE.Group(); LG.name = 'level'; G.scene.add(LG);
  const gb = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() }); gb.quaternion.setFromEuler(-PI / 2, 0, 0); G.world.addBody(gb); levelBodies.push(gb);
  G.scene.background = new THREE.Color(env.bg || '#05070a'); G.scene.fog = new THREE.FogExp2(env.fog || '#06080b', env.fogD ?? 0.014);
  G.scene.environmentIntensity = env.envI ?? 0.22;
  const hI = env.hemi ?? 0.42; LG.add(new THREE.HemisphereLight(env.hemiSky || '#3a4660', env.hemiGround || '#120e0a', hI < 1.5 ? hI * 2.2 : hI)); // three's physically based hemi light is divided by PI, so lift the legacy values
  const moon = new THREE.DirectionalLight(env.sunColor || '#9fb8ff', env.sun ?? 1.4); const sp = env.sunPos || [5, 12, 26]; moon.position.set(...sp); const st = env.sunTarget || [0, 0, -2]; moon.target.position.set(...st); LG.add(moon, moon.target);
  moon.castShadow = true; const ss = env.shadowSize || 16; moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -ss, right: ss, top: ss, bottom: -ss, near: 1, far: env.shadowFar || 80 }); moon.shadow.bias = -0.0005; moon.shadow.normalBias = 0.04;
  lights.moon = moon; lights.sunBase = env.sun ?? 1.4;
  for (let i = 0; i < 5; i++) { const l = new THREE.PointLight('#ffffff', 0, 10, 1.8); LG.add(l); lightPool.push(l); }
  lights.alarm = new THREE.SpotLight('#ff2a1a', 0, 22, 0.45, 0.6, 1.5); const ap = env.alarmPos || [0, 5.7, 0]; lights.alarm.position.set(...ap); LG.add(lights.alarm, lights.alarm.target);
  for (const [x, y, z] of (env.alarmBulbs || [])) { const b = deco(SP(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: '#401010' }), [x, y, z], null, null, false); lights.alarmBulbs.push(b); }
  if (env.sky !== false) { const skyTex = env.skyTex || cityTex(env.skyTop, env.skyBottom, env.city !== false); lights.skyMat = new THREE.MeshBasicMaterial({ map: skyTex, fog: false });
    const d = env.skyDist || 60; for (const [x, z, ry] of [[0, d, PI], [0, -d, 0], [d, 0, -PI / 2], [-d, 0, PI / 2]]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(d * 2.2, 50), lights.skyMat); s.position.set(x + (env.skyCx || 0), 14, z + (env.skyCz || 0)); s.rotation.y = ry; LG.add(s); } }
  if (env.rain) { const vols = env.rain; const n = env.rainN || 2400, pos = new Float32Array(n * 6), vel = new Float32Array(n);
    const sl = env.snow ? 0.05 : 0.45; for (let i = 0; i < n; i++) { const v = vols[i % vols.length]; const x = rr(v[0], v[2]), y = rr(0, 14), z = rr(v[1], v[3]); pos.set([x, y, z, x + 0.02, y - sl, z], i * 6); vel[i] = env.snow ? rr(1.2, 2.4) : rr(14, 20); }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    lights.rain = { mesh: new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: env.snow ? '#ffffff' : '#8fa6c0', transparent: true, opacity: env.snow ? 0.8 : 0.32 })), pos, vel, n, sl, snow: !!env.snow }; lights.rain.mesh.frustumCulled = false; LG.add(lights.rain.mesh); }
  lights.nextBolt = env.lightning ? 8 : Infinity;
  if (env.police) { lights.police = pointLight('#ff2a2a', 0, 28, ...env.police); }
  // reflections that match the sky outdoors
  if (env.skyEnv && G.pmrem) setSkyEnv(env.skyTop || '#1a2236', env.skyBottom || '#3a4660', env.hemiGround, env.sunPos ? [env.sunPos[0] - (env.sunTarget || [0, 0, 0])[0], env.sunPos[1] - (env.sunTarget || [0, 0, 0])[1], env.sunPos[2] - (env.sunTarget || [0, 0, 0])[2]] : null, env.sunColor);
  // per-level colour grade
  if (G.grade) { const gr = Object.assign({ sat: 1.06, contrast: 1.07, vig: 0.42, sh: [0.95, 1.0, 1.06], hi: [1.04, 1.0, 0.95] }, env.grade || {}); const u = G.grade.uniforms; u.sat.value = gr.sat; u.contrast.value = gr.contrast; u.vig.value = gr.vig; u.sh.value.set(...gr.sh); u.hi.value.set(...gr.hi); }
  // floating dust in the air (catches the light)
  if (!env.rain && env.dust !== false) { const n = 700, pos = new Float32Array(n * 3), base = new Float32Array(n * 3); for (let i = 0; i < n * 3; i++) base[i] = R() * 14;
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { col: { value: new THREE.Color(env.dustColor || '#fff2dc') }, op: { value: env.dustOpacity ?? 0.38 }, px: { value: 300 } },
      vertexShader: 'uniform float px; varying float vA; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); float d = -mv.z; vA = smoothstep(0.6,1.6,d) * (1.0 - smoothstep(4.5,7.0,d)); gl_PointSize = clamp(px*0.012/d, 1.0, 4.0); gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'uniform vec3 col; uniform float op; varying float vA; void main(){ vec2 c = gl_PointCoord-0.5; float a = smoothstep(0.5,0.0,length(c)) * op * vA; gl_FragColor = vec4(col*a, a); }' });
    const pts = new THREE.Points(dg, dm); pts.frustumCulled = false; LG.add(pts); lights.dust = { pts, pos, base, n }; }
  lights.shafts = [];
  return LG;
}
let _dustTex = null;
function dustTex() { if (!_dustTex) _dustTex = canvasTex(32, 32, g => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }); return _dustTex; }
/* volumetric-looking light shaft: additive cone that fades along its length and at grazing edges */
const shaftMat = (color, op) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
  uniforms: { col: { value: new THREE.Color(color) }, op: { value: op }, t: { value: 0 } },
  vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vY = uv.y; vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); vW = (modelMatrix*vec4(position,1.)).xyz; gl_Position = projectionMatrix*mv; }',
  fragmentShader: 'uniform vec3 col; uniform float op,t; varying float vY; varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ float e = pow(abs(dot(normalize(vN), normalize(vV))), 2.2); float n = 0.75 + 0.25*sin(vW.x*3.1+vW.z*2.3+t*0.6)*sin(vW.y*4.0-t*0.4); float a = op * pow(vY, 1.6) * e * n; gl_FragColor = vec4(col*a, a); }' });
export function shaft(pos, dir, len = 6, r0 = 0.3, r1 = 1.4, color = '#ffe8c0', op = 0.18) {
  const geo = new THREE.CylinderGeometry(r0, r1, len, 20, 1, true); geo.translate(0, -len / 2, 0);
  const m = new THREE.Mesh(geo, shaftMat(color, op)); m.position.copy(pos); m.quaternion.setFromUnitVectors(V3(0, -1, 0), dir.clone().normalize()); m.renderOrder = 5; LG.add(m); lights.shafts.push(m); return m;
}
export function cityTex(top = '#05070c', bottom = '#141b28', city = true) {
  return canvasTex(1024, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, w, h); if (!city) return; const r = rng(21);
    for (let i = 0; i < 30; i++) { const bw = 30 + r() * 70, bh = 120 + r() * 300, x = r() * w; g.fillStyle = '#07090d'; g.fillRect(x, h - bh, bw, bh); for (let yy = h - bh + 8; yy < h - 6; yy += 12) for (let xx = x + 5; xx < x + bw - 6; xx += 10) if (r() < 0.2) { g.fillStyle = r() < .5 ? '#e7c27a' : '#9cb4d8'; g.globalAlpha = 0.35 + r() * 0.5; g.fillRect(xx, yy, 5, 6); g.globalAlpha = 1; } } });
}
export function buildCameras(list) {
  const m = MAT;
  lights.cams = list.map(c => { const g = new THREE.Group(); g.position.copy(c.pos); g.rotation.y = c.yaw; LG.add(g);
    const head = new THREE.Group(); head.rotation.x = c.pitch; g.add(head); add(head, RB(0.16, 0.14, 0.34, 0.03), M('#d8d8d4', 0.4, 0.3), [0, 0, -0.12]); add(head, C(0.05, 0.05, 0.05, 12), m.black, [0, 0, -0.3], RX);
    const led = add(head, SP(0.02, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff2a1a', toneMapped: false }), [0.05, 0.06, -0.25], null, null, false);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 9, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#ff3020', transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    cone.rotation.x = PI / 2; cone.position.z = -4.6; head.add(cone);
    const hb = new THREE.Mesh(B(0.3, 0.3, 0.5), new THREE.MeshBasicMaterial({ visible: false })); hb.position.z = -0.15; head.add(hb);
    return { g, head, led, cone, hb, data: c, alive: true, sweep: R() * 6, base: c.yaw };
  });
}
export function camLook(from, to) { return Math.atan2(-(to.x - from.x), -(to.z - from.z)); }
export function addInteractable(kind, pos, label, obj, extra = {}) { const it = Object.assign({ kind, pos: pos.clone(), label, obj, used: false }, extra); interactables.push(it); return it; }
export function pickupModel(kind, pos, ry = 0) {
  const m = MAT; const g = new THREE.Group(); g.position.copy(pos); g.rotation.y = ry; LG.add(g);
  if (kind === 'medkit') { add(g, RB(0.3, 0.22, 0.12, 0.02), M('#d8d8d0', 0.5), [0, 0, 0]); add(g, B(0.1, 0.03, 0.125), m.red, [0, 0, 0]); add(g, B(0.03, 0.1, 0.125), m.red, [0, 0, 0]); }
  else if (kind === 'ammo') { add(g, RB(0.7, 0.3, 0.35, 0.08), M('#2f3326', 0.9), [0, 0, 0]); add(g, PL(0.15, 0.15), M('#f29b2b', 0.8), [0, 0, 0.176], null, null, false); }
  else if (kind === 'intel') { add(g, PL(0.21, 0.29), M('#f3efd8', 0.8), [0, 0.001, 0], [-PI / 2, 0, 0.3], null, false); add(g, B(0.03, 0.002, 0.03), M('#ffd34d', 0.4, 0, { emissive: '#ffb300', emissiveIntensity: 1 }), [0.06, 0.003, -0.08]); }
  else if (kind === 'chip') { add(g, RB(0.3, 0.08, 0.2, 0.02), M('#1a2a22', 0.4, 0.5), [0, 0, 0]); add(g, B(0.12, 0.012, 0.08), M('#39ff9a', 0.3, 0, { emissive: '#39ff9a', emissiveIntensity: 1.5 }), [0, 0.046, 0]); }
  else if (kind === 'console') { add(g, RB(0.6, 0.06, 0.3, 0.01), m.black, [0, -0.2, 0]); for (let i = 0; i < 12; i++) add(g, B(0.04, 0.015, 0.04), new THREE.MeshBasicMaterial({ color: i % 3 ? '#4fd1c5' : '#ff5340', toneMapped: false }), [-0.24 + (i % 6) * 0.09, -0.16, -0.06 + Math.floor(i / 6) * 0.1], null, null, false); }
  else if (kind === 'lever') { add(g, RB(0.5, 0.9, 0.3, 0.03), m.darkSteel, [0, 0.45, 0]); add(g, C(0.03, 0.03, 0.6, 8), m.red, [0, 1.1, 0.1], [0.5, 0, 0]); add(g, SP(0.07, 10, 8), m.red, [0, 1.36, 0.25]); }
  return g;
}
export function bombModel(pos) {
  const g = new THREE.Group(); g.position.copy(pos); LG.add(g);
  add(g, RB(0.6, 0.25, 0.35, 0.03), M('#2a2c22', 0.7), [0, 0, 0]); for (let i = 0; i < 4; i++) add(g, C(0.05, 0.05, 0.5, 10), M('#8a5a2a', 0.8), [0, 0.06, -0.12 + i * 0.08], [0, 0, PI / 2]);
  const disp = add(g, PL(0.2, 0.08), new THREE.MeshBasicMaterial({ color: '#ff3020', toneMapped: false }), [0, 0.13, 0.176], [0, 0, 0], null, false);
  ['#d22', '#26f', '#2c4', '#ec2'].forEach((col, i) => add(g, C(0.006, 0.006, 0.3, 6), new THREE.MeshBasicMaterial({ color: col }), [-0.1 + i * 0.07, 0.16, 0.05], [0, 0, PI / 2 + 0.3], null, false));
  return { g, disp };
}
export function heliModel(pos, ry = 0, color = '#2f342b', parent = null) {
  makeMaterials(); const heli = new THREE.Group(); heli.position.copy(pos); heli.rotation.y = ry; (parent || LG).add(heli);
  const body = M(color, 0.5, 0.45), dark = M('#15181a', 0.4, 0.6), glass = M('#0d1418', 0.05, 0.9);
  add(heli, new THREE.CapsuleGeometry(0.95, 2.4, 4, 12), body, [0, 1.65, 0.2], RX, [1, 0.92, 1]); add(heli, SP(0.92, 16, 11), glass, [0, 1.72, 1.45], null, [0.97, 0.85, 1.05]);
  add(heli, RB(1.15, 0.55, 2.2, 0.18, 2), body, [0, 2.62, -0.2]); add(heli, C(0.16, 0.42, 5.0, 14), body, [0, 2.0, -3.6], RX); add(heli, RB(0.1, 1.4, 0.9, 0.04), body, [0, 2.6, -5.85], [-0.25, 0, 0]);
  for (const s of [1, -1]) { add(heli, C(0.05, 0.05, 3.6, 8), dark, [s * 0.95, 0.12, 0.1], RX); add(heli, C(0.04, 0.04, 0.7, 6), dark, [s * 0.82, 0.45, 0.9], [0, 0, s * 0.35]); add(heli, C(0.04, 0.04, 0.7, 6), dark, [s * 0.82, 0.45, -0.7], [0, 0, s * 0.35]); }
  const rotor = new THREE.Group(); rotor.position.set(0, 3.36, -0.1); heli.add(rotor); add(rotor, C(0.2, 0.2, 0.12, 12), dark);
  for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.035, 5.4).translate(0, 0, 2.7), dark); b.rotation.y = i * PI / 2; rotor.add(b); }
  heli.userData.rotor = rotor; return heli;
}

/* ================= tree / nature helpers ================= */
export function tree(x, z, s = 1, collide = true) {
  const m = MAT; const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); LG.add(g);
  add(g, C(0.12, 0.2, 3.2, 7), M('#3a2a1c', 0.95), [0, 1.6, 0]);
  const leaf = M(['#1f3a1c', '#24451f', '#2c4a22'][Math.floor(R() * 3)], 0.9);
  for (let i = 0; i < 4; i++) add(g, SP(1.0 - i * 0.12, 8, 6), leaf, [rr(-0.3, 0.3), 3.0 + i * 0.6, rr(-0.3, 0.3)], null, [1.2, 0.8, 1.2]);
  if (collide) addCollider(x - 0.22 * s, 0, z - 0.22 * s, x + 0.22 * s, 3 * s, z + 0.22 * s, { vis: false, mat: 'wood', pen: false });
  return g;
}
export function bush(x, z, s = 1) { const g = add(LG, SP(0.6 * s, 8, 6), M('#24401f', 0.95), [x, 0.35 * s, z], null, [1.3, 0.7, 1.3]); return g; }

let flashT = 0;
export function updateLevel(dt, t, alarm) {
  if (!LG) return;
  for (const d of doors) d.update(dt);
  for (let i = smokes.length - 1; i >= 0; i--) { const sm = smokes[i]; sm.t -= dt; sm.r = Math.min(3.4, sm.r + dt * 2.5); if (sm.t > 1 && R() < dt * 6) FX.puff(sm.pos.clone().add(V3(rr(-1.5, 1.5), rr(-0.5, 1), rr(-1.5, 1.5))), { count: 1, size: 1.6, life: 4, rise: 0.08, color: '#9aa29a', spread: 0.6 }); if (sm.t <= 0) smokes.splice(i, 1); }
  if (navDirty) { navDirty = false; }
  updateProps(dt);
  // police light bars
  const ph = Math.floor(t * 3.2) % 2, strobe = Math.sin(t * 40) > 0 ? 1 : 0.25;
  if (lights.police) { lights.police.color.set(ph ? '#ff2a2a' : '#2a5cff'); lights.police.intensity = 16 * strobe; }
  lights.bars.forEach((b, i) => b.visible = (i % 2 === 0) === !!ph);
  assignLights();
  const Du = lights.dust; if (Du) { const cp = G.camera.position, S = 14; for (let i = 0; i < Du.n; i++) { const j = i * 3; const bx = Du.base[j] + Math.sin(t * 0.11 + i) * 0.4 + t * 0.05, by = Du.base[j + 1] + Math.sin(t * 0.07 + i * 1.7) * 0.5 - t * 0.02, bz = Du.base[j + 2] + Math.cos(t * 0.09 + i) * 0.4;
      Du.pos[j] = cp.x - S / 2 + (((bx - cp.x) % S) + S) % S; Du.pos[j + 1] = Math.max(0.05, cp.y - 3 + (((by - cp.y) % 7) + 7) % 7); Du.pos[j + 2] = cp.z - S / 2 + (((bz - cp.z) % S) + S) % S; } Du.pts.geometry.attributes.position.needsUpdate = true; }
  for (const sh of lights.shafts) sh.material.uniforms.t.value = t;
  if (LV.update) LV.update(dt, t, alarm);
  // alarm
  lights.alarm.intensity = alarm && ENV.alarmLight !== false ? 70 : 0; if (alarm) lights.alarm.target.position.set(lights.alarm.position.x + Math.cos(t * 2.4) * 8, 0, lights.alarm.position.z + Math.sin(t * 2.4) * 6);
  const on = alarm && (t % 0.8) < 0.4; for (const b of lights.alarmBulbs) b.material.color.set(on ? '#ff2a1a' : '#401010');
  // rain
  const Rn = lights.rain; if (Rn) for (let i = 0; i < Rn.n; i++) { const j = i * 6, dy = Rn.vel[i] * dt; Rn.pos[j + 1] -= dy; Rn.pos[j + 4] -= dy; if (Rn.snow) { Rn.pos[j] += Math.sin(t + i) * dt * 0.3; Rn.pos[j + 3] = Rn.pos[j] + 0.02; } if (Rn.pos[j + 4] < 0) { const y = 13 + R() * 3; Rn.pos[j + 1] = y; Rn.pos[j + 4] = y - Rn.sl; } } if (Rn) Rn.mesh.geometry.attributes.position.needsUpdate = true;
  // lightning
  lights.nextBolt -= dt; if (lights.nextBolt <= 0) { flashT = 0.5; lights.nextBolt = rr(9, 20); A.thunder(); }
  if (flashT > 0) { flashT -= dt; const f = (flashT > 0.38 || (flashT > 0.2 && flashT < 0.28)) ? 1 : 0; lights.moon.intensity = lights.sunBase + f * 5; lights.skyMat && lights.skyMat.color.setScalar(1 + f * 2.5); } else { lights.moon.intensity = lights.sunBase; lights.skyMat && lights.skyMat.color.setScalar(1); }
}
