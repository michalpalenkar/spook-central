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

## Milestone 2: Input everywhere (done)

**What's in:**
- **Three input sources, one `InputState`.** `WorldScene` adds `KeyboardInput`, `GamepadInput` and `TouchInput` as sources. Game code still reads only `InputState`.
- **React ↔ Phaser bridge.** `App.jsx` creates one `TouchInput` (`game/systems/TouchInput.js`) and passes it to both `<TouchControls>`, which writes to it, and `<Game>`. `createGameConfig` stores it in the game registry in a `preBoot` callback, and the scene picks it up there. There are no globals and no events. Phaser just polls it like the keyboard.
- **Touch overlay** (`ui/TouchControls.jsx` + `.css`): an HTML overlay above the canvas with a D-pad bottom-left (one round 168 px hit area, 8-way, with arms that light up), a diamond of 4 action buttons bottom-right (62 px; trap top, fire left, dash right, jump bottom, mirroring the gamepad face buttons), and a 56 px pause button top-right. It is semi-transparent and lights ecto-green while held. Placement respects `env(safe-area-inset-*)`.
  - Rendered only when `(pointer: coarse)` matches (`ui/useMediaQuery.js`), so desktop gets no overlay and no listeners.
  - Pointer Events with per-pointer tracking: `pointerdown` on the overlay, then `pointermove`/`up`/`cancel` on `window`. Each move hit-tests again with `elementFromPoint`, so a finger can slide from one button to another. A finger that went down on the D-pad keeps steering when it drifts off the pad, until it slides onto an action button. All fingers are released on `blur` and `visibilitychange`.
  - Taps shorter than a frame are latched, as in `KeyboardInput`.
  - The pure mapping lives in `systems/touchMapping.js` (`dpadDirections`: deadzone and 8 equal sectors; `pointerActions`: which actions a finger holds).
- **Gamepad** (`systems/GamepadInput.js` + pure `systems/gamepadBindings.js`): polls `navigator.getGamepads()` every frame and merges all connected pads. It uses the standard mapping: left stick (per-axis deadzone) and D-pad for move/look, A jump, X / RT fire (analog threshold), Y trap, B / RB dash, Start pause. `GAMEPAD.STICK_DEADZONE` and `TRIGGER_THRESHOLD` are in `constants.js`.
- **Portrait warning** (`ui/RotateDevice.jsx`): a full-screen "Rotate your device" card with an animated inline-SVG phone. It is shown by CSS only on `(pointer: coarse) and (orientation: portrait)`, and the touch controls are hidden in portrait.
- **No browser gestures:** the viewport meta has `maximum-scale=1, user-scalable=no, viewport-fit=cover`. `html, body` get `touch-action: none`, `overscroll-behavior: none`, `user-select: none`, `-webkit-touch-callout: none` and no tap highlight. `gesturestart` is cancelled (iOS pinch), and so is `contextmenu` on the overlay (long-press).
- **Haptics helper** (`systems/haptics.js`): `vibrate(pattern = HAPTICS.HIT)` is a no-op where `navigator.vibrate` is missing (all iOS browsers), when disabled via `setHapticsEnabled(false)`, or when it throws. It isn't called anywhere yet. Milestone 3 calls it when the player is hit.

**Verified:**
- `pnpm lint`, `pnpm test` (68 tests; new ones cover D-pad sectors and deadzone, finger sliding and anchoring, multi-finger merge, tap latching, every gamepad binding, stick deadzone, trigger threshold, multi-pad merge, and haptics support/disable/error) and `pnpm build` all pass.
- In the dev server (built-in browser, loop stepped at a fixed 60 fps, synthetic `PointerEvent`s with `pointerType: 'touch'` and distinct `pointerId`s):
  - Holding D-pad right moves the player (+63 px in 30 frames) and lights the arm.
  - A second finger holding jump at the same time gives the full 66 px jump while still running. Multitouch works at the event level.
  - Sliding the jump finger onto fire swaps the held action (jump released, fire held).
  - A D-pad finger dragged past the pad's left edge steers left. Lifting both fingers releases everything.
  - A sub-frame tap on jump still jumps (15 px tap height). The pause button sets `pause`.
- Gamepad, with a faked `navigator.getGamepads()`: stick left moves the player, a deflection of 0.2 (inside the deadzone) doesn't, holding A jumps 66 px, and RT and Start register.
- Screenshots:
  - 1280×720 desktop: no overlay, no rotate card.
  - 740×360 mobile landscape (touch emulation): overlay visible, all targets ≥56 px, nothing overlaps.
  - 375×812 portrait: rotate card shown, controls hidden, no scroll.
  - No console errors.

**Known issues / not verified:**
- **844×390 (iPhone 14 landscape) couldn't be checked with the overlay.** The built-in browser only emulates a touch device (`pointer: coarse`) below 768 px wide, so I used 740×360, which is smaller and tighter. At 844×390 without touch emulation, the game renders as before.
- **Not verified on real hardware:** real multitouch (several simultaneous fingers on iOS/Android), finger sliding on a physical screen, iOS Safari zoom/long-press suppression, safe-area insets on a notched phone, haptics (no vibration API in emulation, and none at all on iOS), and a physical gamepad (only the mapping was tested, with a fake pad). These need a check on a device over `pnpm dev --host`.
- Non-standard gamepad mappings are read with standard button indices, as a best effort.
- `pause` is only an action so far. Nothing listens for it until the pause menu (milestone 7). Turning to portrait doesn't pause the game either. It should once a pause state exists.
- The overlay sits over the play area (the D-pad covers the bottom-left of the view at spawn). Fine for now. Revisit during the art pass, and maybe add an opacity setting.

## Next: Milestone 3 — Combat
- Proton stream (hold fire) with tether, a basic ghost enemy, trap throw and capture.
- HP (proton-pack battery pips), damage with hit-stop and `vibrate()` on hit, death and respawn.
