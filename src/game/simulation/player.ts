import type { MovementAxis } from "../input/actions";

export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

export type PlayerMoveIntent = {
  movementAxis: MovementAxis;
  cameraYaw: number;
  isAiming: boolean;
  isSprinting: boolean;
  deltaSeconds: number;
};

export type PlayerPhysicsResult = {
  position: Vec3;
  isGrounded: boolean;
  appliedMovement: Vec3;
};

export type PlayerState = {
  position: Vec3;
  spawnPosition: Vec3;
  velocity: Vec3;
  yaw: number;
  health: number;
  invulnerabilityRemaining: number;
  isAiming: boolean;
  isSprinting: boolean;
  isDead: boolean;
  isGrounded: boolean;
  movementState: "idle" | "walk" | "run" | "aim";
};

const walkSpeed = 3.1;
const sprintSpeed = 5.2;
const aimSpeed = 1.7;
const gravity = -20;

export function createPlayerState(spawnPosition: Vec3): PlayerState {
  return {
    position: { ...spawnPosition },
    spawnPosition: { ...spawnPosition },
    velocity: { x: 0, y: 0, z: 0 },
    yaw: 0,
    health: 100,
    invulnerabilityRemaining: 0,
    isAiming: false,
    isSprinting: false,
    isDead: false,
    isGrounded: false,
    movementState: "idle",
  };
}

export function updatePlayerMoveIntent(player: PlayerState, intent: PlayerMoveIntent): Vec3 {
  if (player.isDead) {
    player.velocity = { x: 0, y: 0, z: 0 };
    player.isAiming = false;
    player.isSprinting = false;
    player.movementState = "idle";
    return { x: 0, y: 0, z: 0 };
  }

  const hasMoveInput = intent.movementAxis.x !== 0 || intent.movementAxis.z !== 0;
  const canSprint = intent.isSprinting && hasMoveInput && !intent.isAiming;
  const speed = intent.isAiming ? aimSpeed : canSprint ? sprintSpeed : walkSpeed;
  const forward = {
    x: -Math.sin(intent.cameraYaw),
    z: -Math.cos(intent.cameraYaw),
  };
  const right = {
    x: Math.cos(intent.cameraYaw),
    z: -Math.sin(intent.cameraYaw),
  };
  const moveX = right.x * intent.movementAxis.x + forward.x * intent.movementAxis.z;
  const moveZ = right.z * intent.movementAxis.x + forward.z * intent.movementAxis.z;

  player.isAiming = intent.isAiming;
  player.isSprinting = canSprint;
  player.movementState = intent.isAiming
    ? "aim"
    : canSprint
      ? "run"
      : hasMoveInput
        ? "walk"
        : "idle";
  player.velocity.x = moveX * speed;
  player.velocity.z = moveZ * speed;
  player.velocity.y = player.isGrounded
    ? Math.min(player.velocity.y, -0.5)
    : player.velocity.y + gravity * intent.deltaSeconds;

  if (intent.isAiming) {
    player.yaw = intent.cameraYaw;
  } else if (hasMoveInput) {
    player.yaw = Math.atan2(-moveX, -moveZ);
  }

  return {
    x: player.velocity.x * intent.deltaSeconds,
    y: player.velocity.y * intent.deltaSeconds,
    z: player.velocity.z * intent.deltaSeconds,
  };
}

export function syncPlayerPhysics(player: PlayerState, result: PlayerPhysicsResult) {
  player.position = { ...result.position };
  player.isGrounded = result.isGrounded;

  if (result.isGrounded && player.velocity.y < 0) {
    player.velocity.y = 0;
  }
}

export function updatePlayerTimers(player: PlayerState, deltaSeconds: number) {
  player.invulnerabilityRemaining = Math.max(0, player.invulnerabilityRemaining - deltaSeconds);
}

export function damagePlayer(player: PlayerState, damage: number) {
  if (player.isDead || player.invulnerabilityRemaining > 0) {
    return false;
  }

  player.health = Math.max(0, player.health - damage);
  player.invulnerabilityRemaining = 0.8;

  if (player.health === 0) {
    player.isDead = true;
    player.isAiming = false;
    player.isSprinting = false;
    player.movementState = "idle";
  }

  return true;
}

export function respawnPlayer(player: PlayerState) {
  placePlayerAt(player, player.spawnPosition);
}

export function setPlayerSpawn(player: PlayerState, spawnPosition: Vec3) {
  player.spawnPosition = { ...spawnPosition };
}

export function placePlayerAt(player: PlayerState, position: Vec3) {
  player.position = { ...position };
  player.velocity = { x: 0, y: 0, z: 0 };
  player.health = 100;
  player.invulnerabilityRemaining = 0;
  player.isDead = false;
  player.isGrounded = false;
  player.isAiming = false;
  player.isSprinting = false;
  player.movementState = "idle";
}
