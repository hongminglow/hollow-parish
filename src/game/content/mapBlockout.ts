import type { Vec3 } from "../simulation/player";

export type ZoneId = "road" | "millYard" | "chapelCrypt" | "bellTower";

export type BoxBounds = {
  center: Vec3;
  halfExtents: Vec3;
};

export type MapBoxSpec = {
  name: string;
  position: Vec3;
  halfExtents: Vec3;
  color: number;
};

export type MapVisualKind = "box" | "cylinder";

export type MapVisualSpec = {
  name: string;
  kind: MapVisualKind;
  position: Vec3;
  size: Vec3;
  color: number;
  emissive?: number;
};

export type MapMarkerKind = "enemy" | "loot" | "checkpoint" | "interaction" | "boss" | "route";

export type MapMarkerSpec = {
  name: string;
  kind: MapMarkerKind;
  position: Vec3;
  label: string;
};

export type ZoneSpec = {
  id: ZoneId;
  name: string;
  objective: string;
  bounds: BoxBounds;
};

export type CheckpointSpec = {
  id: string;
  name: string;
  position: Vec3;
  bounds: BoxBounds;
};

export type LightMarkerSpec = {
  name: string;
  position: Vec3;
  color: number;
  intensity: number;
  distance: number;
};

export type MapBlockout = {
  worldUnits: string;
  originNote: string;
  initialSpawn: Vec3;
  zones: ZoneSpec[];
  checkpoints: CheckpointSpec[];
  staticColliders: MapBoxSpec[];
  visualObjects: MapVisualSpec[];
  markers: MapMarkerSpec[];
  lights: LightMarkerSpec[];
  mapBounds: BoxBounds;
};

