// Tiger 24 · Operation Vault — HUD
import { THREE, G, PI, $, clamp, esc, A } from './core.js';
import { P, WEAPONS } from './player.js';
import { colliders, doors, rooms, LV, lights, interactables, roomAt } from './levelkit.js';
import { MS, objectives, currentTargets, fmt, WIRE_COLORS, bombs } from './mission.js';

let mapImg = null; const MAP = { x0: -24, z0: -38, x1: 24, z1: 31, s: 9 };
export function buildMapImage() {
  if (LV.bounds) { const b = LV.bounds; const pad = 4; Object.assign(MAP, { x0: b.x0 - pad, z0: b.z0 - pad, x1: b.x1 + pad, z1: b.z1 + pad }); MAP.s = Math.min(9, 900 / Math.max(MAP.x1 - MAP.x0, MAP.z1 - MAP.z0)); }
  const W = Math.ceil((MAP.x1 - MAP.x0) * MAP.s), H = Math.ceil((MAP.z1 - MAP.z0) * MAP.s); const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const X = x => (x - MAP.x0) * MAP.s, Z = z => (z - MAP.z0) * MAP.s;
  for (const r of rooms) { if (!r.indoor) continue; g.fillStyle = 'rgba(70,84,80,.55)'; g.fillRect(X(r.x1), Z(r.z1), (r.x2 - r.x1) * MAP.s, (r.z2 - r.z1) * MAP.s); }
  for (const cl of colliders) { if (cl.dyn || cl.max.y < 0.5) continue; const tall = cl.max.y > 1.6; g.fillStyle = tall ? 'rgba(225,235,228,.85)' : 'rgba(160,170,165,.5)'; g.fillRect(X(cl.min.x), Z(cl.min.z), Math.max(1.5, (cl.max.x - cl.min.x) * MAP.s), Math.max(1.5, (cl.max.z - cl.min.z) * MAP.s)); }
  g.font = '600 15px "JetBrains Mono", monospace'; g.fillStyle = 'rgba(230,240,235,.55)'; g.textAlign = 'center';
  for (const r of rooms) { if (!r.indoor || r.name === 'Teller area') continue; g.fillText(r.name.toUpperCase(), X((r.x1 + r.x2) / 2), Z((r.z1 + r.z2) / 2) + (r.name === 'Lobby' ? 60 : 0)); }
  const ex = (LV.objectives || []).find(o => o.type === 'extract'); if (ex) { const z = ex.zone; g.strokeStyle = 'rgba(60,255,138,.8)'; g.lineWidth = 3; g.setLineDash([8, 6]); g.strokeRect(X(z.x1), Z(z.z1), (z.x2 - z.x1) * MAP.s, (z.z2 - z.z1) * MAP.s); g.setLineDash([]); g.fillStyle = 'rgba(60,255,138,.9)'; g.fillText('EXTRACT', X((z.x1 + z.x2) / 2), Z(z.z1) - 6); }
  mapImg = c;
}
const X = x => (x - MAP.x0) * MAP.s, Z = z => (z - MAP.z0) * MAP.s;

