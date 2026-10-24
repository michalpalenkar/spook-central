import Phaser from 'phaser'
import {
  CAMERA,
  DEPTH,
  ESSENCE,
  FIRE_POLE,
  GHOST,
  HIT_STOP,
  MAX_FRAME_DELTA,
  PLAYER,
  PLAYER_COMBAT,
  PROTON_STREAM,
  ROOM_TRANSITION,
  SCREEN_SHAKE,
  TILE_SIZE,
} from '../constants.js'
import { DEFAULT_AREA, areaTextures } from '../art/generateTextures.js'
import { EssenceOrb } from '../entities/EssenceOrb.js'
import { FirePole } from '../entities/FirePole.js'
import { Ghost } from '../entities/Ghost.js'
import { Player } from '../entities/Player.js'
import { ProtonStream } from '../entities/ProtonStream.js'
import { Trap } from '../entities/Trap.js'
import { crossedEdge, entryPlacement, exitAt } from '../levels/exits.js'
import { parseRoom } from '../levels/parseRoom.js'
import { TEST_ROOM } from '../levels/testRoom.js'
import { AREAS, ROOMS, getRoom } from '../levels/world.js'
import { buildMapView } from '../systems/areaMap.js'
import { buildRoom, roomCollisionFilter } from '../systems/buildRoom.js'
import { createDeathSequence, startDeath, stepDeath } from '../systems/deathSequence.js'
import { collectEssence } from '../systems/essence.js'
import { damageGhost } from '../systems/ghostState.js'
import { GamepadInput } from '../systems/GamepadInput.js'
import { vibrate } from '../systems/haptics.js'
import { SAVE_HINT, canUsePole, hintAt } from '../systems/hints.js'
import { createHitStop, stepHitStop, triggerHitStop } from '../systems/hitStop.js'
import { InputState } from '../systems/InputState.js'
import { KeyboardInput } from '../systems/KeyboardInput.js'
import { circleIntersectsRect } from '../systems/overlap.js'
import { writeSave } from '../systems/saveStorage.js'
import { ENTRY, isCaptured, markCaptured, respawnAtSave, restAtPole, travel } from '../systems/session.js'
import { HUD_KEYS } from './UIScene.js'

export const SAVED_TEXT = 'Rested at the fire pole · progress saved'
export const SAVE_FAILED_TEXT = 'Rested · couldn’t save on this device'

