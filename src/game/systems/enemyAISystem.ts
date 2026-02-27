import * as THREE from "three";
import type { Combat, EnemyTag, Health, Shield, Transform } from "../components";
import type { GameContext } from "../GameContext";
import { clampToWalkable, separateCircles } from "./collisionUtils";
import { killEnemy } from "../worldActions";

const ENEMY_RADIUS = 0.72;
const PLAYER_RADIUS = 0.8;
const MAGE_PROJECTILE_RANGE = 13;
const MAGE_PROJECTILE_SPEED = 11;
const MAGE_PROJECTILE_Y = 1.25;

export const runEnemyAISystem = (ctx: GameContext, delta: number): void => {
  const playerTransform = ctx.world.getComponent<Transform>(ctx.playerEntity, "transform");
  const playerHealth = ctx.world.getComponent<Health>(ctx.playerEntity, "health");
  const shield = ctx.world.getComponent<Shield>(ctx.playerEntity, "shield");
  if (!playerTransform || !playerHealth || !shield) {
    return;
  }

  const enemies = ctx.world.query(["enemy", "transform", "health", "combat"]);
  for (const entity of enemies) {
    const enemy = ctx.world.getComponent<EnemyTag>(entity, "enemy");
    const transform = ctx.world.getComponent<Transform>(entity, "transform");
    const health = ctx.world.getComponent<Health>(entity, "health");
    const combat = ctx.world.getComponent<Combat>(entity, "combat");
    if (!enemy || !transform || !health || !combat) {
      continue;
    }

    const render = ctx.enemyMeshes.get(entity);
    const prevX = transform.x;
    const prevZ = transform.z;
    const attackTimer = Math.max(0, (render?.mesh.userData.attackAnimTimer as number | undefined) ?? 0);
    const hitTimer = Math.max(0, (render?.mesh.userData.hitAnimTimer as number | undefined) ?? 0);
    combat.timer = Math.max(0, combat.timer - delta);
    if (enemy.burnTimer > 0) {
      enemy.burnTimer -= delta;
      health.current -= health.max * ctx.config.abilities.level4.headBurn.damagePerSecond * delta;
      if (health.current <= 0) {
        killEnemy(ctx, entity);
        continue;
      }
    }

    const distance = updateEnemySteering(enemy, transform, playerTransform, delta);
    const clamped = clampToWalkable(transform.x, transform.z, ENEMY_RADIUS);
    transform.x = clamped.x;
    transform.z = clamped.z;
    separateCircles(transform, playerTransform, ENEMY_RADIUS, PLAYER_RADIUS, 0.12, 0.88);

    const isWizard = enemy.type.type === "mago";
    if (isWizard && distance <= MAGE_PROJECTILE_RANGE && combat.timer <= 0) {
      spawnMageProjectile(ctx, transform, playerTransform, enemy.type.damage);
      combat.timer = combat.cooldown;
      if (render) {
        render.mesh.userData.attackAnimTimer = 0.28;
      }
    } else if (!isWizard && distance <= combat.range && combat.timer <= 0) {
      if (shield.active) {
        shield.durability = Math.max(0, shield.durability - enemy.type.damage * 0.45);
      } else {
        playerHealth.current -= enemy.type.damage * 0.35;
      }
      combat.timer = combat.cooldown;
      if (render) {
        render.mesh.userData.attackAnimTimer = 0.28;
      }
    }

    const moved = Math.hypot(transform.x - prevX, transform.z - prevZ) > 0.001;
    let animState: "idle" | "run" | "attack" | "hit" = moved ? "run" : "idle";
    const nextAttackTimer = Math.max(0, attackTimer - delta);
    const nextHitTimer = Math.max(0, hitTimer - delta);
    if (render) {
      render.mesh.userData.attackAnimTimer = nextAttackTimer;
      render.mesh.userData.hitAnimTimer = nextHitTimer;
    }
    if (nextAttackTimer > 0) {
      animState = "attack";
    }
    if (nextHitTimer > 0) {
      animState = "hit";
    }
    const setEnemyAnimState = render?.mesh.userData.setEnemyAnimState as
      | ((state: "idle" | "run" | "attack" | "hit") => void)
      | undefined;
    setEnemyAnimState?.(animState);
  }

  for (let i = 0; i < enemies.length; i += 1) {
    const a = ctx.world.getComponent<Transform>(enemies[i], "transform");
    if (!a) continue;
    for (let j = i + 1; j < enemies.length; j += 1) {
      const b = ctx.world.getComponent<Transform>(enemies[j], "transform");
      if (!b) continue;
      separateCircles(a, b, ENEMY_RADIUS, ENEMY_RADIUS, 0.5, 0.5);
    }
  }
  ctx.runtime.shieldDurability = shield.durability;
};

const spawnMageProjectile = (ctx: GameContext, mage: Transform, player: Transform, damage: number): void => {
  const mesh = ctx.renderer.spawnWizardProjectile(mage.x, MAGE_PROJECTILE_Y, mage.z);
  const velocity = new THREE.Vector3(player.x - mage.x, 0, player.z - mage.z).normalize().multiplyScalar(MAGE_PROJECTILE_SPEED);
  ctx.projectiles.push({
    mesh,
    velocity,
    damage,
    burnDuration: 0,
    owner: "enemy"
  });
};

export const updateEnemySteering = (
  enemy: EnemyTag,
  transform: Transform,
  player: Transform,
  delta: number
): number => {
  const dx = player.x - transform.x;
  const dz = player.z - transform.z;
  const dist = Math.hypot(dx, dz) || 0.001;
  const nx = dx / dist;
  const nz = dz / dist;

  let advance = 1;
  if (enemy.type.behavior === "ranged_keep_distance") {
    advance = dist > 8 ? 1 : dist < 6 ? -1 : 0;
  }
  if (enemy.type.behavior === "flank") {
    transform.x += -nz * enemy.type.speed * delta * 2;
    transform.z += nx * enemy.type.speed * delta * 2;
  }
  transform.x += nx * enemy.type.speed * advance * delta * 4;
  transform.z += nz * enemy.type.speed * advance * delta * 4;
  return dist;
};
