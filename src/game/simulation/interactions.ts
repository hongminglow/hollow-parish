import type { InventoryState, KeyItemId } from "./inventory";
import { hasKeyItem } from "./inventory";
import type { PlayerState, Vec3 } from "./player";
import type { ProgressionState } from "./progression";

export type InteractionId = "villageGate" | "millCrank" | "chapelAltar" | "escapeGate";

export type InteractionSpec = {
  id: InteractionId;
  label: string;
  position: Vec3;
  radius: number;
  requiredKey?: KeyItemId;
  duration: number;
};

export type InteractionAttempt =
  | {
      type: "blocked";
      message: string;
    }
  | {
      type: "complete";
      message: string;
    }
  | {
      type: "timed";
      interaction: InteractionSpec;
      message: string;
    };

const interactions: InteractionSpec[] = [
  {
    id: "villageGate",
    label: "Rusted Village Gate",
    position: { x: 0, y: 0.95, z: -1.2 },
    radius: 2.4,
    requiredKey: "villageGateKey",
    duration: 0,
  },
  {
    id: "millCrank",
    label: "Mill Crank",
    position: { x: 5.25, y: 0.95, z: -17.2 },
    radius: 1.8,
    duration: 2.1,
  },
  {
    id: "chapelAltar",
    label: "Chapel Altar",
    position: { x: 7.4, y: 0.95, z: -42.4 },
    radius: 1.9,
    requiredKey: "ironSunEmblem",
    duration: 0,
  },
  {
    id: "escapeGate",
    label: "Escape Gate",
    position: { x: 0, y: 0.95, z: -72.3 },
    radius: 2.2,
    duration: 0,
  },
];

export function findNearbyInteraction(playerPosition: Vec3, progression: ProgressionState) {
  return (
    interactions.find(
      (interaction) =>
        shouldShowInteraction(interaction, progression) &&
        distance2d(interaction.position, playerPosition) <= interaction.radius,
    ) ?? null
  );
}

export function getInteractionPrompt(interaction: InteractionSpec | null) {
  if (!interaction) {
    return "";
  }

  if (interaction.duration > 0) {
    return `Hold E: ${interaction.label}`;
  }

  return `E: ${interaction.label}`;
}

export function tryUseInteraction(
  interaction: InteractionSpec,
  inventory: InventoryState,
  progression: ProgressionState,
): InteractionAttempt {
  if (interaction.id === "escapeGate" && !progression.flags.bossDefeated) {
    return {
      type: "blocked",
      message: "The escape gate is sealed until The Bellkeeper falls",
    };
  }

  if (interaction.requiredKey && !hasKeyItem(inventory, interaction.requiredKey)) {
    return {
      type: "blocked",
      message: "Required key item missing",
    };
  }

  if (interaction.duration > 0) {
    return {
      type: "timed",
      interaction,
      message: `Hold E to work the ${interaction.label}`,
    };
  }

  return completeInteraction(interaction.id, progression);
}

export function completeInteraction(
  interactionId: InteractionId,
  progression: ProgressionState,
): InteractionAttempt {
  if (interactionId === "villageGate") {
    progression.flags.villageGateUnlocked = true;
    return {
      type: "complete",
      message: "Village gate unlocked",
    };
  }

  if (interactionId === "millCrank") {
    progression.flags.millCrankTurned = true;
    return {
      type: "complete",
      message: "Mill crank turned. Chapel route opened",
    };
  }

  if (interactionId === "chapelAltar") {
    progression.flags.chapelEmblemPlaced = true;
    return {
      type: "complete",
      message: "Iron Sun Emblem placed",
    };
  }

  progression.flags.escapeGateUnlocked = true;
  return {
    type: "complete",
    message: "Escape gate unlocked",
  };
}

export function enforceProgressionLocks(player: PlayerState, progression: ProgressionState) {
  if (!progression.flags.villageGateUnlocked && player.position.z < -0.6) {
    player.position.z = -0.6;
    return "The rusted gate needs a key";
  }

  if (
    !progression.flags.millCrankTurned &&
    player.position.z < -27.45 &&
    Math.abs(player.position.x) < 1.65
  ) {
    player.position.z = -27.45;
    return "The chapel route is blocked by the mill mechanism";
  }

  if (!progression.flags.millCrankTurned && player.position.z < -28.6) {
    player.position.z = -28.6;
    return "The chapel route is blocked by the mill mechanism";
  }

  if (!progression.flags.chapelEmblemPlaced && player.position.z < -53.2) {
    player.position.z = -53.2;
    return "The bell tower gate needs the Iron Sun Emblem";
  }

  return null;
}

export function unlockFlagsForZone(index: number, progression: ProgressionState) {
  if (index >= 1) {
    progression.flags.villageGateUnlocked = true;
  }

  if (index >= 2) {
    progression.flags.millCrankTurned = true;
  }

  if (index >= 3) {
    progression.flags.chapelEmblemPlaced = true;
  }
}

function shouldShowInteraction(interaction: InteractionSpec, progression: ProgressionState) {
  if (interaction.id === "villageGate") {
    return !progression.flags.villageGateUnlocked;
  }

  if (interaction.id === "millCrank") {
    return progression.flags.villageGateUnlocked && !progression.flags.millCrankTurned;
  }

  if (interaction.id === "chapelAltar") {
    return progression.flags.millCrankTurned && !progression.flags.chapelEmblemPlaced;
  }

  return progression.flags.bossDefeated && !progression.flags.escapeGateUnlocked;
}

function distance2d(a: Vec3, b: Vec3) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}
