export type ArenaShape = "circle" | "oval" | "rectangle" | "square" | "H" | "L";

export interface RoomConfig {
  id: string;
  shape: ArenaShape;
  area: number;
  coords: [number, number];
  hasKey: boolean;
}

export interface WaveEnemyConfig {
  type: string;
  count: number;
}

export interface WaveConfig {
  waveIndex: number;
  enemies: WaveEnemyConfig[];
}

export interface SpawnRates {
  campesino: number;
  caballero: number;
  goblin: number;
  mago: number;
}

export interface LevelConfig {
  levelIndex: number;
  name: string;
  arenaShape: ArenaShape;
  rooms: RoomConfig[];
  keyRoomId: string;
  waves: WaveConfig[];
  spawnRates: SpawnRates;
}

export interface EnemyType {
  type: string;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  behavior: "melee_direct" | "flank" | "ranged_keep_distance";
}

export interface MangualSwingConfig {
  arcSequence: string[];
  hitboxRadius: number;
  pushOnHit: boolean;
}

export interface ShieldConfig {
  durabilityMax: number;
  regenRate: number;
  armorPacksAffect: boolean;
  requiresDurabilityAbove25: boolean;
}

export interface HeadProjectileConfig {
  cooldown: number;
  speed: number;
  damage: number;
}

export interface HeadBurnConfig {
  damagePerSecond: number;
  duration: number;
}

export interface DashShieldConfig {
  cooldown: number;
  distance: number;
}

export interface AbilitiesConfig {
  level1: {
    mangualSwing: MangualSwingConfig;
  };
  level2: {
    shield: ShieldConfig;
  };
  level3: {
    headProjectile: HeadProjectileConfig;
  };
  level4: {
    headBurn: HeadBurnConfig;
    dashShield: DashShieldConfig;
  };
}
