import { createDebugPanel } from "../../diagnostics/createDebugPanel";
import { createHud } from "../../ui/hud/createHud";
import { createRuntimeErrorPanel } from "../../ui/overlays/createRuntimeErrorPanel";
import { createCamera } from "./createCamera";
import { createRenderer } from "./createRenderer";
import { createScene } from "./createScene";
import { createTestWorld } from "./createTestWorld";

const fixedStep = 1 / 60;
const maxAccumulatedTime = fixedStep * 5;

export function createGame(root: HTMLElement) {
  const shell = document.createElement("div");
  shell.className = "game-shell";
  root.append(shell);

  const renderer = createRenderer();
  shell.append(renderer.domElement);

  const scene = createScene();
  const camera = createCamera();
  const world = createTestWorld(scene);
  const hud = createHud(shell);
  const debugPanel = createDebugPanel(shell);
  const errorPanel = createRuntimeErrorPanel(shell);

  let animationFrame = 0;
  let previousTime = performance.now();
  let accumulator = 0;
  let elapsed = 0;
  let isPaused = false;

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

  function handleKeyDown(event: KeyboardEvent) {
    if (event.code === "Escape") {
      setPaused(!isPaused);
    }

    if (event.code === "F3") {
      debugPanel.toggle();
    }

    if (event.code === "MouseRight") {
      hud.setReticleVisible(true);
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

  function fixedUpdate(deltaSeconds: number) {
    world.update(deltaSeconds, isPaused);
  }

  function render(time: number) {
    const deltaSeconds = Math.min(0.1, (time - previousTime) / 1000);
    previousTime = time;

    if (!isPaused) {
      accumulator = Math.min(maxAccumulatedTime, accumulator + deltaSeconds);

      while (accumulator >= fixedStep) {
        fixedUpdate(fixedStep);
        accumulator -= fixedStep;
        elapsed += fixedStep;
      }
    }

    const playerPosition = world.getPlayerPosition();
    camera.position.set(playerPosition.x + 5, playerPosition.y + 3.2, playerPosition.z + 7);
    camera.lookAt(playerPosition.x, playerPosition.y + 0.8, playerPosition.z);

    hud.update({
      health: 100,
      ammo: "12 / 36",
      objective: "Phase 0: verify renderer, HUD, diagnostics, and shell.",
    });

    debugPanel.update({
      fps: deltaSeconds > 0 ? 1 / deltaSeconds : 0,
      playerPosition,
      elapsed,
      paused: isPaused,
    });

    renderer.render(scene, camera);
    animationFrame = requestAnimationFrame(render);
  }

  function start() {
    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("keydown", handleKeyDown);
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", handleContextRestored);
    animationFrame = requestAnimationFrame(render);
  }

  function dispose() {
    cancelAnimationFrame(animationFrame);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("keydown", handleKeyDown);
    renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
    renderer.domElement.removeEventListener("webglcontextrestored", handleContextRestored);
    renderer.dispose();
    shell.remove();
  }

  return {
    start,
    dispose,
  };
}
