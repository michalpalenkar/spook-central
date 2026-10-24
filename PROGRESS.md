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

## Milestone 5: Progression (done)

**What's in:**
- **18 rooms in four areas** (all ASCII data, validated): Firehouse (3), NY Public Library (5), **Sedgewick Hotel** (5: Lobby, Ballroom, Kitchen, Elevator Shaft, 12th Floor) in `levels/hotel.js`, and **Spook Central** (3: Roof Access, The Climb, Temple Roof) in `levels/rooftop.js`. Each area has a fire pole: Garage, Library Archives (new, next to the vault), Hotel Lobby, and the Temple Roof (before the final boss).
- **New tile types** (`levels/parseRoom.js`): `H` spectral wall, `B` weak floor, `E` ectoplasm barrier, `S` slimed wall. `isWallTile` treats every kind of masonry as wall for autotiling, line of sight, floors and the map. The tileset gained 16 slimed-wall frames (same edge masks) and a barrier frame. Gates may sit on a room's border (the Garage's west wall is spectral).
- **Abilities and gating** (`systems/abilities.js`, pure):
  - **PKE Meter** (the Librarian's reward): spectral walls vanish (a faint shimmer stays where they were) and weak floors show cracks; stand on one and press **down** to stomp through (the whole connected patch crumbles, with dust). Broken floors stay broken for the session; a player who comes up into a weak floor bursts it.
  - **Ecto-Dash** (Slimer's reward): `dash` gives a ~4.4-tile dash that ignores gravity, once per jump in the air (refilled on the ground or a slimed wall), with a short cooldown. It goes the way you push (or face). Barriers are solid except to a dashing body (`roomCollisionFilter`), and a dash never ends inside one. Green afterimages trail it.
  - **Slime Boots** (sold at the shop): airborne against a slimed wall and pushing into it, you cling and slide slowly; jump kicks off up and away (input locked for 0.13 s, 0.08 s wall coyote time). A single slimed wall can be climbed by jumping while holding toward it.
  - Movement lives in `systems/movement.js` (`stepMovement` now takes `dashPressed`, `facing`, `abilities`, plus `wall` / `insideBarrier` contact). All tuning is in `PLAYER_MOVES`.
- **Progression route:** Library vault → Librarian → PKE Meter → the Garage's west wall opens onto the Hotel → Slimer chase → Ecto-Dash (and the barrier shortcut from the 12th floor back to the Lobby) → buy Slime Boots → Roof Access (slime chimney + barrier) → The Climb (two slime chimneys and a barrier dash) → Temple Roof boss.
- **Librarian mini-boss** (`systems/librarianBrain.js` + `entities/Librarian.js`): asleep in the vault until you walk in, then she wakes (shriek), seals the exit, drifts between anchor points and alternates a volley of 3 books aimed at you with a telegraphed swoop. Worn down by the stream she is stunned, sinks and can be trapped; left alone she recovers, angrier and faster. Platforms matter: she floats above stream range from the floor.
- **Slimer chase** (`systems/slimerChase.js` + `entities/Slimer.js`): he munches at the ballroom buffet, flees from waypoint to waypoint as you get close, dives through the ballroom's weak floor, crosses the kitchen, flies up the elevator shaft and is cornered on the 12th floor, where he fights as a tougher, faster ghost (`SLIMER` tuning, reusing `Ghost` with a different look) with a boss bar. If you get ahead of him he waits in the room you reach (the chase only skips forward).
- **Final boss: the marshmallow mascot** (`systems/mallowBrain.js` + `entities/Mallow.js`, a 40×53 sailor-hatted marshmallow): wakes when you walk past the pole, seals the roof, walks at you and alternates a stomp (crouch, leap toward you, shockwaves running both ways along the floor) and a volley of lobbed marshmallow globs. The stream aims at his head; worn down he kneels and a trap tears out a chunk of spirit. **Three rounds**, each faster with one more glob. Beaten, he bursts into marshmallow puffs and the game shows an ending banner and toast.
- **Boss fights:** exits are sealed (world bounds plus a flickering ectoplasm seal at each exit), projectiles (`systems/projectile.js` + `entities/Projectile.js`) hurt on contact, and an HTML **boss bar** (`ui/BossBar.jsx`) shows the name, health (published in 2 % steps) and diamond pips for rounds.
- **Relics:** a beaten boss drops its ability as a glowing relic (`entities/Relic.js`, pickup after 0.8 s). If you leave or die first, it waits there (`pendingRelic` in `systems/bosses.js`). Picking it up shows the ability's name and blurb.
- **Ability shop** (`systems/shop.js` + `entities/ShopDesk.js`): the Bunk Room supply desk sells the Slime Boots (12 essence) and a spare battery cell (+1 max HP, 20 essence). Stand left of the desk and press up. The hint shows the item, price and your essence. The price also comes off the essence you'd respawn with, so dying can't refund a purchase.
- **HUD:** owned abilities show as small relic icons under the essence counter.
- **Save format v2** (`systems/saveFormat.js`): adds `flags` (bosses beaten, shop goods bought). Migration 1 → 2 adds `flags: []`. Gaining an ability, beating a boss or buying something writes a **checkpoint save** right away (`checkpointSave`: the last pole and the essence held there, plus everything gained). Death keeps abilities and flags.
- **Hints** can require an ability (`requires`), e.g. the weak-floor and spectral-wall hints only appear with the PKE Meter. The shop hint is built from values (`{ id, vars }`).
- **Area palettes:** hotel in faded crimson and gold, rooftop in storm purple with lightning-white edges, plus shared gate colours (`PALETTE.gates`), and map colours for the new areas.
- **Reachability model** (`levels/reachability.js`): a coarse tile-grid platformer model (walk, jump up to 4 tiles, fall, wall-jump on slime with the boots, dash 4 tiles through barriers with the dash, stomp weak floors and pass spectral walls with the PKE Meter). The tests use it to prove the gating and that you can always get back.

**Verified:**
- `pnpm lint`, `pnpm test` (283 tests, 91 new) and `pnpm build` all pass. New tests cover tile parsing and autotiling of gates, effective tiles, weak-floor groups, slime contact and barrier overlap, dash (distance, held direction, once per jump, cooldown, barrier extension, needs the ability), wall cling/slide/jump/coyote and single-wall climbing, the Slimer chase, both boss state machines (wake, attacks, stun/kneel, recovery, capture, phases), projectiles, the shop, boss flags and relics, save v2 and its migration, checkpoint saves, broken floors, gated hints, world data (four areas, poles and desk on floors, bosses and Slimer stages valid), and pixel-art frame sizes.
- **Gating, proven by the reachability model:** with no abilities you reach the Library, the Librarian and the shop and nothing else; with the PKE Meter the Hotel and Slimer's corridor but not the climb or the corridor shortcut; the shortcut needs the dash; the summit needs **both** the dash and the boots (not reachable with PKE, PKE+dash, PKE+boots or dash+boots); with everything every room is reachable, and from every reachable spot in every room you can get back to the Garage. That last test caught two real softlocks (a pit in Roof Access and chimney caps you couldn't drop back through), which were fixed.
- In the dev server (built-in browser, loop stepped at 60 fps, input fed through an extra `InputState` source, scripted hop/climb/chase controllers):
  - **Librarian:** rested at the new Archives pole, walked into the vault (exit sealed, boss bar up), stunned her from the upper platform, trapped her from the floor. Relic → PKE Meter, toast, HUD icon, checkpoint save with `librarian-defeated`.
  - **PKE gate:** without it the Garage's west wall is solid; with it you walk through to the Lobby and back. The ballroom weak floor shows cracks, and pressing down crumbles it into the kitchen.
  - **Slimer chase:** followed him across the ballroom (he dove through the floor), the kitchen and up the elevator shaft (platform by platform), cornered him on the 12th floor and trapped him. Relic → Ecto-Dash, checkpoint save with `slimer-captured`.
  - **Dash gate:** the corridor barrier stops walking, the dash goes through it, and the drop lands in the Lobby. Without the dash, nothing happens.
  - **Boots gate:** climbed the Roof Access chimney by wall-jumping, dashed west through the barrier, then the full Climb (chimney, barrier dash, second chimney, platforms) into the Temple Roof, and back down the whole way (both chimneys) to the corridor. Without the boots there's no cling.
  - **Shop:** "not enough essence" at 10; with 35 bought the boots, then the battery cell (max HP 6, saved), then "sold out".
  - **Mascot:** rested at the summit pole, woke him, three rounds of stream → kneel → trap (phases 1–3, roars between), defeated → ending banner/toast, `mallow-defeated` saved. **Reloaded**: continued at the summit pole with all three abilities, and the boss stayed gone.
  - **Every new transition both ways:** Garage ↔ Lobby, Lobby ↔ Ballroom, Ballroom ↔ Kitchen (down through the broken floor, back up the kitchen platforms), Kitchen ↔ Shaft, Shaft ↔ 12th Floor, 12th Floor → Lobby (barrier drop), 12th Floor ↔ Roof Access, Roof Access ↔ Climb, Climb ↔ Temple Roof.
  - **Death** with an ability kept the ability and returned to the last save.
- Screenshots at 1280×720 (Librarian with a flying book, the boss bar and the sealed exit; the Roof Access slime chimney and barrier with all three HUD relics; the mascot kneeling in the stream with the round pips) and 740×360 mobile landscape with touch controls (Slimer fleeing over the cracked ballroom floor with the hint; the mascot fight with the boss bar between the D-pad and the buttons). No console errors from the game.

**Known issues / not verified:**
- **Not played by hand.** Everything was driven by scripted controllers. Wall-jump climbing, dash timing through barriers and both boss fights need a playtest for feel and difficulty. The scripted bot beat the mascot losing only 1 HP, so he is probably too easy; Slimer is harder to trap (he struggles away fast).
- **One-way platforms can't be dropped through.** Levels avoid platforms that span a whole shaft for that reason (the reachability test checks it). A down+jump drop-through could be added later.
- The Lobby's ceiling hatch to the 12th floor is one-way by design (you can only drop from the corridor's east pocket); the upward transition exists in data but can't be reached.
- Coming up through the Temple Roof's floor hatch without steering drops you back into the Climb (same as other hatches).
- The ending is a banner and a toast; the slice keeps running afterwards. A proper ending/title flow belongs to milestone 7.
- Boss bar health is HTML updated in 2 % steps; fine at 60 fps in tests, not profiled on a phone.
- Broken weak floors reset on reload (only abilities and flags are saved); the Ballroom floor can be stomped again with the PKE Meter.
- The mascot can be partly hidden behind the touch buttons on small phones when he's at the right edge of the view.
- Outdoor rooms (Front Steps, rooftop) still have brick ceilings; the art pass should open them to the sky.
- The two `InvalidStateError: Cannot suspend/resume a closed AudioContext` console errors after a reload in dev are still there (milestone 3 note).
- Not verified on real hardware: touch feel of wall jumps and the dash button, and performance of the extra glows, trails and particles on a mid-range phone.

