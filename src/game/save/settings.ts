const volumeStorageKey = "hollow-parish-master-volume";
const defaultVolume = 0.72;

export function readStoredVolume() {
  const stored = localStorage.getItem(volumeStorageKey);

  if (stored === null) {
    return defaultVolume;
  }

  const parsed = Number(stored);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : defaultVolume;
}

export function saveStoredVolume(volume: number) {
  const clamped = Math.max(0, Math.min(1, volume));
  localStorage.setItem(volumeStorageKey, String(clamped));
  return clamped;
}
