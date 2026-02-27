import * as THREE from "three";
import { ECSWorld } from "../core/ecs";
import { InputController } from "../core/input";
import { Renderer3D } from "../core/render";
import type { EnemyType, LevelConfig } from "../data/types";
import { HUD } from "../ui/hud";
import type { Combat, EnemyTag, Health, KeyItem, PlayerTag, Shield, Transform, Velocity } from "./components";
import type { GameConfigBundle, GameRuntimeState, InputState } from "./state";
import { calculateWaveEnemyTotal } from "./waveRules";

interface EnemyRender {
  mesh: THREE.Mesh;
}

interface Projectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  damage: number;
  burnDuration: number;
}

const PLAYER_SPEED = 8;
const DASH_DURATION = 0.15;

export class BroomGame {
  private readonly world = new ECSWorld();
  private readonly renderer: Renderer3D;
  private readonly input: InputController;
  private readonly hud: HUD;

  private readonly enemyTypesByName = new Map<string, EnemyType>();
  private readonly enemyMeshes = new Map<number, EnemyRender>();
  private readonly projectiles: Projectile[] = [];

  private playerEntity = 0;
  private keyEntity = 0;
  private keyMesh: THREE.Mesh | null = null;

  private runtime: GameRuntimeState;
  private config: GameConfigBundle;
  private lastTime = performance.now();
  private dashTimer = 0;
  private swingIndex = 0;

  constructor(mount: HTMLElement, config: GameConfigBundle) {
    this.config = config;
    this.renderer = new Renderer3D(mount);
    this.input = new InputController(this.renderer.canvas);
    this.hud = new HUD(document.body);

    for (const type of config.enemies) {
      this.enemyTypesByName.set(type.type, type);
    }

    this.runtime = {
      levelIndex: 0,
      currentLevel: config.levels[0],
      waveIndex: 0,
      enemiesAlive: 0,
      enemiesTotal: 0,
      playerHasKey: false,
      loading: false,
      loadingTimer: 0,
      playerHealth: 300,
      playerMaxHealth: 300,
      shieldDurability: config.abilities.level2.shield.durabilityMax,
      shieldMaxDurability: config.abilities.level2.shield.durabilityMax,
      cooldowns: { projectile: 0, dash: 0 },
      gameOver: false,
      victory: false
    };

    this.setupPlayer();
    this.loadLevel(0);
    this.loop();
  }

  private setupPlayer(): void {
    const entity = this.world.createEntity();
    this.playerEntity = entity;

    this.world.addComponent<Transform>(entity, "transform", { x: 0, y: 1.8, z: 0, yaw: 0, pitch: 0 });
    this.world.addComponent<Velocity>(entity, "velocity", { x: 0, y: 0, z: 0 });
    this.world.addComponent<Health>(entity, "health", { current: 300, max: 300 });
    this.world.addComponent<PlayerTag>(entity, "player", { isPlayer: true });
    this.world.addComponent<Combat>(entity, "combat", { damage: 60, range: 2.5, cooldown: 0.42, timer: 0 });
    this.world.addComponent<Shield>(entity, "shield", {
      active: false,
      durability: this.runtime.shieldDurability,
      maxDurability: this.runtime.shieldMaxDurability
    });
  }

  private cloneLevelWithVariation(level: LevelConfig): LevelConfig {
    if (level.levelIndex === 1) {
      return level;
    }
    const rooms = level.rooms.map((room, idx) => ({
      ...room,
      coords: [room.coords[0] + (Math.random() * 16 - 8), room.coords[1] + (Math.random() * 16 - 8)] as [number, number],
      area: Math.round(room.area * (1 + idx * 0.03))
    }));
    return { ...level, rooms };
  }

  private loadLevel(index: number): void {
    this.clearEnemies();
    this.clearProjectiles();
    if (this.keyMesh) {
      this.renderer.removeObject(this.keyMesh);
      this.keyMesh = null;
    }

    const raw = this.config.levels[index];
    const level = this.cloneLevelWithVariation(raw);

    this.runtime.levelIndex = index;
    this.runtime.currentLevel = level;
    this.runtime.waveIndex = 0;
    this.runtime.playerHasKey = false;

    this.spawnKey(level);
    this.spawnWave(level, 0);
  }

