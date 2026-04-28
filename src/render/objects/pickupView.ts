import * as THREE from "three";
import type { PickupState } from "../../game/simulation/pickups";

type PickupVisual = {
  pickup: PickupState;
  group: THREE.Group;
  beacon: THREE.Mesh;
};

const pickupColors: Record<PickupState["item"]["type"], number> = {
  ammo: 0xd7a647,
  healing: 0x76a66a,
  key: 0x8db7d6,
  note: 0xc7c0a6,
};

export function createPickupView(scene: THREE.Scene, pickups: PickupState[]) {
  const group = new THREE.Group();
  group.name = "PickupPlaceholders";
  const visuals = pickups.map(createPickupVisual);

  for (const visual of visuals) {
    group.add(visual.group);
  }

  scene.add(group);

  return {
    sync(elapsed: number) {
      for (const visual of visuals) {
        syncPickupVisual(visual, elapsed);
      }
    },
    dispose() {
      scene.remove(group);
      group.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          disposeMaterial(node.material);
        }

        if (node instanceof THREE.Sprite) {
          disposeMaterial(node.material);
        }
      });
    },
  };
}

function createPickupVisual(pickup: PickupState): PickupVisual {
  const group = new THREE.Group();
  const color = pickupColors[pickup.item.type];
  const beacon = new THREE.Mesh(
    pickup.item.type === "key"
      ? new THREE.OctahedronGeometry(0.28)
      : new THREE.BoxGeometry(0.42, 0.22, 0.42),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.35,
      roughness: 0.72,
    }),
  );
  const label = createLabelSprite(pickup.label, color);

  group.name = pickup.id;
  group.position.set(pickup.position.x, pickup.position.y, pickup.position.z);
  beacon.position.y = 0.3;
  label.position.y = 1.05;
  group.add(beacon, label);

  return {
    pickup,
    group,
    beacon,
  };
}

function syncPickupVisual(visual: PickupVisual, elapsed: number) {
  visual.group.visible = !visual.pickup.isCollected;
  visual.beacon.rotation.y = elapsed * 1.6;
  visual.beacon.position.y = 0.3 + Math.sin(elapsed * 3.2 + visual.pickup.position.x) * 0.07;
}

function createLabelSprite(text: string, color: number) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = 512;
  canvas.height = 128;

  if (!context) {
    throw new Error("Unable to create pickup label canvas context.");
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(6, 8, 8, 0.68)";
  context.strokeStyle = `#${color.toString(16).padStart(6, "0")}`;
  context.lineWidth = 4;
  context.beginPath();
  context.roundRect(10, 28, 492, 72, 18);
  context.fill();
  context.stroke();
  context.fillStyle = "#f3ead9";
  context.font = "700 30px Trebuchet MS, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, 64, 460);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    }),
  );

  sprite.scale.set(2.4, 0.6, 1);
  return sprite;
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    for (const item of material) {
      item.dispose();
    }

    return;
  }

  if (material instanceof THREE.SpriteMaterial) {
    material.map?.dispose();
  }

  material.dispose();
}
