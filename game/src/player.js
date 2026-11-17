// Tiger 24 · Operation Vault — player: input, movement, camera, weapons, gadgets, interaction
import { THREE, CANNON, G, PI, $, clamp, damp, lerp, R, rr, A, FX, VO, emitNoise, M, RB, CAP, add, V3, starTex } from './core.js';
import { buildWeapon, TEX } from './assets.js';
import { rayWorld, collideCircle, roomAt, shatterGlass, doors, interactables, propMeshes, LV, lights, LG } from './levelkit.js';

const ray = new THREE.Raycaster();
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _q = new THREE.Quaternion();

export const PRIMARIES = {
  tg24: { kind: 'tg24', name: 'TG-24', cal: '5.56', max: 30, res: 120, rpm: 760, auto: true, dmg: 34, spread: 0.016, adsSpread: 0.0015, recoil: 0.011, kick: 0.6, suppressed: true, reload: 2.1, emptyReload: 2.7, sound: 'carbine', noise: 9, adsFov: 30, scope: true },
  k9: { kind: 'k9', name: 'K-9 Viper', cal: '9mm', max: 32, res: 160, rpm: 950, auto: true, dmg: 23, spread: 0.02, adsSpread: 0.006, recoil: 0.007, kick: 0.4, suppressed: true, reload: 1.8, emptyReload: 2.2, sound: 'carbine', noise: 8, adsFov: 52, scope: false },
  m80: { kind: 'm80', name: 'M-80 Longbow', cal: '7.62', max: 10, res: 50, rpm: 180, auto: false, dmg: 80, spread: 0.03, adsSpread: 0.0008, recoil: 0.04, kick: 1.3, suppressed: false, reload: 2.6, emptyReload: 3.1, sound: 'sniper2', noise: 34, adsFov: 20, scope: true },
  b12: { kind: 'b12', name: 'B-12 Breacher', cal: '12ga', max: 7, res: 35, rpm: 75, auto: false, dmg: 15, pellets: 9, spread: 0.06, adsSpread: 0.045, recoil: 0.05, kick: 1.5, suppressed: false, reload: 2.8, emptyReload: 3.2, sound: 'shotgun', noise: 40, adsFov: 58, scope: false },
};
export const SECONDARIES = {
  p17: { kind: 'pistol', name: 'P-17', cal: '9mm', max: 17, res: 51, rpm: 420, auto: false, dmg: 30, spread: 0.02, adsSpread: 0.004, recoil: 0.02, kick: 0.9, suppressed: false, reload: 1.5, emptyReload: 1.9, sound: 'pistol', noise: 38, adsFov: 55 },
  r6: { kind: 'pistol', name: 'R-6 Revolver', cal: '.357', max: 6, res: 30, rpm: 140, auto: false, dmg: 72, spread: 0.018, adsSpread: 0.003, recoil: 0.045, kick: 1.4, suppressed: false, reload: 2.4, emptyReload: 2.4, sound: 'pistol', noise: 45, adsFov: 52 },
  taser: { kind: 'pistol', name: 'X-2 Taser', cal: 'non-lethal', max: 1, res: 8, rpm: 60, auto: false, dmg: 0, taser: true, spread: 0.012, adsSpread: 0.004, recoil: 0.01, kick: 0.4, suppressed: true, reload: 1.8, emptyReload: 1.8, sound: 'taser', noise: 3, adsFov: 55 },
};
export const WEAPONS = { rifle: PRIMARIES.tg24, pistol: SECONDARIES.p17 };
export const LOADOUT = { primary: 'tg24', secondary: 'p17', gadgets: ['flash', 'charge'], camo: 'multicam' };

export const P = {
  pos: V3(), vel: V3(), yaw: 0, pitch: 0, height: 1.62, crouched: false, crouchT: 0, lean: 0, onGround: true, vy: 0,
  hp: 100, armor: 100, alive: true, stamina: 100, staminaCd: 0, breath: 0,
  cur: 'rifle', ammo: { rifle: { mag: 30, res: 120, mode: 'auto' }, pistol: { mag: 17, res: 51, mode: 'semi' } },
  adsT: 0, ads: false, scoped: false, reloadT: 0, reloadTotal: 0, reloadEmpty: false, switchT: 0, fireCd: 0, bloom: 0, recoilP: 0, recoilY: 0, triggerHeld: false,
  flash: 2, med: 1, healT: 0, flashBlind: 0, hurtT: 0, lastHurtDir: 0, shake: 0, stepAcc: 0, rappel: null, deathT: 0,
  interact: null, holdT: 0, holdNeed: 0, prompt: '', moving: 0, sprinting: false, speed: 0, noise: 0,
};

