import * as THREE from "three";
import { mapBlockout, type MapVisualSpec } from "../../game/content/mapBlockout";
import type { ProgressionFlags } from "../../game/simulation/progression";

export function createMapBlockoutView(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = "Phase2MapBlockout";
  const routeGates = createRouteGates();

  for (const collider of mapBlockout.staticColliders) {
    if (collider.name.includes("Collision")) {
      continue;
    }

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

  group.add(routeGates.group);
  scene.add(group);

  return {
    sync(flags: ProgressionFlags) {
      routeGates.villageGate.visible = !flags.villageGateUnlocked;
      routeGates.millGate.visible = !flags.millCrankTurned;
      routeGates.bellGate.visible = !flags.chapelEmblemPlaced;
    },
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

function createRouteGates() {
  const group = new THREE.Group();
  const gateMaterial = new THREE.MeshStandardMaterial({
    color: 0x281a12,
    roughness: 0.88,
    metalness: 0.04,
  });
  const ironMaterial = new THREE.MeshStandardMaterial({
    color: 0x191817,
    roughness: 0.72,
    metalness: 0.22,
  });
  const villageGate = createGateMesh("VillageRouteGate", 4.2, 2.35, gateMaterial, ironMaterial);
  const millGate = createGateMesh("MillMechanismGate", 2.45, 2.05, gateMaterial, ironMaterial);
  const bellGate = createGateMesh("BellTowerRouteGate", 3.4, 2.45, gateMaterial, ironMaterial);

  villageGate.position.set(0, 1.12, -1.2);
  millGate.position.set(0, 1.02, -28.18);
  bellGate.position.set(0, 1.18, -53.7);
  group.add(villageGate, millGate, bellGate);

  return {
    group,
    villageGate,
    millGate,
    bellGate,
  };
}

function createGateMesh(
  name: string,
  width: number,
  height: number,
  gateMaterial: THREE.MeshStandardMaterial,
  ironMaterial: THREE.MeshStandardMaterial,
) {
  const gate = new THREE.Group();
  const left = new THREE.Mesh(new THREE.BoxGeometry(width * 0.44, height, 0.16), gateMaterial);
  const right = new THREE.Mesh(new THREE.BoxGeometry(width * 0.44, height, 0.16), gateMaterial);
  const braceA = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 0.2), ironMaterial);
  const braceB = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 0.2), ironMaterial);

  gate.name = name;
  left.position.x = -width * 0.23;
  right.position.x = width * 0.23;
  braceA.position.y = height * 0.22;
  braceB.position.y = -height * 0.22;
  left.castShadow = true;
  right.castShadow = true;
  braceA.castShadow = true;
  braceB.castShadow = true;
  gate.add(left, right, braceA, braceB);
  return gate;
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
