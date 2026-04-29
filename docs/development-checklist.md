# Hollow Parish Development Checklist

This checklist tracks development progress for the Three.js third-person survival shooter prototype. Use it as the working board for phase-by-phase implementation.

Related documents:

- Full design spec: [game-spec.md](./game-spec.md)
- Project overview: [../README.md](../README.md)

## Status Rules

- Use unchecked boxes for remaining work.
- Check items only when implemented and manually verified in the browser.
- Keep gameplay systems separated by responsibility: simulation, rendering, physics, input, UI, and diagnostics.
- Build graybox functionality first. Art, animation, audio, and polish come after the gameplay loop works.

## Phase 0: Project Setup

Goal: create a stable Vite, TypeScript, and Three.js base project.

### Setup Tasks

- [x] Initialize Vite TypeScript project.
- [x] Install `three`.
- [x] Install `@types/three` if needed by the selected Three.js version.
- [x] Install Rapier JS.
- [x] Add formatting and linting tools.
- [x] Add local development scripts.
- [x] Add production build script.
- [x] Add project folder structure.
- [x] Add basic asset folders.
- [x] Add README setup instructions once scripts exist.

### Runtime Shell

- [x] Create root app entry.
- [x] Create WebGL canvas mount.
- [x] Create Three.js renderer.
- [x] Create scene.
- [x] Create camera.
- [x] Add resize handling.
- [x] Add animation loop.
- [x] Add fixed or semi-fixed simulation timestep.
- [x] Add browser visibility handling.
- [x] Add WebGL context loss handling stub.

### Initial Visual Scene

- [x] Add test floor.
- [x] Add placeholder player capsule.
- [x] Add directional light.
- [x] Add ambient or hemisphere light.
- [x] Add fog placeholder.
- [x] Add simple sky/background color.
- [ ] Confirm scene renders in browser.

### DOM UI Shell

- [x] Add HUD root.
- [x] Add objective chip.
- [x] Add health display placeholder.
- [x] Add ammo display placeholder.
- [x] Add interaction prompt placeholder.
- [x] Add reticle element hidden by default.
- [x] Add pause overlay placeholder.
- [x] Add standalone title menu before game runtime loads.
- [x] Add continue/settings title menu flow.

### Diagnostics

- [x] Add FPS counter.
- [x] Add debug flag registry.
- [x] Add debug overlay toggle.
- [x] Add player position display.
- [x] Add basic error boundary or runtime error overlay note.

### Phase 0 Acceptance

- [x] `npm run dev` starts the game.
- [ ] Browser shows a 3D scene.
- [ ] Renderer resizes correctly.
- [ ] HUD appears over the canvas.
- [x] FPS/debug overlay can be toggled.
- [ ] No console errors on first load.

## Phase 1: Input, Player, And Camera

Goal: make movement and the third-person camera feel usable before building combat.

### Input System

- [x] Define action names.
- [x] Map keyboard and mouse inputs to actions.
- [x] Track pressed, held, and released action states.
- [x] Add pointer lock request.
- [x] Add pointer lock release handling.
- [x] Add mouse delta collection.
- [x] Pause input when menus are open.
- [x] Prevent browser scroll or context menu where needed.

### Player Simulation

- [x] Create player simulation state.
- [x] Add player health.
- [x] Add player movement velocity.
- [x] Add player yaw.
- [x] Add player aim state.
- [x] Add player sprint state.
- [x] Add player dead state.
- [x] Add movement speed values.
- [x] Add aim movement slowdown.
- [x] Add sprint movement speed.
- [x] Add jump action with stamina cost.

### Player Physics

- [x] Create Rapier world.
- [x] Add player capsule collider.
- [x] Add gravity.
- [x] Add ground detection.
- [x] Add character movement integration.
- [x] Prevent player from passing through static colliders.
- [x] Add player spawn position.
- [x] Add respawn position support.
- [x] Add jump movement integration.

### Third-Person Camera

