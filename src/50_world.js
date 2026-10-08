/* ---------- construction des télés ---------- */
const SPECS = [
  {x:-0.85, z: 0.00, ry: 0.28, w:1.04, h:0.78, base:0.86, style:'grey',  knobs:true },               // menu
  {x: 0.75, z:-0.45, ry:-0.18, w:0.72, h:0.54, base:1.55, style:'wood',  knobs:false, antenna:true}, // profil
  {x: 1.90, z: 0.35, ry:-0.55, w:0.96, h:0.72, base:0.45, style:'grey',  knobs:true },               // expérience
  {x:-2.30, z: 0.80, ry: 0.75, w:0.88, h:0.66, base:0.54, style:'wood',  knobs:true, stand:'media'},               // projets
  {x:-0.25, z:-1.00, ry: 0.05, w:0.68, h:0.51, base:2.05, style:'cream', knobs:false, tilt:0.14},    // compétences
  {x:-2.05, z:-0.15, ry: 0.50, w:0.74, h:0.56, base:1.50, style:'grey',  knobs:false, antenna:true}, // formation
  {x: 2.70, z: 1.35, ry:-0.85, w:0.70, h:0.52, base:1.35, style:'cream', knobs:true },               // contact
];

function makeRack(w, d, hgt){
  const g = new THREE.Group(), pole = new THREE.BoxGeometry(.035, hgt, .035);
  for (const sx of [-1,1]) for (const sz of [-1,1]){
    const m = new THREE.Mesh(pole, mats.metal); m.position.set(sx*(w/2-.02), hgt/2, sz*(d/2-.02)); g.add(m); }
  const shelfs = hgt > 1 ? [0.12, hgt*0.5, hgt-0.015] : [0.1, hgt-0.015];
  for (const y of shelfs){ const s = new THREE.Mesh(new THREE.BoxGeometry(w, .03, d), mats.metal); s.position.y = y; g.add(s); }
  const led = new THREE.Mesh(new THREE.SphereGeometry(.012,8,6), new THREE.MeshStandardMaterial({color:0x221100, emissive:0xffa030, emissiveIntensity:2}));
  led.position.set(w/2-.06, hgt-.05, d/2+.005); g.add(led); g.userData.led = led;
  return g;
}
// pieds compas façon mobilier des années 60
function makeLegs(w, d, hgt, mat){
  const g = new THREE.Group(), splay = .16;
  const len = hgt / Math.cos(splay);
  const geo = new THREE.CylinderGeometry(.02, .011, len, 12);
  for (const sx of [-1,1]) for (const sz of [-1,1]){
    const m = new THREE.Mesh(geo, mat);
    m.rotation.z = sx*splay; m.rotation.x = -sz*splay*.6;
    m.position.set(sx*(w/2 - .07) + sx*Math.tan(splay)*hgt*.5, hgt/2, sz*(d/2 - .08) + sz*Math.tan(splay*.6)*hgt*.5);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.013,.013,.025,10), mats.chrome);
    cap.position.y = -len/2 + .012; m.add(cap);
    g.add(m);
  }
  const rail = new THREE.Mesh(new RoundedBoxGeometry(w - .06, .04, d - .08, 2, .015), mat); rail.position.y = hgt - .02; g.add(rail);
  return g;
}

