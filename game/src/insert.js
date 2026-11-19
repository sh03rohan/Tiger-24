// Tiger 24 — insertion cinematics: the squad arrives by helicopter, van or boat (or a title card for indoor starts), then hands control to the player.
// While it plays the AI, the mission timer and the player are frozen; any key, click or tap skips it.
import { THREE, G, V3, PI, clamp, A, M, B, RB, C, add, $ } from './core.js';
import { LV, LG, rayWorld, walkable, roomAt, heliModel, makeMaterials } from './levelkit.js';
import { P } from './player.js';

let CIN = null; const leaving = [];
export const insertionActive = () => !!CIN;
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const lerpV = (a, b, t) => a.clone().lerp(b, t);

function vanModel(pos, ry) {
  makeMaterials(); const g = new THREE.Group(); g.position.copy(pos); g.rotation.y = ry; LG.add(g);
  const body = M('#1d2a3a', 0.45, 0.5), dark = M('#101214', 0.5, 0.4), glass = M('#0c1216', 0.05, 0.9), stripe = M('#d9a21b', 0.5, 0.3);
  add(g, RB(2.1, 1.7, 5.2, 0.12, 2), body, [0, 1.25, 0]); add(g, RB(2.0, 0.9, 1.6, 0.1), body, [0, 0.85, 2.9]); add(g, B(1.9, 0.75, 0.05), glass, [0, 1.6, 2.15], [0.35, 0, 0]);
  add(g, B(2.12, 0.18, 5.2), stripe, [0, 1.1, 0], null, null, false); for (const s of [1, -1]) add(g, B(0.04, 0.55, 1.4), glass, [s * 1.06, 1.6, 0.9], null, null, false);
  const bar = add(g, B(1.2, 0.14, 0.32), new THREE.MeshBasicMaterial({ color: '#3a6aff', toneMapped: false }), [0, 2.17, 1.4], null, null, false);
  for (const [x, z] of [[-0.95, 1.8], [0.95, 1.8], [-0.95, -1.7], [0.95, -1.7]]) add(g, C(0.42, 0.42, 0.32, 16), dark, [x, 0.42, z], [0, 0, PI / 2]);
  for (const s of [1, -1]) add(g, SPH(0.12), new THREE.MeshBasicMaterial({ color: '#fff6dc', toneMapped: false }), [s * 0.7, 0.9, 3.72], null, null, false);
  g.userData.bar = bar; return g;
}
function boatModel(pos, ry) {
  makeMaterials(); const g = new THREE.Group(); g.position.copy(pos); g.rotation.y = ry; LG.add(g);
  add(g, B(2.4, 0.9, 6.5), M('#2a2e34', 0.4, 0.4), [0, 0, 0]); add(g, B(2.0, 0.8, 1.6), M('#14181c', 0.2, 0.5), [0, 0.8, 0.6]); add(g, B(2.45, 0.2, 6.55), M('#d9a21b', 0.5), [0, -0.3, 0], null, null, false);
  return g;
}
const SPH = r => new THREE.SphereGeometry(r, 10, 8);

// clear straight run for a vehicle on the ground from a to b
function clearRun(a, b) {
  const d = b.clone().sub(a); const L = d.length(); d.normalize();
  for (const h of [0.5, 1.4]) { const o = V3(a.x, h, a.z); if (rayWorld(o, d, L - 0.5)) return false; for (const side of [-1.2, 1.2]) { const o2 = o.clone().add(V3(-d.z * side, 0, d.x * side)); if (rayWorld(o2, d, L - 0.5)) return false; } }
  for (let t = 0; t <= L; t += 2) { const q = a.clone().addScaledVector(d, t); if (!walkable(q.x, q.z) && Math.hypot(q.x - b.x, q.z - b.z) > 4) { const inB = LV.bounds && q.x > LV.bounds.x0 && q.x < LV.bounds.x1 && q.z > LV.bounds.z0 && q.z < LV.bounds.z1; if (inB) return false; } }
  return true;
}
function openSky(p) { for (const [dx, dz] of [[0, 0], [2.5, 0], [-2.5, 0], [0, 2.5], [0, -2.5]]) if (rayWorld(V3(p.x + dx, 1.2, p.z + dz), V3(0, 1, 0), 30)) return false; return true; }
function flatArea(p, r = 2.6) { for (let a = 0; a < 8; a++) { const x = p.x + Math.cos(a * PI / 4) * r, z = p.z + Math.sin(a * PI / 4) * r; if (!walkable(x, z)) return false; } return walkable(p.x, p.z); }

