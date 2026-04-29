import * as THREE from "three";
import type { EnemyState } from "../../game/simulation/enemies";

type EnemyVisual = {
  enemy: EnemyState;
  group: THREE.Group;
  body: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  head: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  leftArm: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  rightArm: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  leftLeg: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  rightLeg: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  weapon: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  healthBack: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  healthFill: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  warning: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
};

const enemyColors: Record<EnemyState["kind"], number> = {
  infected: 0x6f7b52,
  hook: 0x8a6a42,
  armored: 0x5f6872,
  boss: 0x7b433f,
};

export function createEnemyView(scene: THREE.Scene, enemies: EnemyState[]) {
  const group = new THREE.Group();
  group.name = "EnemyCombatPlaceholders";
  const visuals = enemies.map(createEnemyVisual);

  for (const visual of visuals) {
    group.add(visual.group);
  }

  scene.add(group);

  return {
    sync(elapsed: number) {
      for (const visual of visuals) {
        syncEnemyVisual(visual, elapsed);
      }
    },
    dispose() {
      scene.remove(group);
      group.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          disposeMaterial(node.material);
        }
      });
    },
  };
}

function createEnemyVisual(enemy: EnemyState): EnemyVisual {
  const group = new THREE.Group();
  const color = enemyColors[enemy.kind];
  const scale = enemy.kind === "boss" ? 1.65 : 1;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(enemy.bodyRadius * 0.92, 0.9 * scale, enemy.bodyRadius * 0.56),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
    }),
  );
  const limbMaterial = new THREE.MeshStandardMaterial({
    color: enemy.kind === "boss" ? 0x4a2b2c : 0x3f4937,
    roughness: 0.93,
  });
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(enemy.headRadius, 12, 10),
    new THREE.MeshStandardMaterial({
      color: 0xb9b08e,
      roughness: 0.82,
    }),
  );
  const leftArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * scale, 0.64 * scale, 0.14 * scale),
    limbMaterial,
  );
  const rightArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * scale, 0.64 * scale, 0.14 * scale),
    limbMaterial,
  );
  const leftLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.16 * scale, 0.62 * scale, 0.16 * scale),
    limbMaterial,
  );
  const rightLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.16 * scale, 0.62 * scale, 0.16 * scale),
    limbMaterial,
  );
  const weapon = new THREE.Mesh(
    new THREE.BoxGeometry(enemy.kind === "hook" ? 0.1 : 0.08, 0.52 * scale, 0.08),
    new THREE.MeshStandardMaterial({
      color: enemy.kind === "hook" ? 0x9f7a43 : 0x2f2520,
      roughness: 0.8,
      metalness: enemy.kind === "hook" ? 0.18 : 0.04,
    }),
  );
  const healthBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.9 * scale, 0.08, 0.05),
    new THREE.MeshBasicMaterial({ color: 0x1b1010 }),
  );
  const healthFill = new THREE.Mesh(
    new THREE.BoxGeometry(0.86 * scale, 0.05, 0.055),
    new THREE.MeshBasicMaterial({ color: 0xb54f3c }),
  );
  const warning = new THREE.Mesh(
    new THREE.TorusGeometry(enemy.attackRange, 0.035, 6, 32),
    new THREE.MeshBasicMaterial({
      color: 0xd75a3a,
      transparent: true,
      opacity: 0.78,
    }),
  );

  group.name = enemy.id;
  group.position.set(enemy.position.x, enemy.position.y, enemy.position.z);
  body.position.y = 0.35 * scale;
  body.rotation.x = 0.12;
  head.position.y = 1.1 * scale;
  head.position.z = -0.1 * scale;
  leftArm.position.set(-0.42 * scale, 0.48 * scale, -0.08);
  rightArm.position.set(0.42 * scale, 0.48 * scale, -0.08);
  leftLeg.position.set(-0.18 * scale, -0.08 * scale, 0.02);
  rightLeg.position.set(0.18 * scale, -0.08 * scale, 0.02);
  weapon.position.set(0.48 * scale, 0.58 * scale, -0.14);
  weapon.rotation.z = -0.35;
  healthBack.position.y = 1.7 * scale;
  healthFill.position.set(0, 1.7 * scale, 0.03);
  warning.rotation.x = Math.PI / 2;
  warning.position.y = 0.04;
  warning.visible = false;
  body.castShadow = true;
  head.castShadow = true;
  leftArm.castShadow = true;
  rightArm.castShadow = true;
  leftLeg.castShadow = true;
  rightLeg.castShadow = true;
  weapon.castShadow = true;
  group.add(
    warning,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    weapon,
    healthBack,
    healthFill,
  );

  return {
    enemy,
    group,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    weapon,
    healthBack,
    healthFill,
    warning,
  };
}

