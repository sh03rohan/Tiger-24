// Tiger 24 — boot, screen flow (splash → lobby → planning → mission → debrief), main loop
import { THREE, G, PI, $, esc, store, A, VO, FX, initGraphics, applyQuality, renderer, clamp, V3 } from './core.js';
import { initTextures, setAnimTime, TEX } from './assets.js';
import { updateLevel, LV, unloadLevel, colliders, doors, rooms, lights, buildNav } from './levelkit.js';
import { initPlayer, updatePlayer, P, requestLock, releaseLock, applyLoadout, PRIMARIES, SECONDARIES } from './player.js';
import { updateRagdolls, clearAgents } from './ai.js';
import { startMission, updateMission, installHooks, MS, cutWire, closeDefuse, fmt, PROFILE, saveProfile, rankInfo, missionStatus, CUR, failMission } from './mission.js';
import { initHUD, updateHUD, defuseUpdate, buildMapImage } from './hud.js';
import { MISSIONS } from './missions/index.js';
import { LOBBY, buildLobby, setLobbyCam, showLobby, updateLobby, missionArt, SQUAD_INFO, tagPositions } from './lobby.js';
import { NET, COLORS, connect, available, relayUrl, hostGame, joinGame, leaveGame, openGames, players, hostPeer, setReady, updateSetup, setProfile, onMissionStart, onMissionLeave, netTick, puppetUpdate, installNetHooks } from './net.js';

const ARTS = {}; let selMission = null, plan = { entry: null, diff: store.get('diff', 'veteran') }, focusOp = null, menuIdx = 0, loTab = 'primary';
const SCREENS = ['splash', 'lobbyUI', 'planning', 'hud', 'pause', 'debrief', 'loading'];
function show(id) {
  for (const s of SCREENS) { const el = $(s); if (el) el.hidden = s !== id && !(id === 'lobbyUI' && s === 'lobbyUI'); }
  $('touch').hidden = !(id === 'hud' && G.mobile); $('tags').hidden = id !== 'lobbyUI';
}

/* ================= boot ================= */
function boot() {
  initGraphics($('view')); FX.init(); VO.init(); initTextures(); buildLobby(); initPlayer(); installHooks(); installNetHooks(); initHUD();
  applyLoadout(PROFILE.loadout); syncLobbyLoadout();
  MISSIONS.forEach(m => ARTS[m.meta.id] = missionArt(m.meta.art));
  G.hooks.cut = cutWire; G.hooks.defuseUpdate = defuseUpdate;
  G.hooks.defuse = on => { $('defuse').hidden = !on; if (on) defuseUpdate(); };
  G.hooks.pause = pause; G.hooks.debrief = debrief; G.hooks.levelReady = () => { buildMapImage(); const op = document.querySelector('#hud .op'); if (op && CUR) op.textContent = CUR.meta.name.toUpperCase(); };
  G.hooks.mpStart = g => mpClientStart(g); G.hooks.mpHostGone = () => backToLobby(); G.hooks.mpWipe = () => failMission('Puro team down', 'Shob operator KIA.');
  G.hooks.mpRefresh = () => { if (G.state === 'lobby' && LOBBY.screen === 'multi') renderMulti(); };
  window.addEventListener('keydown', onKey);
  setupLobbyUI(); setupPlanning(); setupPause(); setupDebrief();
  $('rotate').addEventListener('click', () => $('rotate').classList.add('off'));
  G.state = 'splash'; showLobby(true); setLobbyCam('splash', true); show('splash');
  $('splash').addEventListener('click', enterLobby);
  const h = location.hash.slice(1); if (h === 'unlock') G.unlockAll = true;
  $('boot').hidden = true;
  requestAnimationFrame(loop);
}
function onKey(e) {
  if (G.state === 'splash') { enterLobby(); e.preventDefault(); return; }
  if (G.state === 'playing' && G.defusing) { const i = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code); if (i >= 0) { e.preventDefault(); cutWire(i); } if (e.code === 'KeyF' || e.code === 'Escape') closeDefuse(); return; }
  if (G.state === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) { resume(); return; }
  if (G.state === 'lobby') {
    if (e.code === 'Escape' && LOBBY.screen !== 'main') { A.ui(); goLobby('main'); return; }
    if (LOBBY.screen === 'main') { if (e.code === 'ArrowDown' || e.code === 'ArrowUp') { e.preventDefault(); setMenu((menuIdx + (e.code === 'ArrowDown' ? 1 : MENU.length - 1)) % MENU.length); $('menu').children[menuIdx].focus({ preventScroll: true }); } }
    if (LOBBY.screen === 'campaign' && (e.code === 'ArrowRight' || e.code === 'ArrowLeft')) { const i = MISSIONS.findIndex(m => m.meta.id === selMission); const n = clamp(i + (e.code === 'ArrowRight' ? 1 : -1), 0, MISSIONS.length - 1); selMission = MISSIONS[n].meta.id; A.ui(); renderCampaign(); }
  }
  if (G.state === 'planning' && e.code === 'Escape') backToLobby();
}
// phones: go fullscreen and lock to landscape where the browser allows it (Android Chrome); iOS shows the rotate hint instead
function tryLandscape() {
  if (!G.mobile) return;
  try { const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen; const lock = () => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } };
    if (req && !(document.fullscreenElement || document.webkitFullscreenElement)) { const r = req.call(el, { navigationUI: 'hide' }); if (r && r.then) r.then(lock).catch(() => { }); else lock(); } else lock(); } catch (e) { }
}
function enterLobby() { if (G.state !== 'splash') return; tryLandscape(); A.init(); A.startAmbience(); A.setVol(); $('splash').classList.add('out'); setTimeout(() => { $('splash').hidden = true; $('splash').classList.remove('out'); }, 700); G.state = 'lobby'; show('lobbyUI'); goLobby('main'); }

