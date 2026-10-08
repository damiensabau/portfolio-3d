/* =========================================================
   3D
   ========================================================= */
let THREE, EffectComposer, RenderPass, UnrealBloomPass, OutputPass, RoundedBoxGeometry, RoomEnvironment;
try {
  setProgress(.04);
  THREE = await import('three'); setProgress(.42);
  const mods = await Promise.all([
    import('three/addons/geometries/RoundedBoxGeometry.js'),
    import('three/addons/environments/RoomEnvironment.js'),
    import('three/addons/postprocessing/EffectComposer.js'),
    import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'),
    import('three/addons/postprocessing/OutputPass.js'),
  ]);
  ({RoundedBoxGeometry} = mods[0]); ({RoomEnvironment} = mods[1]); ({EffectComposer} = mods[2]);
  ({RenderPass} = mods[3]); ({UnrealBloomPass} = mods[4]); ({OutputPass} = mods[5]);
  setProgress(.6);
} catch(e){ webglFail(); throw e; }

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const M = reduce ? 0.45 : 1;

const glCanvas = document.getElementById('gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas: glCanvas, antialias: true, powerPreference:'high-performance'});
} catch(e){ webglFail(); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050608);
scene.fog = new THREE.FogExp2(0x06080b, 0.11);

const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.05, 60);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.62, 0.55, 0.92);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------- textures procédurales ---------- */
function canvasTex(w, h, draw, rep){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (rep){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  t.anisotropy = 4;
  return t;
}
function speckle(ctx, w, h, n, a){
  for (let i=0;i<n;i++){
    const v = Math.random()*255|0;
    ctx.fillStyle = `rgba(${v},${v},${v},${Math.random()*a})`;
    ctx.fillRect(Math.random()*w, Math.random()*h, 1+Math.random()*2, 1+Math.random()*2);
  }
}
const floorTex = canvasTex(512, 512, (ctx,w,h)=>{
  ctx.fillStyle = '#26282a'; ctx.fillRect(0,0,w,h);
  speckle(ctx,w,h,9000,.18);
  for (let i=0;i<14;i++){ const g=ctx.createRadialGradient(Math.random()*w,Math.random()*h,0,Math.random()*w,Math.random()*h,120);
    g.addColorStop(0,'rgba(0,0,0,.25)'); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); }
  ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 3;
  ctx.strokeRect(0,0,w,h); ctx.beginPath(); ctx.moveTo(w/2,0); ctx.lineTo(w/2,h); ctx.moveTo(0,h/2); ctx.lineTo(w,h/2); ctx.stroke();
}, [5,5]);
const wallTex = canvasTex(512, 512, (ctx,w,h)=>{
  const g = ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#1d2226'); g.addColorStop(1,'#14181b');
  ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
  speckle(ctx,w,h,6000,.12);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; for (let x=0;x<w;x+=128) ctx.fillRect(x,0,3,h);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0,h*.62,w,4);
  for (let i=0;i<10;i++){ ctx.fillStyle=`rgba(40,30,15,${Math.random()*.12})`; ctx.fillRect(Math.random()*w, h*.62, 4+Math.random()*10, Math.random()*h*.38); }
}, [4,1.5]);

/* ---------- reflets (environnement studio, appliqué matériau par matériau) ---------- */
const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const woodTex = canvasTex(512, 512, (ctx,w,h)=>{
  ctx.fillStyle = '#5a341b'; ctx.fillRect(0,0,w,h);
  for (let i=0;i<240;i++){
    const y0 = Math.random()*h, a = Math.random()*.22, amp = 2 + Math.random()*7, fr = .004 + Math.random()*.01, ph = Math.random()*6;
    ctx.strokeStyle = Math.random() < .7 ? `rgba(30,14,5,${a})` : `rgba(140,90,50,${a*.6})`;
    ctx.lineWidth = .6 + Math.random()*2.2; ctx.beginPath();
    for (let x=0;x<=w;x+=8){ const y = y0 + Math.sin(x*fr + ph)*amp + Math.sin(x*fr*3.1)*amp*.3; x ? ctx.lineTo(x,y) : ctx.moveTo(x,y); }
    ctx.stroke();
  }
  speckle(ctx,w,h,2500,.08);
});
const brushTex = canvasTex(512, 512, (ctx,w,h)=>{
  ctx.fillStyle = '#9a9ea3'; ctx.fillRect(0,0,w,h);
  for (let i=0;i<3500;i++){ const v = 120 + Math.random()*110|0; ctx.fillStyle = `rgba(${v},${v},${v+4},${Math.random()*.25})`; ctx.fillRect(0, Math.random()*h, w, Math.random()*1.4); }
});
const plasticTex = canvasTex(256, 256, (ctx,w,h)=>{ ctx.fillStyle = '#c9bfa9'; ctx.fillRect(0,0,w,h); speckle(ctx,w,h,3000,.07); });
const grilleTex = canvasTex(256, 256, (ctx,w,h)=>{
  ctx.fillStyle = '#26282b'; ctx.fillRect(0,0,w,h);
  ctx.fillStyle = '#060607';
  for (let y=8;y<h;y+=14) for (let x=(y/14%2)*7+8;x<w;x+=14){ ctx.beginPath(); ctx.arc(x,y,4.2,0,Math.PI*2); ctx.fill(); }
});
grilleTex.wrapS = grilleTex.wrapT = THREE.RepeatWrapping;

