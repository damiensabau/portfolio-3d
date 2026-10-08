import fs from 'node:fs';
globalThis.__errs = [];
const err = (m) => { if (globalThis.__errs.length < 40) globalThis.__errs.push(m); };
// ---------- canvas 2D ----------
function ctx2d(){
  const st = {font:'10px x'};
  const check = (name) => (...a) => { for (const v of a) if (typeof v === 'number' && !Number.isFinite(v)) err(`NaN in ${name}(${a.join(',')})`); };
  const fns = {
    measureText: (t) => { const px = parseFloat((/(\d+(\.\d+)?)px/.exec(st.font)||[0,10])[1]); if (typeof t !== 'string') err('measureText non-string ' + t); return {width: String(t).length * px * .5}; },
    createLinearGradient: () => ({addColorStop(){}}), createRadialGradient: () => ({addColorStop(){}}),
    createImageData: (w,h) => ({data:new Uint8ClampedArray(w*h*4)}),
    fillText: (t, x, y) => { if (typeof t !== 'string') err('fillText non-string: ' + t); check('fillText')(x, y); },
    fillRect: check('fillRect'), strokeRect: check('strokeRect'), arc: check('arc'), moveTo: check('moveTo'), lineTo: check('lineTo'), rect: check('rect'),
    drawImage: (...a) => check('drawImage')(...a.slice(1)),
  };
  return new Proxy(st, { get(t, p){ if (p in fns) return fns[p]; if (p in t) return t[p]; return () => {}; }, set(t, p, v){ t[p] = v; return true; } });
}
// ---------- DOM ----------
const els = new Map();
function el(id, tag='div'){
  const listeners = {};
  const e = { id, tagName: tag.toUpperCase(), textContent:'', innerHTML:'', hidden:false, value:'', dataset:{}, style:{}, width:300, height:150,
    classList: { s:new Set(), add(c){this.s.add(c)}, remove(c){this.s.delete(c)}, toggle(c,v){ (v ?? !this.s.has(c)) ? this.s.add(c) : this.s.delete(c); }, contains(c){return this.s.has(c)} },
    setAttribute(k,v){ this['attr_'+k]=v; }, getAttribute(k){ return this['attr_'+k]; },
    addEventListener(t, f){ (listeners[t] ||= []).push(f); }, removeEventListener(){},
    __fire(t, ev){ for (const f of listeners[t] || []) f({preventDefault(){}, target:e, pointerId:1, deltaY:0, deltaMode:0, ...ev}); },
    focus(){ document.activeElement = e; }, blur(){ if (document.activeElement === e) document.activeElement = null; },
    click(){ e.onclick && e.onclick(); }, remove(){ e.removed = true; }, setPointerCapture(){},
    getContext(){ return e._ctx ||= ctx2d(); },
  };
  return e;
}
globalThis.document = {
  getElementById(id){ if (!els.has(id)) els.set(id, el(id, id === 'gl' || id === 'mire' ? 'canvas' : 'div')); return els.get(id); },
  createElement(tag){ return el('', tag); },
  documentElement: {lang:'fr'}, fonts: {load: () => Promise.resolve()}, activeElement:null, body: el('body','body'),
};
for (const id of ['textcv','boot','links','backBtn']) document.getElementById(id).hidden = true;
const winL = {};
globalThis.addEventListener = (t, f) => { (winL[t] ||= []).push(f); };
globalThis.__key = (key) => { for (const f of winL.keydown || []) f({key, preventDefault(){}, target:document.body, metaKey:false, ctrlKey:false, altKey:false}); };
Object.assign(globalThis, { innerWidth:1280, innerHeight:760, devicePixelRatio:1, window:globalThis,
  matchMedia: (q) => ({matches: q.includes('coarse') ? !!process.env.COARSE : false}),
  localStorage: { m:new Map(), getItem(k){ return this.m.get(k) ?? null; }, setItem(k,v){ this.m.set(k,String(v)); } },
  Image: class { set src(v){ this._s = v; } },
});
globalThis.__raf = []; globalThis.requestAnimationFrame = (cb) => globalThis.__raf.push(cb);
const audioNode = () => new Proxy({}, { get(t,p){ if (p in t) return t[p]; if (['gain','frequency','Q'].includes(p)) return t[p] = {value:0, setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){}, setTargetAtTime(){}}; if (p === 'connect') return (n) => n; return () => {}; }, set(t,p,v){ t[p]=v; return true; } });
globalThis.AudioContext = class { constructor(){ this.sampleRate = 48000; this.currentTime = 0; this.destination = {}; }
  createGain(){ return audioNode(); } createOscillator(){ return audioNode(); } createBiquadFilter(){ return audioNode(); } createBufferSource(){ return audioNode(); }
  createBuffer(c, n){ return {getChannelData: () => new Float32Array(n)}; } };
process.on('unhandledRejection', (e) => { console.log('UNHANDLED', e && e.stack || e); process.exitCode = 1; });

let code = fs.readFileSync(new URL('../app.mjs', import.meta.url), 'utf8');
code = code.replace("import('three')", "import('./three_stub.mjs')").replace(/import\('three\/addons\/[a-z]+\/([A-Za-z]+\.js)'\)/g, "import('./addons/$1')");
code += '\n' + fs.readFileSync(new URL('./scenario.js', import.meta.url), 'utf8');
fs.writeFileSync(new URL('./app_test.mjs', import.meta.url), code);
await import('./app_test.mjs');
console.log('ERRORS:', globalThis.__errs.length); for (const e of globalThis.__errs) console.log('  -', e);
