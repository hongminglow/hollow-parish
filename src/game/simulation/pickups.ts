import { pickupSpecs, type PickupSpec } from "../content/pickupSpecs";
import type { WeaponState } from "./weapon";
import { addReserveAmmo } from "./weapon";
import type { InventoryState } from "./inventory";
import { addHealingItem, addKeyItem, addNote, recordAmmoPickup } from "./inventory";
import type { Vec3 } from "./player";

export type PickupState = PickupSpec & {
  isCollected: boolean;
};

export function createPickupState(): PickupState[] {
  return pickupSpecs.map((pickup) => ({
    ...pickup,
    position: { ...pickup.position },
    isCollected: false,
  }));
}

export function findNearbyPickup(pickups: PickupState[], playerPosition: Vec3) {
  return (
    pickups.find(
      (pickup) =>
        !pickup.isCollected && distance2d(pickup.position, playerPosition) <= pickup.radius,
    ) ?? null
  );
}

export function collectPickup(pickup: PickupState, inventory: InventoryState, weapon: WeaponState) {
  if (pickup.isCollected) {
    return {
      collected: false,
      message: "Already collected",
    };
  }

  const { item } = pickup;

  if (item.type === "ammo") {
    const accepted = addReserveAmmo(weapon, item.amount);

    if (accepted <= 0) {
      return {
        collected: false,
        message: "Ammo full",
      };
    }

    recordAmmoPickup(inventory, accepted);
    pickup.isCollected = true;
    return {
      collected: true,
      message: `Picked up ${accepted} handgun ammo`,
    };
  }

  if (item.type === "healing") {
    addHealingItem(inventory, item.itemId, item.amount);
    pickup.isCollected = true;
    return {
      collected: true,
      message: `Picked up ${pickup.label}`,
    };
  }

  if (item.type === "key") {
    addKeyItem(inventory, item.itemId);
    pickup.isCollected = true;
    return {
      collected: true,
      message: `Found ${pickup.label}`,
    };
  }

  addNote(inventory, item.title);
  pickup.isCollected = true;
  return {
    collected: true,
    message: `Read ${item.title}`,
  };
}

export function getCollectedPickupIds(pickups: PickupState[]) {
  return pickups.filter((pickup) => pickup.isCollected).map((pickup) => pickup.id);
}

export function restoreCollectedPickups(pickups: PickupState[], collectedIds: string[]) {
  const collected = new Set(collectedIds);

  for (const pickup of pickups) {
    pickup.isCollected = collected.has(pickup.id);
  }
}

function distance2d(a: Vec3, b: Vec3) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}
