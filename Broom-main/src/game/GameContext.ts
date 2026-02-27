import * as THREE from "three";
import { ECSWorld } from "../core/ecs";
import { InputController } from "../core/input";
import { Renderer3D } from "../core/render";
import type { EnemyType } from "../data/types";
import type { GameConfigBundle, GameRuntimeState, InputState } from "./state";

export interface EnemyRender {
  mesh: THREE.Object3D;
}

export interface Projectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  damage: number;
  burnDuration: number;
  owner: "player" | "enemy";
}

export interface GameInternals {
  dashTimer: number;
  swingIndex: number;
  keyEntity: number;
  keyMesh: THREE.Object3D | null;
  doorMesh: THREE.Object3D | null;
}

export interface GameContext {
  world: ECSWorld;
  renderer: Renderer3D;
  input: InputController;
  runtime: GameRuntimeState;
  config: GameConfigBundle;
  playerEntity: number;
  enemyTypesByName: Map<string, EnemyType>;
  enemyMeshes: Map<number, EnemyRender>;
  projectiles: Projectile[];
  frameInput: InputState;
  internals: GameInternals;
}
