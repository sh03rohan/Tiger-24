// Tiger 24 — co-op multiplayer.
// Host-authoritative: the host runs every AI, the mission and the objectives; the others run the same level with enemies and
// hostages as puppets driven by the host's snapshot. Everyone shares state through room *presence* (one small object per player):
//   every player:  name, colour, pose, flags, hp, shot counter, a short queue of actions (hit, free, arrest, door, task, ...)
//   host also:     game info (mission, entry, difficulty, generation, bomb wires), a world snapshot (10 Hz), damage dealt to each
//                  player and a short queue of events (kill feed, flashbang, smoke, breach, revive, mission end).
// Transport: the claude.ai artifact `room` capability when the page runs there, otherwise a tiny WebSocket relay (server/relay.mjs).
import { THREE, G, V3, R, clamp, angDiff, damp, A, FX, emitNoise, store, VO } from './core.js';
import { animate, makeOperator } from './assets.js';
import { Agent, Enemy, Hostage, stunArea, D, spawnWaveEnemy } from './ai.js';
import { LV, doors, interactables, smokes, rayWorld, los, walkable, lights } from './levelkit.js';
import { P, damagePlayer, flashEffects } from './player.js';
import { MS, bombs, applyCut, netEnd, WIRE_COLORS } from './mission.js';

export const NET = { on: false, host: false, client: false, code: null, room: null, transport: null, name: store.get('callsign', ''), color: store.get('color', 0),
  remotes: new Map(), peers: [], seq: 0, acts: [], evs: [], evSeq: 0, evSeen: -1, lastSeq: {}, dm: {}, dmSeen: 0, gen: 0, genSeen: 0, game: null, inMission: false,
  sendT: 0, snapT: 0, lastHostPres: null, deadT: 0, shotN: 0, shotDir: [0, 0, -1], status: '', error: '' };
G.net = NET;
const LOOKS = [
  { head: 'helmet', vest: '#57573b', skin: '#c48b62', camo: 'multicam' }, { head: 'cap', vest: '#2a2c2e', skin: '#a5714d', camo: 'night' },
  { head: 'helmet', helmet: '#3c4045', vest: '#3a3e42', skin: '#b9835c', camo: 'urban' }, { head: 'boonie', vest: '#4a4a34', skin: '#d6a47e', camo: 'woodland' },
  { head: 'helmet', vest: '#6a5a3a', skin: '#8a5a3a', camo: 'desert' }, { head: 'helmet', helmet: '#1c1e20', vest: '#1f2123', skin: '#e0b48e', camo: 'night', nvgDown: true },
];
export const COLORS = ['#f29b2b', '#4fd1c5', '#ff5a7a', '#8ad14f', '#b48aff', '#ffd34d'];
const ST_E = ['idle', 'patrol', 'suspicious', 'search', 'combat', 'stunned', 'surrender', 'arrested', 'dead', 'grab', 'shield'];
const ST_H = ['restrained', 'freed', 'rescued', 'dead', 'shield', 'pinned'];
const q20 = v => Math.round(v * 20), q100 = v => Math.round(v * 100);

/* ===================== transport ===================== */
let api = null, lobbyUnsub = null;
export async function connect() {
  if (api) return api;
  const relay = new URLSearchParams(location.search).get('relay') || store.get('relay', '');
  if (window.claude && typeof window.claude.use === 'function') {
    NET.status = 'claude.ai room e connect hocche…'; try { const r = await window.claude.use('room'); if (r) { api = r; NET.transport = 'claude'; } } catch (e) { }
  }
  if (!api && relay) { try { api = await wsRoom(relay); NET.transport = 'relay'; } catch (e) { NET.error = 'Relay server e connect hoy ni: ' + relay; } }
  if (!api) { NET.status = ''; return null; }
  NET.status = 'Online';
  lobbyUnsub = api.onPeers(() => G.hooks.mpRefresh && G.hooks.mpRefresh(), () => { });
  return api;
}
export const available = () => !!(window.claude && typeof window.claude.use === 'function') || !!(new URLSearchParams(location.search).get('relay') || store.get('relay', ''));
// Minimal stand-in for the room API over a WebSocket relay (see server/relay.mjs). Same calls: presence, peers, onPeers, join, leave.
function wsRoom(url) {
  return new Promise((resolve, reject) => {
    let ws; try { ws = new WebSocket(url); } catch (e) { reject(e); return; }
    let me = null; const rooms = new Map();
    const send = m => { if (ws.readyState === 1) ws.send(JSON.stringify(m)); };
    const mk = name => {
      const r = { name, map: new Map(), subs: new Set(), mine: {}, dirty: false, snap: Object.freeze([]),
        rebuild() { r.snap = Object.freeze([...r.map.entries()].map(([peer, presence]) => Object.freeze({ peer, presence, isMe: peer === me, sameTab: peer === me, kind: 'viewer', guest: false, by: null, updatedAt: Date.now() }))); },
        notify(joined = [], left = []) { r.rebuild(); const ch = { peers: r.snap, joined, left, updated: [] }; for (const f of r.subs) try { f(ch); } catch (e) { console.error(e); } },
        presence(patch) { for (const [k, v] of Object.entries(patch)) { if (v === null) delete r.mine[k]; else r.mine[k] = v; } r.map.set(me, { ...r.mine }); r.dirty = true; r.notify(); return Promise.resolve(); },
        peers() { return r.snap; }, onPeers(fn) { r.subs.add(fn); setTimeout(() => fn({ peers: r.snap, joined: r.snap, left: [], updated: [] }), 0); return () => r.subs.delete(fn); },
        connected: () => ws.readyState === 1, on: () => () => { }, emit: () => Promise.resolve(),
        leave() { send({ t: 'leave', room: name }); rooms.delete(name); return Promise.resolve(); } };
      rooms.set(name, r); return r;
    };
    const lobby = mk('');
    setInterval(() => { for (const r of rooms.values()) if (r.dirty) { r.dirty = false; send({ t: 'pres', room: r.name, presence: r.mine }); } }, 40);
    ws.onmessage = ev => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.t === 'hello') { me = m.peer; send({ t: 'join', room: '' }); resolve(Object.assign(lobby, { join(name) { const r = rooms.get(name) || mk(name); send({ t: 'join', room: name }); r.map.set(me, {}); r.notify(); return Promise.resolve(r); } })); return; }
      const r = rooms.get(m.room ?? ''); if (!r) return;
      if (m.t === 'state') { for (const p of m.peers) r.map.set(p.peer, p.presence || {}); r.map.set(me, { ...r.mine }); r.notify(); }
      else if (m.t === 'pres') { if (m.peer === me) return; r.map.set(m.peer, m.presence || {}); r.notify(); }
      else if (m.t === 'left') { r.map.delete(m.peer); r.notify([], [m.peer]); } };
    ws.onerror = () => reject(new Error('relay')); ws.onclose = () => { NET.status = 'Relay theke disconnect'; G.hooks.mpRefresh && G.hooks.mpRefresh(); };
  });
}

