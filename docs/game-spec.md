# Third-Person Survival Shooter Game Spec

Working title: **Hollow Parish**

## 1. Feasibility Decision

Yes, this game is possible with Three.js if the target is a scoped browser prototype rather than a full Resident Evil 4-scale production.

The correct scope is:

- Third-person over-the-shoulder camera.
- Small stylized player character.
- One connected map split into three playable zones plus a final boss arena.
- Zombies or infected villagers with simple but readable AI.
- Loot pickups, ammo, healing, locked gates, basic inventory, and combat.
- Original characters, map, enemies, audio, and assets. The game can be inspired by classic survival-action pacing, but it must not copy Resident Evil 4 assets, story, names, branding, or exact level layouts.

The main technical risks are camera feel, enemy navigation, browser performance, and asset production. Those are manageable if the first version uses low-poly GLB assets, simple collision volumes, and a clear state-machine-based gameplay architecture.

## 2. Target Experience

The player explores a haunted rural parish at night after a failed evacuation. The village is infected by a fungal plague. The player must cross the settlement, collect limited supplies, unlock route gates, survive enemy pressure, and defeat the infected bellkeeper in the final arena.

Design pillars:

- **Tense traversal:** The player is rarely safe, but fights should be readable and fair.
- **Limited resources:** Ammo and healing are useful enough to matter, but not so scarce that the prototype becomes frustrating.
- **Clear route progression:** Each zone teaches one mechanic and escalates enemy pressure.
- **Readable browser visuals:** Strong silhouettes, fog, lighting contrast, and simple geometry matter more than asset complexity.
- **Responsive combat:** Aiming, shooting, hit reactions, and enemy approach timing must feel predictable.

## 3. Platform And Runtime

Recommended stack:

- Runtime: Three.js.
- Language: TypeScript.
- Build tool: Vite.
- Physics/collision: Rapier JS.
- 3D assets: GLB or glTF 2.0.
- UI: DOM overlay for HUD, inventory, pause, prompts, and menus.
- Debugging: simple in-game debug overlay, browser devtools, optional SpectorJS for WebGL frame inspection.

Why Three.js is acceptable:

- It supports full 3D rendering, cameras, lighting, animation mixers, loaders, raycasting, and post-processing.
- It works well with GLB assets and Vite.
- It gives direct control over the camera and render loop, which is useful for a third-person shooter.

What Three.js does not provide by itself:

- It does not provide a game engine editor.
- It does not provide AI, enemy navigation, inventory, save systems, or combat rules.
- It does not provide physics unless paired with a library such as Rapier.
- It does not solve asset creation.

## 4. First Playable Scope

The first playable version should prove the full game loop in a small vertical slice:

- Player can move, aim, shoot, reload, pick up loot, take damage, heal, and die.
- One connected map contains three zones and one boss arena.
- At least three enemy encounters exist before the boss.
- Each zone has one key route blocker or interaction.
- The final boss has at least two attack patterns.
- The prototype can be completed in 8 to 15 minutes.

Out of scope for the first playable:

- Complex story cinematics.
- Full inventory grid like a commercial survival game.
- Advanced stealth.
- Companion AI.
- Network multiplayer.
- Open-world navigation.
- Full ragdoll physics.
- Large destructible environments.
- Photorealistic art.

## 5. Player Fantasy And Verbs

Player fantasy:

The player is a stranded tactical survivor moving through a hostile infected settlement with limited supplies.

Primary verbs:

- Walk.
- Sprint.
- Aim.
- Shoot.
- Reload.
- Interact.
- Pick up loot.
- Use healing item.
- Open inventory.
- Dodge shove or quick-step.
- Unlock gates.

Secondary verbs:

- Inspect notes.
- Trigger checkpoints.
- Kick staggered enemy, optional stretch goal.
- Shoot weak points, optional stretch goal.

## 6. Controls

Keyboard and mouse target:

