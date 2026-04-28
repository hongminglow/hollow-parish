import * as THREE from "three";
import type { EnemyState } from "../../game/simulation/enemies";

type EnemyVisual = {
  enemy: EnemyState;
  group: THREE.Group;
  body: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  head: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
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
    sync() {
      for (const visual of visuals) {
        syncEnemyVisual(visual);
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
    new THREE.CapsuleGeometry(enemy.bodyRadius * 0.58, 0.9 * scale, 8, 14),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
    }),
  );
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(enemy.headRadius, 12, 10),
    new THREE.MeshStandardMaterial({
      color: 0xb9b08e,
      roughness: 0.82,
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
  head.position.y = 1.1 * scale;
  healthBack.position.y = 1.7 * scale;
  healthFill.position.set(0, 1.7 * scale, 0.03);
  warning.rotation.x = Math.PI / 2;
  warning.position.y = 0.04;
  warning.visible = false;
  body.castShadow = true;
  head.castShadow = true;
  group.add(warning, body, head, healthBack, healthFill);

  return {
    enemy,
    group,
    body,
    head,
    healthFill,
    warning,
  };
}

function syncEnemyVisual(visual: EnemyVisual) {
  const { enemy, group, body, head, healthFill, warning } = visual;
  const healthRatio = enemy.maxHealth > 0 ? enemy.health / enemy.maxHealth : 0;
  const bodyColor = getBodyColor(enemy);

  group.visible = !enemy.isDead;
  group.position.set(enemy.position.x, enemy.position.y, enemy.position.z);
  group.rotation.y += enemy.state === "idle" ? 0.002 : enemy.kind === "boss" ? 0.004 : 0.007;
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