  private spawnKey(level: LevelConfig): void {
    const room = level.rooms.find((r) => r.id === level.keyRoomId) ?? level.rooms[Math.floor(level.rooms.length / 2)];
    const entity = this.world.createEntity();
    this.keyEntity = entity;

    this.world.addComponent<Transform>(entity, "transform", { x: room.coords[0], y: 1.2, z: room.coords[1], yaw: 0, pitch: 0 });
    this.world.addComponent<KeyItem>(entity, "key", { roomId: room.id, picked: false });

    this.keyMesh = this.renderer.spawnKey();
    this.keyMesh.position.set(room.coords[0], 1.2, room.coords[1]);
  }

  private chooseEnemyBySpawnRate(level: LevelConfig): EnemyType {
    const r = Math.random();
    const rates = level.spawnRates;
    let acc = 0;
    const ordered = [
      ["campesino", rates.campesino],
      ["caballero", rates.caballero],
      ["goblin", rates.goblin],
      ["mago", rates.mago]
    ] as const;

    for (const [name, weight] of ordered) {
      acc += weight;
      if (r <= acc) {
        return this.enemyTypesByName.get(name) ?? this.config.enemies[0];
      }
    }
    return this.config.enemies[0];
  }

  private spawnWave(level: LevelConfig, waveIdx: number): void {
    const fromFormula = calculateWaveEnemyTotal(level.levelIndex, waveIdx + 1);
    const explicit = level.waves[waveIdx]?.enemies.reduce((sum, e) => sum + e.count, 0) ?? fromFormula;
    const total = Math.max(fromFormula, explicit);

    for (let i = 0; i < total; i += 1) {
      this.spawnEnemy(this.chooseEnemyBySpawnRate(level), i, total);
    }

    this.runtime.enemiesTotal = total;
    this.runtime.enemiesAlive = total;
  }

  private spawnEnemy(type: EnemyType, idx: number, total: number): void {
    const entity = this.world.createEntity();
    const angle = (idx / Math.max(total, 1)) * Math.PI * 2;
    const radius = 10 + (idx % 6) * 2;

    this.world.addComponent<Transform>(entity, "transform", { x: Math.cos(angle) * radius, y: 1, z: Math.sin(angle) * radius, yaw: 0, pitch: 0 });
    this.world.addComponent<Velocity>(entity, "velocity", { x: 0, y: 0, z: 0 });
    this.world.addComponent<Health>(entity, "health", { current: type.hp, max: type.maxHp });
    this.world.addComponent<EnemyTag>(entity, "enemy", { type, burnTimer: 0 });
    this.world.addComponent<Combat>(entity, "combat", { damage: type.damage, range: 1.8, cooldown: 1.2, timer: 0 });

    const color = type.type === "campesino" ? "#7cb342" : type.type === "caballero" ? "#9e9e9e" : type.type === "goblin" ? "#00acc1" : "#ab47bc";
    const mesh = this.renderer.spawnEnemy(color);
    mesh.position.set(Math.cos(angle) * radius, 1, Math.sin(angle) * radius);
    this.enemyMeshes.set(entity, { mesh });
  }

  private loop = (): void => {
    const now = performance.now();
    const delta = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (!this.runtime.gameOver && !this.runtime.victory) {
      this.update(delta, now / 1000);
    }

    this.hud.update(this.runtime);
    this.renderer.render();
    requestAnimationFrame(this.loop);
  };

