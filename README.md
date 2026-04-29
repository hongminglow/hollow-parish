# Hollow Parish

**Hollow Parish** is a web-based 3D third-person survival shooter prototype built around the feel of classic over-the-shoulder survival-action games. The player crosses a haunted rural parish, scavenges limited supplies, fights infected villagers, unlocks route blockers, and survives a final boss encounter.

This is an original game concept. It is inspired by the pacing and camera language of survival-action games, but it should not copy Resident Evil 4 assets, story, characters, map layouts, branding, audio, or UI.

## Game Summary

The player is a stranded tactical survivor moving through an infected village at night. The map is one connected route split into three major zones before a final boss arena:

- **Zone 1: Abandoned Road** teaches movement, pickups, aiming, and first combat.
- **Zone 2: Mill Yard** adds group enemy pressure, reload discipline, and a crank interaction.
- **Zone 3: Chapel Crypt** adds tighter corridors, low visibility, dormant enemies, and an emblem gate.
- **Final Arena: Bell Tower Courtyard** ends with a two-phase boss fight against The Bellkeeper.

The intended first playable should last roughly 8 to 15 minutes and prove the full loop: explore, fight, loot, unlock progression, survive the boss, and escape.

## Game Description

After a failed evacuation, the player enters a ruined parish overtaken by a fungal infection. The village is quiet at first, but each zone increases pressure through enemy placement, limited supplies, locked routes, and tighter spaces. The player must manage ammo and health carefully while pushing forward through one continuous map.

The visual direction is low-poly gothic rural horror: cold moonlight, warm lanterns, foggy silhouettes, dead trees, stone walls, barns, chapel crypts, and a bell tower arena. Readability is more important than realism because this is a browser game.

## Core Mechanics

- Third-person movement with keyboard and mouse.
- Over-the-shoulder aim mode.
- Hitscan shooting from the camera reticle.
- Ammo, magazines, reserve ammo, and reload timing.
- Enemy health, hit reactions, stagger, and death.
- Player health, damage, healing, death, and checkpoint respawn.
- Loot pickups for ammo, healing, notes, and key items.
- Simple inventory with weapon, ammo, healing, and key item sections.
- Locked gates and route blockers.
- Enemy AI with idle, alert, chase, attack, stagger, and dead states.
- Three enemy variants before the boss.
- Final boss with two phases, telegraphed attacks, minion pressure, and victory gate.

## Core Loop

1. Explore the current zone.
2. Spot or hear enemy threats.
3. Aim, shoot, reposition, reload, or conserve ammo.
4. Collect loot and healing supplies.
5. Solve a simple route blocker.
6. Reach the next zone.
7. Defeat the final boss and escape.

## Controls Target

| Action        | Input                   |
| ------------- | ----------------------- |
| Move          | WASD                    |
| Look          | Mouse                   |
| Sprint        | Shift                   |
| Aim           | Right mouse             |
| Shoot         | Left mouse while aiming |
| Reload        | R                       |
| Interact      | E                       |
| Heal          | H                       |
| Inventory     | Tab                     |
| Pause         | Esc                     |
| Restart death | Space                   |

## Technical Direction

Recommended stack:

- Three.js for rendering.
- TypeScript for game code.
- Vite for local development and builds.
- Rapier JS for physics and collision.
- GLB or glTF 2.0 for 3D assets.
- DOM overlays for HUD, inventory, prompts, pause, death, and win screens.
- Optional SpectorJS for WebGL frame debugging later.

Architecture rule:

Simulation state should stay outside Three.js objects. Game rules, combat, inventory, progression, AI, and checkpoints belong in simulation modules. Three.js should render the current state, not own it.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Run verification checks:

```bash
npm run lint
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Planned Source Structure

```text
src/
  game/
    simulation/
    content/
    input/
    save/
  render/
    app/
    cameras/
    loaders/
    objects/
    effects/
    adapters/
  physics/
  ui/
  diagnostics/
```

## Development Phases

- Phase 0: Project setup, renderer, scene, HUD shell, and diagnostics.
- Phase 1: Input, player movement, physics capsule, and third-person camera.
- Phase 2: Full graybox map blockout with zones, colliders, and checkpoints.
- Phase 3: Handgun combat, ammo, reload, damage, death, and respawn.
- Phase 4: Enemy AI, detection, chasing, attacks, stagger, and variants.
- Phase 5: Loot, inventory, gates, objective progression, and checkpoints.
- Phase 6: Final boss, two phases, arena flow, and win state.
- Phase 7: Art, animation, audio, lighting, UI polish, and atmosphere.
- Phase 8: QA, balancing, browser checks, and release candidate.

## Project Documents

- [Full game spec](./docs/game-spec.md)
- [Development checklist](./docs/development-checklist.md)
- [Manual playtest script](./docs/manual-playtest-script.md)
- [Release candidate notes](./docs/release-candidate-notes.md)

## Current Status

Phase 0 through Phase 8 implementation is in place. The project has a Vite, TypeScript, and Three.js runtime shell with a DOM HUD, debug overlay, Rapier physics world, keyboard/mouse input, pointer lock, a kinematic player capsule, third-person follow/aim camera, one connected map route from Abandoned Road to Bell Tower Courtyard, placeholder enemies, handgun hitscan combat, ammo, reload, enemy damage, player damage, death, checkpoint restart, enemy AI, collectable loot, key items, healing, a Tab inventory menu, route locks, timed interactions, objective updates, checkpoint restoration, a two-phase Bellkeeper boss encounter, boss health HUD, arena lock, charge and ground-slam attacks, minion pressure, escape gate unlock, win screen, procedural environment dressing, fog and lantern atmosphere, placeholder animation, procedural audio cues, responsive HUD polish, a settings stub, map-boundary enforcement, debug performance counters, and release-candidate documentation.

Next task:

- Run the manual browser playtest, then use findings for balancing and final release-candidate cleanup.
