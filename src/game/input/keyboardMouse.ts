import { type GameAction, getMovementAxis, type MovementAxis } from "./actions";

type MouseDelta = {
  x: number;
  y: number;
};

type InputFrameInit = {
  held: ReadonlySet<GameAction>;
  pressed: ReadonlySet<GameAction>;
  released: ReadonlySet<GameAction>;
  mouseDelta: MouseDelta;
  pointerLocked: boolean;
};

export type InputFrame = InputFrameInit & {
  isHeld(action: GameAction): boolean;
  wasPressed(action: GameAction): boolean;
  wasReleased(action: GameAction): boolean;
  movementAxis(): MovementAxis;
};

const keyActionMap = new Map<string, GameAction>([
  ["KeyW", "moveForward"],
  ["ArrowUp", "moveForward"],
  ["KeyS", "moveBackward"],
  ["ArrowDown", "moveBackward"],
  ["KeyA", "moveLeft"],
  ["ArrowLeft", "moveLeft"],
  ["KeyD", "moveRight"],
  ["ArrowRight", "moveRight"],
  ["ShiftLeft", "sprint"],
  ["ShiftRight", "sprint"],
  ["KeyR", "reload"],
  ["KeyE", "interact"],
  ["KeyH", "heal"],
  ["Tab", "inventory"],
  ["Escape", "pause"],
  ["F3", "toggleDebug"],
]);

const mouseActionMap = new Map<number, GameAction>([
  [0, "shoot"],
  [2, "aim"],
]);

export function createKeyboardMouseInput(canvas: HTMLCanvasElement) {
  const held = new Set<GameAction>();
  const pressed = new Set<GameAction>();
  const released = new Set<GameAction>();
  const mouseDelta: MouseDelta = { x: 0, y: 0 };
  let pointerLocked = document.pointerLockElement === canvas;

  function markPressed(action: GameAction) {
    if (!held.has(action)) {
      pressed.add(action);
    }

    held.add(action);
  }

  function markReleased(action: GameAction) {
    if (held.has(action)) {
      released.add(action);
    }

    held.delete(action);
  }

  function requestPointerLock() {
    if (document.pointerLockElement !== canvas) {
      void canvas.requestPointerLock();
    }
  }

  function handlePointerLockChange() {
    pointerLocked = document.pointerLockElement === canvas;

    if (!pointerLocked) {
      markReleased("aim");
      markReleased("shoot");
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    const action = keyActionMap.get(event.code);

    if (!action) {
      return;
    }

    if (action === "inventory" || action === "pause" || action === "toggleDebug") {
      event.preventDefault();
    }

    if (!event.repeat) {
      markPressed(action);
    }
  }

  function handleKeyUp(event: KeyboardEvent) {
    const action = keyActionMap.get(event.code);

    if (!action) {
      return;
    }

    event.preventDefault();
    markReleased(action);
  }

  function handleMouseDown(event: MouseEvent) {
    const action = mouseActionMap.get(event.button);

    if (!action) {
      return;
    }

    event.preventDefault();
    requestPointerLock();
    markPressed(action);
  }

  function handleMouseUp(event: MouseEvent) {
    const action = mouseActionMap.get(event.button);

    if (!action) {
      return;
    }

    event.preventDefault();
    markReleased(action);
  }

  function handleMouseMove(event: MouseEvent) {
    if (!pointerLocked) {
      return;
    }

    mouseDelta.x += event.movementX;
    mouseDelta.y += event.movementY;
  }

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
  }

  function handleBlur() {
    held.clear();
    pressed.clear();
    released.clear();
    mouseDelta.x = 0;
    mouseDelta.y = 0;
  }

  function start() {
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("blur", handleBlur);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("contextmenu", handleContextMenu);
  }

  function stop() {
    document.removeEventListener("pointerlockchange", handlePointerLockChange);
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    window.removeEventListener("blur", handleBlur);
    canvas.removeEventListener("mousedown", handleMouseDown);
    canvas.removeEventListener("contextmenu", handleContextMenu);
  }

  function consumeFrame(): InputFrame {
    const frameHeld = new Set(held);
    const framePressed = new Set(pressed);
    const frameReleased = new Set(released);
    const frameMouseDelta = { ...mouseDelta };

    pressed.clear();
    released.clear();
    mouseDelta.x = 0;
    mouseDelta.y = 0;

    return {
      held: frameHeld,
      pressed: framePressed,
      released: frameReleased,
      mouseDelta: frameMouseDelta,
      pointerLocked,
      isHeld(action) {
        return frameHeld.has(action);
      },
      wasPressed(action) {
        return framePressed.has(action);
      },
      wasReleased(action) {
        return frameReleased.has(action);
      },
      movementAxis() {
        return getMovementAxis((action) => frameHeld.has(action));
      },
    };
  }

  return {
    start,
    stop,
    consumeFrame,
  };
}