/* ================= lobby UI ================= */
const MENU = [
  { id: 'campaign', t: 'Campaign', s: '16 ta mission · Black Crescent ar Red Tide' }, { id: 'quick', t: 'Continue', s: 'Porer unlock hoya mission e shoja' },
  { id: 'multi', t: 'Multiplayer', s: 'Bondhuder sathe co-op · 2-4 jon' }, { id: 'squad', t: 'Squad', s: '3 jon teammate bachai korun' }, { id: 'loadout', t: 'Loadout', s: 'Gun, sidearm, gadget ar camo' }, { id: 'settings', t: 'Settings', s: 'Graphics, sound, controls' },
];
function setupLobbyUI() {
  const menu = $('menu'); MENU.forEach((m, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'mi'; b.innerHTML = `<span class="t">${m.t}</span><span class="s">${m.s}</span>`;
    b.addEventListener('mouseenter', () => setMenu(i)); b.addEventListener('focus', () => setMenu(i, true)); b.addEventListener('click', () => pickMenu(i)); menu.appendChild(b); });
  document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { A.ui(); goLobby(b.dataset.go); }));
  $('crumbBack').addEventListener('click', () => { A.ui(); goLobby('main'); });
  for (const id of ['shadow', ...SQUAD_INFO.map(s => s.id)]) { const d = document.createElement('div'); d.className = 'ntag' + (id === 'shadow' ? ' you' : ''); d.id = 'tag-' + id; const s = SQUAD_INFO.find(x => x.id === id); d.innerHTML = id === 'shadow' ? '<b>SHADOW</b><span>You · Assault</span>' : `<b>${s.name.toUpperCase()}</b><span>${esc(s.role)}</span>`; $('tags').appendChild(d); }
  renderProfile();
}
function setMenu(i, silent) { if (menuIdx === i && $('menu').children[i].classList.contains('on')) return; menuIdx = i; [...$('menu').children].forEach((c, j) => c.classList.toggle('on', j === i)); if (!silent) A.ui(); }
function pickMenu(i) { const m = MENU[i]; A.ui(); if (m.id === 'quick') { const idx = MISSIONS.findIndex((x, k) => missionStatus(k) === 'new'); openPlanning(MISSIONS[idx >= 0 ? idx : 0].meta.id); return; } goLobby(m.id); }
function goLobby(id) {
  LOBBY.screen = id; setLobbyCam(id);
  for (const s of ['main', 'campaign', 'multi', 'squad', 'loadout', 'settings']) $('s-' + s).hidden = s !== id;
  $('crumb').innerHTML = id === 'main' ? 'Lobby / <b>Main</b>' : `Lobby / <b>${id[0].toUpperCase() + id.slice(1)}</b>`; $('crumbBack').hidden = id === 'main';
  if (id === 'campaign') { if (!selMission) { const idx = MISSIONS.findIndex((x, k) => missionStatus(k) === 'new'); selMission = MISSIONS[idx >= 0 ? idx : 0].meta.id; } renderCampaign(); }
  if (id === 'multi') renderMulti(); if (id === 'squad') renderSquad(); if (id === 'loadout') renderLoadout(); if (id === 'settings') renderSettings($('lobbySettings'));
  if (id === 'main') { setMenu(menuIdx, true); renderProfile(); }
  $('shade').style.opacity = id === 'squad' ? 0.55 : 1;
}
function renderProfile() {
  const r = rankInfo(); const done = MISSIONS.filter(m => (PROFILE.missions[m.meta.id] || {}).done).length; const stars = MISSIONS.reduce((a, m) => a + ((PROFILE.missions[m.meta.id] || {}).stars || 0), 0);
  $('pfRank').textContent = `${r.rank} · Lvl ${r.lvl} · ${r.into} / 1000 XP`; $('pfXp').style.width = (r.into / 10) + '%'; $('pfMissions').textContent = `${done}/${MISSIONS.length}`; $('pfStars').innerHTML = `${stars}<span style="color:var(--gold);font-size:14px">★</span>`;
  const next = MISSIONS.find((m, k) => missionStatus(k) === 'new'); $('motdTitle').textContent = next ? `${next.meta.name}` : 'Campaign complete'; $('motdText').textContent = next ? next.meta.intel : 'Shob mission shesh! Elite difficulty te 3 star er chesta korun.';
}
function renderCampaign() {
  $('cards').innerHTML = MISSIONS.map((m, i) => { const st = missionStatus(i), rec = PROFILE.missions[m.meta.id] || {}; const stars = rec.stars || 0;
    return `<button type="button" class="card ${st === 'lock' ? 'lock' : ''} ${m.meta.id === selMission ? 'on' : ''}" data-id="${m.meta.id}"><div class="art" style="background-image:url(${ARTS[m.meta.id]})"></div><span class="st ${st}">${st === 'done' ? 'COMPLETE' : st === 'new' ? 'NEW' : 'LOCKED'}</span>
    <div class="body"><div class="no">MISSION ${m.meta.no} · ${esc(m.meta.diff.toUpperCase())}</div><div class="nm">${esc(m.meta.name.replace('Operation ', ''))}</div><div class="meta"><span>${esc(m.meta.type)}</span><span class="stars">${'★'.repeat(stars)}<i>${'★'.repeat(3 - stars)}</i></span></div></div></button>`; }).join('');
  $('cards').querySelectorAll('.card').forEach(c => c.addEventListener('click', () => { selMission = c.dataset.id; A.ui(); renderCampaign(); }));
  const i = MISSIONS.findIndex(m => m.meta.id === selMission), m = MISSIONS[i].meta, st = missionStatus(i), rec = PROFILE.missions[m.id] || {};
  $('brief').innerHTML = `<div class="art" style="background-image:url(${ARTS[m.id]})${st === 'lock' ? ';filter:grayscale(1) brightness(.5)' : ''}"></div>
    <div><div class="h-eyebrow">Mission ${m.no} · ${esc(m.type)}</div><h2>${esc(m.name)}</h2></div>
    <div class="kv"><div><span>Location</span>${esc(m.loc)}</div><div><span>Time · weather</span>${esc(m.time)}</div><div><span>Difficulty</span>${esc(m.diff)}</div><div><span>Best</span>${rec.best ? rec.best + ' · ' + (rec.grade || '') : '—'}</div></div>
    <ul class="obj">${m.obj.map(o => `<li>${esc(o)}</li>`).join('')}</ul><p class="intel"><b>COMMANDER RAFI · INTEL</b>${esc(m.intel)}</p>
    ${st === 'lock' ? `<div class="lockmsg">🔒 ${esc(MISSIONS[i - 1].meta.name)} complete korle unlock hobe.</div>` : ''}
    <div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn pri" id="startBtn" ${st === 'lock' ? 'disabled' : ''}>Mission planning</button><button type="button" class="btn" id="toSquad">Squad</button></div>`;
  const sb = $('startBtn'); if (sb) sb.addEventListener('click', () => openPlanning(m.id)); $('toSquad').addEventListener('click', () => { A.ui(); goLobby('squad'); });
  const on = document.querySelector('.card.on'); on && on.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
}
function renderSquad() {
  const picked = PROFILE.squad; $('sqCount').textContent = picked.length;
  $('sqCards').innerHTML = SQUAD_INFO.map(s => `<button type="button" class="mem ${picked.includes(s.id) ? 'on' : ''}" data-id="${s.id}" aria-pressed="${picked.includes(s.id)}"><div class="top-r"><span class="nm">${esc(s.name.toUpperCase())}</span><span class="chk">${picked.includes(s.id) ? '✓' : ''}</span></div><div class="role">${esc(s.role)}</div><div class="ab">${esc(s.ability)}</div>
    <div class="bars">${Object.entries(s.stats).map(([k, v]) => `<div>${k}<s><i style="width:${v}%"></i></s></div>`).join('')}</div></button>`).join('');
  $('sqCards').querySelectorAll('.mem').forEach(b => { b.addEventListener('mouseenter', () => { focusOp = b.dataset.id; }); b.addEventListener('mouseleave', () => { focusOp = null; });
    b.addEventListener('click', () => { const id = b.dataset.id; let p = PROFILE.squad; if (p.includes(id)) p = p.filter(x => x !== id); else { if (p.length >= 3) p.shift(); p.push(id); } PROFILE.squad = p; saveProfile(); A.ui(); renderSquad(); }); });
}
const GADGETS = { flash: { name: 'Flashbang × 2', desc: 'G · enemy 4-5 second dekhte pay na' }, charge: { name: 'Breach charge × 2', desc: 'T · Bolt na thakle nijei door urao' }, smoke: { name: 'Smoke × 2', desc: 'J · dhoar porda, enemy dekhte pay na' }, med: { name: 'Extra medkit', desc: 'H · 2 ta medkit niye shuru' } };
const CAMOS = { multicam: 'Multicam', night: 'Night', urban: 'Urban', woodland: 'Woodland', desert: 'Desert' };
function syncLobbyLoadout() { const lo = PROFILE.loadout; LOBBY.shadow.setWeapon(lo.primary); LOBBY.shadow.setCamo(lo.camo); }
function renderLoadout() {
  const lo = PROFILE.loadout; const tabs = [['primary', 'Primary'], ['secondary', 'Sidearm'], ['gadgets', 'Gadgets'], ['camo', 'Camo']];
  $('loTabs').innerHTML = tabs.map(([k, l]) => `<button type="button" role="tab" class="${k === loTab ? 'on' : ''}" data-k="${k}">${l}</button>`).join('');
  $('loTabs').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { loTab = b.dataset.k; A.ui(); renderLoadout(); }));
  const statsOf = w => ({ Damage: Math.min(100, Math.round((w.dmg || 5) * (w.pellets || 1) * 0.95)), Accuracy: Math.round(100 - w.spread * 1500), Range: w.pellets ? 20 : Math.round(100 - w.adsSpread * 12000), Mobility: w.kind === 'k9' ? 90 : w.kind === 'm80' ? 38 : w.kind === 'b12' ? 66 : w.kind === 'pistol' ? 95 : 60, Control: Math.round(100 - w.recoil * 1600) });
  let html = '';
  if (loTab === 'primary') html = Object.entries(PRIMARIES).map(([k, w]) => `<button type="button" class="item ${k === lo.primary ? 'on' : ''}" data-k="${k}"><b>${esc(w.name)}</b><span>${w.cal} · ${w.max} round · ${w.auto ? 'auto' : 'semi'}${w.suppressed ? ' · suppressed' : ''}</span><em>${k === lo.primary ? 'EQUIPPED' : 'EQUIP'}</em></button>`).join('');
  if (loTab === 'secondary') html = Object.entries(SECONDARIES).map(([k, w]) => `<button type="button" class="item ${k === lo.secondary ? 'on' : ''}" data-k="${k}"><b>${esc(w.name)}</b><span>${w.taser ? 'Non-lethal · enemy 7 second stun · arrest er jonno' : `${w.cal} · ${w.max} round`}</span><em>${k === lo.secondary ? 'EQUIPPED' : 'EQUIP'}</em></button>`).join('');
  if (loTab === 'gadgets') html = Object.entries(GADGETS).map(([k, w]) => `<button type="button" class="item ${lo.gadgets.includes(k) ? 'on' : ''}" data-k="${k}"><b>${esc(w.name)}</b><span>${esc(w.desc)}</span><em>${lo.gadgets.includes(k) ? 'SLOT ' + (lo.gadgets.indexOf(k) + 1) : 'ADD'}</em></button>`).join('');
  if (loTab === 'camo') html = `<div class="swatches">${Object.entries(CAMOS).map(([k, n]) => `<button type="button" class="sw ${k === lo.camo ? 'on' : ''}" data-k="${k}"><i style="background-image:url(${TEX[k].userData.canvas.toDataURL('image/jpeg', 0.6)})"></i>${n}</button>`).join('')}</div>`;
  $('loItems').innerHTML = html;
  $('loItems').querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { const k = b.dataset.k;
    if (loTab === 'primary') lo.primary = k; if (loTab === 'secondary') lo.secondary = k; if (loTab === 'camo') lo.camo = k;
    if (loTab === 'gadgets') { if (lo.gadgets.includes(k)) lo.gadgets = lo.gadgets.filter(x => x !== k); else { if (lo.gadgets.length >= 2) lo.gadgets.shift(); lo.gadgets.push(k); } }
    saveProfile(); applyLoadout(lo); syncLobbyLoadout(); A.mech('switch'); renderLoadout(); }));
  const w = PRIMARIES[lo.primary], s2 = SECONDARIES[lo.secondary];
  $('loStats').innerHTML = `<div class="rowx"><span>${esc(w.name)}</span><span>${esc(w.cal)}</span></div><div class="bars">${Object.entries(statsOf(w)).map(([k, v]) => `<div>${k}<s><i style="width:${clamp(v, 5, 100)}%"></i></s><u>${clamp(v, 5, 100)}</u></div>`).join('')}</div>
    <div class="small">Sidearm: ${esc(s2.name)} · Gadget: ${lo.gadgets.map(g => esc(GADGETS[g].name)).join(', ') || 'none'} · Camo: ${CAMOS[lo.camo]}</div>`;
}
function renderSettings(box) {
  const S = G.settings;
  const rng = (k, label, min, max, step, fv = v => v) => `<label class="srow"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${S[k]}" data-k="${k}"><output>${fv(S[k])}</output></label>`;
  const seg = (k, label, opts) => `<div class="srow"><span>${label}</span><div class="seg" data-k="${k}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${String(S[k]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div></div>`;
  box.innerHTML = rng('sens', 'Mouse sensitivity', 0.2, 3, 0.05, v => (+v).toFixed(2)) + rng('fov', 'Field of view', 60, 100, 1) + rng('volume', 'Master volume', 0, 100, 1) + rng('music', 'Ambience', 0, 100, 1)
    + seg('quality', 'Graphics', [['low', 'Low'], ['medium', 'Med'], ['high', 'High'], ['ultra', 'Ultra']]) + seg('voice', 'Voice', [[true, 'On'], [false, 'Off']]) + seg('subs', 'Subtitles', [[true, 'On'], [false, 'Off']]) + seg('invertY', 'Invert Y', [[false, 'Off'], [true, 'On']]);
  box.querySelectorAll('input[type=range]').forEach(r => r.addEventListener('input', () => { const k = r.dataset.k; S[k] = +r.value; r.nextElementSibling.textContent = k === 'sens' ? (+r.value).toFixed(2) : r.value; A.setVol(); store.set('settings', S); }));
  box.querySelectorAll('.seg').forEach(sg => sg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { const k = sg.dataset.k; let v = b.dataset.v; if (v === 'true') v = true; else if (v === 'false') v = false; S[k] = v; store.set('settings', S); if (k === 'quality') applyQuality(); A.ui(); renderSettings(box); })));
}

