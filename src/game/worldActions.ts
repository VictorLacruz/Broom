import type { Entity } from "../core/ecs";
import type { EnemyType, LevelConfig } from "../data/types";
import type { Combat, EnemyTag, Health, KeyItem, PlayerTag, Shield, Transform, Velocity } from "./components";
import type { GameContext } from "./GameContext";
import { generateLevelRooms } from "./systems/mapSystem";
import { calculateWaveEnemyTotal } from "./systems/waveSystem";

const ENEMY_RADIUS_BASE = 7;

export const setupPlayerEntity = (ctx: GameContext): Entity => {
  const entity = ctx.world.createEntity();
  ctx.world.addComponent<Transform>(entity, "transform", { x: -72, y: 1.8, z: 0, yaw: 0, pitch: 0 });
  ctx.world.addComponent<Velocity>(entity, "velocity", { x: 0, y: 0, z: 0 });
  ctx.world.addComponent<Health>(entity, "health", { current: 300, max: 300 });
  ctx.world.addComponent<PlayerTag>(entity, "player", { isPlayer: true });
  ctx.world.addComponent<Combat>(entity, "combat", { damage: 60, range: 2.5, cooldown: 0.42, timer: 0 });
  ctx.world.addComponent<Shield>(entity, "shield", {
    active: false,
    durability: ctx.runtime.shieldDurability,
    maxDurability: ctx.runtime.shieldMaxDurability
  });
  ctx.playerEntity = entity;
  return entity;
};

export const indexEnemyTypes = (ctx: GameContext): void => {
  ctx.enemyTypesByName.clear();
  for (const type of ctx.config.enemies) {
    ctx.enemyTypesByName.set(type.type, type);
  }
};

export const clearEnemies = (ctx: GameContext): void => {
  for (const render of ctx.enemyMeshes.values()) {
    ctx.renderer.removeObject(render.mesh);
  }
  ctx.enemyMeshes.clear();

  for (const entity of ctx.world.query(["enemy"])) {
    ctx.world.removeEntity(entity);
  }
  ctx.runtime.enemiesAlive = 0;
  ctx.runtime.enemiesTotal = 0;
};

export const clearProjectiles = (ctx: GameContext): void => {
  for (const projectile of ctx.projectiles) {
    ctx.renderer.scene.remove(projectile.mesh);
  }
  ctx.projectiles.splice(0, ctx.projectiles.length);
};

export const killEnemy = (ctx: GameContext, entity: Entity): void => {
  const render = ctx.enemyMeshes.get(entity);
  if (!render) {
    return;
  }
  ctx.renderer.removeObject(render.mesh);
  ctx.enemyMeshes.delete(entity);
  ctx.world.removeEntity(entity);
  ctx.runtime.enemiesAlive = Math.max(0, ctx.runtime.enemiesAlive - 1);
};

export const loadLevel = (ctx: GameContext, levelIndex: number): void => {
  clearEnemies(ctx);
  clearProjectiles(ctx);

  if (ctx.internals.keyEntity) {
    ctx.world.removeEntity(ctx.internals.keyEntity);
    ctx.internals.keyEntity = 0;
  }
  if (ctx.internals.keyMesh) {
    ctx.renderer.removeObject(ctx.internals.keyMesh);
    ctx.internals.keyMesh = null;
  }
  if (ctx.internals.doorMesh) {
    ctx.renderer.removeObject(ctx.internals.doorMesh);
    ctx.internals.doorMesh = null;
  }

  const rawLevel = ctx.config.levels[levelIndex];
  const level: LevelConfig = {
    ...rawLevel,
    rooms: generateLevelRooms(rawLevel)
  };

  ctx.runtime.levelIndex = levelIndex;
  ctx.runtime.currentLevel = level;
  ctx.runtime.waveIndex = 0;
  ctx.runtime.playerHasKey = false;
  const player = ctx.world.getComponent<Transform>(ctx.playerEntity, "transform");
  if (player) {
    player.x = -72;
    player.z = 0;
  }

  spawnDoor(ctx);
  spawnWave(ctx, level, 0);
};

