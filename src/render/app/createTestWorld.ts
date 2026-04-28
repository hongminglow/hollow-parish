import * as THREE from "three";
import { phaseOneStaticColliders } from "../../game/content/phaseOneTestMap";

export function createTestWorld(scene: THREE.Scene) {
  const staticMeshes = phaseOneStaticColliders.map(createStaticColliderMesh);
  const shrine = createShrinePlaceholder();
  const lantern = createLanternPlaceholder();

  scene.add(...staticMeshes, shrine, lantern);

  return {
    dispose() {
      for (const mesh of staticMeshes) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        disposeMaterial(mesh.material);
      }
    },
  };
}

function createStaticColliderMesh(collider: (typeof phaseOneStaticColliders)[number]) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(
      collider.halfExtents.x * 2,
      collider.halfExtents.y * 2,
      collider.halfExtents.z * 2,
    ),
    new THREE.MeshStandardMaterial({
      color: collider.color,
      roughness: 0.9,
    }),
  );

  mesh.name = collider.name;
  mesh.position.set(collider.position.x, collider.position.y, collider.position.z);
  mesh.castShadow = collider.name !== "TrainingFloor";
  mesh.receiveShadow = true;

  return mesh;
}

function createShrinePlaceholder() {
  const shrine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.9, 1.4, 6),
    new THREE.MeshStandardMaterial({
      color: 0x4f514a,
      roughness: 0.88,
    }),
  );
  shrine.name = "RoadShrinePlaceholder";
  shrine.position.set(-3.1, 0.7, -2.6);
  shrine.castShadow = true;
  shrine.receiveShadow = true;
  return shrine;
}

function createLanternPlaceholder() {
  const lantern = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.56, 0.38),
    new THREE.MeshStandardMaterial({
      color: 0xd7a647,
      emissive: 0x8f5417,
      emissiveIntensity: 1.2,
      roughness: 0.55,
    }),
  );
  lantern.name = "LanternPlaceholder";
  lantern.position.set(3.5, 1.1, -2.5);
  lantern.castShadow = true;
  return lantern;
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    for (const item of material) {
      item.dispose();
    }

    return;
  }

  material.dispose();
}
