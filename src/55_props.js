/* =========================================================
   DÉCOR INTERACTIF : meuble TV, magnétoscope, cassettes, lampe
   ========================================================= */
const V3 = THREE.Vector3;
function rod(a, b, r, mat){
  const dir = new V3().subVectors(b, a), len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat);
  m.position.copy(a).addScaledVector(dir, .5);
  m.quaternion.setFromUnitVectors(new V3(0,1,0), dir.normalize());
  return m;
}

/* ---------- meuble TV (sous la télé Projets) ---------- */
const media = {tv: tvs[3], tapes: [], playing: -1};
(function buildMedia(){
  const tv = media.tv, root = tv.root, H = tv.spec.base;
  const x0 = -1.18, x1 = .9, W = x1 - x0, cx = (x0 + x1)/2, D = .66, z0 = -.36, zc = z0 + D/2, legH = .1;
  const g = new THREE.Group(); root.add(g); media.group = g;
  const wood = mats.wood;
  const top = new THREE.Mesh(new RoundedBoxGeometry(W, .045, D, 3, .012), wood); top.position.set(cx, H - .0225, zc); g.add(top);
  const bot = new THREE.Mesh(new THREE.BoxGeometry(W - .04, .03, D - .04), wood); bot.position.set(cx, legH + .015, zc); g.add(bot);
  for (const x of [x0 + .015, x1 - .015, -.2]){
    const sd = new THREE.Mesh(new THREE.BoxGeometry(.03, H - legH - .045, D - .02), wood); sd.position.set(x, legH + (H - legH - .045)/2, zc); g.add(sd);
  }
  const back = new THREE.Mesh(new THREE.BoxGeometry(W - .03, H - legH - .045, .015), mats.bezel); back.position.set(cx, legH + (H - legH)/2, z0 + .01); g.add(back);
  // portes à droite, poignées chromées
  const doorW = (x1 - .015 - (-.2 + .015)) / 2;
  for (let k=0;k<2;k++){
    const dx = -.2 + .015 + doorW*(k + .5);
    const door = new THREE.Mesh(new RoundedBoxGeometry(doorW - .012, H - legH - .07, .022, 2, .006), wood);
    door.position.set(dx, legH + (H - legH)/2 - .01, z0 + D - .005); g.add(door);
    const hd = new THREE.Mesh(new THREE.CylinderGeometry(.007, .007, .12, 10), mats.chrome);
    hd.position.set(dx + (k ? -1 : 1)*(doorW/2 - .05), legH + (H - legH)/2, z0 + D + .022); g.add(hd);
  }
  // pieds compas
  for (const sx of [x0 + .1, x1 - .1]) for (const sz of [z0 + .08, z0 + D - .08]){
    const lg = new THREE.Mesh(new THREE.CylinderGeometry(.018, .01, legH + .02, 10), mats.legWood);
    lg.position.set(sx, legH/2, sz); g.add(lg);
  }

  /* ---------- magnétoscope ---------- */
  const vcr = new THREE.Group(); vcr.position.set((x0 - .2)/2, legH + .03 + .065, z0 + D - .23); g.add(vcr); media.vcr = vcr;
  const vw = .72, vh = .14, vd = .42;
  vcr.add(new THREE.Mesh(new RoundedBoxGeometry(vw, vh, vd, 2, .01), mats.grey));
  const face = new THREE.Mesh(new THREE.BoxGeometry(vw - .02, vh - .03, .006), mats.bezel); face.position.z = vd/2 + .002; vcr.add(face);
  // fente + clapet
  const slotX = -.12, slotY = .016;
  const slot = new THREE.Mesh(new THREE.BoxGeometry(.4, .064, .01), new THREE.MeshBasicMaterial({color:0x010101})); slot.position.set(slotX, slotY, vd/2 + .004); vcr.add(slot);
  const hinge = new THREE.Group(); hinge.position.set(slotX, slotY + .032, vd/2 + .009); vcr.add(hinge);
  const flap = new THREE.Mesh(new THREE.BoxGeometry(.395, .062, .006), mats.grey); flap.position.y = -.031; hinge.add(flap);
  media.flap = hinge; media.flapT = 0;
  // afficheur
  const dc = document.createElement('canvas'); dc.width = 256; dc.height = 64;
  const dtex = new THREE.CanvasTexture(dc); dtex.colorSpace = THREE.SRGBColorSpace;
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(.16, .04), new THREE.MeshBasicMaterial({map:dtex, toneMapped:false}));
  disp.position.set(.2, .022, vd/2 + .007); vcr.add(disp);
  media.display = {cnv:dc, ctx:dc.getContext('2d'), tex:dtex, last:''};
  for (let k=0;k<5;k++){ const b = new THREE.Mesh(new THREE.BoxGeometry(.03, .012, .01), mats.knob); b.position.set(.13 + k*.036, -.034, vd/2 + .008); vcr.add(b); }
  const vled = new THREE.Mesh(new THREE.SphereGeometry(.006, 10, 8), new THREE.MeshStandardMaterial({color:0x220000, emissive:0xff3020, emissiveIntensity:0}));
  vled.position.set(-.34, .03, vd/2 + .008); vcr.add(vled); media.vled = vled;
  const vplate = new THREE.Mesh(new THREE.PlaneGeometry(.1, .025), new THREE.MeshStandardMaterial({map:plateTex('DS·VCR'), roughness:.3, metalness:.9, envMap:envTex, envMapIntensity:.3}));
  vplate.position.set(-.27, -.042, vd/2 + .007); vcr.add(vplate);
  media.slotLocal = new V3(slotX, slotY, vd/2).add(vcr.position); // dans le repère du meuble (= télé)

  /* ---------- cassettes empilées sur le meuble ---------- */
  const tw = .36, th = .055, td = .21, pileX = -.86, pileZ = z0 + D - .15;
  const shell = new THREE.MeshStandardMaterial({color:0x111113, roughness:.45, metalness:.1, envMap:envTex, envMapIntensity:.1});
  PROJECT_META.forEach((meta, i)=>{
    const t = new THREE.Group();
    const body = new THREE.Mesh(new RoundedBoxGeometry(tw, th, td, 2, .006), shell); t.add(body);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(tw - .03, th - .012), new THREE.MeshStandardMaterial({roughness:.7}));
    lab.position.z = td/2 + .001; t.add(lab);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(.12, .06), new THREE.MeshStandardMaterial({color:0x1d1a16, roughness:.2, metalness:.3}));
    win.rotation.x = -Math.PI/2; win.position.set(0, th/2 + .001, -.01); t.add(win);
    const k = PROJECT_META.length - 1 - i;              // la cassette 01 est en haut de la pile
    const home = new V3(pileX + Math.sin(i*2.3)*.012, H + th/2 + k*(th + .002), pileZ + Math.cos(i*1.7)*.01);
    const homeRot = Math.sin(i*1.9)*.07;
    t.position.copy(home); t.rotation.y = homeRot; g.add(t);
    t.traverse(o => { if (o.isMesh) o.userData.tape = i; });
    media.tapes.push({i, group:t, label:lab, home, homeRot, anim:null, inVCR:false});
  });
  media.tapeDepth = td;
  refreshTapeLabels();
})();

