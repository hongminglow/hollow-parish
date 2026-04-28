import { mapBlockout, type MapBoxSpec, type MapMarkerSpec } from "../content/mapBlockout";
import { damagePlayer, type PlayerState, type Vec3 } from "./player";

export type EnemyKind = "infected" | "hook" | "armored" | "boss";

export type EnemyAiState =
  | "idle"
  | "alert"
  | "chase"
  | "attackWindup"
  | "attackActive"
  | "attackRecovery"
  | "staggered"
  | "dead";

export type EnemyState = {
  id: string;
  label: string;
  kind: EnemyKind;
  position: Vec3;
  spawnPosition: Vec3;
  health: number;
  maxHealth: number;
  bodyRadius: number;
  headRadius: number;
  damageResistance: number;
  contactDamage: number;
  contactRange: number;
  detectionRadius: number;
  hearingRadius: number;
  loseInterestRadius: number;
  speed: number;
  attackRange: number;
  attackWindupTime: number;
  attackActiveTime: number;
  attackRecoveryTime: number;
  attackCooldown: number;
  attackCooldownRemaining: number;
  attackHasDamaged: boolean;
  hitFlashRemaining: number;
  state: EnemyAiState;
  stateTimer: number;
  isDormant: boolean;
  isDead: boolean;
};

export type EnemyAiEvent =
  | {
      type: "alerted";
      enemy: EnemyState;
    }
  | {
      type: "attack-start";
      enemy: EnemyState;
    }
  | {
      type: "player-hit";
      enemy: EnemyState;
      damage: number;
    };

type EnemyConfig = {
  maxHealth: number;
  bodyRadius: number;
  headRadius: number;
  damageResistance: number;
  contactDamage: number;
  detectionRadius: number;
  hearingRadius: number;
  loseInterestRadius: number;
  speed: number;
  attackRange: number;
  attackWindupTime: number;
  attackActiveTime: number;
  attackRecoveryTime: number;
  attackCooldown: number;
};

const enemyConfigs: Record<EnemyKind, EnemyConfig> = {
  infected: {
    maxHealth: 75,
    bodyRadius: 0.62,
    headRadius: 0.28,
    damageResistance: 1,
    contactDamage: 12,
    detectionRadius: 10.5,
    hearingRadius: 18,
    loseInterestRadius: 18,
    speed: 1.35,
    attackRange: 1.35,
    attackWindupTime: 0.42,
    attackActiveTime: 0.2,
    attackRecoveryTime: 0.56,
    attackCooldown: 0.65,
  },
  hook: {
    maxHealth: 60,
    bodyRadius: 0.58,
    headRadius: 0.26,
    damageResistance: 1,
    contactDamage: 18,
    detectionRadius: 12.5,
    hearingRadius: 22,
    loseInterestRadius: 20,
    speed: 1.65,
    attackRange: 1.7,
    attackWindupTime: 0.34,
    attackActiveTime: 0.22,
    attackRecoveryTime: 0.62,
    attackCooldown: 0.72,
  },
  armored: {
    maxHealth: 140,
    bodyRadius: 0.68,
    headRadius: 0.3,
    damageResistance: 0.48,
    contactDamage: 16,
    detectionRadius: 6.2,
    hearingRadius: 14,
    loseInterestRadius: 16,
    speed: 1.05,
    attackRange: 1.45,
    attackWindupTime: 0.55,
    attackActiveTime: 0.24,
    attackRecoveryTime: 0.72,
    attackCooldown: 0.82,
  },
  boss: {
    maxHealth: 300,
    bodyRadius: 1.1,
    headRadius: 0.42,
    damageResistance: 0.8,
    contactDamage: 24,
    detectionRadius: 16,
    hearingRadius: 26,
    loseInterestRadius: 26,
    speed: 1.1,
    attackRange: 2,
    attackWindupTime: 0.74,
    attackActiveTime: 0.3,
    attackRecoveryTime: 1,
    attackCooldown: 1,
  },
};

export function createEnemies(): EnemyState[] {
  return mapBlockout.markers
    .filter((marker) => marker.kind === "enemy" || marker.kind === "boss")
    .flatMap(createEnemiesFromMarker);
}

export function updateEnemies(
  enemies: EnemyState[],
  player: PlayerState,
  staticColliders: MapBoxSpec[],
  deltaSeconds: number,
): EnemyAiEvent[] {
  const events: EnemyAiEvent[] = [];

  for (const enemy of enemies) {
    enemy.attackCooldownRemaining = Math.max(0, enemy.attackCooldownRemaining - deltaSeconds);
    enemy.hitFlashRemaining = Math.max(0, enemy.hitFlashRemaining - deltaSeconds);

    if (enemy.isDead) {
      enemy.state = "dead";
      continue;
    }

    updateEnemyState(enemy, enemies, player, staticColliders, deltaSeconds, events);
  }

  separateEnemies(enemies, staticColliders, deltaSeconds);
  return events;
}