/* ===================== lobby: host / join / leave ===================== */
export function setProfile(name, color) { NET.name = String(name || '').replace(/[^\w \-.]/g, '').slice(0, 14) || 'Tiger'; NET.color = color % COLORS.length; store.set('callsign', NET.name); store.set('color', NET.color); }
export function openGames() { if (!api) return []; return api.peers().filter(p => !p.isMe && p.presence && p.presence.mp && p.presence.mp.code).map(p => p.presence.mp); }
export async function hostGame(setup) {
  if (!(await connect())) return false;
  const code = Math.random().toString(36).slice(2, 6).replace(/[^a-z0-9]/g, 'x');
  let room; try { room = await api.join('t24-' + code); } catch (e) { NET.error = 'Game room khola gelo na (' + (e && (e.code || e.message)) + ')'; return false; }
  Object.assign(NET, { on: true, host: true, client: false, code, room, gen: 0, game: { st: 'lobby', gen: 0, ...setup } });
  bindRoom(); await room.presence(basePresence()); advertise(); return true;
}
export async function joinGame(code) {
  code = String(code || '').toLowerCase().trim(); if (!/^[a-z0-9]{4}$/.test(code)) { NET.error = '4 okkhorer code din'; return false; }
  if (!(await connect())) return false;
  let room; try { room = await api.join('t24-' + code); } catch (e) { NET.error = 'Game room e dhuka gelo na (' + (e && (e.code || e.message)) + ')'; return false; }
  Object.assign(NET, { on: true, host: false, client: true, code, room, genSeen: 0, game: null });
  bindRoom(); await room.presence(basePresence());
  const t0 = Date.now(); while (Date.now() - t0 < 6000) { if (hostPeer()) return true; await new Promise(r => setTimeout(r, 200)); }
  NET.error = 'Ei code e kono game pawa jay ni'; await leaveGame(); return false;
}
export async function leaveGame() {
  try { NET.room && await NET.room.leave(); } catch (e) { }
  try { api && api.presence({ mp: null }); } catch (e) { }
  for (const ro of NET.remotes.values()) ro.remove(); NET.remotes.clear();
  Object.assign(NET, { on: false, host: false, client: false, code: null, room: null, game: null, inMission: false, acts: [], evs: [] });
}
function basePresence() { return { v: 1, n: NET.name || 'Tiger', c: NET.color, r: NET.host ? 'h' : 'c', ph: 'lobby', rd: NET.host ? 1 : (NET.ready ? 1 : 0), a: [], ...(NET.host ? { g: NET.game, ev: [] } : {}) }; }
function bindRoom() { NET.room.onPeers(ch => { NET.peers = ch.peers; for (const lp of ch.left || []) { const id = lp.peer || lp; const ro = NET.remotes.get(id); if (ro) { ro.remove(); NET.remotes.delete(id); } } G.hooks.mpRefresh && G.hooks.mpRefresh(); }, () => { NET.error = 'Room connection bondho hoye gelo'; G.hooks.mpRefresh && G.hooks.mpRefresh(); }); }
function advertise() { if (!NET.host || !api) return; const g = NET.game || {}; api.presence({ mp: { code: NET.code, h: NET.name, n: players().length, m: g.mname || '', st: g.st || 'lobby' } }).catch(() => { }); }
export function players() { return (NET.room ? NET.room.peers() : []).filter(p => p.presence && p.presence.v === 1); }
export function hostPeer() { return players().find(p => p.presence.r === 'h' && !p.isMe) || null; }
export function setReady(v) { NET.ready = !!v; NET.room && NET.room.presence({ rd: v ? 1 : 0 }); }
export function updateSetup(setup) { if (!NET.host) return; NET.game = { ...NET.game, ...setup }; NET.room.presence({ g: NET.game }); advertise(); }

