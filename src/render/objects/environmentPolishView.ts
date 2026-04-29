import * as THREE from "three";

type FlickerLight = {
  light: THREE.PointLight;
  baseIntensity: number;
  phase: number;
};

type FogWisp = {
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  baseX: number;
  baseZ: number;
  phase: number;
};

export function createEnvironmentPolishView(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = "EnvironmentPolish";
  const flickers: FlickerLight[] = [];
  const wisps: FogWisp[] = [];
  const materials = createMaterials();

  addRoadTrees(group, materials);
  addRoadDressing(group, materials);
  addMillDressing(group, materials, flickers);
  addCryptDressing(group, materials, wisps);
  addArenaDressing(group, materials, flickers, wisps);
  scene.add(group);

  return {
    update(elapsed: number) {
      for (const flicker of flickers) {
        flicker.light.intensity =
          flicker.baseIntensity + Math.sin(elapsed * 5.7 + flicker.phase) * 0.9;
      }

      for (const wisp of wisps) {
        wisp.mesh.position.x = wisp.baseX + Math.sin(elapsed * 0.28 + wisp.phase) * 0.55;
        wisp.mesh.position.z = wisp.baseZ + Math.cos(elapsed * 0.22 + wisp.phase) * 0.42;
        wisp.mesh.rotation.y = elapsed * 0.08 + wisp.phase;
      }
    },
    dispose() {
      scene.remove(group);
      group.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          disposeMaterial(node.material);
        }
      });
      for (const material of Object.values(materials)) {
        material.dispose();
      }
    },
  };
}

function addRoadTrees(group: THREE.Group, materials: ReturnType<typeof createMaterials>) {
  const positions = [
    [-5.9, 14.2],
    [5.7, 13.3],
    [-5.8, 9.4],
    [5.9, 7.1],
    [-5.7, 3.3],
    [5.5, 2.2],
  ];

  for (const [x, z] of positions) {
    group.add(createDeadTree(x, z, materials));
  }
}

function addRoadDressing(group: THREE.Group, materials: ReturnType<typeof createMaterials>) {
  group.add(createRoof(-2.8, 3.6, 2.6, 2.3, 2.45, materials));

  for (const [x, z, rotation, length] of [
    [-4.1, 13.4, 0.12, 2.4],
    [4.1, 11.1, -0.08, 2.2],
    [-4.15, 5.4, -0.05, 2.6],
    [4.08, 3.4, 0.08, 2],
  ]) {
    group.add(createFenceSegment(x, z, rotation, length, materials));
  }
}

function addMillDressing(
  group: THREE.Group,
  materials: ReturnType<typeof createMaterials>,
  flickers: FlickerLight[],
) {
  group.add(createRoof(-5.4, -12.2, 4.4, 8.6, 3.15, materials));
  group.add(createRoof(7.4, -18.2, 4.2, 3.7, 2.75, materials));
  group.add(createLantern(5.25, -17.2, materials, flickers));
  group.add(createLantern(-8.7, -23.3, materials, flickers));

  for (const [x, z] of [
    [-1.2, -10.2],
    [2.9, -19.4],
    [-7.1, -17.8],
  ]) {
    group.add(createCrateStack(x, z, materials));
  }
}

function addCryptDressing(
  group: THREE.Group,
  materials: ReturnType<typeof createMaterials>,
  wisps: FogWisp[],
) {
  group.add(createChapelFacadeDetails(materials));
  group.add(createArchway(0, -36.4, materials));

  for (const [x, z, rotation] of [
    [-2.3, -39.2, -0.22],
    [2.2, -40.4, 0.2],
    [-2.1, -45.2, 0.12],
    [2.1, -47.4, -0.15],
    [8.8, -40.5, 0.3],
  ]) {
    group.add(createGraveMarker(x, z, rotation, materials));
  }

  addFogWisp(group, 0.6, -43.2, 1.5, materials, wisps);
  addFogWisp(group, 7.6, -42.7, 1.2, materials, wisps);
}

