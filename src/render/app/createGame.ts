import { mapBlockout } from "../../game/content/mapBlockout";
import { createKeyboardMouseInput, type InputFrame } from "../../game/input/keyboardMouse";
import {
  createPlayerState,
  placePlayerAt,
  respawnPlayer,
  setPlayerSpawn,
  syncPlayerPhysics,
  updatePlayerMoveIntent,
} from "../../game/simulation/player";
import {
  createProgressionState,
  getCheckpointForZone,
  getZoneByIndex,
  updateProgression,
} from "../../game/simulation/progression";
import { createDebugPanel } from "../../diagnostics/createDebugPanel";
import { createPhysicsWorld } from "../../physics/world";
import { createThirdPersonCamera } from "../cameras/thirdPersonCamera";
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
  const progression = createProgressionState();
  const physics = await createPhysicsWorld(player.spawnPosition, mapBlockout.staticColliders);
  const scene = createScene();
  const camera = createCamera();
  const mapView = createMapBlockoutView(scene);
  const playerView = createPlayerView(scene);
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

  function render(time: number) {
    const deltaSeconds = Math.min(0.1, (time - previousTime) / 1000);
    previousTime = time;
    frameInput = input.consumeFrame();

    if (frameInput.wasPressed("pause")) {
      setPaused(!isPaused);
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
      accumulator = Math.min(maxAccumulatedTime, accumulator + deltaSeconds);

      while (accumulator >= fixedStep) {
        fixedUpdate(fixedStep, frameInput);
        accumulator -= fixedStep;
        elapsed += fixedStep;
      }
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

    hud.update({
      health: player.health,
      ammo: "12 / 36",
      objective: `${progression.currentZone.name}: ${progression.currentZone.objective}`,
      prompt: frameInput.pointerLocked
        ? "1-4 skip zones | Right mouse aim | Shift sprint | Esc pause | F3 debug"
        : "Click the canvas to lock pointer. Follow the route from road to bell tower.",
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

  function dispose() {
    cancelAnimationFrame(animationFrame);
    input.stop();
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
    renderer.domElement.removeEventListener("webglcontextrestored", handleContextRestored);
    playerView.dispose();
    mapView.dispose();
    physics.dispose();
    renderer.dispose();
    shell.remove();
  }

  return {
    start,
    dispose,
  };
}
