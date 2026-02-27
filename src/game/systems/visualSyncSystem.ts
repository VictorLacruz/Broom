import type { Shield, Transform } from "../components";
import type { GameContext } from "../GameContext";

export const runVisualSyncSystem = (ctx: GameContext, time: number): void => {
  const enemies = ctx.world.query(["enemy", "transform"]);
  for (const entity of enemies) {
    const transform = ctx.world.getComponent<Transform>(entity, "transform");
    const enemyRender = ctx.enemyMeshes.get(entity);
    if (!transform || !enemyRender) {
      continue;
    }
    enemyRender.mesh.position.set(transform.x, transform.y, transform.z);
    const animateSprite = enemyRender.mesh.userData.animateEnemySprite as ((time: number) => void) | undefined;
    animateSprite?.(time);
  }

  if (ctx.internals.keyMesh && !ctx.runtime.playerHasKey) {
    const animateKey = ctx.internals.keyMesh.userData.animateKeySprite as ((time: number) => void) | undefined;
    animateKey?.(time);
  }

  const playerTransform = ctx.world.getComponent<Transform>(ctx.playerEntity, "transform");
  const playerShield = ctx.world.getComponent<Shield>(ctx.playerEntity, "shield");
  if (playerTransform && playerShield) {
    const showShieldSprite = ctx.frameInput.shield || playerShield.active;
    const shieldX = playerTransform.x + Math.sin(playerTransform.yaw) * 1.0;
    const shieldZ = playerTransform.z + Math.cos(playerTransform.yaw) * 1.0;
    ctx.renderer.setShieldSprite(showShieldSprite, shieldX, shieldZ, time);
  }

  ctx.renderer.setDoorOpen(ctx.runtime.playerHasKey);
  ctx.renderer.updateHitEffects(time);
  ctx.renderer.updateAttackEffects(time);
};
