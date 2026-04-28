import type * as THREE from "three";
import { debugFlags } from "./debugFlags";

type DebugPanelState = {
  fps: number;
  playerPosition: THREE.Vector3;
  elapsed: number;
  paused: boolean;
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
      `Player: ${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`,
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