export function alertEnemiesToNoise(enemies: EnemyState[], origin: Vec3, radius: number) {
  for (const enemy of enemies) {
    if (enemy.isDead || enemy.state === "dead") {
      continue;
    }

    const distance = distance2d(enemy.position, origin);

    if (distance <= Math.min(radius, enemy.hearingRadius)) {
      enterState(enemy, "alert", 0.25);
    }
  }
}

export function damageEnemy(enemy: EnemyState, damage: number) {
  if (enemy.isDead) {
    return;
  }

  enemy.health = Math.max(0, enemy.health - damage);
  enemy.hitFlashRemaining = 0.12;

  if (enemy.health === 0) {
    enemy.isDead = true;
    enterState(enemy, "dead", 0);
    return;
  }

  if (enemy.kind !== "boss" && damage >= 20) {
    enterState(enemy, "staggered", enemy.kind === "armored" ? 0.22 : 0.34);
  } else if (enemy.state === "idle") {
    enterState(enemy, "alert", 0.18);
  }
}

export function resetEnemies(enemies: EnemyState[]) {
  for (const enemy of enemies) {
    enemy.position = { ...enemy.spawnPosition };
    enemy.health = enemy.maxHealth;
    enemy.isDead = false;
    enemy.hitFlashRemaining = 0;
    enemy.attackCooldownRemaining = 0;
    enemy.attackHasDamaged = false;
    enterState(enemy, "idle", 0);
  }
}

export function getDeadEnemyIds(enemies: EnemyState[]) {
  return enemies.filter((enemy) => enemy.isDead).map((enemy) => enemy.id);
}

export function restoreEnemiesFromCheckpoint(enemies: EnemyState[], deadEnemyIds: string[]) {
  const deadIds = new Set(deadEnemyIds);

  for (const enemy of enemies) {
    enemy.position = { ...enemy.spawnPosition };
    enemy.health = deadIds.has(enemy.id) ? 0 : enemy.maxHealth;
    enemy.isDead = deadIds.has(enemy.id);
    enemy.hitFlashRemaining = 0;
    enemy.attackCooldownRemaining = 0;
    enemy.attackHasDamaged = false;
    enterState(enemy, enemy.isDead ? "dead" : "idle", 0);
  }
}

function updateEnemyState(
  enemy: EnemyState,
  enemies: EnemyState[],
  player: PlayerState,
  staticColliders: MapBoxSpec[],
  deltaSeconds: number,
  events: EnemyAiEvent[],
) {
  switch (enemy.state) {
    case "idle":
      if (canDetectPlayer(enemy, player, staticColliders)) {
        enterState(enemy, "alert", enemy.isDormant ? 0.42 : 0.24);
        propagateAlert(enemy, enemies);
        events.push({ type: "alerted", enemy });
      }
      break;
    case "alert":
      enemy.stateTimer -= deltaSeconds;

      if (enemy.stateTimer <= 0) {
        enterState(enemy, "chase", 0);
      }
      break;
    case "chase":
      updateChase(enemy, player, staticColliders, deltaSeconds, events);
      break;
    case "attackWindup":
      enemy.stateTimer -= deltaSeconds;

      if (enemy.stateTimer <= 0) {
        enterState(enemy, "attackActive", enemy.attackActiveTime);
      }
      break;
    case "attackActive":
      updateAttackActive(enemy, player, deltaSeconds, events);
      break;
    case "attackRecovery":
      enemy.stateTimer -= deltaSeconds;

      if (enemy.stateTimer <= 0) {
        enterState(
          enemy,
          distance2d(enemy.position, player.position) <= enemy.loseInterestRadius
            ? "chase"
            : "idle",
          0,
        );
      }
      break;
    case "staggered":
      enemy.stateTimer -= deltaSeconds;

      if (enemy.stateTimer <= 0) {
        enterState(
          enemy,
          distance2d(enemy.position, player.position) <= enemy.loseInterestRadius
            ? "chase"
            : "idle",
          0,
        );
      }
      break;
    case "dead":
      break;
  }
}

function updateChase(
  enemy: EnemyState,
  player: PlayerState,
  staticColliders: MapBoxSpec[],
  deltaSeconds: number,
  events: EnemyAiEvent[],
) {
  const distanceToPlayer = distance2d(enemy.position, player.position);

  if (distanceToPlayer > enemy.loseInterestRadius || player.isDead) {
    enterState(enemy, "idle", 0);
    return;
  }

  if (distanceToPlayer <= enemy.attackRange && enemy.attackCooldownRemaining === 0) {
    enterState(enemy, "attackWindup", enemy.attackWindupTime);
    events.push({ type: "attack-start", enemy });
    return;
  }

  const direction = normalizedDirection2d(enemy.position, player.position);
  moveEnemyWithCollision(
    enemy,
    direction.x * enemy.speed * deltaSeconds,
    direction.z * enemy.speed * deltaSeconds,
    staticColliders,
  );
}