- [x] Add camera yaw and pitch state.
- [x] Clamp camera pitch.
- [x] Add smooth follow camera.
- [x] Add default third-person camera distance.
- [x] Add aim camera offset.
- [x] Add aim FOV transition.
- [x] Add camera-relative movement.
- [x] Add camera collision raycast.
- [x] Hide reticle outside aim mode.
- [x] Show reticle during aim mode.

### Player Rendering

- [x] Sync player view from simulation state.
- [x] Rotate player toward movement direction.
- [x] Rotate player toward camera direction while aiming.
- [x] Add placeholder walk/run visual feedback.
- [x] Add placeholder aim pose feedback.

### Phase 1 Acceptance

- [ ] Player moves with WASD.
- [ ] Mouse controls camera.
- [ ] Shift sprints.
- [ ] Right mouse enters aim camera.
- [ ] Reticle appears while aiming.
- [ ] Player cannot pass through test walls.
- [ ] Camera does not clip through major test walls.
- [ ] Movement remains usable at different frame rates.

## Phase 2: Map Blockout

Goal: create the complete graybox route from road to final boss arena.

### World Conventions

- [x] Define world units.
- [x] Define origin and map orientation.
- [x] Define naming convention for zones.
- [x] Define collision proxy convention.
- [x] Define spawn point convention.
- [x] Define interaction trigger convention.

### Zone 1: Abandoned Road

- [x] Block out forest road.
- [x] Add broken cart cover.
- [x] Add small shrine.
- [x] Add locked village gate.
- [x] Add side shack.
- [x] Add basic lighting markers.
- [x] Add static colliders.
- [x] Add enemy spawn markers.
- [x] Add loot spawn markers.
- [x] Add checkpoint marker.

### Zone 2: Mill Yard

- [x] Block out open yard.
- [x] Add windmill silhouette.
- [x] Add barn interior.
- [x] Add raised walkway.
- [x] Add locked storehouse.
- [x] Add shortcut door route.
- [x] Add static colliders.
- [x] Add enemy spawn markers.
- [x] Add loot spawn markers.
- [x] Add crank interaction marker.

### Zone 3: Chapel Crypt

- [x] Block out chapel entrance.
- [x] Add basement stairs.
- [x] Add crypt corridors.
- [x] Add side room for emblem.
- [x] Add altar interaction point.
- [x] Add exit ladder or transition route.
- [x] Add low-visibility lighting pass.
- [x] Add static colliders.
- [x] Add enemy spawn markers.
- [x] Add final pre-boss checkpoint marker.

### Final Arena: Bell Tower Courtyard

- [x] Block out circular courtyard.
- [x] Add bell tower center shape.
- [x] Add collapsed wall cover pieces.
- [x] Add arena boundary.
- [x] Add emergency loot corners.
- [x] Add boss spawn marker.
- [x] Add minion spawn markers.
- [x] Add escape gate.
- [x] Add arena static colliders.
- [x] Add solid collision proxies for major scenery props.

### Zone Flow

- [x] Add zone trigger volumes.
- [x] Add objective trigger points.
- [x] Add player respawn points per checkpoint.
- [x] Add map bounds.
- [x] Add development skip-to-zone debug command.

### Phase 2 Acceptance

- [ ] Player can walk from Zone 1 to boss arena in graybox.
- [ ] Player cannot leave the intended map.
- [ ] Each zone has readable shape and route direction.
- [ ] Checkpoint positions are reachable.
- [ ] Major collision surfaces work.
- [ ] No major camera collision failures in core routes.

## Phase 3: Combat Prototype

Goal: make basic aiming, shooting, damage, ammo, reload, and death work.

### Weapon Simulation

- [x] Add weapon data model.
- [x] Add handgun weapon config.
- [x] Add magazine ammo count.
- [x] Add reserve ammo count.
- [x] Add fire cooldown.
- [x] Add reload state.
- [x] Add reload timer.
- [x] Add cannot-fire-without-ammo rule.
- [x] Add cannot-fire-while-reloading rule.
- [x] Add ammo reserve cap.

### Shooting