/* ===================== mission start (both roles) ===================== */
// host: called by main.js right after startMission(); client: main.js calls startMission() when the host's game generation changes, then this.
export function onMissionStart() {
  for (const ro of NET.remotes.values()) ro.remove(); NET.remotes.clear(); NET.inMission = true; NET.acts = []; NET.deadUntil = 0; NET.shotN = 0;
  if (NET.host) {
    NET.gen++; NET.dm = {}; NET.evs = [];
    const wires = bombs().map(b => b.wires.map(w => w.k));
    NET.game = { ...NET.game, st: 'play', gen: NET.gen, m: G.missionId, e: G.entry, d: G.diff, w: wires };
    NET.room.presence({ g: NET.game, ph: 'play', ev: [], dm: {}, w: null }); advertise();
  } else {
    const hp = hostPeer(); const g = hp && hp.presence.g;
    NET.genSeen = g ? g.gen : 0; NET.dmSeen = 0; NET.evSeen = Math.max(-1, ...((hp && hp.presence.ev) || []).map(e => e[0]));
    if (g && g.w) bombs().forEach((b, i) => { const ks = g.w[i]; if (ks) b.wires = ks.map(k => WIRE_COLORS.find(c => c.k === k)); });
    patchPuppets();
    // spread the squad around the entry point
    const me = players().filter(p => p.presence.r === 'c').sort((a, b) => a.peer < b.peer ? -1 : 1).findIndex(p => p.isMe);
    const s = LV.spawns[G.entry]; const fx = -Math.sin(s.yaw), fz = -Math.cos(s.yaw), rx = Math.cos(s.yaw), rz = -Math.sin(s.yaw);
    const slots = [[0.9, 1.2], [-0.9, 1.2], [0, 2.2], [1.6, 2.2], [-1.6, 2.2]]; const sl = slots[Math.max(0, me) % slots.length];
    for (let k = 1; k <= 4; k++) { const x = s.pos.x + (rx * sl[0] - fx * sl[1]) / k, z = s.pos.z + (rz * sl[0] - fz * sl[1]) / k; if (walkable(x, z)) { P.pos.x = x; P.pos.z = z; break; } }
    NET.room.presence({ ph: 'play', a: [] });
  }
}
export function onMissionLeave() { NET.inMission = false; for (const ro of NET.remotes.values()) ro.remove(); NET.remotes.clear(); if (NET.room) NET.room.presence({ ph: 'lobby', a: [] }); if (NET.host) { NET.game = { ...NET.game, st: 'lobby' }; NET.room.presence({ g: NET.game, w: null }); advertise(); } }

/* ===================== remote operators (other players' avatars) ===================== */
export class RemoteOp extends Agent {
  constructor(peer, pres) {
    const p = pres.p || [0, 0, 0, 0, 0]; super('team', makeOperator({ ...LOOKS[(pres.c || 0) % LOOKS.length], weapon: 'tg24' }), { pos: V3(p[0], 0, p[2]), yaw: p[3] + Math.PI, name: (pres.n || 'Tiger').slice(0, 14), id: 'R' + peer });
    this.remote = true; this.peer = peer; this.hp = this.maxHp = 100; this.state = 'follow'; this.order = 'co-op'; this.tgt = this.pos.clone(); this.tyaw = this.yaw; this.shotSeen = pres.sh || 0; this.flags = 0;
    // floating callsign so teammates can tell each other apart
    const col = COLORS[(pres.c || 0) % COLORS.length], cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const g = cv.getContext('2d');
    g.font = '800 34px "Saira Condensed", sans-serif'; g.textAlign = 'center'; g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,.75)'; g.strokeText(this.name.toUpperCase(), 128, 44); g.fillStyle = col; g.fillText(this.name.toUpperCase(), 128, 44);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    this.tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, fog: false })); this.tag.scale.set(0.9, 0.225, 1); this.tag.position.set(0, 2.15, 0); this.tag.renderOrder = 10; this.root.add(this.tag);
  }
  damage(amount, part, dir, point, shooter) { if (!this.alive || this.state === 'downed') return; if (NET.host && shooter && shooter.kind === 'enemy') NET.dm['p' + this.peer] = Math.round((NET.dm['p' + this.peer] || 0) + amount); }
  die() { }
  revive() { if (this.state !== 'downed') return; if (NET.host) pushEv('revive', this.peer); else act('revive', this.peer); G.stats.revives++; G.hooks.toast && G.hooks.toast(`${this.name} ke revive kora holo`); }
  applyPresence(pr) {
    const p = pr.p; if (p) { this.tgt.set(p[0], 0, p[2]); this.tyaw = p[3] + Math.PI; this.tpitch = -p[4]; }
    this.flags = pr.f || 0; this.hp = pr.hp ?? this.hp; const alive = !!(this.flags & 2);
    if (!alive && this.state !== 'downed') { this.state = 'downed'; this.anim.mode = 'down'; } else if (alive && this.state === 'downed') { this.state = 'follow'; this.anim.mode = 'normal'; }
    if ((pr.sh || 0) !== this.shotSeen) { const n = ((pr.sh || 0) - this.shotSeen + 1024) % 1024; this.shotSeen = pr.sh || 0; if (n > 0 && n < 50 && this.state !== 'downed') this.fireFx(pr.sd); }
  }
  fireFx(sd) {
    const mz = this.muzzleWorld(); const dir = sd ? V3(sd[0], sd[1], sd[2]).normalize() : this.forward(); FX.muzzle(mz, 0.6); this.anim.recoil = 1;
    const h = rayWorld(mz, dir, 60); const end = h ? h.p : mz.clone().addScaledVector(dir, 60); FX.tracer(mz, end, '#ffe9b0'); if (h && !h.c.glass) FX.decal(h.p, h.n);
    A.shot('team', mz, !los(G.camera.position, mz)); if (NET.host) emitNoise(mz, 16, 'gunshot', this);
  }
  update(dt) {
    if (!this.alive) return; this.anim.recoil = Math.max(0, (this.anim.recoil || 0) - dt * 8);
    const d = this.pos.distanceTo(this.tgt); if (d > 5) this.pos.copy(this.tgt); else { const k = 1 - Math.exp(-dt * 12); this.pos.lerp(this.tgt, k); }
    this.yaw += angDiff(this.yaw, this.tyaw) * Math.min(1, dt * 14);
    const sp = d / Math.max(dt, 1e-3); this.anim.speed = damp(this.anim.speed, this.state === 'downed' ? 0 : clamp(sp, 0, 5), 8, dt);
    this.anim.crouch = this.flags & 1 ? 1 : 0; this.anim.aim = this.flags & 4 ? 1 : 0.6; this.anim.pitch = this.tpitch || 0; this.anim.mode = this.state === 'downed' ? 'down' : 'normal';
    this.root.position.copy(this.pos); this.root.rotation.y = this.yaw; this.kb.position.set(this.pos.x, 0.75, this.pos.z); animate(this.m, this.anim, dt);
    if (this.tag) { this.tag.material.opacity = this.state === 'downed' ? 0.55 + Math.sin(G.time * 6) * 0.35 : 1; this.tag.position.y = this.state === 'downed' ? 0.9 : 2.15; }
  }
}
function syncRemotes() {
  for (const p of players()) {
    if (p.isMe) continue; const pr = p.presence; if (pr.ph !== 'play') { const ro = NET.remotes.get(p.peer); if (ro) { ro.remove(); NET.remotes.delete(p.peer); const i = G.team.indexOf(ro); if (i >= 0) G.team.splice(i, 1); } continue; }
    let ro = NET.remotes.get(p.peer); if (!ro) { if (!pr.p) continue; ro = new RemoteOp(p.peer, pr); NET.remotes.set(p.peer, ro); G.team.push(ro); if (NET.host) NET.lastSeq[p.peer] = Math.max(NET.lastSeq[p.peer] ?? -1, ...(pr.a || []).map(a => a[0])); }
    ro.applyPresence(pr);
    if (NET.host) processActions(p.peer, pr.a || [], ro);
  }
  for (const [peer, ro] of NET.remotes) if (!players().some(p => p.peer === peer)) { ro.remove(); NET.remotes.delete(peer); const i = G.team.indexOf(ro); if (i >= 0) G.team.splice(i, 1); }
}
export const anyRemoteAlive = () => [...NET.remotes.values()].some(r => r.alive && r.state !== 'downed');
export const remoteInZone = z => [...NET.remotes.values()].some(r => r.state !== 'downed' && r.pos.x > z.x1 && r.pos.x < z.x2 && r.pos.z > z.z1 && r.pos.z < z.z2);

