import * as THREE from "three";
import projectileTextureUrl from "../../assets/textures/terrain/projectile_water.png";
import type { Combat, Health, Transform } from "../components";
import type { GameContext } from "../GameContext";
import { killEnemy } from "../worldActions";

const projectileTexture = new THREE.TextureLoader().load(projectileTextureUrl);
projectileTexture.colorSpace = THREE.SRGBColorSpace;
projectileTexture.wrapS = THREE.RepeatWrapping;
projectileTexture.wrapT = THREE.RepeatWrapping;
projectileTexture.repeat.set(1.5, 1.5);

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

  const geo = new THREE.SphereGeometry(0.2, 8, 8);
  const mat = new THREE.MeshStandardMaterial({
    map: projectileTexture,
    color: "#ffffff",
    emissive: "#29b6f6",
    emissiveIntensity: 0.15,
    roughness: 0.45,
    metalness: 0.1
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(player.x, player.y, player.z);
  ctx.renderer.scene.add(mesh);

  const direction = new THREE.Vector3(Math.sin(player.yaw), 0, Math.cos(player.yaw)).normalize();
  ctx.projectiles.push({
    mesh,
    velocity: direction.multiplyScalar(cfg.speed),
    damage: cfg.damage,
    burnDuration
  });
};
