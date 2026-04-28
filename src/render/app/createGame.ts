import * as THREE from "three";
import { mapBlockout } from "../../game/content/mapBlockout";
import { createKeyboardMouseInput, type InputFrame } from "../../game/input/keyboardMouse";
import {
  createCheckpointSnapshot,
  restoreCheckpointSnapshot,
  type CheckpointSnapshot,
} from "../../game/simulation/checkpoints";
import { resolveHitscanShot } from "../../game/simulation/combat";
import { alertEnemiesToNoise, createEnemies, updateEnemies } from "../../game/simulation/enemies";
import {
  createInventoryState,
  getInventoryRows,
  useBestHealingItem,
} from "../../game/simulation/inventory";
import {
  completeInteraction,
  enforceProgressionLocks,
  findNearbyInteraction,
  getInteractionPrompt,
  tryUseInteraction,
  unlockFlagsForZone,
  type InteractionId,
} from "../../game/simulation/interactions";
import { collectPickup, createPickupState, findNearbyPickup } from "../../game/simulation/pickups";
import {
  createPlayerState,
  placePlayerAt,
  setPlayerSpawn,
  syncPlayerPhysics,
  updatePlayerTimers,
  updatePlayerMoveIntent,
} from "../../game/simulation/player";
import {
  createProgressionState,
  getCurrentObjective,
  getCheckpointForZone,
  getZoneByIndex,
  updateProgression,
} from "../../game/simulation/progression";
import {
  createWeaponState,
  getAmmoText,
  tryFireWeapon,
  tryStartReload,
  updateWeapon,
} from "../../game/simulation/weapon";
import { createDebugPanel } from "../../diagnostics/createDebugPanel";
import { createPhysicsWorld } from "../../physics/world";
import { createCombatFeedback } from "../effects/combatFeedback";
import { createThirdPersonCamera } from "../cameras/thirdPersonCamera";
import { createEnemyView } from "../objects/enemyView";
import { createMapBlockoutView } from "../objects/mapBlockoutView";
import { createPickupView } from "../objects/pickupView";
import { createPlayerView } from "../objects/playerView";
import { createHud } from "../../ui/hud/createHud";
import { createInventoryMenu } from "../../ui/menus/createInventoryMenu";
import { createRuntimeErrorPanel } from "../../ui/overlays/createRuntimeErrorPanel";
import { createCamera } from "./createCamera";
import { createRenderer } from "./createRenderer";
import { createScene } from "./createScene";

const fixedStep = 1 / 60;
const maxAccumulatedTime = fixedStep * 5;

