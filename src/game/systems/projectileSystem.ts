import type { EnemyTag, Health, Transform } from "../components";
import type { GameContext } from "../GameContext";
import { killEnemy } from "../worldActions";

const PROJECTILE_DESPAWN_DISTANCE = 200;
const PROJECTILE_HIT_RADIUS = 1.1;

export const runProjectileSystem = (ctx: GameContext, delta: number): void => {
  const removeIndices: number[] = [];

  for (let i = 0; i < ctx.projectiles.length; i += 1) {
    const projectile = ctx.projectiles[i];
    projectile.mesh.position.addScaledVector(projectile.velocity, delta);

    if (projectile.mesh.position.length() > PROJECTILE_DESPAWN_DISTANCE) {
      removeIndices.push(i);
      continue;
    }

    const enemies = ctx.world.query(["enemy", "transform", "health"]);
    for (const entity of enemies) {
      const transform = ctx.world.getComponent<Transform>(entity, "transform");
      const health = ctx.world.getComponent<Health>(entity, "health");
      const enemy = ctx.world.getComponent<EnemyTag>(entity, "enemy");
      if (!transform || !health || !enemy) {
        continue;
      }

      const hitDistance = Math.hypot(transform.x - projectile.mesh.position.x, transform.z - projectile.mesh.position.z);
      if (hitDistance > PROJECTILE_HIT_RADIUS) {
        continue;
      }

      health.current -= projectile.damage;
      const render = ctx.enemyMeshes.get(entity);
      if (render) {
        render.mesh.userData.hitAnimTimer = 0.22;
      }
      ctx.renderer.spawnHitEffect(transform.x, 1.2, transform.z);
      if (projectile.burnDuration > 0) {
        enemy.burnTimer = projectile.burnDuration;
      }
      if (health.current <= 0) {
        killEnemy(ctx, entity);
      }
      removeIndices.push(i);
      break;
    }
  }

  removeIndices.sort((a, b) => b - a);
  for (const idx of removeIndices) {
    const projectile = ctx.projectiles[idx];
    ctx.renderer.scene.remove(projectile.mesh);
    ctx.projectiles.splice(idx, 1);
  }
};
