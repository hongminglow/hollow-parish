import * as THREE from "three";

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06090a);
  scene.fog = new THREE.FogExp2(0x101718, 0.023);

  const moonLight = new THREE.DirectionalLight(0xb8d4df, 2.8);
  moonLight.position.set(-6, 10, 4);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(2048, 2048);
  moonLight.shadow.camera.left = -32;
  moonLight.shadow.camera.right = 32;
  moonLight.shadow.camera.top = 24;
  moonLight.shadow.camera.bottom = -80;
  scene.add(moonLight);

  const lanternLight = new THREE.PointLight(0xd79a45, 16, 18, 1.8);
  lanternLight.position.set(3.5, 3, -2.5);
  scene.add(lanternLight);

  const fillLight = new THREE.HemisphereLight(0x6f8991, 0x1d120b, 0.66);
  scene.add(fillLight);

  return scene;
}