/* ===================== client → host actions ===================== */
export function act(type, ...args) { NET.acts.push([++NET.seq, type, ...args]); if (NET.acts.length > 14) NET.acts.shift(); NET.sendT = 0; }
function processActions(peer, list, ro) {
  const last = NET.lastSeq[peer] ?? -1; let mx = last;
  for (const a of list) { if (a[0] <= last) continue; mx = Math.max(mx, a[0]); try { applyAction(a[1], a.slice(2), ro); } catch (e) { console.error('net action', a, e); } }
  NET.lastSeq[peer] = mx;
}
function applyAction(type, a, ro) {
  if (MS.ended && type !== 'revive') return;
  if (type === 'hit') { const ag = a[0] === 'e' ? G.enemies[a[1]] : G.hostages[a[1]]; if (!ag || !ag.alive) return; const dir = V3(a[4] || 0, a[5] || 0, a[6] || 1);
    ag.damage(a[2], a[3] || 'torso', dir, ag.chestPos, ro); if (ag.kind === 'hostage' && ag.alive) G.stats.civHit++; }
  else if (type === 'stun') { const e = G.enemies[a[0]]; if (e) { e.stun(a[1] || 6); e.tased = true; } }
  else if (type === 'arrest') { const e = G.enemies[a[0]]; if (e) e.arrest(); }
  else if (type === 'free') { const h = G.hostages[a[0]]; if (h) h.free(); }
  else if (type === 'yell') { const p = V3(a[0], 0, a[1]); for (const e of G.enemies) if (e.isHostile() && e.pos.distanceTo(p) < 11 && los(e.eye, V3(p.x, 1.5, p.z))) yellAt(e, p, ro); for (const h of G.hostages) if (h.alive && h.state === 'freed' && h.pos.distanceTo(p) < 10) h.cowerT = 2; emitNoise(p, 13, 'yell', ro); }
  else if (type === 'door') { const d = doors[a[0]]; if (d && !d.locked && !d.broken) { if (Math.abs(a[1]) < 0.05) d.close(); else d.open(ro.pos, 'player'); } }
  else if (type === 'task' || type === 'item' || type === 'console' || type === 'intel' || type === 'pick') { const it = interactables[a[0]]; if (!it || it.used) return;
    if (type === 'task') G.hooks.task(it); else if (type === 'item') G.hooks.item(it); else if (type === 'console') { it.used = true; G.hooks.console(it); } else if (type === 'intel') { it.used = true; it.obj.visible = false; G.hooks.intel(it); } else { it.used = true; it.obj.visible = false; } }
  else if (type === 'cut') { const it = interactables[a[0]]; if (it && it.kind === 'bomb') applyCut(it, a[1]); }
  else if (type === 'flash') { const p = V3(a[0], a[1], a[2]); G.hooks._flashHost(p); pushEv('flash', a[0], a[1], a[2], ro.peer); }
  else if (type === 'smoke') { const p = V3(a[0], a[1], a[2]); G.hooks._smokeHost(p); pushEv('smoke', a[0], a[1], a[2], ro.peer); }
  else if (type === 'breach') { const d = doors[a[0]]; if (d && !d.broken) setTimeout(() => { if (!d.broken && G.state !== 'lobby') G.hooks.breachBlast(d, V3(a[1], 0, a[2])); }, 3000); }
  else if (type === 'cam') { const c = lights.cams[a[0]]; if (c) G.hooks.cameraShot(c.hb); }
  else if (type === 'revive') { if (a[0] === myPeer()) respawn(true); else pushEv('revive', a[0]); }
}
function yellAt(e, p, ro) {
  if (e.state === 'shield') return; let ch = { idle: 0.6, patrol: 0.6, suspicious: 0.5, search: 0.32, combat: 0.1, stunned: 0.95, grab: 0.15 }[e.state] ?? 0.2;
  if (e.leader || e.traitor) ch *= e.state === 'stunned' ? 1 : 0.45; if (e.hp < e.maxHp * 0.5) ch += 0.25; ch *= { recruit: 1.25, veteran: 1, elite: 0.75 }[G.diff];
  if (V3(p.x - e.pos.x, 0, p.z - e.pos.z).normalize().dot(e.forward()) < 0) ch += 0.2;
  if (R() < ch) e.surrender(); else { e.say(['Never!', 'Go to hell!'][Math.floor(R() * 2)], { force: true }); const t = e.targets().find(t => t.ref === ro); if (t) e.engage(t, true); }
}
const myPeer = () => { const me = players().find(p => p.isMe && p.sameTab); return me ? me.peer : null; };

