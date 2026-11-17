// Tiger 24 · Operation Vault — AI agents: enemies, hostages, teammates, ragdolls
import { THREE, CANNON, G, PI, TAU, clamp, damp, angDiff, R, rr, A, FX, VO, NOISE, emitNoise, V3 } from './core.js';
import { makeEnemy, makeLeader, makeOperator, makeHostage, HOSTAGE_LOOKS, animate } from './assets.js';
import { findPath, los, collideCircle, rayWorld, doorNear, doors, LV, roomAt, walkable, shatterGlass } from './levelkit.js';
import { P, damagePlayer } from './player.js';

const DIFF = {
  recruit: { detect: 0.65, react: 0.95, acc: 0.17, hp: 85, stun: 6, dmg: [10, 18] },
  veteran: { detect: 1.0, react: 0.55, acc: 0.27, hp: 100, stun: 5, dmg: [14, 24] },
  elite: { detect: 1.45, react: 0.32, acc: 0.38, hp: 115, stun: 3.8, dmg: [18, 28] },
};
export const D = () => DIFF[G.diff];
const ragdolls = [];
const tmp = V3(), tmp2 = V3();

export class Agent {
  constructor(kind, model, o) {
    this.kind = kind; this.m = model; this.root = model.root; G.scene.add(this.root);
    this.pos = o.pos.clone(); this.yaw = o.yaw || 0; this.root.position.copy(this.pos); this.root.rotation.y = this.yaw;
    this.anim = { speed: 0, crouch: 0, aim: 0, pitch: 0, mode: 'normal', seed: R() * 10, breathe: true };
    this.alive = true; this.state = 'idle'; this.path = null; this.pathI = 0; this.repathT = 0; this.dest = null; this.vel = V3();
    this.name = o.name || kind; this.id = o.id || kind; this.voiceCd = 0; this.lookT = 0;
    this.hitboxes = [];
    for (const [part, s] of Object.entries(model.rig.segs)) {
      const hb = new THREE.Mesh(new THREE.BoxGeometry(s.s[0], s.s[1], s.s[2]), new THREE.MeshBasicMaterial({ visible: false }));
      hb.position.set(s.c[0], s.c[1], s.c[2]); hb.visible = false; hb.userData = { agent: this, part, mult: s.mult, hitbox: true }; s.g.add(hb); this.hitboxes.push(hb); G.hitboxes.push(hb);
    }
    this.kb = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, shape: new CANNON.Cylinder(0.28, 0.28, 1.5, 8) }); G.world.addBody(this.kb);
    G.agents.push(this);
  }
  get eye() { return tmp.set(this.pos.x, this.pos.y + (this.anim._cr > 0.5 || this.anim._kn > 0.5 ? 1.05 : 1.62) * this.root.scale.y, this.pos.z).clone(); }
  get chestPos() { return V3(this.pos.x, this.pos.y + (this.anim._kn > 0.5 ? 0.9 : this.anim._cr > 0.5 ? 0.85 : 1.3), this.pos.z); }
  forward() { return V3(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }
  faceTo(p, dt, rate = 6) { const want = Math.atan2(p.x - this.pos.x, p.z - this.pos.z); this.yaw += angDiff(this.yaw, want) * Math.min(1, dt * rate); }
  say(text, o = {}) { if (this.voiceCd > 0 && !o.force) return; this.voiceCd = o.cd || 3; VO.say(this.name, text, Object.assign({ radio: this.kind === 'team', pitch: this.kind === 'enemy' ? 0.75 : this.kind === 'hostage' ? 1.25 : 1 }, o)); }
  // ---------- navigation ----------
  goTo(dest, opt = {}) {
    const far = !this.dest || this.dest.distanceTo(dest) > 0.8;
    if (far || this.repathT <= 0 || !this.path) { this.dest = dest.clone(); this.path = findPath(this.pos, dest, { locked: this.kind === 'enemy', ...opt }); this.pathI = 1; this.repathT = 1.2 + R() * 0.6; }
  }
  stop() { this.path = null; this.dest = null; }
  follow(dt, speed) {
    this.repathT -= dt; if (!this.path || this.pathI >= this.path.length) { this.anim.speed = damp(this.anim.speed, 0, 8, dt); return true; }
    const tgt = this.path[this.pathI]; const dx = tgt.x - this.pos.x, dz = tgt.z - this.pos.z, d = Math.hypot(dx, dz);
    if (d < 0.35) { this.pathI++; if (this.pathI >= this.path.length) { this.path = null; return true; } return false; }
    // doors: only open a door we are actually about to walk through
    const door = doorNear(this.pos, 1.6);
    if (door && !door.isOpen && Math.abs(door.target) < 0.1 && door.side(this.pos) !== door.side(tgt)) { const ok = door.open(this.pos, this.kind === 'enemy' ? 'enemy' : 'npc'); if (!ok) { this.path = null; return true; } }
    // stuck detection: re-plan and sidestep if no progress
    this._stuckT = (this._stuckT || 0) + dt; if (this._stuckT > 1.2) { const moved = this._lastP ? this._lastP.distanceTo(this.pos) : 1; this._lastP = this.pos.clone(); this._stuckT = 0;
      if (moved < 0.15 && speed > 0.5) { this.path = null; this.repathT = 0; this.pos.x += (R() - 0.5) * 0.3; this.pos.z += (R() - 0.5) * 0.3; return false; } }
    const sp = Math.min(speed, d / dt); this.pos.x += dx / d * sp * dt; this.pos.z += dz / d * sp * dt;
    this.yaw += angDiff(this.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 8);
    this.anim.speed = damp(this.anim.speed, speed, 8, dt); return false;
  }
  physicsStep(dt) {
    collideCircle(this.pos, 0.28, 0.3, 1.7, false);
    for (const o of G.agents) { if (o === this || !o.alive || o.hidden || o.noCollide || this.noCollide) continue; const dx = this.pos.x - o.pos.x, dz = this.pos.z - o.pos.z, d2 = dx * dx + dz * dz; if (d2 < 0.3 && d2 > 1e-6) { const d = Math.sqrt(d2), push = (0.55 - d) * 0.5; this.pos.x += dx / d * push; this.pos.z += dz / d * push; } }
    if (this.kind !== 'team' || true) { const dx = this.pos.x - P.pos.x, dz = this.pos.z - P.pos.z, d2 = dx * dx + dz * dz; if (d2 < 0.36 && d2 > 1e-6) { const d = Math.sqrt(d2); this.pos.x += dx / d * (0.6 - d) * 0.6; this.pos.z += dz / d * (0.6 - d) * 0.6; } }
    this.root.position.copy(this.pos); this.root.rotation.y = this.yaw; this.kb.position.set(this.pos.x, 0.75, this.pos.z);
  }
  // ---------- damage ----------
  damage(amount, part, dir, point, shooter) {
    if (!this.alive) return;
    if (this.armor && part === 'torso') amount *= 0.55;
    this.hp -= amount; this.flinch = 0.25; this.lastHitDir = dir.clone(); this.lastHitPart = part; this.lastShooter = shooter;
    this.onHurt && this.onHurt(amount, part, dir, shooter);
    if (this.hp <= 0) this.die(dir, point, part, shooter, amount);
  }
  die(dir, point, part, shooter, force = 30) {
    if (!this.alive) return; this.alive = false; this.state = 'dead';
    for (const hb of this.hitboxes) { const i = G.hitboxes.indexOf(hb); if (i >= 0) G.hitboxes.splice(i, 1); hb.parent && hb.parent.remove(hb); }
    G.world.removeBody(this.kb);
    makeRagdoll(this, dir || V3(0, 0, 1), point, part, force);
    G.hooks.agentDied && G.hooks.agentDied(this, shooter, part);
  }
  remove() { // despawn without ragdoll (rescued / reset)
    this.alive = false; this.hidden = true; G.scene.remove(this.root); G.world.removeBody(this.kb);
    for (const hb of this.hitboxes) { const i = G.hitboxes.indexOf(hb); if (i >= 0) G.hitboxes.splice(i, 1); }
  }
  update(dt) { }
  canSeePoint(p, fovCos = 0.5, maxD = 32) {
    const e = this.eye; const dx = p.x - e.x, dz = p.z - e.z, d = Math.hypot(dx, dz); if (d > maxD) return false;
    if (d > 2.5) { const f = this.forward(); if ((dx * f.x + dz * f.z) / d < fovCos) return false; }
    return los(e, p);
  }
  muzzleWorld() { const w = this.m.weapon; if (!w || w.group.parent !== this.m.rig.chest) return this.chestPos; return w.group.localToWorld(w.muzzle.clone()); }
  shootAt(targetPos, hitChance, onHit, sound = 'ak') {
    const mz = this.muzzleWorld(); FX.muzzle(mz, sound === 'team' ? 0.6 : 1); this.anim.recoil = 1;
    const hit = R() < hitChance; let end;
    if (hit) { end = targetPos.clone(); onHit && onHit(); }
    else { const miss = V3(rr(-1, 1), rr(-0.6, 0.8), rr(-1, 1)).normalize().multiplyScalar(rr(0.4, 1.3)); const aim = targetPos.clone().add(miss); const dir = aim.sub(mz).normalize();
      const h = rayWorld(mz, dir, 60); end = h ? h.p : mz.clone().addScaledVector(dir, 60);
      if (h) { if (h.c.glass) { shatterGlass(h.c, h.p, dir); } else { FX.decal(h.p, h.n); FX.emit(h.p, h.n, 7, '#d0c8b8', 2, 0.35); A.impact(h.c.mat, h.p); } }
      // bullet crack near player
      const cl = closestOnSeg(P.pos.clone().setY(P.pos.y + 1.4), mz, end); if (cl < 2.5 && this.kind === 'enemy') { if (A.ok) { const t = A.now(); const o = A.out(null, { rev: 0 }); A.noise(o, t, { type: 'highpass', f0: 4000, f1: 2500, dur: 0.05, gain: 0.25 }); } P.shake = Math.max(P.shake, 0.08); G.hooks.suppress && G.hooks.suppress(); }
    }
    FX.tracer(mz, end, sound === 'team' ? '#ffe9b0' : '#ffcf80');
    const occl = !los(G.camera.position, mz); A.shot(sound, mz, occl); emitNoise(mz, sound === 'team' ? 14 : 42, 'gunshot', this);
  }
}
function closestOnSeg(p, a, b) { const ab = b.clone().sub(a), t = clamp(p.clone().sub(a).dot(ab) / ab.lengthSq(), 0, 1); return a.clone().addScaledVector(ab, t).distanceTo(p); }

