/* =========================================================
   ÉTAT ET ACTIONS
   ========================================================= */
const st = {mode:'boot', sel:0, cur:-1, busy:true, tune:2, dialPos:2, pview:'list', psel:0, playing:-1, playT:0, loading:false};
let clockT = 0, lightsOn = true;
const timers = [];
const after = (s, fn) => timers.push({at:clockT + s, fn});
const chan = $('chan'), hint = $('hint'), backBtn = $('backBtn'), linksEl = $('links'), termInput = $('termInput');
const sndBtn = $('sndBtn'), lightBtn = $('lightBtn'), langBtn = $('langBtn');
const PROJ = CV.sections.findIndex(s => s.projects);   // index de la section Projets

refreshToggles = () => {
  sndBtn.textContent = sfx.on ? UI.soundOn : UI.soundOff; sndBtn.setAttribute('aria-pressed', String(sfx.on));
  lightBtn.textContent = lightsOn ? UI.lightOn : UI.lightOff; lightBtn.setAttribute('aria-pressed', String(lightsOn));
};
refreshToggles();
sndBtn.onclick = () => { sfx.setOn(!sfx.on); refreshToggles(); };
lightBtn.onclick = () => { toggleLights(); };
langBtn.onclick = () => { setLang(LANG === 'fr' ? 'en' : 'fr'); };

