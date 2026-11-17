// Tiger 24 · Operation Vault — core engine: shared state, utils, renderer, audio, voice, particles
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
export { THREE, CANNON };

export const PI = Math.PI, TAU = PI * 2;
export const $ = id => document.getElementById(id);
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, l, dt) => a + (b - a) * (1 - Math.exp(-l * dt));
export const R = Math.random;
export const rr = (a, b) => a + Math.random() * (b - a);
export function angDiff(a, b) { let d = (b - a) % TAU; if (d > PI) d -= TAU; if (d < -PI) d += TAU; return d; }
export function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const store = {
  get(k, d) { try { const v = localStorage.getItem('t24v.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('t24v.' + k, JSON.stringify(v)); } catch (e) { } }
};

const _mob = matchMedia('(pointer: coarse)').matches;
export const DEFAULT_SETTINGS = { sens: 1, fov: 75, volume: 80, music: 45, voice: true, subs: true, quality: _mob ? 'medium' : 'high', invertY: false };
export const G = {
  settings: Object.assign({}, DEFAULT_SETTINGS, store.get('settings', {})),
  state: 'boot', time: 0, dt: 0, diff: 'veteran', entry: 'front',
  mobile: matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window,
  agents: [], enemies: [], hostages: [], team: [], props: [], dyn: [], hitboxes: [],
  hooks: {}, stats: null,
};
window.__T24 = G;

/* ---------- material & geometry helpers ---------- */
const matCache = new Map();
export function M(color, rough = 0.8, metal = 0, extra = null) {
  let key = null;
  if (!extra || Object.values(extra).every(v => typeof v !== 'object' || (v && v.isTexture))) {
    key = color + '|' + rough + '|' + metal + '|' + (extra ? Object.entries(extra).map(([k, v]) => k + ':' + (v && v.isTexture ? v.uuid : v)).join(',') : '');
    if (matCache.has(key)) return matCache.get(key);
  }
  const ex = Object.assign({}, extra || {}); const ns = ex.normal; delete ex.normal;
  if (ex.map && ex.map.userData && ex.map.userData.canvas && !ex.normalMap && ns !== false) { const pm = pbrMaps(ex.map); ex.normalMap = pm.normal; ex.roughnessMap = pm.rough; const k = typeof ns === 'number' ? ns : 0.9; ex.normalScale = new THREE.Vector2(k, k); }
  const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: metal }, ex));
  if (key) matCache.set(key, m);
  return m;
}
/* derive a tileable normal map + roughness variation from a canvas texture's luminance (sobel) */
const _pbr = new WeakMap();
export function pbrMaps(tex) {
  if (_pbr.has(tex)) return _pbr.get(tex);
  const src = tex.userData.canvas; const sc = Math.min(1, 512 / Math.max(src.width, src.height)); const w = Math.max(4, Math.round(src.width * sc)), h = Math.max(4, Math.round(src.height * sc));
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(src, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data, L = new Float32Array(w * h); let mean = 0;
  for (let i = 0; i < w * h; i++) { L[i] = (d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114) / 255; mean += L[i]; } mean /= w * h;
  const nc = document.createElement('canvas'); nc.width = w; nc.height = h; const ng = nc.getContext('2d'); const nd = ng.createImageData(w, h);
  const rc = document.createElement('canvas'); rc.width = w; rc.height = h; const rg = rc.getContext('2d'); const rd = rg.createImageData(w, h);
  { const T = new Float32Array(w * h); for (let pass = 0; pass < 2; pass++) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let acc = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) acc += L[((y + j + h) % h) * w + ((x + i + w) % w)]; T[y * w + x] = acc / 9; } L.set(T); } }
  const at = (x, y) => L[((y + h) % h) * w + ((x + w) % w)]; const S = 3.0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1)) - (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
    const dy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1)) - (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));
    let nx = -dx * S, ny = dy * S, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l; const i = (y * w + x) * 4;
    nd.data[i] = (nx * 0.5 + 0.5) * 255; nd.data[i + 1] = (ny * 0.5 + 0.5) * 255; nd.data[i + 2] = (nz * 0.5 + 0.5) * 255; nd.data[i + 3] = 255;
    const r = Math.max(0.55, Math.min(1, 0.86 + (mean - L[y * w + x]) * 0.5 + Math.abs(dx) * 0.2)) * 255; rd.data[i] = rd.data[i + 1] = rd.data[i + 2] = r; rd.data[i + 3] = 255; }
  ng.putImageData(nd, 0, 0); rg.putImageData(rd, 0, 0);
  const mk = cv => { const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat = tex.repeat; t.offset = tex.offset; t.anisotropy = 8; return t; };
  const out = { normal: mk(nc), rough: mk(rc) }; _pbr.set(tex, out); return out;
}
/* gradient-sky environment map so outdoor reflections match the level's sky */
let _roomEnv = null, _skyEnv = null;
export function setSkyEnv(top, bottom, ground, sunDir, sunColor) {
  if (_skyEnv) { _skyEnv.dispose(); _skyEnv = null; }
  if (!top) { G.scene.environment = _roomEnv; return; }
  const sc = new THREE.Scene(); const mat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) }, ground: { value: new THREE.Color(ground || '#1a1a16') }, sd: { value: new THREE.Vector3(...(sunDir || [0, 1, 0])).normalize() }, sc: { value: new THREE.Color(sunColor || '#ffffff') } },
    vertexShader: 'varying vec3 vd; void main(){ vd = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'uniform vec3 top,bottom,ground,sc,sd; varying vec3 vd; void main(){ vec3 d=normalize(vd); float y=d.y; vec3 c = y>0. ? mix(bottom, top, pow(y,0.6)) : mix(bottom*0.6, ground, min(1.,-y*4.)); c += sc * pow(max(dot(d,sd),0.),64.) * 6. + sc*pow(max(dot(d,sd),0.),4.)*0.35; gl_FragColor=vec4(c,1.); }' });
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), mat));
  _skyEnv = G.pmrem.fromScene(sc, 0.02).texture; G.scene.environment = _skyEnv; mat.dispose();
}
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, res: { value: new THREE.Vector2(1, 1) }, sat: { value: 1.06 }, contrast: { value: 1.07 }, vig: { value: 0.42 }, grain: { value: 0.03 }, ca: { value: 0.006 }, hurt: { value: 0 },
    sh: { value: new THREE.Vector3(0.95, 1.0, 1.06) }, hi: { value: new THREE.Vector3(1.04, 1.0, 0.95) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time,sat,contrast,vig,grain,ca,hurt; uniform vec2 res; uniform vec3 sh,hi; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    void main(){ vec2 d=vUv-0.5; float r2=dot(d,d); vec2 o=d*ca*(r2*4.0+hurt*2.0);
      vec3 c=vec3(texture2D(tDiffuse,vUv-o).r, texture2D(tDiffuse,vUv).g, texture2D(tDiffuse,vUv+o).b);
      float l=dot(c,vec3(0.299,0.587,0.114)); c=mix(vec3(l),c,sat*(1.0-hurt*0.65)); c=(c-0.5)*contrast+0.5;
      c*=mix(sh,hi,smoothstep(0.05,0.8,l)); float v=smoothstep(0.12,0.62,r2*2.0); c*=1.0-vig*v; c=mix(c,c*vec3(1.0,0.25,0.2),hurt*v*0.8);
      c+=(hash(vUv*res+fract(time)*61.0)-0.5)*grain; gl_FragColor=vec4(clamp(c,0.,1.),1.); }`,
};
const geoCache = new Map();
function cg(key, fn) { if (!geoCache.has(key)) geoCache.set(key, fn()); return geoCache.get(key); }
export const B = (w, h, d) => cg(`B${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
export const RB = (w, h, d, r = 0.01, s = 1) => { s = Math.min(s, 2); return cg(`RB${w},${h},${d},${r},${s}`, () => new RoundedBoxGeometry(w, h, d, s, Math.min(r, Math.min(w, h, d) * 0.49))); };
export const C = (rt, rb, h, seg = 16, open = false) => cg(`C${rt},${rb},${h},${seg},${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open));
export const SP = (r, ws = 14, hs = 10) => { ws = Math.min(ws, 16); hs = Math.min(hs, 11); return cg(`S${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs)); };
export const CAP = (r, len) => cg(`CAP${r},${len}`, () => new THREE.CapsuleGeometry(r, len, 3, 9));
export const PL = (w, h) => cg(`PL${w},${h}`, () => new THREE.PlaneGeometry(w, h));
export const RX = [PI / 2, 0, 0];
export function add(parent, geo, mat, pos = [0, 0, 0], rot = null, scl = null, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]); if (scl) m.scale.set(scl[0], scl[1], scl[2]);
  m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
}
export function canvasTex(w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 8; t.userData.canvas = c; return t;
}
export function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/* ---------- renderer ---------- */
export const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
export function initGraphics(host) {
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.domElement.tabIndex = 0;
  host.appendChild(renderer.domElement); G.host = host;
  const scene = G.scene = new THREE.Scene(); scene.background = new THREE.Color('#05070a'); scene.fog = new THREE.FogExp2('#06080b', 0.014);
  const pm = G.pmrem = new THREE.PMREMGenerator(renderer); const env = _roomEnv = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env; scene.environmentIntensity = 0.22;
  G.camera = new THREE.PerspectiveCamera(G.settings.fov, 1, 0.03, 300); scene.add(G.camera);
  // viewmodel scene rendered on top with cleared depth so the gun never clips into walls
  G.vmScene = new THREE.Scene(); G.vmScene.environment = env; G.vmScene.environmentIntensity = 0.35;
  G.vmCamera = new THREE.PerspectiveCamera(55, 1, 0.01, 10); G.vmScene.add(G.vmCamera);
  G.vmHemi = new THREE.HemisphereLight('#c9d4e0', '#2a2018', 1.2); G.vmScene.add(G.vmHemi);
  G.vmKey = new THREE.DirectionalLight('#fff1dd', 1.4); G.vmKey.position.set(1, 2, 1); G.vmScene.add(G.vmKey);
  G.vmFlash = new THREE.PointLight('#ffb35a', 0, 3, 2); G.vmFlash.position.set(0.1, -0.1, -0.7); G.vmScene.add(G.vmFlash);
  G.composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
  G.composer.addPass(new RenderPass(scene, G.camera));
  G.ao = new GTAOPass(scene, G.camera, 512, 512); G.ao.blendIntensity = 0.85;
  G.ao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.4, thickness: 1.2, scale: 1.15, samples: 12, distanceFallOff: 1 }); G.ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
  G.composer.addPass(G.ao);
  const vm = new RenderPass(G.vmScene, G.vmCamera); vm.clear = false; vm.clearDepth = true; G.composer.addPass(vm);
  G.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.4, 0.5, 0.86); G.composer.addPass(G.bloom);
  G.composer.addPass(new OutputPass());
  G.grade = new ShaderPass(GradeShader); G.composer.addPass(G.grade);
  const world = G.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
  world.broadphase = new CANNON.SAPBroadphase(world); world.allowSleep = true;
  world.defaultContactMaterial.friction = 0.4; world.defaultContactMaterial.restitution = 0.1; world.solver.iterations = 10;
  new ResizeObserver(resize).observe(host);
  applyQuality();
}
export function resize() {
  const h = G.host; if (!h) return; const w = h.clientWidth || 1, ht = h.clientHeight || 1;
  renderer.setSize(w, ht, false); G.composer.setSize(w, ht); G.bloom.resolution.set(w, ht); G.grade && G.grade.uniforms.res.value.set(w, ht);
  G.camera.aspect = w / ht; G.camera.updateProjectionMatrix(); G.vmCamera.aspect = w / ht; G.vmCamera.updateProjectionMatrix();
}
export function applyQuality() {
  const q = G.settings.quality, dpr = window.devicePixelRatio || 1;
  renderer.setPixelRatio(q === 'low' ? 0.7 : q === 'medium' ? 1 : q === 'high' ? Math.min(dpr, 1.5) : Math.min(dpr, 2));
  renderer.shadowMap.enabled = q !== 'low'; if (G.bloom) G.bloom.enabled = q !== 'low';
  renderer.shadowMap.type = (q === 'high' || q === 'ultra') ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  if (G.ao) G.ao.enabled = q === 'high' || q === 'ultra';
  if (G.grade) { G.grade.uniforms.grain.value = q === 'low' ? 0 : 0.03; G.grade.uniforms.ca.value = q === 'low' ? 0 : 0.006; }
  const smp = q === 'ultra' ? 4 : q === 'high' ? 4 : q === 'medium' ? 2 : 0;
  if (G.composer && G.composer.renderTarget1.samples !== smp) { for (const rt of [G.composer.renderTarget1, G.composer.renderTarget2]) { rt.samples = smp; rt.dispose(); } }
  G.scene && G.scene.traverse(o => { if (o.isDirectionalLight && o.castShadow) { const sz = q === 'ultra' ? 4096 : q === 'high' ? 2048 : 1024; if (o.shadow.mapSize.x !== sz) { o.shadow.mapSize.set(sz, sz); if (o.shadow.map) { o.shadow.map.dispose(); o.shadow.map = null; } } } });
  if (G.scene) G.scene.traverse(o => { if (o.material && !Array.isArray(o.material)) o.material.needsUpdate = true; });
  resize();
}

