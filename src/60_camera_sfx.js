/* ---------- caméra ---------- */
const V = THREE.Vector3;
function viewFor(tv, menu, close = false){
  tv.screen.updateWorldMatrix(true, false);
  const center = tv.screen.getWorldPosition(new V());
  const n = new V(0,0,1).transformDirection(tv.screen.matrixWorld);
  const r = new V(1,0,0).transformDirection(tv.screen.matrixWorld);
  const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov/2)), asp = camera.aspect, s = tv.spec;
  const wide = asp > 1.15;
  if (!menu && !close && s.stand === 'media' && wide){
    // canal Projets : on cadre aussi le meuble, la pile de cassettes et le magnétoscope
    const m = tv.root.localToWorld(new V(-.5, .42, .2));
    const target = center.clone().lerp(m, .42);
    const dH = (1.5*1.08/2)/tan, dW = (2.15*1.08/2)/(tan*asp);
    return {pos: target.clone().addScaledVector(n, Math.max(dH, dW)).add(new V(0, .12, 0)), target};
  }
  const fh = menu && wide ? 2.25 : 1.36, fw = menu && wide ? 1.6 : 1.2;
  const sh = menu && wide ? s.w*.32 : 0;
  const cabHalf = s.w/2 + .12 + (s.knobs ? .26 : 0) + .1;
  const d = Math.max((s.h*fh/2)/tan, (s.w*fw/2)/(tan*asp), menu ? (cabHalf + sh)/(tan*asp) : 0);
  const target = center.clone(), pos = center.clone().addScaledVector(n, d);
  if (sh){ target.addScaledVector(r, sh); pos.addScaledVector(r, sh); pos.y += .05; }
  return {pos, target};
}
function sectionView(i){ return viewFor(tvs[i+1], false, !!CV.sections[i].projects && st.pview === 'detail'); }
const overview = {pos:new V(0.3,1.75,5.4), target:new V(-0.1,1.3,0)};
const camPos = overview.pos.clone(), camTgt = overview.target.clone();
let tween = null;
function moveCam(view, dur, lift=0.3){ tween = {fp:camPos.clone(), ft:camTgt.clone(), tp:view.pos.clone(), tt:view.target.clone(), t:0, dur:Math.max(.05,dur), lift}; }
const ease = k => k<.5 ? 4*k*k*k : 1 - Math.pow(-2*k+2,3)/2;

/* ---------- son (synthétisé) ---------- */
const sfx = {
  ctx:null, master:null, on:true, nbuf:null,
  init(){
    try{
      this.ctx = new (window.AudioContext||window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = this.on ? .6 : 0; this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate; this.nbuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.nbuf.getChannelData(0); for (let i=0;i<len;i++) d[i] = Math.random()*2-1;
      const hum = this.ctx.createGain(); hum.gain.value = .014; hum.connect(this.master);
      for (const [f,v] of [[50,1],[100,.45],[150,.15]]){ const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.frequency.value = f; g.gain.value = v; o.connect(g).connect(hum); o.start(); }
      const rs = this.ctx.createBufferSource(); rs.buffer = this.nbuf; rs.loop = true;
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
      const rg = this.ctx.createGain(); rg.gain.value = .02; rs.connect(lp).connect(rg).connect(this.master); rs.start();
    }catch(e){ this.ctx = null; }
  },
  beep(f, dur, type='square', vol=.04, delay=0){
    const c = this.ctx; if (!c) return; const t0 = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0+.005); g.gain.exponentialRampToValueAtTime(.0001, t0+dur);
    o.connect(g).connect(this.master); o.start(t0); o.stop(t0+dur+.03);
  },
  noise(dur, f0, f1, vol, q=1){
    const c = this.ctx; if (!c) return; const t0 = c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.nbuf;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q;
    bp.frequency.setValueAtTime(f0, t0); bp.frequency.exponentialRampToValueAtTime(f1, t0+dur);
    const g = c.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0+dur*.35); g.gain.exponentialRampToValueAtTime(.0001, t0+dur);
    s.connect(bp).connect(g).connect(this.master); s.start(t0); s.stop(t0+dur+.05);
  },
  tick(){ this.beep(1500,.035,'square',.02); },
  select(){ this.beep(660,.07,'square',.035); this.beep(990,.1,'square',.035,.06); },
  back(){ this.beep(560,.07,'square',.03); this.beep(370,.1,'square',.03,.06); },
  whoosh(){ this.noise(.9*M, 280, 2400, .07, .7); },
  powerOn(){ this.noise(.28, 1800, 300, .09, .6); this.beep(85,.4,'sine',.13); this.beep(7800,.5,'sine',.004,.05); },
  knob(){ this.beep(180,.03,'square',.05); this.noise(.06, 3000, 1500, .05, 2); },
  zap(){ this.noise(.22, 4000, 2500, .07, .4); },
  key(){ this.beep(2200 + Math.random()*400, .015, 'square', .012); },
  sw(){ this.beep(900,.02,'square',.05); this.noise(.04, 5000, 3000, .05, 3); },
  insert(){ this.noise(.25, 600, 200, .1, 1.5); this.beep(70,.18,'sine',.15,.05); this.noise(.9, 300, 320, .035, 4); },
  eject(){ this.beep(90,.12,'sine',.12); this.noise(.3, 300, 900, .07, 1.2); },
  setOn(v){ this.on = v; if (this.master) this.master.gain.setTargetAtTime(v ? .6 : 0, this.ctx.currentTime, .05); }
};