export const mapBlockout: MapBlockout = {
  worldUnits: "1 unit = 1 meter. Positive Z is the starting road; negative Z moves deeper.",
  originNote: "World origin sits near the village gate between Zone 1 and Zone 2.",
  initialSpawn: { x: 0, y: 0.95, z: 16.5 },
  mapBounds: {
    center: { x: 0, y: 2, z: -24 },
    halfExtents: { x: 16, y: 8, z: 48 },
  },
  zones: [
    {
      id: "road",
      name: "Zone 1: Abandoned Road",
      objective: "Reach the rusted gate and push into the mill yard.",
      bounds: {
        center: { x: 0, y: 1.5, z: 9 },
        halfExtents: { x: 6, y: 3, z: 11 },
      },
    },
    {
      id: "millYard",
      name: "Zone 2: Mill Yard",
      objective: "Cross the yard, inspect the crank, and find the chapel approach.",
      bounds: {
        center: { x: 0, y: 1.5, z: -15 },
        halfExtents: { x: 13, y: 3, z: 15 },
      },
    },
    {
      id: "chapelCrypt",
      name: "Zone 3: Chapel Crypt",
      objective: "Pass through the chapel crypt and reach the bell tower courtyard.",
      bounds: {
        center: { x: 1.5, y: 1.5, z: -41 },
        halfExtents: { x: 8, y: 3, z: 14 },
      },
    },
    {
      id: "bellTower",
      name: "Final Arena: Bell Tower Courtyard",
      objective: "Survey the boss arena and locate the escape gate.",
      bounds: {
        center: { x: 0, y: 1.5, z: -63 },
        halfExtents: { x: 14, y: 3, z: 10 },
      },
    },
  ],
  checkpoints: [
    {
      id: "road-start",
      name: "Road Start",
      position: { x: 0, y: 0.95, z: 16.5 },
      bounds: {
        center: { x: 0, y: 1, z: 16.5 },
        halfExtents: { x: 2.8, y: 2, z: 2.2 },
      },
    },
    {
      id: "gate-opened",
      name: "Village Gate",
      position: { x: 0, y: 0.95, z: -2.8 },
      bounds: {
        center: { x: 0, y: 1, z: -2.8 },
        halfExtents: { x: 2.8, y: 2, z: 2.2 },
      },
    },
    {
      id: "crypt-entry",
      name: "Chapel Entry",
      position: { x: 0, y: 0.95, z: -31.5 },
      bounds: {
        center: { x: 0, y: 1, z: -31.5 },
        halfExtents: { x: 2.6, y: 2, z: 2 },
      },
    },
    {
      id: "boss-gate",
      name: "Bell Tower Gate",
      position: { x: 0, y: 0.95, z: -54.5 },
      bounds: {
        center: { x: 0, y: 1, z: -54.5 },
        halfExtents: { x: 2.6, y: 2, z: 2 },
      },
    },
  ],
  staticColliders: [
    box("RoadFloor", 0, -0.12, 9, 4.2, 0.12, 10.5, 0x27302a),
    box("RoadWestTreeLine", -4.7, 0.8, 9, 0.25, 0.8, 10.7, 0x1d2a24),
    box("RoadEastTreeLine", 4.7, 0.8, 9, 0.25, 0.8, 10.7, 0x1d2a24),
    box("RoadStartBlocker", 0, 0.8, 19.7, 4.4, 0.8, 0.25, 0x1d2a24),
    box("BrokenCartCollision", -1.6, 0.42, 12.2, 0.65, 0.25, 0.38, 0x5a3821),
    box("RoadShrineCollision", 2.7, 0.8, 7.4, 0.45, 0.7, 0.35, 0x4f514a),
    box("SideShackCollision", -2.8, 1.1, 3.6, 1.1, 1.1, 1.05, 0x3c2a1e),
    box("VillageGateLeftPost", -2.35, 1.3, -1.2, 0.28, 1.3, 0.35, 0x3a2517),
    box("VillageGateRightPost", 2.35, 1.3, -1.2, 0.28, 1.3, 0.35, 0x3a2517),
    box("MillYardFloor", 0, -0.12, -14.5, 11.5, 0.12, 13.5, 0x2c3027),
    box("MillYardWestWall", -11.7, 1, -14.5, 0.25, 1, 13.6, 0x2b2f2b),
    box("MillYardEastWall", 11.7, 1, -14.5, 0.25, 1, 13.6, 0x2b2f2b),
    box("MillYardSouthWallLeft", -6.4, 1, -28.2, 5.2, 1, 0.25, 0x2b2f2b),
    box("MillYardSouthWallRight", 6.4, 1, -28.2, 5.2, 1, 0.25, 0x2b2f2b),
    box("BarnBackWall", -7.4, 1.2, -12.2, 0.25, 1.2, 4.6, 0x4c2f1e),
    box("BarnNorthWall", -4.6, 1.2, -7.8, 3, 1.2, 0.25, 0x4c2f1e),
    box("BarnSouthWall", -4.6, 1.2, -16.6, 3, 1.2, 0.25, 0x4c2f1e),
    box("StorehouseWall", 7.4, 1.1, -18.2, 3, 1.1, 0.25, 0x4a3223),
    box("WindmillTowerCollision", -6.4, 2.3, -10.2, 1.05, 2.3, 1.05, 0x5b523e),
    box("RaisedWalkwayCollision", -2.2, 1.25, -14.2, 2.3, 0.14, 0.6, 0x6a452a),
    box("StorehouseCollision", 7.4, 1.25, -18.2, 1.9, 1.25, 1.6, 0x453122),
    box("CrateCoverA", 1.8, 0.55, -11.5, 0.6, 0.55, 0.6, 0x5a3821),
    box("CrateCoverB", -1.8, 0.55, -19.5, 0.7, 0.55, 0.55, 0x5a3821),
    box("CrateStackCollisionA", -1.2, 0.5, -10.2, 0.75, 0.5, 0.7, 0x5a3821),
    box("CrateStackCollisionB", 2.9, 0.48, -19.4, 0.75, 0.48, 0.7, 0x5a3821),
    box("CrateStackCollisionC", -7.1, 0.48, -17.8, 0.75, 0.48, 0.7, 0x5a3821),
    box("CrankPostCollision", 5.25, 0.8, -17.2, 0.18, 0.62, 0.18, 0xd7a647),
    box("ChapelApproachFloor", 0, -0.12, -34.5, 3.4, 0.12, 6.5, 0x24282a),
    box("CryptFloor", 0, -0.12, -43.5, 3.2, 0.12, 8.5, 0x202326),
    box("CryptWestWall", -3.45, 1.2, -42.5, 0.25, 1.2, 10.5, 0x343437),
    box("CryptEastWallNorth", 3.45, 1.2, -36.8, 0.25, 1.2, 4.8, 0x343437),
    box("CryptEastWallSouth", 3.45, 1.2, -47.8, 0.25, 1.2, 4.8, 0x343437),
    box("CryptSideRoomFloor", 7.3, -0.12, -42.4, 3.6, 0.12, 4.2, 0x25282b),
    box("CryptSideRoomEastWall", 11.1, 1.2, -42.4, 0.25, 1.2, 4.4, 0x343437),
    box("CryptSideRoomNorthWall", 7.3, 1.2, -38.05, 3.8, 1.2, 0.25, 0x343437),
    box("CryptSideRoomSouthWall", 7.3, 1.2, -46.75, 3.8, 1.2, 0.25, 0x343437),
    box("AltarCollision", 7.4, 0.7, -42.4, 0.8, 0.5, 0.45, 0x57514a),
    box("BellGateLeft", -2.2, 1.25, -53.7, 0.28, 1.25, 0.35, 0x3c3a34),
    box("BellGateRight", 2.2, 1.25, -53.7, 0.28, 1.25, 0.35, 0x3c3a34),
    box("ArenaFloor", 0, -0.12, -63.5, 12.5, 0.12, 9.6, 0x2b2c2a),
    box("ArenaWestWall", -12.7, 1.15, -63.5, 0.25, 1.15, 9.8, 0x303030),
    box("ArenaEastWall", 12.7, 1.15, -63.5, 0.25, 1.15, 9.8, 0x303030),
    box("ArenaNorthWallLeft", -7.2, 1.15, -53.6, 5.2, 1.15, 0.25, 0x303030),
    box("ArenaNorthWallRight", 7.2, 1.15, -53.6, 5.2, 1.15, 0.25, 0x303030),
    box("ArenaSouthWall", 0, 1.15, -73.4, 12.7, 1.15, 0.25, 0x303030),
    box("BellTowerBase", 0, 1.1, -63.2, 1.55, 1.1, 1.55, 0x34302d),
    box("CollapsedCoverWest", -5.3, 0.55, -61.2, 1.4, 0.55, 0.38, 0x3a3836),
    box("CollapsedCoverEast", 5.4, 0.55, -66.2, 1.4, 0.55, 0.38, 0x3a3836),
  ],
  visualObjects: [
    boxVisual("BrokenCart", -1.6, 0.42, 12.2, 1.3, 0.5, 0.75, 0x5a3821),
    boxVisual("RoadShrine", 2.7, 0.8, 7.4, 0.9, 1.4, 0.7, 0x4f514a),
    boxVisual("SideShack", -2.8, 1.2, 3.6, 2.2, 2.2, 2.1, 0x3c2a1e),
    boxVisual("VillageGateBeam", 0, 2.5, -1.2, 5.1, 0.28, 0.35, 0x3a2517),
    cylinderVisual("WindmillTower", -6.4, 2.3, -10.2, 1.1, 4.6, 1.1, 0x5b523e),
    boxVisual("WindmillBladeVertical", -6.4, 4.9, -8.95, 0.18, 2.6, 0.14, 0xd0a35a),
    boxVisual("WindmillBladeHorizontal", -6.4, 4.9, -8.95, 2.6, 0.18, 0.14, 0xd0a35a),
    boxVisual("BarnShell", -5.4, 1.65, -12.2, 3.8, 3, 8.2, 0x412719),
    boxVisual("RaisedWalkway", -2.2, 1.25, -14.2, 4.6, 0.28, 1.2, 0x6a452a),
    boxVisual("Storehouse", 7.4, 1.4, -18.2, 3.8, 2.5, 3.2, 0x453122),
    boxVisual("ShortcutDoorFrame", -10.9, 1.25, -23.4, 0.4, 2.1, 2.2, 0x2f2118),
    boxVisual("CrankPost", 5.25, 0.8, -17.2, 0.35, 1.25, 0.35, 0xd7a647, 0x6b4318),
    boxVisual("ChapelFacade", 0, 2.2, -31.4, 6.8, 4.2, 0.6, 0x35373a),
    boxVisual("BasementStairs", 0, 0.22, -36.2, 2.2, 0.28, 1.6, 0x2b2d30),
    boxVisual("CryptCeilingHint", 0, 2.45, -43.5, 6.8, 0.18, 17.2, 0x171a1d),
    boxVisual("Altar", 7.4, 0.7, -42.4, 1.6, 1, 0.9, 0x57514a),
    boxVisual("ExitLadder", 0, 1.2, -51.2, 0.5, 2.3, 0.18, 0xa87342),
    cylinderVisual("BellTowerColumn", 0, 3.6, -63.2, 1.1, 6.5, 1.1, 0x3d3934),
    boxVisual("BellTowerCrossBeam", 0, 6.95, -63.2, 3.6, 0.25, 0.25, 0x6e4a2e),
    boxVisual("EscapeGate", 0, 1.5, -72.9, 3.6, 2.8, 0.25, 0x2f2018),
  ],
  markers: [
    marker("CheckpointRoad", "checkpoint", 0, 0.2, 16.5, "CP Road"),
    marker("RoadLoot", "loot", -2.2, 0.25, 11.2, "Ammo"),
    marker("RoadEnemyA", "enemy", 0.8, 0.25, 6.4, "Enemy"),
    marker("RoadKey", "interaction", 2.7, 0.25, 7.4, "Key"),
    marker("CheckpointGate", "checkpoint", 0, 0.2, -2.8, "CP Gate"),
    marker("MillEnemyGroup", "enemy", 0, 0.25, -13.4, "Group"),
    marker("HookEnemy", "enemy", -4.8, 0.25, -15.6, "Hook"),
    marker("CrankMarker", "interaction", 5.25, 0.25, -17.2, "Crank"),
    marker("MillLoot", "loot", 7.8, 0.25, -21.4, "Supplies"),
    marker("CheckpointChapel", "checkpoint", 0, 0.2, -31.5, "CP Chapel"),
    marker("DormantCryptEnemies", "enemy", -1.3, 0.25, -42.6, "Dormant"),
    marker("IronSunEmblem", "interaction", 7.4, 0.25, -42.4, "Emblem"),
    marker("CheckpointBossGate", "checkpoint", 0, 0.2, -54.5, "CP Boss"),
    marker("BossSpawn", "boss", 0, 0.25, -63.2, "Boss"),
    marker("ArenaMinionWest", "enemy", -6.4, 0.25, -63.8, "Minion"),
    marker("ArenaMinionEast", "enemy", 6.4, 0.25, -63.8, "Minion"),
    marker("ArenaLootWest", "loot", -8.4, 0.25, -60.1, "Loot"),
    marker("ArenaLootEast", "loot", 8.2, 0.25, -67.4, "Loot"),
    marker("EscapeRoute", "route", 0, 0.25, -72.3, "Escape"),
  ],
  lights: [
    light("RoadLantern", 2.8, 2.2, 7.2, 0xd79a45, 8, 11),
    light("MillLantern", 5.2, 2.6, -17.2, 0xd79a45, 10, 14),
    light("CryptColdLight", 7.4, 2.1, -42.4, 0x8da6bd, 5, 10),
    light("BellTowerGlow", 0, 4.6, -63.2, 0xd79a45, 14, 16),
  ],
};

function box(
  name: string,
  x: number,
  y: number,
  z: number,
  hx: number,
  hy: number,
  hz: number,
  color: number,
): MapBoxSpec {
  return {
    name,
    position: { x, y, z },
    halfExtents: { x: hx, y: hy, z: hz },
    color,
  };
}

function boxVisual(
  name: string,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  color: number,
  emissive?: number,
): MapVisualSpec {
  return {
    name,
    kind: "box",
    position: { x, y, z },
    size: { x: sx, y: sy, z: sz },
    color,
    emissive,
  };
}

function cylinderVisual(
  name: string,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  color: number,
): MapVisualSpec {
  return {
    name,
    kind: "cylinder",
    position: { x, y, z },
    size: { x: sx, y: sy, z: sz },
    color,
  };
}

function marker(
  name: string,
  kind: MapMarkerKind,
  x: number,
  y: number,
  z: number,
  label: string,
): MapMarkerSpec {
  return {
    name,
    kind,
    position: { x, y, z },
    label,
  };
}

function light(
  name: string,
  x: number,
  y: number,
  z: number,
  color: number,
  intensity: number,
  distance: number,
): LightMarkerSpec {
  return {
    name,
    position: { x, y, z },
    color,
    intensity,
    distance,
  };
}