function updateAttackActive(
  enemy: EnemyState,
  player: PlayerState,
  deltaSeconds: number,
  events: EnemyAiEvent[],
) {
  enemy.stateTimer -= deltaSeconds;

  if (!enemy.attackHasDamaged && distance2d(enemy.position, player.position) <= enemy.attackRange) {
    enemy.attackHasDamaged = true;

    if (damagePlayer(player, enemy.contactDamage)) {
      events.push({ type: "player-hit", enemy, damage: enemy.contactDamage });
    }
  }

  if (enemy.stateTimer <= 0) {
    enemy.attackCooldownRemaining = enemy.attackCooldown;
    enterState(enemy, "attackRecovery", enemy.attackRecoveryTime);
  }
}

function propagateAlert(source: EnemyState, enemies: EnemyState[]) {
  for (const enemy of enemies) {
    if (
      enemy.id === source.id ||
      enemy.isDead ||
      enemy.state !== "idle" ||
      distance2d(enemy.position, source.position) > 6.5
    ) {
      continue;
    }

    enterState(enemy, "alert", 0.35);
  }
}

function separateEnemies(
  enemies: EnemyState[],
  staticColliders: MapBoxSpec[],
  deltaSeconds: number,
) {
  const pushStrength = Math.min(0.03, deltaSeconds * 0.8);

  for (let firstIndex = 0; firstIndex < enemies.length; firstIndex += 1) {
    const first = enemies[firstIndex];

    if (first.isDead) {
      continue;
    }

    for (let secondIndex = firstIndex + 1; secondIndex < enemies.length; secondIndex += 1) {
      const second = enemies[secondIndex];

      if (second.isDead) {
        continue;
      }

      const dx = second.position.x - first.position.x;
      const dz = second.position.z - first.position.z;
      const distance = Math.max(0.001, Math.hypot(dx, dz));
      const minimumDistance = first.bodyRadius + second.bodyRadius + 0.22;

      if (distance >= minimumDistance) {
        continue;
      }

      const pushX = (dx / distance) * pushStrength;
      const pushZ = (dz / distance) * pushStrength;
      moveEnemyWithCollision(first, -pushX, -pushZ, staticColliders);
      moveEnemyWithCollision(second, pushX, pushZ, staticColliders);
    }
  }
}

function canDetectPlayer(enemy: EnemyState, player: PlayerState, staticColliders: MapBoxSpec[]) {
  if (player.isDead) {
    return false;
  }

  const distance = distance2d(enemy.position, player.position);
  const radius = enemy.isDormant ? Math.min(enemy.detectionRadius, 4.4) : enemy.detectionRadius;

  return distance <= radius && hasLineOfSight(enemy.position, player.position, staticColliders);
}

function hasLineOfSight(from: Vec3, to: Vec3, staticColliders: MapBoxSpec[]) {
  for (const collider of staticColliders) {
    if (!blocksSight(collider) || !segmentIntersectsBox2d(from, to, collider, 0.08)) {
      continue;
    }

    return false;
  }

  return true;
}

function moveEnemyWithCollision(
  enemy: EnemyState,
  moveX: number,
  moveZ: number,
  blockers: MapBoxSpec[],
) {
  const nextX = enemy.position.x + moveX;
  const nextZ = enemy.position.z + moveZ;

  if (!collidesWithBlockers(nextX, nextZ, enemy.bodyRadius, blockers)) {
    enemy.position.x = clampToMapX(nextX);
    enemy.position.z = clampToMapZ(nextZ);
    return;
  }

  if (!collidesWithBlockers(nextX, enemy.position.z, enemy.bodyRadius, blockers)) {
    enemy.position.x = clampToMapX(nextX);
  }

  if (!collidesWithBlockers(enemy.position.x, nextZ, enemy.bodyRadius, blockers)) {
    enemy.position.z = clampToMapZ(nextZ);
  }
}

function collidesWithBlockers(x: number, z: number, radius: number, blockers: MapBoxSpec[]) {
  for (const blocker of blockers) {
    if (blocker.halfExtents.y < 0.4) {
      continue;
    }

    if (
      x >= blocker.position.x - blocker.halfExtents.x - radius &&
      x <= blocker.position.x + blocker.halfExtents.x + radius &&
      z >= blocker.position.z - blocker.halfExtents.z - radius &&
      z <= blocker.position.z + blocker.halfExtents.z + radius
    ) {
      return true;
    }
  }

  return false;
}

