import * as THREE from "three";
import { createGameAudio } from "../../audio/createGameAudio";
import { mapBlockout } from "../../game/content/mapBlockout";
import { createKeyboardMouseInput, type InputFrame } from "../../game/input/keyboardMouse";
import { clearContinueSlot, loadContinueSlot, saveContinueSlot } from "../../game/save/continueSlot";
import { saveStoredVolume } from "../../game/save/settings";
import {
  createBossEncounterState,
  enforceBossArenaLock,
  getBossHudState,
  resetBossEncounter,
  updateBossEncounter,
  type BossEvent,
} from "../../game/simulation/boss";
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
import { enforceMapBounds } from "../../game/simulation/mapBounds";
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
import { loadGltfAsset } from "../loaders/gltfAssetLoader";
import { enemyCharacterAssets, playerCharacterAsset } from "../objects/characterAssets";
import { createEnemyView } from "../objects/enemyView";
import { createEnvironmentPolishView } from "../objects/environmentPolishView";
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

type CharacterPreloadItem = {
  label: string;
  url: string;
};

type LoadingProgress = {
  completed: number;
  total: number;
  label: string;
};

type CreateGameOptions = {
  startMode: "new" | "continue";
  volume: number;
  onReturnToMainMenu: () => void;
};

export async function createGame(root: HTMLElement, options: CreateGameOptions) {
  const shell = document.createElement("div");
  shell.className = "game-shell";
  root.append(shell);

  const renderer = createRenderer();
  shell.append(renderer.domElement);

  const player = createPlayerState(mapBlockout.initialSpawn);
  const weapon = createWeaponState();
  const inventory = createInventoryState();
  const enemies = createEnemies();
  const bossEncounter = createBossEncounterState();
  const pickups = createPickupState();
  const progression = createProgressionState();
  const loadingOverlay = createGameLoadingOverlay(shell);

  try {
    await preloadCharacterAssets(enemies, loadingOverlay.setProgress);
  } finally {
    loadingOverlay.dispose();
  }

  const physics = await createPhysicsWorld(player.spawnPosition, mapBlockout.staticColliders);
  const scene = createScene();
  const camera = createCamera();
  const mapView = createMapBlockoutView(scene);
  const environmentPolishView = createEnvironmentPolishView(scene);
  const enemyView = createEnemyView(scene, enemies);
  const pickupView = createPickupView(scene, pickups);
  const playerView = createPlayerView(scene);
  const combatFeedback = createCombatFeedback(scene);
  const cameraController = createThirdPersonCamera(camera);
  const input = createKeyboardMouseInput(renderer.domElement);
  const audio = createGameAudio();
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
  let volume = options.volume;
  let footstepMeter = 0;
  let nextEnemyGrowlAt = 0;
  const runStats = {
    shotsFired: 0,
    enemiesDefeated: 0,
    pickupsCollected: 0,
  };
  let activeInteraction: {
    id: InteractionId;
    label: string;
    remaining: number;
    total: number;
    startHealth: number;
  } | null = null;
  let wasWon = false;
  let checkpointSnapshot: CheckpointSnapshot = createCheckpointSnapshot(
    weapon,
    inventory,
    progression,
    pickups,
    enemies,
  );
  if (options.startMode === "new") {
    clearContinueSlot();
  } else {
    const savedSlot = loadContinueSlot();

    if (savedSlot) {
      checkpointSnapshot = savedSlot;
      restoreCheckpointSnapshot(savedSlot, player, weapon, inventory, progression, pickups, enemies);
      physics.resetPlayer(player.spawnPosition);
      resetBossEncounter(bossEncounter);

      if (progression.flags.bossDefeated) {
        bossEncounter.isDefeated = true;
      }
    }
  }

  audio.setVolume(volume);
  hud.setVolume(volume);
  hud.setPauseHandlers({
    onResume: () => setPaused(false),
    onMainMenu: returnToMainMenu,
    onWinMainMenu: returnToMainMenu,
    onVolumeChange: setVolume,
  });

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
    audio.ui();

    if (isPaused) {
      releasePointerLock();
    }
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
    saveContinueSlot(checkpointSnapshot);
  }

  function setVolume(nextVolume: number) {
    volume = saveStoredVolume(nextVolume);
    audio.setVolume(volume);
    hud.setVolume(volume);
  }

  function returnToMainMenu() {
    audio.stopBossMusic();
    audio.stopAmbience();
    releasePointerLock();

    options.onReturnToMainMenu();
  }

  function syncCheckpointIfChanged(previousCheckpointId: string) {
    if (progression.currentCheckpoint.id === previousCheckpointId) {
      return;
    }

    saveCheckpointSnapshot();
    showCombatMessage(`Checkpoint: ${progression.currentCheckpoint.name}`, 1.2);
  }

  function fixedUpdate(deltaSeconds: number, inputState: InputFrame, wantsJump: boolean) {
    updatePlayerTimers(player, deltaSeconds);
    const enemyEvents = updateEnemies(enemies, player, mapBlockout.staticColliders, deltaSeconds);

    const desiredTranslation = updatePlayerMoveIntent(player, {
      movementAxis: inputState.movementAxis(),
      cameraYaw: cameraController.getYaw(),
      isAiming: inputState.isHeld("aim"),
      isSprinting: inputState.isHeld("sprint"),
      wantsJump,
      deltaSeconds,
    });
    const physicsResult = physics.movePlayer(desiredTranslation, deltaSeconds);

    syncPlayerPhysics(player, physicsResult);
    updateFootsteps(deltaSeconds);
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

    const boundsMessage = enforceMapBounds(player);

    if (boundsMessage) {
      physics.resetPlayer(player.position);
      updateProgression(progression, player.position);
      showCombatMessage(boundsMessage, 0.8);
    }

    const arenaLockMessage = enforceBossArenaLock(player, bossEncounter);

    if (arenaLockMessage) {
      physics.resetPlayer(player.position);
      showCombatMessage(arenaLockMessage, 0.8);
    }

    const bossEvents = updateBossEncounter(
      bossEncounter,
      enemies,
      player,
      mapBlockout.staticColliders,
      deltaSeconds,
      progression.flags.chapelEmblemPlaced,
    );
    handleBossEvents(bossEvents);

    for (const event of enemyEvents) {
      if (event.type === "alerted") {
        showCombatMessage(`${event.enemy.label} noticed you`, 0.7);
        playEnemyGrowl();
      }

      if (event.type === "player-hit") {
        showCombatMessage(`${event.enemy.label} hit you for ${event.damage}`);
        audio.damage();
        playerView.playDamage();
      }

      if (event.type === "attack-start") {
        showCombatMessage(`${event.enemy.label} attacks`, 0.55);
        playEnemyGrowl();
      }
    }
  }

  function updateFootsteps(deltaSeconds: number) {
    const isMoving =
      !player.isDead &&
      player.isGrounded &&
      (player.movementState === "walk" ||
        player.movementState === "run" ||
        player.movementState === "aim") &&
      Math.hypot(player.velocity.x, player.velocity.z) > 0.15;

    if (!isMoving) {
      footstepMeter = 0;
      return;
    }

    footstepMeter += deltaSeconds * (player.movementState === "run" ? 3.2 : 2.05);

    if (footstepMeter >= 1) {
      footstepMeter %= 1;
      audio.footstep(player.movementState === "run");
    }
  }

  function playEnemyGrowl() {
    if (elapsed < nextEnemyGrowlAt) {
      return;
    }

    nextEnemyGrowlAt = elapsed + 2.8;
    audio.enemyGrowl();
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
    resetBossEncounter(bossEncounter);
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
    resetBossEncounter(bossEncounter);

    if (progression.flags.bossDefeated) {
      bossEncounter.isDefeated = true;
    }
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
    audio.ui();

    if (isInventoryOpen) {
      releasePointerLock();
    }
  }

  function handleHeal() {
    const result = useBestHealingItem(inventory, player);
    showCombatMessage(result.message);

    if (result.used) {
      audio.heal();
      saveCheckpointSnapshot();
    }
  }

  function handleInteract() {
    const pickup = findNearbyPickup(pickups, player.position);

    if (pickup) {
      const result = collectPickup(pickup, inventory, weapon);
      showCombatMessage(result.message);

      if (result.collected) {
        audio.pickup();
        runStats.pickupsCollected += 1;
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
      if (progression.flags.escapeGateUnlocked) {
        showCombatMessage("You escaped the parish", 1.8);
        audio.stopBossMusic();
        audio.win();
      } else {
        audio.gate();
      }

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
    audio.gate();
    saveCheckpointSnapshot();
  }

  function getPromptText() {
    if (progression.flags.escapeGateUnlocked) {
      return "Prototype complete";
    }

    if (isInventoryOpen) {
      return "Inventory open | Tab close | H heal";
    }

    if (activeInteraction) {
      return `Hold E: ${activeInteraction.label}`;
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
      ? "Space jump | Aim + left click fire | E interact | H heal | Tab inventory"
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
    runStats.shotsFired += 1;
    playerView.playShoot();
    audio.shot();

    combatFeedback.spawnMuzzleFlash(ray.origin, ray.direction);
    combatFeedback.spawnShot(
      ray.origin,
      result.hitPoint,
      result.type === "hit" ? 0xd7a647 : 0x8f9ba2,
    );

    if (result.type === "hit") {
      combatFeedback.spawnHit(result.hitPoint, result.hitPart === "head" ? 0xfff1c4 : 0xd45c3f);
      audio.hit();
      if (result.enemy.isDead) {
        runStats.enemiesDefeated += 1;
        audio.enemyDeath();
      }
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

  function handleBossEvents(events: BossEvent[]) {
    for (const event of events) {
      if (event.type === "started") {
        showCombatMessage("The Bellkeeper rises", 1.35);
        audio.startBossMusic();
        audio.boss();
      }

      if (event.type === "phase-two") {
        showCombatMessage("The Bellkeeper breaks its chain", 1.45);
        combatFeedback.spawnArea(event.boss.position, 5.2, 0xd7a647, 0.8);
        audio.boss();
      }

      if (event.type === "charge-windup") {
        showCombatMessage("Charge incoming", 0.7);
      }

      if (event.type === "charge-impact") {
        combatFeedback.spawnHit(event.boss.position, event.hitPlayer ? 0xffd46b : 0x8f9ba2);
        showCombatMessage(event.hitPlayer ? "Crushed by charge" : "Charge missed", 0.8);
        audio.damage();
      }

      if (event.type === "slam-windup") {
        combatFeedback.spawnArea(event.boss.position, event.radius, 0xbd4c32, 1);
        showCombatMessage("Ground slam", 0.75);
      }

      if (event.type === "slam-impact") {
        combatFeedback.spawnArea(event.boss.position, event.radius, 0xffd46b, 0.45);
        showCombatMessage(event.hitPlayer ? "Slam hit" : "Slam missed", 0.8);
        audio.damage();
      }

      if (event.type === "minions-summoned") {
        showCombatMessage(`${event.count} minion${event.count === 1 ? "" : "s"} summoned`, 1);
      }

      if (event.type === "defeated") {
        progression.flags.bossDefeated = true;
        showCombatMessage("The Bellkeeper is down. Find the escape gate.", 1.6);
        audio.stopBossMusic();
        audio.boss();
        saveCheckpointSnapshot();
      }
    }
  }

  function render(time: number) {
    const deltaSeconds = Math.min(0.1, (time - previousTime) / 1000);
    previousTime = time;
    frameInput = input.consumeFrame();

    if (
      frameInput.pressed.size > 0 ||
      frameInput.mouseDelta.x !== 0 ||
      frameInput.mouseDelta.y !== 0
    ) {
      audio.resume();
    }

    if (frameInput.wasPressed("pause")) {
      setPaused(!isPaused);
      setInventoryOpen(false);
    }

    const usedJumpForRestart =
      player.isDead &&
      (frameInput.wasPressed("restart") || frameInput.wasPressed("jump"));

    if (usedJumpForRestart) {
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

    const hasWon = progression.flags.escapeGateUnlocked;
    const isGameBlocked = isPaused || isInventoryOpen || hasWon;

    if (hasWon && !wasWon) {
      releasePointerLock();
    }

    wasWon = hasWon;

    if (!isGameBlocked) {
      cameraController.applyLook(frameInput.mouseDelta);
    }

    if (!isGameBlocked) {
      updateWeapon(weapon, deltaSeconds);
      updateCombatMessage(deltaSeconds);
      updateActiveInteraction(deltaSeconds, frameInput);

      accumulator = Math.min(maxAccumulatedTime, accumulator + deltaSeconds);
      let wantsJump = frameInput.wasPressed("jump") && !usedJumpForRestart;

      while (accumulator >= fixedStep) {
        fixedUpdate(fixedStep, frameInput, wantsJump);
        wantsJump = false;
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
      const startedReload = tryStartReload(weapon);
      showCombatMessage(startedReload ? "Reloading" : "Cannot reload");

      if (startedReload) {
        playerView.playReload();
        audio.reload();
      } else {
        audio.ui();
      }
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
    playerView.sync(player, deltaSeconds);
    mapView.sync(progression.flags);
    enemyView.sync(elapsed);
    pickupView.sync(elapsed);
    environmentPolishView.update(elapsed);
    combatFeedback.update(deltaSeconds);

    if (!isGameBlocked && !player.isDead && frameInput.wasPressed("shoot")) {
      handleShoot();
    }

    hud.update({
      health: player.health,
      stamina: player.stamina,
      ammo: getAmmoText(weapon),
      objective: getCurrentObjective(progression),
      prompt: getPromptText(),
      message: combatMessage,
      interaction: getInteractionHudState(),
      isDead: player.isDead,
      hasWon,
      stats: {
        time: formatElapsedTime(elapsed),
        shotsFired: runStats.shotsFired,
        enemiesDefeated: runStats.enemiesDefeated,
        pickupsCollected: runStats.pickupsCollected,
      },
      boss: getBossHudState(bossEncounter, enemies),
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
      renderCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
    });

    renderer.render(scene, camera);
    animationFrame = requestAnimationFrame(render);
  }

  function start() {
    resize();
    input.start();
    audio.startAmbience();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", handleContextRestored);
    animationFrame = requestAnimationFrame(render);
  }

  function getInteractionHudState() {
    if (!activeInteraction) {
      return {
        isVisible: false,
        label: "",
        progress: 0,
      };
    }

    return {
      isVisible: true,
      label: activeInteraction.label,
      progress:
        ((activeInteraction.total - activeInteraction.remaining) / activeInteraction.total) * 100,
    };
  }

  function releasePointerLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    renderer.domElement.blur();
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

  function formatElapsedTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
    environmentPolishView.dispose();
    mapView.dispose();
    combatFeedback.dispose();
    audio.dispose();
    physics.dispose();
    renderer.dispose();
    shell.remove();
  }

  return {
    start,
    dispose,
  };
}

function createGameLoadingOverlay(parent: HTMLElement) {
  const overlay = document.createElement("section");
  overlay.className = "game-loading-overlay";
  overlay.setAttribute("aria-live", "polite");
  overlay.innerHTML = `
    <div class="game-loading-card">
      <div class="game-loading-kicker">Hollow Parish</div>
      <h1 class="game-loading-title">Preparing the parish</h1>
      <p class="game-loading-copy" data-loading-label>Loading survivor and infected rigs</p>
      <div class="game-loading-track" aria-label="Loading progress">
        <div class="game-loading-fill" data-loading-fill></div>
      </div>
      <strong class="game-loading-percent" data-loading-percent>0%</strong>
    </div>
  `;
  parent.append(overlay);

  const label = requireOverlayElement(overlay, "[data-loading-label]");
  const fill = requireOverlayElement(overlay, "[data-loading-fill]");
  const percent = requireOverlayElement(overlay, "[data-loading-percent]");

  function setProgress(progress: LoadingProgress) {
    const progressPercent =
      progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 100;

    fill.style.width = `${Math.max(0, Math.min(100, progressPercent))}%`;
    percent.textContent = `${progressPercent}%`;
    label.textContent = progress.label;
  }

  setProgress({
    completed: 0,
    total: 1,
    label: "Loading survivor and infected rigs",
  });

  return {
    setProgress,
    dispose() {
      overlay.remove();
    },
  };
}

async function preloadCharacterAssets(
  enemies: ReturnType<typeof createEnemies>,
  onProgress: (progress: LoadingProgress) => void,
) {
  const items = getCharacterPreloadItems(enemies);
  const total = items.length;

  if (total === 0) {
    onProgress({
      completed: 1,
      total: 1,
      label: "No character GLBs enabled",
    });
    return;
  }

  let completed = 0;
  onProgress({
    completed,
    total,
    label: "Loading character GLBs",
  });

  await Promise.all(
    items.map(async (item) => {
      await loadGltfAsset(item.url);
      completed += 1;
      onProgress({
        completed,
        total,
        label: completed === total ? "Assets ready" : `Loaded ${item.label}`,
      });
    }),
  );
}

function getCharacterPreloadItems(enemies: ReturnType<typeof createEnemies>) {
  const items: CharacterPreloadItem[] = [];
  const seenUrls = new Set<string>();
  const pushUnique = (item: CharacterPreloadItem) => {
    if (seenUrls.has(item.url)) {
      return;
    }

    seenUrls.add(item.url);
    items.push(item);
  };

  if (playerCharacterAsset.enabled) {
    pushUnique({
      label: "Player",
      url: playerCharacterAsset.url,
    });
  }

  for (const enemy of enemies) {
    const asset = enemyCharacterAssets[enemy.kind];

    if (!asset.enabled) {
      continue;
    }

    pushUnique({
      label: enemy.kind === "boss" ? "Bellkeeper" : `${enemy.kind} infected`,
      url: asset.url,
    });
  }

  return items;
}

function requireOverlayElement<T extends HTMLElement = HTMLElement>(
  parent: HTMLElement,
  selector: string,
) {
  const element = parent.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing loading overlay element: ${selector}`);
  }

  return element;
}
