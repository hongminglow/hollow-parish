type MainMenuState = {
  hasContinue: boolean;
  isVisible: boolean;
  volume: number;
};

type MainMenuHandlers = {
  onNewGame: () => void;
  onContinue: () => void;
  onVolumeChange: (volume: number) => void;
};

export function createMainMenu(parent: HTMLElement, handlers: MainMenuHandlers) {
  const menu = document.createElement("section");
  menu.className = "main-menu";
  menu.innerHTML = `
    <div class="main-menu-card">
      <div class="main-menu-kicker">Hollow Parish</div>
      <h1 class="main-menu-title">Survive the bell route.</h1>
      <p class="main-menu-copy">
        A compact third-person survival horror prototype: search the village, loot supplies,
        unlock the chapel route, and defeat The Bellkeeper.
      </p>
      <div class="main-menu-actions">
        <button class="menu-button menu-button-primary" type="button" data-main-new>New Game</button>
        <button class="menu-button" type="button" data-main-continue>Continue</button>
      </div>
      <label class="menu-slider">
        <span>Master Volume</span>
        <input type="range" min="0" max="1" step="0.01" data-main-volume />
      </label>
      <div class="main-menu-help">Esc pauses during play. Right mouse aims, left mouse fires.</div>
    </div>
  `;
  parent.append(menu);

  const newGameButton = requireElement<HTMLButtonElement>(menu, "[data-main-new]");
  const continueButton = requireElement<HTMLButtonElement>(menu, "[data-main-continue]");
  const volumeInput = requireElement<HTMLInputElement>(menu, "[data-main-volume]");

  newGameButton.addEventListener("click", handlers.onNewGame);
  continueButton.addEventListener("click", handlers.onContinue);
  volumeInput.addEventListener("input", () => {
    handlers.onVolumeChange(Number(volumeInput.value));
  });

  function update(state: MainMenuState) {
    menu.classList.toggle("is-visible", state.isVisible);
    continueButton.disabled = !state.hasContinue;
    continueButton.textContent = state.hasContinue ? "Continue" : "Continue Locked";
    volumeInput.value = String(state.volume);
  }

  function dispose() {
    menu.remove();
  }

  return {
    update,
    dispose,
  };
}

function requireElement<T extends HTMLElement>(parent: HTMLElement, selector: string) {
  const element = parent.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing main menu element: ${selector}`);
  }

  return element;
}
