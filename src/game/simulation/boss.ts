import { mapBlockout, type MapBoxSpec } from "../content/mapBlockout";
import { damagePlayer, type PlayerState, type Vec3 } from "./player";
import type { EnemyState } from "./enemies";

export type BossPhase = 1 | 2;

export type BossEncounterState = {
  isActive: boolean;
  isDefeated: boolean;
  arenaLocked: boolean;
  phase: BossPhase;
  chargeCooldown: number;
  slamCooldown: number;
  minionCooldown: number;
  attack: BossAttackState | null;
};

export type BossAttackState =
  | {
      type: "chargeWindup";
      remaining: number;
      total: number;
    }
  | {
      type: "charge";
      remaining: number;
      total: number;
      direction: { x: number; z: number };
      hasDamaged: boolean;
    }
  | {
      type: "chargeRecovery";
      remaining: number;
      total: number;
    }
  | {
      type: "slamWindup";
      remaining: number;
      total: number;
      radius: number;
    }
  | {
      type: "slamActive";
      remaining: number;
      total: number;
      radius: number;
      hasDamaged: boolean;
    }
  | {
      type: "slamRecovery";
      remaining: number;
      total: number;
    };

export type BossEvent =
  | { type: "started"; boss: EnemyState }
  | { type: "phase-two"; boss: EnemyState }
  | { type: "charge-windup"; boss: EnemyState }
  | { type: "charge-impact"; boss: EnemyState; hitPlayer: boolean }
  | { type: "slam-windup"; boss: EnemyState; radius: number }
  | { type: "slam-impact"; boss: EnemyState; radius: number; hitPlayer: boolean }
  | { type: "minions-summoned"; count: number }
  | { type: "defeated"; boss: EnemyState };

export type BossHudState = {
  isVisible: boolean;
  label: string;
  phase: string;
  health: number;
  maxHealth: number;
};

const arenaBounds = mapBlockout.zones.find((zone) => zone.id === "bellTower")?.bounds;
const bossCenter = { x: 0, y: 0.95, z: -63.2 };

export function createBossEncounterState(): BossEncounterState {
  return {
    isActive: false,
    isDefeated: false,
    arenaLocked: false,
    phase: 1,
    chargeCooldown: 2.2,
    slamCooldown: 5.2,
    minionCooldown: 1.5,
    attack: null,
  };
}

export function updateBossEncounter(
  encounter: BossEncounterState,
  enemies: EnemyState[],
  player: PlayerState,
  staticColliders: MapBoxSpec[],
  deltaSeconds: number,
  canStart: boolean,
): BossEvent[] {
  const boss = getBossEnemy(enemies);
  const events: BossEvent[] = [];

  if (!boss || encounter.isDefeated) {
    return events;
  }

  if (!encounter.isActive && canStart && isPlayerInArena(player.position)) {
    startBossEncounter(encounter, boss, enemies);
    events.push({ type: "started", boss });
  }

  if (!encounter.isActive) {
    return events;
  }

  if (boss.isDead) {
    encounter.isActive = false;
    encounter.isDefeated = true;
    encounter.arenaLocked = false;
    encounter.attack = null;
    events.push({ type: "defeated", boss });
    return events;
  }

  tuneBossForPhase(encounter, boss);

  if (encounter.phase === 1 && boss.health <= boss.maxHealth * 0.5) {
    encounter.phase = 2;
    encounter.attack = null;
    encounter.chargeCooldown = 1.2;
    encounter.slamCooldown = 1;
    encounter.minionCooldown = 0.4;
    boss.hitFlashRemaining = 0.45;
    events.push({ type: "phase-two", boss });
  }

  encounter.chargeCooldown = Math.max(0, encounter.chargeCooldown - deltaSeconds);
  encounter.slamCooldown = Math.max(0, encounter.slamCooldown - deltaSeconds);
  encounter.minionCooldown = Math.max(0, encounter.minionCooldown - deltaSeconds);

  if (encounter.phase === 2 && encounter.minionCooldown === 0) {
    const count = activateArenaMinions(enemies);
    encounter.minionCooldown = 12;

    if (count > 0) {
      events.push({ type: "minions-summoned", count });
    }
  }

  if (encounter.attack) {
    updateBossAttack(encounter, boss, player, staticColliders, deltaSeconds, events);
    return events;
  }

  const distanceToPlayer = distance2d(boss.position, player.position);

  if (encounter.phase === 2 && encounter.slamCooldown === 0 && distanceToPlayer <= 6.4) {
    encounter.attack = {
      type: "slamWindup",
      remaining: 0.95,
      total: 0.95,
      radius: 4.1,
    };
    events.push({ type: "slam-windup", boss, radius: 4.1 });
    return events;
  }

  if (encounter.chargeCooldown === 0 && distanceToPlayer >= 3.2) {
    encounter.attack = {
      type: "chargeWindup",
      remaining: encounter.phase === 1 ? 0.76 : 0.58,
      total: encounter.phase === 1 ? 0.76 : 0.58,
    };
    events.push({ type: "charge-windup", boss });
  }

  return events;
}

