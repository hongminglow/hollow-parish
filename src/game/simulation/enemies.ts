import { mapBlockout, type MapMarkerSpec } from "../content/mapBlockout";
import type { Vec3 } from "./player";

export type EnemyKind = "infected" | "hook" | "armored" | "boss";

export type EnemyState = {
  id: string;
  label: string;
  kind: EnemyKind;
  position: Vec3;
  health: number;
  maxHealth: number;
  bodyRadius: number;
  headRadius: number;
  contactDamage: number;
  contactRange: number;
  contactCooldownRemaining: number;
  hitFlashRemaining: number;
  isDead: boolean;
};

export function createEnemies(): EnemyState[] {
  return mapBlockout.markers
    .filter((marker) => marker.kind === "enemy" || marker.kind === "boss")
    .map(createEnemyFromMarker);
}

export function updateEnemies(enemies: EnemyState[], deltaSeconds: number) {
  for (const enemy of enemies) {
    enemy.contactCooldownRemaining = Math.max(0, enemy.contactCooldownRemaining - deltaSeconds);
    enemy.hitFlashRemaining = Math.max(0, enemy.hitFlashRemaining - deltaSeconds);
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
  }
}

export function resetEnemies(enemies: EnemyState[]) {
  for (const enemy of enemies) {
    enemy.health = enemy.maxHealth;
    enemy.isDead = false;
    enemy.hitFlashRemaining = 0;
    enemy.contactCooldownRemaining = 0;
  }
}

function createEnemyFromMarker(marker: MapMarkerSpec): EnemyState {
  const kind = getEnemyKind(marker);
  const maxHealth = kind === "boss" ? 300 : kind === "armored" ? 140 : kind === "hook" ? 60 : 75;

  return {
    id: marker.name,
    label: marker.label,
    kind,
    position: {
      x: marker.position.x,
      y: 0.95,
      z: marker.position.z,
    },
    health: maxHealth,
    maxHealth,
    bodyRadius: kind === "boss" ? 1.1 : 0.62,
    headRadius: kind === "boss" ? 0.42 : 0.28,
    contactDamage: kind === "boss" ? 24 : kind === "hook" ? 18 : 12,
    contactRange: kind === "boss" ? 1.8 : 1.25,
    contactCooldownRemaining: 0,
    hitFlashRemaining: 0,
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
