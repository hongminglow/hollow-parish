# Manual Playtest Script

Use this script for the first full browser pass.

## Boot

- Start with `npm run dev`.
- Open the local URL in Chrome or Edge.
- Confirm the canvas, HUD objective, health, ammo, and prompt appear.
- Click the canvas and confirm pointer lock.

## Route Playthrough

- Zone 1: collect road ammo and Village Gate Key.
- Unlock the village gate with `E`.
- Fight or avoid the first infected.
- Zone 2: enter Mill Yard, trigger group enemy pressure, reload, and use one healing item.
- Hold `E` at the Mill Crank until the chapel route opens.
- Zone 3: collect the Iron Sun Emblem, place it at the chapel altar, and pass the bell tower gate.
- Final Arena: trigger The Bellkeeper, confirm boss health HUD appears, defeat phase 1 and phase 2, then unlock the escape gate.

## Failure And Recovery

- Let enemies down the player.
- Press `Space` to restore from checkpoint.
- Confirm inventory, collected pickups, dead enemies, route flags, and ammo restoration behave as expected.

## UI Checks

- Press `Tab` to open and close inventory.
- Press `Esc` to pause and resume.
- Press `F3` to inspect FPS, draw calls, triangles, geometry count, and texture count.
- Resize the browser window and confirm HUD remains readable.

## Pass Criteria

- No uncaught console errors.
- No major camera clipping on the critical route.
- Player cannot escape map bounds or skip locked gates.
- Boss win state only appears after boss defeat and escape gate interaction.
- HUD and prompts are readable without covering the aiming reticle.