function syncEnemyVisual(visual: EnemyVisual, elapsed: number) {
  const {
    enemy,
    group,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    weapon,
    healthBack,
    healthFill,
    warning,
  } = visual;
  const healthRatio = enemy.maxHealth > 0 ? enemy.health / enemy.maxHealth : 0;
  const bodyColor = getBodyColor(enemy);
  const movementBob =
    enemy.state === "chase"
      ? Math.sin(elapsed * (enemy.kind === "hook" ? 9 : 6.6) + enemy.position.x) * 0.045
      : enemy.state === "idle"
        ? Math.sin(elapsed * 1.1 + enemy.position.z) * 0.015
        : 0;

  group.visible = true;
  group.position.set(enemy.position.x, enemy.position.y + movementBob, enemy.position.z);
  group.rotation.z = enemy.isDead ? -Math.PI / 2 : 0;
  group.rotation.y += enemy.isDead
    ? 0
    : enemy.state === "idle"
      ? 0.002
      : enemy.kind === "boss"
        ? 0.004
        : 0.007;
  healthBack.visible = !enemy.isDead;
  healthFill.visible = !enemy.isDead;
  warning.visible = false;

  if (enemy.isDead) {
    body.rotation.x = 0.34;
    head.rotation.x = -0.18;
    leftArm.rotation.x = -0.7;
    rightArm.rotation.x = 0.5;
    leftLeg.rotation.x = 0.32;
    rightLeg.rotation.x = -0.28;
    weapon.visible = false;
    body.material.color.setHex(0x352d29);
    head.material.color.setHex(0x4a4036);
    return;
  }

  body.rotation.x =
    enemy.state === "attackWindup"
      ? -0.18
      : enemy.state === "attackActive"
        ? 0.22
        : enemy.state === "staggered"
          ? 0.28
          : 0;
  const stride =
    enemy.state === "chase" ? Math.sin(elapsed * (enemy.kind === "hook" ? 9 : 6.6)) * 0.44 : 0;
  leftLeg.rotation.x = stride;
  rightLeg.rotation.x = -stride;
  leftArm.rotation.x = enemy.state === "attackActive" ? -1.1 : -stride * 0.45 - 0.18;
  rightArm.rotation.x = enemy.state === "attackActive" ? -0.95 : stride * 0.45 - 0.18;
  weapon.rotation.x = enemy.state === "attackActive" ? -0.9 : -0.25;
  weapon.visible = enemy.kind !== "infected" || enemy.state !== "idle";
  body.material.color.setHex(bodyColor);
  head.material.color.setHex(enemy.hitFlashRemaining > 0 ? 0xffffff : 0xb9b08e);
  healthFill.scale.x = Math.max(0.001, healthRatio);
  healthFill.position.x = -0.43 * (1 - healthRatio);
  warning.visible = enemy.state === "attackWindup" || enemy.state === "attackActive";
  warning.material.opacity = enemy.state === "attackWindup" ? 0.78 : 0.42;
}

function getBodyColor(enemy: EnemyState) {
  if (enemy.hitFlashRemaining > 0) {
    return 0xded4b4;
  }

  if (enemy.state === "attackWindup" || enemy.state === "attackActive") {
    return 0xb54f3c;
  }

  if (enemy.state === "staggered") {
    return 0xd7a647;
  }

  if (enemy.state === "alert" || enemy.state === "chase") {
    return 0x9a7d48;
  }

  return enemyColors[enemy.kind];
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
