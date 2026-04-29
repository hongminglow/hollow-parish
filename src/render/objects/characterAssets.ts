import type { EnemyKind } from "../../game/simulation/enemies";

export type CharacterAssetSlot = {
  enabled: boolean;
  url: string;
  scale: number;
  targetHeight: number;
  yOffset: number;
  yawOffset: number;
};

export const playerCharacterAsset: CharacterAssetSlot = {
  enabled: true,
  url: "/assets/models/player.glb",
  scale: 1,
  targetHeight: 1.78,
  yOffset: -0.95,
  yawOffset: Math.PI,
};

export const enemyCharacterAssets: Record<EnemyKind, CharacterAssetSlot> = {
  infected: {
    enabled: true,
    url: "/assets/models/infected.glb",
    scale: 1,
    targetHeight: 1.75,
    yOffset: -0.95,
    yawOffset: Math.PI,
  },
  hook: {
    enabled: true,
    url: "/assets/models/hook-infected.glb",
    scale: 1,
    targetHeight: 1.82,
    yOffset: -0.95,
    yawOffset: Math.PI,
  },
  armored: {
    enabled: true,
    url: "/assets/models/armored-infected.glb",
    scale: 1,
    targetHeight: 1.92,
    yOffset: -0.95,
    yawOffset: Math.PI,
  },
  boss: {
    enabled: true,
    url: "/assets/models/bell-keeper.glb",
    scale: 1,
    targetHeight: 3.25,
    yOffset: -0.95,
    yawOffset: 0,
  },
};