/* ===================== host → everyone events ===================== */
export function pushEv(type, ...args) { if (!NET.host) return; NET.evs.push([++NET.evSeq, type, ...args]); if (NET.evs.length > 14) NET.evs.shift(); NET.snapT = 0; }
function applyEvents(list) {
  for (const e of list) { if (e[0] <= NET.evSeen) continue; NET.evSeen = e[0]; const [, type, ...a] = e;
    if (type === 'kf') { G.hooks.killfeed && G.hooks.killfeed(a[0], a[1], !!a[2], !!a[3]); if (a[0] === (NET.name || '').toUpperCase()) A.kill(); }
    else if (type === 'flash') { if (a[3] !== myPeer()) flashEffects(V3(a[0], a[1], a[2])); }
    else if (type === 'smoke') { if (a[3] !== myPeer()) G.hooks._smokeLocal(V3(a[0], a[1], a[2])); }
    else if (type === 'blast') { const d = doors[a[0]]; if (d) { if (!d.broken) d.blow(V3(a[1], 0, a[2])); A.boom(d.center); FX.light(d.center, '#ffb060', 160, 0.4, 16); FX.puff(d.center, { count: 10, size: 0.8, life: 3, rise: 0.3, color: '#7a7a72', spread: 1 }); if (P.pos.distanceTo(d.center) < 2.2) damagePlayer(25, d.center); } }
    else if (type === 'revive') { if (a[0] === myPeer()) respawn(true); }
    else if (type === 'end') { netEnd(!!a[0], a[1], a[2]); }
    else if (type === 'toast') { G.hooks.toast && G.hooks.toast(a[0]); } }
}

/* ===================== host: world snapshot ===================== */
function encodeWorld() {
  const E = G.enemies.map(e => [q20(e.pos.x), q20(e.pos.z), q100(e.yaw), Math.max(0, ST_E.indexOf(e.alive ? e.state : 'dead')), (e.wantCrouch ? 1 : 0) | (e.heavy ? 2 : 0) | (e.anim.aim > 0.5 ? 4 : 0), (e.shotN || 0) % 1024]);
  const H = G.hostages.map(h => [q20(h.pos.x), q20(h.pos.z), q100(h.yaw), Math.max(0, ST_H.indexOf(!h.alive ? (h.state === 'rescued' ? 'rescued' : 'dead') : h.state)), (h.cowerT > 0 || h.waiting) ? 1 : 0]);
  const Dd = doors.map(d => [q100(d.target), (d.locked ? 1 : 0) | (d.broken ? 2 : 0)]);
  const used = interactables.map(it => it.used ? 1 : 0).join('');
  const Bb = bombs().map(b => [b.defused ? 1 : 0, b.cut.length]);
  const cams = lights.cams.map(c => (c.alive ? 1 : 0) | (c.off ? 2 : 0)).join('');
  return { e: E, h: H, d: Dd, u: used, b: Bb, c: cams, m: [Math.round(MS.timer), MS.alarm ? 1 : 0, MS.carried ? 1 : 0, MS.intel ? 1 : 0, MS.revealT > 0 ? 1 : 0, MS.waveIdx || 0], k: [...MS.done] };
}

