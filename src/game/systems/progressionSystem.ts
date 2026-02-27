import type { GameContext } from "../GameContext";
import { loadLevel, spawnKey, spawnWave } from "../worldActions";

const LEVEL_LOADING_SECONDS = 1.5;

export const runLoadingSystem = (ctx: GameContext, delta: number): void => {
  if (!ctx.runtime.loading) {
    return;
  }
  ctx.runtime.loadingTimer -= delta;
  if (ctx.runtime.loadingTimer > 0) {
    return;
  }
  ctx.runtime.loading = false;
  loadLevel(ctx, ctx.runtime.levelIndex);
};

export const runProgressionSystem = (ctx: GameContext): void => {
  if (ctx.runtime.enemiesAlive > 0) {
    return;
  }

  const nextWave = ctx.runtime.waveIndex + 1;
  if (nextWave < ctx.runtime.currentLevel.waves.length) {
    ctx.runtime.waveIndex = nextWave;
    spawnWave(ctx, ctx.runtime.currentLevel, nextWave);
    return;
  }

  if (!ctx.runtime.playerHasKey) {
    spawnKey(ctx, ctx.runtime.currentLevel);
    return;
  }
};
