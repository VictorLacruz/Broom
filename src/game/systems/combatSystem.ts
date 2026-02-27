import * as THREE from "three";
import type { Combat, Health, Transform } from "../components";
import type { GameContext } from "../GameContext";
import { killEnemy } from "../worldActions";

export const runPlayerCombatSystem = (ctx: GameContext, delta: number): void => {
  const combat = ctx.world.getComponent<Combat>(ctx.playerEntity, "combat");
  const playerTransform = ctx.world.getComponent<Transform>(ctx.playerEntity, "transform");
  if (!combat || !playerTransform) {
    return;
  }

  combat.timer = Math.max(0, combat.timer - delta);

  if (ctx.frameInput.attack && combat.timer <= 0) {
    const swing = ctx.config.abilities.level1.mangualSwing;
    const arc = swing.arcSequence[ctx.internals.swingIndex % swing.arcSequence.length] ?? "center";
    ctx.internals.swingIndex += 1;
    ctx.renderer.spawnPlayerAttackEffect(playerTransform.x, playerTransform.y, playerTransform.z, playerTransform.yaw, performance.now() / 1000);
    meleeHit(ctx, playerTransform, combat.damage, swing.hitboxRadius + combat.range, arc, swing.pushOnHit);
    combat.timer = combat.cooldown;
  }

  if (ctx.runtime.levelIndex >= 2 && ctx.frameInput.projectile && ctx.runtime.cooldowns.projectile <= 0) {
    fireProjectile(ctx, playerTransform);
    ctx.runtime.cooldowns.projectile = ctx.config.abilities.level3.headProjectile.cooldown;
  }
};

export const isInsideMeleeArc = (
  attacker: Transform,
  target: Transform,
  range: number,
  yawOffset: number
): boolean => {
  const dx = target.x - attacker.x;
  const dz = target.z - attacker.z;
  const dist = Math.hypot(dx, dz);
  if (dist > range) {
    return false;
  }
  const dir = Math.atan2(dx, dz);
  const delta = Math.abs(normalizeAngle(dir - (attacker.yaw + yawOffset)));
  return delta <= Math.PI / 3;
};

const normalizeAngle = (rad: number): number => {
  let value = rad;
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
};

const meleeHit = (ctx: GameContext, player: Transform, damage: number, range: number, arc: string, push: boolean): void => {
  const enemies = ctx.world.query(["enemy", "transform", "health"]);

  for (const entity of enemies) {
    const target = ctx.world.getComponent<Transform>(entity, "transform");
    const health = ctx.world.getComponent<Health>(entity, "health");
    if (!target || !health) {
      continue;
    }
    const dx = target.x - player.x;
    const dz = target.z - player.z;
    const dist = Math.hypot(dx, dz);
    if (dist > range) {
      continue;
    }
    const safeDist = dist || 1;
    health.current -= damage;
    const render = ctx.enemyMeshes.get(entity);
    if (render) {
      render.mesh.userData.hitAnimTimer = 0.22;
    }
    ctx.renderer.spawnHitEffect(target.x, 1.2, target.z);

    if (push) {
      target.x += (dx / safeDist) * 2;
      target.z += (dz / safeDist) * 2;
    }
    if (health.current <= 0) {
      killEnemy(ctx, entity);
    }
  }
};

const fireProjectile = (ctx: GameContext, player: Transform): void => {
  const cfg = ctx.config.abilities.level3.headProjectile;
  const burnDuration = ctx.runtime.levelIndex >= 3 ? ctx.config.abilities.level4.headBurn.duration : 0;

  const mesh = ctx.renderer.spawnWizardProjectile(player.x, 1.25, player.z);
  const direction =
    findNearestEnemyDirection(ctx, player) ??
    new THREE.Vector3(Math.sin(player.yaw), 0, Math.cos(player.yaw)).normalize();
  ctx.projectiles.push({
    mesh,
    velocity: direction.multiplyScalar(cfg.speed),
    damage: cfg.damage,
    burnDuration,
    owner: "player"
  });
};

const findNearestEnemyDirection = (ctx: GameContext, player: Transform): THREE.Vector3 | null => {
  let nearest: Transform | null = null;
  let nearestDistSq = Number.POSITIVE_INFINITY;

  for (const entity of ctx.world.query(["enemy", "transform", "health"])) {
    const enemyTransform = ctx.world.getComponent<Transform>(entity, "transform");
    const enemyHealth = ctx.world.getComponent<Health>(entity, "health");
    if (!enemyTransform || !enemyHealth || enemyHealth.current <= 0) {
      continue;
    }
    const dx = enemyTransform.x - player.x;
    const dz = enemyTransform.z - player.z;
    const distSq = dx * dx + dz * dz;
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      nearest = enemyTransform;
    }
  }

  if (!nearest) {
    return null;
  }
  return new THREE.Vector3(nearest.x - player.x, 0, nearest.z - player.z).normalize();
};
