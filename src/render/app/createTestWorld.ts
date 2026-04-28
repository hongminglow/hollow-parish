import * as THREE from "three";

export function createTestWorld(scene: THREE.Scene) {
  const playerPosition = new THREE.Vector3(0, 0.9, 0);
  const player = createPlayerPlaceholder();
  const floor = createFloor();
  const gate = createGatePlaceholder();
  const shrine = createShrinePlaceholder();
  const lantern = createLanternPlaceholder();

  player.position.copy(playerPosition);
  scene.add(floor, gate, shrine, lantern, player);

  let rotation = 0;

  return {
    update(deltaSeconds: number, isPaused: boolean) {
      if (isPaused) {
        return;
      }

      rotation += deltaSeconds * 0.7;
      player.rotation.y = rotation;
    },
    getPlayerPosition() {
      return playerPosition;
    },
  };
}

function createPlayerPlaceholder() {
  const group = new THREE.Group();
  group.name = "PlayerPlaceholder";

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.35, 0.85, 8, 16),
    new THREE.MeshStandardMaterial({
      color: 0x5f7d72,
      roughness: 0.78,
      metalness: 0.05,
    }),
  );
  body.castShadow = true;

  const shoulder = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.22, 0.32),
    new THREE.MeshStandardMaterial({
      color: 0x203837,
      roughness: 0.82,
    }),
  );
  shoulder.position.set(0, 0.34, 0.03);
  shoulder.castShadow = true;

  group.add(body, shoulder);
  return group;
}

function createFloor() {
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.24, 20),
    new THREE.MeshStandardMaterial({
      color: 0x27302a,
      roughness: 0.92,
    }),
  );
  floor.name = "Phase0TestFloor";
  floor.position.y = -0.12;
  floor.receiveShadow = true;
  return floor;
}

function createGatePlaceholder() {
  const group = new THREE.Group();
  group.name = "VillageGatePlaceholder";
  group.position.set(0, 1.25, -5.4);

  const material = new THREE.MeshStandardMaterial({
    color: 0x3a2517,
    roughness: 0.86,
  });

  const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.5, 0.3), material);
  const rightPost = leftPost.clone();
  const beam = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.26, 0.34), material);

  leftPost.position.x = -2.2;
  rightPost.position.x = 2.2;
  beam.position.y = 1.08;

  leftPost.castShadow = true;
  rightPost.castShadow = true;
  beam.castShadow = true;
  group.add(leftPost, rightPost, beam);

  return group;
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