/* ================= input ================= */
const keys = {}; const edge = {}; const inp = { fire: false, ads: false, interact: false, sprint: false, leanL: false, leanR: false, crouchHold: false, mx: 0, my: 0, moveX: 0, moveY: 0, lookX: 0, lookY: 0 };
const KEYMAP = { KeyJ: 'smoke', KeyY: 'scan', KeyR: 'reload', KeyF: 'interactE', KeyG: 'flash', KeyH: 'med', Digit1: 'w1', Digit2: 'w2', KeyB: 'mode', KeyV: 'yell', KeyX: 'follow', KeyT: 'breach', KeyZ: 'mark', KeyC: 'crouch', Space: 'jump', Tab: 'map' };
export function pressed(n) { if (edge[n]) { edge[n] = false; return true; } return false; }
export function trigger(n) { edge[n] = true; }
let locked = false; export const isLocked = () => locked;
export function initInput() {
  const cv = G.host.querySelector('canvas');
  window.addEventListener('keydown', e => {
    if (G.state !== 'playing') return;
    if (e.code === 'Tab') e.preventDefault(); if (e.code === 'Space') e.preventDefault();
    if (!keys[e.code] && KEYMAP[e.code]) edge[KEYMAP[e.code]] = true;
    keys[e.code] = true;
    if (e.code === 'KeyP') G.hooks.pause && G.hooks.pause();
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; if (e.code === 'Tab') edge.mapUp = true; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; inp.fire = inp.ads = false; });
  cv.addEventListener('mousedown', e => {
    if (G.state !== 'playing') return; A.init();
    if (!locked && !G.noLock && !G.mobile) { requestLock(); if (!G.noLock) return; }
    if (e.button === 0) { inp.fire = true; inp.fireEdge = true; } if (e.button === 2) inp.ads = true;
    if (G.noLock && e.button === 0) { dragLook = { x: e.clientX, y: e.clientY, moved: 0 }; inp.fire = false; }
  });
  window.addEventListener('mouseup', e => {
    if (e.button === 0) { if (G.noLock && dragLook && dragLook.moved < 6 && G.state === 'playing') { inp.fire = true; setTimeout(() => { inp.fire = false; }, 80); } else inp.fire = false; dragLook = null; }
    if (e.button === 2) inp.ads = false;
  });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('mousemove', e => {
    if (G.state !== 'playing') return;
    if (locked) { inp.mx += e.movementX; inp.my += e.movementY; }
    else if (dragLook) { const dx = e.clientX - dragLook.x, dy = e.clientY - dragLook.y; dragLook.x = e.clientX; dragLook.y = e.clientY; dragLook.moved += Math.abs(dx) + Math.abs(dy); inp.mx += dx * 1.4; inp.my += dy * 1.4; }
  });
  window.addEventListener('wheel', e => { if (G.state === 'playing') edge[e.deltaY > 0 ? 'w2' : 'w1'] = true; }, { passive: true });
  document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === cv; if (!locked && G.state === 'playing' && !G.defusing && !G.mobile && !G.noLock) G.hooks.pause && G.hooks.pause(); });
  document.addEventListener('pointerlockerror', () => { G.noLock = true; G.hooks.toast && G.hooks.toast('Mouse lock pawa jayni: drag kore aim korun, click e fire'); });
  initTouch();
}
let dragLook = null; let mapOpen = false;
export function requestLock() { const cv = G.host.querySelector('canvas'); try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => { G.noLock = true; }); } catch (e) { G.noLock = true; } }
export function releaseLock() { try { document.exitPointerLock(); } catch (e) { } }

/* ---- touch controls ---- */
function initTouch() {
  const root = $('touch'); if (!root) return;
  const joy = $('joy'), knob = $('joyKnob'); let jid = null, jc = null; let lookId = null, lx = 0, ly = 0;
  joy.addEventListener('touchstart', e => { const t = e.changedTouches[0]; jid = t.identifier; const r = joy.getBoundingClientRect(); jc = { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 }; e.preventDefault(); }, { passive: false });
  window.addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === jid) { let dx = (t.clientX - jc.x) / jc.r, dy = (t.clientY - jc.y) / jc.r; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } inp.moveX = dx; inp.moveY = -dy; inp.sprint = l > 1.15; knob.style.transform = `translate(${dx * 40}px,${dy * 40}px)`; }
      if (t.identifier === lookId) { inp.mx += (t.clientX - lx) * 2.2; inp.my += (t.clientY - ly) * 2.2; lx = t.clientX; ly = t.clientY; }
    }
  }, { passive: false });
  const end = e => { for (const t of e.changedTouches) { if (t.identifier === jid) { jid = null; inp.moveX = inp.moveY = 0; inp.sprint = false; knob.style.transform = ''; } if (t.identifier === lookId) lookId = null; } };
  window.addEventListener('touchend', end); window.addEventListener('touchcancel', end);
  G.host.addEventListener('touchstart', e => { if (G.state !== 'playing') return; A.init(); for (const t of e.changedTouches) { if (t.clientX > window.innerWidth * 0.35 && lookId === null) { lookId = t.identifier; lx = t.clientX; ly = t.clientY; } } }, { passive: true });
  root.querySelectorAll('[data-act]').forEach(b => {
    const act = b.dataset.act;
    b.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); A.init(); b.classList.add('on');
      if (act === 'fire') { inp.fire = true; inp.fireEdge = true; } else if (act === 'ads') inp.ads = !inp.ads; else if (act === 'interact') inp.interact = true; else if (act === 'pause') G.hooks.pause && G.hooks.pause(); else if (act === 'map') { mapOpen = !mapOpen; G.hooks.map && G.hooks.map(mapOpen); } else edge[act] = true;
      // let a fire touch also aim
      if (act === 'fire' && lookId === null) { const t = e.changedTouches[0]; lookId = t.identifier; lx = t.clientX; ly = t.clientY; }
    }, { passive: false });
    b.addEventListener('touchend', e => { e.preventDefault(); b.classList.remove('on'); if (act === 'fire') inp.fire = false; if (act === 'interact') inp.interact = false; for (const t of e.changedTouches) if (t.identifier === lookId) lookId = null; }, { passive: false });
  });
}

