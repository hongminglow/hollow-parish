import * as THREE from "three";
import {
  mapBlockout,
  type MapMarkerKind,
  type MapMarkerSpec,
  type MapVisualSpec,
} from "../../game/content/mapBlockout";

const markerColors: Record<MapMarkerKind, number> = {
  enemy: 0xb95b44,
  loot: 0x76a66a,
  checkpoint: 0x6aa7c8,
  interaction: 0xd7a647,
  boss: 0x9c5656,
  route: 0xc7c0a6,
};

export function createMapBlockoutView(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = "Phase2MapBlockout";

  for (const collider of mapBlockout.staticColliders) {
    const mesh = createBoxMesh(
      collider.name,
      collider.position,
      {
        x: collider.halfExtents.x * 2,
        y: collider.halfExtents.y * 2,
        z: collider.halfExtents.z * 2,
      },
      collider.color,
    );

    mesh.castShadow = collider.name !== "RoadFloor" && collider.name !== "MillYardFloor";
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  for (const visual of mapBlockout.visualObjects) {
    group.add(createVisualObject(visual));
  }

  for (const marker of mapBlockout.markers) {
    group.add(createMarker(marker));
  }

  for (const zone of mapBlockout.zones) {
    const label = createLabelSprite(zone.name, 0xe8d6ad);
    label.position.set(zone.bounds.center.x, 2.7, zone.bounds.center.z);
    group.add(label);
  }

  for (const lightMarker of mapBlockout.lights) {
    const light = new THREE.PointLight(
      lightMarker.color,
      lightMarker.intensity,
      lightMarker.distance,
      1.8,
    );
    light.name = lightMarker.name;
    light.position.set(lightMarker.position.x, lightMarker.position.y, lightMarker.position.z);
    group.add(light);
  }

  scene.add(group);

  return {
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

function createVisualObject(visual: MapVisualSpec) {
  if (visual.kind === "cylinder") {
    const material = createMaterial(visual.color, visual.emissive);
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(visual.size.x, visual.size.z, visual.size.y, 8),
      material,
    );

    mesh.name = visual.name;
    mesh.position.set(visual.position.x, visual.position.y, visual.position.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  return createBoxMesh(visual.name, visual.position, visual.size, visual.color, visual.emissive);
}

function createMarker(marker: MapMarkerSpec) {
  const group = new THREE.Group();
  const color = markerColors[marker.kind];
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.24, marker.kind === "boss" ? 1.7 : 0.7, 8),
    createMaterial(color),
  );
  const label = createLabelSprite(marker.label, color);

  group.name = marker.name;
  group.position.set(marker.position.x, marker.position.y, marker.position.z);
  post.position.y = marker.kind === "boss" ? 0.85 : 0.35;
  post.castShadow = true;
  label.position.y = marker.kind === "boss" ? 2 : 1.1;
  group.add(post, label);

  return group;
}

function createBoxMesh(
  name: string,
  position: THREE.Vector3Like,
  size: THREE.Vector3Like,
  color: number,
  emissive?: number,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size.x, size.y, size.z),
    createMaterial(color, emissive),
  );

  mesh.name = name;
  mesh.position.set(position.x, position.y, position.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

function createMaterial(color: number, emissive?: number) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: emissive ?? 0x000000,
    emissiveIntensity: emissive ? 0.7 : 0,
    roughness: 0.86,
    metalness: 0.03,
  });
}

function createLabelSprite(text: string, color: number) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = 512;
  canvas.height = 128;

  if (!context) {
    throw new Error("Unable to create label canvas context.");
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(6, 8, 8, 0.72)";
  context.strokeStyle = `#${color.toString(16).padStart(6, "0")}`;
  context.lineWidth = 4;
  roundRect(context, 10, 24, 492, 78, 20);
  context.fill();
  context.stroke();
  context.fillStyle = "#f3ead9";
  context.font = "700 32px Trebuchet MS, sans-serif";
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

  sprite.name = `${text}Label`;
  sprite.scale.set(3.3, 0.82, 1);

  return sprite;
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
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
