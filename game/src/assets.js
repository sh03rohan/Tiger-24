// Tiger 24 · Operation Vault — characters, weapons, rig, IK, baking, pose animation
import { THREE, PI, M, B, RB, C, SP, CAP, PL, RX, add, canvasTex, rrect, rng, clamp, damp } from './core.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/* ---------- textures ---------- */
export function camoTex(base, cols, seed, rep = 3) {
  return canvasTex(512, 512, (g, w, h) => { const r = rng(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 240; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; const x = r() * w, y = r() * h, rx = 8 + r() * 36, ry = 6 + r() * 22, a = r() * PI; for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { g.beginPath(); g.ellipse(x + ox, y + oy, rx, ry, a, 0, PI * 2); g.fill(); } }
    g.globalAlpha = 0.09; for (let y = 0; y < h; y += 2) { g.fillStyle = (y % 4) ? '#000' : '#fff'; g.fillRect(0, y, w, 1); } g.globalAlpha = 1; }, { repeat: [rep, rep] });
}
export function fabricTex(base, seed = 3, rep = 4) {
  return canvasTex(128, 128, (g, w, h) => { const r = rng(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${r() < .5 ? 0 : 255},${r() < .5 ? 0 : 255},${r() < .5 ? 0 : 255},0.04)`; g.fillRect(r() * w, r() * h, 2, 2); }
    g.globalAlpha = 0.07; for (let y = 0; y < h; y += 2) { g.fillStyle = '#000'; g.fillRect(0, y, w, 1); } g.globalAlpha = 1; }, { repeat: [rep, rep] });
}
export const TEX = {};
export function initTextures() {
  TEX.multicam = camoTex('#7d7558', ['#5d583d', '#a08f66', '#3d3929', '#b9a67c', '#6a6a48'], 11);
  TEX.night = camoTex('#1f2123', ['#2a2c2f', '#17181a', '#34373a'], 12);
  TEX.urban = camoTex('#6c7075', ['#9ca1a6', '#43464a', '#c9ccd0', '#585c61'], 13);
  TEX.woodland = camoTex('#4f5a35', ['#2f3a22', '#6b5a3a', '#1f2418', '#788a4a'], 14);
  TEX.desert = camoTex('#b39c72', ['#cdb98e', '#8e7754', '#a68a5e', '#d9c9a3'], 15);
  TEX.medic = canvasTex(128, 128, g => { g.fillStyle = '#e8e6de'; rrect(g, 6, 6, 116, 116, 16); g.fill(); g.fillStyle = '#c4271b'; g.fillRect(50, 22, 28, 84); g.fillRect(22, 50, 84, 28); });
  TEX.patch = canvasTex(256, 256, g => { g.fillStyle = '#2b2d22'; rrect(g, 8, 8, 240, 240, 30); g.fill(); g.lineWidth = 10; g.strokeStyle = '#f29b2b'; g.stroke(); g.fillStyle = '#f29b2b';
    for (let i = 0; i < 4; i++) { const y = 42 + i * 14; g.beginPath(); g.moveTo(28, y); g.lineTo(92, y + 6); g.lineTo(28, y + 11); g.fill(); g.beginPath(); g.moveTo(228, y); g.lineTo(164, y + 6); g.lineTo(228, y + 11); g.fill(); }
    g.textAlign = 'center'; g.font = '800 66px "Saira Condensed", "Arial Narrow", sans-serif'; g.fillText('TIGER', 128, 156); g.font = '800 78px "Saira Condensed", "Arial Narrow", sans-serif'; g.fillText('24', 128, 226); });
  TEX.crescent = canvasTex(128, 128, g => { g.fillStyle = '#111'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#c4271b'; g.beginPath(); g.arc(64, 64, 44, 0, PI * 2); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(82, 56, 40, 0, PI * 2); g.fill(); });
  TEX.jackets = ['#4a4e39', '#3b3f46', '#2c2c2c', '#5a4a3a'].map((c, i) => fabricTex(c, 20 + i, 5));
  TEX.jeans = ['#2f3743', '#3a3a3a', '#41392f'].map((c, i) => fabricTex(c, 30 + i, 6));
  TEX.coat = fabricTex('#1d1e22', 40, 5);
}

/* ---------- rig ---------- */
const DOWN = new THREE.Vector3(0, -1, 0);
export function buildHuman(o) {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const hips = new THREE.Group(); hips.position.y = 0.98; body.add(hips);
  add(hips, RB(0.32, 0.18, 0.21, 0.05, 3), o.bottom); if (o.belt) add(hips, RB(0.335, 0.05, 0.225, 0.015), o.belt, [0, 0.07, 0]);
  const spine = new THREE.Group(); spine.position.y = 0.06; hips.add(spine);
  const chest = new THREE.Group(); chest.position.y = 0.32; spine.add(chest);
  add(chest, CAP(0.14, 0.24), o.top, [0, -0.04, 0], null, [1.3, 1, 0.85]); add(chest, C(0.048, 0.056, 0.12, 12), o.neck || o.skin, [0, 0.25, 0]);
  const head = new THREE.Group(); head.position.y = 0.34; chest.add(head);
  add(head, SP(0.105, 24, 18), o.skin, [0, 0, 0], null, [0.9, 1.08, 1]); add(head, SP(0.08, 18, 12), o.skin, [0, -0.05, 0.02], null, [1, 0.8, 1]); add(head, B(0.022, 0.04, 0.03), o.skin, [0, -0.012, 0.1]);
  for (const s of [1, -1]) add(head, SP(0.02, 8, 6), o.skin, [s * 0.093, -0.005, 0], null, [0.5, 1, 0.8]);
  if (o.face) {
    const eye = M('#16110e', 0.25), white = M('#e9e4da', 0.4);
    for (const s of [1, -1]) { add(head, SP(0.014, 10, 8), white, [s * 0.035, 0.012, 0.088]); add(head, SP(0.008, 8, 6), eye, [s * 0.035, 0.012, 0.1]); add(head, B(0.035, 0.008, 0.01), o.hairMat || eye, [s * 0.035, 0.04, 0.098], [0, 0, -s * 0.12]); }
    add(head, B(0.035, 0.007, 0.01), M('#6b3b33', 0.6), [0, -0.058, 0.097]);
  }
  const arms = {}, legs = {};
  for (const [k, s] of [['L', 1], ['R', -1]]) {
    add(chest, SP(0.062, 14, 10), o.top, [s * 0.19, 0.13, 0]);
    const upper = new THREE.Group(); upper.position.set(s * 0.2, 0.14, 0); chest.add(upper); add(upper, CAP(0.052, 0.2), o.sleeve || o.top, [0, -0.15, 0]);
    const elbow = new THREE.Group(); elbow.position.y = -0.3; upper.add(elbow); add(elbow, CAP(0.046, 0.18), o.sleeve || o.top, [0, -0.13, 0]);
    const hand = new THREE.Group(); hand.position.y = -0.28; elbow.add(hand); add(hand, RB(0.075, 0.1, 0.042, 0.016), o.gloves || o.skin, [0, -0.045, 0]);
    arms[k] = { upper, elbow, hand, a: 0.3, b: 0.28, side: s };
    const thigh = new THREE.Group(); thigh.position.set(s * 0.1, -0.05, 0); hips.add(thigh); add(thigh, CAP(0.078, 0.3), o.bottom, [0, -0.21, 0]);
    const knee = new THREE.Group(); knee.position.y = -0.44; thigh.add(knee); add(knee, CAP(0.06, 0.32), o.bottom, [0, -0.21, 0]);
    const ankle = new THREE.Group(); ankle.position.y = -0.43; knee.add(ankle); add(ankle, RB(0.11, 0.09, 0.27, 0.03), o.boots, [0, -0.015, 0.05]);
    legs[k] = { thigh, knee, ankle };
  }
  const segs = {
    pelvis: { g: hips, c: [0, 0, 0], s: [0.32, 0.2, 0.22], mult: 0.9, m: 9 },
    torso: { g: chest, c: [0, -0.03, 0], s: [0.38, 0.52, 0.27], mult: 1, m: 15 },
    head: { g: head, c: [0, 0.0, 0.01], s: [0.21, 0.25, 0.23], mult: 4, m: 4, sphere: 0.115 },
    uaL: { g: arms.L.upper, c: [0, -0.15, 0], s: [0.11, 0.31, 0.11], mult: 0.6, m: 2.5 }, uaR: { g: arms.R.upper, c: [0, -0.15, 0], s: [0.11, 0.31, 0.11], mult: 0.6, m: 2.5 },
    faL: { g: arms.L.elbow, c: [0, -0.16, 0], s: [0.09, 0.36, 0.09], mult: 0.5, m: 1.8 }, faR: { g: arms.R.elbow, c: [0, -0.16, 0], s: [0.09, 0.36, 0.09], mult: 0.5, m: 1.8 },
    thL: { g: legs.L.thigh, c: [0, -0.21, 0], s: [0.16, 0.44, 0.16], mult: 0.7, m: 6 }, thR: { g: legs.R.thigh, c: [0, -0.21, 0], s: [0.16, 0.44, 0.16], mult: 0.7, m: 6 },
    shL: { g: legs.L.knee, c: [0, -0.24, 0.02], s: [0.12, 0.48, 0.14], mult: 0.6, m: 4 }, shR: { g: legs.R.knee, c: [0, -0.24, 0.02], s: [0.12, 0.48, 0.14], mult: 0.6, m: 4 },
  };
  return { root, body, hips, spine, chest, head, arms, legs, segs };
}
const _d = new THREE.Vector3(), _n = new THREE.Vector3(), _u = new THREE.Vector3(), _e = new THREE.Vector3(), _f = new THREE.Vector3(), _qi = new THREE.Quaternion();
export function solveArm(arm, target, pole) {
  const S = arm.upper.position; _d.subVectors(target, S); let d = _d.length(); _d.normalize(); d = Math.min(Math.max(d, 0.06), arm.a + arm.b - 1e-3);
  const A = Math.acos(clamp((arm.a * arm.a + d * d - arm.b * arm.b) / (2 * arm.a * d), -1, 1)); _n.crossVectors(_d, pole).normalize(); if (_n.lengthSq() < 1e-6) _n.set(1, 0, 0);
  _u.copy(_d).applyAxisAngle(_n, A); arm.upper.quaternion.setFromUnitVectors(DOWN, _u);
  _e.copy(S).addScaledVector(_u, arm.a); _f.subVectors(target, _e).normalize(); _qi.copy(arm.upper.quaternion).invert(); _f.applyQuaternion(_qi); arm.elbow.quaternion.setFromUnitVectors(DOWN, _f);
}
export function fkArm(arm, swing, out, bend) { arm.upper.quaternion.setFromEuler(new THREE.Euler(swing, 0, out * arm.side)); arm.elbow.quaternion.setFromEuler(new THREE.Euler(-bend, 0, 0)); }

/* merge direct mesh children of every group by material: big draw-call saving */
export function bake(root) {
  const groups = []; root.traverse(o => { if (o.isGroup || o === root) groups.push(o); });
  for (const g of groups) {
    const meshes = g.children.filter(c => c.isMesh && !c.userData.keep);
    const byMat = new Map(); for (const m of meshes) { const k = m.material.uuid; if (!byMat.has(k)) byMat.set(k, []); byMat.get(k).push(m); }
    for (const [, list] of byMat) {
      if (list.length < 2) continue;
      const geos = list.map(m => { m.updateMatrix(); let geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k); geo.applyMatrix4(m.matrix); return geo; });
      let merged = null; try { merged = mergeGeometries(geos, false); } catch (e) { merged = null; }
      if (!merged) continue;
      const mm = new THREE.Mesh(merged, list[0].material); mm.castShadow = list.some(m => m.castShadow); mm.receiveShadow = true;
      for (const m of list) g.remove(m); g.add(mm);
    }
  }
}

/* ---------- weapons ---------- */
export function buildWeapon(kind) {
  const g = new THREE.Group(); const black = M('#1b1c1e', 0.5, 0.45), dark = M('#2b2d30', 0.55, 0.4), metal = M('#45484c', 0.32, 0.85); const r = { group: g, kind };
  if (kind === 'tg24') {
    const tan = M('#8b7b5b', 0.72, 0.08);
    add(g, RB(0.05, 0.075, 0.28, 0.008), dark, [0, 0.04, 0.02]); add(g, B(0.028, 0.012, 0.54), black, [0, 0.083, 0.16]); for (let i = 0; i < 20; i++) add(g, B(0.031, 0.006, 0.008), black, [0, 0.091, -0.06 + i * 0.024]);
    add(g, RB(0.058, 0.058, 0.3, 0.012), tan, [0, 0.045, 0.31]); for (let i = 0; i < 5; i++) for (const s of [1, -1]) add(g, B(0.004, 0.018, 0.03), black, [s * 0.03, 0.045, 0.21 + i * 0.05]);
    add(g, C(0.009, 0.009, 0.14, 10), metal, [0, 0.05, 0.52], RX); add(g, C(0.021, 0.021, 0.17, 18), black, [0, 0.05, 0.65], RX);
    add(g, RB(0.03, 0.17, 0.072, 0.006), tan, [0, -0.05, 0.1], [0.18, 0, 0]); add(g, RB(0.032, 0.11, 0.045, 0.008), black, [0, -0.025, -0.045], [-0.35, 0, 0]);
    add(g, C(0.014, 0.014, 0.13, 12), black, [0, 0.055, -0.12], RX); add(g, RB(0.045, 0.075, 0.19, 0.012), tan, [0, 0.035, -0.21]); add(g, RB(0.048, 0.1, 0.02, 0.006), black, [0, 0.025, -0.31]);
    add(g, C(0.017, 0.017, 0.16, 18), black, [0, 0.127, 0.08], RX); add(g, C(0.025, 0.019, 0.05, 18), black, [0, 0.127, 0.18], RX); add(g, C(0.019, 0.023, 0.045, 18), black, [0, 0.127, -0.02], RX);
    add(g, C(0.011, 0.011, 0.022, 10), dark, [0, 0.152, 0.08]); for (const z of [0.03, 0.13]) add(g, B(0.022, 0.032, 0.02), black, [0, 0.103, z]);
    const lens = add(g, new THREE.CircleGeometry(0.022, 20), M('#0b2a3c', 0.04, 1, { emissive: '#0a3a55', emissiveIntensity: 0.6 }), [0, 0.127, 0.2051]); lens.userData.keep = true;
    add(g, C(0.014, 0.017, 0.085, 12), black, [0, -0.018, 0.33]); add(g, RB(0.022, 0.026, 0.06, 0.005), black, [0.038, 0.045, 0.42]);
    add(g, B(0.003, 0.022, 0.05), M('#a07a35', 0.4, 0.8), [0.026, 0.05, 0.04]);
    r.gripR = new THREE.Vector3(0, -0.05, -0.05); r.gripL = new THREE.Vector3(0, -0.045, 0.33); r.muzzle = new THREE.Vector3(0, 0.05, 0.74); r.eject = new THREE.Vector3(0.03, 0.05, 0.04);
    r.low = [-0.04, -0.1, 0.17, 0.35]; r.aim = [-0.075, 0.075, 0.13, 0]; r.size = [0.06, 0.16, 1.05]; r.sight = 0.127;
  } else if (kind === 'ak') {
    const wood = M('#6e3c1c', 0.5, 0.05), bake2 = M('#5c2a14', 0.45, 0.05);
    add(g, RB(0.046, 0.07, 0.3, 0.008), dark, [0, 0.03, 0.03]); add(g, RB(0.052, 0.05, 0.2, 0.012), wood, [0, 0.025, 0.29]); add(g, C(0.014, 0.014, 0.17, 10), wood, [0, 0.068, 0.28], RX);
    add(g, C(0.009, 0.009, 0.3, 10), metal, [0, 0.035, 0.5], RX); add(g, B(0.01, 0.04, 0.012), dark, [0, 0.065, 0.6]); add(g, C(0.014, 0.014, 0.05, 10), dark, [0, 0.035, 0.66], RX);
    add(g, RB(0.03, 0.11, 0.065, 0.006), bake2, [0, -0.055, 0.12], [0.22, 0, 0]); add(g, RB(0.03, 0.1, 0.06, 0.006), bake2, [0, -0.14, 0.155], [0.5, 0, 0]);
    add(g, RB(0.03, 0.1, 0.042, 0.008), wood, [0, -0.03, -0.06], [-0.35, 0, 0]); add(g, RB(0.042, 0.08, 0.26, 0.014), wood, [0, 0.0, -0.24], [-0.12, 0, 0]);
    r.gripR = new THREE.Vector3(0, -0.05, -0.06); r.gripL = new THREE.Vector3(0, -0.01, 0.3); r.muzzle = new THREE.Vector3(0, 0.035, 0.69); r.eject = new THREE.Vector3(0.03, 0.05, 0.04);
    r.low = [-0.03, -0.11, 0.16, 0.45]; r.aim = [-0.075, 0.07, 0.13, 0]; r.size = [0.06, 0.2, 1.0];
  } else if (kind === 'k9') {
    add(g, RB(0.048, 0.08, 0.24, 0.008), dark, [0, 0.035, 0.03]); add(g, B(0.026, 0.012, 0.22), black, [0, 0.082, 0.04]);
    add(g, C(0.02, 0.02, 0.16, 16), black, [0, 0.045, 0.24], RX); add(g, RB(0.028, 0.16, 0.045, 0.006), dark, [0, -0.07, 0.09], [0.05, 0, 0]);
    add(g, RB(0.032, 0.1, 0.045, 0.008), black, [0, -0.03, -0.05], [-0.3, 0, 0]); for (const s2 of [1, -1]) add(g, B(0.008, 0.008, 0.2), black, [s2 * 0.018, 0.04, -0.17]); add(g, B(0.045, 0.08, 0.012), black, [0, 0.02, -0.27]);
    add(g, RB(0.03, 0.035, 0.05, 0.006), black, [0, 0.105, 0.03]); const dot = add(g, new THREE.CircleGeometry(0.01, 12), new THREE.MeshBasicMaterial({ color: '#ff3a2a', toneMapped: false }), [0, 0.108, 0.0555]); dot.userData.keep = true;
    add(g, C(0.014, 0.016, 0.08, 10), black, [0, -0.015, 0.18]);
    r.gripR = new THREE.Vector3(0, -0.05, -0.05); r.gripL = new THREE.Vector3(0, -0.045, 0.18); r.muzzle = new THREE.Vector3(0, 0.045, 0.33); r.eject = new THREE.Vector3(0.028, 0.05, 0.04);
    r.low = [-0.05, -0.12, 0.2, 0.4]; r.aim = [-0.075, 0.07, 0.17, 0]; r.size = [0.06, 0.18, 0.62]; r.sight = 0.108;
  } else if (kind === 'm80') {
    const od = M('#5b5d45', 0.75, 0.1);
    add(g, RB(0.055, 0.08, 0.3, 0.01), dark, [0, 0.04, 0]); add(g, RB(0.06, 0.06, 0.42, 0.012), od, [0, 0.045, 0.36]); add(g, C(0.011, 0.011, 0.3, 10), metal, [0, 0.05, 0.7], RX); add(g, C(0.018, 0.018, 0.06, 10), black, [0, 0.05, 0.87], RX);
    add(g, RB(0.032, 0.12, 0.08, 0.006), dark, [0, -0.03, 0.08], [0.1, 0, 0]); add(g, RB(0.032, 0.11, 0.045, 0.008), black, [0, -0.025, -0.05], [-0.35, 0, 0]);
    add(g, RB(0.05, 0.1, 0.26, 0.014), od, [0, 0.03, -0.26]); add(g, RB(0.04, 0.03, 0.12, 0.008), od, [0, 0.09, -0.24]);
    add(g, C(0.02, 0.02, 0.24, 16), black, [0, 0.14, 0.05], RX); add(g, C(0.032, 0.022, 0.07, 16), black, [0, 0.14, 0.2], RX); add(g, C(0.022, 0.026, 0.05, 16), black, [0, 0.14, -0.1], RX);
    for (const z of [-0.02, 0.12]) add(g, B(0.024, 0.04, 0.02), black, [0, 0.105, z]); for (const s2 of [1, -1]) add(g, C(0.006, 0.006, 0.2, 6), black, [s2 * 0.016, 0.01, 0.46], RX);
    r.gripR = new THREE.Vector3(0, -0.05, -0.05); r.gripL = new THREE.Vector3(0, 0.0, 0.32); r.muzzle = new THREE.Vector3(0, 0.05, 0.9); r.eject = new THREE.Vector3(0.03, 0.05, 0.03);
    r.low = [-0.04, -0.08, 0.12, 0.5]; r.aim = [-0.075, 0.06, 0.1, 0]; r.size = [0.07, 0.2, 1.25]; r.sight = 0.14;
  } else if (kind === 'b12') {
    const poly = M('#232426', 0.7, 0.1);
    add(g, RB(0.05, 0.08, 0.24, 0.01), dark, [0, 0.04, 0]); add(g, C(0.012, 0.012, 0.5, 10), metal, [0, 0.065, 0.37], RX); add(g, C(0.012, 0.012, 0.42, 10), black, [0, 0.025, 0.33], RX);
    add(g, RB(0.05, 0.05, 0.16, 0.012), poly, [0, 0.028, 0.3]); add(g, RB(0.032, 0.11, 0.045, 0.008), black, [0, -0.025, -0.05], [-0.35, 0, 0]); add(g, RB(0.045, 0.085, 0.26, 0.012), poly, [0, 0.025, -0.24]);
    for (let i = 0; i < 6; i++) add(g, C(0.009, 0.009, 0.05, 8), M('#a3241a', 0.5, 0.1), [0.03, 0.04, -0.06 + i * 0.022]); add(g, B(0.015, 0.02, 0.015), black, [0, 0.09, 0.0]);
    r.gripR = new THREE.Vector3(0, -0.05, -0.05); r.gripL = new THREE.Vector3(0, 0.0, 0.3); r.muzzle = new THREE.Vector3(0, 0.065, 0.62); r.eject = new THREE.Vector3(0.03, 0.05, 0.03);
    r.low = [-0.04, -0.1, 0.16, 0.4]; r.aim = [-0.075, 0.06, 0.13, 0]; r.size = [0.06, 0.16, 0.95]; r.sight = 0.09;
  } else { // pistol
    add(g, RB(0.03, 0.035, 0.19, 0.006), dark, [0, 0.03, 0.05]); add(g, RB(0.028, 0.03, 0.16, 0.006), black, [0, 0.0, 0.04]);
    add(g, RB(0.028, 0.11, 0.045, 0.008), black, [0, -0.05, -0.02], [-0.25, 0, 0]); add(g, C(0.006, 0.006, 0.02, 8), metal, [0, 0.03, 0.15], RX);
    add(g, B(0.006, 0.01, 0.006), M('#e8e8e0', 0.5), [0, 0.053, 0.13]); for (const s of [-1, 1]) add(g, B(0.005, 0.01, 0.006), M('#e8e8e0', 0.5), [s * 0.008, 0.053, -0.03]);
    add(g, B(0.006, 0.006, 0.04), black, [0, -0.012, 0.03]);
    r.gripR = new THREE.Vector3(0, -0.05, -0.015); r.gripL = new THREE.Vector3(0.02, -0.07, 0.0); r.muzzle = new THREE.Vector3(0, 0.03, 0.16); r.eject = new THREE.Vector3(0.02, 0.04, 0.05);
    r.low = [-0.02, -0.16, 0.26, 0.7]; r.aim = [-0.02, 0.1, 0.42, 0]; r.size = [0.04, 0.14, 0.22]; r.sight = 0.053;
  }
  return r;
}

/* ---------- character models ---------- */
export function makeOperator(o = {}) {
  o = Object.assign({ camo: 'multicam', head: 'helmet', vest: '#57573b', skin: '#c48b62', scale: 1, weapon: 'tg24' }, o);
  const uni = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.92, map: TEX[o.camo] || TEX.multicam });
  const rig = buildHuman({ skin: M(o.skin, 0.55), top: uni, bottom: uni, belt: M('#3c3a2a', 0.8), gloves: M('#2a2a26', 0.7), boots: M('#6b5a40', 0.85) });
  const c = rig.chest, h = rig.head, vest = M(o.vest, 0.85), strap = M('#3f3f2c', 0.9), black = M('#1d1e1c', 0.6, 0.2), patch = M('#ffffff', 0.8, 0, { map: TEX.patch });
  add(c, RB(0.4, 0.36, 0.3, 0.04, 3), vest, [0, -0.02, 0]); add(c, RB(0.392, 0.1, 0.29, 0.03), strap, [0, -0.22, 0]);
  for (const x of [-0.1, 0, 0.1]) { add(c, RB(0.085, 0.13, 0.06, 0.012), vest, [x, -0.1, 0.17]); add(c, B(0.06, 0.02, 0.044), black, [x, -0.026, 0.17]); }
  add(c, RB(0.22, 0.085, 0.035, 0.01), vest, [0, 0.07, 0.163]); add(c, PL(0.075, 0.075), patch, [0, 0.07, 0.1815], null, null, false);
  for (const s of [1, -1]) add(c, B(0.07, 0.03, 0.3), strap, [s * 0.12, 0.17, 0]);
  add(c, RB(0.065, 0.15, 0.07, 0.01), strap, [0.215, -0.03, -0.05]); add(c, C(0.004, 0.004, 0.34, 5), black, [0.22, 0.2, -0.07]); add(c, RB(0.3, 0.36, 0.08, 0.03), vest, [0, -0.02, -0.19]);
  const armPatch = o.medic ? M('#ffffff', 0.8, 0, { map: TEX.medic }) : patch;
  add(rig.arms.L.upper, PL(0.07, 0.07), armPatch, [0.054, -0.09, 0], [0, PI / 2, 0], null, false);
  if (o.medic) add(c, PL(0.14, 0.14), armPatch, [0, 0.0, -0.231], [0, PI, 0], null, false);
  if (o.head === 'boonie') { const hatM = M('#ffffff', 0.95, 0, { map: TEX[o.camo] }); add(h, C(0.2, 0.2, 0.012, 20), hatM, [0, 0.035, 0]); add(h, C(0.1, 0.112, 0.085, 16), hatM, [0, 0.08, 0]); add(h, RB(0.16, 0.032, 0.025, 0.01), M('#0b0c0d', 0.1, 0.8), [0, 0.012, 0.095]); }
  else if (o.head === 'helmet') { const hel = M(o.helmet || '#4f4c39', 0.72, 0.05);
    add(h, new THREE.SphereGeometry(0.13, 14, 7, 0, PI * 2, 0, PI * 0.5), hel, [0, 0.02, -0.005], null, [0.97, 1.02, 1.06]);
    for (const s of [1, -1]) { add(h, B(0.012, 0.03, 0.13), black, [s * 0.124, 0.03, 0]); add(h, C(0.045, 0.045, 0.035, 16), M('#2b2c2a', 0.6), [s * 0.105, -0.015, 0], [0, 0, PI / 2]); }
    add(h, B(0.05, 0.045, 0.03), black, [0, 0.09, 0.122]);
    if (o.nvgDown) { for (const s of [1, -1]) { add(h, C(0.019, 0.019, 0.08, 10), black, [s * 0.03, 0.02, 0.15], RX); const l = add(h, new THREE.CircleGeometry(0.016, 12), new THREE.MeshBasicMaterial({ color: '#38ff7a', toneMapped: false }), [s * 0.03, 0.02, 0.1905], null, null, false); l.userData.keep = true; } }
    else { for (const s of [1, -1]) add(h, C(0.017, 0.017, 0.075, 12), black, [s * 0.024, 0.137, 0.122]); add(h, RB(0.172, 0.042, 0.03, 0.012), M('#0b0c0d', 0.1, 0.75), [0, 0.015, 0.094]); }
    if (o.mask !== false) add(h, new THREE.SphereGeometry(0.092, 12, 6, 0, PI * 2, PI * 0.5, PI * 0.5), M(o.maskColor || '#2e302b', 0.95), [0, -0.004, 0.012], null, [1.06, 1.18, 1.1]);
  } else { const capM = M('#1f2326', 0.85);
    add(h, new THREE.SphereGeometry(0.113, 14, 6, 0, PI * 2, 0, PI * 0.45), capM, [0, 0.018, -0.005], null, [0.94, 1, 1.04]); add(h, RB(0.15, 0.012, 0.09, 0.005), capM, [0, 0.045, 0.11], [0.12, 0, 0]);
    for (const s of [1, -1]) add(h, C(0.042, 0.042, 0.035, 16), M('#2b2c2a', 0.6), [s * 0.105, -0.015, 0], [0, 0, PI / 2]);
    add(h, RB(0.16, 0.032, 0.025, 0.01), M('#0b0c0d', 0.1, 0.8), [0, 0.012, 0.095]); }
  for (const k of ['L', 'R']) add(rig.legs[k].knee, RB(0.1, 0.12, 0.045, 0.015), black, [0, 0, 0.06]);
  add(rig.legs.R.thigh, RB(0.05, 0.16, 0.1, 0.01), black, [-0.088, -0.15, 0]);
  const weapon = buildWeapon(o.weapon); c.add(weapon.group);
  rig.root.scale.setScalar(o.scale); bake(rig.root);
  return { root: rig.root, rig, weapon, height: 1.8 * o.scale, uni };
}
export function makeEnemy(o = {}) {
  const i = o.v || 0; const jacket = M('#ffffff', 0.95, 0, { map: TEX.jackets[i % 4] }), jeans = M('#ffffff', 0.9, 0, { map: TEX.jeans[i % 3] });
  const black = M('#151515', 0.95), skin = M(['#a87652', '#8d5a3b', '#c48b62', '#6f4630'][i % 4], 0.55);
  const rig = buildHuman({ skin, top: jacket, bottom: jeans, belt: M('#231f1a', 0.6), gloves: M('#1b1b1b', 0.7), boots: M('#161616', 0.7), neck: black });
  const h = rig.head, c = rig.chest;
  add(h, SP(0.109, 24, 18), black, [0, 0.002, 0], null, [0.9, 1.08, 1]); add(h, SP(0.084, 18, 12), black, [0, -0.05, 0.02], null, [1, 0.82, 1]);
  add(h, RB(0.1, 0.03, 0.02, 0.008), skin, [0, 0.014, 0.095]); for (const s of [1, -1]) add(h, SP(0.009, 8, 6), M('#120d0b', 0.25), [s * 0.03, 0.014, 0.104]);
  if (i % 2) { const cap = M('#2a2a2a', 0.8); add(h, new THREE.SphereGeometry(0.116, 14, 6, 0, PI * 2, 0, PI * 0.42), cap, [0, 0.02, -0.005], null, [0.94, 1, 1.04]); add(h, RB(0.15, 0.012, 0.09, 0.005), cap, [0, 0.05, 0.11], [0.12, 0, 0]); }
  const rigM = M('#3a3b2a', 0.9);
  add(c, RB(0.37, 0.2, 0.27, 0.03), rigM, [0, -0.1, 0]); for (const x of [-0.085, 0, 0.085]) add(c, RB(0.07, 0.14, 0.055, 0.01), rigM, [x, -0.11, 0.155]);
  for (const s of [1, -1]) add(c, B(0.05, 0.025, 0.29), rigM, [s * 0.11, 0.15, 0]);
  add(c, PL(0.06, 0.06), M('#ffffff', 0.8, 0, { map: TEX.crescent }), [0.09, 0.06, 0.123], null, null, false);
  add(rig.arms.L.upper, C(0.058, 0.058, 0.07, 14), M('#b3241a', 0.85), [0, -0.09, 0]);
  const weapon = buildWeapon('ak'); c.add(weapon.group); bake(rig.root);
  return { root: rig.root, rig, weapon, height: 1.8 };
}
export function makeLeader() {
  const coat = M('#ffffff', 0.9, 0, { map: TEX.coat }), skin = M('#9a6a48', 0.55);
  const rig = buildHuman({ skin, top: coat, bottom: M('#ffffff', 0.9, 0, { map: TEX.jeans[1] }), belt: M('#111', 0.4, 0.3), gloves: M('#111', 0.6), boots: M('#141414', 0.5), face: true, hairMat: M('#141010', 0.8) });
  const h = rig.head, c = rig.chest;
  const beret = M('#7a1414', 0.85); add(h, SP(0.11, 18, 10), beret, [0.02, 0.07, -0.01], null, [1.05, 0.45, 1.08]);
  add(h, SP(0.083, 18, 12), M('#1a1410', 0.95), [0, -0.058, 0.03], null, [1.02, 0.7, 0.95]);
  add(c, RB(0.4, 0.36, 0.29, 0.04, 3), M('#232420', 0.8), [0, -0.03, 0]); add(c, PL(0.07, 0.07), M('#ffffff', 0.8, 0, { map: TEX.crescent }), [0.08, 0.07, 0.146], null, null, false);
  for (const s of [1, -1]) add(c, RB(0.08, 0.5, 0.05, 0.02), coat, [s * 0.15, -0.3, 0.11]);
  add(rig.arms.L.upper, C(0.058, 0.058, 0.07, 14), M('#b3241a', 0.85), [0, -0.09, 0]);
  const weapon = buildWeapon('pistol'); c.add(weapon.group); rig.root.scale.setScalar(1.04); bake(rig.root);
  return { root: rig.root, rig, weapon, height: 1.87 };
}
export function makeHostage(v = {}) {
  const shirt = M('#ffffff', 0.92, 0, { map: fabricTex(v.shirt || '#e7e5de', v.seed || 2, 5) }), trousers = M('#ffffff', 0.9, 0, { map: fabricTex(v.trousers || '#3a3d45', (v.seed || 2) + 4, 5) });
  const hairMat = M(v.hair || '#1a1410', 0.75);
  const rig = buildHuman({ skin: M(v.skin || '#b9835c', 0.55), top: shirt, bottom: trousers, boots: M('#111', 0.45, 0.1), face: true, hairMat, belt: M('#1c1c1c', 0.4, 0.2) });
  const h = rig.head, c = rig.chest;
  add(h, new THREE.SphereGeometry(0.112, 14, 6, 0, PI * 2, 0, PI * 0.47), hairMat, [0, 0.012, -0.012], null, [0.93, 1.04, 1.06]);
  if (v.long) add(h, RB(0.18, 0.24, 0.07, 0.03), hairMat, [0, -0.07, -0.07]);
  if (v.tie) { add(c, B(0.035, 0.24, 0.012), M(v.tie, 0.6), [0, 0.02, 0.122], [0.08, 0, 0]); add(c, B(0.04, 0.03, 0.02), M(v.tie, 0.6), [0, 0.14, 0.115]); }
  if (v.lanyard) add(c, PL(0.045, 0.065), M('#f4f1e8', 0.6), [0.06, -0.05, 0.125], null, null, false);
  const tie = new THREE.MeshStandardMaterial({ color: '#e8e8e8', roughness: 0.4 }); for (const k of ['L', 'R']) add(rig.arms[k].hand, C(0.042, 0.042, 0.015, 10), tie, [0, 0.0, 0]);
  rig.root.scale.setScalar(v.scale || 0.97); bake(rig.root);
  return { root: rig.root, rig, weapon: null, height: 1.75 * (v.scale || 0.97), tieMat: tie };
}
export const HOSTAGE_LOOKS = [
  { shirt: '#e7e5de', tie: '#7a1f2b', lanyard: true, skin: '#c08a62', seed: 3 }, { shirt: '#9fb6d1', long: true, skin: '#8d5a3b', hair: '#120c09', seed: 5, scale: 0.94 },
  { shirt: '#c9b9a6', skin: '#d6a47e', hair: '#3b2a1d', seed: 7, tie: '#1f2f5a' }, { shirt: '#e1d9e6', long: true, skin: '#a0694a', seed: 9, trousers: '#2b2b2b', scale: 0.93 },
  { shirt: '#6f7f6a', skin: '#e0b48e', hair: '#8a7a6a', seed: 11 }, { shirt: '#f0ede6', skin: '#7a4a30', seed: 13, lanyard: true, tie: '#333' },
  { shirt: '#b84a3a', long: true, skin: '#c58c63', hair: '#2a1a10', seed: 15, scale: 0.92 }, { shirt: '#3a4a6a', skin: '#a87652', seed: 17, tie: '#999' },
  { shirt: '#d8cfa8', skin: '#6f4630', seed: 19, lanyard: true }, { shirt: '#ffffff', long: true, skin: '#e0b48e', hair: '#5a3a1a', seed: 21, scale: 0.95 },
  { shirt: '#556b2f', skin: '#8d5a3b', seed: 23 }, { shirt: '#a9b8c8', skin: '#c08a62', seed: 25, tie: '#5a1f1f', lanyard: true },
];

/* ---------- pose animation ---------- */
const POLE_R = new THREE.Vector3(-1, -0.9, -0.3), POLE_L = new THREE.Vector3(1, -1, 0.2);
const tL = new THREE.Vector3(), tR = new THREE.Vector3(), _w = new THREE.Vector3();
export function animate(m, a, dt) {
  const r = m.rig;
  a.phase = (a.phase || 0) + dt * (a.speed > 0.05 ? 2.2 + a.speed * 1.35 : 0);
  const sp = clamp(a.speed / 3.2, 0, 1.3), s = Math.sin(a.phase), cph = Math.cos(a.phase);
  const kneel = a.mode === 'kneel' || a.mode === 'surrender' || a.mode === 'down' || a.mode === 'restrained';
  a._cr = damp(a._cr || 0, kneel ? 0 : (a.crouch || 0), 10, dt); a._kn = damp(a._kn || 0, kneel ? 1 : 0, 6, dt); a._aim = damp(a._aim || 0, a.aim || 0, 9, dt);
  const cr = a._cr, kn = a._kn;
  // ---- legs ----
  const stand = { hy: 0.98, th: 0, kn: 0, an: 0 }, crouchP = { hy: 0.62, th: -1.0, kn: 1.7, an: -0.7 }, kneelP = { hy: 0.56, th: -0.25, kn: 1.82, an: 1.5 };
  const hy = stand.hy + (crouchP.hy - stand.hy) * cr + (kneelP.hy - stand.hy) * kn;
  const amp = sp * (1 - cr * 0.5) * (1 - kn);
  r.hips.position.y = hy + Math.abs(cph) * 0.025 * sp * (1 - kn) + (a.breathe ? Math.sin(G_t() * 1.6 + (a.seed || 0)) * 0.003 : 0);
  for (const [k, sg] of [['L', 1], ['R', -1]]) {
    const L = r.legs[k], sw = s * sg;
    const th = crouchP.th * cr + kneelP.th * kn + sw * 0.5 * amp;
    const kb = crouchP.kn * cr + kneelP.kn * kn + Math.max(0, -cph * sg) * 0.75 * amp + 0.06 * amp;
    L.thigh.rotation.set(th, 0, sg * 0.05 * (1 - kn) + sg * 0.06 * kn);
    L.knee.rotation.x = kb; L.ankle.rotation.x = crouchP.an * cr + kneelP.an * kn - sw * 0.15 * amp;
  }
  r.hips.rotation.y = s * 0.07 * amp;
  // ---- upper body ----
  const pitch = a.pitch || 0;
  r.spine.rotation.x = (kn ? 0.12 * kn : 0) + 0.04 + (a.lean || 0) * 0 - pitch * 0.55 * a._aim + cr * 0.15;
  r.chest.rotation.y = -s * 0.08 * amp; r.chest.rotation.z = a.tremble ? Math.sin(G_t() * 38 + (a.seed || 0)) * 0.006 : 0;
  r.head.rotation.x = -pitch * 0.35 * a._aim + (a.headDown || 0); r.head.rotation.y = a.look || 0;
  const W = m.weapon;
  if (W && W.group.parent === r.chest) {
    const lo = W.low, ai = W.aim, t = a._aim, run = a.sprint ? 1 : 0;
    W.group.position.set(lo[0] + (ai[0] - lo[0]) * t, lo[1] + (ai[1] - lo[1]) * t - run * 0.03, lo[2] + (ai[2] - lo[2]) * t);
    W.group.rotation.set(lo[3] + (ai[3] - lo[3]) * t + run * 0.25 + (a.mode === 'stun' ? 0.8 : 0) + (a.recoil || 0) * -0.15, run * 0.3, 0);
    W.group.updateMatrix();
    tR.copy(W.gripR).applyMatrix4(W.group.matrix); solveArm(r.arms.R, tR, POLE_R);
    if (a.mode === 'stun') { tL.set(0.04, 0.36, 0.12); solveArm(r.arms.L, tL, POLE_L); }
    else if (a.mode === 'shield') { tL.set(0.05, 0.08, 0.36); solveArm(r.arms.L, tL, new THREE.Vector3(1, -0.3, 0)); }
    else { tL.copy(W.gripL).applyMatrix4(W.group.matrix); solveArm(r.arms.L, tL, POLE_L); }
  } else if (a.mode === 'restrained' || a.mode === 'surrender' || a.mode === 'handsup') {
    tL.set(0.07, 0.46, 0.0); tR.set(-0.07, 0.46, 0.0);
    solveArm(r.arms.L, tL, new THREE.Vector3(1, 0.4, -0.5)); solveArm(r.arms.R, tR, new THREE.Vector3(-1, 0.4, -0.5));
  } else if (a.mode === 'tied') {
    tL.set(0.03, -0.2, 0.2); tR.set(-0.03, -0.2, 0.2); solveArm(r.arms.L, tL, new THREE.Vector3(1, -0.2, -1)); solveArm(r.arms.R, tR, new THREE.Vector3(-1, -0.2, -1));
  } else if (a.mode === 'down') {
    tL.set(0.0, -0.05, 0.16); tR.set(-0.12, -0.35, 0.1); solveArm(r.arms.L, tL, POLE_L); solveArm(r.arms.R, tR, POLE_R);
  } else if (a.mode === 'cover') {
    tL.set(0.06, 0.42, 0.1); tR.set(-0.06, 0.42, 0.1); solveArm(r.arms.L, tL, new THREE.Vector3(1, 0, -0.3)); solveArm(r.arms.R, tR, new THREE.Vector3(-1, 0, -0.3));
  } else {
    fkArm(r.arms.L, -s * 0.6 * sp, 0.08, 0.4 + sp * 0.6); fkArm(r.arms.R, s * 0.6 * sp, 0.08, 0.4 + sp * 0.6);
  }
}
let __t = 0; export function setAnimTime(t) { __t = t; } function G_t() { return __t; }
