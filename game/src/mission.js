// Tiger 24 — generic mission engine: objectives, alarm, CCTV, executions, bombs, waves, squad commands, scoring, progression
import { THREE, G, PI, clamp, R, rr, A, FX, VO, emitNoise, store, V3, M, B } from './core.js';
import { LV, lights, los, rayWorld, doors, interactables, roomAt, shatterGlass, buildNav, smokes, LG } from './levelkit.js';
import { P, resetPlayer, damagePlayer, clearNades, WEAPONS } from './player.js';
import { spawnAll, clearAgents, stunArea, D, spawnWaveEnemy } from './ai.js';
import { MISSIONS } from './missions/index.js';

const COLORS = [{ k: 'red', n: 'Red', c: '#e03a2a' }, { k: 'blue', n: 'Blue', c: '#2e6cff' }, { k: 'green', n: 'Green', c: '#2fbf5a' }, { k: 'yellow', n: 'Yellow', c: '#f0c020' }];
export const WIRE_COLORS = COLORS;
export const MS = { ended: false, toastCd: {} };
export let CUR = null; // current mission module

/* ================= profile / progression ================= */
export const PROFILE = Object.assign({ xp: 0, missions: {}, squad: ['rafi', 'bolt', 'hawk'], loadout: { primary: 'tg24', secondary: 'p17', gadgets: ['flash', 'charge'], camo: 'multicam' } }, store.get('profile', {}));
export function saveProfile() { store.set('profile', PROFILE); }
const RANKS = ['Recruit', 'Private', 'Corporal', 'Sergeant', 'Staff Sergeant', 'Lieutenant', 'Captain', 'Major', 'Colonel', 'Tiger Commander'];
export function rankInfo() { const lvl = Math.floor(PROFILE.xp / 1000) + 1; return { lvl, rank: RANKS[Math.min(RANKS.length - 1, Math.floor((lvl - 1) / 2))], into: PROFILE.xp % 1000 }; }
export function missionStatus(i) { const m = MISSIONS[i]; const rec = PROFILE.missions[m.meta.id]; if (rec && rec.done) return 'done'; if (i === 0 || (PROFILE.missions[MISSIONS[i - 1].meta.id] || {}).done || G.unlockAll) return 'new'; return 'lock'; }

let GEN = 0;
export function later(fn, ms) { const g = GEN; return setTimeout(() => { if (g === GEN && G.state !== "lobby") fn(); }, ms); }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function toast(msg, key = null, cd = 0) { if (key) { const l = MS.toastCd[key] ?? -99; if (G.time - l < cd) return; MS.toastCd[key] = G.time; } G.hooks.toast && G.hooks.toast(msg); }
function radio(who, text, sub, o = {}) { VO.say(who, text, Object.assign({ sub }, o)); }
const has = t => (LV.objectives || []).some(o => o.type === t);

/* ================= start ================= */
export function startMission(id, entry, diff, squad) {
  GEN++; const mod = MISSIONS.find(m => m.meta.id === id) || MISSIONS[0]; CUR = mod;
  G.missionId = mod.meta.id; G.entry = entry; G.diff = diff; G.squad = squad; VO.stop();
  clearAgents(); clearNades(); FX.clear();
  const def = mod.build(); Object.assign(LV, def); buildNav(def.bounds);
  if (!LV.spawns[entry]) entry = G.entry = Object.keys(LV.spawns)[0];
  G.weaponsFree = false; G.playerTarget = null; G.defusing = false;
  const t = LV.timer || { kind: 'none' }; const secs = typeof t.s === 'object' ? t.s[diff] : (t.s || 0);
  for (const k of Object.keys(MS)) delete MS[k];
  Object.assign(MS, { timer: secs, tlim: secs, timerKind: t.kind, alarm: false, alarmT: 0, nextExec: { recruit: 70, veteran: 45, elite: 30 }[diff], execInterval: { recruit: 50, veteran: 35, elite: 25 }[diff], execWarned: false,
    hawkCd: 0, wrong: 0, intel: false, cctvOff: false, revealT: 0, ended: false, endT: 0, result: null, toastCd: {}, camExpo: lights.cams.map(() => 0), combatT: 0, hawkPending: null,
    carried: false, done: new Set(), waveIdx: 0, waveT: (LV.waves && LV.waves.start) || 0, waveSpawned: 0, surviveT: 0, scanCd: 0, charges: [] });
  for (const it of interactables) if (it.kind === 'bomb') { it.wires = shuffle(COLORS.slice()); it.cut = []; it.defused = false; }
  G.stats = { shots: 0, hits: 0, headshots: 0, kills: 0, teamKills: 0, arrests: 0, rescued: 0, hostagesDead: 0, civHit: 0, civKilled: 0, unauthorized: 0, damageTaken: 0, flashes: 0, revives: 0, leaderArrested: false, alarm: false, start: G.time };
  A.alarm(false);
  spawnAll(entry, squad); resetPlayer(entry, diff);
  if (has('stealth')) { for (const t of G.team) { t.order = 'hold'; t.state = 'hold'; t.holdPos = t.pos.clone(); } later(() => toast('Stealth: team spawn e hold korche · X chaple follow'), 2500); }
  G.hooks.levelReady && G.hooks.levelReady();
  intro(entry);
}
function intro(entry) {
  const line = (LV.intro && (LV.intro[entry] || LV.intro.all)) || ['Tiger 24, go.', 'Rafi: Tiger 24, shuru koro.'];
  later(() => { if (G.state === 'playing') radio('RAFI', line[0], line[1], { prio: true }); }, 900);
  if (LV.hawk && G.squad.includes('hawk')) later(() => { if (G.state === 'playing') radio('HAWK', LV.hawkLine ? LV.hawkLine[0] : 'Hawk in position. Mark targets with Z.', LV.hawkLine ? LV.hawkLine[1] : 'Hawk: Position e achi. Z chaple target mark koro.'); }, 9000);
  if (LV.siren) A.siren();
}