export function enforceBossArenaLock(player: PlayerState, encounter: BossEncounterState) {
  if (!encounter.arenaLocked || encounter.isDefeated || !arenaBounds) {
    return null;
  }

  const northGate = arenaBounds.center.z + arenaBounds.halfExtents.z - 0.75;

  if (player.position.z > northGate) {
    player.position.z = northGate;
    return "The arena gate slams shut";
  }

  return null;
}

export function getBossHudState(
  encounter: BossEncounterState,
  enemies: EnemyState[],
): BossHudState {
  const boss = getBossEnemy(enemies);

  if (!boss || boss.isDead || !encounter.isActive) {
    return {
      isVisible: false,
      label: "The Bellkeeper",
      phase: "",
      health: 0,
      maxHealth: 1,
    };
  }

  return {
    isVisible: true,
    label: "The Bellkeeper",
    phase: encounter.phase === 1 ? "Phase I" : "Phase II",
    health: boss.health,
    maxHealth: boss.maxHealth,
  };
}

export function resetBossEncounter(encounter: BossEncounterState) {
  encounter.isActive = false;
  encounter.isDefeated = false;
  encounter.arenaLocked = false;
  encounter.phase = 1;
  encounter.chargeCooldown = 2.2;
  encounter.slamCooldown = 5.2;
  encounter.minionCooldown = 1.5;
  encounter.attack = null;
}

function startBossEncounter(
  encounter: BossEncounterState,
  boss: EnemyState,
  enemies: EnemyState[],
) {
  encounter.isActive = true;
  encounter.arenaLocked = true;
  encounter.phase = boss.health <= boss.maxHealth * 0.5 ? 2 : 1;
  encounter.attack = null;
  boss.state = "alert";
  boss.stateTimer = 0.2;

  for (const enemy of getArenaMinions(enemies)) {
    if (!enemy.isDead) {
      enemy.state = "alert";
      enemy.stateTimer = 0.45;
    }
  }
}

function tuneBossForPhase(encounter: BossEncounterState, boss: EnemyState) {
  if (encounter.phase === 1) {
    boss.speed = 1.12;
    boss.contactDamage = 24;
    boss.attackCooldown = 1;
    boss.attackRange = 2;
    return;
  }

  boss.speed = 1.48;
  boss.contactDamage = 30;
  boss.attackCooldown = 0.78;
  boss.attackRange = 2.15;
}

