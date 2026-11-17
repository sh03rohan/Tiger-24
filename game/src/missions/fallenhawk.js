// Mission 07 — Operation Fallen Hawk: defend the crash site and the wounded pilot until rescue arrives
import { THREE, G, PI, M, B, RB, C, SP, PL, RX, add, canvasTex, rng, R, rr, V3, FX } from '../core.js';
import * as K from '../levelkit.js';
const { addCollider, floor, deco, pointLight, room, prop } = K;

export const meta = { id: 'fallenhawk', no: '07', name: 'Operation Fallen Hawk', art: 'crash', type: 'Survival · defend', loc: 'Crash site · Border valley', time: '05:10 hrs · bhor', diff: 'Elite',
  obj: ['Aahoto pilot ke bachiye rakha', 'Rescue heli asha porjonto crash site defend', 'Charpash theke asha enemy wave thekano'], intel: 'Amader heli guli kheye pore geche. Ammo crate wreck er pashe. Enemy charidik theke ashbe, pilot ke target korbe.' };

let fireL = null, rescue = null, wreck = null;
export function build() {
  K.beginLevel({ skyEnv: true, grade: { sat: 1.08, contrast: 1.08, sh: [0.95, 0.95, 1.08], hi: [1.08, 1.0, 0.9] }, dustColor: '#ffd8b0', bg: '#3a2e36', fog: '#4a3a3a', fogD: 0.016, sun: 2.0, sunColor: '#ffc29a', sunPos: [40, 10, -20], sunTarget: [0, 0, 0], shadowSize: 30, hemi: 0.7, hemiSky: '#e0b0a0', hemiGround: '#2a2a1a', envI: 0.3,
    alarmLight: false, skyTop: '#2a2a4a', skyBottom: '#f0a080', city: false, skyDist: 90 });
  const LG = K.LG, m = K.makeMaterials();
  const grass = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#4a4a2a'; g.fillRect(0, 0, w, h); const r = rng(11); for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(${60 + r() * 60},${60 + r() * 60},${30 + r() * 20},.45)`; g.fillRect(r() * w, r() * h, 1, 2 + r() * 3); } for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(80,60,40,.35)'; g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 30, 6 + r() * 16, r() * 3, 0, 7); g.fill(); } }, { repeat: [30, 30] });
  room('Crash site', -40, -40, 40, 40, 'grass', 0.75, false);
  floor(-70, -70, 70, 70, M('#ffffff', 0.95, 0, { map: grass }));
  const burnt = canvasTex(128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(10,8,6,.95)'); gr.addColorStop(1, 'rgba(10,8,6,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  deco(PL(14, 14), new THREE.MeshStandardMaterial({ map: burnt, transparent: true, depthWrite: false }), [0, 0.01, 0], [-PI / 2, 0, 0], null, false);
  // wreck
  wreck = K.heliModel(V3(0, 0.2, 0), 0.6, '#2f342b'); wreck.rotation.z = 0.35; wreck.rotation.x = 0.08; wreck.userData.rotor.rotation.y = 0.4; wreck.userData.rotor.children.slice(2).forEach(b => b.rotation.z = 0.5);
  wreck.traverse(o => { if (o.isMesh && o.material && o.material.color) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.55); } });
  addCollider(-1.6, 0, -2.4, 1.6, 2.4, 2.6, { vis: false, mat: 'metal' }); addCollider(-2.6, 0, -6, -0.6, 2.4, -2.4, { vis: false, mat: 'metal' });
  fireL = pointLight('#ff8a30', 14, 14, -0.6, 1.8, -1); const fireCore = deco(SP(0.5, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffb050', toneMapped: false, transparent: true, opacity: 0.8 }), [-0.6, 1.4, -1], null, null, false);
  // cover
  const rock = M('#6a645a', 0.95), log = M('#4a3622', 0.95);
  const rr2 = rng(31);
  const rocks = [[6, 2, 1.4], [-5, 5, 1.6], [3, -7, 1.2], [-7, -4, 1.3], [9, -6, 1.8], [-10, 8, 1.5], [0, 9, 1.2], [11, 7, 1.4], [-12, -10, 1.7], [13, -1, 1.2], [-3, -12, 1.4], [7, 12, 1.3], [-14, 1, 1.4], [15, 13, 2], [-16, -15, 2]];
  for (const [x, z, s] of rocks) { const r1 = deco(SP(s, 8, 6), rock, [x, s * 0.45, z], [rr2() * 3, rr2() * 3, 0], [1.3, 0.75, 1]); addCollider(x - s * 0.95, 0, z - s * 0.7, x + s * 0.95, s * 0.95, z + s * 0.7, { vis: false, mat: 'concrete' }); }
  for (const [x, z, ry] of [[4.5, 5.5, 0.4], [-4, -8.5, -0.3], [-9, 1.5, 1.4]]) { deco(C(0.35, 0.4, 5, 8), log, [x, 0.35, z], [PI / 2, ry, 0]); const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry)); addCollider(x - (s * 2.5 + c * 0.4), 0, z - (c * 2.5 + s * 0.4), x + (s * 2.5 + c * 0.4), 0.75, z + (c * 2.5 + s * 0.4), { vis: false, mat: 'wood', pen: true }); }
  for (let i = 0; i < 110; i++) { const a = rr2() * PI * 2, d = 19 + rr2() * 45; const x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.abs(x) < 3 && Math.abs(z) > 18) continue; if (Math.abs(z) < 3 && Math.abs(x) > 18) continue; K.tree(x, z, 0.9 + rr2() * 0.8, d < 40); }
  for (let i = 0; i < 40; i++) { const a = rr2() * PI * 2, d = 14 + rr2() * 25; K.bush(Math.cos(a) * d, Math.sin(a) * d, 0.8 + rr2()); }
  for (const [x1, z1, x2, z2] of [[-38, -38, 38, -37.6], [-38, 37.6, 38, 38], [-38, -38, -37.6, 38], [37.6, -38, 38, 38]]) addCollider(x1, 0, z1, x2, 4, z2, { vis: false });
  // supply crates
  for (const [kind, pos, label] of [['ammo', V3(3.2, 0.2, -2.4), 'Ammo refill'], ['ammo', V3(-3.4, 0.2, 3.2), 'Ammo refill'], ['medkit', V3(2.6, 0.45, 3.6), 'Medkit nao'], ['medkit', V3(-2.8, 0.45, -3.6), 'Medkit nao'], ['medkit', V3(6, 1.5, 2), 'Medkit nao'], ['ammo', V3(-5, 1.7, 5), 'Ammo refill']]) K.addInteractable(kind, pos, label, K.pickupModel(kind, pos));
  for (let i = 0; i < 5; i++) prop('box', rr(-4, 4), 0, rr(-4, 4) + (i % 2 ? 4 : -4));
  // rescue helicopter (arrives at the end)
  rescue = K.heliModel(V3(0, 60, -60), 0, '#3a4a3a'); pointLight('#fff4e0', 4, 18, 0, 6, 0);
  K.buildCameras([]);
  const sp = [V3(0, 0, -34), V3(34, 0, 0), V3(0, 0, 34), V3(-34, 0, 0), V3(25, 0, -25), V3(-25, 0, 25), V3(25, 0, 25), V3(-25, 0, -25)];
  let smokeT = 0;
  return {
    id: 'fallenhawk', bounds: { x0: -38, z0: -38, x1: 38, z1: 38 },
    spawns: { crash: { pos: V3(3.6, 0, 1.2), yaw: -PI / 2, label: 'Crash site', desc: 'Wreck er pashei apni. Pilot pashe pore ache. Cover nin, enemy ashche.', risk: 'Risk: Extreme' } },
    enemies: [], hostages: [{ pos: V3(2.2, 0, -0.6), yaw: PI / 2, pilot: true, name: 'Pilot Arif', hp: 260, look: { shirt: '#5a6040', trousers: '#4a4a3a', skin: '#a87652', seed: 50 } }],
    exits: [], rescued: () => false,
    objectives: [{ type: 'survive', label: 'Rescue heli asha porjonto tike thako' }, { type: 'protect', label: 'Pilot Arif ke rokkha koro' }], bonus: [],
    timer: { kind: 'survive', s: { recruit: 240, veteran: 300, elite: 360 } }, executions: false, noAlarm: true,
    waves: { start: 12, every: { recruit: 30, veteran: 24, elite: 19 }, count: 4, total: { recruit: 16, veteran: 24, elite: 32 }, maxAlive: 9, heavy: 0.15, spawns: sp, target: V3(2.2, 0, -0.6) },
    hawk: null,
    intro: { all: ['We are down! Pilot is hurt. Hold this position until the rescue bird arrives!', 'Rafi: Amra pore gechi! Pilot aahoto. Rescue heli asha porjonto ei jayga dhore rakho!'] },
    update(dt, t) {
      if (fireL) fireL.intensity = 12 + Math.sin(t * 17) * 3 + Math.sin(t * 7.3) * 2; fireCore.scale.setScalar(0.8 + Math.sin(t * 13) * 0.2);
      smokeT -= dt; if (smokeT <= 0) { smokeT = 0.25; FX.puff(V3(-0.6 + rr(-0.4, 0.4), 2.2, -1 + rr(-0.4, 0.4)), { count: 1, size: 1.2, life: 6, rise: 1.4, color: '#3a3632', spread: 0.3 }); if (R() < 0.5) FX.emit(V3(-0.6, 1.5, -1), V3(0, 1, 0), 3, '#ffa040', 1.5, 0.8, 0.6, 0.2); }
      const left = G.missionTimer ?? 999; if (left < 25) { const k = 1 - left / 25; rescue.position.set(0, 60 - k * 52, -60 + k * 56); rescue.userData.rotor.rotation.y += dt * 25; }
    },
    winLine: ['Rescue bird is down! Get the pilot on board! Outstanding, Tiger 24.', 'Rafi: Rescue heli neme geche! Pilot ke tolo! Darun lorai, Tiger 24!'],
    blueprint: { view: [-38, -38, 38, 38], markers: [[2.2, -0.6, 'PILOT', 'h'], [0, -34, 'WAVE', 'e'], [34, 0, 'WAVE', 'e'], [0, 34, 'WAVE', 'e'], [-34, 0, 'WAVE', 'e'], [3, -2, 'AMMO', 'b']] },
  };
}