const el = {};
export function initHUD() {
  for (const id of ['hud', 'hpBar', 'hpNum', 'arBar', 'arNum', 'stBar', 'ammoMag', 'ammoRes', 'wName', 'wMode', 'gFlash', 'gMed', 'timer', 'timerLbl', 'objList', 'mini', 'prompt', 'promptTxt', 'promptRing', 'subs', 'feed', 'toasts', 'cross', 'hitm', 'detect', 'dmgDir', 'scope', 'flashW', 'hurtV', 'banner', 'bannerT', 'bannerS', 'team', 'hawk', 'bigmap', 'bigmapC', 'execW', 'alarmTag', 'stance', 'defuse', 'wires', 'defTimer', 'defHint', 'defIntel', 'compass', 'suppV', 'interactBtn'])
    el[id] = $(id);
  G.hooks.toast = msg => { const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; el.toasts.prepend(d); setTimeout(() => d.classList.add('out'), 3200); setTimeout(() => d.remove(), 3800); while (el.toasts.children.length > 4) el.toasts.lastChild.remove(); };
  G.hooks.subtitle = (who, text, radio) => { const d = document.createElement('div'); d.className = 'sub' + (radio ? ' radio' : ''); d.innerHTML = `<b>${esc(who.toUpperCase())}</b>${esc(text)}`; el.subs.append(d); const life = 2500 + text.length * 45; setTimeout(() => d.classList.add('out'), life); setTimeout(() => d.remove(), life + 500); while (el.subs.children.length > 3) el.subs.firstChild.remove(); };
  G.hooks.killfeed = (a, b, head, civ) => { const d = document.createElement('div'); d.className = 'kf' + (civ ? ' civ' : ''); d.innerHTML = `<span>${esc(a)}</span><i>${head ? '⌖' : '▸'}</i><span>${esc(b)}</span>`; el.feed.prepend(d); setTimeout(() => d.remove(), 6000); while (el.feed.children.length > 5) el.feed.lastChild.remove(); };
  G.hooks.hitmarker = ag => { el.hitm.classList.toggle('bad', ag.kind !== 'enemy'); el.hitm.classList.toggle('kill', !ag.alive); el.hitm.classList.remove('show'); void el.hitm.offsetWidth; el.hitm.classList.add('show'); if (ag.kind === 'enemy') A.hit(); };
  G.hooks.hurtDir = a => { const d = document.createElement('div'); d.className = 'dd'; d.dataset.a = a; el.dmgDir.append(d); setTimeout(() => d.remove(), 1400); };
  G.hooks.banner = (t, s) => { el.bannerT.textContent = t; el.bannerS.textContent = s || ''; el.banner.classList.remove('show'); void el.banner.offsetWidth; el.banner.classList.add('show'); };
  G.hooks.map = on => { el.bigmap.hidden = !on; };
  G.hooks.execWarn = sec => { el.execW.hidden = false; el.execW.dataset.until = G.time + sec; };
  G.hooks.suppressFx = () => { el.suppV.classList.remove('show'); void el.suppV.offsetWidth; el.suppV.classList.add('show'); };
  // detection indicators pool
  for (let i = 0; i < 10; i++) { const d = document.createElement('div'); d.className = 'det'; d.innerHTML = '<i></i>'; el.detect.append(d); }
  // wires
  el.wires.innerHTML = WIRE_COLORS.map((w, i) => `<button type="button" class="wire" data-i="${i}" style="--c:${w.c}"><span>${i + 1}</span>${w.n}</button>`).join('');
  el.wires.querySelectorAll('.wire').forEach(b => b.addEventListener('click', () => G.hooks.cut && G.hooks.cut(+b.dataset.i)));
}
export function defuseUpdate() {
  const b = MS.curBomb; if (!b) return;
  el.wires.querySelectorAll('.wire').forEach((w, i) => w.classList.toggle('cut', b.cut.includes(WIRE_COLORS[i].k)));
  el.defIntel.textContent = MS.intel ? 'Intel order: ' + b.wires.map(w => w.n).join(' → ') : 'Intel nei: order jana nei. Bhul wire katle 90 second kombe, 2 bar bhul korle blast.';
  el.defHint.textContent = `${b.name ? b.name + ' · ' : ''}${b.cut.length}/4 wire kata · bhul ${MS.wrong}/2`;
}

