import Phaser from 'phaser'
import {
  ATMOSPHERE,
  AUDIO,
  BOSS_FIGHT,
  CAMERA,
  DEPTH,
  ENDING,
  ESSENCE,
  FIRE_POLE,
  GHOST,
  HIT_STOP,
  MALLOW,
  MAX_FRAME_DELTA,
  PLAYER,
  PLAYER_COMBAT,
  PROJECTILE,
  PROTON_STREAM,
  ROOM_TRANSITION,
  SCREEN_SHAKE,
  SHOP,
  TILE_SIZE,
} from '../constants.js'
import { toColor } from '../art/color.js'
import { DEFAULT_AREA, areaTextures } from '../art/generateTextures.js'
import { PALETTE } from '../art/palette.js'
import { sceneryPalette } from '../art/scenery.js'
import { EssenceOrb } from '../entities/EssenceOrb.js'
import { FirePole } from '../entities/FirePole.js'
import { GateOverlay } from '../entities/GateOverlay.js'
import { Lamp } from '../entities/Lamp.js'
import { Ghost } from '../entities/Ghost.js'
import { Librarian } from '../entities/Librarian.js'
import { Mallow } from '../entities/Mallow.js'
import { Player } from '../entities/Player.js'
import { Projectile } from '../entities/Projectile.js'
import { ProtonStream } from '../entities/ProtonStream.js'
import { Relic } from '../entities/Relic.js'
import { ShopDesk } from '../entities/ShopDesk.js'
import { SLIMER_LOOK, Slimer } from '../entities/Slimer.js'
import { Trap } from '../entities/Trap.js'
import { crossedEdge, entryPlacement, exitAt } from '../levels/exits.js'
import { SLIMER_CHASE } from '../levels/hotel.js'
import { TILE, parseRoom } from '../levels/parseRoom.js'
import { TEST_ROOM } from '../levels/testRoom.js'
import { AREAS, ROOMS, getRoom } from '../levels/world.js'
import {
  ABILITY,
  ABILITY_IDS,
  ABILITY_INFO,
  connectedTiles,
  effectiveTiles,
  grantAbility,
  overlapsBarrier,
  slimeContact,
  weakFloorUnderfoot,
} from '../systems/abilities.js'
import { buildMapView } from '../systems/areaMap.js'
import { Atmosphere } from '../systems/Atmosphere.js'
import { BOSSES, isBeaten, markBeaten, pendingRelic } from '../systems/bosses.js'
import { buildRoom, clearTiles, roomCollisionFilter } from '../systems/buildRoom.js'
import { createDeathSequence, startDeath, stepDeath } from '../systems/deathSequence.js'
import { collectEssence } from '../systems/essence.js'
import { vibrate } from '../systems/haptics.js'
import { SAVE_HINT, canUsePole, hintAt } from '../systems/hints.js'
import { createHitStop, stepHitStop, triggerHitStop } from '../systems/hitStop.js'
import { lampSpots } from '../systems/lampSpots.js'
import { groundBelow } from '../systems/lineOfSight.js'
import { PROJECTILE_KIND } from '../systems/projectile.js'
import { writeSave } from '../systems/saveStorage.js'
import { Scenery } from '../systems/Scenery.js'
import {
  ENTRY,
  brokenIn,
  checkpointSave,
  isCaptured,
  markBroken,
  markCaptured,
  respawnAtSave,
  restAtPole,
  travel,
} from '../systems/session.js'
import { buy, nextItem } from '../systems/shop.js'
import { advanceChase, slimerInRoom } from '../systems/slimerChase.js'
import { SOUND } from '../systems/soundRecipes.js'
import { StormEffects } from '../systems/StormEffects.js'
import { HUD_KEYS } from './UIScene.js'

export const SAVED_TEXT = 'Rested at the fire pole · progress saved'
export const SAVE_FAILED_TEXT = 'Rested · couldn’t save on this device'
export const SLIMER_CAPTURED_TEXT = 'Slimer captured! He left something behind…'
export const MALLOW_ROUND_TEXT = 'He’s not finished yet!'
export const ENDING_BANNER = 'Spook Central is quiet again'
export const ENDING_TEXT = 'The mascot is trapped · thanks for playing this slice'
export const TOO_POOR_TEXT = 'Not enough ecto-essence'