export async function createGame(root: HTMLElement) {
  const shell = document.createElement("div");
  shell.className = "game-shell";
  root.append(shell);

  const renderer = createRenderer();
  shell.append(renderer.domElement);

  const player = createPlayerState(mapBlockout.initialSpawn);
  const weapon = createWeaponState();
  const inventory = createInventoryState();
  const enemies = createEnemies();
  const pickups = createPickupState();
  const progression = createProgressionState();
  const physics = await createPhysicsWorld(player.spawnPosition, mapBlockout.staticColliders);
  const scene = createScene();
  const camera = createCamera();
  const mapView = createMapBlockoutView(scene);
  const enemyView = createEnemyView(scene, enemies);
  const pickupView = createPickupView(scene, pickups);
  const playerView = createPlayerView(scene);
  const combatFeedback = createCombatFeedback(scene);
  const cameraController = createThirdPersonCamera(camera);
  const input = createKeyboardMouseInput(renderer.domElement);
  const hud = createHud(shell);
  const inventoryMenu = createInventoryMenu(shell);
  const debugPanel = createDebugPanel(shell);
  const errorPanel = createRuntimeErrorPanel(shell);

  let animationFrame = 0;
  let previousTime = performance.now();
  let accumulator = 0;
  let elapsed = 0;
  let isPaused = false;
  let frameInput: InputFrame = input.consumeFrame();
  let combatMessage = "";
  let combatMessageRemaining = 0;
  let isInventoryOpen = false;
  let activeInteraction: {
    id: InteractionId;
    label: string;
    remaining: number;
    total: number;
    startHealth: number;
  } | null = null;
  let checkpointSnapshot: CheckpointSnapshot = createCheckpointSnapshot(
    weapon,
    inventory,
    progression,
    pickups,
    enemies,
  );

  function resize() {
    const width = Math.max(1, shell.clientWidth);
    const height = Math.max(1, shell.clientHeight);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function setPaused(nextPaused: boolean) {
    isPaused = nextPaused;
    hud.setPaused(isPaused);
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      setPaused(true);
    }
  }

  function handleContextLost(event: Event) {
    event.preventDefault();
    errorPanel.show("WebGL context was lost. Refresh the page if rendering does not recover.");
  }

  function handleContextRestored() {
    errorPanel.hide();
    resize();
  }

  function saveCheckpointSnapshot() {
    checkpointSnapshot = createCheckpointSnapshot(weapon, inventory, progression, pickups, enemies);
  }

  function syncCheckpointIfChanged(previousCheckpointId: string) {
    if (progression.currentCheckpoint.id === previousCheckpointId) {
      return;
    }

    saveCheckpointSnapshot();
    showCombatMessage(`Checkpoint: ${progression.currentCheckpoint.name}`, 1.2);
  }

  function fixedUpdate(deltaSeconds: number, inputState: InputFrame) {
    updatePlayerTimers(player, deltaSeconds);
    const enemyEvents = updateEnemies(enemies, player, mapBlockout.staticColliders, deltaSeconds);

    const desiredTranslation = updatePlayerMoveIntent(player, {
      movementAxis: inputState.movementAxis(),
      cameraYaw: cameraController.getYaw(),
      isAiming: inputState.isHeld("aim"),
      isSprinting: inputState.isHeld("sprint"),
      deltaSeconds,
    });
    const physicsResult = physics.movePlayer(desiredTranslation, deltaSeconds);

    syncPlayerPhysics(player, physicsResult);
    const previousCheckpointId = progression.currentCheckpoint.id;
    updateProgression(progression, player.position);
    setPlayerSpawn(player, progression.currentCheckpoint.position);
    syncCheckpointIfChanged(previousCheckpointId);

    const lockMessage = enforceProgressionLocks(player, progression);

    if (lockMessage) {
      physics.resetPlayer(player.position);
      updateProgression(progression, player.position);
      setPlayerSpawn(player, progression.currentCheckpoint.position);
      showCombatMessage(lockMessage, 0.9);
    }

    for (const event of enemyEvents) {
      if (event.type === "alerted") {
        showCombatMessage(`${event.enemy.label} noticed you`, 0.7);
      }

      if (event.type === "player-hit") {
        showCombatMessage(`${event.enemy.label} hit you for ${event.damage}`);
      }

      if (event.type === "attack-start") {
        showCombatMessage(`${event.enemy.label} attacks`, 0.55);
      }
    }
  }

  function skipToZone(index: number) {
    const zone = getZoneByIndex(index);
    const checkpoint = getCheckpointForZone(zone);

    unlockFlagsForZone(index, progression);
    progression.currentZone = zone;
    progression.currentCheckpoint = checkpoint;
    setPlayerSpawn(player, checkpoint.position);
    placePlayerAt(player, checkpoint.position);
    physics.resetPlayer(checkpoint.position);
    saveCheckpointSnapshot();
  }

  function restartFromCheckpoint() {
    restoreCheckpointSnapshot(
      checkpointSnapshot,
      player,
      weapon,
      inventory,
      progression,
      pickups,
      enemies,
    );
    physics.resetPlayer(player.spawnPosition);
  }

  function showCombatMessage(message: string, duration = 1.1) {
    combatMessage = message;
    combatMessageRemaining = duration;
  }

  function updateCombatMessage(deltaSeconds: number) {
    combatMessageRemaining = Math.max(0, combatMessageRemaining - deltaSeconds);

    if (combatMessageRemaining === 0) {
      combatMessage = "";
    }
  }

  function setInventoryOpen(nextOpen: boolean) {
    isInventoryOpen = nextOpen;

    if (isInventoryOpen && document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  function handleHeal() {
    const result = useBestHealingItem(inventory, player);
    showCombatMessage(result.message);

    if (result.used) {
      saveCheckpointSnapshot();
    }
  }

  function handleInteract() {
    const pickup = findNearbyPickup(pickups, player.position);

    if (pickup) {
      const result = collectPickup(pickup, inventory, weapon);
      showCombatMessage(result.message);

      if (result.collected) {
        saveCheckpointSnapshot();
      }

      return;
    }

    const interaction = findNearbyInteraction(player.position, progression);

    if (!interaction) {
      showCombatMessage("Nothing nearby", 0.7);
      return;
    }

    const result = tryUseInteraction(interaction, inventory, progression);
    showCombatMessage(result.message);

    if (result.type === "timed") {
      activeInteraction = {
        id: result.interaction.id,
        label: result.interaction.label,
        remaining: result.interaction.duration,
        total: result.interaction.duration,
        startHealth: player.health,
      };
      return;
    }

    if (result.type === "complete") {
      saveCheckpointSnapshot();
    }
  }

  function updateActiveInteraction(deltaSeconds: number, inputState: InputFrame) {
    if (!activeInteraction) {
      return;
    }

    if (!inputState.isHeld("interact")) {
      showCombatMessage(`${activeInteraction.label} interrupted`, 0.7);
      activeInteraction = null;
      return;
    }

    if (player.health < activeInteraction.startHealth) {
      showCombatMessage(`${activeInteraction.label} interrupted by damage`, 0.85);
      activeInteraction = null;
      return;
    }

    activeInteraction.remaining = Math.max(0, activeInteraction.remaining - deltaSeconds);

    if (activeInteraction.remaining > 0) {
      return;
    }

    const result = completeInteraction(activeInteraction.id, progression);
    showCombatMessage(result.message);
    activeInteraction = null;
    saveCheckpointSnapshot();
  }

  function updateBossProgression() {
    if (progression.flags.bossDefeated) {
      return;
    }

    const boss = enemies.find((enemy) => enemy.kind === "boss");

    if (boss?.isDead) {
      progression.flags.bossDefeated = true;
      showCombatMessage("The Bellkeeper is down. Find the escape gate.", 1.4);
      saveCheckpointSnapshot();
    }
  }

  function getPromptText() {
    if (isInventoryOpen) {
      return "Inventory open | Tab close | H heal";
    }

    if (activeInteraction) {
      const progress = Math.round(
        ((activeInteraction.total - activeInteraction.remaining) / activeInteraction.total) * 100,
      );
      return `Hold E: ${activeInteraction.label} ${progress}%`;
    }

    const pickup = findNearbyPickup(pickups, player.position);

    if (pickup) {
      return `E: Collect ${pickup.label}`;
    }

    const interactionPrompt = getInteractionPrompt(
      findNearbyInteraction(player.position, progression),
    );

    if (interactionPrompt) {
      return interactionPrompt;
    }

    return frameInput.pointerLocked
      ? "Aim + left click fire | E interact | H heal | Tab inventory"
      : "Click the canvas to lock pointer. Follow the route from road to bell tower.";
  }

  function getCameraRay() {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    return {
      origin: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      },
      direction: {
        x: direction.x,
        y: direction.y,
        z: direction.z,
      },
    };
  }

  function handleShoot() {
    const attempt = tryFireWeapon(weapon, player.isAiming);

    if (!attempt.fired) {
      if (attempt.reason === "empty") {
        showCombatMessage("Empty");
      }

      if (attempt.reason === "reloading") {
        showCombatMessage("Reloading");
      }

      if (attempt.reason === "not-aiming") {
        showCombatMessage("Aim first");
      }

      return;
    }

    const ray = getCameraRay();
    const wallDistance = physics.castCameraRay(ray.origin, ray.direction, weapon.config.range);
    const result = resolveHitscanShot(weapon, enemies, ray, wallDistance);
    alertEnemiesToNoise(enemies, player.position, weapon.config.range * 0.65);

    combatFeedback.spawnMuzzleFlash(ray.origin, ray.direction);
    combatFeedback.spawnShot(
      ray.origin,
      result.hitPoint,
      result.type === "hit" ? 0xd7a647 : 0x8f9ba2,
    );

    if (result.type === "hit") {
      combatFeedback.spawnHit(result.hitPoint, result.hitPart === "head" ? 0xfff1c4 : 0xd45c3f);
      showCombatMessage(
        result.enemy.isDead
          ? `${result.enemy.label} down`
          : `${result.hitPart.toUpperCase()} ${result.damage}`,
      );
      return;
    }

    if (result.type === "blocked") {
      combatFeedback.spawnHit(result.hitPoint, 0x8f9ba2);
      showCombatMessage("Blocked");
      return;
    }

    showCombatMessage("Miss");
  }

  function render(time: number) {
    const deltaSeconds = Math.min(0.1, (time - previousTime) / 1000);
    previousTime = time;
    frameInput = input.consumeFrame();

    if (frameInput.wasPressed("pause")) {
      setPaused(!isPaused);
      setInventoryOpen(false);
    }

    if (player.isDead && frameInput.wasPressed("restart")) {
      restartFromCheckpoint();
      showCombatMessage("Checkpoint restored");
    }

    if (frameInput.wasPressed("inventory")) {
      setInventoryOpen(!isInventoryOpen);
    }

    if (frameInput.wasPressed("toggleDebug")) {
      debugPanel.toggle();
    }

    if (frameInput.wasPressed("skipRoad")) {
      skipToZone(0);
    }

    if (frameInput.wasPressed("skipMill")) {
      skipToZone(1);
    }

    if (frameInput.wasPressed("skipChapel")) {
      skipToZone(2);
    }

    if (frameInput.wasPressed("skipArena")) {
      skipToZone(3);
    }

    const isGameBlocked = isPaused || isInventoryOpen;

    if (!isGameBlocked) {
      cameraController.applyLook(frameInput.mouseDelta);
    }

    if (!isGameBlocked) {
      updateWeapon(weapon, deltaSeconds);
      updateCombatMessage(deltaSeconds);
      updateActiveInteraction(deltaSeconds, frameInput);
      updateBossProgression();

      accumulator = Math.min(maxAccumulatedTime, accumulator + deltaSeconds);

      while (accumulator >= fixedStep) {
        fixedUpdate(fixedStep, frameInput);
        accumulator -= fixedStep;
        elapsed += fixedStep;
      }
    }

    if (!isGameBlocked && !player.isDead && frameInput.wasPressed("interact")) {
      handleInteract();
    }

    if (!isGameBlocked && !player.isDead && frameInput.wasPressed("heal")) {
      handleHeal();
    }

    if (!isGameBlocked && !player.isDead && frameInput.wasPressed("reload")) {
      showCombatMessage(tryStartReload(weapon) ? "Reloading" : "Cannot reload");
    }

    if (player.position.y < -6) {
      restartFromCheckpoint();
      physics.resetPlayer(player.spawnPosition);
    }

    cameraController.update({
      target: player.position,
      isAiming: player.isAiming,
      deltaSeconds,
      physics,
    });
    playerView.sync(player);
    enemyView.sync();
    pickupView.sync(elapsed);
    combatFeedback.update(deltaSeconds);

    if (!isGameBlocked && !player.isDead && frameInput.wasPressed("shoot")) {
      handleShoot();
    }

    hud.update({
      health: player.health,
      ammo: getAmmoText(weapon),
      objective: getCurrentObjective(progression),
      prompt: getPromptText(),
      message: combatMessage,
      isDead: player.isDead,
    });
    hud.setReticleVisible(player.isAiming && !isInventoryOpen);
    inventoryMenu.update(getInventoryRows(inventory, weapon), isInventoryOpen);

    debugPanel.update({
      fps: deltaSeconds > 0 ? 1 / deltaSeconds : 0,
      playerPosition: player.position,
      elapsed,
      paused: isPaused,
      grounded: player.isGrounded,
      aiming: player.isAiming,
      sprinting: player.isSprinting,
      pointerLocked: frameInput.pointerLocked,
      zoneName: progression.currentZone.name,
      checkpointName: progression.currentCheckpoint.name,
      aliveEnemies: enemies.filter((enemy) => !enemy.isDead).length,
      enemyAi: summarizeEnemyAi(),
      ammo: getAmmoText(weapon),
    });

    renderer.render(scene, camera);
    animationFrame = requestAnimationFrame(render);
  }

  function start() {
    resize();
    input.start();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", handleContextRestored);
    animationFrame = requestAnimationFrame(render);
  }

  function summarizeEnemyAi() {
    const counts = enemies.reduce<Record<string, number>>((summary, enemy) => {
      summary[enemy.state] = (summary[enemy.state] ?? 0) + 1;
      return summary;
    }, {});

    return Object.entries(counts)
      .map(([state, count]) => `${state}:${count}`)
      .join(" ");
  }

  function dispose() {
    cancelAnimationFrame(animationFrame);
    input.stop();
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
    renderer.domElement.removeEventListener("webglcontextrestored", handleContextRestored);
    playerView.dispose();
    enemyView.dispose();
    pickupView.dispose();
    mapView.dispose();
    combatFeedback.dispose();
    physics.dispose();
    renderer.dispose();
    shell.remove();
  }

  return {
    start,
    dispose,
  };
}
