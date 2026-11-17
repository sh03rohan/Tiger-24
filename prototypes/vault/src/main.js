// Tiger 24 · Operation Vault — boot, screens, main loop
import { THREE, G, PI, $, esc, store, A, VO, FX, initGraphics, applyQuality, renderer, DEFAULT_SETTINGS, clamp } from './core.js';
import { initTextures, setAnimTime } from './assets.js';
import { buildLevel, updateLevel, LV, rooms } from './level.js';
import { initPlayer, updatePlayer, P, requestLock, releaseLock, isLocked } from './player.js';
import { updateRagdolls } from './ai.js';
import { startMission, updateMission, installHooks, MS, cutWire, closeDefuse, fmt } from './mission.js';
import { initHUD, updateHUD, defuseUpdate, buildMapImage } from './hud.js';

const LOBBY_URL = 'https://claude.ai/artifact/BZdA5QrB8vsXCjihfWrkE9';
let plan = { entry: store.get('entry', 'front'), diff: store.get('diff', 'veteran') };

function show(id) { for (const s of ['planning', 'pause', 'debrief']) $(s).hidden = s !== id; $('hud').hidden = id !== 'hud'; $('touch').hidden = !(id === 'hud' && G.mobile); }

function boot() {
  initGraphics($('view')); FX.init(); VO.init(); initTextures(); buildLevel(); initPlayer(); installHooks(); initHUD();
  G.hooks.cut = cutWire; G.hooks.defuseUpdate = defuseUpdate;
  G.hooks.defuse = on => { $('defuse').hidden = !on; if (on) { defuseUpdate(); if (G.mobile || G.noLock) { } } };
  G.hooks.pause = pause; G.hooks.debrief = debrief;
  window.addEventListener('keydown', e => {
    if (G.state === 'playing' && G.defusing) { const i = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code); if (i >= 0) { e.preventDefault(); cutWire(i); } if (e.code === 'KeyF' || e.code === 'Escape') closeDefuse(); }
    else if (G.state === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) resume();
  });
  setupPlanning(); setupPause(); setupDebrief();
  $('rotate').addEventListener('click', () => $('rotate').classList.add('off')); $('rotate').addEventListener('touchstart', e => { e.stopPropagation(); $('rotate').classList.add('off'); }, { passive: true });
  G.state = 'planning'; show('planning');
  $('boot').hidden = true;
  requestAnimationFrame(loop);
}

