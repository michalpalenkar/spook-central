import Phaser from 'phaser'
import { CAMERA, MAX_FRAME_DELTA, TILE_SIZE } from '../constants.js'
import { TEXTURES } from '../art/generateTextures.js'
import { Player } from '../entities/Player.js'
import { parseRoom } from '../levels/parseRoom.js'
import { TEST_ROOM } from '../levels/testRoom.js'
import { buildRoom, roomCollisionFilter } from '../systems/buildRoom.js'
import { GamepadInput } from '../systems/GamepadInput.js'
import { InputState } from '../systems/InputState.js'
import { KeyboardInput } from '../systems/KeyboardInput.js'

export class WorldScene extends Phaser.Scene {
  constructor() {
    super('World')
  }

  create() {
    const room = parseRoom(TEST_ROOM)

    this.add.image(0, 0, TEXTURES.BACKDROP).setOrigin(0).setScrollFactor(0)
    const { layer, width, height } = buildRoom(this, room)

    this.inputState = new InputState()
    this.inputState.addSource(new KeyboardInput(this.input.keyboard))
    this.inputState.addSource(new GamepadInput())
    const touchInput = this.registry.get('touchInput')
    if (touchInput) this.inputState.addSource(touchInput)

    const spawnX = (room.spawn.x + 0.5) * TILE_SIZE
    const spawnFeetY = (room.spawn.y + 1) * TILE_SIZE
    this.player = new Player(this, spawnX, spawnFeetY)
    this.physics.add.collider(this.player.hitbox, layer, undefined, roomCollisionFilter)
    this.physics.world.setBounds(0, 0, width, height)

    const camera = this.cameras.main
    camera.setBounds(0, 0, width, height)
    camera.startFollow(this.player.hitbox, true, CAMERA.LERP_X, CAMERA.LERP_Y)
    camera.setDeadzone(CAMERA.DEADZONE_WIDTH, CAMERA.DEADZONE_HEIGHT)
  }

  update(_time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, MAX_FRAME_DELTA)
    this.inputState.update()
    this.player.update(this.inputState, dt)
  }
}
