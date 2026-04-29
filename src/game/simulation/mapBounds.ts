import { mapBlockout } from "../content/mapBlockout";
import type { PlayerState } from "./player";

export function enforceMapBounds(player: PlayerState) {
  const { center, halfExtents } = mapBlockout.mapBounds;
  const nextX = clamp(player.position.x, center.x - halfExtents.x, center.x + halfExtents.x);
  const nextZ = clamp(player.position.z, center.z - halfExtents.z, center.z + halfExtents.z);

  if (nextX === player.position.x && nextZ === player.position.z) {
    return null;
  }

  player.position.x = nextX;
  player.position.z = nextZ;
  return "You cannot leave the parish boundary";
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}
