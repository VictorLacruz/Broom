import type { Transform } from "../components";
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
    ctx.internals.keyMesh.rotation.y += 0.02;
    ctx.internals.keyMesh.position.y = 1.2 + Math.sin(time * 2) * 0.2;
  }
};
