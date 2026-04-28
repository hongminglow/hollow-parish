export type WeaponConfig = {
  id: "handgun";
  name: string;
  damage: number;
  headMultiplier: number;
  magazineSize: number;
  reserveAmmoMax: number;
  fireCooldown: number;
  reloadTime: number;
  range: number;
};

export const handgunConfig: WeaponConfig = {
  id: "handgun",
  name: "Handgun",
  damage: 25,
  headMultiplier: 1.8,
  magazineSize: 12,
  reserveAmmoMax: 60,
  fireCooldown: 0.22,
  reloadTime: 1.3,
  range: 38,
};
