import Phaser from 'phaser'
import {
  CAMERA,
  DEPTH,
  ESSENCE,
  GHOST,
  HIT_STOP,
  MAX_FRAME_DELTA,
  PLAYER_COMBAT,
  PROTON_STREAM,
  SCREEN_SHAKE,
  TILE_SIZE,
} from '../constants.js'
import { TEXTURES } from '../art/generateTextures.js'
import { EssenceOrb } from '../entities/EssenceOrb.js'
import { Ghost } from '../entities/Ghost.js'
import { Player } from '../entities/Player.js'
import { ProtonStream } from '../entities/ProtonStream.js'
import { Trap } from '../entities/Trap.js'
import { parseRoom } from '../levels/parseRoom.js'
import { TEST_ROOM } from '../levels/testRoom.js'
import { buildRoom, roomCollisionFilter } from '../systems/buildRoom.js'
import { createDeathSequence, startDeath, stepDeath } from '../systems/deathSequence.js'
import { collectEssence, createWallet } from '../systems/essence.js'
import { damageGhost } from '../systems/ghostState.js'
import { GamepadInput } from '../systems/GamepadInput.js'
import { vibrate } from '../systems/haptics.js'
import { createHitStop, stepHitStop, triggerHitStop } from '../systems/hitStop.js'
import { InputState } from '../systems/InputState.js'
import { KeyboardInput } from '../systems/KeyboardInput.js'
import { circleIntersectsRect } from '../systems/overlap.js'
import { HUD_KEYS } from './UIScene.js'

export class WorldScene extends Phaser.Scene {
  constructor() {
    super('World')
  }

  create() {
    const room = parseRoom(TEST_ROOM)
    this.room = room

    this.add.image(0, 0, TEXTURES.BACKDROP).setOrigin(0).setScrollFactor(0).setDepth(DEPTH.BACKDROP)
    const { layer, width, height } = buildRoom(this, room)
    layer.setDepth(DEPTH.ROOM)

    this.inputState = new InputState()
    this.inputState.addSource(new KeyboardInput(this.input.keyboard))
    this.inputState.addSource(new GamepadInput())
    const touchInput = this.registry.get('touchInput')
    if (touchInput) this.inputState.addSource(touchInput)

    this.spawn = { x: (room.spawn.x + 0.5) * TILE_SIZE, feetY: (room.spawn.y + 1) * TILE_SIZE }
    this.player = new Player(this, this.spawn.x, this.spawn.feetY)
    this.player.sprite.setDepth(DEPTH.PLAYER)
    this.physics.add.collider(this.player.hitbox, layer, undefined, roomCollisionFilter)
    this.physics.world.setBounds(0, 0, width, height)

    this.ghosts = room.entities.filter((e) => e.type === 'ghost').map((e) => new Ghost(this, e, room))
    this.stream = new ProtonStream(this, room.tiles)
    this.trap = new Trap(this)
    this.physics.add.collider(this.trap.hitbox, layer, undefined, roomCollisionFilter)
    this.orbs = []

    this.wallet = createWallet()
    this.hitStop = createHitStop()
    this.death = createDeathSequence()
    this.tetheredGhost = null

    const camera = this.cameras.main
    camera.setBounds(0, 0, width, height)
    camera.startFollow(this.player.hitbox, true, CAMERA.LERP_X, CAMERA.LERP_Y)
    camera.setDeadzone(CAMERA.DEADZONE_WIDTH, CAMERA.DEADZONE_HEIGHT)

    this.publishHud()
    this.scene.launch('UI')
  }

  update(_time, deltaMs) {
    const realDt = deltaMs / 1000
    const dt = Math.min(realDt, MAX_FRAME_DELTA)
    this.inputState.update()

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

    const input = this.inputState
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
      startDeath(this.death)
    }
  }

  updateDeath(dt) {
    const events = stepDeath(this.death, dt)
    if (events.fadeOut) this.cameras.main.fadeOut(PLAYER_COMBAT.DEATH_FADE_TIME * 1000)
    if (events.respawn) this.respawn()
  }

  // No save system yet: dying resets the room and puts the player back at
  // its spawn. Ecto-essence is kept.
  respawn() {
    this.player.respawn(this.spawn.x, this.spawn.feetY)
    for (const ghost of this.ghosts) ghost.reset()
    this.trap.recall()
    for (const orb of this.orbs) orb.destroy()
    this.orbs = []
    this.tetheredGhost = null
    const camera = this.cameras.main
    camera.resetFX()
    camera.centerOn(this.spawn.x, this.spawn.feetY)
    camera.fadeIn(PLAYER_COMBAT.DEATH_FADE_TIME * 1000)
    this.publishHud()
  }

  publishHud() {
    this.registry.set(HUD_KEYS.HP, this.player.health.hp)
    this.registry.set(HUD_KEYS.MAX_HP, this.player.health.max)
    this.registry.set(HUD_KEYS.ESSENCE, this.wallet.essence)
  }
}