// The dev sandbox room isn't part of the world; it's only reachable with ?room=test-room.
let testRoom = null
function resolveRoom(id) {
  if (id === TEST_ROOM.id) return (testRoom ??= parseRoom(TEST_ROOM))
  return getRoom(id)
}

const BOSS_CLASSES = { librarian: Librarian, mallow: Mallow }

/**
 * One room of the world. The scene restarts for every room (behind a short
 * fade) and for every respawn; everything that outlives a room lives in the
 * session object in the registry (systems/session.js).
 */
export class WorldScene extends Phaser.Scene {
  constructor() {
    super('World')
  }

  create() {
    this.session = this.registry.get('session')
    this.bridge = this.registry.get('bridge') ?? null
    this.audio = this.registry.get('audio') ?? null
    // Bound and updated once per frame by the Menu scene.
    this.inputState = this.registry.get('inputState')
    const room = resolveRoom(this.session.roomId) ?? getRoom(this.session.respawn.roomId)
    this.room = room
    const { abilities } = this.session
    const entry = this.entryPoint()

    // The room as the player meets it: spectral walls gone with the PKE
    // Meter, weak floors broken this session gone. Coming up through a weak
    // floor bursts it.
    this.tiles = effectiveTiles(room.tiles, abilities, brokenIn(this.session, room.id))
    this.burstWeakFloors(entry)

    const { layer, width, height } = buildRoom(this, this.tiles, areaTextures(room.area ?? DEFAULT_AREA).tiles)
    layer.setDepth(DEPTH.ROOM)
    this.layer = layer
    this.createScenery(room, width, height)
    this.gates = new GateOverlay(this, room, abilities, brokenIn(this.session, room.id))

    const poleData = room.entities.find((e) => e.type === 'pole')
    this.pole = poleData ? new FirePole(this, poleData, room) : null
    const shopData = room.entities.find((e) => e.type === 'shop')
    this.shop = shopData ? new ShopDesk(this, shopData) : null
    this.shop?.show(nextItem(this.session))
    this.shopHint = null

    this.player = new Player(this, entry.x, entry.feetY)
    this.player.health.max = this.session.maxHp
    this.player.health.hp = Math.min(this.session.hp, this.session.maxHp)
    this.player.body.setVelocity(entry.vx, entry.vy)
    this.player.sprite.setDepth(DEPTH.PLAYER)
    this.physics.add.collider(this.player.hitbox, layer, undefined, roomCollisionFilter)
    this.physics.world.setBounds(0, 0, width, height)

    // Ghosts caught since the last rest stay gone.
    this.ghosts = room.entities
      .filter((e) => e.type === 'ghost' && !isCaptured(this.session, room.id, e.id))
      .map((e) => new Ghost(this, e, this.roomWithTiles()))
    // The scene object is reused on restart, so per-room state is reset here.
    this.relics = []
    this.boss = null
    this.bossData = null
    this.slimer = null
    this.spawnSlimer()
    this.spawnBoss()

    this.stream = new ProtonStream(this, this.tiles)
    this.trap = new Trap(this)
    this.physics.add.collider(this.trap.hitbox, layer, undefined, roomCollisionFilter)
    this.orbs = []
    this.projectiles = []

    this.wallet = this.session.wallet
    this.hitStop = createHitStop()
    this.death = createDeathSequence()
    this.tetheredGhost = null
    this.leaving = false
    this.sealed = false
    // After the final boss: null, then 'waiting' (ENDING.DELAY), then 'fading'.
    this.ending = null
    this.endingTimer = 0
    this.wasFiring = false
    this.weakenedFoes = new Set()
    this.seal = this.add.graphics().setDepth(DEPTH.GATES).setBlendMode(Phaser.BlendModes.ADD)
    this.time0 = 0

    const camera = this.cameras.main
    camera.resetFX()
    camera.setBounds(0, 0, width, height)
    camera.startFollow(this.player.hitbox, true, CAMERA.LERP_X, CAMERA.LERP_Y)
    camera.setDeadzone(CAMERA.DEADZONE_WIDTH, CAMERA.DEADZONE_HEIGHT)
    camera.fadeIn(ROOM_TRANSITION.FADE_TIME * 1000)

    this.announceArea()
    this.audio?.setAmbient(room.area ?? null)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.audio?.setHum(false))
    this.bridge?.update({ hint: null, boss: null })
    this.publishHud()
    if (!this.scene.isActive('UI')) this.scene.launch('UI')
  }

  // Parallax layers, atmosphere, lamps under the ceilings (indoors) and the
  // storm (on the rooftop).
  createScenery(room, width, height) {
    this.scenery = new Scenery(this, room, height)
    const { variant } = this.scenery
    const palette = sceneryPalette(variant)
    this.atmosphere = new Atmosphere(this, { width, height }, palette, { dust: !variant.storm })
    this.lamps = variant.outdoor ? [] : lampSpots(this.tiles, ATMOSPHERE).map((spot) => new Lamp(this, spot, variant.area, palette))
    this.storm = variant.storm ? new StormEffects(this, { onStrike: () => this.audio?.thunder() }) : null
  }

  // Ghost and orb code reads `room.tiles`; give them the tiles as met.
  roomWithTiles() {
    return { ...this.room, tiles: this.tiles }
  }

  /** Where the player appears: { x, feetY, vx, vy } in room pixels. */
  entryPoint() {
    const { entry } = this.session
    const room = this.room
    if (entry.type === ENTRY.EXIT) {
      return { x: entry.x, feetY: entry.y + PLAYER.BODY_HEIGHT / 2, vx: entry.vx, vy: entry.vy }
    }
    const poleData = room.entities.find((e) => e.type === 'pole')
    const atPole = poleData && { x: (poleData.x + 0.5) * TILE_SIZE, feetY: (poleData.y + 1) * TILE_SIZE, vx: 0, vy: 0 }
    if (entry.type === ENTRY.POLE && atPole) return atPole
    if (room.spawn) return { x: (room.spawn.x + 0.5) * TILE_SIZE, feetY: (room.spawn.y + 1) * TILE_SIZE, vx: 0, vy: 0 }
    // A dev jump to a room without a spawn: the pole, or the room's centre.
    return atPole || { x: (room.width / 2) * TILE_SIZE, feetY: (room.height / 2) * TILE_SIZE, vx: 0, vy: 0 }
  }

  // A player arriving inside a weak floor (coming up from below) bursts it,
  // so a floor broken in an earlier session never traps them.
  burstWeakFloors(entry) {
    const half = PLAYER.BODY_WIDTH / 2
    const x0 = Math.floor((entry.x - half) / TILE_SIZE)
    const x1 = Math.floor((entry.x + half - 1) / TILE_SIZE)
    const y0 = Math.floor((entry.feetY - PLAYER.BODY_HEIGHT) / TILE_SIZE)
    const y1 = Math.floor((entry.feetY - 1) / TILE_SIZE)
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (this.tiles[y]?.[x] !== TILE.WEAK_FLOOR) continue
        const cells = connectedTiles(this.tiles, x, y, TILE.WEAK_FLOOR)
        markBroken(this.session, this.room.id, cells)
        for (const cell of cells) this.tiles[cell.y][cell.x] = TILE.EMPTY
      }
    }
  }

  // Slimer, if his chase has reached this room: fleeing, or cornered.
  spawnSlimer() {
    const stages = SLIMER_CHASE
    const here = stages.find((s) => s.roomId === this.room.id)
    if (!here) return
    if (isBeaten(this.session, 'slimer')) {
      if (here.home && pendingRelic(this.session, 'slimer')) this.dropRelic(ABILITY.DASH, (here.home.x + 0.5) * TILE_SIZE, (here.home.y + 0.5) * TILE_SIZE)
      return
    }
    const presence = slimerInRoom(this.session.chase, stages, this.room.id)
    if (!presence) return
    if (presence.cornered) {
      const slimer = new Ghost(this, { id: 'slimer', ...here.home }, this.roomWithTiles(), SLIMER_LOOK)
      slimer.name = BOSSES.slimer.name
      this.ghosts.push(slimer)
      this.boss = slimer
      this.bridge?.toast('Slimer is cornered!')
      return
    }
    this.slimer = { entity: new Slimer(this, here.waypoints, TILE_SIZE), stage: presence.stage }
  }

  spawnBoss() {
    const data = this.room.entities.find((e) => e.type === 'boss')
    if (!data) return
    this.bossData = data
    if (isBeaten(this.session, data.id)) {
      const reward = pendingRelic(this.session, data.id)
      if (reward) this.dropRelic(reward, (data.x + 0.5) * TILE_SIZE, (data.y + 0.5) * TILE_SIZE)
      return
    }
    this.boss = new BOSS_CLASSES[data.id](this, data, this.roomWithTiles())
  }

  dropRelic(ability, x, y) {
    const floor = groundBelow(this.tiles, x, y) ?? y
    this.relics.push(new Relic(this, ability, x, floor))
  }

  /** Everything the stream, the trap and contact damage deal with. */
  get foes() {
    const foes = this.ghosts.filter((g) => g.active)
    if (this.boss && !this.ghosts.includes(this.boss) && this.boss.active) foes.push(this.boss)
    return foes
  }

  // Shows the area's name when the player walks into a different area.
  announceArea() {
    const area = this.room.area
    if (!this.bridge || !area || this.bridge.getState().area === area) return
    this.bridge.announceArea(area, AREAS[area].name)
  }

  update(_time, deltaMs) {
    const realDt = deltaMs / 1000
    const dt = Math.min(realDt, MAX_FRAME_DELTA)
    const input = this.inputState

    // Pausing pauses this whole scene (scenes/MenuScene.js).
    if (input.justPressed('pause') && !this.leaving && !this.death.active && this.ending !== 'fading') {
      this.scene.get('Menu').openPause()
      return
    }
    const camera = this.cameras.main
    this.scenery.update(camera)
    if (this.leaving) {
      this.physics.world.pause()
      return
    }
    this.atmosphere.update(dt, camera)
    for (const lamp of this.lamps) lamp.update(dt)
    this.storm?.update(dt)

    // Hit-stop freezes the simulation (physics included) for a few frames.
    if (stepHitStop(this.hitStop, realDt)) {
      this.physics.world.pause()
      return
    }
    if (this.physics.world.isPaused) this.physics.world.resume()

    if (this.death.active) {
      this.updateDeath(dt)
      return
    }

    this.time0 += dt
    this.updateEnding(dt)
    this.gates.update(dt)
    const firing = input.isDown('fire')
    const { abilities } = this.session
    const rect = this.player.rect
    this.player.update(input, dt, {
      moveScale: firing ? PLAYER_COMBAT.FIRING_MOVE_MULTIPLIER : 1,
      faceX: this.tetheredGhost ? this.tetheredGhost.x : null,
      abilities: { dash: abilities.has(ABILITY.DASH), cling: abilities.has(ABILITY.BOOTS) },
      wall: abilities.has(ABILITY.BOOTS) ? slimeContact(this.tiles, rect, TILE_SIZE) : 0,
      insideBarrier: overlapsBarrier(this.tiles, rect, TILE_SIZE),
    })
    this.kickUpDust()
    this.playMoveSounds()
    this.updateStomp(input)

    this.updateStream(dt, firing)
    this.updateTrap(dt, input)
    const playerCenter = this.player.center
    for (const ghost of this.ghosts) {
      if (ghost.active) ghost.update(dt, playerCenter)
    }
    this.updateSlimer(dt, playerCenter)
    this.updateBoss(dt, playerCenter)
    this.updateProjectiles(dt)
    this.updateOrbs(dt)
    this.updateRelics(dt, playerCenter)
    this.moanWhenWeakened()
    this.checkGhostContact()
    if (this.player.dead) return
    this.updateInteractions(input)
    this.drawSeal()
    if (!this.sealed && !this.ending) this.checkExits()
  }

  /** The area map for the pause menu, with the player where they stand. */
  mapView() {
    const { respawn } = this.session
    return buildMapView(
      ROOMS,
      {
        visited: this.session.visited,
        currentRoomId: this.room.id,
        player: this.player.center,
        saveRoomId: respawn.entry === ENTRY.POLE ? respawn.roomId : null,
      },
      TILE_SIZE,
    )
  }

  // Jumps, wall jumps, dashes and hard landings.
  playMoveSounds() {
    const events = this.player.lastEvents
    if (!events || !this.audio) return
    if (events.wallJumped) this.audio.play(SOUND.WALL_JUMP)
    else if (events.jumped) this.audio.play(SOUND.JUMP)
    if (events.dashed) this.audio.play(SOUND.DASH)
    if (events.landed && events.landingSpeed >= AUDIO.LAND_MIN_SPEED) {
      this.audio.play(SOUND.LAND, { strength: Math.min(1, events.landingSpeed / PLAYER.MAX_FALL_SPEED) })
    }
  }

  // A ghost moans as the stream wears it down to weakened.
  moanWhenWeakened() {
    for (const ghost of this.ghosts) {
      const weak = ghost.active && ghost.weakened
      if (weak && !this.weakenedFoes.has(ghost)) this.audio?.play(SOUND.MOAN)
      if (weak) this.weakenedFoes.add(ghost)
      else this.weakenedFoes.delete(ghost)
    }
  }

  // The mascot is beaten: a moment to watch him burst, then fade to the ending.
  updateEnding(dt) {
    if (this.ending !== 'waiting') return
    this.endingTimer -= dt
    if (this.endingTimer > 0) return
    this.ending = 'fading'
    const camera = this.cameras.main
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.get('Menu').showEnding(this.endingStats()))
    camera.fadeOut(ENDING.FADE_TIME * 1000)
  }

  endingStats() {
    return {
      rooms: this.session.visited.size,
      totalRooms: ROOMS.length,
      abilities: this.session.abilities.size,
      totalAbilities: ABILITY_IDS.length,
      essence: this.wallet.essence,
    }
  }

  // Dust puffs at the player's feet on hard landings and jumps off the floor.
  kickUpDust() {
    const events = this.player.lastEvents
    if (!events) return
    const { x } = this.player.center
    const feet = this.player.body.bottom
    if (events.landed && events.landingSpeed >= ATMOSPHERE.PUFF_MIN_LANDING_SPEED) this.atmosphere.puff(x, feet)
    else if (events.jumped && this.player.body.blocked.down) this.atmosphere.puff(x, feet, Math.ceil(ATMOSPHERE.PUFF_COUNT / 2))
  }

  // With the PKE Meter, pressing down on a weak floor stomps through it.
  updateStomp(input) {
    if (!input.justPressed('down') || !this.player.body.blocked.down) return
    const { body } = this.player
    const cell = weakFloorUnderfoot(this.tiles, this.session.abilities, { left: body.x, right: body.right, y: body.bottom }, TILE_SIZE)
    if (!cell) return
    const cells = connectedTiles(this.tiles, cell.x, cell.y, TILE.WEAK_FLOOR)
    for (const c of cells) this.tiles[c.y][c.x] = TILE.EMPTY
    markBroken(this.session, this.room.id, cells)
    clearTiles(this.layer, this.tiles, cells)
    this.gates.crumble(cells)
    this.audio?.play(SOUND.CRUMBLE)
    this.cameras.main.shake(SCREEN_SHAKE.CRUMBLE_TIME * 1000, SCREEN_SHAKE.CRUMBLE_INTENSITY)
  }

  updateStream(dt, firing) {
    const live = this.foes.filter((f) => f.targetable !== false)
    const target = this.stream.update(dt, firing, this.player.nozzle, this.player.facing, live)
    for (const foe of this.foes) foe.tethered = foe === target
    this.tetheredGhost = target
    if (firing && !this.wasFiring) this.audio?.play(SOUND.PROTON_START)
    this.wasFiring = firing
    this.audio?.setHum(firing, Boolean(target))
    if (target) target.takeStreamDamage(PROTON_STREAM.DAMAGE_PER_SECOND * dt)
  }

  updateTrap(dt, input) {
    if (input.justPressed('trap') && this.trap.canThrow) {
      const { x } = this.player.center
      this.trap.throw(x, this.player.body.bottom, this.tetheredGhost?.x ?? null, this.player.facing)
      this.audio?.play(SOUND.TRAP_THROW)
    }

    const foes = this.foes
    const events = this.trap.update(dt, foes)
    if (events.armed) this.audio?.play(SOUND.TRAP_OPEN)
    if (events.captureStarted) {
      events.captureStarted.startCapture()
      this.audio?.play(SOUND.CAPTURE_BEAM)
      this.audio?.play(SOUND.WAIL)
    }

    if (this.trap.capturing) {
      const target = foes.find((g) => g.id === this.trap.logic.targetId)
      const { x, y } = this.trap.mouth
      target?.updateCapture(x, y, this.trap.progress)
    }

    if (events.captured) this.onCaptured(events.captured)
  }

  onCaptured(foe) {
    const outcome = foe.capture() ?? {}
    const { x, y } = this.trap.mouth
    this.audio?.play(SOUND.TRAP_SNAP)
    const shake = () => this.cameras.main.shake(SCREEN_SHAKE.CAPTURE_TIME * 1000, SCREEN_SHAKE.CAPTURE_INTENSITY)

    if (foe.kind === 'ghost') {
      markCaptured(this.session, this.room.id, foe.id)
      this.dropEssence(x, y, ESSENCE.DROP_COUNT)
      triggerHitStop(this.hitStop, HIT_STOP.CAPTURE)
      shake()
      return
    }

    triggerHitStop(this.hitStop, HIT_STOP.BOSS_CAPTURE)
    if (foe.kind === 'mallow' && !outcome.defeated) {
      // One round down: he roars back.
      this.cameras.main.shake(SCREEN_SHAKE.STOMP_TIME * 1000, SCREEN_SHAKE.STOMP_INTENSITY)
      this.bridge?.toast(MALLOW_ROUND_TEXT)
      this.audio?.play(SOUND.ROAR)
      return
    }

    this.cameras.main.shake(SCREEN_SHAKE.BOSS_DEFEAT_TIME * 1000, SCREEN_SHAKE.BOSS_DEFEAT_INTENSITY)
    this.audio?.play(SOUND.BOSS_DEFEAT)
    markBeaten(this.session, foe.kind)
    this.dropEssence(x, y, ESSENCE.DROP_COUNT * 2)
    const reward = BOSSES[foe.kind].reward
    if (reward) this.dropRelic(reward, x, y - TILE_SIZE)
    this.endBossFight()
    if (foe.kind === 'slimer') this.bridge?.toast(SLIMER_CAPTURED_TEXT)
    if (foe.kind === 'mallow') {
      this.bridge?.announceArea(this.room.area, ENDING_BANNER)
      this.bridge?.toast(ENDING_TEXT)
      this.ending = 'waiting'
      this.endingTimer = ENDING.DELAY
    }
    writeSave(checkpointSave(this.session, Date.now()))
  }

  dropEssence(x, y, count) {
    for (let i = 0; i < count; i++) {
      this.orbs.push(new EssenceOrb(this, x, y - GHOST.BODY_RADIUS, this.tiles))
    }
  }

  updateSlimer(dt, player) {
    if (!this.slimer) return
    const events = this.slimer.entity.update(dt, player)
    if (events.left) {
      advanceChase(this.session.chase, this.slimer.stage)
      this.slimer = null
    }
  }

  updateBoss(dt, player) {
    const boss = this.boss
    if (!boss || !boss.active) return
    // Cornered Slimer moves with the ghosts; only his bar is drawn here.
    if (!this.bossData) {
      this.publishBossBar()
      return
    }
    const triggered = player.x >= this.bossData.triggerX * TILE_SIZE
    const wasAwake = boss.awake
    const events = boss.update(dt, player, triggered)
    if (!wasAwake && boss.awake) this.startBossFight()
    if (events.book) {
      this.spawnProjectile(PROJECTILE_KIND.BOOK, events.book)
      this.audio?.play(SOUND.BOOK)
    }
    for (const glob of events.globs ?? []) this.spawnProjectile(PROJECTILE_KIND.GLOB, glob)
    if (events.globs?.length) this.audio?.play(SOUND.GLOB)
    if (events.stunned || events.kneeled) this.audio?.play(SOUND.MOAN)
    if (events.landed) {
      this.audio?.play(SOUND.STOMP)
      const y = boss.floorY - PROJECTILE.SHOCKWAVE_HEIGHT
      for (const dir of [-1, 1]) {
        this.spawnProjectile(PROJECTILE_KIND.SHOCKWAVE, {
          x: boss.brain.x + (dir * MALLOW.BODY_WIDTH) / 2,
          y,
          vx: dir * PROJECTILE.SHOCKWAVE_SPEED,
          vy: 0,
        })
      }
      this.cameras.main.shake(SCREEN_SHAKE.STOMP_TIME * 1000, SCREEN_SHAKE.STOMP_INTENSITY)
    }
    this.publishBossBar()
  }

  spawnProjectile(kind, { x, y, vx, vy }) {
    this.projectiles.push(new Projectile(this, kind, x, y, vx, vy, this.tiles))
  }

  updateProjectiles(dt) {
    if (this.projectiles.length === 0) return
    const rect = this.player.rect
    for (const p of this.projectiles) {
      p.update(dt)
      if (p.dead || !p.touches(rect)) continue
      if (this.player.hurt(PROJECTILE.DAMAGE, p.p.x)) this.onPlayerHurt()
      p.pop()
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead)
  }

  // A boss woke: the exits seal until it's beaten.
  startBossFight() {
    this.sealed = true
    this.player.body.setCollideWorldBounds(true)
    this.bridge?.toast(`${this.boss.name} awakens!`)
    this.audio?.play(this.boss.kind === 'mallow' ? SOUND.ROAR : SOUND.SHRIEK)
    this.publishBossBar()
  }

  endBossFight() {
    this.sealed = false
    this.player.body.setCollideWorldBounds(false)
    this.seal.clear()
    this.bridge?.update({ boss: null })
    for (const p of this.projectiles) p.pop()
    this.projectiles = []
  }

  publishBossBar() {
    const boss = this.boss
    if (!this.bridge || !boss || !boss.active || !boss.awake) return
    const steps = BOSS_FIGHT.BAR_STEPS
    const health = Math.round(Math.max(0, boss.healthFraction) * steps) / steps
    const phases = boss.kind === 'mallow' ? MALLOW.PHASES : 1
    const phase = boss.phase ?? 1
    const current = this.bridge.getState().boss
    if (current && current.health === health && current.phase === phase && current.name === boss.name) return
    this.bridge.update({ boss: { name: boss.name, health, phase, phases } })
  }

  // Glowing ectoplasm over each exit while a boss fight seals the room.
  drawSeal() {
    if (!this.sealed) return
    const g = this.seal
    g.clear()
    const alpha = BOSS_FIGHT.SEAL_ALPHA * (0.75 + 0.25 * Math.sin(this.time0 * BOSS_FIGHT.SEAL_FLICKER_SPEED))
    g.fillStyle(toColor(PALETTE.boss.seal), alpha)
    const s = TILE_SIZE
    for (const exit of this.room.exits) {
      const [first, last] = exit.span
      const length = (last - first + 1) * s
      if (exit.edge === 'left') g.fillRect(0, first * s, s / 4, length)
      else if (exit.edge === 'right') g.fillRect(this.room.width * s - s / 4, first * s, s / 4, length)
      else if (exit.edge === 'top') g.fillRect(first * s, 0, length, s / 4)
      else g.fillRect(first * s, (this.room.height - 2) * s, length, s / 4)
    }
  }

  updateOrbs(dt) {
    const { x, y } = this.player.center
    let collected = 0
    for (const orb of this.orbs) {
      if (orb.update(dt, x, y)) collected++
    }
    if (collected === 0) return
    this.orbs = this.orbs.filter((orb) => !orb.collected)
    this.audio?.play(SOUND.ESSENCE)
    collectEssence(this.wallet, this.player.health, collected)
    this.publishHud()
  }

  updateRelics(dt, player) {
    for (const relic of this.relics) {
      if (!relic.update(dt, player)) continue
      if (!grantAbility(this.session, relic.ability)) continue
      const info = ABILITY_INFO[relic.ability]
      this.bridge?.toast(`${info.name} · ${info.blurb}`)
      this.audio?.play(SOUND.RELIC)
      triggerHitStop(this.hitStop, HIT_STOP.CAPTURE)
      writeSave(checkpointSave(this.session, Date.now()))
      this.publishHud()
    }
    this.relics = this.relics.filter((r) => !r.collected)
  }

  checkGhostContact() {
    const rect = this.player.rect
    for (const foe of this.foes) {
      if (!foe.dealsContactDamage || !foe.touches(rect)) continue
      foe.recoil()
      if (this.player.hurt(GHOST.CONTACT_DAMAGE, foe.x)) this.onPlayerHurt()
    }
  }

  onPlayerHurt() {
    triggerHitStop(this.hitStop, HIT_STOP.PLAYER_HIT)
    this.cameras.main.shake(SCREEN_SHAKE.PLAYER_HIT_TIME * 1000, SCREEN_SHAKE.PLAYER_HIT_INTENSITY)
    vibrate()
    this.audio?.play(SOUND.HURT)
    this.publishHud()
    if (this.player.dead) {
      this.audio?.play(SOUND.DEATH)
      this.audio?.setHum(false)
      this.stream.stop()
      this.tetheredGhost = null
      this.bridge?.update({ hint: null, boss: null })
      startDeath(this.death)
    }
  }

  // Pressing up rests at the fire pole or buys at the supply desk. Otherwise
  // the hint zone the player is in (if any) is shown.
  updateInteractions(input) {
    const { x } = this.player.center
    const feetY = this.player.body.bottom
    const standing = { x, feetY, grounded: this.player.body.blocked.down }
    const atPole = this.pole && canUsePole(this.pole, standing, FIRE_POLE.REACH, TILE_SIZE)
    const atShop = this.shop && canUsePole(this.shop, standing, SHOP.REACH, TILE_SIZE)

    if (atPole && input.justPressed('up')) this.rest()
    if (atShop && input.justPressed('up')) this.buyNext()

    let hint
    if (atPole) hint = SAVE_HINT
    else if (atShop) hint = this.shopOffer()
    else hint = hintAt(this.room.entities, x, this.player.center.y, TILE_SIZE, this.session.abilities)
    this.bridge?.update({ hint })
  }

  // The shop's hint, rebuilt only when its text would change so the bridge
  // doesn't re-render every frame.
  shopOffer() {
    const item = nextItem(this.session)
    if (!item) return 'shopEmpty'
    const vars = { item: item.name, price: item.price, have: this.wallet.essence }
    const key = `${vars.item}:${vars.price}:${vars.have}`
    if (this.shopHint?.key !== key) this.shopHint = { key, hint: { id: 'shop', vars } }
    return this.shopHint.hint
  }

  buyNext() {
    const item = nextItem(this.session)
    if (!item) return
    const { ok } = buy(this.session, item)
    if (!ok) {
      this.bridge?.toast(TOO_POOR_TEXT)
      this.audio?.play(SOUND.DENIED)
      return
    }
    this.audio?.play(SOUND.BUY)
    this.player.health.max = this.session.maxHp
    this.player.health.hp = Math.min(this.player.health.hp + (item.ability ? 0 : 1), this.session.maxHp)
    const blurb = item.ability ? ABILITY_INFO[item.ability].blurb : 'One more battery cell'
    this.bridge?.toast(`${item.name} · ${blurb}`)
    this.shop.flash(this)
    this.shop.show(nextItem(this.session))
    writeSave(checkpointSave(this.session, Date.now()))
    this.publishHud()
  }

  rest() {
    const save = restAtPole(this.session, this.room.id, Date.now())
    this.player.health.hp = this.session.hp
    const { ok } = writeSave(save)
    this.pole.flash()
    this.audio?.play(SOUND.SAVE)
    this.bridge?.toast(ok ? SAVED_TEXT : SAVE_FAILED_TEXT)
    this.publishHud()
  }

  // Walking off an edge through an exit fades out and restarts the scene in
  // the next room.
  checkExits() {
    const { x, y } = this.player.center
    const edge = crossedEdge(this.room, x, y, TILE_SIZE)
    if (!edge) return
    const exit = exitAt(this.room, edge, x, y, TILE_SIZE)
    const target = exit && resolveRoom(exit.to)
    if (!target) {
      // Rooms are validated so every opening has an exit; this is a safety net.
      this.player.body.reset(Phaser.Math.Clamp(x, 0, this.room.width * TILE_SIZE), Math.max(0, y))
      return
    }

    const body = this.player.body
    const placement = entryPlacement(
      this.room,
      exit,
      target,
      {
        x,
        y,
        vx: body.velocity.x,
        vy: body.velocity.y,
        halfWidth: PLAYER.BODY_WIDTH / 2,
        halfHeight: PLAYER.BODY_HEIGHT / 2,
      },
      TILE_SIZE,
      ROOM_TRANSITION,
    )
    travel(this.session, target.id, placement, this.player.health.hp)
    this.leave()
  }

  leave() {
    this.leaving = true
    this.stream.stop()
    this.audio?.setHum(false)
    this.bridge?.update({ hint: null, boss: null })
    const camera = this.cameras.main
    camera.stopFollow()
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.restart())
    camera.fadeOut(ROOM_TRANSITION.FADE_TIME * 1000)
  }

  updateDeath(dt) {
    const events = stepDeath(this.death, dt)
    if (events.fadeOut) this.cameras.main.fadeOut(PLAYER_COMBAT.DEATH_FADE_TIME * 1000)
    if (events.respawn) {
      // Back to the last fire pole rested at (or the new-game spawn).
      respawnAtSave(this.session)
      this.scene.restart()
    }
  }

  publishHud() {
    this.registry.set(HUD_KEYS.HP, this.player.health.hp)
    this.registry.set(HUD_KEYS.MAX_HP, this.player.health.max)
    this.registry.set(HUD_KEYS.ESSENCE, this.wallet.essence)
    this.registry.set(HUD_KEYS.ABILITIES, [...this.session.abilities].sort().join(','))
  }
}