| Action         | Input                   |
| -------------- | ----------------------- |
| Move           | WASD                    |
| Look           | Mouse                   |
| Sprint         | Shift                   |
| Aim            | Right mouse             |
| Shoot          | Left mouse while aiming |
| Reload         | R                       |
| Interact       | E                       |
| Heal           | H or quick-slot key     |
| Inventory      | Tab                     |
| Pause          | Esc                     |
| Dodge or shove | Space                   |

Controller support can be a later milestone. The first version should focus on keyboard and mouse because aiming behavior is easier to validate.

## 7. Camera Model

Camera type:

- Third-person follow camera during movement.
- Over-the-shoulder camera while aiming.
- Camera sits slightly behind and above the player.
- While aiming, camera shifts toward the player shoulder and narrows field of view slightly.

Camera requirements:

- Smooth follow with damping.
- Mouse controls yaw and pitch.
- Pitch is clamped to avoid flipping.
- Camera collision prevents clipping through walls.
- Reticle appears only while aiming.
- Player movement is camera-relative.

Initial camera values:

- Default distance: 4.5 to 5.5 meters.
- Aim distance: 2.4 to 3.0 meters.
- Default height: 1.6 meters above player origin.
- Aim shoulder offset: 0.45 meters right, 0.15 meters up.
- Default FOV: 60.
- Aim FOV: 48 to 52.

## 8. Core Game Loop

Moment-to-moment loop:

1. Explore zone.
2. Spot enemy or hear threat.
3. Aim, reposition, shoot, reload, or conserve ammo.
4. Collect loot after combat or from crates.
5. Solve simple route blocker.
6. Push into next zone.

Macro loop:

1. Start at road checkpoint.
2. Clear village approach.
3. Unlock mill yard.
4. Survive chapel crypt.
5. Enter bell tower arena.
6. Defeat boss.
7. Escape through final gate.

Loss state:

- Player dies when health reaches zero.
- Player respawns from latest checkpoint with checkpoint state restored.
- For first playable, checkpoints can preserve progress but restore a reasonable amount of ammo to avoid soft-locks.

Win state:

- Boss defeated.
- Player interacts with escape gate.
- End screen shows time, kills, shots fired, damage taken, and supplies remaining.

## 9. World Structure

One connected map with four major spaces:

### Zone 1: Abandoned Road

Purpose:

- Teach movement, camera, pickup, aiming, and first enemy combat.

Layout:

- Forest road.
- Broken cart.
- Small shrine.
- Locked gate to village square.
- Side shack with ammo pickup.

Encounter:

- Two slow infected villagers.
- One enemy blocks the road.
- One enemy wakes after the player collects the first key.

Route blocker:

- Rusted gate requires **Village Gate Key** from the shrine body.

Loot:

- Handgun ammo.
- Small herb.
- One note explaining infection.

### Zone 2: Mill Yard

Purpose:

- Teach pressure, reload discipline, and enemy groups.

Layout:

- Open yard with windmill.
- Barn interior.
- Raised walkway.
- Locked storehouse.
- Shortcut door back to road side.

Encounter:

- Four infected villagers.
- One faster infected with a farming hook.
- Enemies can approach from two directions.

Route blocker:

- Storehouse requires turning a crank while enemies pressure the player.
- Crank interaction takes 3 seconds and can be interrupted by damage.

Loot:

- Ammo crate.
- First aid spray.
- Shotgun pickup, optional if weapon switching is included.
- Boss foreshadow note.

### Zone 3: Chapel Crypt

Purpose:

- Add tension, low visibility, narrow corridors, and stronger enemy behavior.

Layout:

- Chapel entrance.
- Basement stairs.
- Crypt tunnels.
- Puzzle altar.
- Exit ladder to bell tower courtyard.

Encounter:

- Three dormant infected that rise when the player takes the altar emblem.
- One armored infected with higher health.
- Optional trap trigger that spawns one enemy behind the player.

Route blocker:

- Altar needs **Iron Sun Emblem** found in crypt side room.
- After emblem is placed, the final arena gate opens.