/* ================= viewmodels ================= */
const VM = {};
function buildVM(kind, camo) {
  const glove = M('#2a2a26', 0.7), sleeve = M('#ffffff', 0.92, 0, { map: TEX[camo] || TEX.multicam });
  const w = buildWeapon(kind); const g = new THREE.Group(); g.add(w.group); w.group.rotation.y = PI;
  if (kind === 'pistol') { add(w.group, RB(0.06, 0.08, 0.06, 0.015), glove, [0, -0.06, -0.02]); add(w.group, RB(0.055, 0.07, 0.06, 0.015), glove, [0.03, -0.075, 0.0], [0, 0, 0.3]);
    add(w.group, CAP(0.045, 0.25), sleeve, [0.02, -0.12, -0.2], [1.25, 0, 0.1]); add(w.group, CAP(0.042, 0.25), sleeve, [0.1, -0.13, -0.18], [1.2, -0.3, 0.4]); }
  else { add(w.group, RB(0.06, 0.09, 0.05, 0.015), glove, [w.gripR.x, w.gripR.y - 0.01, w.gripR.z + 0.005]); add(w.group, CAP(0.045, 0.25), sleeve, [0.03, -0.12, -0.24], [1.1, 0, 0.15]);
    add(w.group, RB(0.06, 0.06, 0.09, 0.015), glove, [w.gripL.x - 0.02, w.gripL.y + 0.01, w.gripL.z]); add(w.group, CAP(0.042, 0.3), sleeve, [-0.1, -0.12, w.gripL.z - 0.13], [1.2, 0.4, -0.6]); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } }); G.vmCamera.add(g); g.visible = false;
  const pistol = kind === 'pistol';
  return { g, w, hip: pistol ? V3(0.14, -0.17, -0.4) : V3(0.17, -0.2, -0.5), ads: V3(0, -(w.sight || 0.1), pistol ? -0.34 : -0.28), sprint: pistol ? V3(0.1, -0.3, -0.34) : V3(0.13, -0.27, -0.44) };
}
export function applyLoadout(lo) {
  Object.assign(LOADOUT, lo);
  WEAPONS.rifle = PRIMARIES[LOADOUT.primary] || PRIMARIES.tg24; WEAPONS.pistol = SECONDARIES[LOADOUT.secondary] || SECONDARIES.p17;
  for (const k of ['rifle', 'pistol']) if (VM[k]) G.vmCamera.remove(VM[k].g);
  VM.rifle = buildVM(WEAPONS.rifle.kind, LOADOUT.camo); VM.pistol = buildVM('pistol', LOADOUT.camo);
}
function buildViewmodels() {
  applyLoadout({});
  // muzzle flash sprite in vm scene
  const sm = new THREE.SpriteMaterial({ map: starTex, color: '#ffd9a0', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  VM.flash = new THREE.Sprite(sm); VM.flash.visible = false; G.vmScene.add(VM.flash); VM.flashT = 0;
  // rope for roof entry
  VM.rope = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 6, 6), M('#2a2a22', 0.9)); VM.rope.position.set(0.25, 3, 1.0); VM.rope.visible = false; G.scene.add(VM.rope);
}

/* ================= kinematic body for pushing props ================= */
let kbody = null;

export function initPlayer() {
  buildViewmodels();
  kbody = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, shape: new CANNON.Cylinder(0.32, 0.32, 1.6, 10) }); G.world.addBody(kbody);
  initInput();
}
export function resetPlayer(entry, diff) {
  const s = LV.spawns[entry];
  Object.assign(P, { hp: 100, armor: diff === 'elite' ? 70 : 100, alive: true, stamina: 100, crouched: false, crouchT: 0, lean: 0, vy: 0, onGround: true, cur: 'rifle', adsT: 0, reloadT: 0, switchT: 0, fireCd: 0, bloom: 0, recoilP: 0, recoilY: 0,
    flash: 2, med: 1, healT: 0, flashBlind: 0, hurtT: 0, shake: 0, deathT: 0, interact: null, holdT: 0, rappel: null });
  const W1 = WEAPONS.rifle, W2 = WEAPONS.pistol, gd = LOADOUT.gadgets || [];
  P.ammo.rifle = { mag: W1.max, res: Math.round(W1.res * (diff === 'recruit' ? 1.5 : 1)), mode: W1.auto ? 'auto' : 'semi' }; P.ammo.pistol = { mag: W2.max, res: W2.res, mode: 'semi' };
  P.flash = gd.includes('flash') ? 2 : 0; P.med = gd.includes('med') ? 2 : 1; P.charges = gd.includes('charge') ? 2 : 0; P.smoke = gd.includes('smoke') ? 2 : 0;
  P.pos.copy(s.pos); P.vel.set(0, 0, 0); P.yaw = s.yaw; P.pitch = 0;
  if (s.rappel) { P.rappel = { t: 0, dur: 4.2, h: s.rappel }; P.pos.y = s.rappel; VM.rope.position.set(s.pos.x + 0.25, s.rappel / 2, s.pos.z - 0.2); VM.rope.scale.y = s.rappel / 6; VM.rope.visible = true; A.rope(); } else VM.rope.visible = false;
  VM.rifle.g.visible = true; VM.pistol.g.visible = false;
  for (const k in edge) edge[k] = false; inp.fire = inp.ads = inp.interact = false;
}

/* ================= damage ================= */
export function damagePlayer(amount, fromPos) {
  if (!P.alive || G.state !== 'playing') return;
  const mult = { recruit: 0.55, veteran: 1, elite: 1.35 }[G.diff];
  amount *= mult;
  if (P.armor > 0) { const absorbed = amount * 0.6; P.armor = Math.max(0, P.armor - absorbed * 0.8); amount -= absorbed; }
  P.hp -= amount; P.hurtT = 1; P.shake = Math.max(P.shake, 0.25);
  if (fromPos) { const a = Math.atan2(fromPos.x - P.pos.x, fromPos.z - P.pos.z); P.lastHurtDir = a; G.hooks.hurtDir && G.hooks.hurtDir(a); }
  A.hurt(); G.stats.damageTaken += amount;
  if (P.hp <= 0) { P.hp = 0; P.alive = false; P.deathT = 0; A.muffled(4); G.hooks.playerDied && G.hooks.playerDied(); }
}

