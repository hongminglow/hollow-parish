import type { Vec3 } from "../game/simulation/player";
import { debugFlags } from "./debugFlags";

type DebugPanelState = {
  fps: number;
  playerPosition: Vec3;
  elapsed: number;
  paused: boolean;
  grounded: boolean;
  aiming: boolean;
  sprinting: boolean;
  pointerLocked: boolean;
  zoneName: string;
  checkpointName: string;
  aliveEnemies: number;
  enemyAi: string;
  ammo: string;
  renderCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
};

export function createDebugPanel(parent: HTMLElement) {
  const panel = document.createElement("div");
  panel.className = "debug-panel";
  parent.append(panel);

  let isVisible = debugFlags.showDebugPanel;
  panel.classList.toggle("is-hidden", !isVisible);

  function setVisible(nextVisible: boolean) {
    isVisible = nextVisible;
    debugFlags.showDebugPanel = nextVisible;
    panel.classList.toggle("is-hidden", !isVisible);
  }

  function update(state: DebugPanelState) {
    if (!isVisible) {
      return;
    }

    const { x, y, z } = state.playerPosition;
    panel.innerHTML = [
      `FPS: ${Math.round(state.fps)}`,
      `Time: ${state.elapsed.toFixed(1)}s`,
      `Paused: ${state.paused ? "yes" : "no"}`,
      `Pointer: ${state.pointerLocked ? "locked" : "free"}`,
      `Grounded: ${state.grounded ? "yes" : "no"}`,
      `Aiming: ${state.aiming ? "yes" : "no"}`,
      `Sprint: ${state.sprinting ? "yes" : "no"}`,
      `Zone: ${state.zoneName}`,
      `Checkpoint: ${state.checkpointName}`,
      `Enemies: ${state.aliveEnemies}`,
      `AI: ${state.enemyAi}`,
      `Ammo: ${state.ammo}`,
      `Draw: ${state.renderCalls} calls / ${state.triangles} tris`,
      `Memory: ${state.geometries} geo / ${state.textures} tex`,
      `Player: ${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`,
      "1-4: skip zones",
      "F3: debug",
      "Esc: pause",
    ].join("<br />");
  }

  return {
    update,
    toggle() {
      setVisible(!isVisible);
    },
    setVisible,
  };
}
