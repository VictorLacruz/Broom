export type Entity = number;

export class ECSWorld {
  private nextEntityId = 1;
  private components = new Map<string, Map<Entity, unknown>>();

  createEntity(): Entity {
    const entity = this.nextEntityId;
    this.nextEntityId += 1;
    return entity;
  }

  addComponent<T>(entity: Entity, key: string, value: T): void {
    if (!this.components.has(key)) {
      this.components.set(key, new Map<Entity, T>());
    }
    const bucket = this.components.get(key) as Map<Entity, T>;
    bucket.set(entity, value);
  }

  getComponent<T>(entity: Entity, key: string): T | undefined {
    const bucket = this.components.get(key) as Map<Entity, T> | undefined;
    return bucket?.get(entity);
  }

  removeEntity(entity: Entity): void {
    for (const bucket of this.components.values()) {
      bucket.delete(entity);
    }
  }

  query(required: string[]): Entity[] {
    if (required.length === 0) {
      return [];
    }
    const buckets = required
      .map((key) => this.components.get(key))
      .filter((bucket): bucket is Map<Entity, unknown> => Boolean(bucket));

    if (buckets.length !== required.length) {
      return [];
    }

    const base = buckets[0];
    const entities: Entity[] = [];
    for (const entity of base.keys()) {
      if (buckets.every((bucket) => bucket.has(entity))) {
        entities.push(entity);
      }
    }
    return entities;
  }
}

export interface SystemContext {
  delta: number;
  time: number;
}

export type ECSSystem = (world: ECSWorld, context: SystemContext) => void;