/* ================= bullets ================= */
export function fireBullet(origin, dir, dmg, shooter, opts = {}) {
  let o = origin.clone(), remaining = dmg, pens = 0, travelled = 0; const hitSet = new Set();
  for (let iter = 0; iter < 5 && (remaining > 4 || (opts.taser && iter === 0)); iter++) {
    const maxD = 220 - travelled; if (maxD <= 0) break;
    const wh = rayWorld(o, dir, maxD, c => hitSet.has(c));
    const far = wh ? wh.t : maxD;
    ray.set(o, dir); ray.far = far; ray.near = 0;
    const live = G.hitboxes.filter(h => h.userData.agent.alive && h.userData.agent !== shooter);
    const ah = ray.intersectObjects(live, false)[0];
    const ph = ray.intersectObjects(propMeshes(), true)[0];
    const camHB = lights.cams.filter(c => c.alive).map(c => c.hb); const ch = camHB.length ? ray.intersectObjects(camHB, false)[0] : null;
    let best = { d: far, kind: wh ? 'world' : 'none' };
    if (ah && ah.distance < best.d) best = { d: ah.distance, kind: 'agent', h: ah };
    if (ph && ph.distance < best.d) best = { d: ph.distance, kind: 'prop', h: ph };
    if (ch && ch.distance < best.d) best = { d: ch.distance, kind: 'cam', h: ch };
    if (best.kind === 'none') break;
    if (best.kind === 'agent') {
      const ag = best.h.object.userData.agent, part = best.h.object.userData.part;
      if (opts.taser) { if (ag.kind === 'enemy' && ag.stun) { ag.stun(7); ag.tased = true; } A.impact('flesh', best.h.point); FX.emit(best.h.point, dir.clone().negate(), 20, '#7fd8ff', 2, 0.4); return { kind: 'agent', agent: ag, part }; }
      ag.damage(remaining * best.h.object.userData.mult, part, dir, best.h.point, shooter);
      FX.emit(best.h.point, dir.clone().negate(), 10, '#7a0a0a', 1.4, 0.35, 1.2); A.impact('flesh', best.h.point);
      // blood spray on wall behind
      const bh = rayWorld(best.h.point, dir, 2.2); if (bh) FX.decal(bh.p, bh.n, null, true);
      return { kind: 'agent', agent: ag, part };
    }
    if (best.kind === 'prop') {
      const p = best.h.object.userData.prop; const n = best.h.face ? best.h.face.normal.clone().transformDirection(best.h.object.matrixWorld) : dir.clone().negate();
      if (p) { p.body.wakeUp(); const s = { door: 30, shard: 0.3 }[p.kind] || 6; const rp = new CANNON.Vec3(best.h.point.x - p.body.position.x, best.h.point.y - p.body.position.y, best.h.point.z - p.body.position.z); p.body.applyImpulse(new CANNON.Vec3(dir.x * s, dir.y * s, dir.z * s), rp);
        if (p.kind !== 'shard') FX.decal(best.h.point, n, best.h.object); A.impact(p.mat, best.h.point); FX.emit(best.h.point, n, 8, p.mat === 'metal' ? '#ffc070' : '#d6b48a', 2, 0.35); }
      return { kind: 'prop' };
    }
    if (best.kind === 'cam') { G.hooks.cameraShot && G.hooks.cameraShot(best.h.object, best.h.point); FX.emit(best.h.point, dir.clone().negate(), 30, '#9fd8ff', 3, 0.5); A.impact('metal', best.h.point); return { kind: 'cam' }; }
    // world
    const c = wh.c;
    if (c.glass) { shatterGlass(c, wh.p, dir); hitSet.add(c); remaining *= 0.9; travelled += wh.t; o = wh.p.clone().addScaledVector(dir, 0.02); continue; }
    FX.decal(wh.p, wh.n); FX.emit(wh.p, wh.n, c.mat === 'metal' ? 16 : 9, c.mat === 'wood' ? '#c8a070' : c.mat === 'metal' ? '#ffc070' : '#d0c8b8', c.mat === 'metal' ? 3.5 : 2.2, 0.4);
    if (c.mat !== 'metal') FX.puff(wh.p, { count: 1, size: 0.12, life: 0.8, rise: 0.15, color: c.mat === 'wood' ? '#8a7050' : '#9a968e', spread: 0.02 });
    A.impact(c.mat, wh.p); emitNoise(wh.p, 5, 'impact');
    const thick = wh.t1 - wh.t;
    if (c.pen && pens < 2 && thick < 1.2) { pens++; hitSet.add(c); remaining *= c.door ? 0.7 : 0.55; travelled += wh.t1; o = o.clone().addScaledVector(dir, wh.t1 + 0.01); const exitN = wh.n.clone().negate(); FX.decal(o.clone(), exitN); continue; }
    return { kind: 'world', p: wh.p };
  }
  return { kind: 'none' };
}

/* ================= interact targets ================= */
function findInteract() {
  const fwd = V3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw)); const eye = P.pos;
  let best = null, bs = -1;
  const consider = (pos, maxD, data) => { const dx = pos.x - eye.x, dz = pos.z - eye.z, d = Math.hypot(dx, dz); if (d > maxD) return; const dot = d < 0.6 ? 1 : (dx * fwd.x + dz * fwd.z) / d; if (dot < 0.45) return; const s = dot * 2 - d * 0.6 + (data.prio || 0); if (s > bs) { bs = s; best = data; } };
  for (const h of G.hostages) { if (h.alive && h.state === 'restrained') consider(h.pos, 1.7, { kind: 'free', agent: h, hold: 1.0, label: 'Hostage ke mukto koro', prio: 1 }); }
  for (const e of G.enemies) { if (e.alive && (e.state === 'surrender' || e.state === 'stunned')) consider(e.pos, 1.8, { kind: 'arrest', agent: e, hold: 1.3, label: e.leader ? 'Leader ke arrest koro' : 'Arrest koro', prio: 2 }); }
  for (const t of G.team) { if (t.alive && t.state === 'downed') consider(t.pos, 1.8, { kind: 'revive', agent: t, hold: 2.4, label: `${t.name} ke tule dhoro (revive)`, prio: 2 }); }
  for (const it of interactables) { if (it.used) continue; const d = Math.hypot(it.pos.x - eye.x, it.pos.z - eye.z); if (d > 1.8) continue;
    if (it.kind === 'console') consider(it.pos, 1.8, { kind: 'console', it, hold: 1.8, label: it.label }); else if (it.kind === 'bomb') { if (!it.defused) consider(it.pos, 1.8, { kind: 'bomb', it, hold: 0, label: it.label, prio: 1 }); }
    else if (it.kind === 'task') { if (!it.req || it.req()) consider(it.pos, 2.0, { kind: 'task', it, hold: it.hold ?? 1.5, label: it.label, prio: 1 }); } else if (it.kind === 'item') consider(it.pos, 1.8, { kind: 'item', it, hold: 0.8, label: it.label, prio: 1 });
    else if (it.kind === 'ammo' || it.kind === 'medkit' || it.kind === 'intel') consider(it.pos, 1.8, { kind: 'pickup', it, hold: 0, label: it.label }); }
  for (const d of doors) { if (d.broken) continue; consider(d.center, 2.0, { kind: 'door', door: d, hold: 0, label: d.locked ? 'Locked · T chaple Bolt breach korbe' : (Math.abs(d.target) > 0.1 ? 'Door bondho koro' : 'Door kholo'), prio: -0.5 }); }
  return best;
}
function doInteract(t) {
  if (t.kind === 'free') { t.agent.free(); A.zip(); }
  else if (t.kind === 'arrest') { t.agent.arrest(); A.cuff(); }
  else if (t.kind === 'revive') { t.agent.revive(); }
  else if (t.kind === 'door') { t.door.toggle(P.pos, 'player'); if (t.door.locked) G.hooks.lockedDoor && G.hooks.lockedDoor(t.door); }
  else if (t.kind === 'pickup') { const it = t.it;
    if (it.kind === 'ammo') { P.ammo.rifle.res = Math.max(P.ammo.rifle.res, WEAPONS.rifle.res); P.ammo.pistol.res = Math.max(P.ammo.pistol.res, WEAPONS.pistol.res); if ((LOADOUT.gadgets || []).includes('flash')) P.flash = Math.max(P.flash, 2); if ((LOADOUT.gadgets || []).includes('smoke')) P.smoke = Math.max(P.smoke, 2); A.pickup(); G.hooks.toast && G.hooks.toast('Ammo ar flashbang refill hoyeche'); return; }
    if (it.kind === 'medkit') { if (P.med >= 2 && P.hp >= 100) { G.hooks.toast && G.hooks.toast('Medkit full'); return; } it.used = true; it.obj.visible = false; P.med = Math.min(2, P.med + 1); A.pickup(); G.hooks.toast && G.hooks.toast('Medkit +1 (H chaple use)'); }
    if (it.kind === 'intel') { it.used = true; it.obj.visible = false; A.pickup(); G.hooks.intel && G.hooks.intel(); } }
  else if (t.kind === 'console') { t.it.used = true; G.hooks.console && G.hooks.console(t.it); }
  else if (t.kind === 'bomb') { G.hooks.bomb && G.hooks.bomb(t.it); }
  else if (t.kind === 'task') { G.hooks.task && G.hooks.task(t.it); }
  else if (t.kind === 'item') { G.hooks.item && G.hooks.item(t.it); }
}