  private update(delta: number, time: number): void {
    const input = this.input.consumeState();
    if (this.runtime.loading) {
      this.runtime.loadingTimer -= delta;
      if (this.runtime.loadingTimer <= 0) {
        this.runtime.loading = false;
        this.loadLevel(this.runtime.levelIndex);
      }
      return;
    }

    this.runtime.cooldowns.projectile = Math.max(0, this.runtime.cooldowns.projectile - delta);
    this.runtime.cooldowns.dash = Math.max(0, this.runtime.cooldowns.dash - delta);
    this.dashTimer = Math.max(0, this.dashTimer - delta);

    this.updatePlayer(input, delta);
    this.handleCombat(input, delta);
    this.updateEnemies(delta);
    this.updateProjectiles(delta);
    this.syncVisuals(time);
    this.checkKey(input);
    this.checkWaveProgress();

    const hp = this.world.getComponent<Health>(this.playerEntity, "health");
    if (hp) {
      this.runtime.playerHealth = hp.current;
      if (hp.current <= 0) {
        this.runtime.gameOver = true;
      }
    }
  }

  private updatePlayer(input: InputState, delta: number): void {
    const transform = this.world.getComponent<Transform>(this.playerEntity, "transform");
    const velocity = this.world.getComponent<Velocity>(this.playerEntity, "velocity");
    const shield = this.world.getComponent<Shield>(this.playerEntity, "shield");
    if (!transform || !velocity || !shield) {
      return;
    }

    transform.yaw -= input.mouseDeltaX * 0.0022;
    transform.pitch = Math.max(-1.2, Math.min(1.2, transform.pitch - input.mouseDeltaY * 0.0017));

    const cos = Math.cos(transform.yaw);
    const sin = Math.sin(transform.yaw);
    const mx = input.forward * sin + input.right * cos;
    const mz = input.forward * cos - input.right * sin;
    const ml = Math.hypot(mx, mz) || 1;

    if (input.dash && this.runtime.levelIndex >= 3 && this.runtime.cooldowns.dash <= 0) {
      this.runtime.cooldowns.dash = this.config.abilities.level4.dashShield.cooldown;
      this.dashTimer = DASH_DURATION;
    }

    const isDashing = this.dashTimer > 0;
    const speed = isDashing ? this.config.abilities.level4.dashShield.distance / DASH_DURATION : PLAYER_SPEED;

    velocity.x = (mx / ml) * speed;
    velocity.z = (mz / ml) * speed;

    transform.x += velocity.x * delta;
    transform.z += velocity.z * delta;
    transform.x = Math.max(-145, Math.min(145, transform.x));
    transform.z = Math.max(-145, Math.min(145, transform.z));

    if (this.runtime.levelIndex >= 1) {
      const regen = this.config.abilities.level2.shield.regenRate;
      shield.durability = Math.min(shield.maxDurability, shield.durability + regen * delta);
      shield.active = input.shield && shield.durability / shield.maxDurability >= 0.25;
      if (shield.active) {
        shield.durability = Math.max(0, shield.durability - 8 * delta);
      }
    } else {
      shield.active = false;
    }

    this.runtime.shieldDurability = shield.durability;
    this.renderer.camera.position.set(transform.x, transform.y, transform.z);
    this.renderer.camera.rotation.set(transform.pitch, transform.yaw, 0, "YXZ");
  }

  private handleCombat(input: InputState, delta: number): void {
    const combat = this.world.getComponent<Combat>(this.playerEntity, "combat");
    const player = this.world.getComponent<Transform>(this.playerEntity, "transform");
    if (!combat || !player) {
      return;
    }

    combat.timer = Math.max(0, combat.timer - delta);

    if (input.attack && combat.timer <= 0) {
      const swing = this.config.abilities.level1.mangualSwing;
      const arc = swing.arcSequence[this.swingIndex % swing.arcSequence.length] ?? "center";
      this.swingIndex += 1;
      this.meleeHit(player, combat.damage, swing.hitboxRadius + combat.range, arc, swing.pushOnHit);
      combat.timer = combat.cooldown;
    }

    const projectileCfg = this.config.abilities.level3.headProjectile;
    if (this.runtime.levelIndex >= 2 && input.projectile && this.runtime.cooldowns.projectile <= 0) {
      this.fireProjectile(player);
      this.runtime.cooldowns.projectile = projectileCfg.cooldown;
    }
  }

