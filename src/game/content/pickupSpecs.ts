import type { Vec3 } from "../simulation/player";
import type { HealingItemId, KeyItemId } from "../simulation/inventory";

export type PickupItem =
  | {
      type: "ammo";
      amount: number;
    }
  | {
      type: "healing";
      itemId: HealingItemId;
      amount: number;
    }
  | {
      type: "key";
      itemId: KeyItemId;
    }
  | {
      type: "note";
      title: string;
    };

export type PickupSpec = {
  id: string;
  label: string;
  position: Vec3;
  radius: number;
  item: PickupItem;
};

export const pickupSpecs: PickupSpec[] = [
  {
    id: "road-ammo",
    label: "Handgun Ammo",
    position: { x: -2.2, y: 0.35, z: 11.2 },
    radius: 1.25,
    item: { type: "ammo", amount: 12 },
  },
  {
    id: "village-gate-key",
    label: "Village Gate Key",
    position: { x: 2.7, y: 0.35, z: 7.4 },
    radius: 1.35,
    item: { type: "key", itemId: "villageGateKey" },
  },
  {
    id: "mill-ammo",
    label: "Handgun Ammo",
    position: { x: 7.8, y: 0.35, z: -21.4 },
    radius: 1.25,
    item: { type: "ammo", amount: 10 },
  },
  {
    id: "mill-herb",
    label: "Small Herb",
    position: { x: 8.7, y: 0.35, z: -20.6 },
    radius: 1.2,
    item: { type: "healing", itemId: "smallHerb", amount: 1 },
  },
  {
    id: "crypt-note",
    label: "Caretaker's Note",
    position: { x: -2.1, y: 0.35, z: -36.5 },
    radius: 1.15,
    item: { type: "note", title: "Caretaker's Note" },
  },
  {
    id: "iron-sun-emblem",
    label: "Iron Sun Emblem",
    position: { x: 7.4, y: 0.35, z: -42.4 },
    radius: 1.35,
    item: { type: "key", itemId: "ironSunEmblem" },
  },
  {
    id: "crypt-mixed-herb",
    label: "Mixed Herb",
    position: { x: 9.1, y: 0.35, z: -44.6 },
    radius: 1.15,
    item: { type: "healing", itemId: "mixedHerb", amount: 1 },
  },
  {
    id: "arena-ammo",
    label: "Handgun Ammo",
    position: { x: -8.4, y: 0.35, z: -60.1 },
    radius: 1.25,
    item: { type: "ammo", amount: 18 },
  },
  {
    id: "arena-first-aid",
    label: "First Aid Spray",
    position: { x: 8.2, y: 0.35, z: -67.4 },
    radius: 1.25,
    item: { type: "healing", itemId: "firstAidSpray", amount: 1 },
  },
];
