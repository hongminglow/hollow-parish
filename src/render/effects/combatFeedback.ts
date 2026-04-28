import * as THREE from "three";
import type { Vec3 } from "../../game/simulation/player";

type TimedEffect = {
  object: THREE.Object3D;
  remaining: number;
};

export function createCombatFeedback(scene: THREE.Scene) {
  const effects: TimedEffect[] = [];
  const group = new THREE.Group();
  group.name = "CombatFeedback";
  scene.add(group);

  function spawnShot(origin: Vec3, hitPoint: Vec3, color = 0xd7a647) {
    const start = new THREE.Vector3(origin.x, origin.y, origin.z);
    const end = new THREE.Vector3(hitPoint.x, hitPoint.y, hitPoint.z);
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.75,
    });
    const line = new THREE.Line(geometry, material);

    group.add(line);
    effects.push({ object: line, remaining: 0.07 });
  }

  function spawnMuzzleFlash(origin: Vec3, direction: Vec3) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 6),
      new THREE.MeshBasicMaterial({
        color: 0xffd46b,
        transparent: true,
        opacity: 0.95,
      }),
    );

    mesh.position.set(
      origin.x + direction.x * 0.65,
      origin.y + direction.y * 0.65,
      origin.z + direction.z * 0.65,
    );
    group.add(mesh);
    effects.push({ object: mesh, remaining: 0.05 });
  }

  function spawnHit(point: Vec3, color = 0xded4b4) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      new THREE.MeshBasicMaterial({ color }),
    );

    mesh.position.set(point.x, point.y, point.z);
    group.add(mesh);
    effects.push({ object: mesh, remaining: 0.16 });
  }

  function update(deltaSeconds: number) {
    for (let index = effects.length - 1; index >= 0; index -= 1) {
      const effect = effects[index];
      effect.remaining -= deltaSeconds;

      if (effect.remaining > 0) {
        continue;
      }

      group.remove(effect.object);

      if (effect.object instanceof THREE.Line) {
        effect.object.geometry.dispose();
        effect.object.material.dispose();
      }

      if (effect.object instanceof THREE.Mesh) {
        effect.object.geometry.dispose();
        disposeMaterial(effect.object.material);
      }

      effects.splice(index, 1);
    }
  }

  function dispose() {
    scene.remove(group);

    for (const effect of effects) {
      group.remove(effect.object);
    }

    effects.length = 0;
  }

  return {
    spawnMuzzleFlash,
    spawnShot,
    spawnHit,
    update,
    dispose,
  };
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