export function triggerAlarm(reason) {
  if (MS.alarm || MS.ended) return; MS.alarm = true; MS.alarmT = 0; A.alarm(true); G.stats.alarm = true;
  if (has('stealth')) { G.hooks.banner && G.hooks.banner('DETECTED', reason || ''); radio('RAFI', 'We are compromised! Mission failed.', 'Rafi: Dhora pore gechi! Mission fail.', { prio: true }); later(() => fail('Dhora pore gechen', 'Stealth mission e alarm baje geche.'), 1800); return; }
  radio('RAFI', LV.executions ? 'Alarm is up! They will start killing hostages, move fast!' : 'Alarm is up! They know we are here!', LV.executions ? 'Rafi: Alarm baje gese! Ora hostage marte shuru korbe, taratari!' : 'Rafi: Alarm baje gese! Ora jene gese!', { prio: true });
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
      H.killfeed && H.killfeed(by, ag.traitor ? 'TRAITOR' : ag.leader ? 'LEADER' : 'GUNMAN', part === 'head');
      if (shooter === 'player') { A.kill(); later(() => radio('RAFI', ['Tango down.', 'Good kill.', 'Hostile down.'][Math.floor(R() * 3)], null, { cool: 5, key: 'td' }), 500); }
      if (ag.leader) radio('RAFI', 'The leader is down.', 'Rafi: Leader shesh.');
      const arrestObj = (LV.objectives || []).find(o => o.type === 'arrest');
      if (arrestObj && ag.id === arrestObj.target) later(() => fail('Target mara gese', 'Target ke jibito arrest korar dorkar chilo.'), 1500);
      const left = G.enemies.filter(e => e.isHostile()).length; if (left === 0 && !LV.waves) radio('RAFI', 'All hostiles neutralized.', 'Rafi: Shob enemy shesh.', { prio: true });
    } else if (ag.kind === 'hostage') {
      G.stats.hostagesDead++; if (shooter === 'player') G.stats.civKilled++;
      if (ag.vip || ag.pilot) { radio('RAFI', `We lost the ${ag.pilot ? 'pilot' : 'VIP'}!`, `Rafi: ${ag.pilot ? 'Pilot' : 'VIP'} ke hariye fellam!`, { prio: true }); later(() => fail(`${ag.name} mara gese`, 'Protect objective failed.'), 1800); return; }
      radio('RAFI', shooter === 'player' ? 'You killed a civilian! Watch your fire!' : 'We lost a hostage!', shooter === 'player' ? 'Rafi: Tumi ekjon civilian ke merecho!' : 'Rafi: Ekjon hostage ke hariye fellam!', { prio: true });
      H.killfeed && H.killfeed(shooter === 'player' ? 'SHADOW' : 'HOSTILE', 'HOSTAGE', false, true);
      if (G.stats.hostagesDead >= (LV.maxDead || 4)) fail('Onek hostage mara gese', 'Too many civilian casualties.');
    }
  };
  H.enemyAlert = e => { MS.combatT = Math.max(MS.combatT, 0.01); if (has('stealth') && !MS.alarm) { MS.stealthWarn = (MS.stealthWarn || 0) + 1; } };
  H.enemySurrender = e => toast('Suspect surrender korse · kache giye F hold kore arrest koro');
  H.enemyArrested = e => { G.stats.arrests++; if (e.leader || e.traitor) { G.stats.leaderArrested = true; radio('RAFI', e.traitor ? 'The traitor is in custody. It is over.' : 'Leader in custody. Outstanding.', e.traitor ? 'Rafi: Traitor grephtar. Shesh holo.' : 'Rafi: Leader grephtar. Darun kaj!'); } else radio('SHADOW', 'Suspect secured.', null, { cool: 3, key: 'sec' }); toast(e.leader || e.traitor ? 'Target arrested (+300)' : 'Suspect arrested (+120)'); };
  H.hostageFreed = (h, auto) => { if (!auto) toast(h.vip ? `${h.name} mukto · exit e jacche` : 'Hostage mukto · nijei exit er dike jacche'); };
  H.hostageRescued = h => { G.stats.rescued++; const tot = G.hostages.filter(x => !x.pilot).length; toast(`${h.vip ? h.name : 'Hostage'} rescued ${G.stats.rescued}/${tot}`); A.pickup(); };
  H.hostageBlocked = h => toast('Hostage er exit er rasta bondho! Door kholo ba breach koro', 'blocked', 8);
  H.civilianHit = h => { G.stats.civHit++; toast('Civilian hit! Shabdhane goli koro', 'civ', 2); };
  H.unauthorized = e => { G.stats.unauthorized++; toast('Unauthorized force: surrender kora suspect ke goli (-100)', 'unauth', 2); };
  H.executed = h => { radio('RAFI', 'They executed a hostage! Move!', 'Rafi: Ora ekjon hostage ke mere fello! Taratari!', { prio: true }); G.hooks.banner && G.hooks.banner('HOSTAGE KILLED', 'Execution'); };
  H.shield = (e, h) => { radio('RAFI', 'He has a hostage! Flash him, or take the shot only if you are sure!', 'Rafi: Or haate hostage! Flashbang maro, na hole nishchit hole head shot!', { prio: true }); toast('Human shield! Head shot ba flashbang'); };
  H.teamDown = t => toast(`${t.name} down · kache giye F hold kore revive koro`);
  H.playerDied = () => { G.hooks.banner && G.hooks.banner('SHADOW DOWN', ''); later(() => fail('Shadow KIA', 'You were killed in action.'), 2200); };
  H.console = it => { MS.cctvOff = true; MS.revealT = 14; for (const c of lights.cams) { c.off = true; c.cone.visible = false; c.led.visible = false; } A.beep(true); radio('RAFI', 'CCTV is down. Hostiles marked on your map for a few seconds.', 'Rafi: CCTV bondho. Kichukkhon shob enemy map e dekhacche.'); toast('CCTV offline · enemy position map e'); };
  H.intel = () => { MS.intel = true; toast('Intel: bomb er wire order paowa gese (objective panel e)'); radio('SHADOW', 'Got the bomb wire sequence.', 'Shadow: Bomb er wire order peye gechi.'); };
  H.bomb = it => { if (!it || it.defused || MS.ended) return; MS.curBomb = it; G.defusing = true; G.hooks.defuse && G.hooks.defuse(true); };
  H.task = it => { MS.done.add(it.id); it.used = true; A.beep(true); toast(it.done || 'Done'); if (it.onUse) it.onUse(); };
  H.item = it => { MS.carried = true; it.used = true; it.obj.visible = false; A.pickup(); toast(it.done || 'Item paowa gese · extraction e jao'); radio('SHADOW', 'I have the package.', 'Shadow: Jinish ta amar kache.'); if (LV.onItem) LV.onItem(); };
  H.cameraShot = hb => { const c = lights.cams.find(x => x.hb === hb); if (!c || !c.alive) return; c.alive = false; c.cone.visible = false; c.led.visible = false; c.head.rotation.z = 0.9; c.head.rotation.x -= 0.6; toast('Camera destroy hoyeche'); };
  H.flashbang = p => { const n = stunArea(p, 9.5, D().stun, true); if (n) toast(`${n} jon enemy stunned · V chaple surrender korao, ba F e arrest`); };
  H.smoke = p => { smokes.push({ pos: p.clone().setY(1.2), r: 0.5, t: 18 }); FX.puff(p.clone().setY(0.8), { count: 14, size: 1.8, life: 6, rise: 0.15, color: '#a0a8a0', spread: 1.6 }); A.boom && A.clink(p); toast('Smoke · enemy dekhte pabe na'); };
  H.breachBlast = (door, from) => {
    door.blow(from); A.boom(door.center); FX.light(door.center, '#ffb060', 160, 0.4, 16); FX.emit(door.center, from.clone().sub(door.center).negate().normalize(), 120, '#ffb050', 7, 0.8, 2);
    FX.puff(door.center, { count: 10, size: 0.8, life: 3, rise: 0.3, color: '#7a7a72', spread: 1 }); emitNoise(door.center, 45, 'explosion'); P.shake = Math.max(P.shake, 0.6);
    const n = stunArea(door.center, 7, D().stun, true); if (n) toast(`Breach! ${n} jon enemy stunned`);
    if (P.pos.distanceTo(door.center) < 2.2) damagePlayer(25, door.center);
    for (const h of G.hostages) if (h.alive && h.pos.distanceTo(door.center) < 1.6) h.damage(30, 'torso', V3(0, 0, 1), h.chestPos, 'blast');
    if (!has('stealth')) triggerAlarm('Breach explosion'); else triggerAlarm('Explosion');
  };
  H.lockedDoor = d => toast(G.squad.includes('bolt') ? 'Door locked · T chaple Bolt breach korbe' : (P.charges > 0 ? 'Door locked · T chaple breach charge lagao' : 'Door locked · breach charge nei'), 'locked', 3);
  H.teamCallout = kind => { if (kind === 'reload' && R() < 0.3 && G.team.length) radio(G.team[0].name.toUpperCase(), 'Covering you.', null, { cool: 10, key: 'cov' }); };
  H.suppress = () => { G.hooks.suppressFx && G.hooks.suppressFx(); };
  H.landed = () => radio('RAFI', 'Boots on the ground!', 'Rafi: Neme gechi!', { prio: true });
  H.hitmark = ag => { G.hooks.hitmarker && G.hooks.hitmarker(ag); if (ag.kind === 'enemy') { G.playerTarget = ag; G.playerTargetT = G.time; } };
  H.yell = () => {
    if ((MS.yellCd || 0) > G.time) return; MS.yellCd = G.time + 1.6;
    VO.say('SHADOW', ['Police! Drop your weapon!', 'Tiger 24! Get on the ground!', 'Hands up! Do it now!'][Math.floor(R() * 3)], { radio: false, prio: true, pitch: 0.9, rate: 1.15 });
    emitNoise(P.pos, has('stealth') ? 8 : 13, 'yell', 'player');
    for (const e of G.enemies) { if (!e.isHostile()) continue; if (e.pos.distanceTo(P.pos) < 11) e.tryYell(); }
    for (const h of G.hostages) if (h.alive && h.state === 'freed' && h.pos.distanceTo(P.pos) < 10) h.cowerT = 2;
  };
  H.command = name => {
    if (name === 'follow') {
      const ground = G.team.filter(t => t.state !== 'downed'); if (!ground.length) { toast('Team e keu nei'); return; }
      const hold = ground.some(t => t.order === 'follow');
      for (const t of ground) { t.order = hold ? 'hold' : 'follow'; t.state = t.order; t.holdPos = t.pos.clone(); }
      VO.say('SHADOW', hold ? 'Hold position.' : 'On me. Follow.', { radio: true, prio: true }); toast(hold ? 'Team: HOLD position' : 'Team: FOLLOW');
    } else if (name === 'breach') {
      const dir = new THREE.Vector3(); G.camera.getWorldDirection(dir); let best = null, bs = 0;
      for (const d of doors) { if (d.broken) continue; const to = d.center.clone().sub(G.camera.position); const dist = to.length(); if (dist > 7) continue; const dot = to.normalize().dot(dir); if (dot > 0.75 && dot > bs) { bs = dot; best = d; } }
      if (!best) { toast('Breach korar jonno ekta door er dike takao (7m er moddhe)'); return; }
      if (best.isOpen) { toast('Door ta to kholai ache'); return; }
      const bolt = G.team.find(t => t.role === 'bolt');
      if (bolt && bolt.state !== 'downed') { VO.say('SHADOW', 'Bolt, breach that door.', { radio: true, prio: true }); bolt.orderBreach(best); return; }
      if (P.charges <= 0) { toast(bolt ? 'Bolt down · revive koro' : 'Breach charge nei (loadout e "Breach charge" nao)'); return; }
      if (best.center.distanceTo(V3(P.pos.x, 1.1, P.pos.z)) > 2.4) { toast('Charge lagate door er kache jao'); return; }
      P.charges--; const ch = new THREE.Mesh(B(0.25, 0.18, 0.06), new THREE.MeshStandardMaterial({ color: '#3a3a2a', emissive: '#ff2010', emissiveIntensity: 0.5 }));
      ch.position.copy(best.center).addScaledVector(V3(P.pos.x - best.center.x, 0, P.pos.z - best.center.z).normalize(), 0.08); ch.lookAt(P.pos.x, 1.1, P.pos.z); LG.add(ch);
      MS.charges.push({ door: best, mesh: ch, t: 3, from: P.pos.clone() }); A.mech('pin'); toast('Charge lagano holo · 3 second · dure shoro!');
    } else if (name === 'mark') {
      if (!G.squad.includes('hawk') || !LV.hawk) { toast(LV.hawk ? 'Hawk squad e nei' : 'Ei mission e Hawk er overwatch nei'); return; }
      const ray = new THREE.Raycaster(); const dir = new THREE.Vector3(); G.camera.getWorldDirection(dir); ray.set(G.camera.position, dir); ray.far = 80;
      const hit = ray.intersectObjects(G.hitboxes.filter(h => h.userData.agent.kind === 'enemy' && h.userData.agent.isHostile()), false)[0];
      if (!hit) { toast('Hawk: kono target crosshair e nei'); return; }
      const e = hit.object.userData.agent;
      if (MS.hawkCd > 0) { radio('HAWK', `Reloading. ${Math.ceil(MS.hawkCd)} seconds.`, `Hawk: Reload korchi, ${Math.ceil(MS.hawkCd)} second.`, { prio: true }); return; }
      if (e.state === 'shield') { radio('HAWK', 'Negative, hostage too close.', 'Hawk: Na, hostage khub kache.', { prio: true }); return; }
      const head = V3(e.pos.x, e.pos.y + 1.6, e.pos.z);
      if (!los(LV.hawk, head, true)) { radio('HAWK', 'No line of sight on that target.', 'Hawk: Oi target amar nojore nei.', { prio: true }); return; }
      radio('HAWK', 'Target marked. Sending.', 'Hawk: Target dekhte pacchi. Fire korchi.', { prio: true }); MS.hawkPending = { e, t: 1.4 }; MS.hawkCd = 25; e.marked = true;
    } else if (name === 'scan') {
      const gh = G.team.find(t => t.role === 'ghost'); if (!gh) { toast('Ghost squad e nei (lobby theke squad e nao)'); return; } if (gh.state === 'downed') { toast('Ghost down'); return; }
      if (MS.scanCd > 0) { toast(`Ghost drone recharge: ${Math.ceil(MS.scanCd)}s`); return; }
      MS.scanCd = 40; MS.revealT = 9; radio('GHOST', 'Drone up. Hostiles marked.', 'Ghost: Drone uriyechi. Enemy map e dekhacche.', { prio: true }); A.beep(true);
    }
  };
}

