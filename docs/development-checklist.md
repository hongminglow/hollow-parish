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

### Player Physics

- [x] Create Rapier world.
- [x] Add player capsule collider.
- [x] Add gravity.
- [x] Add ground detection.
- [x] Add character movement integration.
- [x] Prevent player from passing through static colliders.
- [x] Add player spawn position.
- [x] Add respawn position support.

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

- [ ] Implement `Idle`.
- [ ] Implement `Alert`.
- [ ] Implement `Chase`.
- [ ] Implement `AttackWindup`.
- [ ] Implement `AttackActive`.
- [ ] Implement `AttackRecovery`.
- [ ] Implement `Staggered`.
- [ ] Implement `Dead`.
- [ ] Add state transition logging in debug mode.

### Enemy Movement

- [ ] Add enemy capsule collider.
- [ ] Add enemy movement speed.
- [ ] Add direct chase movement.
- [ ] Add simple obstacle response.
- [ ] Add per-zone waypoint fallback.
- [ ] Prevent enemies from stacking too tightly.
- [ ] Prevent enemies from pushing player through walls.

### Enemy Detection

- [ ] Add detection radius.
- [ ] Add line-of-sight check.
- [ ] Add hearing/noise trigger from gunshot.
- [ ] Add alert propagation within encounter.
- [ ] Add dormant enemy wake trigger.

### Enemy Attacks

- [ ] Add melee range check.
- [ ] Add attack windup.
- [ ] Add active damage window.
- [ ] Add recovery time.
- [ ] Add attack cooldown.
- [ ] Add player hit response.
- [ ] Add attack telegraph visual.

### Enemy Variants

- [ ] Add standard infected config.
- [ ] Add hook infected config.
- [ ] Add armored infected config.
- [ ] Add body damage resistance for armored infected.
- [ ] Add per-variant placeholder visuals.

### Encounters

- [ ] Add Zone 1 first enemy.
- [ ] Add Zone 1 shrine enemy wakeup.
- [ ] Add Zone 2 group encounter.
- [ ] Add Zone 2 hook infected.
- [ ] Add Zone 3 dormant infected.
- [ ] Add Zone 3 armored infected.
- [ ] Add encounter reset behavior on checkpoint restart.

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

- [ ] Add pickup simulation state.
- [ ] Add pickup trigger colliders.
- [ ] Add interact prompt for pickups.
- [ ] Add pickup collection event.
- [ ] Prevent duplicate pickup collection.
- [ ] Add pickup text feedback.
- [ ] Add pickup sound placeholder.

### Inventory

- [ ] Add inventory data model.
- [ ] Add ammo item handling.
- [ ] Add healing item handling.
- [ ] Add key item handling.
- [ ] Add simple inventory menu.
- [ ] Add healing action.
- [ ] Add health cap.
- [ ] Add item stack counts.

### Loot Types

- [ ] Add handgun ammo.
- [ ] Add small herb.
- [ ] Add mixed herb.
- [ ] Add first aid spray.
- [ ] Add Village Gate Key.
- [ ] Add Iron Sun Emblem.
- [ ] Add notes.
- [ ] Add optional shotgun shells.
- [ ] Add optional shotgun pickup.

### Gates And Interactions

- [ ] Add village gate lock.
- [ ] Unlock village gate with key.
- [ ] Add mill crank interaction.
- [ ] Add crank progress timer.
- [ ] Interrupt crank on damage.
- [ ] Add chapel altar interaction.
- [ ] Open final arena after emblem placement.
- [ ] Add escape gate locked until boss defeat.

### Objective System

- [ ] Add objective state.
- [ ] Add objective HUD updates.
- [ ] Add Zone 1 objective.
- [ ] Add Zone 2 objective.
- [ ] Add Zone 3 objective.
- [ ] Add boss objective.
- [ ] Add escape objective.

### Checkpoints

- [ ] Add checkpoint state.
- [ ] Add checkpoint trigger.
- [ ] Save player spawn point.
- [ ] Save progression flags.
- [ ] Save collected pickup ids.
- [ ] Save dead encounter ids.
- [ ] Restore state after death.
- [ ] Add anti-soft-lock ammo restoration if needed.

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

- [ ] Add boss simulation state.
- [ ] Add boss placeholder model.
- [ ] Add boss collider.
- [ ] Add boss health.
- [ ] Add boss health bar.
- [ ] Add boss arena activation trigger.
- [ ] Lock arena after boss starts.

### Boss Phase 1

- [ ] Add slow pursuit.
- [ ] Add melee swing.
- [ ] Add charge windup.
- [ ] Add charge movement.
- [ ] Add wall impact recovery.
- [ ] Add vulnerability window after charge miss.
- [ ] Add boss stagger feedback.

### Boss Phase 2

