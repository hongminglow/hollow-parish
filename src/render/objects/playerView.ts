import * as THREE from "three";
import type { PlayerState } from "../../game/simulation/player";

export function createPlayerView(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = "PlayerPlaceholder";
  let animationTime = 0;

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x5f7d72,
    roughness: 0.78,
    metalness: 0.05,
  });
  const shoulderMaterial = new THREE.MeshStandardMaterial({
    color: 0x203837,
    roughness: 0.82,
  });
  const aimMaterial = new THREE.MeshStandardMaterial({
    color: 0xd7a647,
    roughness: 0.6,
  });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.85, 8, 16), bodyMaterial);
  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.22, 0.32), shoulderMaterial);
  const aimMarker = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.72), aimMaterial);
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.08, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x0d1414, roughness: 0.65 }),
  );
  const pack = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.46, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x2d2118, roughness: 0.86 }),
  );

  body.castShadow = true;
  shoulder.castShadow = true;
  aimMarker.castShadow = true;
  visor.castShadow = true;
  pack.castShadow = true;
  shoulder.position.set(0, 0.34, 0.03);
  aimMarker.position.set(0.38, 0.26, -0.4);
  visor.position.set(0, 0.92, -0.24);
  pack.position.set(0, 0.2, 0.36);
  aimMarker.visible = false;

  group.add(body, shoulder, aimMarker, visor, pack);
  scene.add(group);

  return {
    group,
    sync(player: PlayerState, deltaSeconds = 1 / 60) {
      animationTime += deltaSeconds;
      const walkBob =
        player.movementState === "run"
          ? Math.sin(animationTime * 12) * 0.055
          : player.movementState === "walk" || player.movementState === "aim"
            ? Math.sin(animationTime * 7.5) * 0.035
            : Math.sin(animationTime * 1.4) * 0.012;
      const lean =
        player.movementState === "run"
          ? -0.1
          : player.movementState === "aim"
            ? -0.045
            : player.isDead
              ? 1.45
              : 0;

      group.position.set(player.position.x, player.position.y + walkBob, player.position.z);
      group.rotation.y = player.yaw;
      body.rotation.x = lean;
      shoulder.rotation.x = player.isAiming ? -0.16 : 0;
      aimMarker.rotation.x = player.isAiming ? -0.05 : 0;
      aimMarker.visible = player.isAiming;
      group.scale.setScalar(player.isSprinting ? 1.04 : player.isDead ? 0.82 : 1);
    },
    dispose() {
      scene.remove(group);
      body.geometry.dispose();
      shoulder.geometry.dispose();
      aimMarker.geometry.dispose();
      visor.geometry.dispose();
      pack.geometry.dispose();
      bodyMaterial.dispose();
      shoulderMaterial.dispose();
      aimMaterial.dispose();
      disposeMaterial(visor.material);
      disposeMaterial(pack.material);
    },
  };
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