function addArenaDressing(
  group: THREE.Group,
  materials: ReturnType<typeof createMaterials>,
  flickers: FlickerLight[],
  wisps: FogWisp[],
) {
  group.add(createLantern(-4.9, -58.2, materials, flickers));
  group.add(createLantern(4.9, -68.8, materials, flickers));
  group.add(createBellChains(materials));
  group.add(createRubbleRing(materials));
  addFogWisp(group, -4.7, -63.1, 2.2, materials, wisps);
  addFogWisp(group, 4.8, -65.7, 2.6, materials, wisps);
}

function createRoof(
  x: number,
  z: number,
  width: number,
  depth: number,
  y: number,
  materials: ReturnType<typeof createMaterials>,
) {
  const roof = new THREE.Group();
  const left = new THREE.Mesh(new THREE.BoxGeometry(width * 0.62, 0.18, depth), materials.roof);
  const right = new THREE.Mesh(new THREE.BoxGeometry(width * 0.62, 0.18, depth), materials.roof);

  left.position.set(-width * 0.23, 0, 0);
  right.position.set(width * 0.23, 0, 0);
  left.rotation.z = 0.42;
  right.rotation.z = -0.42;
  roof.position.set(x, y, z);
  roof.add(left, right);
  return roof;
}

function createFenceSegment(
  x: number,
  z: number,
  rotation: number,
  length: number,
  materials: ReturnType<typeof createMaterials>,
) {
  const fence = new THREE.Group();
  const railTop = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, 0.08), materials.darkWood);
  const railBottom = new THREE.Mesh(new THREE.BoxGeometry(length, 0.07, 0.07), materials.darkWood);

  railTop.position.y = 0.86;
  railBottom.position.y = 0.48;
  fence.add(railTop, railBottom);

  for (const offset of [-length / 2 + 0.15, length / 2 - 0.15]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.05, 0.12), materials.darkWood);
    post.position.set(offset, 0.52, 0);
    fence.add(post);
  }

  fence.position.set(x, 0, z);
  fence.rotation.y = rotation;
  return fence;
}

function createChapelFacadeDetails(materials: ReturnType<typeof createMaterials>) {
  const group = new THREE.Group();
  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.26, 3.2, 0.28), materials.stone);
  const rightPillar = leftPillar.clone();
  const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.35, 0.08), materials.iron);
  const windowGlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 1.05, 0.04),
    materials.coldGlass,
  );
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.1, 0.08), materials.iron);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.12, 0.08), materials.iron);

  leftPillar.position.set(-2.55, 1.6, -31.04);
  rightPillar.position.set(2.55, 1.6, -31.04);
  windowFrame.position.set(0, 2.55, -31.02);
  windowGlow.position.set(0, 2.55, -30.98);
  crossV.position.set(0, 4.05, -31);
  crossH.position.set(0, 4.16, -30.98);
  group.add(leftPillar, rightPillar, windowFrame, windowGlow, crossV, crossH);
  return group;
}

function createArchway(x: number, z: number, materials: ReturnType<typeof createMaterials>) {
  const group = new THREE.Group();
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.9, 0.18), materials.stone);
  const right = left.clone();
  const top = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.08, 8, 24, Math.PI), materials.stone);

  left.position.set(-0.92, 0.95, 0);
  right.position.set(0.92, 0.95, 0);
  top.position.set(0, 1.9, 0);
  top.rotation.z = Math.PI;
  group.position.set(x, 0, z);
  group.add(left, right, top);
  return group;
}

function createRubbleRing(materials: ReturnType<typeof createMaterials>) {
  const ring = new THREE.Group();

  for (let index = 0; index < 16; index += 1) {
    const angle = (index / 16) * Math.PI * 2;
    const radius = 6.4 + Math.sin(index * 1.7) * 0.45;
    const stone = new THREE.Mesh(
      new THREE.BoxGeometry(0.45 + (index % 3) * 0.08, 0.22, 0.34),
      materials.stone,
    );

    stone.position.set(Math.cos(angle) * radius, 0.11, -63.5 + Math.sin(angle) * radius);
    stone.rotation.y = angle + 0.4;
    ring.add(stone);
  }

  return ring;
}

