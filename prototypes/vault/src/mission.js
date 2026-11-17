// Tiger 24 · Operation Vault — mission flow: objectives, alarm, CCTV, executions, bomb, squad commands, scoring
import { THREE, G, PI, clamp, R, rr, A, FX, VO, emitNoise, store, V3 } from './core.js';
import { LV, lights, los, rayWorld, doors, doorNear, resetLevel, interactables, roomAt, shatterGlass } from './level.js';
import { P, resetPlayer, damagePlayer, clearNades } from './player.js';
import { spawnAll, clearAgents, stunArea, D } from './ai.js';
import { FX as _fx } from './core.js';

const COLORS = [{ k: 'red', n: 'Red', c: '#e03a2a' }, { k: 'blue', n: 'Blue', c: '#2e6cff' }, { k: 'green', n: 'Green', c: '#2fbf5a' }, { k: 'yellow', n: 'Yellow', c: '#f0c020' }];
export const MS = { timer: 900, alarm: false, alarmT: 0, nextExec: 0, execWarned: false, hawkCd: 0, wires: [], cut: [], wrong: 0, defused: false, intel: false, cctvOff: false, revealT: 0, ended: false, endT: 0, result: null, toastCd: {} };

export function startMission(entry, diff) {
  G.entry = entry; G.diff = diff; VO.stop();
  clearAgents(); clearNades(); FX.clear(); resetLevel();
  G.weaponsFree = false; G.playerTarget = null; G.defusing = false;
  const tlim = { recruit: 1080, veteran: 900, elite: 720 }[diff];
  Object.assign(MS, { timer: tlim, tlim, alarm: false, alarmT: 0, nextExec: { recruit: 70, veteran: 45, elite: 30 }[diff], execInterval: { recruit: 50, veteran: 35, elite: 25 }[diff], execWarned: false,
    hawkCd: 0, cut: [], wrong: 0, defused: false, intel: false, cctvOff: false, revealT: 0, ended: false, endT: 0, result: null, toastCd: {}, camExpo: [0, 0, 0], combatT: 0, hawkPending: null });
  MS.wires = shuffle(COLORS.slice());
  G.stats = { shots: 0, hits: 0, headshots: 0, kills: 0, teamKills: 0, arrests: 0, rescued: 0, hostagesDead: 0, civHit: 0, civKilled: 0, unauthorized: 0, damageTaken: 0, flashes: 0, revives: 0, leaderArrested: false, start: G.time };
  for (const c of lights.cams) { c.alive = true; c.off = false; c.cone.visible = true; c.head.rotation.z = 0; c.led.visible = true; }
  A.alarm(false);
  spawnAll(entry); resetPlayer(entry, diff);
  G.time0 = G.time;
  intro(entry);
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function intro(entry) {
  const lines = {
    front: [['RAFI', 'Tiger 24, this is Rafi. We go through the front doors. Hostages are in the lobby. Weapons tight, check your targets.', 'Rafi: Front door diye dhukbo. Lobby te hostage. Target confirm kore goli korbe.']],
    back: [['RAFI', 'Back door is unlocked. Corridor camera is live. Shoot it or reach the security room. Stay quiet.', 'Rafi: Pichoner door khola. Corridor er camera cholche: guli kore bhango ba security room e giye bondho koro. Chupchap.']],
    roof: [['RAFI', 'Rappelling through the skylight. They will not expect us. Go, go, go!', 'Rafi: Skylight diye namchi. Ora bujhteo parbe na. Go, go, go!']],
  }[entry];
  setTimeout(() => { if (G.state === 'playing') VO.say(lines[0][0], lines[0][1], { sub: lines[0][2], prio: true }); }, 900);
  setTimeout(() => { if (G.state === 'playing') VO.say('HAWK', 'Hawk in position. Overwatch on the front windows. Mark targets with Z.', { sub: 'Hawk: Position e achi. Front janala gulo amar nojore. Z chaple target mark koro.' }); }, 9000);
  if (entry === 'front') A.siren();
}
function toast(msg, key = null, cd = 0) { if (key) { const l = MS.toastCd[key] || -99; if (G.time - l < cd) return; MS.toastCd[key] = G.time; } G.hooks.toast && G.hooks.toast(msg); }
function radio(who, text, sub, o = {}) { VO.say(who, text, Object.assign({ sub }, o)); }

export function triggerAlarm(reason) {
  if (MS.alarm || MS.ended) return; MS.alarm = true; MS.alarmT = 0; A.alarm(true); G.stats.alarm = true;
  radio('RAFI', 'Alarm is up! They know we are here. Move fast, they will start killing hostages!', 'Rafi: Alarm baje gese! Ora jene gese. Taratari, ora hostage marte shuru korbe!', { prio: true });
  G.hooks.banner && G.hooks.banner('ALARM', reason || 'Enemy alert');
  for (const e of G.enemies) if (e.isHostile() && e.state !== 'combat' && e.state !== 'shield') { e.alerted = true; if (R() < 0.5) e.investigate(P.pos.clone(), true); }
}

/* ================= hooks ================= */
export function installHooks() {
  const H = G.hooks;
  H.agentDied = (ag, shooter, part) => {
    if (ag.kind === 'enemy') {
      if (shooter === 'player') G.stats.kills++; else if (shooter && shooter.kind === 'team') G.stats.teamKills++;
      const by = shooter === 'player' ? 'SHADOW' : shooter && shooter.kind === 'team' ? shooter.name.toUpperCase() : shooter === 'hawk' ? 'HAWK' : '—';
      H.killfeed && H.killfeed(by, ag.leader ? 'LEADER' : 'GUNMAN', part === 'head');
      if (shooter === 'player') { A.kill(); setTimeout(() => radio('RAFI', ['Tango down.', 'Good kill.', 'Hostile down.'][Math.floor(R() * 3)], null, { cool: 5, key: 'td' }), 500); }
      if (ag.leader) radio('RAFI', 'The leader is down.', 'Rafi: Leader shesh.');
      if (MS.alarm === false && shooter === 'player') { /* silent kill */ }
      const left = G.enemies.filter(e => e.isHostile()).length; if (left === 0) radio('RAFI', 'All hostiles neutralized. Get the hostages out and deal with the bomb.', 'Rafi: Shob enemy shesh. Hostage der ber koro ar bomb ta thamao.', { prio: true });
    } else if (ag.kind === 'hostage') {
      G.stats.hostagesDead++; if (shooter === 'player') G.stats.civKilled++;
      radio('RAFI', shooter === 'player' ? 'You killed a civilian! Watch your fire!' : 'We lost a hostage!', shooter === 'player' ? 'Rafi: Tumi ekjon civilian ke merecho! Shabdhane!' : 'Rafi: Ekjon hostage ke hariye fellam!', { prio: true });
      H.killfeed && H.killfeed(shooter === 'player' ? 'SHADOW' : 'HOSTILE', 'HOSTAGE', false, true);
      if (G.stats.hostagesDead >= 4) fail('Onek hostage mara gese', 'Too many civilian casualties. Command aborted the operation.');
    }
  };
  H.enemyAlert = e => { MS.combatT = Math.max(MS.combatT, 0.01); };
  H.enemySurrender = e => toast('Suspect surrender korse · kache giye F hold kore arrest koro');
  H.enemyArrested = e => { G.stats.arrests++; if (e.leader) { G.stats.leaderArrested = true; radio('RAFI', 'Leader in custody. Outstanding.', 'Rafi: Leader grephtar. Darun kaj!'); } else radio('SHADOW', 'Suspect secured.', null, { cool: 3, key: 'sec' }); toast(e.leader ? 'Leader arrested (+300)' : 'Suspect arrested (+120)'); };
  H.hostageFreed = (h, auto) => { if (!auto) toast('Hostage mukto · nijei exit er dike jacche'); if (R() < 0.4) radio('RAFI', 'Civilian moving to exit.', null, { cool: 12, key: 'cm' }); };
  H.hostageRescued = h => { G.stats.rescued++; toast(`Hostage rescued ${G.stats.rescued}/${G.hostages.length}`); A.pickup(); };
  H.hostageBlocked = h => toast('Hostage er exit er rasta bondho! Door kholo ba breach koro', 'blocked', 8);
  H.civilianHit = h => { G.stats.civHit++; toast('Civilian hit! Shabdhane goli koro', 'civ', 2); };
  H.unauthorized = e => { G.stats.unauthorized++; toast('Unauthorized force: surrender kora suspect ke goli (-100)', 'unauth', 2); };
  H.executed = h => { radio('RAFI', 'They executed a hostage! Move, move!', 'Rafi: Ora ekjon hostage ke mere fello! Taratari!', { prio: true }); G.hooks.banner && G.hooks.banner('HOSTAGE KILLED', 'Execution'); };
  H.shield = (e, h) => { radio('RAFI', 'He has a hostage! Flash him, or only take the shot if you are sure!', 'Rafi: Or haate hostage! Flashbang maro, na hole nishchit hole tobei head shot!', { prio: true }); toast('Human shield! Head shot (Z na) ba flashbang (G)'); };
  H.teamDown = t => toast(`${t.name} down · kache giye F hold kore revive koro`);
  H.playerDied = () => { G.hooks.banner && G.hooks.banner('SHADOW DOWN', ''); setTimeout(() => fail('Shadow KIA', 'You were killed in action.'), 2200); };
  H.console = () => { MS.cctvOff = true; MS.revealT = 14; for (const c of lights.cams) { c.off = true; c.cone.visible = false; c.led.visible = false; } A.beep(true); radio('RAFI', 'CCTV is down. I can see every hostile for a few seconds. Check your map.', 'Rafi: CCTV bondho. Kichukkhon shob enemy map e dekhacche.'); toast('CCTV offline · enemy position map e'); };
  H.intel = () => { MS.intel = true; toast('Intel: bomb er wire order paowa gese (objective panel e dekho)'); radio('SHADOW', 'Got the bomb wire sequence.', 'Shadow: Bomb er wire order peye gechi.'); };
  H.bomb = () => { if (MS.defused || MS.ended) return; openDefuse(); };
  H.cameraShot = (hb) => { const c = lights.cams.find(x => x.hb === hb); if (!c || !c.alive) return; c.alive = false; c.cone.visible = false; c.led.visible = false; c.head.rotation.z = 0.9; c.head.rotation.x -= 0.6; toast('Camera destroy hoyeche'); };
  H.flashbang = p => { const n = stunArea(p, 9.5, D().stun, true); if (n) toast(`${n} jon enemy stunned · V chaple surrender korao, ba F e arrest`); if (!MS.alarm && n === 0) { } };
  H.breachBlast = (door, from) => {
    door.blow(from); A.boom(door.center); FX.light(door.center, '#ffb060', 160, 0.4, 16); FX.emit(door.center, from.clone().sub(door.center).negate().normalize(), 120, '#ffb050', 7, 0.8, 2);
    FX.puff(door.center, { count: 10, size: 0.8, life: 3, rise: 0.3, color: '#7a7a72', spread: 1 }); emitNoise(door.center, 45, 'explosion'); P.shake = Math.max(P.shake, 0.6);
    const n = stunArea(door.center, 7, D().stun, true); if (n) toast(`Breach! ${n} jon enemy stunned`);
    if (P.pos.distanceTo(door.center) < 2.2) damagePlayer(25, door.center);
    for (const h of G.hostages) if (h.alive && h.pos.distanceTo(door.center) < 1.6) h.damage(30, 'torso', V3(0, 0, 1), h.chestPos, 'blast');
    triggerAlarm('Breach explosion');
  };
  H.lockedDoor = d => toast('Door locked · T chaple Bolt breach charge lagabe', 'locked', 3);
  H.teamCallout = kind => { if (kind === 'reload' && R() < 0.3) radio('RAFI', 'Covering you.', null, { cool: 10, key: 'cov' }); };
  H.suppress = () => { G.hooks.suppressFx && G.hooks.suppressFx(); };
  H.landed = () => radio('RAFI', 'Boots on the ground!', 'Rafi: Neme gechi!', { prio: true });
  H.hitmark = ag => { G.hooks.hitmarker && G.hooks.hitmarker(ag); if (ag.kind === 'enemy') { G.playerTarget = ag; G.playerTargetT = G.time; } };
  H.yell = () => {
    if ((MS.yellCd || 0) > G.time) return; MS.yellCd = G.time + 1.6;
    VO.say('SHADOW', ['Police! Drop your weapon!', 'Tiger 24! Get on the ground!', 'Hands up! Do it now!'][Math.floor(R() * 3)], { radio: false, prio: true, pitch: 0.9, rate: 1.15 });
    emitNoise(P.pos, 13, 'yell', 'player'); let any = false;
    for (const e of G.enemies) { if (!e.isHostile()) continue; if (e.pos.distanceTo(P.pos) < 11) { any = true; e.tryYell(); } }
    for (const h of G.hostages) if (h.alive && h.state === 'freed' && h.pos.distanceTo(P.pos) < 10) h.cowerT = 2;
  };
  H.command = name => {
    if (name === 'follow') {
      const hold = G.team.some(t => t.order === 'follow');
      for (const t of G.team) { if (t.state === 'downed') continue; t.order = hold ? 'hold' : 'follow'; t.state = t.order; t.holdPos = t.pos.clone(); }
      VO.say('SHADOW', hold ? 'Hold position.' : 'On me. Follow.', { radio: true, prio: true }); setTimeout(() => radio('RAFI', hold ? 'Holding.' : 'Moving with you.', null), 700);
      toast(hold ? 'Team: HOLD position' : 'Team: FOLLOW');
    } else if (name === 'breach') {
      const dir = new THREE.Vector3(); G.camera.getWorldDirection(dir); let best = null, bs = 0;
      for (const d of doors) { if (d.broken) continue; const to = d.center.clone().sub(G.camera.position); const dist = to.length(); if (dist > 7) continue; const dot = to.normalize().dot(dir); if (dot > 0.75 && dot > bs) { bs = dot; best = d; } }
      if (!best) { toast('Breach korar jonno ekta door er dike takao (7m er moddhe)'); return; }
      if (best.isOpen) { toast('Door ta to kholai ache'); return; }
      const bolt = G.team.find(t => t.name === 'Bolt'); if (!bolt || bolt.state === 'downed') { toast('Bolt down · age revive koro'); return; }
      VO.say('SHADOW', 'Bolt, breach that door.', { radio: true, prio: true }); bolt.orderBreach(best);
    } else if (name === 'mark') {
      const ray = new THREE.Raycaster(); const dir = new THREE.Vector3(); G.camera.getWorldDirection(dir); ray.set(G.camera.position, dir); ray.far = 60;
      const hit = ray.intersectObjects(G.hitboxes.filter(h => h.userData.agent.kind === 'enemy' && h.userData.agent.isHostile()), false)[0];
      if (!hit) { toast('Hawk: kono target crosshair e nei'); return; }
      const e = hit.object.userData.agent;
      if (MS.hawkCd > 0) { radio('HAWK', `Reloading. ${Math.ceil(MS.hawkCd)} seconds.`, `Hawk: Reload korchi, ${Math.ceil(MS.hawkCd)} second.`, { prio: true }); return; }
      if (e.state === 'shield') { radio('HAWK', 'Negative, hostage is too close. No shot.', 'Hawk: Na, hostage khub kache. Shot nebo na.', { prio: true }); return; }
      const head = V3(e.pos.x, e.pos.y + 1.6, e.pos.z);
      if (!los(LV.hawk, head, true)) { radio('HAWK', 'No line of sight on that target.', 'Hawk: Oi target amar nojore nei.', { prio: true }); return; }
      radio('HAWK', 'Target marked. Sending.', 'Hawk: Target dekhte pacchi. Fire korchi.', { prio: true }); MS.hawkPending = { e, t: 1.4 }; MS.hawkCd = 25; e.marked = true;
    }
  };
}

/* ================= defuse ================= */
export function openDefuse() { G.defusing = true; G.hooks.defuse && G.hooks.defuse(true); }
export function closeDefuse() { G.defusing = false; G.hooks.defuse && G.hooks.defuse(false); }
export function cutWire(idx) {
  if (!G.defusing || MS.defused) return; const w = COLORS[idx]; if (MS.cut.includes(w.k)) return;
  const need = MS.wires[MS.cut.length];
  if (w.k === need.k) { MS.cut.push(w.k); A.snip(); if (MS.cut.length === 4) { MS.defused = true; A.beep(true); setTimeout(() => A.beep(true), 150); closeDefuse(); radio('SHADOW', 'Bomb defused.', 'Shadow: Bomb defuse hoye gese.', { prio: true }); setTimeout(() => radio('RAFI', 'Good work. Now finish it.', 'Rafi: Shabash. Ebar baki kaj shesh koro.'), 1500); toast('Bomb defused (+250)'); G.hooks.banner && G.hooks.banner('BOMB DEFUSED', ''); } }
  else { MS.wrong++; A.buzz(); MS.timer = Math.max(5, MS.timer - 90); toast('Bhul wire! Timer 90 second kome gelo'); if (MS.wrong >= 2) { closeDefuse(); explode(); } }
  G.hooks.defuseUpdate && G.hooks.defuseUpdate();
}
export const WIRE_COLORS = COLORS;
function explode() {
  if (MS.ended) return; A.boom(LV.bomb); A.boom(G.camera.position); FX.light(LV.bomb, '#ffffff', 400, 1.5, 60); P.flashBlind = 6; P.shake = 2;
  G.hooks.banner && G.hooks.banner('BOMB DETONATED', ''); setTimeout(() => fail('Bomb blast', 'The vault bomb detonated.'), 1800); MS.ended = true;
}

/* ================= update ================= */
let percT = 0;
export function updateMission(dt) {
  if (MS.ended) { MS.endT += dt; return; }
  // timer
  if (!MS.defused) { MS.timer -= dt; if (MS.timer <= 0) { MS.timer = 0; explode(); return; } }
  if (MS.timer < 60 && !MS.defused && !MS.warn60) { MS.warn60 = true; radio('RAFI', 'One minute on the bomb!', 'Rafi: Bomb e ar ek minute!', { prio: true }); }
  // defuse proximity
  if (G.defusing && P.pos.distanceTo(LV.bomb) > 2.3) closeDefuse();
  // bomb display blink
  const b = interactables.find(i => i.kind === 'bomb'); if (b && b.disp) b.disp.material.color.set(MS.defused ? '#30ff60' : ((G.time % 1) < 0.5 ? '#ff3020' : '#550a05'));
  if (!MS.defused && b && P.pos.distanceTo(LV.bomb) < 6) { MS.beepT = (MS.beepT || 0) - dt; if (MS.beepT <= 0) { MS.beepT = MS.timer < 60 ? 0.35 : 1; A.beep(); } }
  // combat → alarm
  const fighting = G.enemies.some(e => e.alive && e.state === 'combat'); if (fighting) MS.combatT += dt; else MS.combatT = Math.max(0, MS.combatT - dt * 0.5);
  if (MS.combatT > 3.5) triggerAlarm('Enemy firefight');
  A.setTension(fighting ? 1 : MS.alarm ? 0.6 : 0.15);
  // CCTV
  const camT = { recruit: 1.6, veteran: 1.0, elite: 0.7 }[G.diff];
  lights.cams.forEach((c, i) => {
    if (!c.alive || c.off) return; c.sweep += dt * 0.35; c.g.rotation.y = c.base + Math.sin(c.sweep) * 0.55;
    const head = c.head; head.updateMatrixWorld(); const cp = new THREE.Vector3(); head.getWorldPosition(cp); const fw = new THREE.Vector3(0, 0, -1).transformDirection(head.matrixWorld);
    const pp = V3(P.pos.x, P.pos.y + P.height * 0.8, P.pos.z); const to = pp.clone().sub(cp); const d = to.length(); to.normalize();
    const seen = P.alive && d < 17 && to.dot(fw) > Math.cos(0.42) && los(cp, pp, false);
    MS.camExpo[i] = clamp(MS.camExpo[i] + (seen ? dt : -dt * 0.6), 0, camT);
    c.cone.material.opacity = 0.05 + (MS.camExpo[i] / camT) * 0.2; c.led.visible = seen ? (G.time % 0.2) < 0.1 : (G.time % 1.5) < 0.2;
    if (MS.camExpo[i] >= camT) { triggerAlarm('CCTV camera spotted you'); for (const e of G.enemies) if (e.isHostile() && e.state !== 'combat') e.investigate(P.pos.clone(), true); MS.camExpo[i] = 0; }
  });
  // alarm & executions
  if (MS.alarm) {
    MS.alarmT += dt;
    if (!MS.execWarned && MS.alarmT > MS.nextExec - 10) { MS.execWarned = true; radio('RAFI', 'They are preparing to execute hostages! Ten seconds!', 'Rafi: Ora hostage marte jacche! Dosh second!', { prio: true }); G.hooks.execWarn && G.hooks.execWarn(10); }
    if (MS.alarmT >= MS.nextExec) {
      let done = false;
      for (const e of G.enemies) { if (!e.isHostile() || e.state === 'stunned' || e.state === 'shield' || e.state === 'grab' || (e.state === 'combat' && e.targetVisible)) continue;
        const h = G.hostages.find(h => h.alive && h.state === 'restrained' && h.pos.distanceTo(e.pos) < 8 && los(e.eye, h.chestPos)); if (h) { done = e.executeHostage(h); if (done) break; } }
      MS.nextExec = MS.alarmT + (done ? MS.execInterval : 8); MS.execWarned = !done ? true : false; if (!done) MS.execWarned = true;
      if (done) MS.execWarned = false;
    }
  }
  // hawk
  MS.hawkCd = Math.max(0, MS.hawkCd - dt);
  if (MS.hawkPending) { MS.hawkPending.t -= dt; if (MS.hawkPending.t <= 0) { const e = MS.hawkPending.e; MS.hawkPending = null; const head = V3(e.pos.x, e.pos.y + 1.6, e.pos.z);
    A.shot('sniper'); if (e.isHostile() && e.state !== 'shield' && los(LV.hawk, head, true)) { const dir = head.clone().sub(LV.hawk).normalize();
      const g = rayWorld(LV.hawk, dir, LV.hawk.distanceTo(head), c => !c.glass); { let o = LV.hawk.clone(); for (let k = 0; k < 3; k++) { const gh = rayWorld(o, dir, head.distanceTo(o), c => !c.glass); if (!gh) break; shatterGlass(gh.c, gh.p, dir); o = gh.p.clone().addScaledVector(dir, 0.05); } }
      FX.tracer(LV.hawk, head, '#ffffff'); e.die(dir, head, 'head', 'hawk', 90); radio('HAWK', 'Target down.', 'Hawk: Target shesh.'); emitNoise(head, 20, 'gunshot'); }
    else radio('HAWK', 'Lost the shot.', 'Hawk: Shot miss, target sore gese.'); } }
  // spotting for the map
  percT -= dt; if (percT <= 0) { percT = 0.2; const cam = G.camera; const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
    for (const e of G.enemies) { if (!e.alive) continue; const hp = V3(e.pos.x, e.pos.y + 1.5, e.pos.z); const to = hp.clone().sub(cam.position); const d = to.length(); to.normalize();
      if ((to.dot(fwd) > 0.45 && d < 40 && los(cam.position, hp)) || G.team.some(t => t.alive && t.state !== 'downed' && t.pos.distanceTo(e.pos) < 25 && los(t.eye, hp))) e.spottedT = G.time; } }
  MS.revealT = Math.max(0, MS.revealT - dt);
  // objectives
  const hostile = G.enemies.filter(e => e.isHostile()).length; const pendingH = G.hostages.filter(h => h.alive && (h.state === 'restrained' || h.state === 'freed' || h.state === 'shield')).length;
  if (hostile === 0 && pendingH === 0 && MS.defused && P.alive) success();
}
function score(successful) {
  const s = G.stats; const t = MS.tlim - MS.timer; const acc = s.shots ? s.hits / s.shots : 0;
  const rows = [
    ['Hostage rescued', s.rescued, s.rescued * 100], ['Hostage mara gese', s.hostagesDead, -s.hostagesDead * 150], ['Enemy neutralized', s.kills + s.teamKills, (s.kills + s.teamKills) * 50],
    ['Arrest', s.arrests, s.arrests * 120], ['Leader arrested', s.leaderArrested ? 'Yes' : 'No', s.leaderArrested ? 300 : 0], ['Bomb defused', MS.defused ? 'Yes' : 'No', MS.defused ? 250 : 0],
    ['Time bonus', fmt(MS.timer) + ' baki', successful ? Math.round(MS.timer) : 0], ['Stealth (alarm chara)', s.alarm ? 'No' : 'Yes', !s.alarm && successful ? 400 : 0],
    ['Civilian hit', s.civHit, s.civHit ? -s.civHit * 60 : (successful ? 200 : 0)], ['Unauthorized force', s.unauthorized, -s.unauthorized * 100], ['Accuracy', Math.round(acc * 100) + '%', Math.round(acc * 200)],
  ];
  const total = Math.max(0, rows.reduce((a, r) => a + r[2], 0));
  let stars = 0; if (successful) { stars = 1; if (s.hostagesDead <= 1) stars = 2; if (s.hostagesDead === 0 && s.civHit === 0 && (s.leaderArrested || total > 2800)) stars = 3; }
  const grade = !successful ? 'F' : total > 3400 ? 'S' : total > 2700 ? 'A' : total > 2000 ? 'B' : total > 1300 ? 'C' : 'D';
  return { rows, total, stars, grade, acc, time: t };
}
export function fmt(sec) { sec = Math.max(0, Math.ceil(sec)); return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`; }
function success() {
  if (MS.ended) return; MS.ended = true; A.alarm(false); radio('RAFI', 'Building is clear. Mission accomplished. Tiger 24, outstanding work.', 'Rafi: Building clear. Mission complete. Tiger 24, darun kaj!', { prio: true });
  G.hooks.banner && G.hooks.banner('MISSION COMPLETE', 'Area secure');
  const sc = score(true); const best = store.get('best.' + G.diff, null); const isBest = !best || sc.total > best.total; if (isBest) store.set('best.' + G.diff, { total: sc.total, stars: sc.stars, grade: sc.grade });
  MS.result = { ok: true, title: 'Mission complete', sub: 'Operation Vault · ' + G.diff, ...sc, best: isBest ? sc.total : best.total, isBest };
  setTimeout(() => G.hooks.debrief && G.hooks.debrief(MS.result), 3500);
}
function fail(title, sub) {
  if (MS.result) return; MS.ended = true; A.alarm(false);
  const sc = score(false); MS.result = { ok: false, title: 'Mission failed', reason: title, sub, ...sc, best: (store.get('best.' + G.diff, null) || {}).total || 0 };
  setTimeout(() => G.hooks.debrief && G.hooks.debrief(MS.result), 600);
}
export function objectives() {
  const s = G.stats || {}; const hostile = G.enemies.filter(e => e.isHostile()).length; const total = G.enemies.length;
  const hs = G.hostages; const restrained = hs.filter(h => h.alive && (h.state === 'restrained' || h.state === 'shield')).length;
  return [
    { t: `Hostage rescue koro`, v: `${s.rescued || 0} / ${hs.length}`, done: restrained === 0 && hs.every(h => !h.alive || h.state === 'rescued'), sub: s.hostagesDead ? `${s.hostagesDead} jon mara gese (4 hole fail)` : null },
    { t: 'Gunman neutralize/arrest', v: `${total - hostile} / ${total}`, done: hostile === 0, sub: G.enemies.some(e => e.alive && e.state === 'surrender') ? 'Surrender kora suspect ke arrest koro' : null },
    { t: 'Vault er bomb defuse koro', v: MS.defused ? 'Done' : fmt(MS.timer), done: MS.defused, sub: MS.intel && !MS.defused ? 'Wire order: ' + MS.wires.map(w => w.n).join(' → ') : (!MS.defused ? 'Manager office e intel ache' : null) },
    { t: 'Bonus: leader ke jibito arrest', v: s.leaderArrested ? '✓' : '', done: !!s.leaderArrested, opt: true },
    { t: 'Bonus: alarm na bajiye', v: s.alarm ? '✗' : '', done: false, failed: !!s.alarm, opt: true },
  ];
}