function updateBossAttack(
  encounter: BossEncounterState,
  boss: EnemyState,
  player: PlayerState,
  staticColliders: MapBoxSpec[],
  deltaSeconds: number,
  events: BossEvent[],
) {
  const attack = encounter.attack;

  if (!attack) {
    return;
  }

  attack.remaining = Math.max(0, attack.remaining - deltaSeconds);

  if (attack.type === "chargeWindup") {
    boss.state = "attackWindup";
    boss.stateTimer = attack.remaining;

    if (attack.remaining === 0) {
      encounter.attack = {
        type: "charge",
        remaining: encounter.phase === 1 ? 0.78 : 0.92,
        total: encounter.phase === 1 ? 0.78 : 0.92,
        direction: normalizedDirection2d(boss.position, player.position),
        hasDamaged: false,
      };
    }

    return;
  }

  if (attack.type === "charge") {
    boss.state = "attackActive";
    boss.stateTimer = attack.remaining;
    const speed = encounter.phase === 1 ? 7.2 : 9;
    const hitWall = moveBossCharge(
      boss,
      attack.direction.x * speed * deltaSeconds,
      attack.direction.z * speed * deltaSeconds,
      staticColliders,
    );
    const hitPlayer =
      !attack.hasDamaged &&
      distance2d(boss.position, player.position) <= (encounter.phase === 1 ? 2 : 2.25) &&
      damagePlayer(player, encounter.phase === 1 ? 26 : 34);

    attack.hasDamaged = attack.hasDamaged || hitPlayer;

    if (hitWall || attack.remaining === 0) {
      encounter.attack = {
        type: "chargeRecovery",
        remaining: hitWall ? 1.05 : 0.72,
        total: hitWall ? 1.05 : 0.72,
      };
      encounter.chargeCooldown = encounter.phase === 1 ? 5.4 : 3.8;
      boss.hitFlashRemaining = hitWall ? 0.34 : boss.hitFlashRemaining;
      events.push({ type: "charge-impact", boss, hitPlayer });
    }

    return;
  }

  if (attack.type === "chargeRecovery") {
    boss.state = "staggered";
    boss.stateTimer = attack.remaining;

    if (attack.remaining === 0) {
      encounter.attack = null;
      boss.state = "chase";
      boss.stateTimer = 0;
    }

    return;
  }

  if (attack.type === "slamWindup") {
    boss.state = "attackWindup";
    boss.stateTimer = attack.remaining;

    if (attack.remaining === 0) {
      encounter.attack = {
        type: "slamActive",
        remaining: 0.26,
        total: 0.26,
        radius: attack.radius,
        hasDamaged: false,
      };
    }

    return;
  }

  if (attack.type === "slamActive") {
    boss.state = "attackActive";
    boss.stateTimer = attack.remaining;
    const hitPlayer =
      !attack.hasDamaged &&
      distance2d(boss.position, player.position) <= attack.radius &&
      damagePlayer(player, 28);

    attack.hasDamaged = attack.hasDamaged || hitPlayer;

    if (attack.remaining === 0) {
      encounter.attack = {
        type: "slamRecovery",
        remaining: 0.92,
        total: 0.92,
      };
      encounter.slamCooldown = 6.2;
      events.push({ type: "slam-impact", boss, radius: attack.radius, hitPlayer });
    }

    return;
  }

  boss.state = "attackRecovery";
  boss.stateTimer = attack.remaining;

  if (attack.remaining === 0) {
    encounter.attack = null;
    boss.state = "chase";
    boss.stateTimer = 0;
  }
}

function activateArenaMinions(enemies: EnemyState[]) {
  let activated = 0;

  for (const enemy of getArenaMinions(enemies)) {
    if (activated >= 2) {
      break;
    }

    if (enemy.isDead) {
      enemy.isDead = false;
      enemy.health = Math.ceil(enemy.maxHealth * 0.65);
      enemy.position = { ...enemy.spawnPosition };
      enemy.hitFlashRemaining = 0.4;
      activated += 1;
    }

    enemy.state = "alert";
    enemy.stateTimer = 0.3;
  }

  return activated;
}

function getBossEnemy(enemies: EnemyState[]) {
  return enemies.find((enemy) => enemy.kind === "boss") ?? null;
}

function getArenaMinions(enemies: EnemyState[]) {
  return enemies.filter((enemy) => enemy.label === "Minion");
}

function isPlayerInArena(position: Vec3) {
  return position.z < -56 && distance2d(position, bossCenter) < 15;
}

function moveBossCharge(
  boss: EnemyState,
  moveX: number,
  moveZ: number,
  staticColliders: MapBoxSpec[],
) {
  const nextX = boss.position.x + moveX;
  const nextZ = boss.position.z + moveZ;

  if (collidesWithArenaBlocker(nextX, nextZ, boss.bodyRadius, staticColliders)) {
    return true;
  }

  const clamped = clampToArena(nextX, nextZ, boss.bodyRadius);
  boss.position.x = clamped.x;
  boss.position.z = clamped.z;
  return clamped.hitBoundary;
}

function collidesWithArenaBlocker(x: number, z: number, radius: number, blockers: MapBoxSpec[]) {
  for (const blocker of blockers) {
    if (
      blocker.halfExtents.y < 0.4 ||
      !blocker.name.startsWith("Arena") ||
      blocker.name === "ArenaFloor"
    ) {
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

function clampToArena(x: number, z: number, radius: number) {
  if (!arenaBounds) {
    return { x, z, hitBoundary: false };
  }

  const minX = arenaBounds.center.x - arenaBounds.halfExtents.x + radius;
  const maxX = arenaBounds.center.x + arenaBounds.halfExtents.x - radius;
  const minZ = arenaBounds.center.z - arenaBounds.halfExtents.z + radius;
  const maxZ = arenaBounds.center.z + arenaBounds.halfExtents.z - radius;
  const clampedX = Math.max(minX, Math.min(maxX, x));
  const clampedZ = Math.max(minZ, Math.min(maxZ, z));

  return {
    x: clampedX,
    z: clampedZ,
    hitBoundary: clampedX !== x || clampedZ !== z,
  };
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
