/* =========================================================
   BOUCLE DE RENDU
   ========================================================= */
function drawMain(tv, t){
  const n = st.tune;
  if (n === 1) drawMireChannel(tv, t);
  else if (n >= 2 && n <= 7) drawMenu(tv, t);
  else if (n === 12){ termBoot(); drawTerminal(tv, t); }
  else drawNoSignal(tv, t, n);
}
onImageReady = () => { for (const tv of tvs) tv.dirty = true; };

function resize(){
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false); composer.setSize(innerWidth, innerHeight); bloom.setSize(innerWidth, innerHeight);
  if (!tween || tween.t >= 1){
    const v = st.mode === 'menu' ? viewFor(tvs[0], true) : st.mode === 'section' ? sectionView(st.cur) : null;
    if (v){ camPos.copy(v.pos); camTgt.copy(v.target); }
  }
}
addEventListener('resize', resize);

setProgress(.8);
try { await Promise.race([Promise.all([document.fonts.load('58px VT323'), document.fonts.load('600 26px "IBM Plex Mono"')]), new Promise(r=>setTimeout(r, 2500))]); } catch(e){}
for (const tv of tvs){ if (tv.sec) tv.layout = layoutSection(tv.ctx, tv.sec); }
refreshTapeLabels();   // une fois les polices chargées
for (const tv of tvs){ if (tv.idx === 0) drawMain(tv, 0); else drawSection(tv, 0, false); }
for (const tv of tvs) tv.tex.needsUpdate = true;
setProgress(.95);

const clock = new THREE.Clock();
const tmpP = new V(), backDir = new V(), camR = new V(), camU = new V();
const L = {bulb:8, hemi:.8, spot:4, tv:1};   // niveaux lumineux courants
function frame(){
  const dt = Math.min(clock.getDelta(), .05); clockT += dt; const t = clockT;
  for (let i=timers.length-1;i>=0;i--) if (clockT >= timers[i].at){ const f = timers[i].fn; timers.splice(i,1); f(); }

  // caméra
  if (tween && tween.t < 1){
    tween.t = Math.min(1, tween.t + dt/tween.dur); const k = ease(tween.t);
    camPos.lerpVectors(tween.fp, tween.tp, k); camTgt.lerpVectors(tween.ft, tween.tt, k);
    backDir.subVectors(tween.fp, tween.ft).add(tmpP.subVectors(tween.tp, tween.tt)).normalize();
    const arc = Math.sin(Math.PI*k) * tween.lift;
    tmpP.copy(camPos).addScaledVector(backDir, arc); tmpP.y += arc*.35;
  } else tmpP.copy(camPos);
  mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt*3); mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt*3);
  camera.position.copy(tmpP); camera.lookAt(camTgt);
  camR.setFromMatrixColumn(camera.matrixWorld, 0); camU.setFromMatrixColumn(camera.matrixWorld, 1);
  if (!reduce) camera.position.addScaledVector(camR, mouse.sx*.05 + Math.sin(t*.37)*.008).addScaledVector(camU, mouse.sy*.035 + Math.sin(t*.6)*.006);
  camera.lookAt(camTgt);

  // lumière de la pièce
  const kL = Math.min(1, dt*4);
  L.bulb += ((lightsOn ? 8 : 0) - L.bulb)*kL; L.hemi += ((lightsOn ? .8 : .1) - L.hemi)*kL;
  L.spot += ((lightsOn ? 4 : 0) - L.spot)*kL; L.tv += ((lightsOn ? 1 : 1.5) - L.tv)*kL;
  bulbLight.intensity = L.bulb * (st.mode === 'boot' ? .55 : .8) * (0.97 + Math.sin(t*31)*.03);
  bulb.material.emissiveIntensity = 3 * (L.bulb/8) + .05;
  hemi.intensity = L.hemi;
  lamp.spot.intensity = L.spot; lamp.bulbM.emissiveIntensity = 2.5 * L.spot/4 + .03;
  bloom.strength = .62 + (L.tv - 1) * .36;

  // télés
  const act = activeTV();
  for (const tv of tvs){
    if (tv.powerT > tv.power) tv.power = Math.min(tv.powerT, tv.power + dt/(.42*M));
    tv.stat += (tv.statT - tv.stat) * Math.min(1, dt*5);
    tv.bright += (tv.brightT - tv.bright) * Math.min(1, dt*5);
    tv.burst = Math.max(0, tv.burst - dt*3.2); tv.track = Math.max(0, tv.track - dt*.75);
    const u = tv.mat.uniforms; u.uTime.value = t; u.uStatic.value = Math.min(1, Math.max(tv.stat, tv.burst*.9)); u.uPower.value = tv.power; u.uBright.value = tv.bright; u.uTrack.value = tv.track;
    tv.light.intensity = L.tv * tv.power * (0.3 + tv.bright*1.25) * (0.92 + Math.sin(t*23 + tv.idx)*.08);
    if (tv.rack.userData.led) tv.rack.userData.led.material.emissiveIntensity = (Math.sin(t*2 + tv.idx*1.7) > .2 ? 2.2 : .15) * tv.power;
    tv.led.material.emissiveIntensity = tv.power * (tv === act ? 4 : 1.3);
    if (tv.dial){
      const target = -(tv.idx === 0 ? st.dialPos : tv.dialA/(Math.PI/6)) * Math.PI/6;
      tv.dial.rotation.z += (target - tv.dial.rotation.z) * Math.min(1, dt*12);
    }
    if (tv.sec || tv.idx === 0){ const ds = tv.scrollT - tv.scroll; if (Math.abs(ds) > .3){ tv.scroll += ds * Math.min(1, dt*10); tv.dirty = true; } }
    const isAct = tv === act;
    if (tv.idx === 0){ if (isAct || tv.dirty){ drawMain(tv, t); tv.tex.needsUpdate = true; tv.dirty = false; } }
    else if (tv.layout && (isAct || tv.dirty)){ drawSection(tv, t, isAct); tv.tex.needsUpdate = true; tv.dirty = false; }
  }

  // cassettes, magnétoscope
  updateTapes(dt);
  for (const tp of media.tapes){
    if (tp.anim || tp.inVCR) continue;
    const want = tp.home.z + (tp.i === hoverTape ? .045 : 0);
    tp.group.position.z += (want - tp.group.position.z) * Math.min(1, dt*10);
  }
  media.vled.material.emissiveIntensity = media.playing >= 0 ? 3 : (st.loading ? (Math.floor(t*6)%2 ? 3 : 0) : 0);
  drawVCRDisplay(t);
  if (Math.floor(t*4) !== Math.floor((t-dt)*4)) updateLinks();

  // ambiance
  bulbGroup.rotation.z = Math.sin(t*.7)*.035; bulbGroup.rotation.x = Math.sin(t*.53)*.025;
  const pa = dustGeo.attributes.position.array;
  for (let i=0;i<dustN;i++){ pa[i*3+1] += Math.sin(t*.3 + i)*.0006 - .0004; pa[i*3] += Math.cos(t*.2 + i*1.3)*.0005; if (pa[i*3+1] < 0) pa[i*3+1] = 3.4; }
  dustGeo.attributes.position.needsUpdate = true;

  composer.render();
  requestAnimationFrame(frame);
}
camera.position.copy(camPos); camera.lookAt(camTgt);
resize();
requestAnimationFrame(frame);
hideLoader();