- [x] Add aim requirement for firing.
- [x] Add hitscan raycast from camera center.
- [x] Add bullet target collision layer.
- [x] Add body hit result.
- [x] Add head hit result.
- [x] Add miss result.
- [x] Add muzzle flash placeholder.
- [x] Add hit spark placeholder.
- [x] Add screen feedback for shot.
- [x] Add debug raycast display.

### Enemy Damage

- [x] Add enemy health.
- [x] Apply handgun damage.
- [x] Apply headshot multiplier.
- [x] Apply stagger chance.
- [x] Add death state.
- [x] Prevent dead enemies from taking repeated combat actions.
- [x] Add simple death visual.

### Player Damage And Death

- [x] Add player damage event.
- [x] Add invulnerability window after hit.
- [x] Add health HUD update.
- [x] Add player death state.
- [x] Add death overlay.
- [x] Add restart from checkpoint action.

### Phase 3 Acceptance

- [ ] Player can aim and shoot a target.
- [ ] Ammo decreases correctly.
- [ ] Reload refills magazine from reserve.
- [ ] Enemy health decreases on hit.
- [ ] Enemy dies at zero health.
- [ ] Player can take damage and die.
- [ ] Player can restart from checkpoint.

## Phase 4: Enemy AI

Goal: make enemies detect, chase, attack, stagger, and pressure the player.

### AI State Machine

- [x] Implement `Idle`.
- [x] Implement `Alert`.
- [x] Implement `Chase`.
- [x] Implement `AttackWindup`.
- [x] Implement `AttackActive`.
- [x] Implement `AttackRecovery`.
- [x] Implement `Staggered`.
- [x] Implement `Dead`.
- [ ] Add state transition logging in debug mode.

### Enemy Movement

- [ ] Add enemy capsule collider.
- [x] Add enemy movement speed.
- [x] Add direct chase movement.
- [x] Add simple obstacle response.
- [ ] Add per-zone waypoint fallback.
- [x] Prevent enemies from stacking too tightly.
- [x] Prevent enemies from pushing player through walls.

### Enemy Detection

- [x] Add detection radius.
- [x] Add line-of-sight check.
- [x] Add hearing/noise trigger from gunshot.
- [x] Add alert propagation within encounter.
- [x] Add dormant enemy wake trigger.

### Enemy Attacks

- [x] Add melee range check.
- [x] Add attack windup.
- [x] Add active damage window.
- [x] Add recovery time.
- [x] Add attack cooldown.
- [x] Add player hit response.
- [x] Add attack telegraph visual.

### Enemy Variants

- [x] Add standard infected config.
- [x] Add hook infected config.
- [x] Add armored infected config.
- [x] Add body damage resistance for armored infected.
- [x] Add per-variant placeholder visuals.

### Encounters

- [x] Add Zone 1 first enemy.
- [ ] Add Zone 1 shrine enemy wakeup.
- [x] Add Zone 2 group encounter.
- [x] Add Zone 2 hook infected.
- [x] Add Zone 3 dormant infected.
- [x] Add Zone 3 armored infected.
- [x] Add encounter reset behavior on checkpoint restart.

### Phase 4 Acceptance

- [ ] Enemies detect player correctly.
- [ ] Enemies chase without major collision bugs.
- [ ] Enemy attacks are readable.
- [ ] Enemy damage timing feels fair.
- [ ] Gunshots attract nearby enemies.
- [ ] All three non-boss enemy types are functional.

## Phase 5: Loot, Inventory, And Progression

Goal: connect exploration, resource management, gates, and objectives.

### Pickup System

- [x] Add pickup simulation state.
- [x] Add pickup trigger colliders.
- [x] Add interact prompt for pickups.
- [x] Add pickup collection event.
- [x] Prevent duplicate pickup collection.
- [x] Add pickup text feedback.
- [ ] Add pickup sound placeholder.

### Inventory

- [x] Add inventory data model.
- [x] Add ammo item handling.
- [x] Add healing item handling.
- [x] Add key item handling.
- [x] Add simple inventory menu.
- [x] Add healing action.
- [x] Add health cap.
- [x] Add item stack counts.