function segmentIntersectsBox2d(from: Vec3, to: Vec3, box: MapBoxSpec, padding: number) {
  const minX = box.position.x - box.halfExtents.x - padding;
  const maxX = box.position.x + box.halfExtents.x + padding;
  const minZ = box.position.z - box.halfExtents.z - padding;
  const maxZ = box.position.z + box.halfExtents.z + padding;
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  let tMin = 0;
  let tMax = 1;

  if (Math.abs(dx) < 0.0001) {
    if (from.x < minX || from.x > maxX) {
      return false;
    }
  } else {
    const tx1 = (minX - from.x) / dx;
    const tx2 = (maxX - from.x) / dx;
    tMin = Math.max(tMin, Math.min(tx1, tx2));
    tMax = Math.min(tMax, Math.max(tx1, tx2));
  }

  if (Math.abs(dz) < 0.0001) {
    if (from.z < minZ || from.z > maxZ) {
      return false;
    }
  } else {
    const tz1 = (minZ - from.z) / dz;
    const tz2 = (maxZ - from.z) / dz;
    tMin = Math.max(tMin, Math.min(tz1, tz2));
    tMax = Math.min(tMax, Math.max(tz1, tz2));
  }

  return tMax >= tMin;
}

function blocksSight(collider: MapBoxSpec) {
  return collider.halfExtents.y >= 0.75 && collider.position.y + collider.halfExtents.y >= 1;
}

function enterState(enemy: EnemyState, state: EnemyAiState, timer: number) {
  enemy.state = state;
  enemy.stateTimer = timer;

  if (state === "attackWindup" || state === "attackActive" || state === "attackRecovery") {
    enemy.attackHasDamaged = false;
  }
}

function createEnemiesFromMarker(marker: MapMarkerSpec): EnemyState[] {
  if (marker.label !== "Group") {
    return [createEnemyFromMarker(marker)];
  }

  return [
    createEnemyFromMarker(marker, "A", { x: 0, z: 0 }),
    createEnemyFromMarker(marker, "B", { x: 1.35, z: -1.1 }),
    createEnemyFromMarker(marker, "C", { x: -1.45, z: -0.8 }),
  ];
}

function createEnemyFromMarker(
  marker: MapMarkerSpec,
  idSuffix = "",
  offset: { x: number; z: number } = { x: 0, z: 0 },
): EnemyState {
  const kind = getEnemyKind(marker);
  const config = enemyConfigs[kind];
  const position = {
    x: marker.position.x + offset.x,
    y: 0.95,
    z: marker.position.z + offset.z,
  };

  return {
    id: `${marker.name}${idSuffix}`,
    label: idSuffix ? `${marker.label} ${idSuffix}` : marker.label,
    kind,
    position: { ...position },
    spawnPosition: { ...position },
    health: config.maxHealth,
    maxHealth: config.maxHealth,
    bodyRadius: config.bodyRadius,
    headRadius: config.headRadius,
    damageResistance: config.damageResistance,
    contactDamage: config.contactDamage,
    contactRange: config.attackRange,
    detectionRadius: config.detectionRadius,
    hearingRadius: config.hearingRadius,
    loseInterestRadius: config.loseInterestRadius,
    speed: config.speed,
    attackRange: config.attackRange,
    attackWindupTime: config.attackWindupTime,
    attackActiveTime: config.attackActiveTime,
    attackRecoveryTime: config.attackRecoveryTime,
    attackCooldown: config.attackCooldown,
    attackCooldownRemaining: 0,
    attackHasDamaged: false,
    hitFlashRemaining: 0,
    state: "idle",
    stateTimer: 0,
    isDormant: marker.label === "Dormant",
    isDead: false,
  };
}

function getEnemyKind(marker: MapMarkerSpec): EnemyKind {
  if (marker.kind === "boss") {
    return "boss";
  }

  if (marker.label === "Hook" || marker.label === "Minion") {
    return "hook";
  }

  if (marker.label === "Dormant") {
    return "armored";
  }

  return "infected";
}

function normalizedDirection2d(from: Vec3, to: Vec3) {
  const x = to.x - from.x;
  const z = to.z - from.z;
  const length = Math.max(0.001, Math.hypot(x, z));

  return {
    x: x / length,
    z: z / length,
  };
}

function distance2d(a: Vec3, b: Vec3) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function clampToMapX(x: number) {
  return Math.max(
    mapBlockout.mapBounds.center.x - mapBlockout.mapBounds.halfExtents.x,
    Math.min(mapBlockout.mapBounds.center.x + mapBlockout.mapBounds.halfExtents.x, x),
  );
}

function clampToMapZ(z: number) {
  return Math.max(
    mapBlockout.mapBounds.center.z - mapBlockout.mapBounds.halfExtents.z,
    Math.min(mapBlockout.mapBounds.center.z + mapBlockout.mapBounds.halfExtents.z, z),
  );
}