/* ---------- matériaux ---------- */
const std = (o) => new THREE.MeshStandardMaterial({envMap:envTex, envMapIntensity:.08, ...o});
const mats = {
  grey:  std({color:0x3a3d42, roughness:.42, metalness:.35, envMapIntensity:.1}),
  wood:  std({map:woodTex, roughness:.45, metalness:0, envMapIntensity:.1}),
  cream: std({map:plasticTex, roughness:.4, metalness:0, envMapIntensity:.1}),
  panel: std({map:brushTex, roughness:.38, metalness:.85, envMapIntensity:.25}),
  bezel: std({color:0x070708, roughness:.32, metalness:.1, envMapIntensity:.12}),
  chrome:std({color:0xe8e4dc, roughness:.14, metalness:1, envMapIntensity:.45}),
  knob:  std({color:0x1a1a1c, roughness:.3, metalness:.3, envMapIntensity:.15}),
  metal: std({color:0x3a3d40, roughness:.45, metalness:.8, envMapIntensity:.12}),
  rubber:new THREE.MeshStandardMaterial({color:0x0e0e0f, roughness:.9}),
  crate: new THREE.MeshStandardMaterial({color:0x2b2a24, roughness:.85}),
  grille:std({map:grilleTex, roughness:.6, metalness:.4, envMapIntensity:.06}),
  vent:  new THREE.MeshStandardMaterial({color:0x050505, roughness:.9}),
  legWood:std({map:woodTex, roughness:.45, envMapIntensity:.1}),
  // vitre : reflet doux dessiné à la main, sans miroir de l'environnement
  glass: new THREE.ShaderMaterial({transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false,
    vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader:`varying vec2 vUv;
      void main(){
        vec2 p=vUv-0.5;
        float sheen=smoothstep(0.15,0.55,vUv.y+ (0.5-vUv.x)*0.35)*smoothstep(1.0,0.7,vUv.y)*0.035;
        float streak=exp(-pow((vUv.x*0.6+vUv.y-1.05)*14.0,2.0))*0.025;
        float rim=smoothstep(0.36,0.5,max(abs(p.x),abs(p.y)))*0.02;
        gl_FragColor=vec4(vec3(1.0,0.96,0.9)*(sheen+streak+rim),1.0);
      }`}),
};
const accent = { grey:0xff8a2a, wood:0xd8b070, cream:0x2a2a2a };

/* ---------- pièce ---------- */
const floor = new THREE.Mesh(new THREE.PlaneGeometry(16,16), new THREE.MeshStandardMaterial({map:floorTex, roughness:.82, metalness:.12}));
floor.rotation.x = -Math.PI/2; scene.add(floor);
const wallMat = new THREE.MeshStandardMaterial({map:wallTex, roughness:.9});
const back = new THREE.Mesh(new THREE.PlaneGeometry(14,3.6), wallMat); back.position.set(0,1.8,-1.75); scene.add(back);
const left = new THREE.Mesh(new THREE.PlaneGeometry(10,3.6), wallMat); left.position.set(-3.5,1.8,2.5); left.rotation.y = Math.PI/2; scene.add(left);
const right = new THREE.Mesh(new THREE.PlaneGeometry(10,3.6), wallMat); right.position.set(3.7,1.8,2.5); right.rotation.y = -Math.PI/2; scene.add(right);
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16,16), new THREE.MeshStandardMaterial({color:0x0a0b0c, roughness:1}));
ceil.position.y = 3.6; ceil.rotation.x = Math.PI/2; scene.add(ceil);