/* ---------- audio ---------- */
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3();
export const A = {
  ctx: null, ok: false, loops: {},
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const c = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = c.createGain(); this.master.connect(c.destination);
      this.comp = c.createDynamicsCompressor(); this.comp.threshold.value = -14; this.comp.ratio.value = 4; this.comp.connect(this.master);
      this.sfx = c.createGain(); this.sfx.connect(this.comp);
      this.amb = c.createGain(); this.amb.connect(this.master);
      this.muffle = c.createBiquadFilter(); this.muffle.type = 'lowpass'; this.muffle.frequency.value = 20000; this.sfx.disconnect(); this.sfx.connect(this.muffle); this.muffle.connect(this.comp);
      this.rev = c.createConvolver(); this.rev.buffer = this.impulse(2.0); this.revGain = c.createGain(); this.revGain.gain.value = 0.5; this.rev.connect(this.revGain); this.revGain.connect(this.muffle);
      const len = c.sampleRate * 2; this.nbuf = c.createBuffer(1, len, c.sampleRate); const d = this.nbuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.ok = true; this.setVol();
    } catch (e) { this.ok = false; }
  },
  setVol() { if (!this.ok) return; this.master.gain.value = G.settings.volume / 100; this.amb.gain.value = G.settings.music / 100; },
  impulse(sec) { const c = this.ctx, len = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, len, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); } return b; },
  now() { return this.ctx.currentTime; },
  out(pos, { occl = false, rev = 0.25, ref = 3, roll = 1.1 } = {}) {
    const c = this.ctx; const head = c.createGain(); let node = head;
    if (occl) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 650; node.connect(f); node = f; }
    if (pos) { const p = c.createPanner(); p.panningModel = 'equalpower'; p.distanceModel = 'inverse'; p.refDistance = ref; p.maxDistance = 150; p.rolloffFactor = roll;
      if (p.positionX) { p.positionX.value = pos.x; p.positionY.value = pos.y; p.positionZ.value = pos.z; } else p.setPosition(pos.x, pos.y, pos.z); node.connect(p); node = p; }
    node.connect(this.sfx); if (rev > 0) { const s = c.createGain(); s.gain.value = rev; node.connect(s); s.connect(this.rev); }
    return head;
  },
  noise(dst, t, { type = 'lowpass', f0 = 2000, f1 = 200, dur = 0.3, gain = 0.5, q = 0.7, attack = 0.002 }) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.nbuf; const f = c.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    s.connect(f); f.connect(g); g.connect(dst); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  },
  tone(dst, t, { f0 = 800, f1 = 600, dur = 0.1, gain = 0.2, type = 'sine', attack = 0.002 }) {
    const c = this.ctx, o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(g); g.connect(dst); o.start(t); o.stop(t + dur + 0.05);
  },
  listener(cam) {
    if (!this.ok) return; const L = this.ctx.listener; cam.getWorldPosition(_v1); cam.getWorldDirection(_v2);
    if (L.positionX) { L.positionX.value = _v1.x; L.positionY.value = _v1.y; L.positionZ.value = _v1.z; L.forwardX.value = _v2.x; L.forwardY.value = _v2.y; L.forwardZ.value = _v2.z; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0; }
    else { L.setPosition(_v1.x, _v1.y, _v1.z); L.setOrientation(_v2.x, _v2.y, _v2.z, 0, 1, 0); }
  },
  // ---- sound library ----
  shot(kind, pos = null, occl = false) {
    if (!this.ok) return; const t = this.now();
    if (kind === 'carbine') { const o = this.out(pos, { occl, rev: 0.18 }); this.noise(o, t, { f0: 3200, f1: 280, dur: 0.15, gain: 0.55 }); this.tone(o, t, { f0: 150, f1: 40, dur: 0.11, gain: 0.45 }); this.noise(o, t + 0.004, { type: 'highpass', f0: 5200, f1: 3000, dur: 0.035, gain: 0.25 }); }
    else if (kind === 'pistol') { const o = this.out(pos, { occl, rev: 0.6 }); this.noise(o, t, { f0: 8000, f1: 400, dur: 0.28, gain: 0.95 }); this.tone(o, t, { f0: 130, f1: 35, dur: 0.16, gain: 0.7 }); this.noise(o, t + 0.04, { f0: 1100, f1: 120, dur: 0.8, gain: 0.22 }); }
    else if (kind === 'ak') { const o = this.out(pos, { occl, rev: 0.6, ref: 4 }); this.noise(o, t, { f0: 6500, f1: 300, dur: 0.34, gain: 0.9 }); this.tone(o, t, { f0: 105, f1: 32, dur: 0.2, gain: 0.75 }); this.noise(o, t + 0.05, { f0: 900, f1: 100, dur: 0.9, gain: 0.2 }); }
    else if (kind === 'team') { const o = this.out(pos, { occl, rev: 0.25 }); this.noise(o, t, { f0: 2600, f1: 260, dur: 0.15, gain: 0.5 }); this.tone(o, t, { f0: 140, f1: 40, dur: 0.1, gain: 0.4 }); }
    else if (kind === 'sniper2') { const o = this.out(pos, { occl, rev: 0.7, ref: 4 }); this.noise(o, t, { f0: 7000, f1: 250, dur: 0.4, gain: 1 }); this.tone(o, t, { f0: 90, f1: 28, dur: 0.25, gain: 0.9 }); this.noise(o, t + 0.05, { f0: 800, f1: 80, dur: 1.2, gain: 0.25 }); }
    else if (kind === 'shotgun') { const o = this.out(pos, { occl, rev: 0.7, ref: 4 }); this.noise(o, t, { f0: 5000, f1: 150, dur: 0.45, gain: 1 }); this.tone(o, t, { f0: 80, f1: 25, dur: 0.3, gain: 1 }); this.noise(o, t + 0.35, { type: 'bandpass', f0: 1200, f1: 900, dur: 0.12, gain: 0.25, q: 2 }); this.noise(o, t + 0.55, { type: 'bandpass', f0: 1500, f1: 1100, dur: 0.1, gain: 0.25, q: 2 }); }
    else if (kind === 'taser') { const o = this.out(pos, { occl, rev: 0 }); for (let i = 0; i < 8; i++) this.tone(o, t + i * 0.03, { f0: 3000 + R() * 1500, f1: 2000, dur: 0.025, gain: 0.12, type: 'square' }); }
    else if (kind === 'sniper') { const o = this.out(null, { rev: 0.7 }); this.noise(o, t, { type: 'highpass', f0: 2500, f1: 1200, dur: 0.12, gain: 0.7 }); this.noise(o, t + 0.25, { f0: 700, f1: 60, dur: 1.4, gain: 0.35 }); }
  },
  impact(mat, pos) {
    if (!this.ok) return; const t = this.now(), o = this.out(pos, { rev: 0.15, ref: 1.5 });
    if (mat === 'metal') { this.tone(o, t, { f0: 2600 + R() * 800, f1: 2200, dur: 0.25, gain: 0.12 }); this.noise(o, t, { type: 'bandpass', f0: 4000, f1: 3000, dur: 0.05, gain: 0.3, q: 2 }); }
    else if (mat === 'wood') { this.tone(o, t, { f0: 320, f1: 140, dur: 0.07, gain: 0.25, type: 'triangle' }); this.noise(o, t, { f0: 1800, f1: 300, dur: 0.07, gain: 0.25 }); }
    else if (mat === 'flesh') { this.tone(o, t, { f0: 140, f1: 60, dur: 0.09, gain: 0.4 }); this.noise(o, t, { f0: 900, f1: 200, dur: 0.08, gain: 0.35 }); }
    else if (mat === 'glass') this.glass(pos);
    else { this.noise(o, t, { type: 'bandpass', f0: 2600, f1: 1400, dur: 0.06, gain: 0.35, q: 1.2 }); this.noise(o, t + 0.01, { f0: 1500, f1: 300, dur: 0.18, gain: 0.08 }); }
  },
  glass(pos) { if (!this.ok) return; const t = this.now(), o = this.out(pos, { rev: 0.4 }); this.noise(o, t, { type: 'highpass', f0: 3000, f1: 6000, dur: 0.5, gain: 0.5 }); for (let i = 0; i < 10; i++) this.tone(o, t + R() * 0.4, { f0: 2500 + R() * 3500, f1: 2000, dur: 0.07, gain: 0.07 }); },
  casing() { if (!this.ok) return; const t = this.now() + 0.28, o = this.out(null, { rev: 0.1 }); this.tone(o, t, { f0: 4200, f1: 3800, dur: 0.07, gain: 0.04 }); this.tone(o, t + 0.09, { f0: 3900, f1: 3600, dur: 0.05, gain: 0.025 }); },
  step(surface, pos, loud = 1) {
    if (!this.ok) return; const t = this.now(), o = this.out(pos, { rev: surface === 'marble' ? 0.3 : 0.1, ref: 1.5 });
    if (surface === 'marble' || surface === 'tile') { this.noise(o, t, { type: 'bandpass', f0: 2600, f1: 1500, dur: 0.05, gain: 0.16 * loud, q: 1.5 }); this.tone(o, t, { f0: 180, f1: 90, dur: 0.04, gain: 0.08 * loud }); }
    else if (surface === 'carpet') this.noise(o, t, { f0: 600, f1: 200, dur: 0.07, gain: 0.08 * loud });
    else if (surface === 'wet') { this.noise(o, t, { type: 'bandpass', f0: 1800, f1: 900, dur: 0.12, gain: 0.14 * loud, q: 0.8 }); }
    else { this.noise(o, t, { type: 'bandpass', f0: 1400, f1: 700, dur: 0.06, gain: 0.14 * loud, q: 1 }); this.tone(o, t, { f0: 140, f1: 70, dur: 0.05, gain: 0.07 * loud }); }
  },
  mech(kind) {
    if (!this.ok) return; const t = this.now(), o = this.out(null, { rev: 0.1 });
    if (kind === 'magout') { this.noise(o, t, { type: 'highpass', f0: 2500, f1: 1500, dur: 0.06, gain: 0.3 }); this.tone(o, t + 0.02, { f0: 900, f1: 500, dur: 0.05, gain: 0.12, type: 'square' }); }
    if (kind === 'magin') { this.tone(o, t, { f0: 1600, f1: 900, dur: 0.04, gain: 0.2, type: 'square' }); this.noise(o, t, { type: 'highpass', f0: 4000, f1: 2500, dur: 0.05, gain: 0.3 }); }
    if (kind === 'bolt') { this.tone(o, t, { f0: 2200, f1: 1400, dur: 0.035, gain: 0.2, type: 'square' }); this.tone(o, t + 0.12, { f0: 1800, f1: 1100, dur: 0.04, gain: 0.22, type: 'square' }); }
    if (kind === 'empty') this.tone(o, t, { f0: 2400, f1: 1800, dur: 0.025, gain: 0.18, type: 'square' });
    if (kind === 'switch') { this.noise(o, t, { type: 'highpass', f0: 3000, f1: 2000, dur: 0.08, gain: 0.2 }); this.tone(o, t + 0.1, { f0: 1500, f1: 1100, dur: 0.03, gain: 0.12, type: 'square' }); }
    if (kind === 'mode') this.tone(o, t, { f0: 2000, f1: 1900, dur: 0.02, gain: 0.15, type: 'square' });
    if (kind === 'pin') { this.tone(o, t, { f0: 3500, f1: 3000, dur: 0.05, gain: 0.1 }); this.noise(o, t + 0.05, { type: 'highpass', f0: 3000, f1: 2000, dur: 0.1, gain: 0.15 }); }
  },
  clink(pos) { if (!this.ok) return; const t = this.now(), o = this.out(pos, { rev: 0.3, ref: 1.5 }); this.tone(o, t, { f0: 3000, f1: 2600, dur: 0.12, gain: 0.12 }); this.tone(o, t, { f0: 4600, f1: 4200, dur: 0.08, gain: 0.06 }); },
  bang(pos) { if (!this.ok) return; const t = this.now(), o = this.out(pos, { rev: 0.8, ref: 5 }); this.noise(o, t, { f0: 9000, f1: 200, dur: 0.6, gain: 1 }); this.tone(o, t, { f0: 90, f1: 30, dur: 0.4, gain: 0.9 }); this.noise(o, t + 0.05, { f0: 1200, f1: 80, dur: 1.6, gain: 0.3 }); },
  boom(pos) { if (!this.ok) return; const t = this.now(), o = this.out(pos, { rev: 0.9, ref: 6 }); this.noise(o, t, { f0: 2000, f1: 40, dur: 1.8, gain: 1 }); this.tone(o, t, { f0: 70, f1: 22, dur: 1.0, gain: 1 }); this.noise(o, t, { type: 'highpass', f0: 6000, f1: 2000, dur: 0.2, gain: 0.5 }); },
  tinnitus(sec) { if (!this.ok) return; const t = this.now(); this.muffle.frequency.cancelScheduledValues(t); this.muffle.frequency.setValueAtTime(500, t); this.muffle.frequency.exponentialRampToValueAtTime(20000, t + sec);
    const o = this.out(null, { rev: 0 }); this.tone(o, t, { f0: 3800, f1: 3700, dur: sec, gain: 0.08, attack: 0.05 }); },
  muffled(sec) { if (!this.ok) return; const t = this.now(); this.muffle.frequency.cancelScheduledValues(t); this.muffle.frequency.setValueAtTime(1200, t); this.muffle.frequency.exponentialRampToValueAtTime(20000, t + sec); },
  door(pos, kind = 'open') { if (!this.ok) return; const t = this.now(), o = this.out(pos, { rev: 0.3 });
    if (kind === 'open') { this.noise(o, t, { type: 'bandpass', f0: 700, f1: 400, dur: 0.35, gain: 0.25, q: 3 }); this.tone(o, t, { f0: 900, f1: 700, dur: 0.05, gain: 0.08, type: 'square' }); }
    else if (kind === 'locked') { for (let i = 0; i < 3; i++) this.tone(o, t + i * 0.08, { f0: 600, f1: 400, dur: 0.05, gain: 0.15, type: 'square' }); }
    else { this.tone(o, t, { f0: 160, f1: 60, dur: 0.15, gain: 0.35, type: 'triangle' }); } },
  zip() { if (!this.ok) return; const t = this.now(), o = this.out(null, { rev: 0 }); this.noise(o, t, { type: 'highpass', f0: 3000, f1: 6000, dur: 0.18, gain: 0.25 }); this.tone(o, t + 0.18, { f0: 2500, f1: 2000, dur: 0.03, gain: 0.15, type: 'square' }); },
  cuff() { if (!this.ok) return; const t = this.now(), o = this.out(null, { rev: 0 }); for (let i = 0; i < 6; i++) this.tone(o, t + i * 0.04, { f0: 3200, f1: 2800, dur: 0.03, gain: 0.1, type: 'square' }); this.tone(o, t + 0.3, { f0: 2400, f1: 2000, dur: 0.06, gain: 0.15, type: 'square' }); },
  hit() { if (!this.ok) return; const t = this.now(), o = this.out(null, { rev: 0 }); this.tone(o, t, { f0: 1800, f1: 1700, dur: 0.04, gain: 0.12, type: 'triangle' }); },
  kill() { if (!this.ok) return; const t = this.now(), o = this.out(null, { rev: 0 }); this.tone(o, t, { f0: 1200, f1: 1150, dur: 0.06, gain: 0.12, type: 'triangle' }); this.tone(o, t + 0.07, { f0: 1600, f1: 1550, dur: 0.08, gain: 0.12, type: 'triangle' }); },
  hurt() { if (!this.ok) return; const t = this.now(), o = this.out(null, { rev: 0 }); this.tone(o, t, { f0: 180, f1: 90, dur: 0.18, gain: 0.35, type: 'sawtooth' }); this.noise(o, t, { f0: 800, f1: 200, dur: 0.12, gain: 0.3 }); },
  heartbeat() { if (!this.ok) return; const t = this.now(), o = this.out(null, { rev: 0 }); this.tone(o, t, { f0: 60, f1: 40, dur: 0.12, gain: 0.5 }); this.tone(o, t + 0.22, { f0: 55, f1: 38, dur: 0.12, gain: 0.35 }); },
  beep(hi = false) { if (!this.ok) return; const t = this.now(), o = this.out(null, { rev: 0 }); this.tone(o, t, { f0: hi ? 2200 : 1600, f1: hi ? 2200 : 1600, dur: 0.08, gain: 0.12, type: 'square' }); },
  snip() { if (!this.ok) return; const t = this.now(), o = this.out(null, { rev: 0 }); this.tone(o, t, { f0: 3000, f1: 1500, dur: 0.04, gain: 0.25, type: 'square' }); this.noise(o, t, { type: 'highpass', f0: 5000, f1: 3000, dur: 0.05, gain: 0.3 }); },
  buzz() { if (!this.ok) return; const t = this.now(), o = this.out(null, { rev: 0 }); this.tone(o, t, { f0: 140, f1: 120, dur: 0.5, gain: 0.3, type: 'square' }); },
  pickup() { if (!this.ok) return; const t = this.now(), o = this.out(null, { rev: 0 }); this.tone(o, t, { f0: 900, f1: 900, dur: 0.06, gain: 0.12, type: 'triangle' }); this.tone(o, t + 0.07, { f0: 1350, f1: 1350, dur: 0.1, gain: 0.12, type: 'triangle' }); },
  squelch() { if (!this.ok) return; const t = this.now(), o = this.out(null, { rev: 0 }); this.noise(o, t, { type: 'bandpass', f0: 2500, f1: 2500, dur: 0.12, gain: 0.12, q: 2 }); this.tone(o, t + 0.1, { f0: 1800, f1: 1800, dur: 0.03, gain: 0.05, type: 'square' }); },
  ui() { if (!this.ok) return; const t = this.now(), o = this.out(null, { rev: 0 }); this.tone(o, t, { f0: 1400, f1: 1300, dur: 0.04, gain: 0.07 }); },
  thump(pos) { if (!this.ok) return; const t = this.now(), o = this.out(pos, { rev: 0.25, ref: 2 }); this.tone(o, t, { f0: 120, f1: 50, dur: 0.15, gain: 0.4, type: 'triangle' }); this.noise(o, t, { f0: 900, f1: 150, dur: 0.12, gain: 0.25 }); },
  land() { if (!this.ok) return; const t = this.now(), o = this.out(null, { rev: 0.2 }); this.tone(o, t, { f0: 110, f1: 50, dur: 0.12, gain: 0.35, type: 'triangle' }); this.noise(o, t, { f0: 1000, f1: 200, dur: 0.1, gain: 0.2 }); },
  rope() { if (!this.ok) return; const t = this.now(), o = this.out(null, { rev: 0.1 }); this.noise(o, t, { type: 'bandpass', f0: 1500, f1: 900, dur: 3.2, gain: 0.12, q: 0.6, attack: 0.3 }); },
  // ---- loops ----
  startAmbience() {
    if (!this.ok || this.loops.amb) return; const c = this.ctx, t = c.currentTime;
    const rs = c.createBufferSource(); rs.buffer = this.nbuf; rs.loop = true; const rf = c.createBiquadFilter(); rf.type = 'bandpass'; rf.frequency.value = 2200; rf.Q.value = 0.35;
    const rg = c.createGain(); rg.gain.value = 0.08; rs.connect(rf); rf.connect(rg); rg.connect(this.amb); rs.start();
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; const pad = c.createGain(); pad.gain.setValueAtTime(0, t); pad.gain.linearRampToValueAtTime(0.09, t + 5); lp.connect(pad); pad.connect(this.amb);
    const oscs = [];
    for (const [f, d] of [[49, 0], [49, 8], [73.4, -6], [98, 3]]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = d; o.connect(lp); o.start(); oscs.push(o); }
    const lfo = c.createOscillator(); lfo.frequency.value = 0.05; const lg = c.createGain(); lg.gain.value = 160; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    this.loops.amb = { rg, pad, lp, oscs };
  },
  setOutdoor(v) { if (this.loops.amb) this.loops.amb.rg.gain.value = 0.03 + v * 0.11; },
  setTension(v) { if (this.loops.amb) { this.loops.amb.pad.gain.value = 0.07 + v * 0.08; this.loops.amb.lp.frequency.value = 380 + v * 500; } },
  alarm(on) {
    if (!this.ok) return; const c = this.ctx;
    if (on && !this.loops.alarm) { const o = c.createOscillator(); o.type = 'square'; const g = c.createGain(); g.gain.value = 0.035; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2200;
      const lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 1.6; const lg = c.createGain(); lg.gain.value = 180; o.frequency.value = 760; lfo.connect(lg); lg.connect(o.frequency);
      o.connect(f); f.connect(g); g.connect(this.sfx); const s = c.createGain(); s.gain.value = 0.6; g.connect(s); s.connect(this.rev); o.start(); lfo.start(); this.loops.alarm = { o, lfo, g }; }
    if (!on && this.loops.alarm) { const l = this.loops.alarm; l.g.gain.setTargetAtTime(0, c.currentTime, 0.2); setTimeout(() => { try { l.o.stop(); l.lfo.stop(); } catch (e) { } }, 800); this.loops.alarm = null; }
  },
  thunder() { if (!this.ok) return; const t = this.now() + 0.4 + R() * 0.8; const o = this.amb; this.noise(o, t, { f0: 500, f1: 40, dur: 3.5, gain: 0.5, attack: 0.1 }); },
  siren() { if (!this.ok) return; const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
    o.type = 'sawtooth'; o.frequency.setValueAtTime(600, t); for (let i = 0; i < 6; i++) { o.frequency.linearRampToValueAtTime(1100, t + i * 1.2 + 0.6); o.frequency.linearRampToValueAtTime(600, t + i * 1.2 + 1.2); }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.025, t + 1.5); g.gain.linearRampToValueAtTime(0, t + 7); o.connect(f); f.connect(g); g.connect(this.amb); o.start(t); o.stop(t + 7.2); },
};

