# Spook Central — a Ghostbusters-inspired metroidvania

Browser game, playable on desktop and mobile. Fan homage to the original 1984 Ghostbusters film, with a visual style inspired by Hollow Knight. The goal is a polished vertical slice: a few connected sample areas, not a full game.

## Hard constraints

- **Original assets only.** Draw everything in code (Canvas/Phaser Graphics, generated textures, inline SVG) or write it by hand. Don't download sprites, fonts, music or sounds, and don't reproduce the Ghostbusters logo or theme song. Allude to the film through settings, characters, gadgets and jokes.
- **No backend.** Everything runs client-side and saves to `localStorage`.
- **Must run in latest Chrome, Safari (iOS) and Firefox**, desktop and mobile, at 60 fps on a mid-range phone.
- **Keep it playable after every milestone.** Never leave `main` in a broken state.

## Tech stack

- Existing React 19 + Vite 8 app, JavaScript (no TypeScript), Oxlint.
- **Phaser 3** (pin the exact version) with Arcade Physics for the game. React only mounts the game and renders the HTML overlays (menus, pause, touch controls).
- **Vitest** for unit tests of pure logic.
- Use **pnpm**; ignore `package-lock.json`.

## Commands

- `pnpm dev` — dev server (http://localhost:5173; use `--host` to test on a phone over LAN)
- `pnpm build` — production build into `dist/`
- `pnpm lint` — Oxlint
- `pnpm test` — Vitest (add this script when you set Vitest up)

Before calling any task done, `pnpm lint`, `pnpm test` and `pnpm build` must all pass.

## Architecture

```
src/
  main.jsx, App.jsx        React shell; mounts <Game/>, owns overlays
  game/
    config.js              Phaser config, resolution, scaling
    constants.js           physics tuning (gravity, speeds, jump, coyote time)
    scenes/                Boot, Preload (generates textures), Title, World, UI, Pause
    entities/              Player, ghost enemies, bosses, pickups, doors
    systems/               input, camera, save, abilities, combat, particles, audio
    levels/                one file per area (ASCII tile maps + entity/door data)
    art/                   procedural texture + palette code
  ui/
    TouchControls.jsx      on-screen buttons
    Menus.jsx              title, pause, map
```

- Fixed internal resolution of **480×270**, scaled to fit with `Phaser.Scale.FIT` and pixel-snapped. Cap devicePixelRatio at 2.
- **Levels are data.** Define each room as an ASCII grid plus a list of entities and exits, and parse it into a tilemap. No Tiled or other editor files.
- All tuning numbers go in `constants.js`, never inline.
- **Input is abstract.** Keyboard, gamepad and touch all write to one `InputState` (`left, right, up, down, jump, fire, trap, dash, pause`). Game code reads only `InputState`.
- Keep game logic (physics helpers, save format, ability gating, map parsing) in plain modules so Vitest can test it without Phaser.

## Gameplay

**Player:** a Ghostbuster in a beige jumpsuit wearing a proton pack. Movement should feel tight, like Hollow Knight: variable jump height, coyote time (~100 ms), jump buffering (~100 ms), no slippery acceleration.

**Core loop: weaken, wrangle, trap.**
1. Fire the **proton stream** (hold) to damage a ghost and tether it.
2. Once the ghost is weakened, throw the **ghost trap** (`trap` button) underneath it to capture it.
3. Captured ghosts drop **ecto-essence** (currency and health).

**Abilities that gate the world**, one per area:
- **PKE Meter:** reveals hidden walls and breakable floors.
- **Ecto-Dash:** short air dash through ectoplasm barriers.
- **Slime Boots:** wall-cling and wall-jump on slimed surfaces.

**Sample areas** (3 to 6 rooms each, connected, with backtracking):
1. **Firehouse (hub):** tutorial, save point (the fire pole), ability shop.
2. **NY Public Library:** stacks and archives; floating books; mini-boss is the Librarian ghost. Reward: PKE Meter.
3. **Sedgewick Hotel:** ballroom, kitchen, elevator shafts; Slimer chase sequence. Reward: Ecto-Dash.
4. **Spook Central rooftop:** vertical climb; final boss is a giant marshmallow mascot (homage). Needs both abilities.

**Systems:** HP and ecto-essence HUD, room transitions, an auto-filling area map, save at the fire pole, death returns you to the last save, and a pause menu.

## Visual style (Hollow Knight-inspired)

- **Dark, muted, layered.** Deep blue-black backgrounds, desaturated midtones, and a few saturated accent colors (ectoplasm green, proton orange-red).
- **Silhouette-first.** Characters and foreground are dark shapes with thin pale highlights. Readability matters more than detail.
- **3 to 5 parallax layers** per area: far skyline or architecture, mid props, play layer, and a foreground layer of dark shapes that pass in front of the camera.
- **Atmosphere:** soft radial glows (additive blend), floating dust or spore particles, vignette, light fog gradients. Ghosts glow and leave faint trails.
- **Each area has its own palette** (library: cold teal and parchment; hotel: faded crimson and gold; rooftop: storm purple and lightning white). Keep the palettes in `art/palette.js`.
- **Animation:** squash and stretch on jumps and landings, a short hit-stop (~60 ms) on hits, screen shake used sparingly.
- **UI:** thin ornamental frames, serif-ish hand-drawn feel, mask-like health pips (proton-pack battery cells).

## Controls

| Action | Keyboard | Gamepad | Touch |
|---|---|---|---|
| Move | A/D or ←/→ | Left stick / D-pad | Left-side D-pad |
| Look up/down | W/S or ↑/↓ | Stick | D-pad up/down |
| Jump | Space / Z | A | Jump button |
| Proton stream | J / X (hold) | X / RT | Fire button |
| Ghost trap | K / C | Y | Trap button |
| Dash | L / Shift | B / RB | Dash button |
| Pause / map | Esc / Tab | Start | Pause icon, top corner |

**Touch controls:**
- Show them only on touch devices (`pointer: coarse`), as an HTML overlay above the canvas.
- D-pad on the bottom-left, a cluster of 4 action buttons on the bottom-right, minimum 56 px hit targets, semi-transparent.
- Support **multitouch**: move, jump and fire at the same time. Use Pointer Events with per-pointer tracking, and let a finger slide from one button to another.
- Prevent page scroll, zoom, long-press menus and double-tap zoom (`touch-action: none`, `user-select: none`, viewport meta).
- Play in **landscape**. In portrait, show a "rotate your device" screen. Respect safe-area insets (notch).
- Offer optional haptics (`navigator.vibrate`) when the player is hit, where supported.

## Audio

Generate all sound effects with the Web Audio API (oscillators plus noise: proton hum, trap snap, ghost wail, jump). Music is optional; if you add it, keep it to simple synthesized ambient loops. Start audio on the first user gesture (iOS requirement), and include mute and volume controls.

## Milestones

Work through these in order. After each one, update `PROGRESS.md` with what's done, what's next and any known issues.

1. **Skeleton:** Phaser mounted in React, scaling, a test room drawn from an ASCII map, player runs and jumps with good feel. Keyboard input works.
2. **Input everywhere:** abstract `InputState`, touch overlay, gamepad, a portrait warning. Verify in mobile emulation.
3. **Combat:** proton stream, a basic ghost enemy, trap capture, HP, death and respawn.
4. **World:** room transitions, the Firehouse hub plus the Library, the save system and the area map.
5. **Progression:** abilities and gating, the Hotel and Rooftop areas, mini-boss and boss.
6. **Art pass:** parallax, lighting, particles, area palettes, UI frames.
7. **Polish:** audio, title screen, pause and settings, performance pass on mobile.

## Verification

- Unit-test the pure logic: map parsing, the save format and migrations, ability gating, input mapping.
- For visual and interactive checks, run `pnpm dev` and use Playwright (or the `run` skill) to take screenshots at desktop size (1280×720) and in mobile landscape emulation (e.g. iPhone 14 landscape). Check the screenshots before saying a visual task is done.
- If you can't verify something (for example real iOS touch behaviour), say so in `PROGRESS.md` instead of claiming it works.

## Conventions

- Function components and hooks in React; ES classes for Phaser scenes and entities.
- One entity or system per file. Name files after what they export.
- No magic numbers in entity code; use `constants.js` or `palette.js`.
- Keep new dependencies to a minimum. Ask before adding anything beyond Phaser, Vitest and Playwright.
