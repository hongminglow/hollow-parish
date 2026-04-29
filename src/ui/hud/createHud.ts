type HudState = {
  objective: string;
  health: number;
  stamina: number;
  ammo: string;
  prompt: string;
  message: string;
  isDead: boolean;
  hasWon: boolean;
  boss: {
    isVisible: boolean;
    label: string;
    phase: string;
    health: number;
    maxHealth: number;
  };
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
      <div class="status-vitals">
        <div class="vital-row">
          <span class="vital-icon vital-icon-health" aria-hidden="true">+</span>
          <div class="vital-copy">
            <div class="hud-label">Health</div>
            <div class="vital-track">
              <div class="vital-fill vital-fill-health" data-hud-health-fill></div>
            </div>
          </div>
          <strong class="vital-value" data-hud-health></strong>
        </div>
        <div class="vital-row">
          <span class="vital-icon vital-icon-stamina" aria-hidden="true">S</span>
          <div class="vital-copy">
            <div class="hud-label">Stamina</div>
            <div class="vital-track">
              <div class="vital-fill vital-fill-stamina" data-hud-stamina-fill></div>
            </div>
          </div>
          <strong class="vital-value" data-hud-stamina></strong>
        </div>
      </div>
      <div class="status-item">
        <div class="hud-label">Ammo</div>
        <div class="hud-value" data-hud-ammo></div>
      </div>
    </section>
    <div class="prompt" data-hud-prompt></div>
    <div class="combat-message" data-hud-message></div>
    <section class="boss-hud" data-hud-boss>
      <div class="boss-hud-top">
        <span data-hud-boss-label></span>
        <strong data-hud-boss-phase></strong>
      </div>
      <div class="boss-health-track">
        <div class="boss-health-fill" data-hud-boss-fill></div>
      </div>
    </section>
    <div class="reticle" data-hud-reticle aria-hidden="true"></div>
    <section class="pause-overlay" data-hud-pause>
      <div class="pause-card">
        <h1 class="pause-title">Paused</h1>
        <p class="pause-copy">Route progress is held. Adjust volume, resume, or return to the main menu.</p>
        <div class="pause-actions">
          <button class="menu-button menu-button-primary" type="button" data-pause-resume>Back to Game</button>
          <button class="menu-button" type="button" data-pause-main-menu>Main Menu</button>
        </div>
        <label class="menu-slider pause-slider">
          <span>Master Volume</span>
          <input type="range" min="0" max="1" step="0.01" data-pause-volume />
        </label>
      </div>
    </section>
    <section class="death-overlay" data-hud-death>
      <div class="death-card">
        <div class="death-kicker">You Are Down</div>
        <h1 class="death-title">The parish takes another breath.</h1>
        <p class="death-copy">Press Space or Enter to restart from the latest checkpoint.</p>
      </div>
    </section>
    <section class="win-overlay" data-hud-win>
      <div class="win-card">
        <div class="win-kicker">Escape Confirmed</div>
        <h1 class="win-title">The bell goes quiet.</h1>
        <p class="win-copy">The prototype route is complete: explore, loot, fight, defeat The Bellkeeper, and escape.</p>
        <button class="menu-button menu-button-primary win-menu-button" type="button" data-win-main-menu>
          Back to Main Menu
        </button>
      </div>
    </section>
  `;
  parent.append(hud);

  const objective = requireElement(hud, "[data-hud-objective]");
  const health = requireElement(hud, "[data-hud-health]");
  const healthFill = requireElement(hud, "[data-hud-health-fill]");
  const stamina = requireElement(hud, "[data-hud-stamina]");
  const staminaFill = requireElement(hud, "[data-hud-stamina-fill]");
  const ammo = requireElement(hud, "[data-hud-ammo]");
  const pause = requireElement(hud, "[data-hud-pause]");
  const pauseResume = requireElement<HTMLButtonElement>(hud, "[data-pause-resume]");
  const pauseMainMenu = requireElement<HTMLButtonElement>(hud, "[data-pause-main-menu]");
  const pauseVolume = requireElement<HTMLInputElement>(hud, "[data-pause-volume]");
  const reticle = requireElement(hud, "[data-hud-reticle]");
  const prompt = requireElement(hud, "[data-hud-prompt]");
  const message = requireElement(hud, "[data-hud-message]");
  const death = requireElement(hud, "[data-hud-death]");
  const boss = requireElement(hud, "[data-hud-boss]");
  const bossLabel = requireElement(hud, "[data-hud-boss-label]");
  const bossPhase = requireElement(hud, "[data-hud-boss-phase]");
  const bossFill = requireElement(hud, "[data-hud-boss-fill]");
  const win = requireElement(hud, "[data-hud-win]");
  const winMainMenu = requireElement<HTMLButtonElement>(hud, "[data-win-main-menu]");

  function update(state: HudState) {
    objective.textContent = state.objective;
    health.textContent = `${state.health}%`;
    healthFill.style.width = `${clampPercent(state.health)}%`;
    stamina.textContent = `${Math.round(state.stamina)}%`;
    staminaFill.style.width = `${clampPercent(state.stamina)}%`;
    ammo.textContent = state.ammo;
    prompt.textContent = state.prompt;
    message.textContent = state.message;
    message.classList.toggle("is-visible", state.message.length > 0);
    death.classList.toggle("is-visible", state.isDead);
    boss.classList.toggle("is-visible", state.boss.isVisible);
    bossLabel.textContent = state.boss.label;
    bossPhase.textContent = state.boss.phase;
    bossFill.style.width = `${Math.max(
      0,
      Math.min(100, (state.boss.health / state.boss.maxHealth) * 100),
    )}%`;
    win.classList.toggle("is-visible", state.hasWon);
  }

  return {
    update,
    setPauseHandlers(handlers: {
      onResume: () => void;
      onMainMenu: () => void;
      onWinMainMenu: () => void;
      onVolumeChange: (volume: number) => void;
    }) {
      pauseResume.onclick = handlers.onResume;
      pauseMainMenu.onclick = handlers.onMainMenu;
      winMainMenu.onclick = handlers.onWinMainMenu;
      pauseVolume.oninput = () => handlers.onVolumeChange(Number(pauseVolume.value));
    },
    setVolume(volume: number) {
      pauseVolume.value = String(volume);
    },
    setPaused(isPaused: boolean) {
      pause.classList.toggle("is-visible", isPaused);
    },
    setReticleVisible(isVisible: boolean) {
      reticle.classList.toggle("is-visible", isVisible);
    },
  };
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function requireElement<T extends HTMLElement = HTMLElement>(parent: HTMLElement, selector: string) {
  const element = parent.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing HUD element: ${selector}`);
  }

  return element;
}