/* ================= planning ================= */
const ENTRIES = {
  front: { t: 'Main entrance', s: 'Front glass door diye shoja lobby te. Police cover ache, kintu lobby te 3 jon gunman shoja nojor rakhche.', risk: 'Risk: High · Speed: Fast' },
  roof: { t: 'Roof skylight', s: 'Skylight diye rappel kore lobby er majhkhane namben. Lobby er gunman ra 1 second hotobhombo thakbe.', risk: 'Risk: Medium · Surprise' },
  back: { t: 'Loading dock', s: 'Pichoner door khola. Stealth route, kintu corridor e CCTV camera cholche ar ekjon gunman patrol korche.', risk: 'Risk: Low · Stealth' },
};
function setupPlanning() {
  const ent = $('entries'); ent.innerHTML = Object.entries(ENTRIES).map(([k, e]) => `<button type="button" class="entry" data-k="${k}"><b>${e.t}</b><span>${e.s}</span><em>${e.risk}</em></button>`).join('');
  ent.querySelectorAll('.entry').forEach(b => b.addEventListener('click', () => { plan.entry = b.dataset.k; store.set('entry', plan.entry); A.init(); A.ui(); renderPlan(); }));
  $('diffSeg').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { plan.diff = b.dataset.d; store.set('diff', plan.diff); A.init(); A.ui(); renderPlan(); }));
  $('deploy').addEventListener('click', deploy);
  $('lobbyLink').href = LOBBY_URL; $('lobbyLink2').href = LOBBY_URL; $('lobbyLink3').href = LOBBY_URL;
  $('ctrlToggle').addEventListener('click', () => { $('ctrlList').hidden = !$('ctrlList').hidden; });
  renderPlan();
}
function renderPlan() {
  $('entries').querySelectorAll('.entry').forEach(b => b.classList.toggle('on', b.dataset.k === plan.entry));
  $('diffSeg').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.d === plan.diff));
  const best = store.get('best.' + plan.diff, null); $('bestScore').textContent = best ? `Best (${plan.diff}): ${best.total} pts · ${'★'.repeat(best.stars)}${'☆'.repeat(3 - best.stars)} · ${best.grade}` : 'Ei difficulty te ekhono kono score nei';
  $('diffInfo').textContent = { recruit: 'Enemy dhire react kore, kom damage. Bomb 18:00.', veteran: 'Balanced. Bomb 15:00.', elite: 'Druto, nikhut enemy. Armor kom. Bomb 12:00.' }[plan.diff];
  drawBlueprint();
}
function drawBlueprint() {
  const c = $('blueprint'), g = c.getContext('2d'); const W = c.width, H = c.height; g.fillStyle = '#0a1a24'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(120,190,230,.12)'; g.lineWidth = 1; for (let x = 0; x < W; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  // view region x -18..18, z -27..18 rotated so the street is at the bottom
  const x0 = -18, x1 = 18, z0 = -27, z1 = 19; const s = Math.min(W / (x1 - x0), H / (z1 - z0)); const ox = (W - (x1 - x0) * s) / 2, oy = (H - (z1 - z0) * s) / 2;
  const X = x => ox + (x - x0) * s, Z = z => oy + (z - z0) * s;
  import('./level.js').then(({ colliders, doors, rooms }) => {
    for (const r of rooms) { if (!r.indoor) continue; g.fillStyle = 'rgba(80,160,210,.09)'; g.fillRect(X(r.x1), Z(r.z1), (r.x2 - r.x1) * s, (r.z2 - r.z1) * s); }
    g.fillStyle = 'rgba(170,220,250,.85)'; for (const cl of colliders) { if (cl.dyn || cl.max.y < 1.6 || cl.min.x < x0 - 2 || cl.max.x > x1 + 2 || cl.min.z < z0 - 2 || cl.max.z > z1 + 2) continue; g.fillRect(X(cl.min.x), Z(cl.min.z), Math.max(1.5, (cl.max.x - cl.min.x) * s), Math.max(1.5, (cl.max.z - cl.min.z) * s)); }
    g.fillStyle = 'rgba(170,220,250,.35)'; for (const cl of colliders) { if (cl.dyn || cl.max.y >= 1.6 || cl.max.y < 0.5 || cl.min.z < z0 || cl.max.z > z1 || cl.min.x < x0 || cl.max.x > x1) continue; g.fillRect(X(cl.min.x), Z(cl.min.z), (cl.max.x - cl.min.x) * s, (cl.max.z - cl.min.z) * s); }
    for (const d of doors) { g.fillStyle = d.locked ? '#ff8a3a' : '#f2d29a'; g.fillRect(X(d.center.x) - 3, Z(d.center.z) - 3, 6, 6); }
    g.font = '600 10px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.fillStyle = 'rgba(200,235,255,.75)';
    for (const r of rooms) { if (!r.indoor || r.name === 'Teller area') continue; g.fillText(r.name.toUpperCase(), X((r.x1 + r.x2) / 2), Z((r.z1 + r.z2) / 2) + (r.name === 'Lobby' ? 34 : 0)); }
    // intel markers
    const groups = [[0, 0, '6 HOSTAGE'], [14, -10.3, '2'], [-6.5, -12.2, '3'], [-15.2, -23.2, '1']];
    for (const [x, z, t] of groups) { g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(X(x), Z(z), 5, 0, PI * 2); g.fill(); g.fillStyle = '#ffd34d'; g.fillText(t, X(x), Z(z) - 9); }
    for (const [x, z] of [[2, 1], [-8, 5], [-12.5, -11.5], [7.2, -15], [10, -14.6], [3, -12], [-10, -20], [0, -8]]) { g.strokeStyle = '#ff5340'; g.lineWidth = 2; g.beginPath(); g.moveTo(X(x) - 4, Z(z) - 4); g.lineTo(X(x) + 4, Z(z) + 4); g.moveTo(X(x) + 4, Z(z) - 4); g.lineTo(X(x) - 4, Z(z) + 4); g.stroke(); }
    g.fillStyle = '#ff3020'; g.font = '800 16px sans-serif'; g.fillText('✹', X(0), Z(-22) + 6); g.font = '600 10px "JetBrains Mono", monospace'; g.fillText('BOMB', X(0), Z(-22) + 18);
    for (const cam of LV.cameras) { g.fillStyle = '#ff7050'; g.beginPath(); g.arc(X(cam.pos.x), Z(cam.pos.z), 4, 0, PI * 2); g.fill(); }
    const EP = { front: [0, 13], roof: [0, 1.2], back: [7.2, -26] };
    for (const [k, [x, z]] of Object.entries(EP)) { const on = k === plan.entry; g.strokeStyle = on ? '#f29b2b' : 'rgba(242,155,43,.35)'; g.fillStyle = on ? '#f29b2b' : 'rgba(242,155,43,.35)'; g.lineWidth = on ? 3 : 1.5; g.beginPath(); g.arc(X(x), Z(z), on ? 11 : 8, 0, PI * 2); g.stroke();
      g.font = '800 12px "Saira Condensed", sans-serif'; g.fillText(ENTRIES[k].t.toUpperCase(), X(x), Z(z) + (k === 'back' ? -16 : 24)); }
  });
}
function deploy() {
  A.init(); A.startAmbience(); A.setVol();
  G.state = 'playing'; show('hud'); startMission(plan.entry, plan.diff);
  if (!G.mobile) requestLock();
  setTimeout(() => G.hooks.toast && G.hooks.toast(G.mobile ? 'Bam dike joystick, dane drag kore aim' : 'Screen e click korle mouse lock hobe · Esc = pause'), 500);
}