## Milestone 6: Art pass (done)

**What's in:**
- **Parallax, five planes per area** (`art/scenery.js` config, `systems/Scenery.js` + `systems/ParallaxLayer.js` runtime, `systems/parallaxMath.js` pure): the backdrop (area gradient, or the sky outdoors) fixed to the screen; a **far** layer (factor 0.2, or 0.1 for an outdoor skyline); a **mid** layer (0.5, or 0.35 outdoors); the play layer; and a **foreground** of near-black silhouettes (factor 1.4) along the bottom and, in most areas, hanging from the top. Layers use Phaser scroll factors, so they move with the camera's final scroll each frame (no lag); copies are re-laid only to keep a strip seamless. Interiors repeat in both directions (tall rooms show storey after storey); outdoor strips and the foreground are anchored to the room's floor or ceiling, so the skyline sinks slowly and the foreground drops away as you climb.
- **Procedural scenery** (`art/sceneryShapes.js`, pure draw commands; `art/paintCommands.js` paints them with wrap-around; `art/sceneryTextures.js` bakes one texture per layer at boot, seeded so it never changes):
  - Firehouse: brick bays with arched night windows; lockers, ladders, coiled hoses, a helmet rack; tyre stacks, toolboxes, cones; hooks and hose loops overhead.
  - Library: gothic windows in cold light and a gallery rail; bookcases of muted spines with a rolling ladder; book piles, a globe, a lectern; cobwebs.
  - Hotel: faded crimson damask, gilt wainscot, pilasters and portraits; fluted columns, drapes and glowing chandeliers; armchairs, a potted palm, a luggage cart; a curtain valance.
  - Outdoors: night sky (stars, moon and glow, cloud banks) and a two-row skyline with water towers, setbacks and lit windows. Front Steps adds lamp posts, trees, an iron fence and a stone lion, hedges, a hydrant and a bench, with branches overhead. The rooftop adds stepped temple towers, columns and antenna masts, with parapets, gargoyles and chimneys in front.
