/* =========================================================
   CLAVIER, SOURIS, TACTILE
   ========================================================= */
const bootEl = $('boot');
bootEl.addEventListener('click', start);
addEventListener('keydown', e => { if (st.mode === 'boot' && !bootEl.hidden && !e.metaKey && !e.ctrlKey && textcv.hidden){ e.preventDefault(); start(); } }, {capture:true});

const termActive = () => st.mode === 'menu' && st.tune === 12 && !st.busy;

/* ---------- saisie du terminal (champ caché, marche aussi sur mobile) ---------- */
termInput.addEventListener('input', () => {
  if (!termActive()){ termInput.value = ''; return; }
  term.input = termInput.value.slice(0, 120); termInput.value = term.input; sfx.key();
});
termInput.addEventListener('keydown', e => {
  if (!termActive()) return;
  if (e.key === 'Enter'){ e.preventDefault(); termRun(term.input); term.input = ''; termInput.value = ''; }
  else if (e.key === 'Escape'){ e.preventDefault(); termInput.blur(); tuneTo(2); }
  else if (e.key === 'ArrowUp' || e.key === 'ArrowDown'){
    e.preventDefault(); if (!term.hist.length) return;
    term.hi = term.hi < 0 ? term.hist.length : term.hi;
    term.hi = THREE.MathUtils.clamp(term.hi + (e.key === 'ArrowUp' ? -1 : 1), 0, term.hist.length);
    term.input = term.hist[term.hi] || ''; termInput.value = term.input;
  }
  else if (e.key === 'PageUp' || e.key === 'PageDown'){ e.preventDefault(); stepTune(e.key === 'PageUp' ? 1 : -1); }
  else if (e.key === 'Tab') e.preventDefault();
});

/* ---------- clavier ---------- */
addEventListener('keydown', e => {
  if (!textcv.hidden){ if (e.key === 'Escape') $('closeTxt').click(); return; }
  const k = e.key;
  if (e.target === termInput) return;
  if ((e.target.tagName === 'BUTTON' || e.target.tagName === 'A') && (k === 'Enter' || k === ' ')) return; // le bouton garde sa touche
  if (st.mode === 'boot' || st.mode === 'intro' || st.busy || e.metaKey || e.ctrlKey || e.altKey) return;
  if (termActive()){
    // le terminal reprend la main si le champ a perdu le focus
    if (k === 'Escape'){ e.preventDefault(); tuneTo(2); }
    else if (k === 'PageUp' || k === 'PageDown'){ e.preventDefault(); stepTune(k === 'PageUp' ? 1 : -1); }
    else if (k.length === 1 || k === 'Enter' || k === 'Backspace'){
      e.preventDefault(); termInput.focus({preventScroll:true});
      if (k === 'Enter'){ termRun(term.input); term.input = ''; }
      else if (k === 'Backspace') term.input = term.input.slice(0, -1);
      else { term.input += k; sfx.key(); }
      termInput.value = term.input;
    }
    return;
  }
  if (k === 'l' || k === 'L'){ toggleLights(); return; }
  if (st.mode === 'menu'){
    if (/^[1-6]$/.test(k)){ openSection(+k-1); return; }
    if (k === 'PageUp' || k === '+' || k === 'PageDown' || k === '-'){ e.preventDefault(); stepTune(k === 'PageUp' || k === '+' ? 1 : -1); return; }
    const onGuide = st.tune >= 2 && st.tune <= 7;
    if (k==='ArrowDown' || k==='s' || k==='S'){ e.preventDefault(); if (!onGuide) return tuneTo(2); st.sel = (st.sel+1) % 6; syncTune(st.sel + 2); sfx.tick(); hud(); }
    else if (k==='ArrowUp' || k==='z' || k==='w' || k==='Z' || k==='W'){ e.preventDefault(); if (!onGuide) return tuneTo(7); st.sel = (st.sel+5) % 6; syncTune(st.sel + 2); sfx.tick(); hud(); }
    else if (k==='Enter' || k===' ' || k==='ArrowRight'){ e.preventDefault(); if (onGuide) openSection(st.sel); else tuneTo(2); }
    return;
  }
  if (st.mode === 'section'){
    const proj = CV.sections[st.cur].projects;
    if (proj && st.pview === 'list'){
      if (k==='ArrowDown'){ e.preventDefault(); st.psel = (st.psel+1) % CV.projects.length; sfx.tick(); }
      else if (k==='ArrowUp'){ e.preventDefault(); st.psel = (st.psel+CV.projects.length-1) % CV.projects.length; sfx.tick(); }
      else if (k==='Enter' || k===' ' || k==='ArrowRight'){ e.preventDefault(); playProject(st.psel); }
      else if (/^[1-6]$/.test(k)) playProject(+k-1);
      else if (k==='Escape' || k==='Backspace' || k==='ArrowLeft'){ e.preventDefault(); goMenu(); }
      return;
    }
    if (k==='Escape' || k==='Backspace' || k==='ArrowLeft'){ e.preventDefault(); proj ? ejectToList() : goMenu(); }
    else if (k==='ArrowDown'){ e.preventDefault(); scrollBy(70); }
    else if (k==='ArrowUp'){ e.preventDefault(); scrollBy(-70); }
    else if (k==='PageDown' || k===' '){ e.preventDefault(); scrollBy(360); }
    else if (k==='PageUp'){ e.preventDefault(); scrollBy(-360); }
  }
});

