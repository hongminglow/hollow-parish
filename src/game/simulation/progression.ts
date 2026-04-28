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
};

export function createProgressionState(): ProgressionState {
  return {
    currentZone: mapBlockout.zones[0],
    currentCheckpoint: mapBlockout.checkpoints[0],
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

function containsPoint(bounds: BoxBounds, point: Vec3) {
  return (
    Math.abs(point.x - bounds.center.x) <= bounds.halfExtents.x &&
    Math.abs(point.y - bounds.center.y) <= bounds.halfExtents.y &&
    Math.abs(point.z - bounds.center.z) <= bounds.halfExtents.z
  );
}
