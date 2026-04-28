type HudState = {
  objective: string;
  health: number;
  ammo: string;
  prompt: string;
  message: string;
  isDead: boolean;
};

export function createHud(parent: HTMLElement) {
  const hud = document.createElement("div");
  hud.className = "hud";
  hud.innerHTML = `
    <section class="objective-chip" aria-live="polite">
      <div class="objective-kicker">Objective</div>
      <div class="objective-text" data-hud-objective></div>
    </section>
    <section class="status-strip" aria-label="Player status">
      <div class="status-item">
        <div class="hud-label">Health</div>
        <div class="hud-value" data-hud-health></div>
      </div>
      <div class="status-item">
        <div class="hud-label">Ammo</div>
        <div class="hud-value" data-hud-ammo></div>
      </div>
    </section>
    <div class="prompt" data-hud-prompt></div>
    <div class="combat-message" data-hud-message></div>
    <div class="reticle" data-hud-reticle aria-hidden="true"></div>
    <section class="pause-overlay" data-hud-pause>
      <div class="pause-card">
        <h1 class="pause-title">Paused</h1>
        <p class="pause-copy">Combat prototype online: aim, fire, reload, and survive the infected placeholders.</p>
      </div>
    </section>
    <section class="death-overlay" data-hud-death>
      <div class="death-card">
        <div class="death-kicker">You Are Down</div>
        <h1 class="death-title">The parish takes another breath.</h1>
        <p class="death-copy">Press Space to restart from the latest checkpoint.</p>
      </div>
    </section>
  `;
  parent.append(hud);

  const objective = requireElement(hud, "[data-hud-objective]");
  const health = requireElement(hud, "[data-hud-health]");
  const ammo = requireElement(hud, "[data-hud-ammo]");
  const pause = requireElement(hud, "[data-hud-pause]");
  const reticle = requireElement(hud, "[data-hud-reticle]");
  const prompt = requireElement(hud, "[data-hud-prompt]");
  const message = requireElement(hud, "[data-hud-message]");
  const death = requireElement(hud, "[data-hud-death]");

  function update(state: HudState) {
    objective.textContent = state.objective;
    health.textContent = `${state.health}%`;
    ammo.textContent = state.ammo;
    prompt.textContent = state.prompt;
    message.textContent = state.message;
    message.classList.toggle("is-visible", state.message.length > 0);
    death.classList.toggle("is-visible", state.isDead);
  }

  return {
    update,
    setPaused(isPaused: boolean) {
      pause.classList.toggle("is-visible", isPaused);
    },
    setReticleVisible(isVisible: boolean) {
      reticle.classList.toggle("is-visible", isVisible);
    },
  };
}

function requireElement(parent: HTMLElement, selector: string) {
  const element = parent.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing HUD element: ${selector}`);
  }

  return element;
}
