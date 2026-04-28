import * as THREE from "three";
import { mapBlockout } from "../../game/content/mapBlockout";
import { createKeyboardMouseInput, type InputFrame } from "../../game/input/keyboardMouse";
import { resolveHitscanShot } from "../../game/simulation/combat";
import {
  alertEnemiesToNoise,
  createEnemies,
  resetEnemies,
  updateEnemies,
} from "../../game/simulation/enemies";
import {
  createPlayerState,
  placePlayerAt,
  respawnPlayer,
  setPlayerSpawn,
  syncPlayerPhysics,
  updatePlayerTimers,
  updatePlayerMoveIntent,
} from "../../game/simulation/player";
import {
  createProgressionState,
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
import { createPlayerView } from "../objects/playerView";
import { createHud } from "../../ui/hud/createHud";
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
  const enemies = createEnemies();
  const progression = createProgressionState();
  const physics = await createPhysicsWorld(player.spawnPosition, mapBlockout.staticColliders);
  const scene = createScene();
  const camera = createCamera();
  const mapView = createMapBlockoutView(scene);
  const enemyView = createEnemyView(scene, enemies);
  const playerView = createPlayerView(scene);
  const combatFeedback = createCombatFeedback(scene);
  const cameraController = createThirdPersonCamera(camera);
  const input = createKeyboardMouseInput(renderer.domElement);
  const hud = createHud(shell);
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
    updateProgression(progression, player.position);
    setPlayerSpawn(player, progression.currentCheckpoint.position);

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

    progression.currentZone = zone;
    progression.currentCheckpoint = checkpoint;
    setPlayerSpawn(player, checkpoint.position);
    placePlayerAt(player, checkpoint.position);
    physics.resetPlayer(checkpoint.position);
  }

  function restartFromCheckpoint() {
    respawnPlayer(player);
    physics.resetPlayer(player.spawnPosition);
    resetEnemies(enemies);
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
    }

    if (player.isDead && frameInput.wasPressed("restart")) {
      restartFromCheckpoint();
      showCombatMessage("Checkpoint restored");
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

    if (!isPaused) {
      cameraController.applyLook(frameInput.mouseDelta);
    }

    if (!isPaused) {
      updateWeapon(weapon, deltaSeconds);
      updateCombatMessage(deltaSeconds);

      accumulator = Math.min(maxAccumulatedTime, accumulator + deltaSeconds);

      while (accumulator >= fixedStep) {
        fixedUpdate(fixedStep, frameInput);
        accumulator -= fixedStep;
        elapsed += fixedStep;
      }
    }

    if (!isPaused && !player.isDead && frameInput.wasPressed("reload")) {
      showCombatMessage(tryStartReload(weapon) ? "Reloading" : "Cannot reload");
    }

    if (player.position.y < -6) {
      respawnPlayer(player);
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
    combatFeedback.update(deltaSeconds);

    if (!isPaused && !player.isDead && frameInput.wasPressed("shoot")) {
      handleShoot();
    }

    hud.update({
      health: player.health,
      ammo: getAmmoText(weapon),
      objective: `${progression.currentZone.name}: ${progression.currentZone.objective}`,
      prompt: frameInput.pointerLocked
        ? "Aim + left click fire | R reload | Enemies now detect, chase, and attack"
        : "Click the canvas to lock pointer. Follow the route from road to bell tower.",
      message: combatMessage,
      isDead: player.isDead,
    });
    hud.setReticleVisible(player.isAiming);

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