/* ================= defuse ================= */
export function closeDefuse() { G.defusing = false; G.hooks.defuse && G.hooks.defuse(false); }
export function cutWire(idx) {
  const it = MS.curBomb; if (!G.defusing || !it || it.defused) return; const w = COLORS[idx]; if (it.cut.includes(w.k)) return;
  if (MS.netClient) { // co-op client: the host decides; show the result of a correct cut straight away
    const need = it.wires[it.cut.length]; G.hooks.netAct && G.hooks.netAct('cut', interactables.indexOf(it), w.k);
    if (need && w.k === need.k) { it.cut.push(w.k); A.snip(); if (it.cut.length === 4) { it.defused = true; it.used = true; A.beep(true); closeDefuse(); } } else { A.buzz(); toast('Bhul wire! Timer 90 second kome gelo'); closeDefuse(); }
    G.hooks.defuseUpdate && G.hooks.defuseUpdate(); return;
  }
  applyCut(it, w.k); G.hooks.defuseUpdate && G.hooks.defuseUpdate();
}
export function applyCut(it, k) {
  if (it.defused || it.cut.includes(k)) return; const w = COLORS.find(c => c.k === k); if (!w) return;
  const need = it.wires[it.cut.length];
  if (w.k === need.k) { it.cut.push(w.k); A.snip(); if (it.cut.length === 4) { it.defused = true; it.used = true; A.beep(true); closeDefuse(); const left = bombs().filter(b => !b.defused).length;
      radio('SHADOW', left ? `Bomb defused. ${left} to go.` : 'Bomb defused.', left ? `Shadow: Ekta bomb defuse. Ar ${left} ta baki.` : 'Shadow: Bomb defuse hoye gese.', { prio: true }); toast(left ? `Bomb defused · ar ${left} ta` : 'Shob bomb defused (+250)'); if (!left) G.hooks.banner && G.hooks.banner('BOMB DEFUSED', ''); } }
  else { MS.wrong++; A.buzz(); MS.timer = Math.max(5, MS.timer - 90); toast('Bhul wire! Timer 90 second kome gelo'); if (MS.wrong >= 2) { if (MS.curBomb === it) closeDefuse(); explode(); } }
}
export const bombs = () => interactables.filter(i => i.kind === 'bomb');
function explode() {
  if (MS.ended) return; const bp = (bombs()[0] || {}).pos || P.pos; A.boom(bp); A.boom(G.camera.position); FX.light(bp, '#ffffff', 400, 1.5, 60); P.flashBlind = 6; P.shake = 2;
  G.hooks.banner && G.hooks.banner('BOMB DETONATED', ''); MS.ended = true; later(() => fail('Bomb blast', 'Bomb blast hoye geche.', true), 1800);
}