function roundRect(w, h, r){
  const s = new THREE.Shape(), x = -w/2, y = -h/2;
  s.moveTo(x+r, y); s.lineTo(x+w-r, y); s.quadraticCurveTo(x+w, y, x+w, y+r);
  s.lineTo(x+w, y+h-r); s.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  s.lineTo(x+r, y+h); s.quadraticCurveTo(x, y+h, x, y+h-r);
  s.lineTo(x, y+r); s.quadraticCurveTo(x, y, x+r, y);
  return s;
}
function bezelFrame(ow, oh, iw, ih, ro, ri, depth, bevel, mat){
  const sh = roundRect(ow, oh, ro); sh.holes.push(roundRect(iw, ih, ri));
  const geo = new THREE.ExtrudeGeometry(sh, {depth, bevelEnabled:true, bevelThickness:bevel, bevelSize:bevel, bevelSegments:3, curveSegments:10});
  return new THREE.Mesh(geo, mat);
}
function curvedPlane(w, h, bulge){
  const geo = new THREE.PlaneGeometry(w, h, 32, 24), p = geo.attributes.position;
  for (let i=0;i<p.count;i++){ const nx = p.getX(i)/(w/2), ny = p.getY(i)/(h/2); p.setZ(i, bulge*(1-nx*nx)*(1-ny*ny)); }
  geo.computeVertexNormals(); return geo;
}
function dialFace(light){
  return canvasTex(256, 256, (ctx,w,h)=>{
    const c = w/2;
    ctx.fillStyle = light ? '#d9d2c2' : '#141416'; ctx.beginPath(); ctx.arc(c,c,c,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = light ? '#2a2620' : '#c9c3b6'; ctx.fillStyle = ctx.strokeStyle;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 30px "IBM Plex Mono", monospace';
    for (let n=1;n<=12;n++){
      const a = -n*Math.PI/6; // chiffres dans le sens inverse : tourner à droite fait monter la chaîne
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(c+Math.sin(a)*112, c-Math.cos(a)*112); ctx.lineTo(c+Math.sin(a)*124, c-Math.cos(a)*124); ctx.stroke();
      ctx.fillText(String(n), c+Math.sin(a)*86, c-Math.cos(a)*86);
    }
    const g = ctx.createRadialGradient(c-20,c-20,4,c,c,46); g.addColorStop(0,'#f4f1ea'); g.addColorStop(1,'#77736b');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c,c,44,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(c-5, c-44, 10, 40);
  });
}
function plateTex(text, dark){
  return canvasTex(256, 64, (ctx,w,h)=>{
    const g = ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#f0ece4'); g.addColorStop(.5,'#9d988f'); g.addColorStop(1,'#dcd7ce');
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    ctx.fillStyle = '#16140f'; ctx.font = '600 30px "IBM Plex Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, w/2, h/2+2);
  });
}

const tvs = [];
const screens = [];
SPECS.forEach((s, idx)=>{
  const d = 0.55, pad = 0.12, side = s.knobs ? 0.26 : 0;
  const cw = s.w + pad*2 + side, ch = s.h + pad*2 + (s.knobs ? 0 : .06);
  const radius = s.style === 'cream' ? .06 : s.style === 'wood' ? .028 : .045;
  const body = mats[s.style];
  const root = new THREE.Group(); root.position.set(s.x, 0, s.z); root.rotation.y = s.ry; scene.add(root);
  const legs = s.base < .6;
  const stand = s.stand === 'media' ? new THREE.Group() /* meuble construit plus loin */ : legs ? makeLegs(cw, d, s.base, s.style === 'wood' ? mats.legWood : mats.chrome) : makeRack(cw + .08, d + .12, s.base);
  stand.position.x = side/2; root.add(stand);

  const g = new THREE.Group(); g.position.y = s.base + ch/2; if (s.tilt) g.rotation.x = s.tilt; root.add(g);
  const sy = s.knobs ? 0 : .03;               // écran légèrement remonté quand les boutons sont en bas
  const front = d/2;

  // caisson arrondi
  const cab = new THREE.Mesh(new RoundedBoxGeometry(cw, ch, d, 4, radius), body); cab.position.x = side/2; g.add(cab);
  // tube cathodique : tronc de pyramide à l'arrière
  const tl = d*.75;
  const tg = new THREE.CylinderGeometry(.7071*.42, .7071, 1, 4, 1); tg.rotateY(Math.PI/4); tg.scale(cw*.8, tl, ch*.78); tg.rotateX(-Math.PI/2);
  const tube = new THREE.Mesh(tg, body); tube.position.set(side/2, 0, -front - tl/2 + .02); g.add(tube);
  // fentes d'aération
  for (let k=0;k<7;k++){
    const v = new THREE.Mesh(new THREE.BoxGeometry(cw*.5, .012, .004), mats.vent);
    v.position.set(side/2, ch*.3 - k*.05, -front - .003); g.add(v);
  }
  if (s.style === 'grey'){
    for (const sx of [-1,1]) for (let k=0;k<6;k++){
      const v = new THREE.Mesh(new THREE.BoxGeometry(.004, ch*.5, .018), mats.vent);
      v.position.set(side/2 + sx*(cw/2 + .001), 0, -front*.1 - k*.04); g.add(v);
    }
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(cw - radius*2, .014, .006), new THREE.MeshStandardMaterial({color:accent.grey, emissive:accent.grey, emissiveIntensity:.08, roughness:.4}));
    stripe.position.set(side/2, ch/2 - .04, front + .003); g.add(stripe);
  }

  // encadrement noir laqué + jonc chromé
  const iw = s.w, ih = s.h;
  const bez = bezelFrame(iw + .14, ih + .14, iw + .026, ih + .026, .08, .055, .012, .012, mats.bezel); bez.position.set(0, sy, front - .006); g.add(bez);
  if (s.style !== 'grey'){
    const trim = bezelFrame(iw + .175, ih + .175, iw + .15, ih + .15, .095, .08, .004, .004, mats.chrome); trim.position.set(0, sy, front - .002); g.add(trim);
  }
  // fond du tube (évite de voir le caisson dans les coins arrondis)
  const well = new THREE.Mesh(new THREE.PlaneGeometry(iw, ih), new THREE.MeshBasicMaterial({color:0x020202}));
  well.position.set(0, sy, front - .012); g.add(well);

  // écran bombé + vitre
  const cnv = document.createElement('canvas'); cnv.width = CW; cnv.height = CH;
  const tex = new THREE.CanvasTexture(cnv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new THREE.ShaderMaterial({
    uniforms:{uTex:{value:tex}, uTime:{value:0}, uStatic:{value:.7}, uPower:{value:0}, uBright:{value:.45}, uSeed:{value:idx*17.31}, uTrack:{value:0}},
    vertexShader:crtVert, fragmentShader:crtFrag, toneMapped:false
  });
  const sgeo = curvedPlane(iw, ih, .028);
  const screen = new THREE.Mesh(sgeo, mat); screen.position.set(0, sy, front - .008); g.add(screen);
  const glass = new THREE.Mesh(sgeo, mats.glass); glass.userData.skip = true; glass.position.set(0, sy, front - .004); glass.renderOrder = 2; g.add(glass);

  // façade : panneau de commande ou rangée de boutons
  let dial = null, led;
  const ledMat = new THREE.MeshStandardMaterial({color:0x220800, emissive:0xff5a1a, emissiveIntensity:0});
  if (s.knobs){
    const px = iw/2 + pad/2 + side/2 + .01, pw = side - .02, ph = ch - .08;
    const panel = new THREE.Mesh(new RoundedBoxGeometry(pw, ph, .02, 3, .012), s.style === 'cream' ? mats.bezel : mats.panel);
    panel.position.set(px, 0, front + .004); g.add(panel);
    // sélecteur de canal
    dial = new THREE.Group(); dial.position.set(px, ph/2 - .11, front + .014); g.add(dial);
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(.075, .08, .03, 40), mats.chrome); skirt.rotation.x = Math.PI/2; dial.add(skirt);
    const body2 = new THREE.Mesh(new THREE.CylinderGeometry(.068, .07, .05, 40), mats.knob); body2.rotation.x = Math.PI/2; body2.position.z = .02; dial.add(body2);
    const face = new THREE.Mesh(new THREE.CircleGeometry(.064, 40), new THREE.MeshStandardMaterial({map:dialFace(s.style !== 'cream'), roughness:.35, metalness:.2, envMap:envTex, envMapIntensity:.15}));
    face.position.z = .046; dial.add(face);
    const ptr = new THREE.Mesh(new THREE.ConeGeometry(.012, .022, 3), mats.chrome); ptr.rotation.z = Math.PI; ptr.position.set(px, ph/2 - .015, front + .016); g.add(ptr);
    // boutons volume / contraste
    for (let k=0;k<2;k++){
      const kn = new THREE.Group(); kn.position.set(px - .045 + k*.09, ph/2 - .27, front + .014); g.add(kn);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(.03, .033, .04, 28), mats.knob); b.rotation.x = Math.PI/2; kn.add(b);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .006, 28), mats.chrome); cap.rotation.x = Math.PI/2; cap.position.z = .022; kn.add(cap);
    }
    // grille du haut-parleur
    const gh = ph - .47;
    if (gh > .08){
      const gr = new THREE.Mesh(new RoundedBoxGeometry(pw - .04, gh, .012, 2, .01), mats.grille);
      gr.material = gr.material.clone(); gr.material.map = grilleTex.clone(); gr.material.map.repeat.set((pw-.04)/.1, gh/.1); gr.material.map.needsUpdate = true;
      gr.position.set(px, -ph/2 + .03 + gh/2, front + .012); g.add(gr);
    }
    led = new THREE.Mesh(new THREE.SphereGeometry(.009, 12, 8), ledMat); led.position.set(px + pw/2 - .03, ph/2 - .34, front + .016); g.add(led);
  } else {
    const by = -ch/2 + .065;
    for (let k=0;k<3;k++){
      const kn = new THREE.Mesh(new THREE.CylinderGeometry(.02, .022, .03, 24), k === 0 ? mats.chrome : mats.knob);
      kn.rotation.x = Math.PI/2; kn.position.set(iw/2 - .03 - k*.065, by, front + .012); g.add(kn);
    }
    led = new THREE.Mesh(new THREE.SphereGeometry(.008, 12, 8), ledMat); led.position.set(iw/2 - .23, by, front + .006); g.add(led);
  }
  // plaque de modèle
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(.15, .0375), new THREE.MeshStandardMaterial({map:plateTex('DS·' + String(idx+1).padStart(2,'0')), roughness:.25, metalness:.9, envMap:envTex, envMapIntensity:.3}));
  if (s.knobs) plate.position.set(iw/2 + pad/2 + side/2 + .01, (ch - .08)/2 - .395, front + .016);
  else plate.position.set(-iw/2 + .1, -ch/2 + .065, front + .003);
  g.add(plate);

  // antenne « oreilles de lapin »
  if (s.antenna){
    const top = ch/2, bx = side/2;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(.05, 20, 10, 0, Math.PI*2, 0, Math.PI/2), mats.chrome); dome.position.set(bx, top, -.08); g.add(dome);
    for (const a of [-.42, .5]){
      const len = .62, rod = new THREE.Mesh(new THREE.CylinderGeometry(.004, .006, len, 8), mats.chrome);
      rod.position.set(bx - Math.sin(a)*len/2, top + .03 + Math.cos(a)*len/2, -.08); rod.rotation.z = a; g.add(rod);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(.011, 10, 8), mats.chrome);
      tip.position.set(bx - Math.sin(a)*len, top + .03 + Math.cos(a)*len, -.08); g.add(tip);
    }
  }

  const light = new THREE.PointLight(0xffa64a, 0, 3.2, 2); light.position.set(0, .1, front + .7); g.add(light);

  const tv = {idx, spec:s, root, g, screen, mat, tex, cnv, ctx:cnv.getContext('2d'), light, rack:stand, dial, led,
    dialA: (idx === 0 ? 2 : idx + 1) * Math.PI/6,
    kind: idx===0 ? 'menu' : 'section', sec: idx===0 ? null : CV.sections[idx-1],
    power:0, powerT:0, stat:.7, statT:.7, bright:.45, brightT:.45, burst:0, track:0,
    scroll:0, scrollT:0, layout:null, dlayout:null, hits:[], hover:null, dirty:true, cw, ch, d, side};
  if (dial){ dial.rotation.z = -tv.dialA; dial.traverse(o => { if (o.isMesh) o.userData.dialOf = tv; }); }
  screen.userData.tv = tv;
  tvs.push(tv); screens.push(screen);
});