// The dev sandbox room isn't part of the world; it's only reachable with ?room=test-room.
let testRoom = null
function resolveRoom(id) {
  if (id === TEST_ROOM.id) return (testRoom ??= parseRoom(TEST_ROOM))
  return getRoom(id)
}

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
    const room = resolveRoom(this.session.roomId) ?? getRoom(this.session.respawn.roomId)
    this.room = room
    const textures = areaTextures(room.area ?? DEFAULT_AREA)

    this.add.image(0, 0, textures.backdrop).setOrigin(0).setScrollFactor(0).setDepth(DEPTH.BACKDROP)
    const { layer, width, height } = buildRoom(this, room, textures.tiles)
    layer.setDepth(DEPTH.ROOM)

    // The input state outlives scene restarts, so keys are bound only once.
    if (!this.inputState) {
      this.inputState = new InputState()
      this.inputState.addSource(new KeyboardInput(this.input.keyboard))
      this.inputState.addSource(new GamepadInput())
      const touchInput = this.registry.get('touchInput')
      if (touchInput) this.inputState.addSource(touchInput)
    }

    const poleData = room.entities.find((e) => e.type === 'pole')
    this.pole = poleData ? new FirePole(this, poleData, room) : null

    const entry = this.entryPoint()
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
      .map((e) => new Ghost(this, e, room))
    this.stream = new ProtonStream(this, room.tiles)
    this.trap = new Trap(this)
    this.physics.add.collider(this.trap.hitbox, layer, undefined, roomCollisionFilter)
    this.orbs = []

    this.wallet = this.session.wallet
    this.hitStop = createHitStop()
    this.death = createDeathSequence()
    this.tetheredGhost = null
    this.leaving = false
    this.mapOpen = false

    const camera = this.cameras.main
    camera.resetFX()
    camera.setBounds(0, 0, width, height)
    camera.startFollow(this.player.hitbox, true, CAMERA.LERP_X, CAMERA.LERP_Y)
    camera.setDeadzone(CAMERA.DEADZONE_WIDTH, CAMERA.DEADZONE_HEIGHT)
    camera.fadeIn(ROOM_TRANSITION.FADE_TIME * 1000)

    this.announceArea()
    this.bridge?.update({ mapOpen: false, hint: null })
    this.publishHud()
    if (!this.scene.isActive('UI')) this.scene.launch('UI')
  }

  /** Where the player appears: { x, feetY, vx, vy } in room pixels. */
  entryPoint() {
    const { entry } = this.session
    const room = this.room
    if (entry.type === ENTRY.EXIT) {
      return { x: entry.x, feetY: entry.y + PLAYER.BODY_HEIGHT / 2, vx: entry.vx, vy: entry.vy }
    }
    const atPole = this.pole && { x: this.pole.x, feetY: this.pole.feetY, vx: 0, vy: 0 }
    if (entry.type === ENTRY.POLE && atPole) return atPole
    if (room.spawn) return { x: (room.spawn.x + 0.5) * TILE_SIZE, feetY: (room.spawn.y + 1) * TILE_SIZE, vx: 0, vy: 0 }
    // A dev jump to a room without a spawn: the pole, or the room's centre.
    return atPole || { x: (room.width / 2) * TILE_SIZE, feetY: (room.height / 2) * TILE_SIZE, vx: 0, vy: 0 }
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
    this.inputState.update()
    const input = this.inputState

    if (input.justPressed('pause') && !this.leaving && !this.death.active) this.toggleMap()
    if (this.mapOpen || this.leaving) {
      this.physics.world.pause()
      return
    }

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

    const firing = input.isDown('fire')
    this.player.update(input, dt, {
      moveScale: firing ? PLAYER_COMBAT.FIRING_MOVE_MULTIPLIER : 1,
      faceX: this.tetheredGhost ? this.tetheredGhost.x : null,
    })

    this.updateStream(dt, firing)
    this.updateTrap(dt, input)
    const playerCenter = this.player.center
    for (const ghost of this.ghosts) {
      if (ghost.active) ghost.update(dt, playerCenter)
    }
    this.updateOrbs(dt)
    this.checkGhostContact()
    if (this.player.dead) return
    this.updatePole(input)
    this.checkExits()
  }

  toggleMap() {
    this.mapOpen = !this.mapOpen
    if (!this.bridge) return
    if (!this.mapOpen) {
      this.bridge.update({ mapOpen: false })
      return
    }
    const { respawn } = this.session
    const map = buildMapView(
      ROOMS,
      {
        visited: this.session.visited,
        currentRoomId: this.room.id,
        player: this.player.center,
        saveRoomId: respawn.entry === ENTRY.POLE ? respawn.roomId : null,
      },
      TILE_SIZE,
    )
    this.bridge.update({ mapOpen: true, map })
  }

  updateStream(dt, firing) {
    const live = this.ghosts.filter((g) => g.active)
    const target = this.stream.update(dt, firing, this.player.nozzle, this.player.facing, live)
    for (const ghost of this.ghosts) ghost.tethered = ghost === target
    this.tetheredGhost = target
    if (target) damageGhost(target.state, PROTON_STREAM.DAMAGE_PER_SECOND * dt)
  }

  updateTrap(dt, input) {
    if (input.justPressed('trap') && this.trap.canThrow) {
      const { x } = this.player.center
      this.trap.throw(x, this.player.body.bottom, this.tetheredGhost?.x ?? null, this.player.facing)
    }

    const events = this.trap.update(dt, this.ghosts.filter((g) => g.active))
    if (events.captureStarted) events.captureStarted.startCapture()

    if (this.trap.capturing) {
      const target = this.ghosts.find((g) => g.id === this.trap.logic.targetId)
      const { x, y } = this.trap.mouth
      target?.updateCapture(x, y, this.trap.progress)
    }

    if (events.captured) {
      const ghost = events.captured
      ghost.capture()
      markCaptured(this.session, this.room.id, ghost.id)
      const { x, y } = this.trap.mouth
      for (let i = 0; i < ESSENCE.DROP_COUNT; i++) {
        this.orbs.push(new EssenceOrb(this, x, y - GHOST.BODY_RADIUS, this.room.tiles))
      }
      triggerHitStop(this.hitStop, HIT_STOP.CAPTURE)
      this.cameras.main.shake(SCREEN_SHAKE.CAPTURE_TIME * 1000, SCREEN_SHAKE.CAPTURE_INTENSITY)
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
    collectEssence(this.wallet, this.player.health, collected)
    this.publishHud()
  }

  checkGhostContact() {
    const body = this.player.body
    const rect = { x: body.x, y: body.y, width: body.width, height: body.height }
    for (const ghost of this.ghosts) {
      if (!ghost.active || !ghost.dealsContactDamage) continue
      if (!circleIntersectsRect(ghost.x, ghost.y, GHOST.BODY_RADIUS, rect)) continue
      ghost.recoil()
      if (this.player.hurt(GHOST.CONTACT_DAMAGE, ghost.x)) this.onPlayerHurt()
    }
  }

  onPlayerHurt() {
    triggerHitStop(this.hitStop, HIT_STOP.PLAYER_HIT)
    this.cameras.main.shake(SCREEN_SHAKE.PLAYER_HIT_TIME * 1000, SCREEN_SHAKE.PLAYER_HIT_INTENSITY)
    vibrate()
    this.publishHud()
    if (this.player.dead) {
      this.stream.stop()
      this.tetheredGhost = null
      this.bridge?.update({ hint: null })
      startDeath(this.death)
    }
  }

  // Standing at the fire pole shows the save hint; pressing up rests there.
  // Otherwise the hint zone the player is in (if any) is shown.
  updatePole(input) {
    const { x } = this.player.center
    const feetY = this.player.body.bottom
    const atPole =
      this.pole &&
      canUsePole(this.pole, { x, feetY, grounded: this.player.body.blocked.down }, FIRE_POLE.REACH, TILE_SIZE)

    if (atPole && input.justPressed('up')) this.rest()
    const hint = atPole ? SAVE_HINT : hintAt(this.room.entities, x, this.player.center.y, TILE_SIZE)
    this.bridge?.update({ hint })
  }

  rest() {
    const save = restAtPole(this.session, this.room.id, Date.now())
    this.player.health.hp = this.session.hp
    const { ok } = writeSave(save)
    this.pole.flash()
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
    this.bridge?.update({ hint: null })
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
  }
}
