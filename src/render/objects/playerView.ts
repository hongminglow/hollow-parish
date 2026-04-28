import * as THREE from "three";
import type { PlayerState } from "../../game/simulation/player";

export function createPlayerView(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = "PlayerPlaceholder";

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

  body.castShadow = true;
  shoulder.castShadow = true;
  aimMarker.castShadow = true;
  shoulder.position.set(0, 0.34, 0.03);
  aimMarker.position.set(0.38, 0.26, -0.4);
  aimMarker.visible = false;

  group.add(body, shoulder, aimMarker);
  scene.add(group);

  return {
    group,
    sync(player: PlayerState) {
      group.position.set(player.position.x, player.position.y, player.position.z);
      group.rotation.y = player.yaw;
      aimMarker.visible = player.isAiming;
      group.scale.setScalar(player.isSprinting ? 1.04 : 1);
    },
    dispose() {
      scene.remove(group);
      body.geometry.dispose();
      shoulder.geometry.dispose();
      aimMarker.geometry.dispose();
      bodyMaterial.dispose();
      shoulderMaterial.dispose();
      aimMaterial.dispose();
    },
  };
}