### Loot Types

- [x] Add handgun ammo.
- [x] Add small herb.
- [x] Add mixed herb.
- [x] Add first aid spray.
- [x] Add Village Gate Key.
- [x] Add Iron Sun Emblem.
- [x] Add notes.
- [ ] Add optional shotgun shells.
- [ ] Add optional shotgun pickup.

### Gates And Interactions

- [x] Add village gate lock.
- [x] Unlock village gate with key.
- [x] Add mill crank interaction.
- [x] Add crank progress timer.
- [x] Interrupt crank on damage.
- [x] Add chapel altar interaction.
- [x] Open final arena after emblem placement.
- [x] Add escape gate locked until boss defeat.

### Objective System

- [x] Add objective state.
- [x] Add objective HUD updates.
- [x] Add Zone 1 objective.
- [x] Add Zone 2 objective.
- [x] Add Zone 3 objective.
- [x] Add boss objective.
- [x] Add escape objective.

### Checkpoints

- [x] Add checkpoint state.
- [x] Add checkpoint trigger.
- [x] Save player spawn point.
- [x] Save progression flags.
- [x] Save collected pickup ids.
- [x] Save dead encounter ids.
- [x] Restore state after death.
- [x] Add anti-soft-lock ammo restoration if needed.

### Phase 5 Acceptance

- [ ] Player can collect loot.
- [ ] Inventory updates correctly.
- [ ] Healing works.
- [ ] Key items unlock correct blockers.
- [ ] Objectives update correctly.
- [ ] Checkpoints restore expected state.
- [ ] Player cannot soft-lock because of zero ammo before required fights.

## Phase 6: Boss Fight

Goal: add a complete final boss encounter with two phases and a win state.

### Boss Foundation

- [x] Add boss simulation state.
- [x] Add boss placeholder model.
- [x] Add boss collider.
- [x] Add boss health.
- [x] Add boss health bar.
- [x] Add boss arena activation trigger.
- [x] Lock arena after boss starts.

### Boss Phase 1

- [x] Add slow pursuit.
- [x] Add melee swing.
- [x] Add charge windup.
- [x] Add charge movement.
- [x] Add wall impact recovery.
- [x] Add vulnerability window after charge miss.
- [x] Add boss stagger feedback.

### Boss Phase 2

- [x] Trigger phase 2 at 50 percent health.
- [x] Increase boss movement pressure.
- [x] Add ground slam windup.
- [x] Add ground slam damage area.
- [x] Add minion summon.
- [x] Limit active minions.
- [x] Add phase transition feedback.

### Boss Completion

- [x] Add boss death state.
- [x] Unlock escape gate after boss death.
- [x] Add victory interaction.
- [x] Add win screen.
- [ ] Add completion stats.

### Phase 6 Acceptance

- [ ] Boss can be defeated.
- [ ] Boss attacks are readable.
- [ ] Boss phase transition works.
- [ ] Minions do not overwhelm performance or fairness.
- [ ] Win state triggers only after boss defeat and gate interaction.

## Phase 7: Art, Animation, Audio, And Polish

Goal: replace graybox presentation while preserving performance and readability.

### Environment Art

- [ ] Replace road placeholders.
- [x] Replace forest props.
- [ ] Replace village gate.
- [x] Replace mill yard props.
- [ ] Replace barn props.
- [ ] Replace chapel props.
- [x] Replace crypt props.
- [x] Replace bell tower props.
- [ ] Add loot crate visuals.
- [x] Add lantern visuals.

### Character Art

- [ ] Add player GLB.
- [ ] Add standard infected GLB.
- [ ] Add hook infected GLB.
- [ ] Add armored infected GLB.
- [ ] Add boss GLB.
- [ ] Confirm consistent scale and pivots.
- [ ] Confirm collision proxies match visuals.

### Animation