/* =================== ENEMY =================== */
export class Enemy extends Agent {
  constructor(o) {
    const model = o.leader ? makeLeader() : o.officer ? makeOperator({ ...o.officer, weapon: 'pistol' }) : makeEnemy({ v: o.v || 0 }); super('enemy', model, { ...o, name: o.name || (o.leader ? 'Leader' : 'Gunman') });
    this.leader = !!o.leader; this.traitor = !!o.traitor; this.hp = this.maxHp = (o.hp || D().hp) * (this.leader ? 1.6 : 1) * (o.heavy ? 1.8 : 1); this.armor = this.leader || !!o.heavy || this.traitor; this.heavy = !!o.heavy; this.pistol = this.m.weapon && this.m.weapon.kind === 'pistol';
    this.post = o.pos.clone(); this.postYaw = o.yaw || 0; this.patrol = o.patrol || null; this.patrolI = 0; this.waitT = rr(1, 3); this.roomName = o.room;
    this.meter = 0; this.target = null; this.lastSeen = null; this.lostT = 0; this.reactT = 0; this.burst = 0; this.burstCd = 0; this.mag = this.pistol ? 15 : 30; this.reloadT = 0;
    this.percT = R() * 0.2; this.noiseIdx = NOISE.length; this.alerted = false; this.suppressT = 0; this.strafeT = 0; this.strafeDir = V3(); this.peekT = 0; this.seenT = 0; this.stunT = 0; this.surprised = 0;
    this.state = this.patrol ? 'patrol' : 'idle'; this.lookBase = this.yaw;
  }
  targets() { const t = []; if (P.alive) t.push({ kind: 'player', pos: () => V3(P.pos.x, P.pos.y + P.height - 0.1, P.pos.z), feet: P.pos, ref: P }); for (const a of G.team) if (a.alive && a.state !== 'downed') t.push({ kind: 'team', pos: () => a.chestPos.add(V3(0, 0.3, 0)), feet: a.pos, ref: a }); for (const h of G.hostages) if (h.alive && h.targetable) t.push({ kind: 'team', pos: () => h.chestPos, feet: h.pos, ref: h }); return t; }
  die(dir, point, part, shooter, force) { if (this.shieldHostage) { const h = this.shieldHostage; this.shieldHostage = null; if (h.alive) { h.noCollide = false; h.state = 'restrained'; h.free(true); } } super.die(dir, point, part, shooter, force); }
  isHostile() { return this.alive && !['surrender', 'arrested', 'dead'].includes(this.state); }
  onHurt(amount, part, dir, shooter) {
    if (this.state === 'surrender' || this.state === 'arrested') { if (shooter === 'player') G.hooks.unauthorized && G.hooks.unauthorized(this); return; }
    if (this.state === 'shield') return;
    this.suppressT = 1.5;
    if (shooter === 'player' && P.alive) this.engage({ kind: 'player', pos: () => V3(P.pos.x, P.pos.y + P.height - 0.1, P.pos.z), feet: P.pos, ref: P }, true);
    else if (shooter && shooter.kind === 'team') { const t = this.targets().find(x => x.ref === shooter); if (t) this.engage(t, true); }
  }
  engage(t, instant = false) {
    const wasCombat = this.state === 'combat'; if (['stunned', 'surrender', 'arrested', 'dead'].includes(this.state)) return;
    if (this.state === 'shield' || this.state === 'grab') { this.target = t; return; }
    this.target = t; this.lastSeen = t.feet.clone(); this.state = 'combat'; this.lostT = 0; this.meter = 1;
    if (!wasCombat) { this.reactT = instant ? D().react * 0.6 : D().react + rr(0, 0.35) + this.surprised; this.seenT = 0; this.say(['Police! Police!', 'They are here!', 'Contact! Kill them!', 'Get them!'][Math.floor(R() * 4)], { cd: 4 }); this.alertOthers(t); G.hooks.enemyAlert && G.hooks.enemyAlert(this); }
  }
  alertOthers(t) { for (const e of G.enemies) { if (e === this || !e.isHostile() || e.state === 'combat') continue; const d = e.pos.distanceTo(this.pos); if (d < 15 && (roomAt(e.pos.x, e.pos.z) === roomAt(this.pos.x, this.pos.z) || los(e.eye, this.eye))) e.investigate(t.feet.clone(), true); } }
  investigate(p, alert = false) {
    if (!this.isHostile() || this.state === 'combat' || this.state === 'stunned' || this.state === 'shield' || this.state === 'grab') return;
    this.invPos = p.clone(); this.state = alert ? 'search' : 'suspicious'; this.invT = alert ? 16 : 8; this.alerted = this.alerted || alert; this.waitT = alert ? 0.4 : 1.2;
    if (alert) this.say(['Check over there!', 'Something is wrong!', 'Move! Move!'][Math.floor(R() * 3)], { cd: 5 }); else this.say(['Who is there?', 'Did you hear that?'][Math.floor(R() * 2)], { cd: 6 });
  }
  stun(dur) { if (!this.isHostile()) return; if (this.state === 'shield') this.releaseShield(true); this.state = 'stunned'; this.stunT = dur; this.anim.mode = 'stun'; this.stop(); this.say('Argh! My eyes!', { force: true, cd: 3 }); }
  surrender() { this.state = 'surrender'; this.stop(); this.anim.mode = 'surrender'; this.anim.aim = 0; this.dropWeapon(); this.say(['Okay! Okay! Do not shoot!', 'I give up!'][Math.floor(R() * 2)], { force: true }); G.hooks.enemySurrender && G.hooks.enemySurrender(this); }
  arrest() { if (this.state !== 'surrender' && this.state !== 'stunned') return; if (this.state === 'stunned') this.dropWeapon(); this.state = 'arrested'; this.anim.mode = 'restrained'; for (const hb of this.hitboxes) hb.userData.mult *= 1; G.hooks.enemyArrested && G.hooks.enemyArrested(this); }
  dropWeapon() { const w = this.m.weapon; if (!w || w.group.parent !== this.m.rig.chest) return; dropToProp(w); }
  releaseShield(stunned) { const h = this.shieldHostage; this.shieldHostage = null; if (h && h.alive) { h.noCollide = false; h.state = 'restrained'; h.free(true); } this.anim.mode = 'normal'; this.state = stunned ? 'stunned' : 'combat'; }
  tryYell(px) {
    if (!this.isHostile() || this.state === 'shield') { if (this.state === 'shield') this.say('Stay back or she dies!', { force: true }); return false; }
    const d = this.pos.distanceTo(P.pos); if (d > 11 || !los(this.eye, V3(P.pos.x, P.pos.y + P.height, P.pos.z))) return false;
    let ch = { idle: 0.6, patrol: 0.6, suspicious: 0.5, search: 0.32, combat: 0.1, stunned: 0.95, grab: 0.15 }[this.state] ?? 0.2;
    if ((this.leader || this.traitor) && this.state !== 'stunned') ch *= 0.45; if (this.hp < this.maxHp * 0.5) ch += 0.25; ch *= { recruit: 1.25, veteran: 1, elite: 0.75 }[G.diff];
    // facing away = surprised
    const toP = V3(P.pos.x - this.pos.x, 0, P.pos.z - this.pos.z).normalize(); if (toP.dot(this.forward()) < 0) ch += 0.2;
    if (R() < ch) { this.surrender(); return true; }
    this.say(['Never!', 'Go to hell!', 'You will not take me!'][Math.floor(R() * 3)], { force: true }); this.engage({ kind: 'player', pos: () => V3(P.pos.x, P.pos.y + P.height - 0.1, P.pos.z), feet: P.pos, ref: P }, true); return false;
  }
  hear() {
    while (this.noiseIdx < NOISE.length) { const n = NOISE[this.noiseIdx++]; if (n.source === this) continue; if (n.source && n.source.kind === 'enemy' && n.kind !== 'gunshot') continue;
      const d = n.pos.distanceTo(this.pos); const r = n.radius * (los(this.eye, n.pos.clone().setY(Math.max(n.pos.y, 1))) ? 1 : 0.55); if (d > r) continue;
      if (this.state === 'combat') continue;
      if (n.kind === 'gunshot' || n.kind === 'explosion' || n.kind === 'glass') this.investigate(n.source && n.source.kind === 'enemy' ? n.pos : n.pos, true);
      else this.investigate(n.pos, false);
    }
    if (this.noiseIdx > NOISE.length) this.noiseIdx = NOISE.length;
  }
  perceive(dt) {
    this.percT -= dt; if (this.percT > 0) return; const step = 0.12; this.percT = step;
    let bestT = null, bestF = 0;
    for (const t of this.targets()) {
      const tp = t.pos(); const fovCos = this.state === 'combat' || this.state === 'search' ? 0.1 : 0.5;
      if (!this.canSeePoint(tp, fovCos, 34)) continue;
      const d = this.eye.distanceTo(tp);
      let f; if (t.kind === 'player') { const light = Math.pow(roomAt(P.pos.x, P.pos.z).light, 1.5); const stance = 1 - P.crouchT * 0.5; const mv = P.sprinting ? 1.5 : P.moving ? 1 : 0.5; f = clamp(1.25 - d / 26, 0.08, 1.25) * light * stance * mv * (d < 3 ? 3 : 1); }
      else { const a = t.ref; const light = Math.pow(roomAt(a.pos.x, a.pos.z).light, 1.5); f = clamp(1.25 - d / 26, 0.1, 1.25) * light * ((a.anim && a.anim._cr > 0.5) ? 0.5 : 1) * ((a.anim && a.anim.speed > 0.5) ? 1 : 0.55) * (d < 3 ? 3 : 1); }
      if (f > bestF) { bestF = f; bestT = t; }
    }
    if (this.state === 'combat') { if (bestT && (!this.target || bestT.ref === this.target.ref || !this.targetVisible)) { this.target = bestT; } this.targetVisible = !!bestT && bestT.ref === this.target.ref; if (this.targetVisible) { this.lastSeen = this.target.feet.clone(); this.lostT = 0; } return; }
    if (bestT) { const rate = { idle: 1, patrol: 1, suspicious: 1.6, search: 3, grab: 3 }[this.state] || 1; this.meter += bestF * D().detect * 2.1 * rate * step; this.meterTarget = bestT;
      if (this.meter > 0.35 && (this.state === 'idle' || this.state === 'patrol')) { this.investigate(bestT.feet, false); }
      if (this.meter >= 1) this.engage(bestT); }
    else this.meter = Math.max(0, this.meter - step * 0.25);
  }
  update(dt) {
    if (!this.alive) return; this.voiceCd -= dt; this.flinch = Math.max(0, (this.flinch || 0) - dt); this.suppressT = Math.max(0, this.suppressT - dt); this.anim.recoil = Math.max(0, (this.anim.recoil || 0) - dt * 8);
    this.surprised = Math.max(0, this.surprised - dt);
    const st = this.state;
    if (st !== 'surrender' && st !== 'arrested' && st !== 'stunned') { this.hear(); if (st !== 'shield') this.perceive(dt); }
    let speed = 0;
    switch (this.state) {
      case 'idle': { this.anim.aim = this.alerted ? 0.6 : 0; this.lookT += dt; this.yaw += angDiff(this.yaw, this.lookBase + Math.sin(this.lookT * 0.4) * 0.8) * Math.min(1, dt * 1.5);
        if (this.pos.distanceTo(this.post) > 0.6) { this.goTo(this.post); this.follow(dt, 1.4); } else this.anim.speed = damp(this.anim.speed, 0, 6, dt); break; }
      case 'patrol': { this.anim.aim = this.alerted ? 0.6 : 0; const p = this.patrol[this.patrolI];
        if (this.waitT > 0) { this.waitT -= dt; this.anim.speed = damp(this.anim.speed, 0, 6, dt); this.yaw += Math.sin(G.time * 0.7 + this.anim.seed) * dt * 0.6; break; }
        this.goTo(p); if (this.follow(dt, this.alerted ? 1.8 : 1.3) || this.pos.distanceTo(p) < 0.5) { this.patrolI = (this.patrolI + 1) % this.patrol.length; this.waitT = rr(1.5, 4); this.path = null; } break; }
      case 'suspicious': case 'search': {
        this.anim.aim = this.state === 'search' ? 1 : 0.5; this.invT -= dt;
        if (this.waitT > 0) { this.waitT -= dt; this.faceTo(this.invPos, dt, 4); this.anim.speed = damp(this.anim.speed, 0, 6, dt); break; }
        const arrived = this.pos.distanceTo(this.invPos) < 1.2; if (!arrived) { this.goTo(this.invPos); if (this.follow(dt, this.state === 'search' ? 2.6 : 1.4)) { if (!this.path) this.invPos = this.pos.clone(); } }
        else { this.anim.speed = damp(this.anim.speed, 0, 6, dt); this.yaw += dt * 1.2 * Math.sin(G.time * 0.8 + this.anim.seed); }
        if (this.assault && arrived) { this.invPos = this.assault.clone().add(V3(rr(-3, 3), 0, rr(-3, 3))); this.invT = 999; }
        if (this.invT <= 0) { this.state = this.patrol ? 'patrol' : 'idle'; this.path = null; this.meter *= 0.3; this.say('Must be nothing.', { cd: 8 }); }
        break; }
      case 'combat': this.combat(dt); break;
      case 'stunned': { this.stunT -= dt; this.anim.mode = 'stun'; this.anim.speed = damp(this.anim.speed, 0, 6, dt); this.yaw += Math.sin(G.time * 3) * dt; if (this.stunT <= 0) { this.anim.mode = 'normal'; this.state = 'combat'; this.target = this.targets()[0] || null; this.lastSeen = P.pos.clone(); this.reactT = 0.6; } break; }
      case 'surrender': case 'arrested': this.anim.speed = 0; this.anim.aim = 0; break;
      case 'grab': this.grab(dt); break;
      case 'shield': this.shield(dt); break;
    }
    // leader grabs a hostage when the fight starts
    if (this.leader && (this.state === 'combat' || this.state === 'search') && !this.grabbedOnce) { const h = nearestRestrained(this.pos, 7); if (h) { this.state = 'grab'; this.grabH = h; this.grabbedOnce = true; this.say('Nobody moves!', { force: true }); } }
    this.anim.crouch = this.wantCrouch ? 1 : 0;
    this.physicsStep(dt); animate(this.m, this.anim, dt);
  }
  combat(dt) {
    const t = this.target; if (!t || (t.kind === 'player' && !P.alive) || (t.kind === 'team' && (!t.ref.alive || t.ref.state === 'downed'))) { const nt = this.targets()[0]; if (!nt) { this.state = 'search'; this.invPos = this.pos.clone(); this.invT = 10; return; } this.target = nt; }
    const tgt = this.target; const tp = tgt.pos(); const d = this.pos.distanceTo(tgt.feet); if (!this.lastSeen) this.lastSeen = tgt.feet.clone();
    if (!this.targetVisible) this.lostT += dt; this.seenT += dt;
    this.anim.aim = 1; this.faceTo(this.targetVisible ? tgt.feet : this.lastSeen, dt, 7); const e = this.eye; this.anim.pitch = Math.atan2(tp.y - e.y, Math.max(0.5, d));
    // reload
    if (this.reloadT > 0) { this.reloadT -= dt; this.wantCrouch = this.nearCover(tgt); if (this.reloadT <= 0) this.mag = this.pistol ? 15 : 30; }
    // movement
    let moving = false;
    if (this.targetVisible) {
      if (d > 18) { this.goTo(tgt.feet); this.follow(dt, 2.2); moving = true; }
      else if (d < 3.5) { const away = V3(this.pos.x - tgt.feet.x, 0, this.pos.z - tgt.feet.z).normalize(); const np = this.pos.clone().addScaledVector(away, 2); if (walkable(np.x, np.z)) { this.pos.addScaledVector(away, 1.6 * dt); moving = true; } }
      else { this.strafeT -= dt; if (this.strafeT <= 0) { this.strafeT = rr(1.5, 3.5); const side = V3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).multiplyScalar(R() < 0.5 ? 1 : -1); this.strafeDir.copy(R() < 0.45 ? side : V3()); }
        if (this.strafeDir.lengthSq() > 0) { const np = this.pos.clone().addScaledVector(this.strafeDir, 0.5); if (walkable(np.x, np.z)) { this.pos.addScaledVector(this.strafeDir, 1.4 * dt); moving = true; } else this.strafeDir.set(0, 0, 0); } }
      this.anim.speed = damp(this.anim.speed, moving ? 1.6 : 0, 6, dt);
      // cover peeking
      const cover = this.nearCover(tgt); this.peekT -= dt; if (cover) { if (this.peekT <= 0) { this.peekT = rr(1.0, 2.2); this.peekUp = !this.peekUp; } this.wantCrouch = !this.peekUp || this.reloadT > 0; } else this.wantCrouch = false;
    } else if (this.lostT > 1.2) {
      this.wantCrouch = false; this.goTo(this.lastSeen); const done = this.follow(dt, 2.6);
      if (done && this.lostT > 4) { this.state = 'search'; this.invPos = this.lastSeen.clone(); this.invT = 12; this.waitT = 0.5; this.say('Where did they go?', { cd: 6 }); }
    }
    // fire
    this.reactT -= dt; this.burstCd -= dt;
    if (this.targetVisible && this.reactT <= 0 && this.reloadT <= 0 && !this.wantCrouch && this.burstCd <= 0 && this.flinch <= 0) {
      if (this.mag <= 0) { this.reloadT = 2.6; this.say('Reloading!', { cd: 6 }); return; }
      if (this.burst <= 0) this.burst = this.pistol ? 2 : Math.floor(rr(3, 6));
      this.burst--; this.mag--; this.burstCd = this.burst > 0 ? (this.pistol ? 0.35 : 0.11) : rr(0.5, 1.3);
      const aimRamp = clamp(this.seenT / 1.6, 0.35, 1); let ch = D().acc * clamp(1.5 - d / 18, 0.3, 1.3) * aimRamp * (this.suppressT > 0 ? 0.5 : 1);
      if (tgt.kind === 'player') { if (P.moving) ch *= P.sprinting ? 0.55 : 0.75; if (P.crouchT > 0.5) ch *= 0.8; } else ch *= 0.8;
      this.shootAt(tp, ch, () => { const dmg = rr(...D().dmg) * (this.leader ? 1.2 : 1); if (tgt.kind === 'player') damagePlayer(dmg, this.eye); else tgt.ref.damage(dmg, 'torso', tgt.ref.pos.clone().sub(this.pos).normalize(), tgt.ref.chestPos, this); }, this.pistol ? 'pistol' : 'ak');
    }
  }
  nearCover(t) { const e = V3(this.pos.x, 0.8, this.pos.z), d = V3(t.feet.x - this.pos.x, 0, t.feet.z - this.pos.z).normalize(); const h = rayWorld(e, d, 1.6); return !!(h && h.c.low && h.c.max.y > 0.7 && !h.c.glass); }
  grab(dt) {
    const h = this.grabH; if (!h || !h.alive || h.state !== 'restrained') { this.state = 'combat'; return; }
    this.anim.aim = 0.5; this.goTo(h.pos); this.follow(dt, 3.2);
    if (this.pos.distanceTo(h.pos) < 0.9) { this.state = 'shield'; this.shieldHostage = h; h.state = 'shield'; h.noCollide = true; this.noCollide = true; this.shieldT = 0; this.stop(); h.say('Help me! Please!', { force: true }); G.hooks.shield && G.hooks.shield(this, h); }
  }
  shield(dt) {
    const h = this.shieldHostage; if (!h || !h.alive) { this.shieldHostage = null; this.noCollide = false; this.state = 'combat'; this.anim.mode = 'normal'; return; }
    this.shieldT += dt; this.anim.mode = 'shield'; this.anim.aim = 1; this.wantCrouch = false;
    const tgt = P.alive ? V3(P.pos.x, 0, P.pos.z) : this.pos.clone(); this.faceTo(tgt, dt, 4);
    // back away toward the vault
    const retreat = LV.shieldRetreat || this.post; if (this.pos.distanceTo(retreat) > 0.6 && this.pos.distanceTo(tgt) < 9) { this.goTo(retreat); this.follow(dt, 0.9); this.yaw = Math.atan2(tgt.x - this.pos.x, tgt.z - this.pos.z); } else this.anim.speed = damp(this.anim.speed, 0, 6, dt);
    const f = this.forward(), side = V3(f.z, 0, -f.x); h.pos.copy(this.pos).addScaledVector(f, 0.42).addScaledVector(side, 0.12); h.yaw = this.yaw; h.root.position.copy(h.pos); h.root.rotation.y = h.yaw;
    const e = this.eye; this.anim.pitch = P.alive ? Math.atan2(P.pos.y + 1.4 - e.y, Math.max(0.5, this.pos.distanceTo(P.pos))) : 0;
    this.burstCd -= dt; const vis = P.alive && this.canSeePoint(V3(P.pos.x, P.pos.y + P.height, P.pos.z), 0.3, 30);
    if (vis && this.burstCd <= 0 && this.shieldT > 2.5) { this.burstCd = rr(1.4, 2.6); this.shootAt(V3(P.pos.x, P.pos.y + P.height - 0.2, P.pos.z), D().acc * 0.6, () => damagePlayer(rr(...D().dmg), this.eye), 'pistol'); }
    if (this.shieldT > 8 && Math.floor(this.shieldT) % 9 === 0 && this.voiceCd <= 0) this.say(['Back off or she dies!', 'I will do it! I swear!', 'Drop your weapons!'][Math.floor(R() * 3)], { cd: 4 });
    if (this.shieldT > { recruit: 60, veteran: 40, elite: 28 }[G.diff]) { // executes the hostage
      this.say('You did this!', { force: true }); this.shootAt(h.chestPos, 1, () => h.die(f.clone(), h.chestPos, 'head', this, 25), 'pistol'); this.shieldHostage = null; this.noCollide = false; this.state = 'combat'; this.anim.mode = 'normal'; G.hooks.executed && G.hooks.executed(h);
    }
  }
  executeHostage(h) {
    if (!this.isHostile() || !h.alive) return false; this.faceTo(h.pos, 1, 50); this.say('This is your fault!', { force: true });
    this.shootAt(h.chestPos, 1, () => h.die(h.pos.clone().sub(this.pos).normalize(), h.chestPos, 'torso', this, 20)); G.hooks.executed && G.hooks.executed(h); return true;
  }
}
function nearestRestrained(p, maxD) { let b = null, bd = maxD; for (const h of G.hostages) { if (!h.alive || h.state !== 'restrained') continue; const d = h.pos.distanceTo(p); if (d < bd) { bd = d; b = h; } } return b; }

