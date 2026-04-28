export function createRuntimeErrorPanel(parent: HTMLElement) {
  const panel = document.createElement("section");
  panel.className = "error-panel is-hidden";
  panel.setAttribute("role", "alert");
  parent.append(panel);

  function show(message: string) {
    panel.textContent = message;
    panel.classList.remove("is-hidden");
  }

  function hide() {
    panel.textContent = "";
    panel.classList.add("is-hidden");
  }

  window.addEventListener("error", (event) => {
    show(event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    show(event.reason instanceof Error ? event.reason.message : String(event.reason));
  });

  return {
    show,
    hide,
  };
}