const hemi = new THREE.HemisphereLight(0x3a4a5c, 0x080706, 0.8); scene.add(hemi);

// ampoule suspendue
const bulbGroup = new THREE.Group(); bulbGroup.position.set(0.35, 3.6, 0.7); scene.add(bulbGroup);
const cord = new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.75,6), mats.rubber); cord.position.y = -.375; bulbGroup.add(cord);
const bulb = new THREE.Mesh(new THREE.SphereGeometry(.045,16,12), new THREE.MeshStandardMaterial({color:0xffd8a0, emissive:0xffb060, emissiveIntensity:3}));
bulb.position.y = -.79; bulbGroup.add(bulb);
const shade = new THREE.Mesh(new THREE.ConeGeometry(.16,.12,20,1,true), new THREE.MeshStandardMaterial({color:0x1c1d1f, metalness:.6, roughness:.4, side:THREE.DoubleSide}));
shade.position.y = -.72; bulbGroup.add(shade);
const bulbLight = new THREE.PointLight(0xffc488, 5, 7, 2); bulbLight.position.y = -.82; bulbGroup.add(bulbLight);

/* ---------- shader écran CRT ---------- */
const crtVert = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const crtFrag = `
uniform sampler2D uTex; uniform float uTime,uStatic,uPower,uBright,uSeed,uTrack;
varying vec2 vUv;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
void main(){
  vec2 uv=vUv;
  float p=clamp(uPower,0.0,1.0);
  float sx=smoothstep(0.0,0.35,p);
  float sy=mix(0.006,1.0,smoothstep(0.3,1.0,p));
  vec2 q=(uv-0.5)/vec2(max(sx,0.001),sy)+0.5;
  vec2 c=q*2.0-1.0; c*=1.0+vec2(c.y*c.y,c.x*c.x)*0.045; vec2 t=c*0.5+0.5;
  vec2 rq=abs(t-0.5)-(0.5-0.06); float sd=length(max(rq,0.0))+min(max(rq.x,rq.y),0.0)-0.06;
  float inside=1.0-smoothstep(-0.006,0.0,sd);
  float jit=(hash(vec2(floor(t.y*240.0),floor(uTime*24.0)+uSeed))-0.5)*0.004*(0.25+uStatic*2.0);
  float band=exp(-pow((fract(t.y*0.8+uTime*0.45)-0.5)*7.0,2.0))*uTrack;
  jit+=(hash(vec2(floor(t.y*90.0),floor(uTime*30.0)))-0.5)*0.05*band+sin(t.y*40.0+uTime*20.0)*0.004*uTrack;
  vec2 tj=t+vec2(jit,0.0);
  float ab=0.0016;
  vec3 col=vec3(texture2D(uTex,tj+vec2(ab,0.0)).r, texture2D(uTex,tj).g, texture2D(uTex,tj-vec2(ab,0.0)).b);
  float n=hash(floor(t*vec2(260.0,195.0))+floor(uTime*30.0)*vec2(1.7,3.1)+uSeed);
  col=mix(col, vec3(n)*vec3(1.0,0.86,0.66)*0.5, uStatic);
  col=mix(col, vec3(n)*0.9, band*0.55);
  col*=0.78+0.22*sin(t.y*3.14159*384.0);
  float sub=fract(t.x*1024.0/3.0);
  vec3 mask=vec3(step(sub,0.333),step(0.333,sub)*step(sub,0.666),step(0.666,sub));
  col*=mix(vec3(1.0),mask*1.9+0.25,0.16);
  col+=vec3(1.0,0.62,0.22)*0.05*uBright*(1.0-smoothstep(-0.12,0.0,sd))*smoothstep(-0.12,-0.02,sd)*step(0.5,uPower);
  float roll=exp(-pow((fract(t.y-uTime*0.11)-0.5)*9.0,2.0));
  col*=1.0+roll*0.1;
  vec2 v=t*(1.0-t); col*=pow(clamp(v.x*v.y*16.0,0.0,1.0),0.25);
  col+=(n-0.5)*0.035;
  col*=0.96+0.04*sin(uTime*55.0+uSeed);
  col*=uBright*inside;
  float line=(1.0-smoothstep(0.0,0.02,abs(uv.y-0.5)))*(1.0-smoothstep(0.3,0.9,p))*step(abs(uv.x-0.5),sx*0.5);
  col+=vec3(1.0,0.85,0.6)*line*3.0;
  col*=step(0.0001,p);
  gl_FragColor=vec4(col,1.0);
}`;