/* =================== HOSTAGE =================== */
export class Hostage extends Agent {
  constructor(o, look) { super('hostage', makeHostage(look), { ...o, name: look.long ? 'Hostage (f)' : 'Hostage' }); this.hp = 45; this.state = 'restrained'; this.anim.mode = 'restrained'; this.anim.tremble = true; this.waitT = 0; this.female = !!look.long; }
  free(auto = false) {
    if (!this.alive || (this.state !== 'restrained' && this.state !== 'shield')) return; this.state = 'freed'; this.anim.mode = 'normal'; this.anim.tremble = false; this.m.tieMat && (this.m.tieMat.visible = false);
    this.say(['Thank you! Thank you!', 'Oh God, thank you!', 'Please get me out of here!'][Math.floor(R() * 3)], { force: true, pitch: this.female ? 1.45 : 1.05 }); this.pickExit(); G.hooks.hostageFreed && G.hooks.hostageFreed(this, auto);
  }
  pickExit() {
    let best = null, bl = Infinity; for (const ex of LV.exits) { const p = findPath(this.pos, ex, { locked: false }); if (!p) continue; let L = 0; for (let i = 1; i < p.length; i++) L += p[i].distanceTo(p[i - 1]); if (L < bl) { bl = L; best = { p, ex }; } }
    if (best) { this.path = best.p; this.pathI = 1; this.exit = best.ex; this.dest = best.ex.clone(); this.waiting = false; } else { this.path = null; this.waiting = true; this.waitT = 2; }
  }
  onHurt(amount, part, dir, shooter) { if (shooter === 'player') G.hooks.civilianHit && G.hooks.civilianHit(this); if (this.alive && this.state !== 'shield') this.say('Aaah! Stop shooting!', { force: true, pitch: this.female ? 1.5 : 1.1 }); }
  update(dt) {
    if (!this.alive) return; this.voiceCd -= dt;
    if (this.state === 'restrained') { this.anim.mode = 'restrained'; this.anim.headDown = this.scared > 0 ? 0.45 : 0.25; this.scared = Math.max(0, (this.scared || 0) - dt); this.anim.look = Math.sin(G.time * 0.5 + this.anim.seed) * 0.25; }
    else if (this.state === 'shield') { this.anim.mode = 'tied'; this.anim.tremble = true; this.anim.speed = 0; animate(this.m, this.anim, dt); return; }
    else if (this.state === 'freed') {
      this.anim.headDown = 0.1; this.cowerT = Math.max(0, (this.cowerT || 0) - dt);
      if (this.cowerT > 0) { this.anim.mode = 'cover'; this.anim.crouch = 1; this.anim.speed = damp(this.anim.speed, 0, 8, dt); }
      else if (this.waiting) { this.anim.mode = 'cover'; this.anim.crouch = 1; this.waitT -= dt; if (this.waitT <= 0) { this.pickExit(); if (this.waiting) { this.waitT = 2.5; G.hooks.hostageBlocked && G.hooks.hostageBlocked(this); } } }
      else { this.anim.mode = 'normal'; this.anim.crouch = 0.25; if (this.follow(dt, 3.5)) { if (this.exit && this.pos.distanceTo(this.exit) < 1.4) { this.state = 'rescued'; this.remove(); G.hooks.hostageRescued && G.hooks.hostageRescued(this); return; } this.pickExit(); } }
      if (LV.rescued && LV.rescued(this.pos)) { this.state = 'rescued'; this.remove(); G.hooks.hostageRescued && G.hooks.hostageRescued(this); return; }
    }
    this.physicsStep(dt); animate(this.m, this.anim, dt);
  }
}

