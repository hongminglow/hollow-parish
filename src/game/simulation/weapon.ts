import { handgunConfig, type WeaponConfig } from "../content/weapons";

export type WeaponState = {
  config: WeaponConfig;
  magazineAmmo: number;
  reserveAmmo: number;
  fireCooldownRemaining: number;
  reloadRemaining: number;
  isReloading: boolean;
};

export type WeaponSnapshot = Pick<
  WeaponState,
  "magazineAmmo" | "reserveAmmo" | "fireCooldownRemaining" | "reloadRemaining" | "isReloading"
>;

export type FireAttempt =
  | { fired: true }
  | { fired: false; reason: "not-aiming" | "cooldown" | "reloading" | "empty" };

export function createWeaponState(): WeaponState {
  return {
    config: handgunConfig,
    magazineAmmo: handgunConfig.magazineSize,
    reserveAmmo: 36,
    fireCooldownRemaining: 0,
    reloadRemaining: 0,
    isReloading: false,
  };
}

export function updateWeapon(weapon: WeaponState, deltaSeconds: number) {
  weapon.fireCooldownRemaining = Math.max(0, weapon.fireCooldownRemaining - deltaSeconds);

  if (!weapon.isReloading) {
    return;
  }

  weapon.reloadRemaining = Math.max(0, weapon.reloadRemaining - deltaSeconds);

  if (weapon.reloadRemaining > 0) {
    return;
  }

  const needed = weapon.config.magazineSize - weapon.magazineAmmo;
  const loaded = Math.min(needed, weapon.reserveAmmo);

  weapon.magazineAmmo += loaded;
  weapon.reserveAmmo -= loaded;
  weapon.isReloading = false;
}

export function tryStartReload(weapon: WeaponState) {
  if (
    weapon.isReloading ||
    weapon.reserveAmmo <= 0 ||
    weapon.magazineAmmo >= weapon.config.magazineSize
  ) {
    return false;
  }

  weapon.isReloading = true;
  weapon.reloadRemaining = weapon.config.reloadTime;
  return true;
}

export function tryFireWeapon(weapon: WeaponState, isAiming: boolean): FireAttempt {
  if (!isAiming) {
    return { fired: false, reason: "not-aiming" };
  }

  if (weapon.isReloading) {
    return { fired: false, reason: "reloading" };
  }

  if (weapon.fireCooldownRemaining > 0) {
    return { fired: false, reason: "cooldown" };
  }

  if (weapon.magazineAmmo <= 0) {
    return { fired: false, reason: "empty" };
  }

  weapon.magazineAmmo -= 1;
  weapon.fireCooldownRemaining = weapon.config.fireCooldown;
  return { fired: true };
}

export function addReserveAmmo(weapon: WeaponState, amount: number) {
  const before = weapon.reserveAmmo;
  weapon.reserveAmmo = Math.min(weapon.config.reserveAmmoMax, weapon.reserveAmmo + amount);
  return weapon.reserveAmmo - before;
}

export function createWeaponSnapshot(weapon: WeaponState): WeaponSnapshot {
  return {
    magazineAmmo: weapon.magazineAmmo,
    reserveAmmo: weapon.reserveAmmo,
    fireCooldownRemaining: weapon.fireCooldownRemaining,
    reloadRemaining: weapon.reloadRemaining,
    isReloading: weapon.isReloading,
  };
}

export function restoreWeaponSnapshot(weapon: WeaponState, snapshot: WeaponSnapshot) {
  weapon.magazineAmmo = snapshot.magazineAmmo;
  weapon.reserveAmmo = snapshot.reserveAmmo;
  weapon.fireCooldownRemaining = snapshot.fireCooldownRemaining;
  weapon.reloadRemaining = snapshot.reloadRemaining;
  weapon.isReloading = snapshot.isReloading;
}

export function ensureMinimumAmmo(weapon: WeaponState, minimumTotalAmmo: number) {
  const totalAmmo = weapon.magazineAmmo + weapon.reserveAmmo;

  if (totalAmmo >= minimumTotalAmmo) {
    return false;
  }

  weapon.reserveAmmo += minimumTotalAmmo - totalAmmo;
  return true;
}

export function getAmmoText(weapon: WeaponState) {
  if (weapon.isReloading) {
    return `Reloading ${weapon.magazineAmmo} / ${weapon.reserveAmmo}`;
  }

  return `${weapon.magazineAmmo} / ${weapon.reserveAmmo}`;
}