Loot:

- Mixed herbs.
- Handgun ammo.
- Shotgun shells if shotgun exists.
- Final checkpoint.

### Final Arena: Bell Tower Courtyard

Purpose:

- Boss fight and final skill check.

Layout:

- Circular courtyard.
- Bell tower in center.
- Collapsed walls as cover.
- Two loot corners.
- Exit gate locked until boss dies.

Boss:

- **The Bellkeeper**, a large infected guard fused with bell-chain armor.

Boss phases:

- Phase 1: Slow melee swings, charge attack, vulnerable after hitting wall.
- Phase 2: Faster movement, summons two weak infected, ground slam shockwave.

Boss win condition:

- Reduce boss health to zero.
- Boss staggers and collapses.
- Player interacts with escape gate.

## 10. Combat Design

Weapons for first playable:

### Handgun

- Default weapon.
- Moderate accuracy.
- 12-round magazine.
- Medium fire rate.
- Requires reload.
- Useful against standard enemies.

Suggested values:

- Damage: 25.
- Enemy head damage multiplier: 1.8.
- Magazine: 12.
- Reserve ammo max: 60.
- Reload time: 1.3 seconds.

### Shotgun, Stretch But Recommended

- Found in Mill Yard.
- Strong at close range.
- Low ammo.
- Knocks enemies back.

Suggested values:

- Damage: 70 close, falls off with distance.
- Magazine: 5.
- Reserve shells max: 20.
- Reload one shell at a time or simplified full reload.

Melee:

- Optional first-playable stretch goal.
- Basic shove or kick when an enemy is staggered.
- Should create distance, not become the main damage tool.

Aiming:

- Player must hold aim to shoot.
- Movement slows while aiming.
- Reticle uses raycast from camera center.
- Bullet logic can be hitscan first, not physical projectiles.

Hit reactions:

- Enemy flashes briefly or plays hit animation.
- Head hit causes stronger stagger chance.
- Body hit slows enemy briefly.
- Death animation can be simple fall/collapse.

## 11. Enemy Design

Enemy type 1: **Infected Villager**

- Slow approach.
- Detects player by radius or line of sight.
- Attacks in melee range.
- Can be staggered by headshots.

Suggested values:

- Health: 75.
- Walk speed: 1.2 m/s.
- Attack range: 1.2 m.
- Attack damage: 15.
- Attack cooldown: 1.4 seconds.
- Detection radius: 10 m.

Enemy type 2: **Hook Infected**

- Faster pressure enemy.
- Strafes slightly before attacking.
- Higher damage but lower health.

Suggested values:

- Health: 60.
- Walk speed: 1.8 m/s.
- Attack damage: 22.
- Detection radius: 12 m.

Enemy type 3: **Armored Infected**

- Appears in Chapel Crypt.
- Slower but tankier.
- Reduced body damage.

Suggested values:

- Health: 140.
- Walk speed: 0.9 m/s.
- Body damage multiplier: 0.65.
- Head damage multiplier: 1.5.

Boss: **The Bellkeeper**

- Large enemy with telegraphed attacks.
- Uses arena movement rather than complex pathfinding.
- Has clear recovery windows.

Boss suggested values:

- Health: 700.
- Phase 2 starts at 50 percent health.
- Melee damage: 25.
- Charge damage: 35.
- Slam damage: 20.

AI state machine:

- Idle.
- Alert.
- Chase.
- Attack windup.
- Attack active.
- Attack recovery.
- Staggered.
- Dead.

Navigation for first version:

- Use simple waypoint graph per zone.
- Enemies chase directly if line-of-sight path is simple.
- Use Rapier colliders to prevent walking through walls.
- Avoid full navmesh until core combat feels good.

## 12. Loot And Inventory

Pickup types:

- Handgun ammo.
- Shotgun shells.
- Small herb.
- Mixed herb.
- First aid spray.
- Gate key.
- Emblem.
- Notes.

Inventory model for first playable:

- Simple list, not grid-based.
- Weapon slots: handgun and optional shotgun.
- Ammo counts shown in HUD.
- Healing items stack by type.
- Key items shown separately.

Interaction rules:

- Loot uses proximity prompt.
- Press E to pick up.
- Pickup text appears for 2 seconds.
- Key items cannot be dropped.
- Ammo cannot exceed reserve cap.

Resource pacing:

- Zone 1 gives enough ammo to survive mistakes.
- Zone 2 creates pressure and introduces scarcity.
- Zone 3 gives final supplies before boss.
- Boss arena contains limited emergency loot.

## 13. Progression And Gates

Progression flags:

- `hasVillageGateKey`.
- `villageGateOpened`.
- `millCrankCompleted`.
- `hasIronSunEmblem`.
- `chapelAltarSolved`.
- `bossDefeated`.
- `escapeGateOpened`.

Checkpoints:

- Start of Zone 1.
- After opening village gate.
- Before Chapel Crypt.
- Before boss arena.

Save data boundary:

- Save simulation state only.
- Do not save Three.js meshes, materials, cameras, or physics object references.

Serializable save data:

- Current checkpoint id.
- Player health.
- Inventory.
- Ammo.
- Progression flags.
- Alive/dead state of enemies by encounter id.
- Opened gates and collected loot ids.

## 14. HUD And UI

Normal play HUD:

- Small objective chip at top-left.
- Health indicator bottom-left.
- Ammo indicator bottom-right.
- Interaction prompt near center-bottom.
- Reticle only when aiming.

Menus:

- Pause menu.
- Inventory.
- Controls help.
- Death screen.
- Win screen.

UI rule:

- Use DOM overlays for text and menus.
- Keep persistent HUD minimal so the 3D scene remains readable.

## 15. Art Direction

Style:

- Low-poly gothic rural horror.
- Foggy night setting.
- Warm lantern lights against cold blue moonlight.
- Strong silhouettes and readable enemy shapes.

Environment assets:

- Road pieces.
- Dead trees.
- Stone walls.
- Wooden fences.
- Village gate.
- Windmill.
- Barn.
- Chapel.
- Crypt walls.
- Bell tower.
- Loot crates.
- Herbs and ammo boxes.

Character assets:

- Player survivor, small but readable.
- Standard infected.
- Hook infected.
- Armored infected.
- Boss infected.

Animation needs:

- Player idle.
- Player walk.
- Player run.
- Player aim idle.
- Player aim walk.
- Player shoot.
- Player reload.
- Player damage.
- Player death.
- Enemy idle.
- Enemy walk.
- Enemy attack.
- Enemy hit.
- Enemy stagger.
- Enemy death.
- Boss idle.
- Boss walk.
- Boss melee.
- Boss charge.
- Boss slam.
- Boss stagger.
- Boss death.

Prototype asset approach:

- Start with primitives and placeholder capsules.
- Replace with low-poly GLB assets once mechanics work.
- Use simple animation clips before polishing.

## 16. Audio Direction

Audio categories:

- Footsteps.
- Gunshots.
- Reload.
- Enemy growls.
- Enemy hit.
- Enemy death.
- Pickup sound.
- Gate unlock.
- Ambient wind.
- Distant bell.
- Boss roar.
- Low tension music.
- Boss music.

Implementation:

- Use Three.js positional audio for enemies and world emitters.
- Use regular browser audio for UI sounds.
- Add volume controls in settings later.

## 17. Technical Architecture

Recommended source layout:

```text
src/
  main.ts
  game/
    simulation/
      GameState.ts
      player.ts
      enemies.ts
      combat.ts
      inventory.ts
      progression.ts
      encounters.ts
    content/
      zones.ts
      lootTables.ts
      weapons.ts
      enemies.ts
    input/
      actions.ts
      keyboardMouse.ts
    save/
      checkpoints.ts
      serialize.ts
  render/
    app/
      createRenderer.ts
      createScene.ts
      createCamera.ts
      createLoop.ts
    cameras/
      thirdPersonCamera.ts
      aimCamera.ts
    loaders/
      loadGltf.ts
      assetManifest.ts
    objects/
      playerView.ts
      enemyView.ts
      lootView.ts
      mapView.ts
    effects/
      muzzleFlash.ts
      hitSpark.ts
      fog.ts
    adapters/
      renderBridge.ts
  physics/
    world.ts
    colliders.ts
    characterController.ts
  ui/
    hud/
    menus/
    prompts/
  diagnostics/
    debugFlags.ts
    perf.ts
```

Architecture rules:

- Simulation owns health, ammo, enemy state, loot state, progression, and win/loss rules.
- Renderer owns meshes, animation mixers, lights, particles, and post-processing.
- Physics owns rigid bodies, colliders, raycasts, and movement constraints.
- UI owns DOM HUD and menus.
- Input maps physical keys/buttons to game actions in one place.

Main loop order:

1. Read input.
2. Update simulation.
3. Step physics.
4. Sync simulation and physics.
5. Update camera.
6. Sync render objects from simulation state.
7. Render scene.
8. Update DOM HUD.

## 18. Physics And Collision

Use Rapier for:

- Player capsule controller.
- Enemy capsules.
- Static map colliders.
- Pickup trigger zones.
- Interaction trigger zones.
- Bullet raycasts.
- Camera obstruction raycasts.

Collision layers:

- Player.
- Enemy.
- Static world.
- Pickup trigger.
- Interaction trigger.
- Bullet target.
- Camera obstacle.

Simplifications:

- Use capsule colliders for characters.
- Use box colliders for buildings and walls.
- Use invisible collision proxies instead of detailed mesh collision.
- Hitscan bullets are acceptable for first playable.

## 19. Performance Budget

Target:

- 60 FPS on a mid-range laptop.
- Degraded target of 30 FPS on weaker devices.
- Initial target resolution can use device pixel ratio capped at 1.5.

Budgets:

- Enemies active at once: 6 to 8 maximum.
- Total enemies in map: 15 to 20.
- Boss arena active enemies: boss plus 2 minions.
- Draw calls: keep under 200 for first playable.
- Texture sizes: prefer 1K or lower for most props.
- Post-processing: optional, one pass maximum early on.

Optimization:

- Use GLB assets.
- Merge simple static props where practical.
- Use texture atlases for repeated props.
- Use fog and lighting to hide draw distance limits.
- Dispose geometries, materials, and textures when unloading test scenes.

## 20. Debug Tools

Debug toggles:

- Show FPS.
- Show player position.
- Show enemy states.
- Show enemy detection radius.
- Show colliders.
- Show raycast hit point.
- Give ammo.
- Toggle god mode.
- Skip to zone.
- Spawn enemy.

Debug keys should only be enabled in development builds.

## 21. Milestone Plan

### Milestone 0: Project Setup

Goal:

- Create Vite + TypeScript + Three.js base project.

Deliverables:

- App boots to a WebGL canvas.
- Basic renderer, scene, camera, resize handling.
- DOM HUD shell.
- Simple debug FPS display.

### Milestone 1: Player And Camera

Goal:

- Make third-person movement and camera feel usable.

Deliverables:

- Player capsule placeholder.
- WASD movement.
- Mouse look.
- Follow camera.
- Aim camera mode.
- Reticle while aiming.
- Camera collision.

### Milestone 2: Map Blockout

Goal:

- Build the full one-map route as graybox geometry.

Deliverables:

- Zone 1 road.
- Zone 2 mill yard.
- Zone 3 chapel crypt.
- Boss arena.
- Static colliders.
- Zone triggers.
- Checkpoint positions.

### Milestone 3: Combat Prototype

Goal:

- Make shooting and enemy damage work.

Deliverables:

- Handgun.
- Ammo and reload.
- Hitscan raycast.
- Enemy health.
- Hit reactions.
- Enemy death.
- Player damage.
- Death and respawn.

