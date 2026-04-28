import RAPIER, {
  type Collider,
  type KinematicCharacterController,
  type RigidBody,
  type World,
} from "@dimforge/rapier3d-compat";
import type { StaticColliderSpec } from "../game/content/phaseOneTestMap";
import type { PlayerPhysicsResult, Vec3 } from "../game/simulation/player";

export class GamePhysicsWorld {
  readonly playerCollider: Collider;
  private readonly playerBody: RigidBody;
  private readonly characterController: KinematicCharacterController;

  constructor(
    private readonly world: World,
    spawnPosition: Vec3,
    staticColliders: StaticColliderSpec[],
  ) {
    this.world.timestep = 1 / 60;
    this.world.lengthUnit = 1;

    for (const collider of staticColliders) {
      this.world.createCollider(
        RAPIER.ColliderDesc.cuboid(
          collider.halfExtents.x,
          collider.halfExtents.y,
          collider.halfExtents.z,
        )
          .setTranslation(collider.position.x, collider.position.y, collider.position.z)
          .setFriction(1),
      );
    }

    this.playerBody = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased()
        .setTranslation(spawnPosition.x, spawnPosition.y, spawnPosition.z)
        .lockRotations(),
    );
    this.playerCollider = this.world.createCollider(
      RAPIER.ColliderDesc.capsule(0.45, 0.35).setFriction(0),
      this.playerBody,
    );
    this.characterController = this.world.createCharacterController(0.04);
    this.characterController.setSlideEnabled(true);
    this.characterController.enableAutostep(0.28, 0.16, false);
    this.characterController.enableSnapToGround(0.45);
    this.characterController.setUp({ x: 0, y: 1, z: 0 });
  }

  movePlayer(desiredTranslation: Vec3, deltaSeconds: number): PlayerPhysicsResult {
    this.world.timestep = deltaSeconds;
    this.characterController.computeColliderMovement(this.playerCollider, desiredTranslation);

    const movement = this.characterController.computedMovement();
    const position = this.playerBody.translation();
    const nextPosition = {
      x: position.x + movement.x,
      y: position.y + movement.y,
      z: position.z + movement.z,
    };

    this.playerBody.setNextKinematicTranslation(nextPosition);
    this.world.step();
    this.world.updateSceneQueries();

    const next = this.playerBody.translation();

    return {
      position: { x: next.x, y: next.y, z: next.z },
      isGrounded: this.characterController.computedGrounded(),
      appliedMovement: { x: movement.x, y: movement.y, z: movement.z },
    };
  }

  castCameraRay(origin: Vec3, direction: Vec3, maxDistance: number): number | null {
    const ray = new RAPIER.Ray(origin, direction);
    const hit = this.world.castRay(
      ray,
      maxDistance,
      true,
      undefined,
      undefined,
      this.playerCollider,
    );

    return hit?.timeOfImpact ?? null;
  }

  resetPlayer(position: Vec3) {
    this.playerBody.setTranslation(position, true);
    this.playerBody.setNextKinematicTranslation(position);
    this.world.updateSceneQueries();
  }

  dispose() {
    this.world.removeCharacterController(this.characterController);
    this.world.free();
  }
}

export async function createPhysicsWorld(
  spawnPosition: Vec3,
  staticColliders: StaticColliderSpec[],
) {
  await RAPIER.init();
  return new GamePhysicsWorld(
    new RAPIER.World({ x: 0, y: -9.81, z: 0 }),
    spawnPosition,
    staticColliders,
  );
}
