import type { CheckpointSnapshot } from "../simulation/checkpoints";

const continueSlotKey = "hollow-parish-continue-slot";

export function saveContinueSlot(snapshot: CheckpointSnapshot) {
  localStorage.setItem(continueSlotKey, JSON.stringify(snapshot));
}

export function loadContinueSlot(): CheckpointSnapshot | null {
  const raw = localStorage.getItem(continueSlotKey);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CheckpointSnapshot;
  } catch {
    localStorage.removeItem(continueSlotKey);
    return null;
  }
}

export function clearContinueSlot() {
  localStorage.removeItem(continueSlotKey);
}
