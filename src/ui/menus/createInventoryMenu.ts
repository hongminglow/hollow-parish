import type { InventoryRow } from "../../game/simulation/inventory";

export function createInventoryMenu(parent: HTMLElement) {
  const menu = document.createElement("section");
  menu.className = "inventory-menu";
  menu.innerHTML = `
    <div class="inventory-card">
      <div class="inventory-kicker">Inventory</div>
      <h1 class="inventory-title">Field Case</h1>
      <div class="inventory-grid" data-inventory-rows></div>
      <p class="inventory-help">Tab closes inventory. H uses the weakest available healing item.</p>
    </div>
  `;
  parent.append(menu);

  const rows = requireElement(menu, "[data-inventory-rows]");

  function update(items: InventoryRow[], isOpen: boolean) {
    menu.classList.toggle("is-visible", isOpen);
    rows.innerHTML = items
      .map(
        (item) => `
          <div class="inventory-row">
            <span>${item.label}</span>
            <strong>${item.value}</strong>
          </div>
        `,
      )
      .join("");
  }

  return {
    update,
  };
}

function requireElement(parent: HTMLElement, selector: string) {
  const element = parent.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing inventory menu element: ${selector}`);
  }

  return element;
}