/* =================== TEAMMATE =================== */
export class Teammate extends Agent {
  constructor(o) {
    const model = makeOperator(o.look); super('team', model, { ...o, name: o.name }); this.hp = this.maxHp = 160; this.state = 'follow'; this.slot = o.slot; this.order = 'follow';
    this.fireCd = 0; this.target = null; this.mag = 30; this.reloadT = 0; this.scanT = 0; this.task = null; this.reviveHp = 80; this.lastCallout = 0;
  }
  onHurt(amount, part, dir, shooter) { if (shooter === 'player') { this.hp += amount * 0.7; this.say('Check your fire, Shadow!', { cd: 4, force: true }); } else if (this.hp > 0 && this.hp < 60) this.say("I'm hit!", { cd: 8 }); }
  die(dir, point, part, shooter) { if (this.state === 'downed') return; this.hp = 0; this.state = 'downed'; this.anim.mode = 'down'; this.anim.aim = 0; this.stop(); this.say(`${this.name} down! I need help!`, { force: true }); G.hooks.teamDown && G.hooks.teamDown(this); }
  revive() { if (this.state !== 'downed') return; this.state = this.order; this.hp = this.reviveHp; this.anim.mode = 'normal'; this.say("Thanks, I'm good.", { force: true }); G.stats.revives++; }
  slotPos() { const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw); const [sx, sb] = this.slot; let p = V3(P.pos.x + rx * sx - fx * sb, 0, P.pos.z + rz * sx - fz * sb); if (walkable(p.x, p.z)) return p;
    for (const [ox, ob] of [[0, sb], [0, sb + 0.8], [sx * 0.5, sb + 1.2], [0, sb + 1.6], [-sx, sb], [0, 2.6], [sx, -1], [0, 3.4]]) { const q = V3(P.pos.x + rx * ox - fx * ob, 0, P.pos.z + rz * ox - fz * ob); if (walkable(q.x, q.z) && los(V3(P.pos.x, 1, P.pos.z), V3(q.x, 1, q.z))) return q; } return this.pos.clone(); }
  pickTarget() {
    let best = null, bd = 40;
    for (const e of G.enemies) {
      if (!e.isHostile() || e.state === 'stunned' || e.state === 'shield' || e.state === 'grab') continue;
      const allowed = e.state === 'combat' || G.weaponsFree || (G.playerTarget === e && G.time - G.playerTargetT < 6) || e.alerted && e.state === 'search';
      if (!allowed) continue; const d = e.pos.distanceTo(this.pos); if (d > bd) continue; const hp = V3(e.pos.x, e.pos.y + 1.5, e.pos.z);
      if (los(this.eye, hp)) { best = e; bd = d; }
    }
    return best;
  }
  update(dt) {
    if (!this.alive) return; this.voiceCd -= dt; this.fireCd -= dt; this.anim.recoil = Math.max(0, (this.anim.recoil || 0) - dt * 8);
    if (this.state === 'downed') { this.anim.mode = 'down'; this.anim.speed = 0; this.physicsStep(dt); animate(this.m, this.anim, dt); return; }
    if (this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + dt * 2);
    this.abilityCd = Math.max(0, (this.abilityCd || 0) - dt);
    if (this.role === 'nila' && this.abilityCd <= 0 && P.alive && P.hp < 55 && this.pos.distanceTo(P.pos) < 7) { P.hp = Math.min(100, P.hp + 40); this.abilityCd = 35; this.say('Hold still, patching you up.', { force: true }); G.hooks.toast && G.hooks.toast('Nila: +40 health'); A.pickup(); }
    if (this.role === 'nila' && this.abilityCd <= 0) { const d = G.team.find(t => t !== this && t.state === 'downed' && t.pos.distanceTo(this.pos) < 12); if (d) { d.revive(); this.abilityCd = 30; this.say(`Got you, ${d.name}.`, { force: true }); } }
    if (this.role === 'ghost') { this._gT = (this._gT || 0) - dt; if (this._gT <= 0) { this._gT = 1; for (const e of G.enemies) if (e.alive && e.pos.distanceTo(this.pos) < 14) e.spottedT = G.time; } }
    // scan
    this.scanT -= dt; if (this.scanT <= 0) { this.scanT = 0.25; const nt = this.pickTarget(); if (nt !== this.target) { this.target = nt; if (nt && G.time - this.lastCallout > 6) { this.lastCallout = G.time; this.say(['Contact!', 'Tango spotted!', 'Engaging!'][Math.floor(R() * 3)], { cd: 5 }); } } }
    let speed = 0;
    if (this.task && this.task.kind === 'breach') { this.doBreach(dt); }
    else {
      if (this.order === 'follow') { const sp = this.slotPos(); const d = this.pos.distanceTo(sp); if (d > 1.4) { this.goTo(sp, { locked: false }); speed = d > 6 ? 4.6 : d > 3 ? 3.4 : 2.2; if (this.target) speed *= 0.6; this.follow(dt, speed); } else this.anim.speed = damp(this.anim.speed, 0, 6, dt); }
      else if (this.order === 'hold') { if (this.holdPos && this.pos.distanceTo(this.holdPos) > 0.6) { this.goTo(this.holdPos, { locked: false }); this.follow(dt, 2.6); } else this.anim.speed = damp(this.anim.speed, 0, 6, dt); }
    }
    // combat
    if (this.target && this.target.isHostile()) {
      const t = this.target; const tp = V3(t.pos.x, t.pos.y + 1.3, t.pos.z); this.faceTo(t.pos, dt, 8); this.anim.aim = 1; const e = this.eye; this.anim.pitch = Math.atan2(tp.y - e.y, Math.max(0.5, this.pos.distanceTo(t.pos)));
      if (this.reloadT > 0) { this.reloadT -= dt; if (this.reloadT <= 0) this.mag = 30; }
      else if (this.fireCd <= 0 && Math.abs(angDiff(this.yaw, Math.atan2(t.pos.x - this.pos.x, t.pos.z - this.pos.z))) < 0.3) {
        if (this.mag <= 0) { this.reloadT = 2.2; this.say('Reloading, cover me!', { cd: 6 }); }
        else { this.mag--; this.fireCd = rr(0.22, 0.4); const d = this.pos.distanceTo(t.pos); const ch = 0.42 * clamp(1.4 - d / 22, 0.35, 1.2) * (t.wantCrouch ? 0.5 : 1);
          this.shootAt(tp, ch, () => { const head = R() < 0.15; t.damage(head ? 140 : rr(26, 34), head ? 'head' : 'torso', t.pos.clone().sub(this.pos).normalize(), tp, this); }, 'team'); }
      }
    } else { this.anim.aim = damp(this.anim.aim, this.order === 'hold' ? 0.7 : 0.25, 3, dt); if (this.anim.speed < 0.2 && this.order === 'follow') this.faceTo(V3(P.pos.x - Math.sin(P.yaw) * 5, 0, P.pos.z - Math.cos(P.yaw) * 5), dt, 2); }
    this.anim.crouch = (P.crouchT > 0.5 && this.order === 'follow') || (this.order === 'hold' && !this.target) ? 1 : 0;
    this.physicsStep(dt); animate(this.m, this.anim, dt);
  }
  orderBreach(door) {
    if (this.state === 'downed') return false; const side = door.side(this.pos) || door.side(P.pos); const n = door.axis === 'x' ? V3(0, 0, side) : V3(side, 0, 0);
    const spot = door.center.clone().setY(0).addScaledVector(n, 0.9); const back = door.center.clone().setY(0).addScaledVector(n, 3.2);
    this.task = { kind: 'breach', door, spot, back, phase: 'go', t: 0 }; this.say('Moving to breach.', { force: true }); return true;
  }
  doBreach(dt) {
    const k = this.task; this.anim.aim = 0.3;
    if (k.door.broken) { this.task = null; return; }
    if (k.phase === 'go') { this.goTo(k.spot, { locked: false }); if (this.follow(dt, 3.6) || this.pos.distanceTo(k.spot) < 0.5) { k.phase = 'place'; k.t = 2.4; this.say('Placing charge.', { force: true }); } }
    else if (k.phase === 'place') { this.faceTo(k.door.center, dt, 6); this.anim.crouch = 1; k.t -= dt; this.anim.speed = 0; if (k.t <= 0) { k.phase = 'back'; this.charge = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.06), new THREE.MeshStandardMaterial({ color: '#3a3a2a', emissive: '#ff2010', emissiveIntensity: 0.4 })); this.charge.position.copy(k.door.center).addScaledVector(this.pos.clone().sub(k.door.center).setY(0).normalize(), 0.08); this.charge.position.y = 1.1; this.charge.lookAt(this.pos.x, 1.1, this.pos.z); G.scene.add(this.charge); } }
    else if (k.phase === 'back') { this.goTo(k.back, { locked: false }); if (this.follow(dt, 3.4) || this.pos.distanceTo(k.back) < 0.6) { k.phase = 'fire'; k.t = 1.0; this.say('Breaching! Breaching!', { force: true }); } }
    else if (k.phase === 'fire') { k.t -= dt; this.anim.speed = 0; if (k.t <= 0) { if (this.charge) { G.scene.remove(this.charge); this.charge = null; } G.hooks.breachBlast && G.hooks.breachBlast(k.door, this.pos.clone()); this.task = null; } }
  }
}