export function startInsertion(entry, onDone) {
  endInsertion(true);
  const sp = LV.spawns[entry]; if (!sp) { onDone && onDone(); return; }
  const f = V3(-Math.sin(sp.yaw), 0, -Math.cos(sp.yaw)), side = V3(f.z, 0, -f.x), spawn = sp.pos.clone().setY(0);
  const indoor = roomAt(spawn.x, spawn.z).indoor;
  let kind = sp.insert || (sp.rappel ? 'rappel' : indoor ? 'fade' : null), plan = null;
  if (kind === 'boat') { const wy = LV.waterY ?? -1.2; plan = { kind, a: spawn.clone().addScaledVector(f, -45).addScaledVector(side, 3).setY(wy), b: spawn.clone().addScaledVector(f, -3.5).addScaledVector(side, 1.5).setY(wy) }; }
  if (!kind || kind === 'van') { // look for a clear road behind the entry, then to the sides
    for (const ang of [0, 0.4, -0.4, 0.8, -0.8, 1.4, -1.4]) { const dir = f.clone().applyAxisAngle(V3(0, 1, 0), ang); const stop = spawn.clone().addScaledVector(dir, -2.6).addScaledVector(side, 2.3); const st = stop.clone().addScaledVector(dir, -34);
      if (clearRun(st, stop)) { plan = { kind: 'van', a: st, b: stop, dir }; break; } }
    if (!plan && kind === 'van') kind = null;
  }
  if (!plan && (!kind || kind === 'heli')) { // land behind the entry, else hover and fast-rope
    let land = null; for (const [bk, sd] of [[5, 0], [6, 3], [6, -3], [8, 0], [4, 4], [4, -4]]) { const q = spawn.clone().addScaledVector(f, -bk).addScaledVector(side, sd); if (flatArea(q) && openSky(q)) { land = q; break; } }
    plan = land ? { kind: 'heli', land } : (openSky(spawn) ? { kind: 'hover', land: spawn.clone().addScaledVector(f, -2) } : { kind: 'fade' });
  }
  if (!plan) plan = { kind: kind === 'rappel' ? (openSky(spawn) ? 'rappelHeli' : 'fade') : 'fade' };
  if (kind === 'rappel' && plan.kind !== 'fade') plan = { kind: 'rappelHeli', land: spawn.clone() };

  // squad appears at the end
  const hidden = G.team.filter(t => t.alive); for (const t of hidden) t.root.visible = false;
  const meta = (G.hooks.missionMeta && G.hooks.missionMeta()) || {};
  showCard(meta, plan.kind);
  const eyeEnd = V3(spawn.x, (sp.rappel ? sp.rappel : 0) + 1.62, spawn.z);
  const lookEnd = eyeEnd.clone().addScaledVector(f, 10);
  CIN = { t: 0, plan, f, side, spawn, eyeEnd, lookEnd, hidden, onDone, sp, rotorT: 0 };
  const P0 = plan.kind;
  if (P0 === 'heli' || P0 === 'hover' || P0 === 'rappelHeli') {
    const land = plan.land; const ry = Math.atan2(f.x, f.z); const hoverH = P0 === 'heli' ? 0.15 : P0 === 'hover' ? 5.5 : (sp.rappel || 4) + 6;
    CIN.dur = P0 === 'rappelHeli' ? 5.2 : 7.4; CIN.veh = heliModel(land.clone().addScaledVector(f, -80).setY(38), ry, '#2f342b');
    CIN.path = { s: land.clone().addScaledVector(f, -80).setY(38), h: land.clone().setY(hoverH + 3), e: land.clone().setY(hoverH), ry };
    CIN.cam1 = land.clone().addScaledVector(f, 9).addScaledVector(side, 7).setY(2.2);
  } else if (P0 === 'van' || P0 === 'boat') {
    const ry = Math.atan2((plan.b.x - plan.a.x), (plan.b.z - plan.a.z)); CIN.dur = 6.2;
    CIN.veh = P0 === 'van' ? vanModel(plan.a, ry) : boatModel(plan.a, ry); CIN.ry = ry;
    CIN.cam1 = plan.b.clone().addScaledVector(V3(Math.sin(ry), 0, Math.cos(ry)), 7).addScaledVector(V3(Math.cos(ry), 0, -Math.sin(ry)), 3.5).setY(P0 === 'boat' ? 1.4 : 1.3);
  } else CIN.dur = 3.2;
  const skip = e => { if (!CIN) return; if (e.type === 'keydown' && !['Space', 'Enter', 'Escape', 'KeyE'].includes(e.code)) return; e.preventDefault && e.preventDefault(); e.stopImmediatePropagation && e.stopImmediatePropagation(); endInsertion(); };
  CIN.skip = skip; setTimeout(() => { if (!CIN) return; window.addEventListener('keydown', skip, true); $('cine').addEventListener('pointerdown', skip); }, 350);
}

