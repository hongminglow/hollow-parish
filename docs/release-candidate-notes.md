# Release Candidate Notes

## Verification Commands

Run these before treating a build as releasable:

```bash
npm run format
npm run verify
npm run preview
```

`npm run verify` runs lint and production build checks.

## Known Issues

- Browser visual playtest is still pending because this Codex thread has no exposed browser or screenshot automation tool.
- Current characters, enemies, pickups, and environment dressing are procedural placeholders, not final GLB assets.
- Audio is procedural Web Audio. There are no authored music, ambience, or licensed sound files yet.
- Enemy navigation uses direct chase plus simple obstacle response, not a navmesh.
- The production bundle is larger than Vite's default warning threshold because Three.js and Rapier are bundled together.

## Asset And License Status

- No third-party art, audio, textures, fonts, or GLB models are currently shipped.
- Runtime dependencies are declared in `package.json`: Three.js and Rapier JS.
- All current visuals are generated in code from Three.js primitive geometry and materials.
- All current audio cues are generated at runtime with Web Audio oscillators.

## Release Gate

Do not call this final release until a human visual playtest confirms:

- The full route can be completed from a fresh load.
- The HUD does not obstruct aiming or key interactions.
- Boss telegraphs are readable in motion.
- Checkpoint restart restores expected combat, inventory, and progression state.
- Performance remains stable in Mill Yard, Chapel Crypt, and Bell Tower Courtyard.
