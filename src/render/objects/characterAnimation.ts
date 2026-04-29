import * as THREE from "three";

type PlayOptions = {
  fadeSeconds?: number;
  once?: boolean;
};

export type CharacterAnimationController = {
  play: (candidates: string[], options?: PlayOptions) => boolean;
  stop: (fadeSeconds?: number) => void;
  update: (deltaSeconds: number) => void;
  dispose: () => void;
};

export function createCharacterAnimationController(
  root: THREE.Object3D,
  clips: THREE.AnimationClip[],
): CharacterAnimationController | null {
  if (clips.length === 0) {
    return null;
  }

  const mixer = new THREE.AnimationMixer(root);
  const actions = new Map<string, THREE.AnimationAction>();
  let activeAction: THREE.AnimationAction | null = null;

  for (const clip of clips) {
    actions.set(normalizeClipName(clip.name), mixer.clipAction(clip));
  }

  return {
    play(candidates, options = {}) {
      const nextAction = findAction(actions, candidates);

      if (!nextAction) {
        return false;
      }

      if (nextAction === activeAction) {
        return true;
      }

      const fadeSeconds = options.fadeSeconds ?? 0.15;
      nextAction.enabled = true;
      nextAction.clampWhenFinished = Boolean(options.once);
      nextAction.loop = options.once ? THREE.LoopOnce : THREE.LoopRepeat;
      nextAction.reset().fadeIn(fadeSeconds).play();

      if (activeAction) {
        activeAction.fadeOut(fadeSeconds);
      }

      activeAction = nextAction;
      return true;
    },
    stop(fadeSeconds = 0.12) {
      if (!activeAction) {
        mixer.stopAllAction();
        return;
      }

      activeAction.fadeOut(fadeSeconds);
      activeAction = null;
    },
    update(deltaSeconds) {
      mixer.update(deltaSeconds);
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
    },
  };
}

function findAction(actions: Map<string, THREE.AnimationAction>, candidates: string[]) {
  for (const candidate of candidates) {
    const directMatch = actions.get(normalizeClipName(candidate));

    if (directMatch) {
      return directMatch;
    }
  }

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeClipName(candidate);

    for (const [clipName, action] of actions) {
      if (clipName.includes(normalizedCandidate)) {
        return action;
      }
    }
  }

  return null;
}

function normalizeClipName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}