function showCard(meta, kind) {
  const el = $('cine'); if (!el) return; el.hidden = false; el.classList.toggle('dark', kind === 'fade'); el.classList.remove('out');
  $('cineNo').textContent = meta.no ? `MISSION ${meta.no} · ${meta.time || ''}` : ''; $('cineName').textContent = meta.name || ''; $('cineLoc').textContent = meta.loc || '';
  $('cineHow').textContent = { heli: 'Insertion: helicopter', hover: 'Insertion: fast-rope', rappelHeli: 'Insertion: rappel', van: 'Insertion: Tiger 24 van', boat: 'Insertion: speedboat', fade: 'Insertion: on foot' }[kind] || '';
}

export function updateInsertion(dt) {
  for (let i = leaving.length - 1; i >= 0; i--) { const l = leaving[i]; l.t += dt; l.fn(l, dt); if (l.t > l.life) { l.obj.parent && l.obj.parent.remove(l.obj); leaving.splice(i, 1); } }
  if (!CIN) return; const c = CIN; c.t += dt; const k = clamp(c.t / c.dur, 0, 1); const cam = G.camera; const pl = c.plan.kind;
  if (cam.fov !== 55) { cam.fov = 55; cam.updateProjectionMatrix(); }
  if (pl === 'heli' || pl === 'hover' || pl === 'rappelHeli') {
    const v = c.veh, pa = c.path; v.userData.rotor.rotation.y += dt * 24;
    const k1 = clamp(k / 0.62, 0, 1), k2 = clamp((k - 0.62) / 0.2, 0, 1);
    const pos = k < 0.62 ? lerpV(pa.s, pa.h, easeOut(k1)) : lerpV(pa.h, pa.e, ease(k2)); v.position.copy(pos);
    v.rotation.x = k < 0.62 ? -0.18 * (1 - k1) + 0.12 * Math.sin(k1 * PI) : 0.04 * Math.sin(c.t * 2); v.rotation.z = Math.sin(c.t * 1.3) * 0.03;
    if (k < 0.55) { cam.position.copy(c.cam1); cam.lookAt(pos.x, pos.y + 1.5, pos.z); }
    else { const door = pos.clone().add(V3(0, 1.7, 0)).addScaledVector(c.side, 1.4); const kk = ease(clamp((k - 0.55) / 0.45, 0, 1)); cam.position.copy(lerpV(door, c.eyeEnd, kk * kk)); const look = lerpV(c.spawn.clone().setY(1.2), c.lookEnd, kk); cam.lookAt(look); }
    c.rotorT -= dt; if (c.rotorT <= 0 && A.ok) { c.rotorT = 0.105; const o = A.out(pos, { rev: 0.05, ref: 8 }); A.noise(o, A.now(), { type: 'lowpass', f0: 320, f1: 70, dur: 0.09, gain: 0.55 }); }
    if (pl === 'rappelHeli' && k > 0.7 && !c.roped) { c.roped = true; A.rope(); }
  } else if (pl === 'van' || pl === 'boat') {
    const v = c.veh, a = c.plan.a, b = c.plan.b; const kd = easeOut(clamp(k / 0.72, 0, 1)); v.position.copy(lerpV(a, b, kd)); if (pl === 'boat') { v.position.y = a.y + Math.sin(c.t * 2.2) * 0.12; v.rotation.z = Math.sin(c.t * 1.7) * 0.04; }
    if (v.userData.bar) v.userData.bar.material.color.set((c.t * 3 | 0) % 2 ? '#ff2a2a' : '#3a6aff');
    if (k < 0.6) { cam.position.copy(c.cam1); cam.lookAt(v.position.x, v.position.y + 1.2, v.position.z); }
    else { const door = v.position.clone().add(V3(0, 1.5, 0)).addScaledVector(V3(Math.cos(c.ry), 0, -Math.sin(c.ry)), -1.6); const kk = ease(clamp((k - 0.6) / 0.4, 0, 1)); cam.position.copy(lerpV(door, c.eyeEnd, kk)); cam.lookAt(lerpV(c.spawn.clone().setY(1.2), c.lookEnd, kk)); }
    c.rotorT -= dt; if (c.rotorT <= 0 && A.ok && k < 0.72) { c.rotorT = 0.16; const o = A.out(v.position, { rev: 0.05, ref: 6 }); A.tone(o, A.now(), { f0: 70 + kd * 10, f1: 62, dur: 0.18, gain: 0.12, type: 'sawtooth' }); }
  } else { // title card only: slow push-in on the entry
    cam.position.copy(lerpV(c.eyeEnd.clone().addScaledVector(c.f, -2.2).add(V3(0, 0.4, 0)), c.eyeEnd, ease(k))); cam.lookAt(c.lookEnd);
  }
  cam.updateMatrixWorld();
  if (k >= 1) endInsertion();
}