/* ================= pause & settings ================= */
function pause() { if (G.state !== 'playing') return; G.state = 'paused'; releaseLock(); VO.stop(); show('pause'); renderSettings(); }
function resume() { if (G.state !== 'paused') return; G.state = 'playing'; show('hud'); if (!G.mobile) requestLock(); }
function setupPause() {
  $('resumeBtn').addEventListener('click', resume);
  $('restartBtn').addEventListener('click', () => { G.state = 'playing'; show('hud'); startMission(G.entry, G.diff); if (!G.mobile) requestLock(); });
  $('planBtn').addEventListener('click', () => { G.state = 'planning'; A.alarm(false); show('planning'); renderPlan(); });
}
function renderSettings() {
  const S = G.settings; const box = $('settings');
  const rng = (k, label, min, max, step, fmtv = v => v) => `<label class="srow"><span>${label}</span><input type="range" id="set-${k}" min="${min}" max="${max}" step="${step}" value="${S[k]}" data-k="${k}"><output id="out-${k}">${fmtv(S[k])}</output></label>`;
  const seg = (k, label, opts) => `<div class="srow"><span>${label}</span><div class="seg" data-k="${k}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${String(S[k]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div></div>`;
  box.innerHTML = rng('sens', 'Mouse sensitivity', 0.2, 3, 0.05, v => (+v).toFixed(2)) + rng('fov', 'Field of view', 60, 100, 1) + rng('volume', 'Master volume', 0, 100, 1) + rng('music', 'Ambience', 0, 100, 1)
    + seg('quality', 'Graphics', [['low', 'Low'], ['medium', 'Med'], ['high', 'High'], ['ultra', 'Ultra']]) + seg('voice', 'Voice', [[true, 'On'], [false, 'Off']]) + seg('subs', 'Subtitles', [[true, 'On'], [false, 'Off']]) + seg('invertY', 'Invert Y', [[false, 'Off'], [true, 'On']]);
  box.querySelectorAll('input[type=range]').forEach(r => r.addEventListener('input', () => { const k = r.dataset.k; S[k] = +r.value; $('out-' + k).textContent = k === 'sens' ? (+r.value).toFixed(2) : r.value; if (k === 'fov') { G.camera.fov = S.fov; G.camera.updateProjectionMatrix(); } A.setVol(); store.set('settings', S); }));
  box.querySelectorAll('.seg').forEach(sg => sg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { const k = sg.dataset.k; let v = b.dataset.v; if (v === 'true') v = true; else if (v === 'false') v = false; S[k] = v; store.set('settings', S); if (k === 'quality') applyQuality(); A.ui(); renderSettings(); })));
}

