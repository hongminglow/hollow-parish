import type { EnemyState } from "./enemies";
import { getDeadEnemyIds, restoreEnemiesFromCheckpoint } from "./enemies";
import { mapBlockout, type ZoneId } from "../content/mapBlockout";
import type { InventoryState, InventorySnapshot } from "./inventory";
import { createInventorySnapshot, restoreInventorySnapshot } from "./inventory";
import type { PickupState } from "./pickups";
import { getCollectedPickupIds, restoreCollectedPickups } from "./pickups";
import type { PlayerState, Vec3 } from "./player";
import { placePlayerAt, setPlayerSpawn } from "./player";
import type { ProgressionFlags, ProgressionState } from "./progression";
import { cloneProgressionFlags, restoreProgressionFlags } from "./progression";
import type { WeaponSnapshot, WeaponState } from "./weapon";
import { createWeaponSnapshot, ensureMinimumAmmo, restoreWeaponSnapshot } from "./weapon";

export type CheckpointSnapshot = {
  checkpointId: string;
  zoneId: ZoneId;
  spawnPosition: Vec3;
  weapon: WeaponSnapshot;
  inventory: InventorySnapshot;
  progressionFlags: ProgressionFlags;
  collectedPickupIds: string[];
  deadEnemyIds: string[];
};

export function createCheckpointSnapshot(
  weapon: WeaponState,
  inventory: InventoryState,
  progression: ProgressionState,
  pickups: PickupState[],
  enemies: EnemyState[],
): CheckpointSnapshot {
  return {
    checkpointId: progression.currentCheckpoint.id,
    zoneId: progression.currentZone.id,
    spawnPosition: { ...progression.currentCheckpoint.position },
    weapon: createWeaponSnapshot(weapon),
    inventory: createInventorySnapshot(inventory),
    progressionFlags: cloneProgressionFlags(progression.flags),
    collectedPickupIds: getCollectedPickupIds(pickups),
    deadEnemyIds: getDeadEnemyIds(enemies),
  };
}

export function restoreCheckpointSnapshot(
  snapshot: CheckpointSnapshot,
  player: PlayerState,
  weapon: WeaponState,
  inventory: InventoryState,
  progression: ProgressionState,
  pickups: PickupState[],
  enemies: EnemyState[],
) {
  progression.currentCheckpoint =
    mapBlockout.checkpoints.find((checkpoint) => checkpoint.id === snapshot.checkpointId) ??
    progression.currentCheckpoint;
  progression.currentZone =
    mapBlockout.zones.find((zone) => zone.id === snapshot.zoneId) ?? progression.currentZone;
  restoreProgressionFlags(progression.flags, snapshot.progressionFlags);
  restoreWeaponSnapshot(weapon, snapshot.weapon);
  ensureMinimumAmmo(weapon, 6);
  restoreInventorySnapshot(inventory, snapshot.inventory);
  restoreCollectedPickups(pickups, snapshot.collectedPickupIds);
  restoreEnemiesFromCheckpoint(enemies, snapshot.deadEnemyIds);
  setPlayerSpawn(player, snapshot.spawnPosition);
  placePlayerAt(player, snapshot.spawnPosition);
}