/* ---------- voice (speech synthesis with subtitles) ---------- */
export const VO = {
  syn: null, voices: [], last: {},
  init() { try { this.syn = window.speechSynthesis; const load = () => { this.voices = this.syn.getVoices().filter(v => /^en/i.test(v.lang)); }; load(); this.syn.onvoiceschanged = load; } catch (e) { this.syn = null; } },
  say(who, text, { pitch = 1, rate = 1.08, radio = true, prio = false, sub = null, cool = 0, key = null } = {}) {
    const k = key || who + text; const now = G.time;
    if (cool && this.last[k] && now - this.last[k] < cool) return; this.last[k] = now;
    if (G.settings.subs && G.hooks.subtitle) G.hooks.subtitle(who, sub || text, radio);
    if (radio) A.squelch();
    if (!G.settings.voice || !this.syn) return;
    try {
      if (prio) this.syn.cancel(); else if (this.syn.pending) return;
      const u = new SpeechSynthesisUtterance(text);
      if (this.voices.length) { let h = 0; for (const ch of who) h = (h * 31 + ch.charCodeAt(0)) >>> 0; u.voice = this.voices[h % this.voices.length]; }
      u.pitch = pitch; u.rate = rate; u.volume = Math.min(1, G.settings.volume / 100); this.syn.speak(u);
    } catch (e) { }
  },
  stop() { try { this.syn && this.syn.cancel(); } catch (e) { } }
};

