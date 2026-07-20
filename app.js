import * as THREE from 'https://unpkg.com/three@0.167.1/build/three.module.js';
import {OrbitControls} from 'https://unpkg.com/three@0.167.1/examples/jsm/controls/OrbitControls.js';
import {TransformControls} from 'https://unpkg.com/three@0.167.1/examples/jsm/controls/TransformControls.js';
const r=new THREE.WebGLRenderer({canvas:document.getElementById('c'),antialias:true});r.setSize(innerWidth,innerHeight);
const s=new THREE.Scene();s.background=new THREE.Color(0x202020);
const cam=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,1000);cam.position.set(4,4,4);
const o=new OrbitControls(cam,r.domElement);
s.add(new THREE.GridHelper(20,20));
s.add(new THREE.HemisphereLight(0xffffff,0x444444,2));
const t=new TransformControls(cam,r.domElement);s.add(t);t.addEventListener('dragging-changed',e=>o.enabled=!e.value);
let sel=null;const ray=new THREE.Raycaster();const m=new THREE.Vector2();
document.getElementById('cube').onclick=()=>{const c=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({color:0x4ea3ff}));s.add(c);}
['move','rotate','scale'].forEach(id=>document.getElementById(id).onclick=()=>t.setMode(id));
addEventListener('pointerdown',e=>{m.x=e.clientX/innerWidth*2-1;m.y=-(e.clientY/innerHeight)*2+1;ray.setFromCamera(m,cam);const h=ray.intersectObjects(s.children);if(h.length){sel=h[0].object;if(sel!==t)t.attach(sel);}});
addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();r.setSize(innerWidth,innerHeight);});
(function a(){requestAnimationFrame(a);o.update();r.render(s,cam);})();