export const spawnWave = (ctx: GameContext, level: LevelConfig, waveIdx: number): void => {
  const formulaTotal = calculateWaveEnemyTotal(level.levelIndex, waveIdx + 1);
  const explicitTotal = level.waves[waveIdx]?.enemies.reduce((sum, e) => sum + e.count, 0) ?? formulaTotal;
  const total = Math.max(formulaTotal, explicitTotal);

  for (let i = 0; i < total; i += 1) {
    const enemyType = chooseEnemyBySpawnRate(ctx, level);
    spawnEnemy(ctx, enemyType, i, total);
  }

  ctx.runtime.enemiesTotal = total;
  ctx.runtime.enemiesAlive = total;
};

export const spawnKey = (ctx: GameContext, level: LevelConfig): void => {
  if (ctx.internals.keyMesh) {
    return;
  }
  const fallbackIdx = Math.floor(level.rooms.length / 2);
  const room = level.rooms.find((entry) => entry.id === level.keyRoomId) ?? level.rooms[fallbackIdx];
  const keyEntity = ctx.world.createEntity();

  ctx.world.addComponent<Transform>(keyEntity, "transform", {
    x: room.coords[0],
    y: 1.2,
    z: room.coords[1],
    yaw: 0,
    pitch: 0
  });
  ctx.world.addComponent<KeyItem>(keyEntity, "key", { roomId: room.id, picked: false });

  ctx.internals.keyEntity = keyEntity;
  ctx.internals.keyMesh = ctx.renderer.spawnKey();
  ctx.internals.keyMesh.position.set(room.coords[0], 1.2, room.coords[1]);
};

const spawnDoor = (ctx: GameContext): void => {
  ctx.internals.doorMesh = ctx.renderer.spawnDoor();
  ctx.internals.doorMesh.position.set(95.2, 0.18, 0);
};

const chooseEnemyBySpawnRate = (ctx: GameContext, level: LevelConfig): EnemyType => {
  const roll = Math.random();
  let acc = 0;
  const ordered = [
    ["campesino", level.spawnRates.campesino],
    ["caballero", level.spawnRates.caballero],
    ["goblin", level.spawnRates.goblin],
    ["mago", level.spawnRates.mago]
  ] as const;

  for (const [name, weight] of ordered) {
    acc += weight;
    if (roll <= acc) {
      return ctx.enemyTypesByName.get(name) ?? ctx.config.enemies[0];
    }
  }
  return ctx.config.enemies[0];
};

const spawnEnemy = (ctx: GameContext, type: EnemyType, idx: number, total: number): void => {
  const entity = ctx.world.createEntity();
  const angle = (idx / Math.max(total, 1)) * Math.PI * 2;
  const radius = ENEMY_RADIUS_BASE + (idx % 5) * 1.8;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = type.type === "campesino" ? 0.72 : 1;

  ctx.world.addComponent<Transform>(entity, "transform", { x, y, z, yaw: 0, pitch: 0 });
  ctx.world.addComponent<Velocity>(entity, "velocity", { x: 0, y: 0, z: 0 });
  ctx.world.addComponent<Health>(entity, "health", { current: type.hp, max: type.maxHp });
  ctx.world.addComponent<EnemyTag>(entity, "enemy", { type, burnTimer: 0 });
  ctx.world.addComponent<Combat>(entity, "combat", { damage: type.damage, range: 1.8, cooldown: 1.2, timer: 0 });

  const color =
    type.type === "campesino" ? "#7cb342" : type.type === "caballero" ? "#9e9e9e" : type.type === "goblin" ? "#00acc1" : "#ab47bc";
  const mesh = ctx.renderer.spawnEnemy(type.type, color);
  mesh.position.set(x, y, z);
  ctx.enemyMeshes.set(entity, { mesh });
};