/* ===================== client: apply snapshot ===================== */
function patchPuppets() {
  G.enemies.forEach((e, i) => patchEnemy(e, i)); G.hostages.forEach((h, i) => patchHostage(h, i));
  doors.forEach((d, i) => { if (d._netPatched) return; d._netPatched = true; const tog = d.toggle.bind(d); d.toggle = (from, by) => { const r = tog(from, by); if (by === 'player' && !d.locked) act('door', i, Math.round(d.target * 100) / 100); return r; }; });
}
function patchEnemy(e, i) {
  e.netI = i; e.puppet = true; e.net = { x: e.pos.x, z: e.pos.z, yaw: e.yaw };
  e.damage = (amt, part, dir, point, shooter) => { if (shooter === 'player') { act('hit', 'e', i, Math.round(amt), part, +dir.x.toFixed(2), +dir.y.toFixed(2), +dir.z.toFixed(2)); e.flinch = 0.25; } };
  e.stun = dur => act('stun', i, dur); e.arrest = () => act('arrest', i);
}
function patchHostage(h, i) {
  h.netI = i; h.puppet = true; h.net = { x: h.pos.x, z: h.pos.z, yaw: h.yaw };
  h.free = () => act('free', i); h.damage = (amt, part, dir, point, shooter) => { if (shooter === 'player') { act('hit', 'h', i, Math.round(amt), part, +dir.x.toFixed(2), +dir.y.toFixed(2), +dir.z.toFixed(2)); G.hooks.civilianHit && G.hooks.civilianHit(h); } };
}
const nearestPlayerDir = p => { let best = V3(0, 0, 1), bd = 1e9; for (const q of [P.pos, ...[...NET.remotes.values()].map(r => r.pos)]) { const d = q.distanceTo(p); if (d < bd) { bd = d; best = p.clone().sub(q).setY(0.2).normalize(); } } return best; };
function setEnemyState(e, code) {
  const ns = ST_E[code] || 'idle'; if (e.state === ns) return; const was = e.state;
  if (ns === 'dead') { if (e.alive) Enemy.prototype.die.call(e, nearestPlayerDir(e.pos), null, 'torso', 'net', 40); return; }
  if (ns === 'surrender') { e.state = 'combat'; Enemy.prototype.surrender.call(e); return; }
  if (ns === 'arrested') { if (e.state !== 'surrender' && e.state !== 'stunned') e.state = 'surrender'; Enemy.prototype.arrest.call(e); return; }
  e.state = ns; e.anim.mode = ns === 'stunned' ? 'stun' : ns === 'shield' ? 'shield' : 'normal';
  if (ns === 'stunned' && was !== 'stunned') e.say('Argh! My eyes!', { force: true, cd: 3 });
  if (ns === 'combat' && (was === 'idle' || was === 'patrol' || was === 'suspicious')) e.say(['Contact!', 'They are here!', 'Get them!'][Math.floor(R() * 3)], { cd: 4 });
}
function setHostageState(h, code) {
  const ns = ST_H[code] || 'restrained'; if (h.state === ns) return;
  if (ns === 'dead') { if (h.alive) Agent.prototype.die.call(h, nearestPlayerDir(h.pos), null, 'torso', 'net', 25); return; }
  if (ns === 'rescued') { if (!h.hidden) { h.state = 'rescued'; h.remove(); G.hooks.hostageRescued && G.hooks.hostageRescued(h); } return; }
  if (ns === 'freed') { if (h.state === 'restrained' || h.state === 'shield' || h.state === 'pinned') { h.state = 'restrained'; Hostage.prototype.free.call(h, true); } h.state = 'freed'; return; }
  h.state = ns; h.anim.mode = ns === 'shield' ? 'tied' : ns === 'restrained' || ns === 'pinned' ? 'restrained' : 'normal';
}
function applyWorld(w) {
  if (!w) return;
  w.e.forEach((a, i) => { let e = G.enemies[i]; if (!e) { e = spawnWaveEnemy(V3(a[0] / 20, 0, a[1] / 20), V3(a[0] / 20, 0, a[1] / 20 + 1), { heavy: !!(a[4] & 2) }); patchEnemy(e, i); }
    e.net.x = a[0] / 20; e.net.z = a[1] / 20; e.net.yaw = a[2] / 100; setEnemyState(e, a[3]); e.wantCrouch = !!(a[4] & 1); e.net.aim = (a[4] & 4) ? 1 : 0;
    if (e._shotSeen === undefined) e._shotSeen = a[5]; else if (a[5] !== e._shotSeen) { const n = (a[5] - e._shotSeen + 1024) % 1024; e._shotSeen = a[5]; if (n > 0 && n < 30 && e.alive) puppetShot(e); } });
  w.h.forEach((a, i) => { const h = G.hostages[i]; if (!h) return; h.net.x = a[0] / 20; h.net.z = a[1] / 20; h.net.yaw = a[2] / 100; h.net.cower = !!a[4]; setHostageState(h, a[3]); });
  w.d.forEach((a, i) => { const d = doors[i]; if (!d) return; d.locked = !!(a[1] & 1); if ((a[1] & 2) && !d.broken) d.blow(d.center.clone().add(V3(0.6, 0, 0.6))); if (!d.broken && Math.abs(d.target - a[0] / 100) > 0.05 && G.time - (d._localT || -9) > 1.2) d.target = a[0] / 100; });
  [...(w.u || '')].forEach((c, i) => { const it = interactables[i]; if (!it || it.used || c !== '1') return; it.used = true; if (it.obj && it.kind !== 'bomb' && it.kind !== 'task' && it.kind !== 'console') it.obj.visible = false; });
  (w.b || []).forEach((a, i) => { const b = bombs()[i]; if (!b) return; if (b.wires && a[1] > b.cut.length) b.cut = b.wires.slice(0, a[1]).map(x => x.k); if (a[0] && !b.defused) { b.defused = true; b.used = true; G.defusing && MS.curBomb === b && G.hooks.defuse && G.hooks.defuse(false); G.defusing = false; A.beep(true); } });
  [...(w.c || '')].forEach((c, i) => { const cam = lights.cams[i]; if (!cam) return; const alive = !!(+c & 1), off = !!(+c & 2); if (cam.alive && !alive) { cam.alive = false; cam.cone.visible = false; cam.led.visible = false; cam.head.rotation.z = 0.9; } if (off && !cam.off) { cam.off = true; cam.cone.visible = false; cam.led.visible = false; } });
  const m = w.m; if (Math.abs(MS.timer - m[0]) > 1.5) MS.timer = m[0];
  if (!!m[1] !== !!MS.alarm) { MS.alarm = !!m[1]; A.alarm(MS.alarm); if (MS.alarm) { G.stats.alarm = true; G.hooks.banner && G.hooks.banner('ALARM', 'Enemy alert'); } }
  if (m[2] && !MS.carried) { MS.carried = true; A.pickup(); G.hooks.toast && G.hooks.toast('Item team er kache · extraction e jao'); LV.onItem && LV.onItem(); }
  if (m[3] && !MS.intel) { MS.intel = true; G.hooks.toast && G.hooks.toast('Intel: bomb er wire order paowa gese'); }
  if (m[4]) MS.revealT = Math.max(MS.revealT || 0, 0.5); MS.waveIdx = m[5];
  for (const id of w.k || []) if (!MS.done.has(id)) { MS.done.add(id); const it = interactables.find(x => x.id === id); if (it) { it.used = true; it.onUse && it.onUse(); G.hooks.toast && G.hooks.toast(it.done || 'Done'); } A.beep(true); }
}
function puppetShot(e) {
  const mz = e.muzzleWorld(); FX.muzzle(mz, 1); e.anim.recoil = 1;
  let tgt = null, bd = 40; const f = e.forward(); for (const q of [V3(P.pos.x, P.pos.y + 1.3, P.pos.z), ...[...NET.remotes.values()].map(r => r.chestPos)]) { const to = q.clone().sub(mz); const d = to.length(); if (d < bd && to.setY(0).normalize().dot(f) > 0.6) { bd = d; tgt = q; } }
  const end = tgt ? tgt.clone().add(V3(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(1.2)) : mz.clone().addScaledVector(f, 30);
  FX.tracer(mz, end, '#ffcf80'); A.shot(e.pistol ? 'pistol' : 'ak', mz, !los(G.camera.position, mz));
}
export function puppetUpdate(a, dt) {
  const n = a.net; if (!n) return; const tp = V3(n.x, 0, n.z); const d = a.pos.distanceTo(tp);
  if (d > 4) a.pos.copy(tp); else a.pos.lerp(tp, 1 - Math.exp(-dt * 9));
  a.yaw += angDiff(a.yaw, n.yaw) * Math.min(1, dt * 10); a.flinch = Math.max(0, (a.flinch || 0) - dt); a.anim.recoil = Math.max(0, (a.anim.recoil || 0) - dt * 8); a.voiceCd -= dt;
  const sp = d / Math.max(dt, 1e-3); a.anim.speed = damp(a.anim.speed, clamp(sp, 0, 4.5), 7, dt);
  if (a.kind === 'enemy') { a.anim.aim = damp(a.anim.aim, n.aim ?? 0, 6, dt); a.anim.crouch = a.wantCrouch ? 1 : 0; }
  else { if (a.state === 'restrained' || a.state === 'pinned') { a.anim.mode = 'restrained'; a.anim.headDown = 0.3; } else if (a.state === 'freed') { a.anim.mode = n.cower ? 'cover' : 'normal'; a.anim.crouch = n.cower ? 1 : 0.25; a.m.tieMat && (a.m.tieMat.visible = false); } }
  a.root.position.copy(a.pos); a.root.rotation.y = a.yaw; a.kb.position.set(a.pos.x, 0.75, a.pos.z); animate(a.m, a.anim, dt);
}

/* ===================== death, revive, respawn ===================== */
export function onPlayerDied() {
  G.hooks.banner && G.hooks.banner('YOU ARE DOWN', 'Teammate kache eshe F hold korle revive · 25s por respawn'); NET.deadUntil = performance.now() + 25000; NET.sendT = 0;
}
function respawn(inPlace) {
  if (P.alive || MS.ended) return; P.alive = true; P.hp = inPlace ? 60 : 100; P.deathT = 0; P.armor = Math.max(P.armor, 40); P.hurtT = 0; NET.deadUntil = 0;
  if (!inPlace) { const s = LV.spawns[G.entry]; P.pos.copy(s.pos); P.yaw = s.yaw; } P.pos.y = 0; P.vel.set(0, 0, 0);
  G.hooks.toast && G.hooks.toast(inPlace ? 'Teammate tomake revive korlo' : 'Respawn hoyecho'); G.hooks.banner && G.hooks.banner(inPlace ? 'REVIVED' : 'RESPAWN', '');
}

/* ===================== per-frame ===================== */
export function netTick(dt) {
  if (!NET.on || !NET.room) return;
  NET.sendT -= dt; NET.snapT -= dt;
  const playing = G.state === 'playing' || G.state === 'paused';
  if (NET.client) {
    const hp = hostPeer(); const hpres = hp && hp.presence;
    if (!hp) { if (NET.inMission && !MS.ended) { G.hooks.toast && G.hooks.toast('Host chole geche'); G.hooks.mpHostGone && G.hooks.mpHostGone(); } }
    else {
      const g = hpres.g || {};
      if (g.st === 'play' && g.gen && g.gen !== NET.genSeen && !NET.loading) { NET.loading = true; G.hooks.mpStart && G.hooks.mpStart(g); }
      if (g.st === 'lobby' && NET.inMission && !MS.ended && playing) { G.hooks.toast && G.hooks.toast('Host mission bondho korlo'); G.hooks.mpHostGone && G.hooks.mpHostGone(); }
      if (NET.inMission && playing && g.gen === NET.genSeen && hpres !== NET.lastHostPres) { NET.lastHostPres = hpres;
        applyWorld(hpres.w); applyEvents(hpres.ev || []);
        const mine = myPeer(); const tot = (hpres.dm || {})['p' + mine] || 0; if (tot > NET.dmSeen) { const delta = tot - NET.dmSeen; NET.dmSeen = tot; damagePlayer(delta, null); } }
    }
  }
  if (NET.inMission && playing) syncRemotes();
  if (NET.inMission && playing && !P.alive && NET.deadUntil && performance.now() > NET.deadUntil) respawn(false);
  if (NET.host && NET.inMission && playing && !MS.ended && !P.alive && NET.remotes.size && !anyRemoteAlive()) { NET.wipeT = (NET.wipeT || 0) + dt; if (NET.wipeT > 2.5) G.hooks.mpWipe && G.hooks.mpWipe(); } else NET.wipeT = 0;
  // send my presence
  if (NET.sendT <= 0) { NET.sendT = playing ? 0.05 : 0.5;
    const patch = { a: NET.acts };
    if (playing && NET.inMission) { const yaw = P.yaw, pitch = P.pitch; patch.p = [+P.pos.x.toFixed(2), +P.pos.y.toFixed(2), +P.pos.z.toFixed(2), +yaw.toFixed(2), +pitch.toFixed(2)];
      patch.f = (P.crouchT > 0.5 ? 1 : 0) | (P.alive ? 2 : 0) | (P.adsT > 0.5 ? 4 : 0) | (P.moving ? 8 : 0) | (P.cur === 'pistol' ? 32 : 0); patch.hp = Math.max(0, Math.round(P.hp)); patch.sh = NET.shotN % 1024; patch.sd = NET.shotDir; }
    if (NET.host) { patch.ev = NET.evs; patch.dm = NET.dm; if (NET.inMission && playing && NET.snapT <= 0) { NET.snapT = 0.1; patch.w = encodeWorld(); } }
    if (JSON.stringify(patch).length > 3200) { if (patch.ev) patch.ev = patch.ev.slice(-5); if (patch.a) patch.a = patch.a.slice(-6); delete patch.sd; }
    NET.room.presence(patch).catch(() => { });
  }
  if (NET.host && (NET.advT = (NET.advT || 0) - dt) <= 0) { NET.advT = 3; advertise(); }
}
// the local player fired: count it so the others can draw the shot
export function noteShot(dir) { if (!NET.on) return; NET.shotN = (NET.shotN + 1) % 1024; NET.shotDir = [+dir.x.toFixed(2), +dir.y.toFixed(2), +dir.z.toFixed(2)]; }

/* ===================== hook wiring (called once after installHooks) ===================== */
export function installNetHooks() {
  const H = G.hooks;
  const flashOrig = H.flashbang, smokeOrig = H.smoke, blastOrig = H.breachBlast, diedOrig = H.agentDied, taskO = H.task, itemO = H.item, consoleO = H.console, intelO = H.intel, yellO = H.yell, cmdO = H.command, camO = H.cameraShot, playerDiedO = H.playerDied;
  H._flashHost = p => flashOrig(p); H._smokeHost = p => smokeOrig(p); H._smokeLocal = p => smokeOrig(p);
  H.flashbang = p => { if (NET.client) act('flash', +p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)); else { flashOrig(p); if (NET.host) pushEv('flash', +p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2), myPeer()); } };
  H.smoke = p => { smokeOrig(p); if (NET.client) act('smoke', +p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)); else if (NET.host) pushEv('smoke', +p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2), myPeer()); };
  H.breachBlast = (door, from) => { if (NET.client) return; blastOrig(door, from); if (NET.host) pushEv('blast', doors.indexOf(door), +from.x.toFixed(2), +from.z.toFixed(2)); };
  H.agentDied = (ag, shooter, part) => {
    if (NET.client && !(ag instanceof RemoteOp)) { if (ag.kind === 'hostage') G.stats.hostagesDead++; return; }
    diedOrig(ag, shooter, part);
    if (NET.host) { const by = shooter === 'player' ? (NET.name || 'HOST').toUpperCase() : shooter && shooter.kind === 'team' ? shooter.name.toUpperCase() : shooter === 'hawk' ? 'HAWK' : ag.kind === 'hostage' ? 'HOSTILE' : '—';
      pushEv('kf', by, ag.kind === 'hostage' ? 'HOSTAGE' : ag.traitor ? 'TRAITOR' : ag.leader ? 'LEADER' : 'GUNMAN', part === 'head' ? 1 : 0, ag.kind === 'hostage' ? 1 : 0); }
  };
  const itIdx = it => interactables.indexOf(it);
  H.task = it => { if (NET.client) { act('task', itIdx(it)); A.beep(true); } else taskO(it); };
  H.item = it => { if (NET.client) { act('item', itIdx(it)); it.obj.visible = false; A.pickup(); } else itemO(it); };
  H.console = it => { if (NET.client) act('console', itIdx(it)); else consoleO(it); };
  H.intel = it => { if (NET.client) { act('intel', itIdx(interactables.find(x => x.kind === 'intel' && x.used) || it)); } intelO(it); };
  H.pickupShared = it => { if (NET.client) act('pick', itIdx(it)); };
  H.cameraShot = hb => { if (NET.client) { const i = lights.cams.findIndex(c => c.hb === hb); if (i >= 0) act('cam', i); } camO(hb); };
  H.yell = () => { if (NET.client) { if ((MS.yellCd || 0) > G.time) return; MS.yellCd = G.time + 1.6; VO.say(NET.name.toUpperCase(), ['Police! Drop your weapon!', 'Tiger 24! Get on the ground!', 'Hands up! Do it now!'][Math.floor(R() * 3)], { radio: false, prio: true, pitch: 0.9, rate: 1.15 }); act('yell', +P.pos.x.toFixed(2), +P.pos.z.toFixed(2)); return; } yellO(); };
  H.command = name => {
    if (NET.on && (name === 'mark' || name === 'scan' || name === 'follow')) { G.hooks.toast && G.hooks.toast('Co-op e AI squad nei · tomar team e ashol player'); return; }
    if (NET.client && name === 'breach') { const dir = new THREE.Vector3(); G.camera.getWorldDirection(dir); let best = null, bs = 0;
      for (const d of doors) { if (d.broken) continue; const to = d.center.clone().sub(G.camera.position); const dist = to.length(); if (dist > 2.6) continue; const dot = to.normalize().dot(dir); if (dot > 0.75 && dot > bs) { bs = dot; best = d; } }
      if (!best) { G.hooks.toast('Charge lagate door er kache giye takao'); return; } if (P.charges <= 0) { G.hooks.toast('Breach charge nei'); return; }
      P.charges--; A.mech('pin'); act('breach', doors.indexOf(best), +P.pos.x.toFixed(2), +P.pos.z.toFixed(2)); G.hooks.toast('Charge lagano holo · 3 second · dure shoro!'); return; }
    cmdO(name);
  };
  H.playerDied = () => { if (NET.on && NET.inMission) { onPlayerDied(); if (NET.host && !NET.remotes.size) playerDiedO(); return; } playerDiedO(); };
  H.netEndHost = (ok, reason, sub) => { if (NET.host && NET.inMission) pushEv('end', ok ? 1 : 0, reason || '', sub || ''); };
  H.netAct = act; H.shotFired = noteShot;
}
