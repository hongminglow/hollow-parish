import "./styles.css";
import { createGame } from "./render/app/createGame";

const root = document.querySelector<HTMLDivElement>("#app");

async function bootstrap() {
  if (!root) {
    throw new Error("Missing #app root element.");
  }

  const game = await createGame(root);
  game.start();
}

void bootstrap();
