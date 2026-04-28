import "./styles.css";
import { createGame } from "./render/app/createGame";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("Missing #app root element.");
}

const game = createGame(root);
game.start();
