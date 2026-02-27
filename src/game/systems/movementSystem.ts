import type { Shield, Transform, Velocity } from "../components";
import type { GameContext } from "../GameContext";
import type { InputState } from "../state";
import { clampToWalkable, separateCircles } from "./collisionUtils";

const PLAYER_SPEED = 8;
const DASH_DURATION = 0.15;
const PLAYER_RADIUS = 0.8;
const ENEMY_RADIUS = 0.72;

export const runPlayerMovementSystem = (ctx: GameContext, input: InputState, delta: number): void => {
  const transform = ctx.world.getComponent<Transform>(ctx.playerEntity, "transform");
  const velocity = ctx.world.getComponent<Velocity>(ctx.playerEntity, "velocity");
  const shield = ctx.world.getComponent<Shield>(ctx.playerEntity, "shield");
  if (!transform || !velocity || !shield) {
    return;
  }

  transform.yaw -= input.mouseDeltaX * 0.0022;
  transform.pitch = Math.max(-1.2, Math.min(1.2, transform.pitch - input.mouseDeltaY * 0.0017));

  if (input.dash && ctx.runtime.levelIndex >= 3 && ctx.runtime.cooldowns.dash <= 0) {
    ctx.runtime.cooldowns.dash = ctx.config.abilities.level4.dashShield.cooldown;
    ctx.internals.dashTimer = DASH_DURATION;
  }

  const dashSpeed = ctx.config.abilities.level4.dashShield.distance / DASH_DURATION;
  const speed = ctx.internals.dashTimer > 0 ? dashSpeed : PLAYER_SPEED;
  updatePlayerMovement(transform, velocity, input, speed, delta);
  const clamped = clampToWalkable(transform.x, transform.z, PLAYER_RADIUS);
  transform.x = clamped.x;
  transform.z = clamped.z;

  for (const entity of ctx.world.query(["enemy", "transform"])) {
    const enemyTransform = ctx.world.getComponent<Transform>(entity, "transform");
    if (!enemyTransform) {
      continue;
    }
    separateCircles(transform, enemyTransform, PLAYER_RADIUS, ENEMY_RADIUS, 0.9, 0.1);
  }

  if (ctx.runtime.levelIndex >= 1) {
    const regen = ctx.config.abilities.level2.shield.regenRate;
    shield.durability = Math.min(shield.maxDurability, shield.durability + regen * delta);
    shield.active = input.shield && shield.durability / shield.maxDurability >= 0.25;
    if (shield.active) {
      shield.durability = Math.max(0, shield.durability - 8 * delta);
    }
  } else {
    shield.active = false;
  }

  ctx.runtime.shieldDurability = shield.durability;
  ctx.renderer.camera.position.set(transform.x, transform.y, transform.z);
  ctx.renderer.camera.rotation.set(transform.pitch, transform.yaw, 0, "YXZ");
};

export const updatePlayerMovement = (
  transform: Transform,
  velocity: Velocity,
  input: InputState,
  speed: number,
  delta: number
): void => {
  const cos = Math.cos(transform.yaw);
  const sin = Math.sin(transform.yaw);
  const mx = input.forward * sin + input.right * cos;
  const mz = input.forward * cos - input.right * sin;
  const len = Math.hypot(mx, mz) || 1;

  velocity.x = (mx / len) * speed;
  velocity.z = (mz / len) * speed;
  transform.x += velocity.x * delta;
  transform.z += velocity.z * delta;
};
