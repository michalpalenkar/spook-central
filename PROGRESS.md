# Progress

## Milestone 1: Skeleton (done)

**What's in:**
- Pinned **Phaser 3.90.0** (latest 3.x; CLAUDE.md asks for Phaser 3, npm's `latest` is 4.x) and **Vitest 5.0.5**. Added the `pnpm test` script (`vitest run`, config in `vite.config.js`).
- `src/Game.jsx` mounts Phaser in React and destroys it on unmount. In dev, the game is on `window.__game` for debugging.
- `game/config.js`: 480×270 internal resolution, `Scale.FIT` + centered, `pixelArt` and `roundPixels`, Arcade Physics.
- Scenes: `Preload`, which generates every texture in code (backdrop gradient, 16 autotiled brick frames plus a plank platform, player frames), then `World`.
- Levels are data. `levels/parseRoom.js` turns an ASCII grid (`#` solid, `=` one-way platform, `P` spawn) into tiles. `levels/autotile.js` picks a brick frame from which edges face open air, so exposed edges get the pale highlight. `levels/testRoom.js` is a 60×20 test room with a pit, steps, a 4-tile wall, a low ceiling and a one-way-platform climb.
- Player (`entities/Player.js`): an invisible Arcade hitbox, plus a separate 16×24 pixel-art sprite (beige jumpsuit, proton pack with a red light) anchored at the feet. Squash and stretch never changes collision. It has idle, 2-frame run, jump and fall animations.
- Movement (`systems/movement.js`, pure): near-instant acceleration, instant turnaround on the ground, variable jump height (releasing early cuts the rise), 100 ms coyote time, 100 ms jump buffer, heavier fall gravity, capped fall speed. All tuning numbers are in `constants.js`.
- Squash on landing (scaled by fall speed) and stretch on jump (`systems/squashStretch.js`).
- One-way platforms: they only catch a body that is falling and started the step above the platform (`systems/oneWayPlatform.js`).
- Input: `systems/InputState.js` merges any number of sources (`poll()` → action map) and exposes `isDown` / `justPressed` / `justReleased` / `horizontal`. `KeyboardInput` is the only source so far. It uses the CLAUDE.md bindings and latches taps shorter than a frame. Game code reads only `InputState`.
- Camera follows the player with lerp and a deadzone, clamped to the room.

**Verified:**
- `pnpm lint`, `pnpm test` (42 tests: room parsing, autotiling, movement feel incl. coyote/buffer/variable jump, input mapping, sprite data, platforms, squash) and `pnpm build` all pass.
- In the dev server (built-in browser, game loop stepped at a fixed 60 fps with synthetic key events):
  - Run speed reaches 135 px/s and stops within 3 frames.
  - A held jump rises 66 px (~4 tiles). A tap rises 15 px.
  - The player jumps up through a one-way platform and lands on it.
  - Walls stop the player, the steps and the 4-tile wall can be climbed, and jumping under the 2-tile-high ceiling caps the rise at 10 px.
- Screenshots at 1280×720 and 844×390 (iPhone 14 landscape emulation): renders and letterboxes correctly, with no page scroll and no console errors.

**Known issues / notes:**
- The canvas renders at 480×270, and the browser upscales it with nearest-neighbour filtering. That keeps render cost independent of devicePixelRatio, so no explicit DPR cap is needed. With `FIT` the scale is usually non-integer (e.g. 1.44× on a phone), so some pixel columns are 1px wider than others. Integer scaling could be revisited in the art pass.
- The production bundle is one ~1.4 MB chunk (~390 kB gzipped), almost all Phaser. Vite warns about chunk size. Code-splitting Phaser out is an option for the polish milestone.
- If jump is released and pressed again within a single frame (<16 ms), Phaser reports the key as continuously held, so the second press is lost. It is unlikely in play but could be fixed by latching press edges in `KeyboardInput`.
- Not verified by hand on real hardware: game feel was checked numerically and in screenshots, not by playing with a physical keyboard at 60/120 Hz.
- No Boot/Title/UI/Pause scenes yet. They come with later milestones.

## Next: Milestone 2 — Input everywhere
- Touch overlay (`ui/TouchControls.jsx`) writing to `InputState` via Pointer Events with per-pointer tracking and finger sliding, shown only on `pointer: coarse`.
- Gamepad source (stick/D-pad, A/X/Y/B/RB/RT/Start).
- Portrait "rotate your device" screen, safe-area insets, viewport meta (no zoom/scroll/long-press), optional haptics hook.
- Verify in mobile emulation.
