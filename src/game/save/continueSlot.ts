import type { CheckpointSnapshot } from "../simulation/checkpoints";

const continueSlotKey = "hollow-parish-continue-slot";

export function saveContinueSlot(snapshot: CheckpointSnapshot) {
  if (snapshot.progressionFlags.escapeGateUnlocked) {
    clearContinueSlot();
    return;
  }

  localStorage.setItem(continueSlotKey, JSON.stringify(snapshot));
}

export function loadContinueSlot(): CheckpointSnapshot | null {
  const raw = localStorage.getItem(continueSlotKey);

  if (!raw) {
    return null;
  }

  try {
    const snapshot = JSON.parse(raw) as CheckpointSnapshot;

    if (snapshot.progressionFlags.escapeGateUnlocked) {
      clearContinueSlot();
      return null;
    }

    return snapshot;
  } catch {
    clearContinueSlot();
    return null;
  }
}

export function clearContinueSlot() {
  localStorage.removeItem(continueSlotKey);
}
