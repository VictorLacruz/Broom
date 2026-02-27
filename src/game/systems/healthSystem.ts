import type { Health } from "../components";
import type { GameContext } from "../GameContext";

export const runHealthSystem = (ctx: GameContext): void => {
  const health = ctx.world.getComponent<Health>(ctx.playerEntity, "health");
  if (!health) {
    return;
  }

  ctx.runtime.playerHealth = health.current;
  if (health.current <= 0) {
    ctx.runtime.gameOver = true;
  }
};

