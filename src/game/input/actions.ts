export const gameActions = [
  "moveForward",
  "moveBackward",
  "moveLeft",
  "moveRight",
  "sprint",
  "jump",
  "aim",
  "shoot",
  "reload",
  "interact",
  "heal",
  "inventory",
  "pause",
  "restart",
  "toggleDebug",
  "skipRoad",
  "skipMill",
  "skipChapel",
  "skipArena",
] as const;

export type GameAction = (typeof gameActions)[number];

export type MovementAxis = {
  x: number;
  z: number;
};

export function getMovementAxis(isHeld: (action: GameAction) => boolean): MovementAxis {
  const x = Number(isHeld("moveRight")) - Number(isHeld("moveLeft"));
  const z = Number(isHeld("moveForward")) - Number(isHeld("moveBackward"));
  const length = Math.hypot(x, z);

  if (length === 0) {
    return { x: 0, z: 0 };
  }

  return {
    x: x / length,
    z: z / length,
  };
}
