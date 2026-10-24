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

## Milestone 3: Combat (done)

**What's in:**
- **Core loop: weaken, wrangle, trap.** Hold `fire` to shoot the proton stream. It locks onto the nearest ghost in range (150 px, ±35° cone ahead, line of sight through tiles) and tethers it. A tethered ghost stays held up to 190 px away, even behind the player, and the player turns to face it and runs at 45 % speed while firing. The stream wears the ghost down (55 HP/s of 100). At ≤35 % it is **weakened**: it dims and flickers, stops chasing and stops hurting on contact, slows down and sags toward the floor. Ghosts left alone for 2 s recover, so the player has to follow up.
- **Ghost trap** (`trap`): thrown in an arc. While a ghost is tethered the throw is aimed to land beneath it. The trap lands, opens (light turns green) and catches the nearest weakened ghost inside a cone above it (90 px high). A light cone pulls the ghost in over 0.7 s, then a capture hit-stop and a small shake. An empty trap closes after 3 s. The trap returns to the player after closing, so there's one trap at a time.
- **Ecto-essence:** a captured ghost bursts into 3 orbs that pop out, bounce on the floor and home in on the player within 48 px. Each orb is +1 essence. While hurt, every 3 essence collected also restores 1 HP.
- **Ghost enemy** (`entities/Ghost.js`): a 20×22 pixel-art floater with a two-frame swaying tail, an additive ecto glow, a faint afterimage trail (particles) and a bob. It wanders around its home, chases the player inside 130 px (leashed to 200 px from home), and backs off after touching the player. It flies through walls but never sinks into the floor or leaves the room. It shivers while the stream hits it.
- **Player HP and damage:** 5 HP. Ghost contact costs 1 HP with knockback, a 60 ms hit-stop (the physics world pauses), a light camera shake, `vibrate()` from `systems/haptics.js`, and 1 s of invulnerability (the sprite blinks).
- **Death and respawn:** at 0 HP the player flashes white and freezes, the camera fades out, and after 1.2 s the room resets: the player is back at the spawn at full HP, every ghost (captured ones included) respawns, the trap is recalled and loose orbs vanish. Essence is kept. There's no save system yet, so this is the room spawn.
- **HUD** (`scenes/UIScene.js`, its own scene so camera shake doesn't move it): proton-pack battery cells for HP (the lost cell flashes white) and an orb icon plus a 3×5 pixel-font counter for essence. The World scene publishes values through the game registry.
- **Test room:** widened to 78 columns, with an open arena on the right (flat floor, two one-way platforms). Two ghosts are listed as room `entities`: one above the big block, one in the arena.
- **Code layout:** rules live in plain, tested modules in `systems/`: `health` (HP, invulnerability), `ghostState` (weaken threshold, recovery, capture/contact rules), `ghostSteering` (wander/chase/struggle/recoil), `streamTargeting` + `lineOfSight` (acquire, tether, walls), `trapLogic` (throw aim, capture cone, state machine), `essence` (wallet, healing), `hitStop`, `deathSequence` and `overlap`. Entities (`Ghost`, `ProtonStream`, `Trap`, `EssenceOrb`) only move sprites. Art is pixel rows in `art/ghostFrames.js`, `trapFrames.js` and `hudGlyphs.js`, drawn by `art/combatTextures.js`. All tuning is in `constants.js` and colours in `palette.js`.

**Verified:**
- `pnpm lint`, `pnpm test` (134 tests; 66 new for combat logic, room data and pixel-art data) and `pnpm build` all pass.
- In the dev server (built-in browser, loop stepped at a fixed 60 fps, input fed through an extra `InputState` source):
  - Holding fire near the arena ghost tethers it at once and weakens it in ~70 frames (1.2 s).
  - A trap thrown while tethered landed ~10 px from the ghost and started capturing it after 33 frames. The capture finished and 3 orbs dropped. Walking over them raised essence by 3, and the HUD matched.
  - Standing near the block ghost: 5 contact hits, each with hit-stop (physics paused for 4 frames), 1 s invulnerability, knockback, `navigator.vibrate` called (stubbed), and the HUD updated. The 5th hit started the death sequence. After 70 frames the player respawned at the spawn with 5 HP, both ghosts reset to full and free, the trap was ready, the fade had cleared and essence was kept (7).
  - Touch: one finger holding Fire plus a tap on Trap with a second finger threw the trap at the tethered ghost and captured it.
- Screenshots at 1280×720 (stream tether, capture beam, death with the flashing cell) and 740×360 mobile landscape with the touch overlay: the HUD sits top-left, clear of the pause button. No console errors from the game.

**Known issues / not verified:**
- Game feel is only checked numerically and in screenshots, not by playing with real hands. Tuning (stream DPS, ghost speeds, trap timings, contact frequency) will likely need a pass once someone plays it.
- Not verified on real hardware: haptics (stubbed in the test, and absent on iOS), and performance of additive glows and particles on a mid-range phone. There are only 2 ghosts, so it should be cheap, but it hasn't been measured.
- Ghosts pass through walls by design. A ghost inside a wall can't be streamed (no line of sight) until it drifts out.
- The trap's aim assumes flat ground at the player's feet. Thrown off a ledge or at a ghost over a pit, it lands short or long.
- Ghosts and orbs freeze during the death sequence. Only the trail particles keep fading.
- Room-reset-on-death respawns captured ghosts too, so essence can be farmed. This is fine until the save system (milestone 4) defines what persists.
- After a page reload in dev, the console showed two `InvalidStateError: Cannot suspend/resume a closed AudioContext` rejections. They come from Phaser's sound manager in a game instance that was destroyed (React StrictMode mounts twice in dev), not from combat code. Worth silencing (e.g. `audio: { noAudio: true }` until audio exists) in milestone 7.
- No sound yet (milestone 7). Proton hum, trap snap and ghost wail will hook into the same events.

## Milestone 4: World (done)

**What's in:**
- **8 connected rooms in two areas**, each an ASCII grid in `levels/firehouse.js` and `levels/library.js`, collected in `levels/world.js`:
  - **Firehouse (hub, 3 rooms):** Garage (new-game spawn, fire pole, street door), Bunk Room above it (through a ceiling hatch) and Containment below it (through a floor hatch).
  - **NY Public Library (5 rooms):** Front Steps, Reading Room, The Stacks (a tall shaft), Archives (underneath) and Archive Vault. Reading Room → Stacks → Archives → Reading Room is a loop, so you can backtrack either way. The Vault is empty and waits for the Librarian and the PKE Meter (milestone 5).
  - `testRoom.js` is out of the world. In dev, `?room=test-room` (or any room id) starts there.
- **Rooms live in world space.** Each room has an `origin` in world tiles. An exit is room data: `{ edge, span: [first, last], to }`. Because neighbouring rooms line up in world space, walking through keeps your position along the edge. Coming up through a floor gives an upward boost so you can reach the ledge beside the hatch. All pure logic is in `levels/exits.js` (`crossedEdge`, `exitAt`, `matchingExit`, `entryPlacement`).
- **`validateWorld`** checks the whole world in a unit test: unique ids, no overlapping rooms, exits on real edges and open, every border opening covered by an exit, and every exit leading to a room that touches that edge, with a matching exit back. Other tests check that every room can be reached from the start and back, that ghosts float in open air with unique ids, and that hint ids have text.
- **Room transitions:** the World scene restarts for every room behind a short fade (0.18 s out and in). Physics and the player freeze during the fade.
- **Session** (`systems/session.js`, plain object in the registry): current room and how you entered it, HP, wallet, visited rooms, abilities (empty until milestone 5), the respawn point, and the ghosts captured since the last rest. The `InputState` is created once and survives scene restarts.
- **Save system:**
  - **Fire pole** (`entities/FirePole.js`, procedural brass rod plus a warm glow). Standing at it shows a hint, and pressing **up** rests: full HP, every ghost returns, the pole becomes the respawn point, and the save is written. The pole flashes and a toast confirms.
  - **Format** (`systems/saveFormat.js`): `{ version: 1, roomId, essence, maxHp, visited, abilities, savedAt }`. `validateSave` repairs what it safely can (unknown room → start room, unknown visited rooms dropped, bad counts → defaults) and rejects non-objects and saves from newer versions. `migrateSave` upgrades one version at a time from a `MIGRATIONS` table (empty for now, since v1 is the first format; the mechanism is tested with a made-up history).
  - **Storage** (`systems/saveStorage.js`): never throws. It reports `unavailable` (no or blocked `localStorage`), `read-failed`, `corrupt` (bad JSON), `invalid` and `write-failed` (quota, security). A corrupt or invalid save starts a new game with a toast. A failed write still rests and says it couldn't save.
  - **On boot** the game continues at the saved pole if there's a usable save, otherwise it starts a new game. A title screen with New game / Continue is milestone 7.
- **Death returns you to the last save:** the room where you rested, at the pole, with full HP and the essence you had when you saved (essence collected since is lost). Before any save it's the new-game spawn with 0 essence. Rooms seen since the save stay on the map. Ghosts return.
- **Captured ghosts stay gone** until you rest or die (keyed `roomId/ghostId`), so you can't farm a room by walking in and out.
- **Area map** (`systems/areaMap.js` + `ui/Menus.jsx`): `pause` (Esc / Tab / Start / the touch ❚❚ button) toggles it and freezes the game. It fills in as you go: a visited room is drawn as the shape of its open space (row runs merged into rectangles), with doors between known rooms, dashed ecto-green stubs for exits into unexplored rooms, the fire pole (orange once it's your save point), a pulsing player marker, and the area and room name. It's an HTML/SVG overlay with a thin double frame, drawn under the touch controls so the pause button stays visible to close it.
- **Game → React bridge** (`systems/GameBridge.js`): a tiny store App creates and passes to the game through the registry (like `TouchInput`), read with `useSyncExternalStore`. It carries map state, the current hint, toasts and the area banner.
- **In-world messages** (`ui/WorldMessages.jsx`): the area name when you enter a new area, toasts ("progress saved"), and hints from room hint zones (move, climb, map, combat, trap, vault) plus the pole prompt. They're worded for keyboard or touch (`ui/hintText.js`), sit in fixed slots across the top clear of the HUD, the player and the touch controls, and don't take input.
- **Area palettes:** the Library draws its backdrop and bricks in cold teal and parchment (`PALETTE.library`). Each area gets its own generated tileset and backdrop (`areaTextures(area)`).
- New tuning is in `constants.js` (`ROOM_TRANSITION`, `FIRE_POLE`) and new colours in `palette.js` (`library`, `pole`).

**Verified:**
- `pnpm lint`, `pnpm test` (192 tests; 58 new for exits, entry placement, world validation and reachability, save format, validation, migrations, storage errors, session rules, map layout and fill, hints and the bridge) and `pnpm build` all pass.
- In the dev server (built-in browser, loop stepped at a fixed 60 fps, input fed through an extra `InputState` source, platforming done by a small hop-to-platform controller):
  - **Every exit both ways:** Garage ↔ Front Steps, Garage ↔ Bunk Room (climbing the planks and jumping up through the hatch, then dropping back down), Garage ↔ Containment (falling through the floor hatch, then climbing back up), Front Steps ↔ Reading Room, Reading Room ↔ Stacks, Reading Room ↔ Archives, Stacks ↔ Archives (climbing the full Stacks shaft and the Archives planks), and Archives ↔ Vault. Height along the edge was preserved (e.g. y 229 → 229 on the street door, the 16 px offset on the Reading Room ledge), and upward entries landed on the floor beside the hatch.
  - **Save:** on a fresh game the map showed only the Garage with 3 unexplored stubs. Resting at the pole wrote the v1 save to `localStorage` and showed the toast.
  - **Captures persist:** captured the Front Steps ghost (+3 essence), left and came back, and it stayed gone.
  - **Death:** died to the Containment ghost and came back at the Garage pole with 5 HP and essence rolled back from 3 to the saved 0. Visited rooms were kept and the Front Steps ghost was back.
  - **Reload and continue:** saved with 7 essence (set from the console to save time; essence pickup itself was verified above and in milestone 3), reloaded the page, and the game continued at the Garage pole with 7 essence, full HP and the saved rooms on the map.
  - **Storage errors:** a corrupt save (`{broken`) started a new game with the "couldn't be loaded" toast next to the area banner. With `setItem` throwing `QuotaExceededError`, resting still healed and showed "couldn't save on this device".
  - The full map (all 8 rooms) showed all 8 doors explored and the player marker in the right room.
- Screenshots: 1280×720 (garage with the pole glow and save hint, full map, Library archives in the teal palette, the banner/toast/hint stack) and 740×360 mobile landscape with touch emulation (hint above the controls, map opened with a synthetic touch on ❚❚, controls drawn over the map). No console errors.

**Known issues / not verified:**
- **Not played by hand.** Jumps were checked with a scripted controller, not real hands. Every hop is now a 1–2 tile horizontal gap with at most a 3-tile rise (the first layout had 4–5 tile gaps that the controller couldn't make, so they were tightened). The ceiling and floor hatches need a jump straight up while standing under them, which may feel fiddly with touch controls.
- The Garage floor hatch sits between the spawn and the street door, so a player who walks right without jumping drops into Containment. That's on purpose (it teaches the hatch), but worth watching in playtests.
- Coming up through a hatch without steering sideways drops you back down through it. That's standard for the genre but may surprise players.
- Dying keeps you in the room you rested in. With the only pole in the Garage, a death in the Vault means a long walk back. Milestone 5 could add a second pole in the Library (the bench-per-area convention).
- Outdoor rooms (Front Steps) still have a brick ceiling and walls. The art pass (milestone 6) should give them a sky and skyline.
- A hint can overlap the area banner for the first ~2 s in a new area on very short screens (<300 px tall). Not seen at 360 px.
- In the built-in browser, resizing the emulated viewport while the game loop is asleep (stepped manually) leaves the canvas at its old scale until the next real frame. It only affects screenshots taken that way, not the game.
- Not verified on real hardware: `localStorage` in iOS Safari private mode (handled as `unavailable` / `write-failed` in code and unit tests, but not on a device).

## Next: Milestone 5 — Progression
- Abilities and gating (PKE Meter, Ecto-Dash, Slime Boots), the Hotel and Rooftop areas, the Librarian mini-boss (in the Archive Vault) and the final boss.
- The session already has an `abilities` set and the save stores `abilities`, so no save migration is needed just to add abilities.
- The Firehouse ability shop is still to do. The Bunk Room has a desk block where it could go.