/* ================= flashbang ================= */
const nades = [];
function throwFlash(kind = 'flash') {
  if (kind === 'smoke') { if (P.smoke <= 0) { G.hooks.toast && G.hooks.toast('Smoke nei (loadout e smoke nao)'); return; } P.smoke--; }
  else { if (P.flash <= 0) { G.hooks.toast && G.hooks.toast('Flashbang nei'); return; } P.flash--; } A.mech('pin'); P.throwT = 0.5;
  const dir = new THREE.Vector3(); G.camera.getWorldDirection(dir); const o = G.camera.position.clone().addScaledVector(dir, 0.4);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.11, 10), M('#3a4030', 0.6, 0.4)); m.castShadow = true; G.scene.add(m);
  const b = new CANNON.Body({ mass: 0.4, shape: new CANNON.Sphere(0.05), linearDamping: 0.1, angularDamping: 0.2 }); b.position.set(o.x, o.y, o.z);
  b.velocity.set(dir.x * 13 + P.vel.x, dir.y * 13 + 3.2, dir.z * 13 + P.vel.z); b.angularVelocity.set(rr(-8, 8), rr(-8, 8), rr(-8, 8));
  let lastClink = 0; b.addEventListener('collide', () => { if (G.time - lastClink > 0.15) { lastClink = G.time; A.clink(b.position); } });
  G.world.addBody(b); nades.push({ m, b, t: kind === 'smoke' ? 1.4 : 1.7, kind }); if (kind === 'smoke') m.material = M('#5a6a5a', 0.7, 0.3);
}
function updateNades(dt) {
  for (let i = nades.length - 1; i >= 0; i--) { const n = nades[i]; n.t -= dt; n.m.position.copy(n.b.position); n.m.quaternion.copy(n.b.quaternion);
    if (n.t <= 0) { const p = n.m.position.clone(); G.scene.remove(n.m); G.world.removeBody(n.b); nades.splice(i, 1); if (n.kind === 'smoke') { G.hooks.smoke && G.hooks.smoke(p); } else detonateFlash(p); } }
}
function detonateFlash(p) {
  A.bang(p); FX.light(p, '#ffffff', 220, 0.35, 22); FX.emit(p, V3(0, 1, 0), 60, '#ffffff', 5, 0.4, 2); FX.puff(p, { count: 6, size: 0.6, life: 2.5, rise: 0.25, color: '#d8d8d8', spread: 0.5 });
  emitNoise(p, 40, 'explosion');
  // player blinding
  const eye = G.camera.position; const d = eye.distanceTo(p);
  if (d < 14 && rayClear(eye, p)) { const dir = new THREE.Vector3(); G.camera.getWorldDirection(dir); const to = p.clone().sub(eye).normalize(); const dot = dir.dot(to);
    const k = clamp((1 - d / 14) * (dot > 0.2 ? 1 : 0.35), 0, 1); if (k > 0.05) { P.flashBlind = Math.max(P.flashBlind, 1 + k * 3.5); A.tinnitus(1 + k * 4); } }
  G.hooks.flashbang && G.hooks.flashbang(p);
  G.stats.flashes++;
}
function rayClear(a, b) { const d = b.clone().sub(a); const L = d.length(); d.normalize(); const h = rayWorld(a, d, L - 0.1, c => !!c.glass); return !h; }