let miniT = 0;
export function updateHUD(dt) {
  if (!el.hud) return;
  const W = WEAPONS[P.cur], am = P.ammo[P.cur];
  el.hpBar.style.width = P.hp + '%'; el.hpNum.textContent = Math.ceil(P.hp); el.hpBar.style.background = P.hp < 30 ? 'var(--hostile)' : '#e8eee9';
  el.arBar.style.width = P.armor + '%'; el.arNum.textContent = Math.ceil(P.armor); el.stBar.style.width = P.stamina + '%'; el.stBar.parentElement.style.opacity = P.stamina < 99 ? 1 : 0.25;
  el.ammoMag.textContent = am.mag; el.ammoRes.textContent = am.res; el.ammoMag.classList.toggle('low', am.mag <= Math.ceil(W.max * 0.2));
  el.wName.textContent = `${W.name} · ${W.cal}`; el.wMode.textContent = P.reloadT > 0 ? 'RELOADING' : am.mode.toUpperCase();
  el.gFlash.textContent = P.flash; el.gMed.textContent = P.med; el.stance.textContent = P.crouchT > 0.5 ? 'CROUCH' : P.sprinting ? 'SPRINT' : 'STAND';
  // timer
  const bl = bombs(), safe = MS.timerKind === 'bomb' && bl.length && bl.every(x => x.defused); el.timer.hidden = MS.timerKind === 'none';
  el.timer.textContent = safe ? 'DEFUSED' : fmt(MS.timer); el.timer.classList.toggle('low', !safe && MS.timer < 120 && MS.timerKind !== 'survive'); el.timerLbl.textContent = safe ? 'Bomb safe' : (LV.timer && LV.timer.startStage && (MS.stage || 1) < LV.timer.startStage) ? `Stage ${LV.timer.startStage} e shuru` : ({ bomb: 'Bomb timer', deadline: 'Deadline', survive: 'Rescue heli asche', none: '' })[MS.timerKind] || '';
  el.alarmTag.hidden = !MS.alarm;
  if (!el.execW.hidden) { const left = +el.execW.dataset.until - G.time; if (left <= 0) el.execW.hidden = true; else el.execW.querySelector('b').textContent = Math.ceil(left) + 's'; }
  // crosshair spread
  const spread = (P.adsT > 0.6 ? W.adsSpread : W.spread) + clamp(P.speed / 4, 0, 1) * 0.03 + P.bloom; const gap = 6 + spread * 420;
  el.cross.style.setProperty('--gap', gap + 'px'); el.cross.style.opacity = P.adsT > 0.5 || P.sprinting ? 0 : 1;
  el.scope.hidden = !P.scoped;
  // overlays
  el.flashW.style.opacity = clamp(P.flashBlind / 1.5, 0, 1);
  el.hurtV.style.opacity = clamp(P.hurtT * 0.8 + (P.hp < 30 ? 0.35 + Math.sin(G.time * 5) * 0.1 : 0), 0, 1);
  // prompt
  const t = P.interact; if (t && G.state === 'playing' && !G.defusing) { el.prompt.hidden = false; el.promptTxt.innerHTML = `<i class="key">${G.mobile ? 'USE' : 'F'}</i>${t.hold > 0 ? '<em>hold</em> ' : ''}${esc(t.label)}`; el.promptRing.style.setProperty('--p', t.hold > 0 ? clamp(P.holdT / t.hold, 0, 1) : 0); }
  else el.prompt.hidden = true;
  if (el.interactBtn) el.interactBtn.classList.toggle('ready', !!t);
  // damage dirs
  for (const d of el.dmgDir.children) { const rel = +d.dataset.a - P.yaw + PI; d.style.transform = `rotate(${-rel}rad)`; }
  // detection indicators
  const dets = el.detect.children; let k = 0;
  for (const e of G.enemies) { if (!e.alive || !e.isHostile() || e.state === 'combat' || e.state === 'stunned' || e.meter < 0.06) continue; if (k >= dets.length) break; const d = dets[k++]; d.hidden = false;
    const a = Math.atan2(e.pos.x - P.pos.x, e.pos.z - P.pos.z); const rel = a - P.yaw + PI; d.style.transform = `rotate(${-rel}rad)`; const m = clamp(e.meter, 0, 1); d.firstChild.style.background = m > 0.65 ? 'var(--hostile)' : m > 0.35 ? 'var(--tiger)' : '#fff'; d.firstChild.style.opacity = 0.3 + m * 0.7; d.firstChild.style.height = (8 + m * 22) + 'px'; }
  for (; k < dets.length; k++) dets[k].hidden = true;
  // compass
  const deg = ((-P.yaw * 180 / PI) % 360 + 360) % 360; const card = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8]; el.compass.innerHTML = `<b>${card}</b> ${String(Math.round(deg)).padStart(3, '0')}° · ${esc(roomAt(P.pos.x, P.pos.z).name)}`;
  if (!el.defuse.hidden) el.defTimer.textContent = fmt(MS.timer);
  // team
  miniT -= dt;
  if (miniT <= 0) { miniT = 1 / 15; drawMini(); drawObjectives(); drawTeam(); if (!el.bigmap.hidden) drawBig(); TGT = currentTargets(); }
  drawWaypoints();
}
// on-screen markers for the current objectives (direction and distance), clamped to the screen edge when off-screen
let TGT = []; const _wv = new THREE.Vector3();
function drawWaypoints() {
  const box = el.wp || (el.wp = document.getElementById('wp')); if (!box) return;
  while (box.children.length < 3) { const d = document.createElement('div'); d.className = 'wpm'; d.innerHTML = '<i></i><span></span>'; box.append(d); }
  const W = box.clientWidth || innerWidth, H = box.clientHeight || innerHeight, cam = G.camera;
  [...box.children].forEach((d, i) => { const o = TGT[i]; if (!o || G.defusing) { d.hidden = true; return; } d.hidden = false;
    _wv.set(o.at.x, (o.at.y || 0) + 1.6, o.at.z).project(cam); let x = _wv.x, y = _wv.y; const behind = _wv.z > 1; if (behind) { x = -x; y = -y; }
    const off = behind || Math.abs(x) > 0.92 || Math.abs(y) > 0.86; if (off) { const k = 1 / Math.max(Math.abs(x) / 0.92, Math.abs(y) / 0.86); x *= k; y *= k; if (behind) y = -0.86; }
    d.style.left = ((x * 0.5 + 0.5) * W) + 'px'; d.style.top = ((-y * 0.5 + 0.5) * H) + 'px'; d.classList.toggle('edge', off);
    const dist = Math.round(Math.hypot(o.at.x - P.pos.x, o.at.z - P.pos.z)); d.lastChild.textContent = `${o.where || o.t} · ${dist}m`; });
}
function drawObjectives() {
  el.objList.innerHTML = objectives().map(o => `<li class="${o.done ? 'done' : ''} ${o.opt ? 'opt' : ''} ${o.failed ? 'failed' : ''}"><span>${esc(o.t)}</span><b>${esc(o.v)}</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</li>`).join('');
}
function drawTeam() {
  const rows = G.team.map(t => { const hp = clamp(t.hp / t.maxHp, 0, 1); let st = t.state === 'downed' ? 'DOWN' : t.task ? 'BREACH' : t.order.toUpperCase(); if (t.role === 'ghost' && t.state !== 'downed') st += MS.scanCd > 0 ? ` · ${Math.ceil(MS.scanCd)}s` : ' · Y SCAN'; if (t.role === 'nila' && t.state !== 'downed') st += t.abilityCd > 0 ? ` · ${Math.ceil(t.abilityCd)}s` : ' · HEAL'; if (t.role === 'bolt' && t.state !== 'downed' && !t.task) st += ' · T'; return `<div class="${t.state === 'downed' ? 'down' : ''}"><s style="--hp:${hp}"></s><b>${t.name.toUpperCase()}</b><span>${st}</span></div>`; }).join('');
  const hawk = (G.squad || []).includes('hawk') && LV.hawk ? `<div><s style="--hp:1;background:var(--tiger)"></s><b>HAWK</b><span>${MS.hawkCd > 0 ? 'RELOAD ' + Math.ceil(MS.hawkCd) + 's' : 'READY · Z'}</span></div>` : '';
  el.team.innerHTML = rows + hawk;
}
function dotsOn(g, tr, size, big) {
  const known = e => MS.revealT > 0 || (e.spottedT && G.time - e.spottedT < 3.5) || (e.state === 'surrender' || e.state === 'arrested');
  for (const it of interactables) { if (it.used) continue; if (it.kind === 'bomb') { tr(it.pos, (x, y) => { g.fillStyle = it.defused ? '#30ff60' : '#ff3020'; g.font = `800 ${size * 2.6}px sans-serif`; g.textAlign = 'center'; g.fillText('✹', x, y + size); }); } else if ((it.kind === 'item' || it.kind === 'task') && !it.used) tr(it.pos, (x, y) => { g.fillStyle = '#3cff8a'; g.beginPath(); g.moveTo(x, y - size * 1.4); g.lineTo(x + size * 1.2, y + size); g.lineTo(x - size * 1.2, y + size); g.closePath(); g.fill(); }); else if (it.kind === 'intel' && big) tr(it.pos, (x, y) => { g.fillStyle = '#ffd34d'; g.fillRect(x - size, y - size, size * 2, size * 2); }); }
  for (const c of lights.cams) if (c.alive && !c.off) tr(c.data.pos, (x, y) => { g.fillStyle = '#ff6040'; g.beginPath(); g.arc(x, y, size * 0.9, 0, PI * 2); g.fill(); });
  for (const d of doors) tr(d.center, (x, y) => { g.fillStyle = d.broken ? 'rgba(255,255,255,.15)' : d.locked ? '#ff8a3a' : d.isOpen ? 'rgba(150,230,220,.6)' : 'rgba(230,200,150,.9)'; g.fillRect(x - size * 0.7, y - size * 0.7, size * 1.4, size * 1.4); });
  for (const h of G.hostages) { if (!h.alive && !h.hidden) { tr(h.pos, (x, y) => { g.strokeStyle = 'rgba(255,211,77,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - size, y - size); g.lineTo(x + size, y + size); g.moveTo(x + size, y - size); g.lineTo(x - size, y + size); g.stroke(); }); continue; } if (h.hidden) continue;
    tr(h.pos, (x, y) => { g.fillStyle = h.state === 'freed' ? '#7dff9a' : '#ffd34d'; g.beginPath(); g.arc(x, y, size, 0, PI * 2); g.fill(); }); }
  for (const e of G.enemies) { if (!e.alive) continue; if (!known(e)) continue; tr(e.pos, (x, y) => { g.fillStyle = e.state === 'surrender' || e.state === 'arrested' ? '#8a8a8a' : e.state === 'stunned' ? '#ffffff' : '#ff5340'; g.beginPath(); g.arc(x, y, size * 1.1, 0, PI * 2); g.fill(); if (e.marked) { g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); } }); }
  for (const t of G.team) tr(t.pos, (x, y) => { g.fillStyle = t.state === 'downed' ? '#ff9a9a' : '#4fd1c5'; g.beginPath(); g.arc(x, y, size, 0, PI * 2); g.fill(); });
  for (const o of TGT) tr(o.at, (x, y) => { g.fillStyle = '#f29b2b'; g.strokeStyle = '#000'; g.lineWidth = 2; g.font = `900 ${size * (big ? 4 : 3.2)}px sans-serif`; g.textAlign = 'center'; g.strokeText('◆', x, y + size); g.fillText('◆', x, y + size); if (big) { g.font = `700 ${size * 2.2}px sans-serif`; g.strokeText((o.where || o.t).toUpperCase(), x, y - size * 2); g.fillText((o.where || o.t).toUpperCase(), x, y - size * 2); } });
}
function drawMini() {
  const c = el.mini, g = c.getContext('2d'), W = c.width, H = c.height; g.clearRect(0, 0, W, H);
  g.save(); g.beginPath(); g.arc(W / 2, H / 2, W / 2 - 2, 0, PI * 2); g.clip(); g.fillStyle = 'rgba(6,10,9,.7)'; g.fillRect(0, 0, W, H);
  const zoom = 1.25; g.translate(W / 2, H / 2); g.rotate(P.yaw); g.scale(zoom, zoom); g.translate(-X(P.pos.x), -Z(P.pos.z));
  if (mapImg) g.drawImage(mapImg, 0, 0);
  dotsOn(g, (p, f) => f(X(p.x), Z(p.z)), 5 / zoom * 1.4, false);
  g.restore();
  // player arrow + view cone
  g.save(); g.translate(W / 2, H / 2); g.fillStyle = 'rgba(79,209,197,.16)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, W * 0.45, -PI / 2 - 0.5, -PI / 2 + 0.5); g.fill();
  g.fillStyle = '#4fd1c5'; g.beginPath(); g.moveTo(0, -10); g.lineTo(7, 7); g.lineTo(0, 3); g.lineTo(-7, 7); g.closePath(); g.fill(); g.restore();
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2; g.beginPath(); g.arc(W / 2, H / 2, W / 2 - 2, 0, PI * 2); g.stroke();
  // north marker
  const rN = W / 2 - 14; g.fillStyle = '#f29b2b'; g.font = '700 16px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', W / 2 + Math.sin(P.yaw) * rN, H / 2 - Math.cos(P.yaw) * rN);
}
function drawBig() {
  const c = el.bigmapC, g = c.getContext('2d'); const W = c.width, H = c.height; g.clearRect(0, 0, W, H);
  const sx = W / mapImg.width, sy = H / mapImg.height, s = Math.min(sx, sy); const ox = (W - mapImg.width * s) / 2, oy = (H - mapImg.height * s) / 2;
  g.save(); g.translate(ox, oy); g.scale(s, s); g.drawImage(mapImg, 0, 0);
  dotsOn(g, (p, f) => f(X(p.x), Z(p.z)), 7, true);
  g.translate(X(P.pos.x), Z(P.pos.z)); g.rotate(-P.yaw); g.fillStyle = '#4fd1c5'; g.beginPath(); g.moveTo(0, -16); g.lineTo(11, 11); g.lineTo(0, 5); g.lineTo(-11, 11); g.closePath(); g.fill(); g.restore();
}

