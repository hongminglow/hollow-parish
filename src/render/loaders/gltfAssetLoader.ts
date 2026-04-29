import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

type LoadedGltfAsset = {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
};

export type AttachedGltfAsset = {
  root: THREE.Object3D;
  animations: THREE.AnimationClip[];
};

type GltfAttachmentOptions = {
  url: string;
  name: string;
  scale?: number;
  targetHeight?: number;
  position?: Partial<Pick<THREE.Vector3, "x" | "y" | "z">>;
  rotationY?: number;
};

const gltfLoader = new GLTFLoader();
const assetCache = new Map<string, Promise<LoadedGltfAsset | null>>();

export function loadGltfAsset(url: string) {
  const cachedAsset = assetCache.get(url);

  if (cachedAsset) {
    return cachedAsset;
  }

  const assetPromise = loadOptionalGltfAsset(url);
  assetCache.set(url, assetPromise);
  return assetPromise;
}

export async function attachGltfAsset(parent: THREE.Object3D, options: GltfAttachmentOptions) {
  const loadedAsset = await loadGltfAsset(options.url);

  if (!loadedAsset) {
    return null;
  }

  const root = new THREE.Group();
  const model = cloneGltfScene(loadedAsset.scene);

  root.name = options.name;
  root.userData.skipRuntimeDispose = true;
  model.name = `${options.name}Model`;
  model.rotation.y = options.rotationY ?? 0;
  root.add(model);

  if (!normalizeModel(model, options)) {
    console.warn(`[assets] GLB bounds are invalid, using procedural fallback: ${options.url}`);
    return null;
  }

  root.position.set(options.position?.x ?? 0, options.position?.y ?? 0, options.position?.z ?? 0);
  root.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.castShadow = true;
      node.receiveShadow = true;
      node.frustumCulled = true;
    }
  });
  parent.add(root);

  return {
    root,
    animations: loadedAsset.animations,
  } satisfies AttachedGltfAsset;
}

function cloneGltfScene(scene: THREE.Group) {
  return hasSkinnedMesh(scene) ? cloneSkeleton(scene) : scene.clone(true);
}

function hasSkinnedMesh(root: THREE.Object3D) {
  let skinned = false;

  root.traverse((node) => {
    if (node instanceof THREE.SkinnedMesh) {
      skinned = true;
    }
  });

  return skinned;
}

function normalizeModel(model: THREE.Object3D, options: GltfAttachmentOptions) {
  model.updateWorldMatrix(true, true);
  const initialBounds = new THREE.Box3().setFromObject(model);
  const initialSize = initialBounds.getSize(new THREE.Vector3());
  const targetHeight = options.targetHeight;
  const baseScale = options.scale ?? 1;

  if (!isValidSize(initialSize)) {
    return false;
  }

  if (targetHeight && initialSize.y > 0.0001) {
    model.scale.multiplyScalar((targetHeight / initialSize.y) * baseScale);
  } else {
    model.scale.multiplyScalar(baseScale);
  }

  model.updateWorldMatrix(true, true);
  const normalizedBounds = new THREE.Box3().setFromObject(model);
  const normalizedCenter = normalizedBounds.getCenter(new THREE.Vector3());
  const normalizedSize = normalizedBounds.getSize(new THREE.Vector3());

  if (!isValidSize(normalizedSize)) {
    return false;
  }

  model.position.x -= normalizedCenter.x;
  model.position.y -= normalizedBounds.min.y;
  model.position.z -= normalizedCenter.z;
  return true;
}

function isValidSize(size: THREE.Vector3) {
  return (
    Number.isFinite(size.x) &&
    Number.isFinite(size.y) &&
    Number.isFinite(size.z) &&
    size.x > 0.0001 &&
    size.y > 0.0001 &&
    size.z > 0.0001
  );
}

export function disposeObjectTree(root: THREE.Object3D) {
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) {
      return;
    }

    node.geometry.dispose();
    disposeMaterial(node.material);
  });
}

async function loadOptionalGltfAsset(url: string): Promise<LoadedGltfAsset | null> {
  if (!(await assetExists(url))) {
    console.info(`[assets] Optional GLB missing, using procedural fallback: ${url}`);
    return null;
  }

  try {
    const gltf = await gltfLoader.loadAsync(url);
    return {
      scene: gltf.scene,
      animations: gltf.animations,
    };
  } catch (error) {
    console.warn(`[assets] Could not load GLB, using procedural fallback: ${url}`, error);
    return null;
  }
}

async function assetExists(url: string) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    for (const item of material) {
      item.dispose();
    }

    return;
  }

  material.dispose();
}