/* ---------- pointeur : on lance un rayon dans toute la scène ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), mouse = {x:0, y:0, sx:0, sy:0};
bulb.userData.lamp = true; shade.userData.lamp = true;
function pick(cx, cy){
  ndc.set(cx/innerWidth*2-1, -(cy/innerHeight)*2+1);
  ray.setFromCamera(ndc, camera);
  for (const hit of ray.intersectObject(scene, true)){
    const ud = hit.object.userData;
    if (ud.skip || hit.object.isPoints || hit.object.isLight) continue;
    if (ud.tv){
      const tv = ud.tv; const [u,v] = barrel(hit.uv.x, hit.uv.y);
      const px = (u*CW - CW/2)/SAFE + CW/2, py = ((1-v)*CH - CH/2)/SAFE + CH/2;
      return {kind:'screen', tv, h: tv.hits.find(r => px>=r.x && px<=r.x+r.w && py>=r.y && py<=r.y+r.h)};
    }
    if (ud.dialOf) return {kind:'dial', tv:ud.dialOf, point:hit.point};
    if (ud.tape != null) return {kind:'tape', i:ud.tape};
    if (ud.lamp) return {kind:'lamp'};
    return null; // un objet opaque bloque le rayon
  }
  return null;
}
function activeTV(){ return st.mode === 'menu' ? tvs[0] : st.mode === 'section' ? tvs[st.cur+1] : null; }
const ready = () => (st.mode === 'menu' || st.mode === 'section') && !st.busy;
let drag = null, hoverTape = -1;

function dialScreenAngle(e){
  const p = tvs[0].dial.getWorldPosition(new THREE.Vector3()).project(camera);
  const sx = (p.x*.5+.5)*innerWidth, sy = (-p.y*.5+.5)*innerHeight;
  return Math.atan2(e.clientY - sy, e.clientX - sx);
}
glCanvas.addEventListener('pointermove', e => {
  mouse.x = e.clientX/innerWidth*2-1; mouse.y = -(e.clientY/innerHeight)*2+1;
  if (drag && drag.dial){
    let a = dialScreenAngle(e), d = a - drag.a; if (d > Math.PI) d -= Math.PI*2; if (d < -Math.PI) d += Math.PI*2;
    drag.acc += d; drag.a = a;
    while (drag.acc > Math.PI/6){ drag.acc -= Math.PI/6; drag.moved = true; stepTune(1); }
    while (drag.acc < -Math.PI/6){ drag.acc += Math.PI/6; drag.moved = true; stepTune(-1); }
    return;
  }
  if (drag){ const dy = e.clientY - drag.y; if (Math.abs(e.clientY - drag.y0) > 6) drag.moved = true; drag.y = e.clientY; if (st.mode === 'section' && drag.moved) scrollBy(-dy*1.6); return; }
  if (!ready()){ glCanvas.style.cursor = 'default'; return; }
  const p = pick(e.clientX, e.clientY), act = activeTV();
  let pointer = false, hov = null, ht = -1;
  if (p){
    if (p.kind === 'screen'){
      if (p.tv === act && p.h){ pointer = true; hov = p.h.act;
        if (p.h.act === 'open' && st.sel !== p.h.i && st.tune >= 2 && st.tune <= 7){ st.sel = p.h.i; syncTune(st.sel + 2); sfx.tick(); hud(); }
        if (p.h.act === 'proj' && st.psel !== p.h.i){ st.psel = p.h.i; sfx.tick(); }
        if (p.h.act === 'term') pointer = false;
      } else if (p.tv !== act) pointer = true;
    } else if (p.kind === 'dial') pointer = p.tv.idx === 0 && st.mode === 'menu';
    else if (p.kind === 'tape'){ pointer = true; ht = p.i; }
    else if (p.kind === 'lamp') pointer = true;
  }
  if (act){ const nh = (p && p.tv === act) ? hov : null; if (nh !== act.hover){ if (nh === 'back' || nh === 'list') sfx.tick(); act.hover = nh; } }
  if (ht !== hoverTape){ if (ht >= 0) sfx.tick(); hoverTape = ht; }
  glCanvas.style.cursor = pointer ? 'pointer' : 'default';
});
glCanvas.addEventListener('pointerdown', e => {
  glCanvas.setPointerCapture?.(e.pointerId);
  const p = ready() ? pick(e.clientX, e.clientY) : null;
  if (p && p.kind === 'dial' && p.tv.idx === 0 && st.mode === 'menu'){ drag = {dial:true, a:dialScreenAngle(e), acc:0, moved:false}; return; }
  drag = {y:e.clientY, y0:e.clientY, moved:false};
});
glCanvas.addEventListener('pointerup', e => {
  const d = drag; drag = null;
  if (d && d.dial){ if (!d.moved) stepTune(1); return; }
  if ((d && d.moved) || !ready()) return;
  const p = pick(e.clientX, e.clientY); if (!p) return;
  if (p.kind === 'lamp') return toggleLights();
  if (p.kind === 'tape') return playProject(p.i);
  if (p.kind === 'dial') return;
  const act = activeTV();
  if (p.tv === act){
    const h = p.h; if (!h) return;
    if (h.act === 'open') openSection(h.i);
    else if (h.act === 'back') goMenu();
    else if (h.act === 'proj') playProject(h.i);
    else if (h.act === 'list') ejectToList();
    else if (h.act === 'term') termInput.focus({preventScroll:true});
  } else {
    if (p.tv.idx === 0) goMenu(); else openSection(p.tv.idx - 1);
  }
});
glCanvas.addEventListener('pointercancel', () => { drag = null; });
glCanvas.addEventListener('wheel', e => {
  if (st.mode === 'section'){ e.preventDefault(); scrollBy(e.deltaY * (e.deltaMode ? 40 : 1)); return; }
  if (st.mode === 'menu' && ready()){
    const p = pick(e.clientX, e.clientY);
    if (p && p.kind === 'dial'){ e.preventDefault(); const now = performance.now(); if (now - (glCanvas._wt || 0) > 140){ glCanvas._wt = now; stepTune(e.deltaY > 0 ? 1 : -1); } }
  }
}, {passive:false});
backBtn.onclick = () => { if (st.mode === 'section' && CV.sections[st.cur].projects && st.pview === 'detail') ejectToList(); else goMenu(); };