function refreshTapeLabels(){
  media.tapes.forEach(tp => {
    const meta = PROJECT_META[tp.i], p = CV.projects[tp.i];
    const tex = canvasTex(512, 64, (ctx, w, h)=>{
      ctx.fillStyle = '#efe7d4'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = meta.color; ctx.fillRect(0, 0, 70, h);
      ctx.fillStyle = '#1a1712'; ctx.font = '600 30px "IBM Plex Mono", monospace'; ctx.textBaseline = 'middle';
      ctx.fillText(pad2(tp.i + 1), 12, h/2 + 2);
      ctx.font = '600 26px "IBM Plex Mono", monospace';
      let s = p.tape; while (ctx.measureText(s).width > w - 100 && s.length > 3) s = s.slice(0, -1);
      ctx.fillText(s, 88, h/2 + 2);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(70, h - 6, w - 70, 2);
    });
    if (tp.label.material.map) tp.label.material.map.dispose();
    tp.label.material.map = tex; tp.label.material.needsUpdate = true;
  });
}

// trajet d'une cassette : pile → devant → fente du magnétoscope → dedans
function tapePath(tp, toVCR){
  const s = media.slotLocal, td = media.tapeDepth;
  const out = tp.home.clone().add(new V3(0, .02, .3));
  const front = new V3(s.x, s.y, s.z + td/2 + .22), mouth = new V3(s.x, s.y, s.z + td/2 + .01), inside = new V3(s.x, s.y, s.z - td/2 - .015);
  const pts = [tp.home.clone(), out, front, mouth, inside];
  const durs = [.32, .5, .28, .34];
  return toVCR ? {pts, durs, rot:[tp.homeRot, 0, 0, 0, 0]} : {pts: pts.slice().reverse(), durs: durs.slice().reverse(), rot:[0, 0, 0, 0, tp.homeRot]};
}
function animateTape(tp, toVCR, done){
  const p = tapePath(tp, toVCR);
  tp.anim = {...p, seg:0, t:0, done};
  tp.inVCR = toVCR;
}
function updateTapes(dt){
  for (const tp of media.tapes){
    const a = tp.anim; if (!a) continue;
    a.t += dt / (a.durs[a.seg] * M);
    const k = Math.min(1, a.t), e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;
    tp.group.position.lerpVectors(a.pts[a.seg], a.pts[a.seg + 1], e);
    tp.group.rotation.y = a.rot[a.seg] + (a.rot[a.seg + 1] - a.rot[a.seg]) * e;
    if (a.t >= 1){ a.seg++; a.t = 0; if (a.seg >= a.durs.length){ tp.anim = null; a.done && a.done(); } }
  }
  const wantOpen = media.tapes.some(tp => tp.anim && tp.anim.seg >= 2);
  media.flapT += ((wantOpen ? 1 : 0) - media.flapT) * Math.min(1, dt*12);
  media.flap.rotation.x = media.flapT * 1.25;
}
function drawVCRDisplay(t){
  const D = media.display, playing = media.playing >= 0;
  const el = playing ? Math.max(0, Math.floor(t - st.playT)) : 0;
  const txt = playing ? `▶ ${pad2(Math.floor(el/60))}:${pad2(el%60)}` : (Math.floor(t)%2 ? '--:--' : '-- --');
  if (txt === D.last) return; D.last = txt;
  const ctx = D.ctx; ctx.fillStyle = '#030605'; ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#6fffd2'; ctx.font = '44px VT323, monospace'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 14, 34);
  ctx.font = '20px VT323, monospace'; ctx.fillStyle = playing ? '#6fffd2' : '#1d4a3c'; ctx.fillText('SP  HI-FI', 172, 34);
  D.tex.needsUpdate = true;
}

