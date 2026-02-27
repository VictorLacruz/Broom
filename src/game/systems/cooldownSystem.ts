import type { GameContext } from "../GameContext";

export const runCooldownSystem = (ctx: GameContext, delta: number): void => {
  ctx.runtime.cooldowns.projectile = Math.max(0, ctx.runtime.cooldowns.projectile - delta);
  ctx.runtime.cooldowns.dash = Math.max(0, ctx.runtime.cooldowns.dash - delta);
  ctx.internals.dashTimer = Math.max(0, ctx.internals.dashTimer - delta);
};