/* ================= main update ================= */
export function updatePlayer(dt) {
  const cam = G.camera, S = G.settings;
  if (!P.alive) { deathCam(dt); return; }
  // ---- rappel intro ----
  if (P.rappel) { const r = P.rappel; r.t += dt; const k = clamp(r.t / r.dur, 0, 1); P.pos.y = r.h * (1 - k * k * (3 - 2 * k)); P.pitch = damp(P.pitch, -0.5 + k * 0.5, 3, dt);
    if (k >= 1) { P.rappel = null; P.pos.y = 0; A.land(); VM.rope.visible = false; G.hooks.landed && G.hooks.landed(); } placeCamera(dt, 0); updateVM(dt, 0); return; }
  // ---- look ----
  const sens = 0.0022 * S.sens * (P.adsT > 0.5 ? (WEAPONS[P.cur].adsFov / S.fov) * 1.1 : 1);
  P.yaw -= inp.mx * sens; P.pitch -= inp.my * sens * (S.invertY ? -1 : 1); inp.mx = inp.my = 0; P.pitch = clamp(P.pitch, -1.45, 1.45);
  // ---- stance ----
  if (pressed('crouch')) P.crouched = !P.crouched; const crouch = P.crouched || keys.ControlLeft || keys.ControlRight;
  P.crouchT = damp(P.crouchT, crouch ? 1 : 0, 10, dt); P.height = lerp(1.62, 1.05, P.crouchT);
  // ---- movement ----
  let mx = 0, mz = 0;
  const frozen = G.defusing || G.state !== 'playing';
  if (!frozen) { if (keys.KeyW || keys.ArrowUp) mz += 1; if (keys.KeyS || keys.ArrowDown) mz -= 1; if (keys.KeyD || keys.ArrowRight) mx += 1; if (keys.KeyA || keys.ArrowLeft) mx -= 1; mx += inp.moveX; mz += inp.moveY; } const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
  const wantSprint = (keys.ShiftLeft || keys.ShiftRight || inp.sprint) && mz > 0.3 && !crouch && P.adsT < 0.3 && P.reloadT <= 0 && P.stamina > 3;
  P.sprinting = wantSprint && ml > 0.1;
  let speed = crouch ? 1.7 : P.sprinting ? 5.4 : 3.2; if (P.adsT > 0.3) speed *= 0.6; if (Math.abs(P.lean) > 0.3) speed *= 0.6; if (P.hp < 30) speed *= 0.85;
  const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
  const wx = (fx * mz + rx * mx) * speed, wz = (fz * mz + rz * mx) * speed; const accel = P.onGround ? 12 : 2.5;
  P.vel.x = damp(P.vel.x, wx, accel, dt); P.vel.z = damp(P.vel.z, wz, accel, dt);
  if (pressed('jump') && P.onGround && !crouch) { P.vy = 3.6; P.onGround = false; emitNoise(P.pos, 4, 'step'); }
  P.vy -= 9.8 * dt; P.pos.y += P.vy * dt; if (P.pos.y <= 0) { if (!P.onGround && P.vy < -2.5) { A.land(); emitNoise(P.pos, 5, 'step'); } P.pos.y = 0; P.vy = 0; P.onGround = true; }
  const old = P.pos.clone(); P.pos.x += P.vel.x * dt; P.pos.z += P.vel.z * dt;
  collideCircle(P.pos, 0.32, P.pos.y + 0.35, P.pos.y + P.height + 0.1);
  P.speed = Math.hypot(P.pos.x - old.x, P.pos.z - old.z) / Math.max(dt, 1e-4); P.moving = P.speed > 0.4;
  if (kbody) { kbody.position.set(P.pos.x, P.pos.y + 0.8, P.pos.z); kbody.velocity.set(P.vel.x, 0, P.vel.z); }
  // stamina
  if (P.sprinting) { P.stamina -= 20 * dt; P.staminaCd = 0.9; } else if (P.breathHold) { P.stamina -= 28 * dt; P.staminaCd = 0.9; } else { P.staminaCd -= dt; if (P.staminaCd <= 0) P.stamina += 16 * dt; }
  P.stamina = clamp(P.stamina, 0, 100);
  // footsteps
  if (P.onGround && P.moving) { P.stepAcc += P.speed * dt; const stride = P.sprinting ? 1.05 : crouch ? 0.6 : 0.78;
    if (P.stepAcc > stride) { P.stepAcc = 0; const surf = roomAt(P.pos.x, P.pos.z).surface; A.step(surf, null, crouch ? 0.35 : P.sprinting ? 1.3 : 0.8);
      emitNoise(P.pos, crouch ? 0.8 : P.sprinting ? 9 : 3.2, 'step', 'player'); } }
  // lean
  const leanIn = (keys.KeyE ? 1 : 0) - (keys.KeyQ ? 1 : 0); let leanT = leanIn;
  if (leanIn) { const side = V3(rx * leanIn, 0, rz * leanIn); const head = V3(P.pos.x, P.pos.y + P.height, P.pos.z); const h = rayWorld(head, side, 0.6); if (h) leanT = leanIn * clamp((h.t - 0.2) / 0.4, 0, 1); }
  P.lean = damp(P.lean, leanT, 9, dt);
  // ---- weapon ----
  updateWeapon(dt, crouch);
  // ---- gadgets & commands ----
  if (pressed('flash')) throwFlash('flash'); if (pressed('smoke')) throwFlash('smoke'); if (pressed('scan')) G.hooks.command && G.hooks.command('scan');
  if (pressed('med')) { if (P.med > 0 && P.hp < 100 && P.healT <= 0) { P.med--; P.healT = 3; A.pickup(); G.hooks.toast && G.hooks.toast('Medkit use hocche…'); } else if (P.med <= 0) G.hooks.toast && G.hooks.toast('Medkit nei'); }
  if (P.healT > 0) { P.healT -= dt; P.hp = Math.min(100, P.hp + 17 * dt); }
  if (pressed('yell')) G.hooks.yell && G.hooks.yell();
  if (pressed('follow')) G.hooks.command && G.hooks.command('follow');
  if (pressed('breach')) G.hooks.command && G.hooks.command('breach');
  if (pressed('mark')) G.hooks.command && G.hooks.command('mark');
  if (pressed('map')) G.hooks.map && G.hooks.map(true); if (edge.mapUp) { edge.mapUp = false; G.hooks.map && G.hooks.map(false); }
  updateNades(dt);
  // ---- interact ----
  const t = findInteract(); P.interact = t; const holdKey = keys.KeyF || inp.interact;
  if (t) { if (t.hold > 0) { if (holdKey) { P.holdT += dt; if (P.holdT >= t.hold) { doInteract(t); P.holdT = 0; keys.KeyF = false; inp.interact = false; } } else P.holdT = 0; }
    else if (pressed('interactE') || (inp.interact && !P._intLatch)) { doInteract(t); P._intLatch = true; } }
  else P.holdT = 0;
  if (!inp.interact) P._intLatch = false; edge.interactE = false;
  // ---- effects ----
  P.hurtT = Math.max(0, P.hurtT - dt * 1.5); P.flashBlind = Math.max(0, P.flashBlind - dt); P.shake = Math.max(0, P.shake - dt);
  if (P.hp < 30) { P._hb = (P._hb || 0) - dt; if (P._hb <= 0) { A.heartbeat(); P._hb = 0.9; } }
  placeCamera(dt, crouch);
  updateVM(dt, crouch);
}