- **Outdoor rooms open to the sky.** New tile `^` (`TILE.SKY`): solid like the border but never drawn and not masonry, so walls under it get their top highlight. Front Steps and the Temple Roof have sky ceilings (and sky in the upper side walls, above anything reachable); Roof Access has open sky over the terrace. Rooms carry `outdoor: true` (Front Steps and all three rooftop rooms). `exits.js`, the reachability model and the area map treat sky as closed. No reachable geometry changed: the reachability tests pass unchanged.
- **Storm over Spook Central** (`systems/stormTiming.js` pure, `systems/StormEffects.js`): slanted rain, lightning every 3.5–9 s with a jagged (sometimes branching) bolt drawn behind the skyline, and a two-pulse flash capped at 0.3 additive so the play layer stays readable. No screen shake.
- **Lighting and atmosphere** (`systems/Atmosphere.js`, `entities/Lamp.js`, `systems/lampSpots.js`): hanging lamps placed from the grid under real ceilings (an enamel shop lamp, a reading-room lantern, a small chandelier), swaying on chains, with an additive glow and light cone; two fog banks along the floor drifting opposite ways (one behind the room, one in front); dust/spore motes that fade in and out (indoors and on Front Steps; rain replaces them on the roof); a vignette with darker top and bottom; and dust puffs at the player's feet on hard landings and jumps. Gradients and glows use linear filtering so they don't band.
- **Area palettes** in `art/palette.js`: each area gained scenery colours (`far`, `farLight`, `window`, `mid`, `midLight`, `fore`, `foreRim`, `fog`, `lamp`, `mote`, plus `spine` for book spines), `PALETTE.sky.library` / `.rooftop`, `PALETTE.storm`, `PALETTE.atmosphere` and HUD ornament colours. Library cold teal and parchment, hotel faded crimson and gold, rooftop storm purple with lightning white.
- **Animation polish:** bosses and ghosts flash white while the stream bites, as a rhythm (one 50 ms flash every 0.28 s of hits, `systems/hitFlash.js`) rather than a strobe. The mascot stretches on take-off and squashes on landing a stomp, easing back (`MALLOW.LEAP_STRETCH_Y`, `LAND_SQUASH_Y`). The player's squash/stretch, the 60 ms hit-stop and the existing (sparing) shakes are unchanged.
- **UI frames:** HP cells are now mask-shaped battery cells (terminals as horns, eye slits, tapered chin) on a soft dark plate between thin parchment rules with a diamond and a scroll (`UIScene`). HTML overlays share inline-SVG ornaments (`ui/ornaments.css`): scrolled corners on the map frame, a diamond-and-curls divider under the area banner and map title, curls either side of the boss name.
- New tuning in `constants.js`: `SCENERY`, `ATMOSPHERE`, `STORM`, `HIT_FLASH`, new `DEPTH` entries, `HUD.PLATE_*`, `MALLOW` squash.

