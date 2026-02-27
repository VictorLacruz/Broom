import { ECSWorld } from "../core/ecs";
import { InputController } from "../core/input";
import { Renderer3D } from "../core/render";
import { HUD } from "../ui/hud";
import type { GameContext } from "./GameContext";
import type { GameConfigBundle } from "./state";
import { runPlayerCombatSystem } from "./systems/combatSystem";
import { runCooldownSystem } from "./systems/cooldownSystem";
import { runEnemyAISystem } from "./systems/enemyAISystem";
import { runHealthSystem } from "./systems/healthSystem";
import { runKeyInteractionSystem } from "./systems/keyInteractionSystem";
import { runPlayerMovementSystem } from "./systems/movementSystem";
import { runProgressionSystem, runLoadingSystem } from "./systems/progressionSystem";
import { runProjectileSystem } from "./systems/projectileSystem";
import { runVisualSyncSystem } from "./systems/visualSyncSystem";
import { indexEnemyTypes, loadLevel, setupPlayerEntity } from "./worldActions";

export class BroomGame {
  private readonly renderer: Renderer3D;
  private readonly hud: HUD;
  private readonly context: GameContext;
  private lastTime = performance.now();

  constructor(mount: HTMLElement, config: GameConfigBundle) {
    this.renderer = new Renderer3D(mount);
    const input = new InputController(this.renderer.canvas);
    this.hud = new HUD(document.body);

    this.context = {
      world: new ECSWorld(),
      renderer: this.renderer,
      input,
      config,
      playerEntity: 0,
      enemyTypesByName: new Map(),
      enemyMeshes: new Map(),
      projectiles: [],
      frameInput: {
        forward: 0,
        right: 0,
        attack: false,
        shield: false,
        projectile: false,
        dash: false,
        interact: false,
        mouseDeltaX: 0,
        mouseDeltaY: 0
      },
      internals: {
        dashTimer: 0,
        swingIndex: 0,
        keyEntity: 0,
        keyMesh: null,
        doorMesh: null
      },
      runtime: {
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
      }
    };

    indexEnemyTypes(this.context);
    setupPlayerEntity(this.context);
    loadLevel(this.context, 0);
    this.loop();
  }

  private loop = (): void => {
    const now = performance.now();
    const delta = Math.min(0.05, (now - this.lastTime) / 1000);
    const time = now / 1000;
    this.lastTime = now;

    if (!this.context.runtime.gameOver && !this.context.runtime.victory) {
      this.context.frameInput = this.context.input.consumeState();
      this.runSystems(delta, time);
    }

    this.hud.update(this.context.runtime);
    this.renderer.render();
    requestAnimationFrame(this.loop);
  };

  private runSystems(delta: number, time: number): void {
    if (this.context.runtime.loading) {
      runLoadingSystem(this.context, delta);
      runVisualSyncSystem(this.context, time);
      return;
    }

    runCooldownSystem(this.context, delta);
    runPlayerMovementSystem(this.context, this.context.frameInput, delta);
    runPlayerCombatSystem(this.context, delta);
    runEnemyAISystem(this.context, delta);
    runProjectileSystem(this.context, delta);
    runKeyInteractionSystem(this.context);
    runProgressionSystem(this.context);
    runHealthSystem(this.context);
    runVisualSyncSystem(this.context, time);
  }
}