function updateWeapon(dt, crouch) {
  const W = WEAPONS[P.cur], am = P.ammo[P.cur];
  if (G.defusing) { edge.w1 = edge.w2 = edge.reload = edge.mode = false; P.ads = false; P.adsT = damp(P.adsT, 0, 12, dt); P.scoped = false; return; }
  P.fireCd -= dt; P.bloom = Math.max(0, P.bloom - dt * 0.09); P.recoilP = damp(P.recoilP, 0, 5, dt); P.recoilY = damp(P.recoilY, 0, 5, dt);
  // switching
  if (P.switchT > 0) { P.switchT -= dt; if (P.switchT <= 0.25 && P._switchTo) { P.cur = P._switchTo; P._switchTo = null; VM.rifle.g.visible = P.cur === 'rifle'; VM.pistol.g.visible = P.cur === 'pistol'; } return; }
  const want = pressed('w1') ? 'rifle' : pressed('w2') ? 'pistol' : pressed('swap') ? (P.cur === 'rifle' ? 'pistol' : 'rifle') : null;
  if (want && want !== P.cur && P.reloadT <= 0) { P._switchTo = want; P.switchT = 0.5; A.mech('switch'); return; }
  if (pressed('mode') && P.cur === 'rifle') { am.mode = am.mode === 'auto' ? 'semi' : 'auto'; A.mech('mode'); G.hooks.toast && G.hooks.toast(`Fire mode: ${am.mode.toUpperCase()}`); }
  // reload
  if (P.reloadT > 0) { const prev = P.reloadT; P.reloadT -= dt; const el = P.reloadTotal - P.reloadT, pel = P.reloadTotal - prev;
    if (pel < 0.3 && el >= 0.3) A.mech('magout'); if (pel < P.reloadTotal - 0.65 && el >= P.reloadTotal - 0.65) A.mech('magin'); if (P.reloadEmpty && pel < P.reloadTotal - 0.25 && el >= P.reloadTotal - 0.25) A.mech('bolt');
    if (P.reloadT <= 0) { const need = W.max - am.mag + (P.reloadEmpty ? 0 : 0), got = Math.min(need, am.res); am.mag += got; am.res -= got; }
  } else if ((pressed('reload') || (am.mag === 0 && inp.fire && am.res > 0 && P.fireCd < -0.25)) && am.mag < W.max && am.res > 0) {
    P.reloadEmpty = am.mag === 0; P.reloadTotal = P.reloadT = P.reloadEmpty ? W.emptyReload : W.reload; P.ads = false; G.hooks.teamCallout && G.hooks.teamCallout('reload');
  }
  // ADS
  P.ads = inp.ads && P.reloadT <= 0 && !P.sprinting; P.adsT = damp(P.adsT, P.ads ? 1 : 0, 12, dt);
  P.scoped = P.cur === 'rifle' && W.scope && P.adsT > 0.88;
  P.breathHold = P.ads && (keys.ShiftLeft || keys.ShiftRight) && P.stamina > 5;
  // fire
  const canFire = P.reloadT <= 0 && !P.sprinting && (P.throwT || 0) <= 0;
  const wantFire = inp.fire || inp.fireEdge;
  if (wantFire && canFire && P.fireCd <= 0) {
    inp.fireEdge = false;
    if (am.mode === 'semi' && P.triggerHeld && !P._edgeShot) { }
    else if (am.mag <= 0) { if (!P.triggerHeld) A.mech('empty'); }
    else shoot(W, am, crouch);
  }
  if (!canFire) inp.fireEdge = false; P.triggerHeld = inp.fire; P.throwT = Math.max(0, (P.throwT || 0) - dt);
}
function shoot(W, am, crouch) {
  am.mag--; P.fireCd = 60 / W.rpm; G.stats.shots++;
  const moving = clamp(P.speed / 4, 0, 1);
  const spread = (P.adsT > 0.6 ? W.adsSpread : W.spread) + moving * 0.03 * (1 - P.adsT * 0.7) + (P.onGround ? 0 : 0.06) + P.bloom * (1 - P.adsT * 0.6);
  const dir = new THREE.Vector3(); G.camera.getWorldDirection(dir);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(G.camera.quaternion), right = new THREE.Vector3(1, 0, 0).applyQuaternion(G.camera.quaternion);
  const g1 = (R() + R() + R() - 1.5) / 1.5, g2 = (R() + R() + R() - 1.5) / 1.5;
  dir.addScaledVector(right, g1 * spread).addScaledVector(up, g2 * spread).normalize();
  const n = W.pellets || 1; let hitAny = null, head = false;
  for (let i = 0; i < n; i++) { const d2 = dir.clone(); if (n > 1) { d2.addScaledVector(right, (R() - 0.5) * W.spread * 1.6).addScaledVector(up, (R() - 0.5) * W.spread * 1.6).normalize(); }
    const res = fireBullet(G.camera.position.clone(), n > 1 ? d2 : dir, W.dmg, 'player', { taser: W.taser, quiet: i > 0 });
    if (res.kind === 'agent') { hitAny = res.agent; if (res.part === 'head') head = true; } }
  if (W.taser) FX.tracer(G.camera.position.clone().add(V3(0, -0.15, 0)), G.camera.position.clone().addScaledVector(dir, 8), '#7fd8ff');
  if (hitAny) { G.stats.hits++; if (head) G.stats.headshots++; G.hooks.hitmark && G.hooks.hitmark(hitAny); }
  P.bloom = Math.min(0.06, P.bloom + 0.007);
  const k = W.recoil * (P.adsT > 0.6 ? 0.65 : 1) * (crouch ? 0.8 : 1);
  P.pitch += k * (0.8 + R() * 0.4); P.yaw += (R() - 0.45) * k * 0.6; P.recoilP += k * 1.4; P.kickT = 1; P.shake = Math.max(P.shake, 0.05 * W.kick);
  A.shot(W.sound); emitNoise(P.pos, W.noise, 'gunshot', 'player');
  VM.flashT = 0.045; G.vmFlash.intensity = 4;
  if (!W.suppressed) FX.light(G.camera.position.clone().addScaledVector(dir, 0.8), '#ffb35a', 4, 0.06, 6);
  const wpos = G.camera.localToWorld(V3(0.12, -0.12, -0.3)); const rdir = V3(1, 0.3, 0).applyQuaternion(G.camera.quaternion); FX.casing(wpos, rdir, P.pos.y);
  G.hooks.teamCallout && G.hooks.teamCallout('playerFire');
}