/* ================= update ================= */
let percT = 0;
// co-op client: the host runs the mission; here only timers, bomb lights and map spotting
function clientUpdate(dt) {
  if (MS.ended) { MS.endT += dt; return; }
  const allDefused = bombs().length > 0 && bombs().every(b => b.defused);
  if ((MS.timerKind === 'bomb' && !allDefused) || MS.timerKind === 'deadline' || MS.timerKind === 'survive') MS.timer = Math.max(0, MS.timer - dt);
  if (G.defusing && MS.curBomb && P.pos.distanceTo(MS.curBomb.pos) > 2.3) closeDefuse();
  for (const b of bombs()) { if (b.disp) b.disp.material.color.set(b.defused ? '#30ff60' : ((G.time % 1) < 0.5 ? '#ff3020' : '#550a05')); if (!b.defused && P.pos.distanceTo(b.pos) < 6) { b.beepT = (b.beepT || 0) - dt; if (b.beepT <= 0) { b.beepT = MS.timer < 60 ? 0.35 : 1; A.beep(); } } }
  const fighting = G.enemies.some(e => e.alive && e.state === 'combat'); A.setTension(fighting ? 1 : MS.alarm ? 0.6 : 0.15);
  percT -= dt; if (percT <= 0) { percT = 0.2; const cam = G.camera; const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
    for (const e of G.enemies) { if (!e.alive) continue; const hp = V3(e.pos.x, e.pos.y + 1.5, e.pos.z); const to = hp.clone().sub(cam.position); const d = to.length(); to.normalize(); if (to.dot(fwd) > 0.45 && d < 40 && los(cam.position, hp)) e.spottedT = G.time; } }
  MS.revealT = Math.max(0, (MS.revealT || 0) - dt);
  if (has('survive')) { const o = LV.objectives.find(o => o.type === 'survive'); MS.surviveT = (o.s || MS.tlim) - MS.timer; }
  G.missionTimer = MS.timer;
}
const remoteUp = () => G.team.some(t => t.remote && t.alive && t.state !== 'downed');
export function updateMission(dt) {
  if (MS.netClient) { clientUpdate(dt); return; }
  if (MS.ended) { MS.endT += dt; return; }
  // timer
  const allDefused = bombs().length > 0 && bombs().every(b => b.defused);
  if (MS.timerKind === 'bomb' && !allDefused) { MS.timer -= dt; if (MS.timer <= 0) { MS.timer = 0; explode(); return; } if (MS.timer < 60 && !MS.warn60) { MS.warn60 = true; radio('RAFI', 'One minute on the bomb!', 'Rafi: Bomb e ar ek minute!', { prio: true }); } }
  if (MS.timerKind === 'deadline') { MS.timer -= dt; if (MS.timer <= 0) { MS.timer = 0; fail('Shomoy shesh', LV.deadlineFail || 'Time ran out.'); return; } }
  if (MS.timerKind === 'survive') { MS.timer = Math.max(0, MS.timer - dt); }
  // charges
  for (let i = MS.charges.length - 1; i >= 0; i--) { const c = MS.charges[i]; c.t -= dt; if (Math.floor(c.t * 4) !== Math.floor((c.t + dt) * 4)) A.beep(c.t < 1); if (c.t <= 0) { LG && LG.remove(c.mesh); MS.charges.splice(i, 1); G.hooks.breachBlast(c.door, c.from); } }
  if (G.defusing && MS.curBomb && P.pos.distanceTo(MS.curBomb.pos) > 2.3) closeDefuse();
  for (const b of bombs()) { if (b.disp) b.disp.material.color.set(b.defused ? '#30ff60' : ((G.time % 1) < 0.5 ? '#ff3020' : '#550a05')); if (!b.defused && P.pos.distanceTo(b.pos) < 6) { b.beepT = (b.beepT || 0) - dt; if (b.beepT <= 0) { b.beepT = MS.timer < 60 ? 0.35 : 1; A.beep(); } } }
  // combat → alarm
  const fighting = G.enemies.some(e => e.alive && e.state === 'combat'); if (fighting) MS.combatT += dt; else MS.combatT = Math.max(0, MS.combatT - dt * 0.5);
  if (MS.combatT > (has('stealth') ? 1.2 : 3.5) && !LV.noAlarm) triggerAlarm('Enemy firefight');
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
  // executions
  if (MS.alarm && LV.executions) {
    MS.alarmT += dt;
    if (!MS.execWarned && MS.alarmT > MS.nextExec - 10 && G.hostages.some(h => h.alive && h.state === 'restrained')) { MS.execWarned = true; radio('RAFI', 'They are preparing to execute hostages! Ten seconds!', 'Rafi: Ora hostage marte jacche! Dosh second!', { prio: true }); G.hooks.execWarn && G.hooks.execWarn(10); }
    if (MS.alarmT >= MS.nextExec) {
      let done = false;
      for (const e of G.enemies) { if (!e.isHostile() || e.state === 'stunned' || e.state === 'shield' || e.state === 'grab' || (e.state === 'combat' && e.targetVisible)) continue;
        const h = G.hostages.find(h => h.alive && h.state === 'restrained' && h.pos.distanceTo(e.pos) < 8 && los(e.eye, h.chestPos)); if (h) { done = e.executeHostage(h); if (done) break; } }
      MS.nextExec = MS.alarmT + (done ? MS.execInterval : 8); MS.execWarned = !done;
    }
  }
  // waves
  const wv = v => typeof v === 'object' ? v[G.diff] : v;
  if (LV.waves && MS.waveSpawned < wv(LV.waves.total)) {
    MS.waveT -= dt;
    if (MS.waveT <= 0) { const W = { ...LV.waves, total: wv(LV.waves.total), every: wv(LV.waves.every) }; const alive = G.enemies.filter(e => e.isHostile()).length; const n = Math.min(W.count, W.total - MS.waveSpawned, Math.max(0, (W.maxAlive || 8) - alive));
      for (let i = 0; i < n; i++) { const sp = W.spawns[Math.floor(R() * W.spawns.length)]; spawnWaveEnemy(sp.clone().add(V3(rr(-1.5, 1.5), 0, rr(-1.5, 1.5))), W.target, { heavy: R() < (W.heavy || 0) }); MS.waveSpawned++; }
      if (n) { MS.waveIdx++; radio('RAFI', ['Contact! More hostiles inbound!', 'Here they come again!', 'Enemy wave incoming!'][MS.waveIdx % 3], `Rafi: Abar enemy ashche! (wave ${MS.waveIdx})`, { prio: true }); G.hooks.banner && G.hooks.banner(`WAVE ${MS.waveIdx}`, `${MS.waveSpawned}/${W.total}`); }
      MS.waveT = W.every; }
  }
  // hawk
  MS.hawkCd = Math.max(0, MS.hawkCd - dt); MS.scanCd = Math.max(0, MS.scanCd - dt);
  if (MS.hawkPending) { MS.hawkPending.t -= dt; if (MS.hawkPending.t <= 0) { const e = MS.hawkPending.e; MS.hawkPending = null; const head = V3(e.pos.x, e.pos.y + 1.6, e.pos.z);
    A.shot('sniper'); if (e.isHostile() && e.state !== 'shield' && los(LV.hawk, head, true)) { const dir = head.clone().sub(LV.hawk).normalize();
      let o = LV.hawk.clone(); for (let k = 0; k < 3; k++) { const gh = rayWorld(o, dir, head.distanceTo(o), c => !c.glass); if (!gh) break; shatterGlass(gh.c, gh.p, dir); o = gh.p.clone().addScaledVector(dir, 0.05); }
      FX.tracer(LV.hawk, head, '#ffffff'); e.die(dir, head, 'head', 'hawk', 90); radio('HAWK', 'Target down.', 'Hawk: Target shesh.'); emitNoise(head, 20, 'gunshot'); }
    else radio('HAWK', 'Lost the shot.', 'Hawk: Shot miss, target sore gese.'); } }
  // spotting for the map
  percT -= dt; if (percT <= 0) { percT = 0.2; const cam = G.camera; const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
    for (const e of G.enemies) { if (!e.alive) continue; const hp = V3(e.pos.x, e.pos.y + 1.5, e.pos.z); const to = hp.clone().sub(cam.position); const d = to.length(); to.normalize();
      if ((to.dot(fwd) > 0.45 && d < 40 && los(cam.position, hp)) || G.team.some(t => t.alive && t.state !== 'downed' && t.pos.distanceTo(e.pos) < 25 && los(t.eye, hp))) e.spottedT = G.time; } }
  MS.revealT = Math.max(0, MS.revealT - dt);
  // survive progress
  if (has('survive')) { const o = LV.objectives.find(o => o.type === 'survive'); MS.surviveT += dt; if (MS.timerKind !== 'survive') MS.timer = Math.max(0, (o.s || MS.tlim) - MS.surviveT); }
  G.missionTimer = MS.timer;
  // objectives
  const st = objectiveState(); if (st.req.every(o => o.done) && (P.alive || remoteUp())) success();
}
const inBox = (p, z) => p.x > z.x1 && p.x < z.x2 && p.z > z.z1 && p.z < z.z2;
function inZone(z) { return !!z && ((P.alive && inBox(P.pos, z)) || G.team.some(t => t.remote && t.state !== 'downed' && inBox(t.pos, z))); }
export function objectiveState() {
  const list = [], s = G.stats || {}; const hostile = G.enemies.filter(e => e.isHostile()).length; const total = G.enemies.length;
  const hs = G.hostages.filter(h => !h.pilot); const restrained = hs.filter(h => h.alive && (h.state === 'restrained' || h.state === 'shield')).length;
  const fmtT = sec => { sec = Math.max(0, Math.ceil(sec)); return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`; };
  const bl = bombs(); const bdone = bl.filter(b => b.defused).length;
  for (const o of LV.objectives || []) {
    let it = null;
    if (o.type === 'rescue') { const pend = hs.filter(h => h.alive && h.state !== 'rescued').length; it = { t: o.label || (hs.some(h => h.vip) && hs.length === 1 ? `${hs[0].name} ke uddhar koro` : 'Hostage rescue koro'), v: `${s.rescued || 0} / ${hs.length}`, done: pend === 0 && hs.length > 0, sub: s.hostagesDead ? `${s.hostagesDead} jon mara gese (${LV.maxDead || 4} hole fail)` : (restrained === 0 && pend > 0 ? 'Mukto hostage exit e jacche' : null) }; }
    else if (o.type === 'neutralize') { const wt = LV.waves ? (typeof LV.waves.total === 'object' ? LV.waves.total[G.diff] : LV.waves.total) : 0; const wavesLeft = wt - (MS.waveSpawned || 0); it = { t: o.label || 'Enemy neutralize/arrest', v: LV.waves ? `${total - hostile} / ${wt + (LV.enemies || []).length}` : `${total - hostile} / ${total}`, done: hostile === 0 && wavesLeft === 0, sub: G.enemies.some(e => e.alive && e.state === 'surrender') ? 'Surrender kora suspect ke arrest koro' : null }; }
    else if (o.type === 'defuse') { const ord = MS.intel ? bl.filter(b => !b.defused).map((b, i) => `${bl.length > 1 ? (b.name || '#' + (bl.indexOf(b) + 1)) + ': ' : ''}${b.wires.map(w => w.n[0]).join('-')}`).join(' · ') : null;
      it = { t: o.label || (bl.length > 1 ? `${bl.length} ta bomb defuse koro` : 'Bomb defuse koro'), v: bl.length > 1 ? `${bdone} / ${bl.length}` : (bdone ? 'Done' : fmtT(MS.timer)), done: bdone === bl.length, sub: ord ? 'Wire order: ' + ord : (bdone < bl.length ? (o.intelHint || 'Intel note khuje wire order jano') : null) }; }
    else if (o.type === 'retrieve') it = { t: o.label || 'Item uddhar koro', v: MS.carried ? '✓' : '', done: MS.carried };
    else if (o.type === 'task') it = { t: o.label, v: MS.done.has(o.id) ? '✓' : '', done: MS.done.has(o.id), sub: o.sub || null };
    else if (o.type === 'survive') { const S = o.s || MS.tlim; it = { t: o.label || 'Tike thako', v: fmtT(Math.max(0, S - (MS.surviveT || 0))), done: (MS.surviveT || 0) >= S, sub: LV.waves ? `Wave ${MS.waveIdx} · enemy ${G.enemies.filter(e => e.isHostile()).length} jon` : null }; }
    else if (o.type === 'protect') { const v = G.hostages.find(h => h.pilot || h.vip); it = { t: o.label || `${v ? v.name : 'VIP'} ke rokkha koro`, v: v ? `${Math.max(0, Math.ceil(v.hp))} HP` : '', done: true, keep: true }; }
    else if (o.type === 'stealth') it = { t: o.label || 'Dhora porben na (alarm = fail)', v: MS.alarm ? '✗' : '', done: true, keep: true };
    else if (o.type === 'arrest') { const e = G.enemies.find(x => x.id === o.target); it = { t: o.label || 'Target ke jibito arrest koro', v: e && e.state === 'arrested' ? '✓' : '', done: !!(e && e.state === 'arrested'), sub: e && e.state === 'surrender' ? 'F hold kore arrest koro' : (o.sub || null) }; }
    else if (o.type === 'extract') { const pre = list.filter(x => !x.keep).every(x => x.done); const inz = inZone(o.zone); it = { t: o.label || 'Extraction point e jao', v: pre ? (inz ? '✓' : 'GO') : '', done: pre && inz, sub: pre && !inz ? 'Map e sobuj zone' : null }; }
    if (it) list.push(it);
  }
  const bonus = [];
  for (const b of LV.bonus || []) { if (b === 'leader') bonus.push({ t: 'Bonus: leader ke jibito arrest', v: s.leaderArrested ? '✓' : '', done: !!s.leaderArrested, opt: true }); if (b === 'stealth') bonus.push({ t: 'Bonus: alarm na bajiye', v: s.alarm ? '✗' : '', done: false, failed: !!s.alarm, opt: true }); }
  return { req: list, bonus };
}
export function objectives() { const st = objectiveState(); return [...st.req, ...st.bonus]; }
function score(successful) {
  const s = G.stats; const acc = s.shots ? s.hits / s.shots : 0; const hasH = G.hostages.some(h => !h.pilot);
  const rows = [];
  if (hasH) { rows.push(['Hostage rescued', s.rescued, s.rescued * 100]); rows.push(['Hostage mara gese', s.hostagesDead, -s.hostagesDead * 150]); }
  rows.push(['Enemy neutralized', s.kills + s.teamKills, (s.kills + s.teamKills) * 50], ['Arrest', s.arrests, s.arrests * 120], ['Leader/target arrested', s.leaderArrested ? 'Yes' : 'No', s.leaderArrested ? 300 : 0]);
  if (bombs().length) rows.push(['Bomb defused', `${bombs().filter(b => b.defused).length}/${bombs().length}`, bombs().filter(b => b.defused).length * 250]);
  if (MS.timerKind === 'bomb' || MS.timerKind === 'deadline') rows.push(['Time bonus', 'baki ' + fmt(MS.timer), successful ? Math.round(MS.timer) : 0]);
  rows.push(['Stealth (alarm chara)', s.alarm ? 'No' : 'Yes', !s.alarm && successful ? 400 : 0]);
  if (hasH) rows.push(['Civilian hit', s.civHit, s.civHit ? -s.civHit * 60 : (successful ? 200 : 0)]);
  rows.push(['Unauthorized force', s.unauthorized, -s.unauthorized * 100], ['Accuracy', Math.round(acc * 100) + '%', Math.round(acc * 200)], ['Difficulty bonus', G.diff, successful ? { recruit: 0, veteran: 300, elite: 700 }[G.diff] : 0]);
  const total = Math.max(0, rows.reduce((a, r) => a + r[2], 0));
  let stars = 0; if (successful) { stars = 1; if (s.hostagesDead <= 1 && s.civHit <= 1) stars = 2; if (s.hostagesDead === 0 && s.civHit === 0 && (s.leaderArrested || !s.alarm || total > 3000)) stars = 3; }
  const grade = !successful ? 'F' : total > 3800 ? 'S' : total > 3000 ? 'A' : total > 2200 ? 'B' : total > 1400 ? 'C' : 'D';
  return { rows, total, stars, grade, acc, time: G.time - s.start };
}
export function fmt(sec) { sec = Math.max(0, Math.ceil(sec)); return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`; }
export function netEnd(ok, reason, sub) { MS.hostEnd = true; if (ok) success(); else fail(reason, sub); }
export function failMission(title, sub) { fail(title, sub); }
function success() {
  if (MS.ended || (MS.netClient && !MS.hostEnd)) return; MS.ended = true; A.alarm(false); radio('RAFI', LV.winLine ? LV.winLine[0] : 'Area secure. Mission accomplished. Tiger 24, outstanding work.', LV.winLine ? LV.winLine[1] : 'Rafi: Area secure. Mission complete. Tiger 24, darun kaj!', { prio: true });
  G.hooks.banner && G.hooks.banner('MISSION COMPLETE', CUR.meta.name);
  const sc = score(true); const id = CUR.meta.id; const rec = PROFILE.missions[id] || {}; const isBest = !rec.best || sc.total > rec.best;
  const xp = Math.round(sc.total / 4) + 150; PROFILE.xp += xp;
  PROFILE.missions[id] = { done: true, stars: Math.max(rec.stars || 0, sc.stars), best: Math.max(rec.best || 0, sc.total), grade: isBest ? sc.grade : rec.grade }; saveProfile();
  MS.result = { ok: true, title: 'Mission complete', sub: CUR.meta.name + ' · ' + G.diff, ...sc, best: Math.max(rec.best || 0, sc.total), isBest, xp };
  G.hooks.netEndHost && G.hooks.netEndHost(true);
  later(() => G.hooks.debrief && G.hooks.debrief(MS.result), 3500);
}
function fail(title, sub) {
  if (MS.result || (MS.netClient && !MS.hostEnd)) return; MS.ended = true; A.alarm(false);
  const sc = score(false); const xp = 40; PROFILE.xp += xp; saveProfile();
  MS.result = { ok: false, title: 'Mission failed', reason: title, sub, ...sc, best: (PROFILE.missions[CUR.meta.id] || {}).best || 0, xp };
  G.hooks.netEndHost && G.hooks.netEndHost(false, title, sub);
  later(() => G.hooks.debrief && G.hooks.debrief(MS.result), 600);
}
