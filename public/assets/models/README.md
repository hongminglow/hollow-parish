# Character GLB Slots

Drop optimized character models here using these exact filenames:

- `player.glb`
- `infected.glb`
- `hook-infected.glb`
- `armored-infected.glb`
- `bell-keeper.glb`

The runtime attempts to load each file when gameplay starts. If a file is missing or invalid, the game keeps the procedural fallback model so development remains playable.

## Asset Contract

- Format: GLB or glTF 2.0 exported as `.glb`.
- Orientation: character faces local negative Z.
- Origin: feet on the ground at local `(0, 0, 0)`.
- Scale: the runtime now auto-normalizes models to the `targetHeight` values in `src/render/objects/characterAssets.ts`.
- Direction fix: if a model consistently faces backward, set its `yawOffset` to `Math.PI` in `src/render/objects/characterAssets.ts`.
- Materials: prefer shared PBR materials, avoid many unique texture sets.
- Textures: keep character textures at or below 1024 px unless a close-up needs more.
- Animations: optional, but supported when included in the GLB. Prefer stable clip names such as `idle`, `walk`, `run`, `aim`, `shoot`, `reload`, `hit`, `attack`, and `death`.
- The current `player.glb` slot is enabled. It should import as a simple non-skinned or cleanly skinned GLB, with any forward-axis correction handled by `yawOffset` in `src/render/objects/characterAssets.ts`.
- Compression: uncompressed GLB works now. Add Draco, Meshopt, or KTX2 only after the runtime loader is updated for that compression path.

## Source Notes

- Quaternius Animated Zombie is CC0 and suitable from a license standpoint, but the source package is FBX/OBJ/Blend rather than GLB, so it needs conversion before shipping.
- Kenney Animated Characters Protagonists is a useful player source, but the downloaded package is FBX plus textures, so it also needs conversion before shipping.
- Do not add unverified marketplace models until the license allows redistribution in a browser game.
