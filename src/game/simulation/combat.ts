import type { WeaponState } from "./weapon";
import { damageEnemy, type EnemyState } from "./enemies";
import { damagePlayer, type PlayerState, type Vec3 } from "./player";

export type Ray = {
  origin: Vec3;
  direction: Vec3;
};

export type ShotResult =
  | {
      type: "hit";
      enemy: EnemyState;
      hitPart: "head" | "body";
      hitPoint: Vec3;
      damage: number;
    }
  | {
      type: "blocked";
      hitPoint: Vec3;
    }
  | {
      type: "miss";
      hitPoint: Vec3;
    };

export function resolveHitscanShot(
  weapon: WeaponState,
  enemies: EnemyState[],
  ray: Ray,
  wallDistance: number | null,
): ShotResult {
  const maxDistance =
    wallDistance === null ? weapon.config.range : Math.min(wallDistance, weapon.config.range);
  const closest = findClosestEnemyHit(enemies, ray, maxDistance);

  if (!closest) {
    if (wallDistance !== null && wallDistance <= weapon.config.range) {
      return {
        type: "blocked",
        hitPoint: pointAt(ray, wallDistance),
      };
    }

    return {
      type: "miss",
      hitPoint: pointAt(ray, weapon.config.range),
    };
  }

  const damage =
    closest.hitPart === "head"
      ? Math.round(weapon.config.damage * weapon.config.headMultiplier)
      : weapon.config.damage;

  damageEnemy(closest.enemy, damage);

  return {
    type: "hit",
    enemy: closest.enemy,
    hitPart: closest.hitPart,
    hitPoint: pointAt(ray, closest.distance),
    damage,
  };
}

export function applyEnemyContactDamage(enemies: EnemyState[], player: PlayerState) {
  if (player.isDead) {
    return null;
  }

  for (const enemy of enemies) {
    if (enemy.isDead || enemy.contactCooldownRemaining > 0) {
      continue;
    }

    const distance = Math.hypot(
      enemy.position.x - player.position.x,
      enemy.position.z - player.position.z,
    );

    if (distance > enemy.contactRange) {
      continue;
    }

    enemy.contactCooldownRemaining = 1.2;
    damagePlayer(player, enemy.contactDamage);
    return enemy;
  }

  return null;
}

function findClosestEnemyHit(enemies: EnemyState[], ray: Ray, maxDistance: number) {
  let closest: {
    enemy: EnemyState;
    hitPart: "head" | "body";
    distance: number;
  } | null = null;

  for (const enemy of enemies) {
    if (enemy.isDead) {
      continue;
    }

    const headHit = intersectSphere(
      ray,
      { x: enemy.position.x, y: enemy.position.y + 0.82, z: enemy.position.z },
      enemy.headRadius,
    );
    const bodyHit = intersectSphere(
      ray,
      { x: enemy.position.x, y: enemy.position.y + 0.25, z: enemy.position.z },
      enemy.bodyRadius,
    );
    const candidate =
      headHit !== null && headHit <= maxDistance
        ? { enemy, hitPart: "head" as const, distance: headHit }
        : bodyHit !== null && bodyHit <= maxDistance
          ? { enemy, hitPart: "body" as const, distance: bodyHit }
          : null;

    if (!candidate) {
      continue;
    }

    if (!closest || candidate.distance < closest.distance) {
      closest = candidate;
    }
  }

  return closest;
}

function intersectSphere(ray: Ray, center: Vec3, radius: number) {
  const originToCenter = {
    x: ray.origin.x - center.x,
    y: ray.origin.y - center.y,
    z: ray.origin.z - center.z,
  };
  const b =
    originToCenter.x * ray.direction.x +
    originToCenter.y * ray.direction.y +
    originToCenter.z * ray.direction.z;
  const c =
    originToCenter.x * originToCenter.x +
    originToCenter.y * originToCenter.y +
    originToCenter.z * originToCenter.z -
    radius * radius;
  const discriminant = b * b - c;

  if (discriminant < 0) {
    return null;
  }

  const distance = -b - Math.sqrt(discriminant);
  return distance >= 0 ? distance : null;
}

function pointAt(ray: Ray, distance: number): Vec3 {
  return {
    x: ray.origin.x + ray.direction.x * distance,
    y: ray.origin.y + ray.direction.y * distance,
    z: ray.origin.z + ray.direction.z * distance,
  };
}