  private meleeHit(player: Transform, damage: number, range: number, arc: string, push: boolean): void {
    const offset = arc === "right45" ? Math.PI / 4 : arc === "left45" ? -Math.PI / 4 : 0;
    const enemies = this.world.query(["enemy", "transform", "health"]);
    for (const entity of enemies) {
      const t = this.world.getComponent<Transform>(entity, "transform");
      const h = this.world.getComponent<Health>(entity, "health");
      if (!t || !h) {
        continue;
      }
      const dx = t.x - player.x;
      const dz = t.z - player.z;
      const dist = Math.hypot(dx, dz);
      if (dist > range) {
        continue;
      }
      const dir = Math.atan2(dx, dz);
      const delta = Math.abs(this.normalizeAngle(dir - (player.yaw + offset)));
      if (delta > Math.PI / 3) {
        continue;
      }
      h.current -= damage;
      if (push) {
        t.x += (dx / (dist || 1)) * 2;
        t.z += (dz / (dist || 1)) * 2;
      }
      if (h.current <= 0) {
        this.killEnemy(entity);
      }
    }
  }

  private fireProjectile(player: Transform): void {
    const cfg = this.config.abilities.level3.headProjectile;
    const geo = new THREE.SphereGeometry(0.2, 8, 8);
    const mat = new THREE.MeshStandardMaterial({ color: "#ffc107" });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(player.x, player.y, player.z);
    this.renderer.scene.add(mesh);

    const dir = new THREE.Vector3(Math.sin(player.yaw), 0, Math.cos(player.yaw)).normalize();
    this.projectiles.push({
      mesh,
      velocity: dir.multiplyScalar(cfg.speed),
      damage: cfg.damage,
      burnDuration: this.runtime.levelIndex >= 3 ? this.config.abilities.level4.headBurn.duration : 0
    });
  }

  private updateEnemies(delta: number): void {
    const playerT = this.world.getComponent<Transform>(this.playerEntity, "transform");
    const playerH = this.world.getComponent<Health>(this.playerEntity, "health");
    const shield = this.world.getComponent<Shield>(this.playerEntity, "shield");
    if (!playerT || !playerH || !shield) {
      return;
    }

    const enemies = this.world.query(["enemy", "transform", "health", "combat"]);
    for (const entity of enemies) {
      const e = this.world.getComponent<EnemyTag>(entity, "enemy");
      const t = this.world.getComponent<Transform>(entity, "transform");
      const h = this.world.getComponent<Health>(entity, "health");
      const c = this.world.getComponent<Combat>(entity, "combat");
      if (!e || !t || !h || !c) {
        continue;
      }

      c.timer = Math.max(0, c.timer - delta);
      if (e.burnTimer > 0) {
        e.burnTimer -= delta;
        h.current -= h.max * this.config.abilities.level4.headBurn.damagePerSecond * delta;
        if (h.current <= 0) {
          this.killEnemy(entity);
          continue;
        }
      }

      const dx = playerT.x - t.x;
      const dz = playerT.z - t.z;
      const dist = Math.hypot(dx, dz) || 0.001;
      const nx = dx / dist;
      const nz = dz / dist;

      let advance = 1;
      if (e.type.behavior === "ranged_keep_distance") {
        advance = dist > 8 ? 1 : dist < 6 ? -1 : 0;
      }
      if (e.type.behavior === "flank") {
        t.x += -nz * e.type.speed * delta * 2;
        t.z += nx * e.type.speed * delta * 2;
      }
      t.x += nx * e.type.speed * advance * delta * 4;
      t.z += nz * e.type.speed * advance * delta * 4;

      if (dist <= c.range && c.timer <= 0) {
        if (shield.active) {
          shield.durability = Math.max(0, shield.durability - e.type.damage * 0.45);
        } else {
          playerH.current -= e.type.damage * 0.35;
        }
        c.timer = c.cooldown;
      }
    }
    this.runtime.shieldDurability = shield.durability;
  }