/* ================= debrief ================= */
function setupDebrief() {
  $('retryBtn').addEventListener('click', () => { G.state = 'playing'; show('hud'); startMission(G.entry, G.diff); if (!G.mobile) requestLock(); });
  $('planBtn2').addEventListener('click', () => { G.state = 'planning'; show('planning'); renderPlan(); });
}
function debrief(r) {
  G.state = 'debrief'; releaseLock(); A.alarm(false); show('debrief');
  $('dbTitle').textContent = r.title; $('dbTitle').className = r.ok ? 'ok' : 'bad'; $('dbSub').textContent = r.ok ? `Operation Vault · ${G.diff} · ${fmt(r.time)} e complete` : `${r.reason}: ${r.sub}`;
  $('dbStars').innerHTML = [0, 1, 2].map(i => `<i class="${i < r.stars ? 'on' : ''}">★</i>`).join('');
  $('dbGrade').textContent = r.grade; $('dbScore').textContent = r.total; $('dbBest').textContent = r.isBest ? 'Notun best score!' : `Best: ${r.best}`;
  $('dbRows').innerHTML = r.rows.map(([k, v, p]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td><td class="${p < 0 ? 'neg' : p > 0 ? 'pos' : ''}">${p > 0 ? '+' : ''}${p}</td></tr>`).join('');
  const s = G.stats; $('dbStats').innerHTML = [['Shots', s.shots], ['Hits', s.hits], ['Headshot', s.headshots], ['Accuracy', Math.round(r.acc * 100) + '%'], ['Damage taken', Math.round(s.damageTaken)], ['Flashbang', s.flashes], ['Revive', s.revives], ['Alarm', s.alarm ? 'Yes' : 'No']].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
}

/* ================= loop ================= */
function tick(dt) {
  G.time += dt; setAnimTime(G.time); G.dt = dt;
  G.world.step(1 / 60, dt, 3);
  updatePlayer(dt);
  for (const a of G.agents) if (a.alive && !a.hidden) a.update(dt);
  updateRagdolls(dt); updateLevel(dt, G.time, MS.alarm); updateMission(dt);
  FX.update(dt); updateHUD(dt); A.listener(G.camera);
}
G.debugStep = (n, dt = 1 / 30) => { for (let i = 0; i < n && G.state === 'playing'; i++) { G.scene.updateMatrixWorld(); tick(dt); } };
const clock = new THREE.Clock(); let planT = 0, frameN = 0;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (G.state === 'playing') tick(dt);
  else if (G.state === 'planning') {
    planT += dt; G.time += dt; updateLevel(dt, G.time, false); const cam = G.camera; const a = planT * 0.06;
    cam.position.set(Math.sin(a) * 9, 3.6, 3 + Math.cos(a) * 6); cam.lookAt(0, 1.4, -3); cam.fov = 60; cam.updateProjectionMatrix();
  }
  frameN++; if (frameN % 2 === 0 || G.state !== 'playing') renderer.shadowMap.needsUpdate = true;
  if (!G.noRender) G.composer.render();
}

window.addEventListener('error', e => { const b = $('boot'); if (b && !b.hidden) { b.classList.add('err'); b.textContent = 'Game load hote problem: ' + e.message; } });
try { await Promise.race([document.fonts.load('800 64px "Saira Condensed"'), new Promise(r => setTimeout(r, 1500))]); } catch (e) { }
try { boot(); } catch (e) { const b = $('boot'); b.classList.add('err'); b.textContent = 'Game load hote problem: ' + e.message; console.error(e); }
