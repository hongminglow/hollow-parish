import "./styles.css";
import { loadContinueSlot } from "./game/save/continueSlot";
import { readStoredVolume, saveStoredVolume } from "./game/save/settings";
import { createGame } from "./render/app/createGame";
import { createMainMenu } from "./ui/menus/createMainMenu";

const root = document.querySelector<HTMLDivElement>("#app");

async function bootstrap() {
  if (!root) {
    throw new Error("Missing #app root element.");
  }

  const appRoot = root;
  let activeGame: Awaited<ReturnType<typeof createGame>> | null = null;
  let activeMenu: ReturnType<typeof createMainMenu> | null = null;
  let volume = readStoredVolume();

  function showMainMenu() {
    activeGame?.dispose();
    activeGame = null;
    activeMenu?.dispose();
    activeMenu = createMainMenu(appRoot, {
      onNewGame: () => {
        void startGame("new");
      },
      onContinue: () => {
        void startGame("continue");
      },
      onVolumeChange(nextVolume) {
        volume = saveStoredVolume(nextVolume);
        updateMainMenu();
      },
    });
    updateMainMenu();
  }

  function updateMainMenu() {
    activeMenu?.update({
      hasContinue: loadContinueSlot() !== null,
      isVisible: true,
      volume,
    });
  }

  async function startGame(startMode: "new" | "continue") {
    activeMenu?.dispose();
    activeMenu = null;
    activeGame = await createGame(appRoot, {
      startMode,
      volume,
      onReturnToMainMenu: showMainMenu,
    });
    activeGame.start();
  }

  showMainMenu();
}

void bootstrap();
