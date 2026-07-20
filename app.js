import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";

const canvas = document.querySelector("#viewport");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111827);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
camera.position.set(5.5, 4.5, 6.5);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.target.set(0, 0.6, 0);
orbit.minDistance = 2;
orbit.maxDistance = 30;

const hemi = new THREE.HemisphereLight(0xdbeafe, 0x293548, 2.3);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(4, 8, 5);
key.castShadow = true;
scene.add(key);

const grid = new THREE.GridHelper(30, 30, 0x52627a, 0x293548);
scene.add(grid);

const axes = new THREE.AxesHelper(2);
axes.position.y = 0.01;
scene.add(axes);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.ShadowMaterial({ opacity: 0.16 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.userData.ignoreSelection = true;
scene.add(ground);

const transform = new TransformControls(camera, renderer.domElement);
transform.setSize(0.85);
scene.add(transform.getHelper());

transform.addEventListener("dragging-changed", (event) => {
  orbit.enabled = !event.value;
});

transform.addEventListener("objectChange", updateInspector);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const objects = [];
let selected = null;
let objectCounter = 0;
let pointerStart = null;

const materials = [
  0x4f9cf9, 0x22c55e, 0xf59e0b, 0xa78bfa, 0xec4899, 0x14b8a6
];

function makeMaterial(index) {
  return new THREE.MeshStandardMaterial({
    color: materials[index % materials.length],
    roughness: 0.58,
    metalness: 0.08,
    emissive: 0x000000
  });
}

function geometryFor(type) {
  switch (type) {
    case "cylinder": return new THREE.CylinderGeometry(0.55, 0.55, 1.2, 40);
    case "cone": return new THREE.ConeGeometry(0.62, 1.3, 40);
    case "sphere": return new THREE.SphereGeometry(0.62, 36, 24);
    default: return new THREE.BoxGeometry(1, 1, 1);
  }
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function addPrimitive(type, position = null) {
  objectCounter += 1;
  const mesh = new THREE.Mesh(geometryFor(type), makeMaterial(objectCounter - 1));
  mesh.name = `${titleCase(type)} ${objectCounter}`;
  mesh.userData.type = type;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  if (position) {
    mesh.position.copy(position);
  } else {
    mesh.position.set((objects.length % 4) * 0.35, type === "sphere" ? 0.62 : 0.5, 0);
  }

  scene.add(mesh);
  objects.push(mesh);
  selectObject(mesh);
  showToast(`${mesh.name} added`);
  return mesh;
}

function selectObject(object) {
  if (selected?.material) selected.material.emissive.setHex(0x000000);
  selected = object;

  if (!selected) {
    transform.detach();
    document.querySelector("#inspector").classList.add("hidden");
    document.querySelector("#status").textContent = "Nothing selected";
    return;
  }

  selected.material.emissive.setHex(0x10233f);
  transform.attach(selected);
  document.querySelector("#inspector").classList.remove("hidden");
  updateInspector();
}

function updateInspector() {
  if (!selected) return;
  document.querySelector("#selectedName").textContent = selected.name;
  document.querySelector("#status").textContent = `${selected.name} selected`;
  document.querySelector("#xPos").textContent = selected.position.x.toFixed(2);
  document.querySelector("#yPos").textContent = selected.position.y.toFixed(2);
  document.querySelector("#zPos").textContent = selected.position.z.toFixed(2);
}

function setMode(mode) {
  transform.setMode(mode);
  document.querySelectorAll(".mode").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
  showToast(`${titleCase(mode)} tool`);
}

function duplicateSelected() {
  if (!selected) return showToast("Select an object first");
  const clone = selected.clone();
  objectCounter += 1;
  clone.name = `${titleCase(selected.userData.type || "object")} ${objectCounter}`;
  clone.material = selected.material.clone();
  clone.position.x += 0.6;
  clone.position.z += 0.4;
  scene.add(clone);
  objects.push(clone);
  selectObject(clone);
  showToast(`${clone.name} duplicated`);
}

function deleteSelected() {
  if (!selected) return showToast("Select an object first");
  const doomed = selected;
  selectObject(null);
  const index = objects.indexOf(doomed);
  if (index >= 0) objects.splice(index, 1);
  scene.remove(doomed);
  doomed.geometry?.dispose();
  doomed.material?.dispose();
  showToast(`${doomed.name} deleted`);
}

function pickObject(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  // Critical fix: raycast only against actual model objects.
  // The transform gizmo, grid and axes can never become selected.
  const hits = raycaster.intersectObjects(objects, false);
  if (hits.length) selectObject(hits[0].object);
}

renderer.domElement.addEventListener("pointerdown", (event) => {
  pointerStart = { x: event.clientX, y: event.clientY };
});

renderer.domElement.addEventListener("pointerup", (event) => {
  if (!pointerStart || transform.dragging) return;
  const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
  pointerStart = null;
  if (distance < 7) pickObject(event.clientX, event.clientY);
});

document.querySelectorAll("[data-add]").forEach((button) => {
  button.addEventListener("click", () => addPrimitive(button.dataset.add));
});

document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

document.querySelector("#duplicate").addEventListener("click", duplicateSelected);
document.querySelector("#delete").addEventListener("click", deleteSelected);
document.querySelector("#closeInspector").addEventListener("click", () => {
  document.querySelector("#inspector").classList.add("hidden");
});
document.querySelector("#resetView").addEventListener("click", () => {
  camera.position.set(5.5, 4.5, 6.5);
  orbit.target.set(0, 0.6, 0);
  orbit.update();
  showToast("View reset");
});

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1200);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

addPrimitive("cube", new THREE.Vector3(0, 0.5, 0));
setMode("translate");

function animate() {
  requestAnimationFrame(animate);
  orbit.update();
  renderer.render(scene, camera);
}
animate();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(console.warn);
  });
}
