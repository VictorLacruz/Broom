import type { EnemyType } from "../data/types";

export interface Transform {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
}

export interface Velocity {
  x: number;
  y: number;
  z: number;
}

export interface Health {
  current: number;
  max: number;
}

export interface PlayerTag {
  isPlayer: true;
}

export interface EnemyTag {
  type: EnemyType;
  burnTimer: number;
}

export interface Combat {
  damage: number;
  range: number;
  cooldown: number;
  timer: number;
}

export interface Shield {
  active: boolean;
  durability: number;
  maxDurability: number;
}

export interface KeyItem {
  roomId: string;
  picked: boolean;
}