### Milestone 4: Enemy AI

Goal:

- Make enemies threaten the player.

Deliverables:

- Enemy state machine.
- Detection radius.
- Chase.
- Attack windup/active/recovery.
- Stagger.
- Encounter spawns.
- Basic group pressure.

### Milestone 5: Loot And Progression

Goal:

- Connect combat to exploration.

Deliverables:

- Pickup system.
- Inventory list.
- Healing.
- Key items.
- Gates.
- Mill crank interaction.
- Chapel emblem interaction.
- Objectives update correctly.

### Milestone 6: Boss Fight

Goal:

- Add a complete final encounter.

Deliverables:

- Boss placeholder model.
- Boss health bar.
- Two boss phases.
- Charge attack.
- Slam attack.
- Minion summon.
- Arena emergency loot.
- Win state.

### Milestone 7: Art, Audio, And Polish

Goal:

- Replace placeholders and improve presentation.

Deliverables:

- Low-poly GLB environment props.
- Character/enemy models.
- Basic animations.
- Lighting pass.
- Fog pass.
- Gunshot/reload/pickup/enemy audio.
- Pause, death, and win screens.

## 22. Minimum Viable Asset List

Required for first playable:

- Player placeholder capsule or low-poly survivor.
- Standard infected placeholder.
- Hook infected visual variant.
- Armored infected visual variant.
- Boss placeholder.
- Road, walls, gates, barn, chapel, crypt, tower blockout meshes.
- Ammo pickup.
- Herb pickup.
- Key item pickup.
- Crate prop.
- Lantern prop.

Nice to have:

- Animated hands or weapon model.
- Destructible crates.
- Blood or fungal hit effects.
- Environmental decals.
- Door opening animations.
- Boss-specific arena props.

## 23. Testing Requirements

Functional checks:

- Player cannot leave map bounds.
- Player cannot shoot without ammo.
- Reload works only when ammo reserve exists.
- Pickups cannot be collected twice.
- Gates remain open after checkpoint reload.
- Enemies cannot attack after death.
- Player death restores checkpoint state.
- Boss arena cannot be skipped before required progression.
- Win state triggers only after boss defeat.

Feel checks:

- Camera does not clip through main walls.
- Aim camera is not disorienting.
- Enemy attacks are readable.
- Ammo is enough for normal play.
- Boss attacks are telegraphed.
- HUD does not block aiming.

Performance checks:

- FPS remains stable in Mill Yard with maximum active enemies.
- Boss fight remains stable with boss, minions, particles, and HUD active.
- No major memory growth after restarting from death several times.

## 24. Key Risks And Mitigations

Risk: Third-person camera feels bad.

- Mitigation: Build camera first, tune before adding complex content.

Risk: Enemy navigation becomes too complex.

- Mitigation: Use simple waypoint zones and direct chase first. Add navmesh only if blockout requires it.

Risk: Scope becomes too large.

- Mitigation: Keep inventory simple, use one map, limit weapons, and ship graybox combat before art.

Risk: Browser performance drops.

- Mitigation: Cap active enemies, use low-poly GLB assets, limit post-processing, and profile early.

Risk: Asset creation blocks progress.

- Mitigation: Use primitive placeholders first, then replace assets system by system.

Risk: Too close to Resident Evil 4 IP.

- Mitigation: Keep original title, setting, map, characters, enemies, bosses, icons, UI, audio, and narrative.

## 25. Recommended Next Step

Build the first playable in this order:

1. Scaffold Vite + TypeScript + Three.js.
2. Implement renderer, loop, and HUD shell.
3. Implement player movement and third-person camera.
4. Add Rapier collision and map blockout.
5. Add handgun combat and one enemy.
6. Expand into zones, loot, progression, then boss.

The first implementation target should not be a pretty scene. It should be a graybox where the camera, movement, aiming, shooting, pickups, enemy pressure, checkpoints, and final boss flow are already playable.