function createDeadTree(x: number, z: number, materials: ReturnType<typeof createMaterials>) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.24, 2.7, 6), materials.bark);
  const branchA = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 1.3, 6), materials.bark);
  const branchB = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.07, 1.05, 6), materials.bark);

  trunk.position.y = 1.35;
  trunk.rotation.z = (x > 0 ? -1 : 1) * 0.08;
  branchA.position.set(0.22, 2.1, 0);
  branchA.rotation.z = -0.78;
  branchB.position.set(-0.16, 1.75, 0.06);
  branchB.rotation.z = 0.68;
  tree.position.set(x, 0, z);
  tree.add(trunk, branchA, branchB);
  return tree;
}

function createLantern(
  x: number,
  z: number,
  materials: ReturnType<typeof createMaterials>,
  flickers: FlickerLight[],
) {
  const group = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.5, 6), materials.darkWood);
  const hook = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 0.05), materials.darkWood);
  const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.22), materials.lantern);
  const light = new THREE.PointLight(0xd79a45, 5.6, 7.5, 1.9);

  post.position.y = 0.75;
  hook.position.set(0.18, 1.5, 0);
  lantern.position.set(0.36, 1.25, 0);
  light.position.copy(lantern.position);
  group.position.set(x, 0, z);
  group.add(post, hook, lantern, light);
  flickers.push({ light, baseIntensity: 5.4, phase: Math.abs(x * 0.7 + z * 0.11) });
  return group;
}

function createCrateStack(x: number, z: number, materials: ReturnType<typeof createMaterials>) {
  const group = new THREE.Group();
  const sizes = [
    [0.7, 0.45, 0.62, 0, 0.22, 0],
    [0.48, 0.36, 0.48, 0.38, 0.18, 0.1],
    [0.52, 0.32, 0.44, -0.24, 0.6, -0.08],
  ];

  for (const [sx, sy, sz, ox, oy, oz] of sizes) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), materials.crate);
    crate.position.set(ox, oy, oz);
    crate.rotation.y = ox * 0.45;
    group.add(crate);
  }

  group.position.set(x, 0, z);
  return group;
}

function createGraveMarker(
  x: number,
  z: number,
  rotation: number,
  materials: ReturnType<typeof createMaterials>,
) {
  const marker = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.78, 0.12), materials.stone);
  marker.position.set(x, 0.39, z);
  marker.rotation.z = rotation;
  return marker;
}

function createBellChains(materials: ReturnType<typeof createMaterials>) {
  const group = new THREE.Group();

  for (const x of [-0.72, 0.72]) {
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 5.2, 8), materials.metal);
    chain.position.set(x, 3.8, -63.2);
    group.add(chain);
  }

  const bell = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.82, 12, 1, true), materials.metal);
  bell.position.set(0, 6.1, -63.2);
  bell.rotation.x = Math.PI;
  group.add(bell);
  return group;
}

function addFogWisp(
  group: THREE.Group,
  x: number,
  z: number,
  scale: number,
  materials: ReturnType<typeof createMaterials>,
  wisps: FogWisp[],
) {
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(1.4 * scale, 24), materials.fog);
  mesh.position.set(x, 0.08, z);
  mesh.rotation.x = -Math.PI / 2;
  group.add(mesh);
  wisps.push({ mesh, baseX: x, baseZ: z, phase: Math.abs(x * 0.41 + z * 0.13) });
}

function createMaterials() {
  return {
    bark: new THREE.MeshStandardMaterial({ color: 0x211a13, roughness: 0.96 }),
    darkWood: new THREE.MeshStandardMaterial({ color: 0x342318, roughness: 0.9 }),
    crate: new THREE.MeshStandardMaterial({ color: 0x5a3821, roughness: 0.82 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x261a14, roughness: 0.94 }),
    stone: new THREE.MeshStandardMaterial({ color: 0x454847, roughness: 0.94 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x191918, roughness: 0.72, metalness: 0.22 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x5c5447, roughness: 0.72, metalness: 0.2 }),
    coldGlass: new THREE.MeshStandardMaterial({
      color: 0x516a70,
      emissive: 0x26383d,
      emissiveIntensity: 1.1,
      roughness: 0.38,
    }),
    lantern: new THREE.MeshStandardMaterial({
      color: 0xf0b45b,
      emissive: 0xd79a45,
      emissiveIntensity: 1.6,
      roughness: 0.55,
    }),
    fog: new THREE.MeshBasicMaterial({
      color: 0x9fb2b5,
      transparent: true,
      opacity: 0.085,
      depthWrite: false,
    }),
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
