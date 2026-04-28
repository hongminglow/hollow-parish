import * as THREE from "three";
import type { Vec3 } from "../../game/simulation/player";
import type { GamePhysicsWorld } from "../../physics/world";

type CameraUpdateParams = {
  target: Vec3;
  isAiming: boolean;
  deltaSeconds: number;
  physics: GamePhysicsWorld;
};

const minPitch = -0.86;
const maxPitch = 0.62;
const mouseSensitivity = 0.0024;
const defaultDistance = 5.2;
const aimDistance = 2.75;
const defaultFov = 60;
const aimFov = 50;
const targetHeight = 0.78;
const defaultShoulderOffset = 0;
const aimShoulderOffset = 0.48;

export function createThirdPersonCamera(camera: THREE.PerspectiveCamera) {
  let yaw = 0;
  let pitch = -0.22;
  const smoothedPosition = new THREE.Vector3(
    camera.position.x,
    camera.position.y,
    camera.position.z,
  );
  const targetPosition = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();

  function applyLook(mouseDelta: { x: number; y: number }) {
    yaw -= mouseDelta.x * mouseSensitivity;
    pitch = THREE.MathUtils.clamp(pitch - mouseDelta.y * mouseSensitivity, minPitch, maxPitch);
  }

  function update(params: CameraUpdateParams) {
    const distance = params.isAiming ? aimDistance : defaultDistance;
    const shoulderOffset = params.isAiming ? aimShoulderOffset : defaultShoulderOffset;
    const fov = params.isAiming ? aimFov : defaultFov;
    const yawForward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const yawRight = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const verticalOffset = Math.sin(pitch) * distance;
    const horizontalDistance = Math.cos(pitch) * distance;
    const target = new THREE.Vector3(
      params.target.x,
      params.target.y + targetHeight,
      params.target.z,
    );
    const desired = target
      .clone()
      .addScaledVector(yawForward, -horizontalDistance)
      .addScaledVector(yawRight, shoulderOffset);

    desired.y += verticalOffset + 0.55;
    lookTarget.copy(target).addScaledVector(yawRight, shoulderOffset * 0.46);

    const cameraDirection = desired.clone().sub(lookTarget);
    const cameraDistance = cameraDirection.length();

    if (cameraDistance > 0.001) {
      cameraDirection.normalize();
      const hitDistance = params.physics.castCameraRay(
        { x: lookTarget.x, y: lookTarget.y, z: lookTarget.z },
        { x: cameraDirection.x, y: cameraDirection.y, z: cameraDirection.z },
        cameraDistance,
      );

      if (hitDistance !== null) {
        desired
          .copy(lookTarget)
          .addScaledVector(cameraDirection, Math.max(0.8, hitDistance - 0.18));
      }
    }

    const smoothing = 1 - Math.exp(-16 * params.deltaSeconds);
    smoothedPosition.lerp(desired, smoothing);
    targetPosition.lerp(lookTarget, smoothing);

    camera.position.copy(smoothedPosition);
    camera.lookAt(targetPosition);
    camera.fov = THREE.MathUtils.lerp(camera.fov, fov, smoothing);
    camera.updateProjectionMatrix();
  }

  return {
    applyLook,
    update,
    getYaw() {
      return yaw;
    },
  };
}