  private updateProjectiles(delta: number): void {
    const remove: number[] = [];
    for (let i = 0; i < this.projectiles.length; i += 1) {
      const p = this.projectiles[i];
      p.mesh.position.addScaledVector(p.velocity, delta);
      if (p.mesh.position.length() > 200) {
        remove.push(i);
        continue;
      }
      const enemies = this.world.query(["enemy", "transform", "health"]);
      for (const entity of enemies) {
        const t = this.world.getComponent<Transform>(entity, "transform");
        const h = this.world.getComponent<Health>(entity, "health");
        const e = this.world.getComponent<EnemyTag>(entity, "enemy");
        if (!t || !h || !e) {
          continue;
        }
        if (Math.hypot(t.x - p.mesh.position.x, t.z - p.mesh.position.z) < 1.1) {
          h.current -= p.damage;
          if (p.burnDuration > 0) {
            e.burnTimer = p.burnDuration;
          }
          if (h.current <= 0) {
            this.killEnemy(entity);
          }
          remove.push(i);
          break;
        }
      }
    }
    remove.sort((a, b) => b - a);
    for (const idx of remove) {
      const p = this.projectiles[idx];
      this.renderer.scene.remove(p.mesh);
      this.projectiles.splice(idx, 1);
    }
  }

  private checkKey(input: InputState): void {
    if (this.runtime.playerHasKey || !input.interact) {
      return;
    }
    const p = this.world.getComponent<Transform>(this.playerEntity, "transform");
    const k = this.world.getComponent<Transform>(this.keyEntity, "transform");
    const item = this.world.getComponent<KeyItem>(this.keyEntity, "key");
    if (!p || !k || !item || item.picked) {
      return;
    }
    if (Math.hypot(p.x - k.x, p.z - k.z) <= 3) {
      item.picked = true;
      this.runtime.playerHasKey = true;
      if (this.keyMesh) {
        this.renderer.removeObject(this.keyMesh);
      }
    }
  }

  private checkWaveProgress(): void {
    if (this.runtime.enemiesAlive > 0) {
      return;
    }
    const nextWave = this.runtime.waveIndex + 1;
    if (nextWave < this.runtime.currentLevel.waves.length) {
      this.runtime.waveIndex = nextWave;
      this.spawnWave(this.runtime.currentLevel, nextWave);
      return;
    }
    if (!this.runtime.playerHasKey) {
      return;
    }
    const nextLevel = this.runtime.levelIndex + 1;
    if (nextLevel >= this.config.levels.length) {
      this.runtime.victory = true;
      return;
    }
    this.runtime.loading = true;
    this.runtime.loadingTimer = 1.5;
    this.runtime.levelIndex = nextLevel;
  }

  private killEnemy(entity: number): void {
    const render = this.enemyMeshes.get(entity);
    if (!render) {
      return;
    }
    this.renderer.removeObject(render.mesh);
    this.enemyMeshes.delete(entity);
    this.world.removeEntity(entity);
    this.runtime.enemiesAlive = Math.max(0, this.runtime.enemiesAlive - 1);
  }

  private syncVisuals(time: number): void {
    const enemies = this.world.query(["enemy", "transform"]);
    for (const entity of enemies) {
      const t = this.world.getComponent<Transform>(entity, "transform");
      const mesh = this.enemyMeshes.get(entity);
      if (!t || !mesh) {
        continue;
      }
      mesh.mesh.position.set(t.x, t.y, t.z);
    }
    if (this.keyMesh && !this.runtime.playerHasKey) {
      this.keyMesh.rotation.y += 0.02;
      this.keyMesh.position.y = 1.2 + Math.sin(time * 2) * 0.2;
    }
  }

  private normalizeAngle(rad: number): number {
    let value = rad;
    while (value > Math.PI) value -= Math.PI * 2;
    while (value < -Math.PI) value += Math.PI * 2;
    return value;
  }

  private clearEnemies(): void {
    for (const entry of this.enemyMeshes.values()) {
      this.renderer.removeObject(entry.mesh);
    }
    this.enemyMeshes.clear();
    for (const entity of this.world.query(["enemy"])) {
      this.world.removeEntity(entity);
    }
  }

  private clearProjectiles(): void {
    for (const p of this.projectiles) {
      this.renderer.scene.remove(p.mesh);
    }
    this.projectiles.splice(0, this.projectiles.length);
  }
}