/* ================= planning ================= */
function setupPlanning() {
  $('diffSeg').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { plan.diff = b.dataset.d; store.set('diff', plan.diff); A.ui(); renderPlan(); }));
  $('deploy').addEventListener('click', deploy); $('planBack').addEventListener('click', backToLobby);
}
function openPlanning(id) {
  selMission = id; show('loading'); $('ldTitle').textContent = MISSIONS.find(m => m.meta.id === id).meta.name; $('ldLoc').textContent = 'Map load hocche…'; $('loading').style.backgroundImage = `url(${ARTS[id]})`;
  setTimeout(() => {
    clearAgents(); const mod = MISSIONS.find(m => m.meta.id === id); const def = mod.build(); for (const k of Object.keys(LV)) delete LV[k]; Object.assign(LV, def); buildNav(def.bounds);
    showLobby(false); plan.entry = Object.keys(LV.spawns).includes(store.get('entry.' + id, '')) ? store.get('entry.' + id) : Object.keys(LV.spawns)[0];
    G.state = 'planning'; show('planning'); renderPlan(); planT = 0;
  }, 60);
}
function renderPlan() {
  const mod = MISSIONS.find(m => m.meta.id === selMission), m = mod.meta;
  $('plEyebrow').textContent = `Tiger 24 · Mission ${m.no} · ${m.time}`; $('plTitle').textContent = m.name; $('plLead').textContent = m.intel;
  $('entries').innerHTML = Object.entries(LV.spawns).map(([k, s]) => `<button type="button" class="entry ${k === plan.entry ? 'on' : ''}" data-k="${k}"><b>${esc(s.label)}</b><span>${esc(s.desc)}</span><em>${esc(s.risk || '')}</em></button>`).join('');
  $('entries').querySelectorAll('.entry').forEach(b => b.addEventListener('click', () => { plan.entry = b.dataset.k; store.set('entry.' + selMission, plan.entry); A.ui(); renderPlan(); }));
  $('diffSeg').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.d === plan.diff));
  const rec = PROFILE.missions[m.id]; $('bestScore').textContent = rec && rec.best ? `Best: ${rec.best} pts · ${'★'.repeat(rec.stars)}${'☆'.repeat(3 - rec.stars)} · ${rec.grade}` : 'Ekhono kono score nei';
  $('diffInfo').textContent = { recruit: 'Enemy dhire react kore, kom damage, beshi shomoy.', veteran: 'Balanced.', elite: 'Druto, nikhut enemy. Armor kom. Shomoy kom.' }[plan.diff];
  $('plObjs').innerHTML = m.obj.map(o => `<li>${esc(o)}</li>`).join('');
  $('plSquad').innerHTML = PROFILE.squad.map(id => { const s = SQUAD_INFO.find(x => x.id === id); return `<div><b>${s.name.toUpperCase()}</b><span>${esc(s.role)}${id === 'hawk' && !LV.hawk ? ' · ei mission e nei' : ''}</span></div>`; }).join('');
  const lo = PROFILE.loadout; $('plLoadout').textContent = `${PRIMARIES[lo.primary].name} · ${SECONDARIES[lo.secondary].name} · ${lo.gadgets.map(g => GADGETS[g].name).join(', ') || 'gadget nei'}`;
  drawBlueprint();
}
function drawBlueprint() {
  const c = $('blueprint'), g = c.getContext('2d'); const W = c.width, H = c.height; g.fillStyle = '#0a1a24'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(120,190,230,.12)'; g.lineWidth = 1; for (let x = 0; x < W; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  const v = (LV.blueprint && LV.blueprint.view) || [LV.bounds.x0, LV.bounds.z0, LV.bounds.x1, LV.bounds.z1]; const [x0, z0, x1, z1] = v;
  const s = Math.min(W / (x1 - x0), H / (z1 - z0)); const ox = (W - (x1 - x0) * s) / 2, oy = (H - (z1 - z0) * s) / 2; const X = x => ox + (x - x0) * s, Z = z => oy + (z - z0) * s;
  for (const r of rooms) { if (!r.indoor) continue; g.fillStyle = 'rgba(80,160,210,.09)'; g.fillRect(X(r.x1), Z(r.z1), (r.x2 - r.x1) * s, (r.z2 - r.z1) * s); }
  for (const cl of colliders) { if (cl.dyn || cl.max.y < 0.5 || cl.max.x < x0 - 1 || cl.min.x > x1 + 1 || cl.max.z < z0 - 1 || cl.min.z > z1 + 1) continue; g.fillStyle = cl.max.y >= 1.6 ? 'rgba(170,220,250,.85)' : 'rgba(170,220,250,.35)'; g.fillRect(X(cl.min.x), Z(cl.min.z), Math.max(1.5, (cl.max.x - cl.min.x) * s), Math.max(1.5, (cl.max.z - cl.min.z) * s)); }
  for (const d of doors) { g.fillStyle = d.locked ? '#ff8a3a' : '#f2d29a'; g.fillRect(X(d.center.x) - 3, Z(d.center.z) - 3, 6, 6); }
  g.font = '600 10px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.fillStyle = 'rgba(200,235,255,.75)';
  for (const r of rooms) { if (!r.indoor || r.name === 'Teller area') continue; g.fillText(r.name.toUpperCase(), X((r.x1 + r.x2) / 2), Z((r.z1 + r.z2) / 2) + (r.name === 'Lobby' ? 34 : 0)); }
  for (const [x, z, t, k] of (LV.blueprint && LV.blueprint.markers) || []) {
    if (k === 'h') { g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(X(x), Z(z), 5, 0, PI * 2); g.fill(); if (t) g.fillText(t, X(x), Z(z) - 9); }
    else if (k === 'e') { g.strokeStyle = '#ff5340'; g.lineWidth = 2; g.beginPath(); g.moveTo(X(x) - 4, Z(z) - 4); g.lineTo(X(x) + 4, Z(z) + 4); g.moveTo(X(x) + 4, Z(z) - 4); g.lineTo(X(x) - 4, Z(z) + 4); g.stroke(); if (t) { g.fillStyle = '#ff5340'; g.fillText(t, X(x), Z(z) - 9); } }
    else { g.fillStyle = '#3cff8a'; g.font = '800 13px sans-serif'; g.fillText('◆', X(x), Z(z) + 4); g.font = '600 10px "JetBrains Mono", monospace'; g.fillText(t, X(x), Z(z) + 16); g.fillStyle = 'rgba(200,235,255,.75)'; }
  }
  for (const cam of lights.cams) { g.fillStyle = '#ff7050'; g.beginPath(); g.arc(X(cam.data.pos.x), Z(cam.data.pos.z), 4, 0, PI * 2); g.fill(); }
  const ex = (LV.objectives || []).find(o => o.type === 'extract'); if (ex) { g.strokeStyle = '#3cff8a'; g.setLineDash([6, 4]); g.strokeRect(X(ex.zone.x1), Z(ex.zone.z1), (ex.zone.x2 - ex.zone.x1) * s, (ex.zone.z2 - ex.zone.z1) * s); g.setLineDash([]); }
  for (const [k, sp] of Object.entries(LV.spawns)) { const on = k === plan.entry; g.strokeStyle = on ? '#f29b2b' : 'rgba(242,155,43,.35)'; g.fillStyle = g.strokeStyle; g.lineWidth = on ? 3 : 1.5; g.beginPath(); g.arc(X(sp.pos.x), Z(sp.pos.z), on ? 11 : 8, 0, PI * 2); g.stroke(); g.font = '800 12px "Saira Condensed", sans-serif'; g.fillText(sp.label.toUpperCase(), X(sp.pos.x), Z(sp.pos.z) + 24); }
}
function deploy() {
  tryLandscape(); A.init(); A.startAmbience(); A.setVol(); applyLoadout(PROFILE.loadout);
  G.state = 'playing'; show('hud'); startMission(selMission, plan.entry, plan.diff, NET.on ? [] : PROFILE.squad); G.sway = LV.sway || 0; G.shakeAmb = LV.shake || 0;
  if (NET.on) { MS.netClient = NET.client; onMissionStart(); }
  if (!G.mobile) requestLock();
  setTimeout(() => G.hooks.toast && G.hooks.toast(G.mobile ? 'Bam dike joystick, dane drag kore aim' : 'Screen e click korle mouse lock hobe · Esc = pause'), 500);
}
function backToLobby() {
  if (NET.on && NET.inMission) onMissionLeave();
  G.state = 'lobby'; G.hooks.toastClear && G.hooks.toastClear(); VO.stop(); A.alarm(false); releaseLock(); clearAgents(); unloadLevel(); G.sway = 0; G.shakeAmb = 0; G.defusing = false; $('defuse').hidden = true;
  showLobby(true); show('lobbyUI'); goLobby(NET.on ? 'multi' : LOBBY.screen === 'main' ? 'campaign' : LOBBY.screen); renderProfile();
}