// câbles qui partent de chaque télé vers un boîtier au mur
scene.updateMatrixWorld(true);
const hub = new THREE.Vector3(0.6, 0.02, -1.6);
const junction = new THREE.Mesh(new THREE.BoxGeometry(.5,.36,.12), mats.metal); junction.position.set(0.6, 0.5, -1.68); scene.add(junction);
for (const tv of tvs){
  const a = new THREE.Vector3(0, 0, -0.55*.77 - .15).applyMatrix4(tv.g.matrixWorld);
  const b = new THREE.Vector3(a.x*.7 + hub.x*.3, 0.03, a.z*.5 + hub.z*.5 + .2);
  const c = new THREE.Vector3(hub.x + (Math.random()-.5)*.3, 0.02, hub.z + .15);
  const curve = new THREE.CatmullRomCurve3([a, new THREE.Vector3(a.x, a.y*.4, a.z - .1), b, c, new THREE.Vector3(0.6, .35, -1.62)]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, .011, 6, false), mats.rubber));
}
// caisses
[[-1.35,.19,1.75,.38,.38,.42,.3],[1.05,.17,2.15,.46,.34,.36,-.4],[1.25,.12,1.85,.3,.24,.3,.2],[-3.0,.22,-1.2,.5,.44,.44,.1]].forEach(([x,y,z,w,h,d,r])=>{
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mats.crate); m.position.set(x,y,z); m.rotation.y = r; scene.add(m); });

// poussière
const dustN = 380, dustPos = new Float32Array(dustN*3);
for (let i=0;i<dustN;i++){ dustPos[i*3] = (Math.random()-.5)*6.5; dustPos[i*3+1] = Math.random()*3.4; dustPos[i*3+2] = -1.6 + Math.random()*5; }
const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos,3));
const dustTex = canvasTex(64,64,(ctx)=>{ const g = ctx.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,220,170,1)'); g.addColorStop(1,'rgba(255,220,170,0)'); ctx.fillStyle = g; ctx.fillRect(0,0,64,64); });
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({size:.018, map:dustTex, transparent:true, opacity:.45, depthWrite:false, blending:THREE.AdditiveBlending, color:0xffd9a8}));
dust.raycast = () => {}; scene.add(dust);