- [ ] Trigger phase 2 at 50 percent health.
- [ ] Increase boss movement pressure.
- [ ] Add ground slam windup.
- [ ] Add ground slam damage area.
- [ ] Add minion summon.
- [ ] Limit active minions.
- [ ] Add phase transition feedback.

### Boss Completion

- [ ] Add boss death state.
- [ ] Unlock escape gate after boss death.
- [ ] Add victory interaction.
- [ ] Add win screen.
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
- [ ] Replace forest props.
- [ ] Replace village gate.
- [ ] Replace mill yard props.
- [ ] Replace barn props.
- [ ] Replace chapel props.
- [ ] Replace crypt props.
- [ ] Replace bell tower props.
- [ ] Add loot crate visuals.
- [ ] Add lantern visuals.

### Character Art

- [ ] Add player GLB.
- [ ] Add standard infected GLB.
- [ ] Add hook infected GLB.
- [ ] Add armored infected GLB.
- [ ] Add boss GLB.
- [ ] Confirm consistent scale and pivots.
- [ ] Confirm collision proxies match visuals.

### Animation

- [ ] Add player idle.
- [ ] Add player walk.
- [ ] Add player run.
- [ ] Add player aim idle.
- [ ] Add player aim walk.
- [ ] Add player shoot.
- [ ] Add player reload.
- [ ] Add player damage.
- [ ] Add player death.
- [ ] Add enemy idle.
- [ ] Add enemy walk.
- [ ] Add enemy attack.
- [ ] Add enemy hit.
- [ ] Add enemy stagger.
- [ ] Add enemy death.
- [ ] Add boss animations.

### Lighting And Atmosphere

- [ ] Add cold moonlight pass.
- [ ] Add warm lantern contrast.
- [ ] Tune fog density.
- [ ] Add zone-specific lighting.
- [ ] Improve boss arena readability.
- [ ] Keep enemies readable against background.

### Audio

- [ ] Add footsteps.
- [ ] Add gunshot.
- [ ] Add reload.
- [ ] Add enemy growls.
- [ ] Add enemy hit.
- [ ] Add enemy death.
- [ ] Add pickup sound.
- [ ] Add gate unlock sound.
- [ ] Add ambient wind.
- [ ] Add distant bell.
- [ ] Add boss roar.
- [ ] Add boss music placeholder.

### UI Polish

- [ ] Style HUD.
- [ ] Style objective chip.
- [ ] Style reticle.
- [ ] Style inventory menu.
- [ ] Style pause menu.
- [ ] Style death screen.
- [ ] Style win screen.
- [ ] Add settings stub.

### Phase 7 Acceptance

- [ ] Game still completes from start to finish.
- [ ] Visuals match low-poly gothic rural horror direction.
- [ ] Audio feedback supports combat and pickups.
- [ ] UI is readable and does not block aiming.
- [ ] Browser performance remains stable.

## Phase 8: QA, Balancing, And Release Candidate

Goal: stabilize the prototype into a playable end-to-end build.

### Functional QA

- [ ] Player cannot leave map bounds.
- [ ] Player cannot shoot without ammo.
- [ ] Reload works only when reserve ammo exists.
- [ ] Pickups cannot be collected twice.
- [ ] Gates remain open after checkpoint reload.
- [ ] Enemies cannot attack after death.
- [ ] Dead enemies do not block progression.
- [ ] Player death restores checkpoint state.
- [ ] Boss arena cannot be skipped early.
- [ ] Win state triggers only after boss defeat.

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
- [ ] Texture sizes stay within budget.
- [ ] Device pixel ratio cap works.

### Browser QA

- [ ] Chrome latest works.
- [ ] Edge latest works.
- [ ] Firefox latest works if targeted.
- [ ] Window resize works.
- [ ] Pointer lock works.
- [ ] Pause and resume work.
- [ ] Audio starts only after user gesture.

### Release Candidate

- [ ] Build succeeds.
- [ ] Preview build runs locally.
- [ ] README setup instructions are accurate.
- [ ] Known issues are documented.
- [ ] Credits and asset licenses are documented.
- [ ] Final playthrough completed from fresh load.

## Backlog And Stretch Goals

- [ ] Add shotgun.
- [ ] Add kick or shove against staggered enemies.
- [ ] Add destructible loot crates.
- [ ] Add controller support.
- [ ] Add simple settings menu.
- [ ] Add save/load from local storage.
- [ ] Add enemy weak points beyond headshots.
- [ ] Add improved enemy navigation or navmesh.
- [ ] Add more notes and environmental storytelling.
- [ ] Add screen-space post-processing.
- [ ] Add accessibility options for reticle, motion, and audio.

## Current Next Item

- [ ] Visually playtest Phase 3 combat in browser, then start Phase 4 enemy AI.