/* ================= pause & debrief ================= */
function pause() { if (G.state !== 'playing') return; G.state = 'paused'; releaseLock(); VO.stop(); show('pause'); renderSettings($('settings')); $('pzTitle').textContent = CUR ? CUR.meta.name : '';
  $('restartBtn').hidden = $('planBtn').hidden = NET.on; $('lobbyBtn').textContent = NET.on ? (NET.host ? 'Mission bondho (shobai lobby te)' : 'Mission chere dao') : 'Lobby'; }
function resume() { if (G.state !== 'paused') return; G.state = 'playing'; show('hud'); if (!G.mobile) requestLock(); }
function restart() { G.state = 'playing'; show('hud'); startMission(selMission, G.entry, G.diff, PROFILE.squad); G.sway = LV.sway || 0; G.shakeAmb = LV.shake || 0; if (!G.mobile) requestLock(); }
function setupPause() {
  $('resumeBtn').addEventListener('click', resume); $('restartBtn').addEventListener('click', restart);
  $('planBtn').addEventListener('click', () => { A.alarm(false); clearAgents(); openPlanning(selMission); });
  $('lobbyBtn').addEventListener('click', backToLobby);
}
function setupDebrief() {
  $('retryBtn').addEventListener('click', restart); $('lobbyBtn2').addEventListener('click', backToLobby);
  $('nextBtn').addEventListener('click', () => { const i = MISSIONS.findIndex(m => m.meta.id === selMission); if (i < MISSIONS.length - 1) { clearAgents(); openPlanning(MISSIONS[i + 1].meta.id); } });
}
function debrief(r) {
  G.state = 'debrief'; releaseLock(); A.alarm(false); show('debrief');
  $('dbTitle').textContent = r.title; $('dbTitle').className = r.ok ? 'ok' : 'bad'; $('dbSub').textContent = r.ok ? `${CUR.meta.name} · ${G.diff} · ${fmt(r.time)} e complete · +${r.xp} XP` : `${r.reason}: ${r.sub} · +${r.xp} XP`;
  $('dbStars').innerHTML = [0, 1, 2].map(i => `<i class="${i < r.stars ? 'on' : ''}">★</i>`).join(''); $('dbGrade').textContent = r.grade; $('dbScore').textContent = r.total; $('dbBest').textContent = r.isBest ? 'Notun best score!' : `Best: ${r.best}`;
  $('dbRows').innerHTML = r.rows.map(([k, v, p]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td><td class="${p < 0 ? 'neg' : p > 0 ? 'pos' : ''}">${p > 0 ? '+' : ''}${p}</td></tr>`).join('');
  const s = G.stats; $('dbStats').innerHTML = [['Shots', s.shots], ['Hits', s.hits], ['Headshot', s.headshots], ['Accuracy', Math.round(r.acc * 100) + '%'], ['Damage taken', Math.round(s.damageTaken)], ['Flashbang', s.flashes], ['Revive', s.revives], ['Alarm', s.alarm ? 'Yes' : 'No']].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
  const i = MISSIONS.findIndex(m => m.meta.id === selMission); $('nextBtn').hidden = !(r.ok && i < MISSIONS.length - 1) || NET.on; $('retryBtn').hidden = NET.on; $('lobbyBtn2').textContent = NET.on ? 'Co-op lobby' : 'Lobby';
  if (r.ok && i === MISSIONS.length - 1) $('dbSub').textContent += ' · CAMPAIGN COMPLETE!';
}

/* ================= co-op multiplayer ================= */
let mpSel = { m: null, d: store.get('diff', 'veteran') }, mpTimer = null;
function mpMissions() { return MISSIONS.filter((m, i) => missionStatus(i) !== 'lock'); }
function mpHostStart() {
  if (!NET.host) return; const id = (NET.game && NET.game.m) || mpSel.m || MISSIONS[0].meta.id; selMission = id;
  show('loading'); $('ldTitle').textContent = MISSIONS.find(m => m.meta.id === id).meta.name; $('ldLoc').textContent = 'Co-op mission load hocche…'; $('loading').style.backgroundImage = `url(${ARTS[id]})`;
  setTimeout(() => { showLobby(false); plan.entry = store.get('entry.' + id, '') || 'auto'; plan.diff = (NET.game && NET.game.d) || mpSel.d; clearAgents(); deploy(); }, 60);
}
function mpClientStart(g) {
  selMission = g.m; plan.entry = g.e; plan.diff = g.d; G.hooks.toastClear && G.hooks.toastClear();
  show('loading'); $('ldTitle').textContent = (MISSIONS.find(m => m.meta.id === g.m) || MISSIONS[0]).meta.name; $('ldLoc').textContent = 'Host mission shuru korse…'; $('loading').style.backgroundImage = `url(${ARTS[g.m]})`;
  setTimeout(() => { showLobby(false); clearAgents(); deploy(); NET.loading = false; if (!G.mobile) setTimeout(() => G.hooks.toast && G.hooks.toast('Screen e click korle mouse lock hobe'), 1500); }, 60);
}
function renderMulti() {
  const box = $('mpBody'); if (!box) return; clearInterval(mpTimer); mpTimer = setInterval(() => { if (G.state === 'lobby' && LOBBY.screen === 'multi') renderMulti(); else clearInterval(mpTimer); }, 1500);
  if (document.activeElement && box.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return; // don't wipe what the player is typing
  const sw = COLORS.map((c, i) => `<button type="button" class="mpc ${i === NET.color ? 'on' : ''}" data-c="${i}" style="--c:${c}" aria-label="Rong ${i + 1}"></button>`).join('');
  const err = NET.error ? `<p class="mperr">${esc(NET.error)}</p>` : '';
  if (!available()) {
    box.innerHTML = `<div class="panel mpwide"><h3>Multiplayer ei jaygay chole na</h3><p class="mpmuted">Co-op er jonno ekta connection lage. Dui upay:</p>
      <ol class="mpol"><li><b>claude.ai</b> te ei game ta open korun ar bondhuder sathe share korun. Shobai ek shathe page ta khulle ekjon host korbe, baki ra code diye join korbe.</li>
      <li>Relay server: Render/Railway e <code>server/</code> deploy korun (README dekhun), tarpor niche tar address din (jemon <code>https://tiger24-relay.onrender.com</code>).</li></ol>
      <div class="mprow"><input id="mpRelay" placeholder="https://tiger24-relay.onrender.com" value="${esc(store.get('relay', ''))}" maxlength="160"><button type="button" class="btn" id="mpRelaySave">Save</button></div></div>`;
    $('mpRelaySave').addEventListener('click', () => { store.set('relay', $('mpRelay').value.trim()); A.ui(); renderMulti(); }); return;
  }
  if (!NET.on) {
    const opts = mpMissions().map(m => `<option value="${m.meta.id}" ${m.meta.id === (mpSel.m || mpMissions()[0].meta.id) ? 'selected' : ''}>${esc(m.meta.no + ' · ' + m.meta.name.replace('Operation ', ''))}</option>`).join('');
    const games = openGames();
    box.innerHTML = `<div class="panel"><h3>Tomar operator</h3><label class="mpl">Callsign<input id="mpName" maxlength="14" value="${esc(NET.name || '')}" placeholder="Shadow"></label><div class="mpl">Rong<div class="mpcs">${sw}</div></div>
      <h3>Game host koro</h3><label class="mpl">Mission<select id="mpMission">${opts}</select></label>
      <div class="mpl">Difficulty<div class="seg" id="mpDiff">${['recruit', 'veteran', 'elite'].map(d => `<button type="button" data-d="${d}" class="${d === mpSel.d ? 'on' : ''}">${d}</button>`).join('')}</div></div>
      <button type="button" class="btn pri" id="mpHost">Host game</button>${err}</div>
      <div class="panel"><h3>Join koro</h3><div class="mprow"><input id="mpCode" maxlength="4" placeholder="CODE" autocomplete="off"><button type="button" class="btn" id="mpJoin">Join</button></div>
      <h3>Khola game ${games.length ? '' : '<span class="mpmuted">· ekhon keu host korche na</span>'}</h3><div class="mpgames">${games.map(g => `<button type="button" class="mpg" data-code="${esc(g.code)}"><b>${esc((g.h || 'Tiger').toUpperCase())}</b><span>${esc(g.m || '')} · ${g.n || 1} jon · ${g.st === 'play' ? 'mission cholche' : 'lobby'}</span><em>${esc(String(g.code).toUpperCase())}</em></button>`).join('')}</div>
      <p class="mpmuted">${NET.transport === 'claude' ? 'Ei artifact je page e khola ache, sekhane thaka shobai ek room e.' : NET.transport === 'relay' ? 'Relay server e connected: ' + esc(relayUrl()) : esc(NET.status || 'Host/join chaple connect hobe.')}</p>
      ${NET.transport === 'claude' ? '' : `<details class="mpmuted"><summary>Relay server</summary><div class="mprow" style="margin-top:8px"><input id="mpRelay" placeholder="https://tiger24-relay.onrender.com" value="${esc(store.get('relay', '') || relayUrl())}" maxlength="160"><button type="button" class="btn" id="mpRelaySave">Save</button></div></details>`}</div>`;
    const saveName = () => setProfile($('mpName').value, NET.color);
    $('mpName').addEventListener('change', saveName);
    box.querySelectorAll('.mpc').forEach(b => b.addEventListener('click', () => { setProfile($('mpName').value, +b.dataset.c); A.ui(); renderMulti(); }));
    $('mpMission').addEventListener('change', e => { mpSel.m = e.target.value; });
    $('mpDiff').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { mpSel.d = b.dataset.d; A.ui(); renderMulti(); }));
    $('mpHost').addEventListener('click', async () => { saveName(); NET.error = ''; A.ui(); mpSel.m = $('mpMission').value; const m = MISSIONS.find(x => x.meta.id === mpSel.m);
      const ok = await hostGame({ m: mpSel.m, d: mpSel.d, mname: m.meta.name }); if (!ok && !NET.error) NET.error = 'Connect kora jay ni'; renderMulti(); });
    const join = async code => { saveName(); NET.error = ''; A.ui(); $('mpBody').querySelector('#mpJoin') && ($('mpJoin').textContent = '…'); await joinGame(code); renderMulti(); };
    $('mpJoin').addEventListener('click', () => join($('mpCode').value)); $('mpCode').addEventListener('keydown', e => { if (e.key === 'Enter') join($('mpCode').value); });
    box.querySelectorAll('.mpg').forEach(b => b.addEventListener('click', () => join(b.dataset.code)));
    const rs = $('mpRelaySave'); if (rs) rs.addEventListener('click', () => { store.set('relay', $('mpRelay').value.trim()); location.reload(); });
    if (!NET.transport && !NET.autoTried) { NET.autoTried = true; connect().then(() => { if (LOBBY.screen === 'multi') renderMulti(); }); }
    return;
  }
  const ps = players(); const g = NET.host ? NET.game : ((hostPeer() || {}).presence || {}).g || {};
  const gm = MISSIONS.find(m => m.meta.id === g.m); const allReady = ps.every(p => p.presence.r === 'h' || p.presence.rd);
  const list = ps.sort((a, b) => (b.presence.r === 'h') - (a.presence.r === 'h')).map(p => `<div class="mpp"><i style="background:${COLORS[(p.presence.c || 0) % COLORS.length]}"></i><b>${esc((p.presence.n || 'Tiger').toUpperCase())}${p.isMe ? ' <small>(tumi)</small>' : ''}</b><span>${p.presence.r === 'h' ? 'HOST' : p.presence.ph === 'play' ? 'MISSION E' : p.presence.rd ? 'READY' : 'WAITING'}</span></div>`).join('');
  const opts = mpMissions().map(m => `<option value="${m.meta.id}" ${m.meta.id === g.m ? 'selected' : ''}>${esc(m.meta.no + ' · ' + m.meta.name.replace('Operation ', ''))}</option>`).join('');
  box.innerHTML = `<div class="panel"><div class="mpcode"><span>GAME CODE</span><b>${esc(String(NET.code).toUpperCase())}</b><small>Bondhuke ei code ta din</small></div><h3>Squad · ${ps.length}/4</h3><div class="mpplist">${list}</div>
      <button type="button" class="btn" id="mpLeave">Leave</button>${err}</div>
    <div class="panel"><h3>Mission</h3>${gm ? `<div class="mpart" style="background-image:url(${ARTS[gm.meta.id]})"><b>${esc(gm.meta.name)}</b><span>${esc(gm.meta.type)} · ${esc(g.d || '')}</span></div>` : ''}
      ${NET.host ? `<label class="mpl">Mission<select id="mpMission">${opts}</select></label><div class="mpl">Difficulty<div class="seg" id="mpDiff">${['recruit', 'veteran', 'elite'].map(d => `<button type="button" data-d="${d}" class="${d === g.d ? 'on' : ''}">${d}</button>`).join('')}</div></div>
      <button type="button" class="btn pri" id="mpStart" ${ps.length < 1 ? 'disabled' : ''}>Mission shuru koro</button><p class="mpmuted">${allReady ? 'Shobai ready.' : 'Kichu player ekhono ready na, tobuo shuru kora jabe.'} AI squad thakbe na: tomra nijerai team.</p>`
      : `<p class="mpmuted">Host mission ar difficulty bachai korbe. Host shuru korlei tomar mission load hobe.</p><button type="button" class="btn ${NET.ready ? '' : 'pri'}" id="mpReady">${NET.ready ? 'Ready na' : 'Ready'}</button>`}
      <p class="mpmuted">Co-op niyom: enemy ar hostage host er game e chole. Keu down hole teammate kache giye F hold kore revive korte pare, na hole 25 second por respawn.</p></div>`;
  $('mpLeave').addEventListener('click', async () => { A.ui(); await leaveGame(); renderMulti(); });
  if (NET.host) { $('mpMission').addEventListener('change', e => { const m = MISSIONS.find(x => x.meta.id === e.target.value); updateSetup({ m: m.meta.id, mname: m.meta.name }); renderMulti(); });
    $('mpDiff').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { updateSetup({ d: b.dataset.d }); A.ui(); renderMulti(); }));
    $('mpStart').addEventListener('click', () => { A.ui(); mpHostStart(); }); }
  else $('mpReady').addEventListener('click', () => { setReady(!NET.ready); A.ui(); renderMulti(); });
}

/* ================= loop ================= */
function tick(dt) {
  G.time += dt; setAnimTime(G.time); G.dt = dt;
  G.world.step(1 / 60, dt, 3); if (G.state === 'playing') updatePlayer(dt);
  const puppets = NET.client && NET.inMission;
  for (const a of G.agents) if (a.alive && !a.hidden) { if (puppets && a.puppet) puppetUpdate(a, dt); else a.update(dt); }
  updateRagdolls(dt); updateLevel(dt, G.time, MS.alarm); updateMission(dt); FX.update(dt); updateHUD(dt); A.listener(G.camera);
}
G.debugStep = (n, dt = 1 / 30) => { for (let i = 0; i < n && G.state === 'playing'; i++) { G.scene.updateMatrixWorld(); tick(dt); netTick(dt); } };
G.debug = { openPlanning: id => openPlanning(id), deploy: () => deploy(), setEntry: e => { plan.entry = e; }, setDiff: d => { plan.diff = d; }, backToLobby, goLobby, mpHostStart: () => mpHostStart(), NET };
const clock = new THREE.Clock(); let planT = 0, frameN = 0;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  netTick(dt);
  if (G.state === 'playing' || (G.state === 'paused' && NET.on && NET.inMission)) tick(dt);
  else if (G.state === 'lobby' || G.state === 'splash') { G.time += dt; setAnimTime(G.time); updateLobby(dt, G.time, PROFILE.squad, focusOp);
    if (LOBBY.screen === 'squad' && G.state === 'lobby') { const rect = G.host.getBoundingClientRect(); const pos = tagPositions(rect); for (const [id, p] of Object.entries(pos)) { const el = $('tag-' + id); el.hidden = !p.vis; el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; el.classList.toggle('off', id !== 'shadow' && !PROFILE.squad.includes(id)); } } else for (const el of $('tags').children) el.hidden = true; }
  else if (G.state === 'planning') { planT += dt; G.time += dt; updateLevel(dt, G.time, false); const b = LV.bounds; const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, rad = Math.max(b.x1 - b.x0, b.z1 - b.z0) * 0.42; const a = planT * 0.05; const cam = G.camera;
    cam.position.set(cx + Math.sin(a) * rad, Math.max(6, rad * 0.45), cz + Math.cos(a) * rad); cam.lookAt(cx, 0, cz); if (cam.fov !== 55) { cam.fov = 55; cam.updateProjectionMatrix(); } }
  frameN++; if (frameN % 2 === 0 || G.state !== 'playing') renderer.shadowMap.needsUpdate = true;
  if (G.grade) { const u = G.grade.uniforms; u.time.value = G.time; const hv = G.state === 'playing' && P.alive !== false ? clamp((55 - P.hp) / 55, 0, 1) : 0; u.hurt.value += (hv - u.hurt.value) * Math.min(1, dt * 4); }
  if (!G.noRender) G.composer.render(); else G.scene.updateMatrixWorld();
}
window.addEventListener('error', e => { const b = $('boot'); if (b && !b.hidden) { b.classList.add('err'); b.textContent = 'Game load hote problem: ' + e.message; } });
try { await Promise.race([document.fonts.load('800 64px "Saira Condensed"'), new Promise(r => setTimeout(r, 1500))]); } catch (e) { }
try { boot(); } catch (e) { const b = $('boot'); b.classList.add('err'); b.textContent = 'Game load hote problem: ' + e.message; console.error(e); }