let bobT = 0;
function placeCamera(dt, crouch) {
  const cam = G.camera, S = G.settings;
  bobT += dt * (P.moving && P.onGround ? (P.sprinting ? 13 : 9) : 0);
  const bobA = P.moving && P.onGround ? (P.sprinting ? 0.05 : 0.025) * (1 - P.adsT * 0.8) : 0;
  const rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
  cam.position.set(P.pos.x + rx * P.lean * 0.38, P.pos.y + P.height + Math.sin(bobT) * bobA - Math.abs(P.lean) * 0.06, P.pos.z + rz * P.lean * 0.38);
  const sh = P.shake * 0.04, sway = P.ads && !P.breathHold ? 0.0022 * (1 + (P.hp < 40 ? 1.5 : 0)) : 0;
  cam.rotation.set(P.pitch + P.recoilP * 0.4 + (R() - 0.5) * sh + Math.sin(G.time * 1.3) * sway, P.yaw + (R() - 0.5) * sh + Math.cos(G.time * 0.9) * sway * 1.4, -P.lean * 0.18 + Math.sin(bobT * 0.5) * bobA * 0.3, 'YXZ');
  if (G.sway) { cam.rotation.z += Math.sin(G.time * 0.55) * G.sway; cam.rotation.x += Math.sin(G.time * 0.37) * G.sway * 0.3; cam.position.y += Math.sin(G.time * 0.55 + 1) * G.sway * 4; }
  if (G.shakeAmb) { cam.position.x += (R() - 0.5) * G.shakeAmb; cam.position.y += (R() - 0.5) * G.shakeAmb; cam.rotation.z += (R() - 0.5) * G.shakeAmb * 0.3; }
  cam.updateMatrixWorld();
  const fov = lerp(S.fov, WEAPONS[P.cur].adsFov, P.adsT) * (P.sprinting ? 1.06 : 1);
  if (Math.abs(cam.fov - fov) > 0.05) { cam.fov = damp(cam.fov, fov, 14, dt); cam.updateProjectionMatrix(); }
  // light level for viewmodel
  const room = roomAt(P.pos.x, P.pos.z); G.vmHemi.intensity = damp(G.vmHemi.intensity, 0.4 + room.light * 0.9, 3, dt); G.vmKey.intensity = damp(G.vmKey.intensity, 0.4 + room.light * 1.0, 3, dt);
  A.setOutdoor(room.indoor ? 0 : 1);
}
function updateVM(dt, crouch) {
  const vm = VM[P.cur]; if (!vm) return; const g = vm.g;
  const base = P.sprinting ? vm.sprint : vm.hip; const target = base.clone().lerp(vm.ads, P.adsT);
  const bob = P.moving && P.onGround ? (P.sprinting ? 0.022 : 0.011) * (1 - P.adsT * 0.85) : 0.002;
  target.x += Math.cos(bobT * 0.5) * bob; target.y += Math.abs(Math.sin(bobT * 0.5)) * bob * -1;
  P.kickT = Math.max(0, (P.kickT || 0) - dt * 9); target.z += P.kickT * 0.04; target.y += P.kickT * 0.01;
  let rotX = P.kickT * 0.06, rotZ = 0, rotY = 0;
  if (P.sprinting) { rotY = 0.6; rotX -= 0.25; rotZ = 0.2; }
  if (P.reloadT > 0) { const k = Math.sin(clamp(1 - P.reloadT / P.reloadTotal, 0, 1) * PI); rotX -= k * 0.55; rotZ += k * 0.4; target.y -= k * 0.06; }
  if (P.switchT > 0) { const k = Math.sin(clamp(P.switchT / 0.5, 0, 1) * PI); target.y -= k * 0.3; }
  if ((P.throwT || 0) > 0) { target.y -= Math.sin(P.throwT / 0.5 * PI) * 0.2; }
  if (P.rappel) { target.y -= 0.25; }
  g.position.lerp(target, 1 - Math.exp(-dt * 18));
  g.rotation.x = damp(g.rotation.x, rotX, 14, dt); g.rotation.y = damp(g.rotation.y, rotY, 10, dt); g.rotation.z = damp(g.rotation.z, rotZ - P.lean * 0.1, 10, dt);
  g.visible = !P.scoped && P.alive && (P._switchTo ? true : true) && (P.cur === 'rifle' ? vm === VM.rifle : vm === VM.pistol);
  VM.rifle.g.visible = P.cur === 'rifle' && !P.scoped && P.alive; VM.pistol.g.visible = P.cur === 'pistol' && P.alive;
  // muzzle flash
  if (VM.flashT > 0) { VM.flashT -= dt; const mp = vm.w.group.localToWorld(vm.w.muzzle.clone()); VM.flash.position.copy(mp); VM.flash.visible = !P.scoped; VM.flash.scale.setScalar(WEAPONS[P.cur].suppressed ? 0.08 : 0.2); VM.flash.material.rotation = R() * 6; }
  else { VM.flash.visible = false; G.vmFlash.intensity = 0; }
}
function deathCam(dt) {
  P.deathT += dt; const k = clamp(P.deathT / 1.2, 0, 1); const cam = G.camera;
  cam.position.y = damp(cam.position.y, P.pos.y + 0.25, 4, dt); cam.rotation.z = damp(cam.rotation.z, 1.2, 3, dt); cam.rotation.x = damp(cam.rotation.x, 0.2, 3, dt);
  VM.rifle.g.visible = VM.pistol.g.visible = false; VM.flash.visible = false;
}
export function clearNades() { for (const n of nades) { G.scene.remove(n.m); G.world.removeBody(n.b); } nades.length = 0; }
export { inp, keys };
