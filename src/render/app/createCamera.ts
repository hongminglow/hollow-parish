import * as THREE from "three";

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
  camera.position.set(5, 4, 7);
  return camera;
}