export function endInsertion(silent) {
  const c = CIN; if (!c) return; CIN = null;
  window.removeEventListener('keydown', c.skip, true); const el = $('cine'); if (el) { el.removeEventListener('pointerdown', c.skip); el.classList.add('out'); setTimeout(() => { if (!CIN) el.hidden = true; }, 600); }
  for (const t of c.hidden) t.root.visible = true;
  const pl = c.plan.kind;
  if (c.veh && !silent) { // the vehicle leaves on its own
    const v = c.veh;
    if (pl === 'heli' || pl === 'hover' || pl === 'rappelHeli') { const p0 = c.path.e.clone(), out = p0.clone().addScaledVector(c.f, 120).setY(60); v.position.copy(p0); leaving.push({ obj: v, t: 0, life: 9, fn: (l, dt) => { v.userData.rotor.rotation.y += dt * 24; const kk = clamp(l.t / 9, 0, 1); v.position.copy(lerpV(p0, out, kk * kk)); v.rotation.x = 0.15 * Math.min(1, l.t); } }); }
    else if (pl === 'van') { const b = c.plan.b.clone(), out = b.clone().addScaledVector(V3(Math.sin(c.ry), 0, Math.cos(c.ry)), -40); v.position.copy(b); leaving.push({ obj: v, t: 0, life: 10, fn: (l) => { if (l.t < 3) return; const kk = clamp((l.t - 3) / 7, 0, 1); v.position.copy(lerpV(b, out, kk * kk)); } }); }
    else if (pl === 'boat') { const b = c.plan.b.clone(), out = b.clone().addScaledVector(V3(Math.sin(c.ry), 0, Math.cos(c.ry)), 50); leaving.push({ obj: v, t: 0, life: 10, fn: (l) => { const kk = clamp(l.t / 10, 0, 1); v.position.copy(lerpV(b, out, kk * kk)); v.position.y = b.y + Math.sin(l.t * 2.2) * 0.12; } }); }
  } else if (c.veh) c.veh.parent && c.veh.parent.remove(c.veh);
  if (!silent) c.onDone && c.onDone();
}
export function clearInsertion() { endInsertion(true); for (const l of leaving) l.obj.parent && l.obj.parent.remove(l.obj); leaving.length = 0; }
