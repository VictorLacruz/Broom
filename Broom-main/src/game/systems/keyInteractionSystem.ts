import type { KeyItem, Transform } from "../components";
import type { GameContext } from "../GameContext";

const KEY_PICKUP_DISTANCE = 3;
const DOOR_INTERACT_DISTANCE = 3.2;
const LEVEL_LOADING_SECONDS = 1.5;

export const runKeyInteractionSystem = (ctx: GameContext): void => {
  if (!ctx.frameInput.interact) {
    return;
  }

  const player = ctx.world.getComponent<Transform>(ctx.playerEntity, "transform");
  if (!player) {
    return;
  }

  if (!ctx.runtime.playerHasKey) {
    const keyTransform = ctx.world.getComponent<Transform>(ctx.internals.keyEntity, "transform");
    const keyItem = ctx.world.getComponent<KeyItem>(ctx.internals.keyEntity, "key");
    if (!keyTransform || !keyItem || keyItem.picked) {
      return;
    }

    const distance = Math.hypot(player.x - keyTransform.x, player.z - keyTransform.z);
    if (distance > KEY_PICKUP_DISTANCE) {
      return;
    }

    keyItem.picked = true;
    ctx.runtime.playerHasKey = true;

    if (ctx.internals.keyMesh) {
      ctx.renderer.removeObject(ctx.internals.keyMesh);
      ctx.internals.keyMesh = null;
    }
    return;
  }

  const lastWave = ctx.runtime.currentLevel.waves.length - 1;
  if (ctx.runtime.enemiesAlive > 0 || ctx.runtime.waveIndex < lastWave) {
    return;
  }

  const door = ctx.internals.doorMesh;
  if (!door) {
    return;
  }
  const distanceDoor = Math.hypot(player.x - door.position.x, player.z - door.position.z);
  if (distanceDoor > DOOR_INTERACT_DISTANCE) {
    return;
  }

  const nextLevel = ctx.runtime.levelIndex + 1;
  if (nextLevel >= ctx.config.levels.length) {
    ctx.runtime.victory = true;
    return;
  }

  ctx.runtime.loading = true;
  ctx.runtime.loadingTimer = LEVEL_LOADING_SECONDS;
  ctx.runtime.levelIndex = nextLevel;
};
