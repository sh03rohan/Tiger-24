// Mission 16 — Operation Floodgate (finale): storm over the dam; three charges on the turbines, the Red Tide chief, trapped engineers
import { THREE, G, PI, M, B, RB, C, SP, PL, RX, add, canvasTex, rng, R, rr, V3, FX } from '../core.js';
import * as K from '../levelkit.js';
const { addCollider, wallX, wallZ, floor, ceiling, deco, pointLight, room, prop, Door } = K;

export const meta = { id: 'floodgate', no: '16', name: 'Operation Floodgate', art: 'dam', type: 'Finale · bomb · arrest', loc: 'Kaptai Dam · turbine hall', time: '00:50 hrs · ghurnijhor', diff: 'Elite',
  obj: ['Tin ta turbine er charge defuse', 'Red Tide chief Saifur ke jibito arrest', 'Engineer der dam er crest diye ber kora'], intel: 'Red Tide er shesh chal: dam urie dewa. Charge gulo turbine e lagano. Saifur control room e. Or computer e charge er wire order ache. Bandh bhangle bhatir shob gram dube jabe.' };

let water = null, spray = 0;
export function build() {
  K.beginLevel({ skyEnv: true, grade: { sat: 0.86, contrast: 1.14, sh: [0.9, 0.97, 1.1], hi: [1.04, 1.0, 0.96] }, bg: '#05080c', fog: '#0c1218', fogD: 0.016, sun: 2.8, sunColor: '#9ab0d0', sunPos: [-20, 30, -25], sunTarget: [0, 0, 0], shadowSize: 36, hemi: 4.6, hemiSky: '#5e6e8a', hemiGround: '#14161a', envI: 0.45,
    rain: [[-36, -22, 36, -8]], rainN: 1500, lightning: true, alarmPos: [0, 7, 2], alarmBulbs: [[-28, 5, -5.8], [28, 5, -5.8], [-25, 2.8, 10.2]], skyTop: '#04060a', skyBottom: '#18202c', city: false, skyDist: 110, alarmLight: true, police: [-33, 2, -13] });
  const LG = K.LG, m = K.makeMaterials();
  const conc = M('#ffffff', 0.85, 0.05, { map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#6a6c6a'; g.fillRect(0, 0, w, h); const r = rng(13); for (let i = 0; i < 6000; i++) { const c = r() < 0.5 ? 0 : 255; g.fillStyle = `rgba(${c},${c},${c},.05)`; g.fillRect(r() * w, r() * h, 2, 2); } for (let y = 0; y < h; y += 64) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, y, w, 2); } for (let i = 0; i < 20; i++) { g.fillStyle = `rgba(40,50,40,${r() * 0.25})`; g.fillRect(r() * w, r() * h, 3, 20 + r() * 60); } }, { repeat: [10, 3] }) });
  const road = M('#b4b4ae', 0.4, 0.05, { map: m.concrete.map, normal: 0.8 }), yellow = M('#d9a21b', 0.5, 0.3), turb = M('#3a6a8a', 0.4, 0.6), steel = M('#8a9096', 0.35, 0.8);
  room('Control room', -30, 10, -18, 17, 'tile', 0.7); room('Turbine hall', -30, -6, 30, 10, 'concrete', 0.55); room('Dam crest', -36, -22, 36, -8, 'asphalt', 0.4, false);
  // crest road + reservoir (north) + drop to the river (south of the hall)
  floor(-36, -22, 36, -8, road); floor(-30, -8, 30, 10, M('#ffffff', 0.6, 0.2, { map: m.concrete.map }), 0.002); floor(-30, 10, -18, 17, M('#ffffff', 0.4, 0.05, { map: m.tile.map }), 0.004);
  const wv = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#0a141a'; g.fillRect(0, 0, w, h); const r = rng(5); for (let i = 0; i < 280; i++) { const x = r() * w, y = r() * h, s = 8 + r() * 34; const gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(110,140,160,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2); } }, { repeat: [40, 20] });
  water = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), M('#ffffff', 0.06, 0.3, { map: wv, normal: 2.5 })); water.rotation.x = -PI / 2; water.position.set(0, -1.4, -122); LG.add(water);
  const river = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), M('#ffffff', 0.1, 0.3, { map: wv, normal: 2 })); river.rotation.x = -PI / 2; river.position.set(0, -42, 120); LG.add(river);
  deco(B(76, 44, 2), conc, [0, -21, -22.8]); deco(B(76, 44, 30), conc, [0, -22.2, 2], [0.0, 0, 0]); deco(B(64, 30, 10), conc, [0, -27, 22], [-0.5, 0, 0]);
  for (let x = -30; x <= 30; x += 10) deco(B(3, 30, 1), M('#e8f0f4', 0.2, 0, { transparent: true, opacity: 0.5 }), [x, -28, 25.6], [-0.5, 0, 0], null, false);
  for (const [x1, z1, x2, z2] of [[-36, -22.2, 36, -22], [-36.2, -22, -36, -8], [36, -22, 36.2, -8], [-36, -8.2, -30, -8], [30, -8.2, 36, -8]]) addCollider(x1, 0, z1, x2, 1.1, z2, { vm: yellow, mat: 'metal', pen: true });
  addCollider(-30.3, 0, -8, -30, 3, -6, { vis: false }); addCollider(30, 0, -8, 30.3, 3, -6, { vis: false });
  for (const [x1, z1, x2, z2] of [[-36, -22.2, 36, -22], [-36.2, -22, -36, -8], [36, -22, 36.2, -8]]) addCollider(x1, 1.1, z1, x2, 4, z2, { vis: false, nav: false });
  for (let x = -34; x <= 34; x += 6) { deco(C(0.1, 0.12, 7, 8), m.darkSteel, [x, 3.5, -21.6]); deco(SP(0.25, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd8a0', toneMapped: false }), [x, 7, -21.4], null, null, false); }
  for (let x = -30; x <= 30; x += 12) { pointLight('#ffd8a0', 75, 20, x, 6.2, -19); K.shaft(V3(x, 7, -21.4), V3(0, -1, 0.35), 7.5, 0.25, 2.6, '#ffd8a0', 0.06); }
  // turbine hall
  wallX(-6, -30, 30, 9, conc, [{ a: -2, b: 2, y0: 0, y1: 3.2 }, { a: 22, b: 23.4, y0: 0, y1: 2.3 }], { mat: 'concrete' }); wallX(10, -30, 30, 9, conc, [{ a: -26, b: -24.8, y0: 0, y1: 2.3 }], { mat: 'concrete' });
  wallZ(-30, -6, 10, 9, conc, [], { mat: 'concrete' }); wallZ(30, -6, 10, 9, conc, [], { mat: 'concrete' }); ceiling(-30, -6, 30, 10, 9, m.ceilingDark); deco(B(60.6, 0.5, 16.6), conc, [0, 9.25, 2]);
  new Door({ axis: 'x', x1: 22, z: -6, w: 1.4, name: 'service' }); new Door({ axis: 'x', x1: -26, z: 10, w: 1.2, name: 'control' });
  for (const x of [-18, 0, 18]) { addCollider(x - 2.6, 0, -0.6, x + 2.6, 3.2, 4.6, { vis: false, mat: 'metal' }); deco(C(2.6, 2.6, 3.2, 28), turb, [x, 1.6, 2]); deco(C(1.6, 2.2, 1.6, 24), steel, [x, 4, 2]); deco(C(0.6, 0.6, 2.2, 14), yellow, [x, 5.9, 2]);
    deco(B(5.6, 0.12, 0.12), yellow, [x, 1.0, -0.8], null, null, false); for (let a = 0; a < 6; a++) deco(B(0.1, 3.2, 0.1), m.darkSteel, [x + Math.cos(a) * 2.65, 1.6, 2 + Math.sin(a) * 2.65], null, null, false); }
  deco(B(60, 0.6, 1), yellow, [0, 8.2, -2]); deco(B(60, 0.6, 1), yellow, [0, 8.2, 7]); deco(B(1.4, 0.8, 9.6), yellow, [8, 7.8, 2.5]);
  for (const [x1, x2] of [[-29.6, -27.4], [24, 29.6]]) for (const z of [-5.4, 9.4]) addCollider(x1, 0, z - 0.4, x2, 2.2, z + 0.4, { vm: m.darkSteel, mat: 'metal' });
  for (const [x, z] of [[-9, 7.6], [9, -3.6], [-9, -3.6], [27, 2]]) addCollider(x - 0.8, 0, z - 0.6, x + 0.8, 1.3, z + 0.6, { vm: M('#4a5a6a', 0.6, 0.4), mat: 'metal', pen: true });
  for (let x = -24; x <= 24; x += 12) { pointLight('#fff4e0', 11, 16, x, 7.6, 2); deco(B(1.6, 0.1, 0.6), m.fluo, [x, 8.9, 2], null, null, false); K.shaft(V3(x, 8.9, 2), V3(0, -1, 0), 8.9, 0.8, 3.2, '#eef4ff', 0.035); }
  pointLight('#ff4020', 4, 10, -18, 4, -1); pointLight('#ff4020', 4, 10, 18, 4, -1);
  // control room (south annex)
  wallZ(-18, 10, 17, 3.2, conc); wallX(17, -30, -18, 3.2, conc); wallZ(-30, 10, 17, 3.2, conc); ceiling(-30, 10, -18, 17, 3.2, m.ceiling);
  addCollider(-29.4, 0, 15.4, -19, 0.95, 16.4, { vm: m.darkSteel, mat: 'metal' }); for (let x = -28.6; x < -19.4; x += 1.2) deco(PL(0.9, 0.55), new THREE.MeshBasicMaterial({ color: x < -24 ? '#3cff8a' : '#ffb03a', toneMapped: false }), [x, 1.35, 15.38], [-0.3, PI, 0], null, false);
  deco(PL(8, 1.6), new THREE.MeshBasicMaterial({ map: canvasTex(512, 102, (g, w, h) => { g.fillStyle = '#04100c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3cff8a'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x < w; x += 4) g.lineTo(x, 50 + Math.sin(x * 0.05) * 20 + Math.sin(x * 0.13) * 8); g.stroke(); g.fillStyle = '#ff5040'; g.font = '700 22px monospace'; g.fillText('RESERVOIR 98%  ·  SPILLWAY OVERRIDE', 10, 95); }), toneMapped: false }), [-24, 2.3, 16.88], [0, PI, 0], null, false);
  addCollider(-24, 0, 12.4, -21, 0.78, 13.4, { vm: m.wood, mat: 'wood', pen: true }); prop('office', -22.4, 0, 14.2, PI); pointLight('#d8f0ff', 7, 10, -24, 2.9, 13.4);
  // police van at the crest exit
  deco(B(2.2, 2.2, 5), M('#2a3a6a', 0.5, 0.3), [-33, 1.2, -15.4]); addCollider(-34.1, 0, -17.9, -31.9, 2.4, -12.9, { vis: false, mat: 'metal' }); deco(B(1.6, 0.16, 0.5), new THREE.MeshBasicMaterial({ color: '#ff3030', toneMapped: false }), [-33, 2.4, -14], null, null, false);
  // bombs + intel
  for (const [p, label, name] of [[V3(-18, 0.25, -1.2), 'Turbine 1 charge', 'Turbine 1'], [V3(0, 0.25, -1.2), 'Turbine 2 charge', 'Turbine 2'], [V3(18, 0.25, -1.2), 'Turbine 3 charge', 'Turbine 3']]) { const bm = K.bombModel(p); K.addInteractable('bomb', p, label, bm.g, { disp: bm.disp, name }); }
  K.addInteractable('intel', V3(-22.5, 0.95, 12.9), 'Saifur er laptop: charge er wire order', K.pickupModel('intel', V3(-22.5, 0.95, 12.9)));
  for (const [kind, pos, label] of [['ammo', V3(-34, 0.2, -10), 'Ammo refill'], ['medkit', V3(-29.2, 1.25, 7), 'Medkit nao'], ['ammo', V3(27, 1.5, 2), 'Ammo refill'], ['medkit', V3(-26, 1.3, 15.2), 'Medkit nao']]) K.addInteractable(kind, pos, label, K.pickupModel(kind, pos, kind === 'medkit' ? PI / 2 : 0));
  for (let i = 0; i < 6; i++) prop(i % 2 ? 'box' : 'bin', rr(-26, 26), 0, rr(6, 9));
  K.buildCameras([{ pos: V3(-1.6, 2.9, -6.4), yaw: K.camLook(V3(-1.6, 0, -6.4), V3(-8, 0, -16)), pitch: -0.3 }, { pos: V3(29.6, 6, 9.6), yaw: K.camLook(V3(29.6, 0, 9.6), V3(10, 0, 0)), pitch: -0.4 }]);
  return {
    id: 'floodgate', bounds: { x0: -36.4, z0: -22.4, x1: 36.4, z1: 17.4 },
    spawns: { crest: { pos: V3(-33, 0, -11), yaw: -PI / 2, label: 'Dam crest', desc: 'Police van er arale theke crest road diye hall er main door. Jhor ar khola rasta.', risk: 'Risk: High' },
      crane: { pos: V3(25, 0, 6.6), yaw: PI / 2, rappel: 8, label: 'Crane hatch', desc: 'Chhader crane hatch diye rope e turbine hall er purbo kone. Charge er kache, surprise.', risk: 'Risk: Extreme · Surprise', surprise: ['Turbine hall'] } },
    enemies: [
      { id: 'E1', pos: V3(-14, 0, -12), yaw: -PI / 2, room: 'Dam crest', patrol: [V3(-26, 0, -12), V3(26, 0, -12)] }, { id: 'E2', pos: V3(-1.6, 0, -8.6), yaw: PI, room: 'Dam crest' }, { id: 'E3', pos: V3(1.8, 0, -8.6), yaw: PI, room: 'Dam crest' },
      { id: 'E4', pos: V3(20, 0, -16), yaw: PI / 2, room: 'Dam crest' }, { id: 'E5', pos: V3(-9, 0, -1.6), yaw: 0, room: 'Turbine hall', heavy: true }, { id: 'E6', pos: V3(9, 0, 6.6), yaw: PI, room: 'Turbine hall', patrol: [V3(-24, 0, 7), V3(24, 0, 7)] },
      { id: 'E7', pos: V3(-24, 0, 2), yaw: -PI / 2, room: 'Turbine hall' }, { id: 'E8', pos: V3(24, 0, -2), yaw: PI / 2, room: 'Turbine hall' }, { id: 'E9', pos: V3(12, 0, -3.6), yaw: 0, room: 'Turbine hall', heavy: true },
      { id: 'E10', pos: V3(-20, 0, 12), yaw: PI / 2, room: 'Control room' }, { id: 'E11', pos: V3(-6, 0, 8.2), yaw: PI, room: 'Turbine hall' },
      { id: 'SAIFUR', pos: V3(-25.6, 0, 13.8), yaw: 0, room: 'Control room', leader: true, name: 'Saifur' },
    ],
    hostages: [{ pos: V3(-28.2, 0, 12.2), yaw: -PI / 2 }, { pos: V3(-28.2, 0, 13.6), yaw: -PI / 2 }, { pos: V3(4.6, 0, 7.6), yaw: PI }, { pos: V3(-4.6, 0, 7.6), yaw: PI }, { pos: V3(14, 0, 7.8), yaw: PI }]
      .map((h, i) => ({ ...h, look: { shirt: ['#3a5a8a', '#d9a21b', '#3a5a8a', '#e8e8e0', '#d9a21b'][i], trousers: '#2a2e36', skin: ['#a87652', '#c08a62', '#8a5a3a', '#b07a50', '#9a6a48'][i], seed: 90 + i } })),
    exits: [V3(-34, 0, -10)], rescued: p => p.x < -31 && p.z < -8,
    objectives: [{ type: 'defuse', intelHint: 'Control room e Saifur er laptop' }, { type: 'arrest', target: 'SAIFUR', label: 'Saifur ke jibito arrest', sub: 'Flashbang/taser e stun koro, V chaple surrender' }, { type: 'rescue', label: 'Engineer der crest er police van e pathao' }],
    bonus: ['stealth'], timer: { kind: 'bomb', s: { recruit: 1080, veteran: 900, elite: 720 } }, executions: true, maxDead: 2, shieldRetreat: V3(-29, 0, 16.4),
    hawk: V3(-30, 10, -40), hawkLine: ['Hawk across the reservoir on the boat. I can see the whole crest.', 'Hawk: Reservoir er opare boat e achi. Puro crest amar nojore.'],
    intro: { all: ['This is the last of Red Tide. Three charges on the turbines, Saifur in the control room. If this dam goes, the valley drowns.', 'Rafi: Red Tide er shesh. Turbine e tin ta charge, Saifur control room e. Bandh bhangle puro upotyoka dube jabe.'] },
    update(dt, t) { if (water) { water.material.map.offset.x += dt * 0.01; } spray -= dt; if (spray <= 0) { spray = 0.3; FX.puff(V3(rr(-28, 28), -18 + rr(-4, 4), 24 + rr(-2, 2)), { count: 1, size: 3, life: 3, rise: 3, color: '#cfd8de', spread: 1 }); } },
    winLine: ['Charges safe, Saifur in cuffs, the dam holds. Red Tide is finished. Tiger 24, the country owes you.', 'Rafi: Charge nishkriyo, Saifur grephtar, bandh tikey ache. Red Tide shesh. Tiger 24, desh tomader kache rini.'],
    blueprint: { view: [-36, -22, 36, 17], markers: [[-18, -1.2, 'C1', 'b'], [0, -1.2, 'C2', 'b'], [18, -1.2, 'C3', 'b'], [-22.5, 12.9, 'LAPTOP', 'b'], [-25.6, 13.8, 'SAIFUR', 'e'], [-28.2, 12.9, '2', 'h'], [0, 7.6, '3', 'h'], [-34, -10, 'EXIT', 'b'], [-14, -12, '', 'e'], [0, -8.6, '', 'e'], [20, -16, '', 'e'], [-9, -1.6, '', 'e'], [9, 6.6, '', 'e'], [-24, 2, '', 'e'], [24, -2, '', 'e'], [12, -3.6, '', 'e'], [-20, 12, '', 'e'], [-6, 8.2, '', 'e']] },
  };
}