/* ---------- lampe articulée posée sur la télé du menu ---------- */
const lamp = {meshes: []};
(function buildLamp(){
  const tv = tvs[0], g = tv.g, top = tv.ch/2;
  const bx = -tv.cw/2 + tv.side/2 + .2, bz = -.08;
  const B = new V3(bx, top, bz), J = new V3(bx - .02, top + .15, bz - .05), Hd = new V3(bx + .03, top + .2, bz + .17);
  const P = new V3(bx + .15, top - .4, tv.d/2 + .55);
  const black = mats.knob, chrome = mats.chrome;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, .02, 24), black); base.position.copy(B).add(new V3(0, .01, 0)); g.add(base);
  const parts = [base, rod(B, J, .008, chrome), rod(J, Hd, .008, chrome)];
  const joint = new THREE.Mesh(new THREE.SphereGeometry(.016, 12, 10), black); joint.position.copy(J); parts.push(joint);
  const dir = new V3().subVectors(P, Hd).normalize();
  const shade = new THREE.Mesh(new THREE.ConeGeometry(.065, .11, 24, 1, true), new THREE.MeshStandardMaterial({color:0xb5452a, roughness:.45, metalness:.3, side:THREE.DoubleSide, envMap:envTex, envMapIntensity:.15}));
  shade.position.copy(Hd).addScaledVector(dir, .035); shade.quaternion.setFromUnitVectors(new V3(0,1,0), dir.clone().negate()); parts.push(shade);
  const bulbM = new THREE.MeshStandardMaterial({color:0xffe0b0, emissive:0xffb060, emissiveIntensity:2.5});
  const lb = new THREE.Mesh(new THREE.SphereGeometry(.022, 12, 10), bulbM); lb.position.copy(Hd).addScaledVector(dir, .06); parts.push(lb);
  parts.forEach(m => { g.add(m); m.userData.lamp = true; lamp.meshes.push(m); });
  // zone de clic plus large que la lampe, invisible
  const hit = new THREE.Mesh(new THREE.SphereGeometry(.13, 8, 6), new THREE.MeshBasicMaterial({visible:false}));
  hit.position.copy(Hd); hit.userData.lamp = true; g.add(hit); lamp.meshes.push(hit);
  const spot = new THREE.SpotLight(0xffc27a, 4, 4, .7, .55, 2);
  spot.position.copy(lb.position); g.add(spot);
  const tgt = new THREE.Object3D(); tgt.position.copy(P); g.add(tgt); spot.target = tgt;
  lamp.spot = spot; lamp.bulbM = bulbM;
})();