/* ---------- particles & effects ---------- */
export const dotTex = canvasTex(64, 64, g => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
export const starTex = canvasTex(128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,250,230,1)'); gr.addColorStop(0.25, 'rgba(255,190,90,.9)'); gr.addColorStop(1, 'rgba(255,120,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,210,140,.8)'; for (let i = 0; i < 6; i++) { g.save(); g.translate(64, 64); g.rotate(i * PI / 3 + 0.2); g.beginPath(); g.moveTo(0, -4); g.lineTo(62, 0); g.lineTo(0, 4); g.fill(); g.restore(); } });
const smokeTex = canvasTex(128, 128, g => { for (let i = 0; i < 14; i++) { const x = 34 + R() * 60, y = 34 + R() * 60, r = 18 + R() * 30; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(200,200,200,.35)'); gr.addColorStop(1, 'rgba(200,200,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } });

export const FX = {
  init() {
    const n = 900; this.n = n; this.i = 0;
    const g = new THREE.BufferGeometry(); this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 3); this.base = new Float32Array(n * 3); this.vel = new Float32Array(n * 3); this.life = new Float32Array(n); this.max = new Float32Array(n).fill(1); this.grav = new Float32Array(n);
    for (let k = 0; k < n; k++) this.pos[k * 3 + 1] = -999;
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.points = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.035, map: dotTex, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.points.frustumCulled = false; G.scene.add(this.points);
    // decals
    this.decalGeo = new THREE.CircleGeometry(0.022, 10); this.decalMat = new THREE.MeshStandardMaterial({ color: '#0c0b0a', roughness: 1, polygonOffset: true, polygonOffsetFactor: -4 });
    this.bloodMat = new THREE.MeshStandardMaterial({ color: '#4a0606', roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -4, transparent: true, opacity: 0.9 });
    this.decals = [];
    // tracers
    this.tracers = []; for (let i = 0; i < 24; i++) { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#ffd28a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); l.frustumCulled = false; G.scene.add(l); this.tracers.push({ l, t: 0 }); }
    // smoke
    this.smoke = []; for (let i = 0; i < 40; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0, color: '#bbbbbb' })); s.visible = false; G.scene.add(s); this.smoke.push({ s, t: 0, max: 1, v: new THREE.Vector3(), grow: 1 }); }
    // muzzle flashes for NPCs
    this.flashes = []; for (let i = 0; i < 10; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, color: '#ffd9a0', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.visible = false; G.scene.add(s); this.flashes.push({ s, t: 0 }); }
    this.lights = []; for (let i = 0; i < 1; i++) { const l = new THREE.PointLight('#ffb35a', 0, 8, 2); G.scene.add(l); this.lights.push({ l, t: 0, max: 1, peak: 0 }); }
    // casings
    this.casingGeo = C(0.0048, 0.0048, 0.045, 8); this.casingMat = M('#c79a3a', 0.3, 0.95); this.casings = [];
  },
  emit(p, n, count, color = '#ffb050', speed = 3, life = 0.5, spread = 1, grav = 1) {
    const c = new THREE.Color(color);
    for (let k = 0; k < count; k++) {
      const j = this.i = (this.i + 1) % this.n;
      const vx = (R() - 0.5) * spread + n.x, vy = (R() - 0.5) * spread + n.y, vz = (R() - 0.5) * spread + n.z; const l = Math.hypot(vx, vy, vz) || 1, s = speed * (0.4 + R()) / l;
      this.pos[j * 3] = p.x; this.pos[j * 3 + 1] = p.y; this.pos[j * 3 + 2] = p.z; this.vel[j * 3] = vx * s; this.vel[j * 3 + 1] = vy * s; this.vel[j * 3 + 2] = vz * s;
      this.base[j * 3] = c.r; this.base[j * 3 + 1] = c.g; this.base[j * 3 + 2] = c.b; this.life[j] = this.max[j] = life * (0.5 + R()); this.grav[j] = grav;
    }
  },
  decal(point, normal, parent = null, blood = false, size = 1) {
    let d = this.decals.length > 220 ? this.decals.shift() : new THREE.Mesh(this.decalGeo, this.decalMat);
    d.material = blood ? this.bloodMat : this.decalMat; d.scale.setScalar(blood ? size * (2.5 + R() * 3) : size * (0.85 + R() * 0.3));
    const wq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    if (d.parent) d.parent.remove(d);
    if (parent) { parent.updateMatrixWorld(); const mq = new THREE.Quaternion(); parent.getWorldQuaternion(mq); d.quaternion.copy(mq.invert().multiply(wq)); d.position.copy(parent.worldToLocal(point.clone().addScaledVector(normal, 0.004))); d.scale.divide(parent.getWorldScale(new THREE.Vector3())); parent.add(d); }
    else { d.quaternion.copy(wq); d.position.copy(point).addScaledVector(normal, 0.004); G.scene.add(d); }
    this.decals.push(d); return d;
  },
  tracer(a, b, color = '#ffd28a') { const t = this.tracers.find(x => x.t <= 0) || this.tracers[0]; const p = t.l.geometry.attributes.position; p.setXYZ(0, a.x, a.y, a.z); p.setXYZ(1, b.x, b.y, b.z); p.needsUpdate = true; t.l.material.color.set(color); t.l.material.opacity = 0.75; t.t = 0.07; },
  puff(p, { count = 4, size = 0.4, life = 1.4, rise = 0.4, color = '#bbbbbb', spread = 0.3 } = {}) {
    for (let i = 0; i < count; i++) { const s = this.smoke.find(x => x.t <= 0); if (!s) return; s.s.visible = true; s.s.position.copy(p).add(new THREE.Vector3((R() - 0.5) * spread, (R() - 0.5) * spread, (R() - 0.5) * spread));
      s.s.material.color.set(color); s.t = s.max = life * (0.7 + R() * 0.6); s.v.set((R() - 0.5) * 0.3, rise * (0.5 + R()), (R() - 0.5) * 0.3); s.size = size; s.s.scale.setScalar(size); s.s.material.rotation = R() * TAU; }
  },
  muzzle(p, scale = 1) { const f = this.flashes.find(x => x.t <= 0) || this.flashes[0]; f.s.position.copy(p); f.s.visible = true; f.s.scale.setScalar((0.25 + R() * 0.12) * scale); f.s.material.rotation = R() * TAU; f.t = 0.05; this.light(p, '#ffb35a', 5 * scale, 0.06, 6); },
  light(p, color, peak, dur, dist = 8) { const l = this.lights.reduce((a, b) => a.t < b.t ? a : b); l.l.position.copy(p); l.l.color.set(color); l.l.distance = dist; l.peak = peak; l.t = l.max = dur; l.l.intensity = peak; },
  casing(worldPos, dir, floorY = 0) {
    let c = this.casings.find(x => x.life <= 0);
    if (!c) { if (this.casings.length > 30) return; const m = new THREE.Mesh(this.casingGeo, this.casingMat); m.castShadow = false; G.scene.add(m); c = { m, v: new THREE.Vector3(), w: new THREE.Vector3(), life: 0 }; this.casings.push(c); }
    c.m.visible = true; c.m.position.copy(worldPos); c.life = 2.5; c.floor = floorY; c.v.copy(dir).multiplyScalar(2 + R()).add(new THREE.Vector3(0, 1.8 + R(), 0)); c.w.set(R() * 30, R() * 30, R() * 30); A.casing();
  },
  update(dt) {
    for (let j = 0; j < this.n; j++) {
      if (this.life[j] <= 0) continue; this.life[j] -= dt; const k = j * 3;
      this.vel[k + 1] -= 9.8 * dt * 0.6 * this.grav[j]; this.pos[k] += this.vel[k] * dt; this.pos[k + 1] += this.vel[k + 1] * dt; this.pos[k + 2] += this.vel[k + 2] * dt;
      if (this.pos[k + 1] < 0.01) { this.pos[k + 1] = 0.01; this.vel[k + 1] *= -0.3; this.vel[k] *= 0.6; this.vel[k + 2] *= 0.6; }
      const a = Math.max(0, this.life[j] / this.max[j]); this.col[k] = this.base[k] * a; this.col[k + 1] = this.base[k + 1] * a; this.col[k + 2] = this.base[k + 2] * a;
      if (this.life[j] <= 0) this.pos[k + 1] = -999;
    }
    this.points.geometry.attributes.position.needsUpdate = true; this.points.geometry.attributes.color.needsUpdate = true;
    for (const t of this.tracers) if (t.t > 0) { t.t -= dt; t.l.material.opacity = Math.max(0, t.t / 0.07) * 0.75; }
    for (const s of this.smoke) if (s.t > 0) { s.t -= dt; s.s.position.addScaledVector(s.v, dt); const a = s.t / s.max; s.s.material.opacity = Math.min(0.55, a * 0.7); s.s.scale.setScalar(s.size * (1 + (1 - a) * 2.5)); if (s.t <= 0) s.s.visible = false; }
    for (const f of this.flashes) if (f.t > 0) { f.t -= dt; if (f.t <= 0) f.s.visible = false; }
    for (const l of this.lights) if (l.t > 0) { l.t -= dt; l.l.intensity = Math.max(0, l.peak * (l.t / l.max)); }
    for (const c of this.casings) { if (c.life <= 0) continue; c.life -= dt; c.v.y -= 9.8 * dt; c.m.position.addScaledVector(c.v, dt); c.m.rotation.x += c.w.x * dt; c.m.rotation.y += c.w.y * dt; c.m.rotation.z += c.w.z * dt;
      if (c.m.position.y < c.floor + 0.005) { c.m.position.y = c.floor + 0.005; c.v.y *= -0.35; c.v.x *= 0.5; c.v.z *= 0.5; c.w.multiplyScalar(0.5); } if (c.life <= 0) c.m.visible = false; }
  },
  clear() {
    for (const d of this.decals) d.parent && d.parent.remove(d); this.decals = [];
    for (let j = 0; j < this.n; j++) { this.life[j] = 0; this.pos[j * 3 + 1] = -999; }
    for (const s of this.smoke) { s.t = 0; s.s.visible = false; } for (const c of this.casings) { c.life = 0; c.m.visible = false; }
  }
};

/* ---------- noise events (AI hearing) ---------- */
export const NOISE = [];
export function emitNoise(pos, radius, kind, source = null) { NOISE.push({ pos: pos.clone(), radius, kind, source, t: G.time }); if (NOISE.length > 40) NOISE.shift(); }