function tuneLabel(n){
  if (n === 1) return UI.mireSub.toLowerCase();
  if (n >= 2 && n <= 7) return CV.sections[n-2].label.toLowerCase();
  if (n === 12) return 'terminal';
  return UI.noSignal.toLowerCase();
}
function hud(){
  const touch = coarse;
  let h = '';
  if (st.mode === 'menu'){
    chan.textContent = `${UI.ch} ${pad2(st.tune)} · ${tuneLabel(st.tune)}`;
    h = st.tune === 12 ? UI.hintTerm : st.tune === 1 ? UI.hintMire : st.tune > 7 ? UI.hintNoSignal : (touch ? UI.hintMenuTouch : UI.hintMenu);
  } else if (st.mode === 'section'){
    const s = CV.sections[st.cur];
    chan.textContent = `${UI.ch} ${s.ch.replace('CH ','')} · ${s.label.toLowerCase()}`;
    if (s.projects) h = st.pview === 'detail' ? (touch ? UI.hintDetailTouch : UI.hintDetail) : (touch ? UI.hintListTouch : UI.hintList);
    else h = touch ? UI.hintSectionTouch : UI.hintSection;
  } else chan.textContent = UI.chStandby;
  hint.textContent = h;
  backBtn.hidden = !(coarse && st.mode === 'section');
  document.body.classList.toggle('has-back', !backBtn.hidden);
  updateLinks();
}
function updateLinks(){
  let links = [];
  if (st.mode === 'section' && !st.busy){
    const s = CV.sections[st.cur];
    if (s.links) links = s.links;
    if (s.projects && st.pview === 'detail' && st.playing >= 0){
      const p = CV.projects[st.playing], m = PROJECT_META[st.playing];
      if (m.link && p.linkLabel) links = [{href:m.link, label:p.linkLabel}];
    }
  }
  const key = links.map(l => l.href + l.label).join('|');
  if (linksEl.dataset.key === key) return;
  linksEl.dataset.key = key;
  linksEl.innerHTML = links.map(l => `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('');
  linksEl.hidden = !links.length;
}

function setActive(tv){ tv.statT = 0; tv.brightT = 1.55; }
function setIdle(tv){ tv.statT = .62; tv.brightT = .42; }

function start(){
  if (st.mode !== 'boot') return;
  st.mode = 'intro';
  sfx.init();
  $('boot').classList.add('off');
  setTimeout(()=>$('boot').remove(), 900);
  glCanvas.focus();
  moveCam(viewFor(tvs[0], true), 2.6*M, 0.2);
  tvs.slice(1).forEach((tv,i)=>{ after((.35 + i*.16)*M, ()=>{ tv.power = 0; tv.powerT = 1; setIdle(tv); sfx.beep(70 + i*6, .18, 'sine', .05); }); });
  after(1.7*M, ()=>{ const m = tvs[0]; m.power = 0; m.powerT = 1; setActive(m); sfx.powerOn(); });
  after(2.4*M, ()=>{ st.mode = 'menu'; st.busy = false; hud(); });
}

function openSection(i, then){
  if (st.busy || i < 0 || i >= CV.sections.length) return;
  if (st.mode === 'section' && st.cur === i){ then && then(); return; }
  const prev = st.mode === 'section' ? tvs[st.cur+1] : tvs[0];
  const tv = tvs[i+1];
  st.busy = true; st.mode = 'section'; st.cur = i; st.sel = i;
  if (st.tune >= 2 && st.tune <= 7) syncTune(i + 2);
  termInput.blur();
  setIdle(prev); prev.dirty = true;
  tv.scroll = tv.scrollT = 0; tv.hover = null;
  if (CV.sections[i].projects){ st.pview = st.playing >= 0 ? 'detail' : 'list'; }
  sfx.select(); sfx.whoosh();
  moveCam(sectionView(i), 1.15*M, .28);
  after(.5*M, ()=>{ tv.power = 0; tv.powerT = 1; setActive(tv); sfx.powerOn(); });
  after(1.15*M, ()=>{ st.busy = false; hud(); then && then(); });
  hud();
}
function goMenu(){
  if (st.busy || st.mode !== 'section') return;
  const tv = tvs[st.cur+1], m = tvs[0];
  st.busy = true; st.mode = 'menu';
  if (st.tune >= 2 && st.tune <= 7) st.sel = st.tune - 2;
  setIdle(tv); tv.hover = null; tv.dirty = true;
  sfx.back(); sfx.whoosh();
  moveCam(viewFor(m, true), 1.0*M, .25);
  after(.45*M, ()=>{ m.power = 0; m.powerT = 1; setActive(m); sfx.powerOn(); if (st.tune === 12 && !coarse) termInput.focus({preventScroll:true}); });
  after(1.0*M, ()=>{ st.busy = false; hud(); });
  hud();
}

/* ---------- sélecteur de chaîne (télé principale) ---------- */
function nearestDial(n){ const d = ((n - st.tune + 18) % 12) - 6; return st.dialPos + d; }
function syncTune(n){ st.dialPos = nearestDial(n); st.tune = n; }
function tuneTo(n, fromDial = false){
  if (st.mode !== 'menu' || st.busy) return;
  n = ((n - 1) % 12 + 12) % 12 + 1;
  if (n === st.tune) return;
  syncTune(n);
  if (n >= 2 && n <= 7) st.sel = n - 2;
  const m = tvs[0];
  m.burst = 1; sfx.knob(); sfx.zap();
  if (n === 12){ termBoot(); if (!coarse || fromDial) termInput.focus({preventScroll:true}); }
  else termInput.blur();
  hud();
}
function stepTune(delta){ tuneTo(st.tune + delta, true); }

/* ---------- cassettes et magnétoscope ---------- */
function playProject(i, fromTerm = false){
  if (i < 0 || i >= CV.projects.length || st.loading) return;
  if (st.mode !== 'section' || st.cur !== PROJ){
    if (st.mode === 'section' || st.mode === 'menu') openSection(PROJ, () => playProject(i));
    return;
  }
  if (media.playing === i && st.pview === 'detail') return;
  st.loading = true; st.psel = i;
  const tv = tvs[PROJ+1];
  const old = media.tapes.find(tp => tp.inVCR);
  if (old){
    const o = tapePath(old, false); o.durs = o.durs.map(x => x*.5);
    old.anim = {...o, seg:0, t:0, done:null}; old.inVCR = false;
    sfx.eject();
  }
  media.playing = -1; st.playing = -1; st.pview = 'list'; tv.dirty = true;
  const tp = media.tapes[i];
  sfx.select();
  after(.15, ()=>sfx.insert());
  animateTape(tp, true, () => {
    media.playing = i; st.playing = i; st.pview = 'detail'; st.playT = clockT; st.loading = false;
    tv.scroll = tv.scrollT = 0; tv.dlayout = null; tv.track = 1; tv.burst = .6; tv.dirty = true;
    sfx.beep(1200, .05, 'square', .03);
    moveCam(sectionView(PROJ), .9*M, .05);   // on s'approche de l'écran pour lire
    hud();
  });
  hud();
}
function ejectToList(){
  if (st.loading) return;
  const tv = tvs[PROJ+1];
  const tp = media.tapes.find(x => x.inVCR);
  if (tp){ animateTape(tp, false, null); sfx.eject(); }
  media.playing = -1; st.playing = -1; st.pview = 'list'; tv.burst = .7; tv.scroll = tv.scrollT = 0; tv.dirty = true;
  moveCam(sectionView(PROJ), .9*M, .05);     // on recule pour revoir les cassettes
  hud();
}

/* ---------- lumière, langue ---------- */
function toggleLights(){ lightsOn = !lightsOn; sfx.sw(); refreshToggles(); }
function setLang(l){
  if (l === LANG || !CONTENT[l]) return;
  LANG = l; CV = CONTENT[l]; UI = CV.ui;
  try { localStorage.setItem('ds-lang', l); } catch(e){}
  for (const tv of tvs){ if (tv.idx > 0){ tv.sec = CV.sections[tv.idx-1]; tv.layout = layoutSection(tv.ctx, tv.sec); } tv.dlayout = null; tv.dirty = true; }
  refreshTapeLabels();
  applyLangDOM();
  hud();
}

function scrollBy(dy){
  if (st.mode !== 'section') return;
  const tv = tvs[st.cur+1];
  const L = CV.sections[st.cur].projects ? (st.pview === 'detail' ? tv.dlayout : null) : tv.layout;
  if (!L) return;
  const max = Math.max(0, L.height - (AREA.bottom - AREA.top));
  tv.scrollT = THREE.MathUtils.clamp(tv.scrollT + dy, 0, max);
}
