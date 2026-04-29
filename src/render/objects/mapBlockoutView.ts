import * as THREE from "three";
import { mapBlockout, type MapVisualSpec } from "../../game/content/mapBlockout";

export function createMapBlockoutView(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = "Phase2MapBlockout";

  for (const collider of mapBlockout.staticColliders) {
    const mesh = createBoxMesh(
      collider.name,
      collider.position,
      {
        x: collider.halfExtents.x * 2,
        y: collider.halfExtents.y * 2,
        z: collider.halfExtents.z * 2,
      },
      collider.color,
    );

    mesh.castShadow = collider.name !== "RoadFloor" && collider.name !== "MillYardFloor";
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  for (const visual of mapBlockout.visualObjects) {
    group.add(createVisualObject(visual));
  }

  for (const lightMarker of mapBlockout.lights) {
    const light = new THREE.PointLight(
      lightMarker.color,
      lightMarker.intensity,
      lightMarker.distance,
      1.8,
    );
    light.name = lightMarker.name;
    light.position.set(lightMarker.position.x, lightMarker.position.y, lightMarker.position.z);
    group.add(light);
  }

  scene.add(group);

  return {
    dispose() {
      scene.remove(group);
      group.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          disposeMaterial(node.material);
        }

        if (node instanceof THREE.Sprite) {
          disposeMaterial(node.material);
        }
      });
    },
  };
}

function createVisualObject(visual: MapVisualSpec) {
  if (visual.kind === "cylinder") {
    const material = createMaterial(visual.color, visual.emissive, visual.name);
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(visual.size.x, visual.size.z, visual.size.y, 8),
      material,
    );

    mesh.name = visual.name;
    mesh.position.set(visual.position.x, visual.position.y, visual.position.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  return createBoxMesh(
    visual.name,
    visual.position,
    visual.size,
    visual.color,
    visual.emissive,
    visual.name,
  );
}

function createBoxMesh(
  name: string,
  position: THREE.Vector3Like,
  size: THREE.Vector3Like,
  color: number,
  emissive?: number,
  materialName = name,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size.x, size.y, size.z),
    createMaterial(color, emissive, materialName),
  );

  mesh.name = name;
  mesh.position.set(position.x, position.y, position.z);
  mesh.castShadow = name !== "CryptCeilingHint";
  mesh.receiveShadow = true;

  return mesh;
}

function createMaterial(color: number, emissive?: number, name?: string) {
  const isCameraCeiling = name === "CryptCeilingHint";

  return new THREE.MeshStandardMaterial({
    color,
    emissive: emissive ?? 0x000000,
    emissiveIntensity: emissive ? 0.7 : 0,
    roughness: 0.86,
    metalness: 0.03,
    transparent: isCameraCeiling,
    opacity: isCameraCeiling ? 0.16 : 1,
    depthWrite: !isCameraCeiling,
  });
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    for (const item of material) {
      item.dispose();
    }

    return;
  }

  if (material instanceof THREE.SpriteMaterial) {
    material.map?.dispose();
  }

  material.dispose();
}