/* =================== ragdoll =================== */
const _wp = V3(), _wq = new THREE.Quaternion(), _ws = V3();
function dropToProp(w) {
  const g = w.group; g.updateMatrixWorld(true); g.getWorldPosition(_wp); g.getWorldQuaternion(_wq);
  g.parent.remove(g); G.scene.add(g); g.position.copy(_wp); g.quaternion.copy(_wq); g.scale.set(1, 1, 1);
  const s = w.size; const b = new CANNON.Body({ mass: 3, shape: new CANNON.Box(new CANNON.Vec3(s[0] / 2, s[1] / 2, s[2] / 2)), angularDamping: 0.3 });
  const center = V3(0, 0, s[2] * 0.25).applyQuaternion(_wq).add(_wp); b.position.set(center.x, center.y, center.z); b.quaternion.set(_wq.x, _wq.y, _wq.z, _wq.w); b.velocity.set(rr(-0.5, 0.5), 0.5, rr(-0.5, 0.5)); G.world.addBody(b);
  const off = V3(0, 0, s[2] * 0.25);
  const prop = { mesh: g, body: b, mat: 'metal', kind: 'gun', off }; g.traverse(o => o.userData.prop = prop); ragdolls.push({ parts: [{ holder: g, body: b, off }], t: 0 });
}
function makeRagdoll(ag, dir, point, part, force) {
  const segs = ag.m.rig.segs; ag.root.updateMatrixWorld(true); const bodies = {}; const parts = [];
  const sc = ag.root.scale.x;
  if (ag.m.weapon && ag.m.weapon.group.parent === ag.m.rig.chest) dropToProp(ag.m.weapon);
  for (const [name, s] of Object.entries(segs)) {
    const g = s.g; g.getWorldPosition(_wp); g.getWorldQuaternion(_wq);
    const holder = new THREE.Group(); holder.position.copy(_wp); holder.quaternion.copy(_wq); holder.scale.setScalar(sc); G.scene.add(holder);
    for (const c of g.children.slice()) if (c.isMesh && !c.userData.hitbox) { holder.add(c); }
    const off = V3(s.c[0], s.c[1], s.c[2]).multiplyScalar(sc);
    const shape = s.sphere ? new CANNON.Sphere(s.sphere * sc) : new CANNON.Box(new CANNON.Vec3(s.s[0] / 2 * sc * 0.9, s.s[1] / 2 * sc * 0.9, s.s[2] / 2 * sc * 0.9));
    const b = new CANNON.Body({ mass: s.m, shape, angularDamping: 0.45, linearDamping: 0.06, collisionFilterGroup: 2, collisionFilterMask: 1 });
    const center = off.clone().applyQuaternion(_wq).add(_wp); b.position.set(center.x, center.y, center.z); b.quaternion.set(_wq.x, _wq.y, _wq.z, _wq.w);
    b.velocity.set(ag.vel ? ag.vel.x : 0, 0, ag.vel ? ag.vel.z : 0); G.world.addBody(b);
    bodies[name] = b; parts.push({ holder, body: b, off });
  }
  const J = (a, b, g, angle, twist) => { g.getWorldPosition(_wp); const piv = new CANNON.Vec3(_wp.x, _wp.y, _wp.z); const pa = bodies[a].pointToLocalFrame(piv), pb = bodies[b].pointToLocalFrame(piv);
    G.world.addConstraint(new CANNON.ConeTwistConstraint(bodies[a], bodies[b], { pivotA: pa, pivotB: pb, axisA: new CANNON.Vec3(0, 1, 0), axisB: new CANNON.Vec3(0, 1, 0), angle, twistAngle: twist, maxForce: 1e6 })); };
  const r = ag.m.rig;
  J('torso', 'head', r.head, 0.7, 0.5); J('pelvis', 'torso', r.spine, 0.5, 0.35);
  for (const k of ['L', 'R']) { J('torso', 'ua' + k, r.arms[k].upper, 1.5, 0.6); J('ua' + k, 'fa' + k, r.arms[k].elbow, 1.2, 0.3); J('pelvis', 'th' + k, r.legs[k].thigh, 0.9, 0.3); J('th' + k, 'sh' + k, r.legs[k].knee, 1.0, 0.15); }
  const hb = bodies[part] || bodies.torso; const f = clamp(force, 10, 160) * 0.9;
  const imp = new CANNON.Vec3(dir.x * f, Math.max(0.15, dir.y) * f * 0.3, dir.z * f);
  if (point) hb.applyImpulse(imp, new CANNON.Vec3(point.x - hb.position.x, point.y - hb.position.y, point.z - hb.position.z)); else hb.applyImpulse(imp);
  ag.root.visible = false; ragdolls.push({ parts, t: 0 });
}
export function updateRagdolls(dt) {
  for (const r of ragdolls) { r.t += dt; for (const p of r.parts) { if (p.body.sleepState === CANNON.Body.SLEEPING && r.t > 1) continue; _wq.set(p.body.quaternion.x, p.body.quaternion.y, p.body.quaternion.z, p.body.quaternion.w); p.holder.quaternion.copy(_wq); p.holder.position.set(p.body.position.x, p.body.position.y, p.body.position.z).sub(_ws.copy(p.off).applyQuaternion(_wq)); } }
}
export function clearAgents() {
  for (const a of G.agents) { G.scene.remove(a.root); G.world.removeBody(a.kb); }
  for (const r of ragdolls) for (const p of r.parts) { G.scene.remove(p.holder); G.world.removeBody(p.body); }
  for (const c of G.world.constraints.slice()) G.world.removeConstraint(c);
  ragdolls.length = 0; G.agents.length = 0; G.enemies.length = 0; G.hostages.length = 0; G.team.length = 0; G.hitboxes.length = 0;
  for (let i = G.props.length - 1; i >= 0; i--) if (G.props[i].kind === 'gun') { G.scene.remove(G.props[i].mesh); G.world.removeBody(G.props[i].body); G.props.splice(i, 1); }
}

