import type { WeaponState } from "./weapon";
import { healPlayer, type PlayerState } from "./player";

export type HealingItemId = "smallHerb" | "mixedHerb" | "firstAidSpray";
export type KeyItemId = "villageGateKey" | "ironSunEmblem";

export type InventoryState = {
  ammoCollected: number;
  healing: Record<HealingItemId, number>;
  keyItems: Record<KeyItemId, boolean>;
  notes: string[];
};

export type InventorySnapshot = {
  ammoCollected: number;
  healing: Record<HealingItemId, number>;
  keyItems: Record<KeyItemId, boolean>;
  notes: string[];
};

export type InventoryRow = {
  label: string;
  value: string;
};

const healingPriority: HealingItemId[] = ["smallHerb", "mixedHerb", "firstAidSpray"];

const healingLabels: Record<HealingItemId, string> = {
  smallHerb: "Small Herb",
  mixedHerb: "Mixed Herb",
  firstAidSpray: "First Aid Spray",
};

const healingAmounts: Record<HealingItemId, number> = {
  smallHerb: 25,
  mixedHerb: 50,
  firstAidSpray: 100,
};

const keyItemLabels: Record<KeyItemId, string> = {
  villageGateKey: "Village Gate Key",
  ironSunEmblem: "Iron Sun Emblem",
};

export function createInventoryState(): InventoryState {
  return {
    ammoCollected: 0,
    healing: {
      smallHerb: 0,
      mixedHerb: 0,
      firstAidSpray: 0,
    },
    keyItems: {
      villageGateKey: false,
      ironSunEmblem: false,
    },
    notes: [],
  };
}

export function recordAmmoPickup(inventory: InventoryState, amount: number) {
  inventory.ammoCollected += amount;
}

export function addHealingItem(inventory: InventoryState, itemId: HealingItemId, amount = 1) {
  inventory.healing[itemId] += amount;
}

export function addKeyItem(inventory: InventoryState, itemId: KeyItemId) {
  inventory.keyItems[itemId] = true;
}

export function addNote(inventory: InventoryState, title: string) {
  if (!inventory.notes.includes(title)) {
    inventory.notes.push(title);
  }
}

export function hasKeyItem(inventory: InventoryState, itemId: KeyItemId) {
  return inventory.keyItems[itemId];
}

export function useBestHealingItem(inventory: InventoryState, player: PlayerState) {
  for (const itemId of healingPriority) {
    if (inventory.healing[itemId] <= 0) {
      continue;
    }

    if (!healPlayer(player, healingAmounts[itemId])) {
      return {
        used: false,
        message: player.isDead ? "Cannot heal while down" : "Health already full",
      };
    }

    inventory.healing[itemId] -= 1;
    return {
      used: true,
      message: `Used ${healingLabels[itemId]}`,
    };
  }

  return {
    used: false,
    message: "No healing items",
  };
}

export function createInventorySnapshot(inventory: InventoryState): InventorySnapshot {
  return {
    ammoCollected: inventory.ammoCollected,
    healing: { ...inventory.healing },
    keyItems: { ...inventory.keyItems },
    notes: [...inventory.notes],
  };
}

export function restoreInventorySnapshot(inventory: InventoryState, snapshot: InventorySnapshot) {
  inventory.ammoCollected = snapshot.ammoCollected;
  inventory.healing = { ...snapshot.healing };
  inventory.keyItems = { ...snapshot.keyItems };
  inventory.notes = [...snapshot.notes];
}

export function getInventoryRows(inventory: InventoryState, weapon: WeaponState): InventoryRow[] {
  return [
    {
      label: "Handgun Ammo",
      value: `${weapon.magazineAmmo} loaded / ${weapon.reserveAmmo} reserve`,
    },
    { label: "Ammo Scavenged", value: `${inventory.ammoCollected}` },
    { label: healingLabels.smallHerb, value: `${inventory.healing.smallHerb}` },
    { label: healingLabels.mixedHerb, value: `${inventory.healing.mixedHerb}` },
    { label: healingLabels.firstAidSpray, value: `${inventory.healing.firstAidSpray}` },
    {
      label: "Key Items",
      value:
        Object.entries(inventory.keyItems)
          .filter(([, owned]) => owned)
          .map(([itemId]) => keyItemLabels[itemId as KeyItemId])
          .join(", ") || "None",
    },
    { label: "Notes", value: inventory.notes.join(", ") || "None" },
  ];
}
