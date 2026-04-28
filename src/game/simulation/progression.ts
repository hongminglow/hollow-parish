import {
  mapBlockout,
  type BoxBounds,
  type CheckpointSpec,
  type ZoneSpec,
} from "../content/mapBlockout";
import type { Vec3 } from "./player";

export type ProgressionState = {
  currentZone: ZoneSpec;
  currentCheckpoint: CheckpointSpec;
  flags: ProgressionFlags;
};

export type ProgressionFlags = {
  villageGateUnlocked: boolean;
  millCrankTurned: boolean;
  chapelEmblemPlaced: boolean;
  bossDefeated: boolean;
  escapeGateUnlocked: boolean;
};

export function createProgressionState(): ProgressionState {
  return {
    currentZone: mapBlockout.zones[0],
    currentCheckpoint: mapBlockout.checkpoints[0],
    flags: createProgressionFlags(),
  };
}

export function createProgressionFlags(): ProgressionFlags {
  return {
    villageGateUnlocked: false,
    millCrankTurned: false,
    chapelEmblemPlaced: false,
    bossDefeated: false,
    escapeGateUnlocked: false,
  };
}

export function updateProgression(state: ProgressionState, playerPosition: Vec3) {
  const zone = mapBlockout.zones.find((candidate) =>
    containsPoint(candidate.bounds, playerPosition),
  );
  const checkpoint = mapBlockout.checkpoints.find((candidate) =>
    containsPoint(candidate.bounds, playerPosition),
  );

  if (zone) {
    state.currentZone = zone;
  }

  if (checkpoint) {
    state.currentCheckpoint = checkpoint;
  }
}

export function getZoneByIndex(index: number): ZoneSpec {
  return mapBlockout.zones[Math.max(0, Math.min(mapBlockout.zones.length - 1, index))];
}

export function getCheckpointForZone(zone: ZoneSpec): CheckpointSpec {
  if (zone.id === "road") {
    return mapBlockout.checkpoints[0];
  }

  if (zone.id === "millYard") {
    return mapBlockout.checkpoints[1];
  }

  if (zone.id === "chapelCrypt") {
    return mapBlockout.checkpoints[2];
  }

  return mapBlockout.checkpoints[3];
}

export function getCurrentObjective(state: ProgressionState) {
  if (!state.flags.villageGateUnlocked) {
    return "Find the Village Gate Key and unlock the rusted gate.";
  }

  if (!state.flags.millCrankTurned) {
    return "Reach the mill crank and hold E to open the chapel route.";
  }

  if (!state.flags.chapelEmblemPlaced) {
    return "Find the Iron Sun Emblem and place it at the chapel altar.";
  }

  if (!state.flags.bossDefeated) {
    return `${state.currentZone.name}: Survive the route and prepare for The Bellkeeper.`;
  }

  if (!state.flags.escapeGateUnlocked) {
    return "The Bellkeeper is down. Unlock the escape gate.";
  }

  return "Escape the parish.";
}

export function cloneProgressionFlags(flags: ProgressionFlags): ProgressionFlags {
  return { ...flags };
}

export function restoreProgressionFlags(target: ProgressionFlags, snapshot: ProgressionFlags) {
  target.villageGateUnlocked = snapshot.villageGateUnlocked;
  target.millCrankTurned = snapshot.millCrankTurned;
  target.chapelEmblemPlaced = snapshot.chapelEmblemPlaced;
  target.bossDefeated = snapshot.bossDefeated;
  target.escapeGateUnlocked = snapshot.escapeGateUnlocked;
}

function containsPoint(bounds: BoxBounds, point: Vec3) {
  return (
    Math.abs(point.x - bounds.center.x) <= bounds.halfExtents.x &&
    Math.abs(point.y - bounds.center.y) <= bounds.halfExtents.y &&
    Math.abs(point.z - bounds.center.z) <= bounds.halfExtents.z
  );
}
