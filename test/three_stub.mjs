// Faux three.js minimal : juste assez pour exécuter le code et attraper les erreurs JS.
export class Vector3 { constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;} copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;} clone(){return new Vector3(this.x,this.y,this.z);}
  add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;} sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
  subVectors(a,b){this.x=a.x-b.x;this.y=a.y-b.y;this.z=a.z-b.z;return this;} addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;}
  multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;} length(){return Math.hypot(this.x,this.y,this.z);}
  normalize(){const l=this.length()||1;return this.multiplyScalar(1/l);} negate(){return this.multiplyScalar(-1);}
  lerp(v,k){this.x+=(v.x-this.x)*k;this.y+=(v.y-this.y)*k;this.z+=(v.z-this.z)*k;return this;}
  lerpVectors(a,b,k){return this.copy(a).lerp(b,k);} transformDirection(){return this.normalize();} applyMatrix4(){return this;}
  project(){return this;} setFromMatrixColumn(){return this.set(1,0,0);} }
export class Vector2 { constructor(x=0,y=0){this.x=x;this.y=y;} set(x,y){this.x=x;this.y=y;return this;} }
export class Color { constructor(c){this.c=c;} set(c){this.c=c;return this;} }
export class Euler { constructor(){this.x=0;this.y=0;this.z=0;} set(x,y,z){this.x=x;this.y=y;this.z=z;return this;} }
export class Quaternion { setFromUnitVectors(a,b){ if(!(a instanceof Vector3)||!(b instanceof Vector3)) throw new Error('setFromUnitVectors args'); return this;} }
export class Matrix4 { constructor(){this.elements=new Array(16).fill(0);} }
export class Object3D { constructor(){ this.children=[]; this.position=new Vector3(); this.rotation=new Euler(); this.quaternion=new Quaternion(); this.scale=new Vector3(1,1,1); this.userData={}; this.matrixWorld=new Matrix4(); this.visible=true; this.parent=null; }
  add(...o){ for(const c of o){ if(!(c instanceof Object3D)) throw new Error('add non-Object3D'); c.parent=this; this.children.push(c);} return this; }
  traverse(f){ f(this); for(const c of this.children) c.traverse(f); }
  updateMatrixWorld(){} updateWorldMatrix(){} getWorldPosition(v){ return v.copy(this.position); } localToWorld(v){ return v; } lookAt(){} }
export class Group extends Object3D {}
export class Scene extends Object3D {}
export class Mesh extends Object3D { constructor(g,m){ super(); if(!g) throw new Error('Mesh without geometry'); this.geometry=g; this.material=m; this.isMesh=true; this.renderOrder=0; } }
export class Points extends Object3D { constructor(g,m){ super(); this.geometry=g; this.material=m; this.isPoints=true; } raycast(){} }
class Light extends Object3D { constructor(c,i){ super(); this.color=c; this.intensity=i??1; this.isLight=true; } }
export class PointLight extends Light {} export class SpotLight extends Light { constructor(...a){ super(...a); this.target=new Object3D(); } }
export class HemisphereLight extends Light { constructor(a,b,i){ super(a,i); } }
export class PerspectiveCamera extends Object3D { constructor(fov,aspect){ super(); this.fov=fov; this.aspect=aspect; } updateProjectionMatrix(){} }
export class FogExp2 { constructor(c,d){ this.color=c; this.density=d; } }
class Attr { constructor(arr,n){ this.array=arr; this.itemSize=n; this.count=arr.length/n; this.needsUpdate=false; } getX(i){return this.array[i*3];} getY(i){return this.array[i*3+1];} setZ(i,v){this.array[i*3+2]=v;} }
export class BufferAttribute extends Attr {}
export class BufferGeometry { constructor(){ this.attributes={}; } setAttribute(n,a){ this.attributes[n]=a; return this; } computeVertexNormals(){} rotateX(){return this;} rotateY(){return this;} scale(){return this;} dispose(){} }
function geo(name){ return class extends BufferGeometry { constructor(...a){ super(); for(const v of a){ if(typeof v==='number' && !Number.isFinite(v)) throw new Error(name+': non-finite arg '+a); } this.attributes.position=new Attr(new Float32Array(30*3),3); } }; }
export const PlaneGeometry=geo('Plane'), BoxGeometry=geo('Box'), SphereGeometry=geo('Sphere'), CylinderGeometry=geo('Cylinder'), ConeGeometry=geo('Cone'), CircleGeometry=geo('Circle'), TubeGeometry=geo('Tube'), ExtrudeGeometry=geo('Extrude');
export class Shape { constructor(){ this.holes=[]; } moveTo(){return this;} lineTo(){return this;} quadraticCurveTo(){return this;} }
export class CatmullRomCurve3 { constructor(p){ if(!p.every(v=>v instanceof Vector3)) throw new Error('curve pts'); } }
class Mat { constructor(o={}){ Object.assign(this,o); this.needsUpdate=false; } clone(){ return new this.constructor({...this}); } dispose(){} }
export class MeshStandardMaterial extends Mat {} export class MeshBasicMaterial extends Mat {} export class PointsMaterial extends Mat {}
export class ShaderMaterial extends Mat { constructor(o){ super(o); if(!o.uniforms && !o.fragmentShader) throw new Error('shader'); } }
export class CanvasTexture { constructor(c){ this.image=c; this.repeat=new Vector2(1,1); } clone(){ const t=new CanvasTexture(this.image); return t; } dispose(){} }
export class WebGLRenderer { constructor(o){ this.domElement=o.canvas; } setPixelRatio(){} setSize(){} }
export class PMREMGenerator { fromScene(){ return {texture:{}}; } }
export class Raycaster { setFromCamera(){} intersectObject(){ return globalThis.__hits || []; } intersectObjects(){ return []; } }
export class Clock { getDelta(){ return 0.05; } }
export const MathUtils = { degToRad:d=>d*Math.PI/180, clamp:(v,a,b)=>Math.max(a,Math.min(b,v)) };
export const SRGBColorSpace='srgb', RepeatWrapping=1000, AdditiveBlending=2, DoubleSide=2, ACESFilmicToneMapping=4;
