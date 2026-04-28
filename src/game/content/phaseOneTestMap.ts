import type { Vec3 } from "../simulation/player";

export type StaticColliderSpec = {
  name: string;
  position: Vec3;
  halfExtents: Vec3;
  color: number;
};

export const phaseOneStaticColliders: StaticColliderSpec[] = [
  {
    name: "TrainingFloor",
    position: { x: 0, y: -0.12, z: 0 },
    halfExtents: { x: 10, y: 0.12, z: 10 },
    color: 0x27302a,
  },
  {
    name: "NorthWall",
    position: { x: 0, y: 1.25, z: -6.1 },
    halfExtents: { x: 4.8, y: 1.25, z: 0.22 },
    color: 0x3a2517,
  },
  {
    name: "WestWall",
    position: { x: -5.2, y: 1.2, z: -0.8 },
    halfExtents: { x: 0.22, y: 1.2, z: 4.1 },
    color: 0x30342f,
  },
  {
    name: "EastWall",
    position: { x: 5.2, y: 1.2, z: -0.8 },
    halfExtents: { x: 0.22, y: 1.2, z: 4.1 },
    color: 0x30342f,
  },
  {
    name: "CrateObstacle",
    position: { x: 1.8, y: 0.55, z: -1.4 },
    halfExtents: { x: 0.55, y: 0.55, z: 0.55 },
    color: 0x5a3821,
  },
];
