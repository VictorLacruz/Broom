import type { KeyItem, Transform } from "../components";
import type { GameContext } from "../GameContext";

const KEY_PICKUP_DISTANCE = 3;

export const runKeyInteractionSystem = (ctx: GameContext): void => {
  if (ctx.runtime.playerHasKey || !ctx.frameInput.interact) {
    return;
  }

  const player = ctx.world.getComponent<Transform>(ctx.playerEntity, "transform");
  const keyTransform = ctx.world.getComponent<Transform>(ctx.internals.keyEntity, "transform");
  const keyItem = ctx.world.getComponent<KeyItem>(ctx.internals.keyEntity, "key");
  if (!player || !keyTransform || !keyItem || keyItem.picked) {
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
};