**Verified:**
- `pnpm lint`, `pnpm test` (389 tests, 106 new: RNG, parallax coverage/anchoring incl. a moved camera, scenery variants/layer order/3–5 planes/palette keys and hues, every painter's commands valid and deterministic, foreground sparseness, wrap-around, lamp placement, dust count, hit-flash rhythm, storm timing/flash curve/bolts, sky tile parsing and autotiling, outdoor rooms' sky rows, lamp and ornament pixel art) and `pnpm build` all pass. The reachability tests pass with the sky tiles.
- In the dev server (built-in browser, loop stepped at 60 fps): screenshots at **1280×720** of the Garage, Front Steps, the Archives, the Vault (Librarian awake, hit flash, boss bar), the Hotel Lobby and Elevator Shaft, Roof Access, the bottom and top of The Climb, the Temple Roof (with and without a lightning strike; the mascot white under the stream with the boss bar) and the map; and at **740×360** with touch emulation of the Garage, Front Steps (with the area banner), the Ballroom (Slimer) and the Temple Roof. All checked by eye.
- Sky tiles collide (the Temple Roof's upper side wall stops the player); dust puffs fire on a hard landing; the mascot's scale goes 0.85 → 1.15 at take-off and 0.72 on landing, then eases back; Garage ↔ Front Steps still transitions both ways.
- **Performance (rough):** stepping 240 frames per room in desktop Chrome took 0.1–0.45 ms per frame (update plus render submission) in the Temple Roof (storm, ~48 rain particles), Ballroom, Stacks and Garage, with 40–80 game objects. GPU fill is about six screens of overdraw at 480×270 (the canvas is upscaled by CSS), so it should be cheap on a phone.

**Known issues / not verified:**
- **Not measured on a real mid-range phone.** The numbers above are desktop CPU time. Fill-rate and texture memory (19 baked strips of up to 640×256 plus two skies, about 7 MB as GPU textures, with their canvas copies on top) look safe but need a device check over `pnpm dev --host`.
- The foreground silhouettes can briefly cover the player's feet or a ghost near the bottom edge (by design, kept low and under 50 % of the width), and a hanging hose sits near the HUD in the Garage. Worth a playtest.
- Lamps and fog are decoration only. Lamps hang under any long ceiling, including the undersides of thick blocks.
- Fire poles in rooms with a sky ceiling run up to the top of the room.
- The mask-shaped HP cells read a little like cat faces at 1×. A matter of taste; easy to redraw in `art/hudGlyphs.js`.
- Chrome logs "Blocked call to navigator.vibrate" when the player is hit before any tap on the page (seen in scripted tests). Haptics could check `navigator.userActivation.hasBeenActive` first (milestone 7).
- In the built-in browser, screenshots right after stepping the sleeping loop sometimes show the previous frame; step again and wait ~0.5 s.
- Still open from earlier milestones: the `AudioContext` console errors after a dev reload, the chunk-size warning, playtesting by hand.

## Next: Milestone 7 — Polish
- Audio (Web Audio: proton hum, trap snap, ghost wail, jump, thunder for the storm), mute and volume, started on the first gesture.
- Title screen (New game / Continue), pause and settings (volume, touch-control opacity, haptics), a proper ending flow.
- Performance pass on mobile, code-split Phaser, silence the dev `AudioContext` errors, gate haptics on user activation.