/* =================== area effects =================== */
export function stunArea(p, radius, dur, needLos = true) {
  let n = 0;
  const pp = p.clone(); pp.y = Math.max(pp.y, 0.45);
  for (const e of G.enemies) { if (!e.isHostile()) continue; const d = e.pos.distanceTo(p); if (d > radius) continue; if (needLos && !los(pp, e.eye) && !los(pp, e.chestPos) && d > 2) continue; e.stun(dur * (1 - d / radius * 0.4)); n++; }
  for (const h of G.hostages) { if (!h.alive) continue; if (h.pos.distanceTo(p) < radius) { if (h.state === 'freed') h.cowerT = 2.5; else h.scared = 4; } }
  return n;
}
export const SQUAD_LOOKS = {
  rafi: { name: 'Rafi', look: { head: 'cap', vest: '#2a2c2e', skin: '#a5714d', camo: 'night', scale: 1.02, weapon: 'tg24' } },
  bolt: { name: 'Bolt', look: { head: 'helmet', vest: '#4a4a34', skin: '#d6a47e', scale: 1.06, weapon: 'b12' } },
  nila: { name: 'Nila', look: { head: 'helmet', helmet: '#3c4045', vest: '#3a3e42', skin: '#b9835c', camo: 'urban', weapon: 'k9', medic: true, scale: 0.95 } },
  ghost: { name: 'Ghost', look: { head: 'helmet', helmet: '#1c1e20', vest: '#1f2123', skin: '#e0b48e', camo: 'night', weapon: 'k9', nvgDown: true, maskColor: '#141516' } },
  hawk: { name: 'Hawk', look: null },
};
export function spawnAll(entry, squad = ['rafi', 'bolt', 'hawk']) {
  let v = 0; const sp = LV.spawns[entry];
  for (const e of LV.enemies || []) { const en = new Enemy({ ...e, v: v++ }); G.enemies.push(en); if (sp.surprise && sp.surprise.includes(e.room)) en.surprised = 1.2; if (sp.alertIds && sp.alertIds.includes(e.id)) en.alerted = true; }
  (LV.hostages || []).forEach((h, i) => { const hs = new Hostage({ ...h }, h.look || HOSTAGE_LOOKS[i % HOSTAGE_LOOKS.length]); if (h.vip) { hs.vip = true; hs.name = h.name || 'VIP'; } if (h.pilot) { hs.pilot = true; hs.targetable = true; hs.state = 'pinned'; hs.anim.mode = 'down'; hs.hp = h.hp || 240; hs.name = h.name || 'Pilot'; } G.hostages.push(hs); });
  const s = sp; const fx = -Math.sin(s.yaw), fz = -Math.cos(s.yaw), rx = Math.cos(s.yaw), rz = -Math.sin(s.yaw);
  const slots = [[-0.9, 1.3], [0.95, 1.6], [0, 2.4]]; let si = 0;
  for (const id of squad) { const d = SQUAD_LOOKS[id]; if (!d || !d.look) continue; const slot = slots[si++ % slots.length];
    const p = V3(s.pos.x + rx * slot[0] - fx * slot[1], 0, s.pos.z + rz * slot[0] - fz * slot[1]);
    let q = p; if (!walkable(q.x, q.z)) { q = null; for (let k = 1; k < 9 && !q; k++) for (const [ox, oz] of [[0, k * 0.5], [k * 0.4, k * 0.4], [-k * 0.4, k * 0.4], [k * 0.5, 0], [-k * 0.5, 0]]) { const c = V3(s.pos.x + rx * ox - fx * oz, 0, s.pos.z + rz * ox - fz * oz); if (walkable(c.x, c.z)) { q = c; break; } } } if (!q) q = s.pos.clone().setY(0);
    const t = new Teammate({ pos: q, yaw: Math.atan2(fx, fz), name: d.name, look: d.look, slot }); t.role = id; G.team.push(t); }
}
export function spawnWaveEnemy(pos, target, o = {}) {
  const en = new Enemy({ id: 'W' + G.enemies.length, pos, yaw: Math.atan2(target.x - pos.x, target.z - pos.z), room: 'wave', v: G.enemies.length, ...o });
  en.assault = target.clone(); en.alerted = true; en.state = 'search'; en.invPos = target.clone(); en.invT = 999; en.waitT = 0; G.enemies.push(en); return en;
}
