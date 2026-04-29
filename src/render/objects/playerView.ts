import * as THREE from "three";
import type { PlayerState } from "../../game/simulation/player";

export function createPlayerView(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = "PlayerPlaceholder";
  let animationTime = 0;
  let shootKickRemaining = 0;
  let reloadPoseRemaining = 0;
  let damageFlashRemaining = 0;

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
  const clothMaterial = new THREE.MeshStandardMaterial({
    color: 0x2f3d36,
    roughness: 0.9,
  });
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xb8a987,
    roughness: 0.82,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.78, 0.3), bodyMaterial);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), skinMaterial);
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.58, 0.14), clothMaterial);
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.58, 0.14), clothMaterial);
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.62, 0.16), clothMaterial);
  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.62, 0.16), clothMaterial);
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
  head.castShadow = true;
  leftArm.castShadow = true;
  rightArm.castShadow = true;
  leftLeg.castShadow = true;
  rightLeg.castShadow = true;
  shoulder.castShadow = true;
  aimMarker.castShadow = true;
  visor.castShadow = true;
  pack.castShadow = true;
  body.position.set(0, 0.08, 0);
  head.position.set(0, 0.72, -0.02);
  leftArm.position.set(-0.38, 0.08, -0.04);
  rightArm.position.set(0.38, 0.08, -0.04);
  leftLeg.position.set(-0.15, -0.56, 0);
  rightLeg.position.set(0.15, -0.56, 0);
  shoulder.position.set(0, 0.34, 0.03);
  aimMarker.position.set(0.38, 0.26, -0.4);
  visor.position.set(0, 0.75, -0.22);
  pack.position.set(0, 0.2, 0.36);
  aimMarker.visible = false;

  group.add(body, head, leftArm, rightArm, leftLeg, rightLeg, shoulder, aimMarker, visor, pack);
  scene.add(group);

  return {
    group,
    playShoot() {
      shootKickRemaining = 0.14;
    },
    playReload() {
      reloadPoseRemaining = 0.72;
    },
    playDamage() {
      damageFlashRemaining = 0.18;
    },
    sync(player: PlayerState, deltaSeconds = 1 / 60) {
      animationTime += deltaSeconds;
      shootKickRemaining = Math.max(0, shootKickRemaining - deltaSeconds);
      reloadPoseRemaining = Math.max(0, reloadPoseRemaining - deltaSeconds);
      damageFlashRemaining = Math.max(0, damageFlashRemaining - deltaSeconds);
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
      bodyMaterial.color.setHex(damageFlashRemaining > 0 ? 0xbd4c32 : 0x5f7d72);
      body.rotation.x = lean;
      head.rotation.x = player.isAiming ? -0.08 : 0;
      shoulder.rotation.x = player.isAiming ? -0.16 : 0;
      aimMarker.rotation.x = player.isAiming ? -0.05 - shootKickRemaining * 2.8 : 0;
      aimMarker.scale.z = 1 + shootKickRemaining * 3.5;
      aimMarker.visible = player.isAiming;
      const stride =
        player.movementState === "run"
          ? Math.sin(animationTime * 12) * 0.48
          : player.movementState === "walk"
            ? Math.sin(animationTime * 7.5) * 0.28
            : 0;
      if (reloadPoseRemaining > 0) {
        leftArm.rotation.x = -1.18;
        rightArm.rotation.x = -1.08;
        leftArm.rotation.z = 0.38;
        rightArm.rotation.z = -0.32;
      } else {
        leftArm.rotation.x = player.isAiming ? -0.8 : -stride * 0.55;
        rightArm.rotation.x = player.isAiming ? -0.92 - shootKickRemaining * 2.1 : stride * 0.55;
        leftArm.rotation.z = 0;
        rightArm.rotation.z = 0;
      }
      leftLeg.rotation.x = stride;
      rightLeg.rotation.x = -stride;
      leftArm.position.z = player.isAiming ? -0.22 : -0.04;
      rightArm.position.z = player.isAiming ? -0.28 : -0.04;
      group.scale.setScalar(player.isSprinting ? 1.04 : player.isDead ? 0.82 : 1);
    },
    dispose() {
      scene.remove(group);
      body.geometry.dispose();
      head.geometry.dispose();
      leftArm.geometry.dispose();
      rightArm.geometry.dispose();
      leftLeg.geometry.dispose();
      rightLeg.geometry.dispose();
      shoulder.geometry.dispose();
      aimMarker.geometry.dispose();
      visor.geometry.dispose();
      pack.geometry.dispose();
      bodyMaterial.dispose();
      shoulderMaterial.dispose();
      aimMaterial.dispose();
      clothMaterial.dispose();
      skinMaterial.dispose();
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
