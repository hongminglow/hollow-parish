import * as THREE from "three";

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070b0c);
  scene.fog = new THREE.FogExp2(0x0c1112, 0.034);

  const moonLight = new THREE.DirectionalLight(0xaec7d6, 2.4);
  moonLight.position.set(-5, 9, 4);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(1024, 1024);
  scene.add(moonLight);

  const lanternLight = new THREE.PointLight(0xd79a45, 16, 18, 1.8);
  lanternLight.position.set(3.5, 3, -2.5);
  scene.add(lanternLight);

  const fillLight = new THREE.HemisphereLight(0x6f8991, 0x1d120b, 0.82);
  scene.add(fillLight);

  return scene;
}
