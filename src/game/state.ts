import type { AbilitiesConfig, EnemyType, LevelConfig } from "../data/types";

export interface CooldownState {
  projectile: number;
  dash: number;
}

export interface InputState {
  forward: number;
  right: number;
  attack: boolean;
  shield: boolean;
  projectile: boolean;
  dash: boolean;
  interact: boolean;
  mouseDeltaX: number;
  mouseDeltaY: number;
}

export interface GameRuntimeState {
  levelIndex: number;
  currentLevel: LevelConfig;
  waveIndex: number;
  enemiesAlive: number;
  enemiesTotal: number;
  playerHasKey: boolean;
  loading: boolean;
  loadingTimer: number;
  playerHealth: number;
  playerMaxHealth: number;
  shieldDurability: number;
  shieldMaxDurability: number;
  cooldowns: CooldownState;
  gameOver: boolean;
  victory: boolean;
}

export interface GameConfigBundle {
  levels: LevelConfig[];
  enemies: EnemyType[];
  abilities: AbilitiesConfig;
}