- [x] Add player idle.
- [x] Add player walk.
- [x] Add player run.
- [x] Add player aim idle.
- [x] Add player aim walk.
- [ ] Add player shoot.
- [ ] Add player reload.
- [ ] Add player damage.
- [x] Add player death.
- [x] Add enemy idle.
- [x] Add enemy walk.
- [x] Add enemy attack.
- [x] Add enemy hit.
- [x] Add enemy stagger.
- [ ] Add enemy death.
- [x] Add boss animations.

### Lighting And Atmosphere

- [x] Add cold moonlight pass.
- [x] Add warm lantern contrast.
- [x] Tune fog density.
- [x] Add zone-specific lighting.
- [x] Improve boss arena readability.
- [x] Keep enemies readable against background.

### Audio

- [ ] Add footsteps.
- [x] Add gunshot.
- [x] Add reload.
- [ ] Add enemy growls.
- [x] Add enemy hit.
- [ ] Add enemy death.
- [x] Add pickup sound.
- [x] Add gate unlock sound.
- [ ] Add ambient wind.
- [ ] Add distant bell.
- [x] Add boss roar.
- [ ] Add boss music placeholder.

### UI Polish

- [x] Style HUD.
- [x] Style objective chip.
- [x] Style reticle.
- [x] Style inventory menu.
- [x] Style pause menu.
- [x] Style death screen.
- [x] Style win screen.
- [x] Add settings stub.

### Phase 7 Acceptance

- [ ] Game still completes from start to finish.
- [ ] Visuals match low-poly gothic rural horror direction.
- [ ] Audio feedback supports combat and pickups.
- [ ] UI is readable and does not block aiming.
- [ ] Browser performance remains stable.

## Phase 8: QA, Balancing, And Release Candidate

Goal: stabilize the prototype into a playable end-to-end build.

### Functional QA

- [x] Player cannot leave map bounds.
- [x] Player cannot shoot without ammo.
- [x] Reload works only when reserve ammo exists.
- [x] Pickups cannot be collected twice.
- [x] Gates remain open after checkpoint reload.
- [x] Enemies cannot attack after death.
- [x] Dead enemies do not block progression.
- [x] Player death restores checkpoint state.
- [x] Boss arena cannot be skipped early.
- [x] Win state triggers only after boss defeat.

### Feel QA

- [ ] Camera feels stable during exploration.
- [ ] Camera feels stable during combat.
- [ ] Aim mode is not disorienting.
- [ ] Enemy windups are readable.
- [ ] Enemy damage feels fair.
- [ ] Ammo economy is tense but not frustrating.
- [ ] Boss attacks are telegraphed.
- [ ] Boss fight can be won without perfect play.

### Performance QA

- [ ] Mill Yard runs with maximum active enemies.
- [ ] Chapel Crypt runs with fog and enemies.
- [ ] Boss arena runs with boss, minions, particles, and HUD.
- [ ] Restarting after death does not leak obvious memory.
- [ ] Draw calls stay within budget.
- [x] Texture sizes stay within budget.
- [x] Device pixel ratio cap works.

### Browser QA

- [ ] Chrome latest works.
- [ ] Edge latest works.
- [ ] Firefox latest works if targeted.
- [ ] Window resize works.
- [ ] Pointer lock works.
- [ ] Pause and resume work.
- [x] Audio starts only after user gesture.

### Release Candidate

- [x] Build succeeds.
- [x] Preview build runs locally.
- [x] README setup instructions are accurate.
- [x] Known issues are documented.
- [x] Credits and asset licenses are documented.
- [ ] Final playthrough completed from fresh load.

## Backlog And Stretch Goals

- [ ] Add shotgun.
- [ ] Add kick or shove against staggered enemies.
- [ ] Add destructible loot crates.
- [ ] Add controller support.
- [x] Add simple settings menu.
- [x] Add save/load from local storage.
- [ ] Add enemy weak points beyond headshots.
- [ ] Add improved enemy navigation or navmesh.
- [ ] Add more notes and environmental storytelling.
- [ ] Add screen-space post-processing.
- [ ] Add accessibility options for reticle, motion, and audio.

## Current Next Item

- [ ] Run dedicated GLB asset replacement pass for player, enemy variants, and boss.
