import { describe, expect, it } from "vitest";
import abilities from "../src/data/Abilities.json";
import enemies from "../src/data/EnemyTypes.json";
import levels from "../src/data/LevelConfig.json";
import { calculateWaveEnemyTotal } from "../src/game/systems/waveSystem";

describe("fixtures de datos", () => {
  it("incluye 4 niveles", () => {
    expect(levels.length).toBe(4);
  });

  it("incluye enemigos requeridos", () => {
    const types = enemies.map((e) => e.type).sort();
    expect(types).toEqual(["caballero", "campesino", "goblin", "mago"].sort());
  });

  it("define habilidades base", () => {
    expect(abilities.level1.mangualSwing.arcSequence.length).toBeGreaterThan(0);
    expect(abilities.level3.headProjectile.cooldown).toBe(5);
    expect(abilities.level4.dashShield.distance).toBe(10);
  });

  it("cumple regla de progresion de olas", () => {
    expect(calculateWaveEnemyTotal(1, 1)).toBe(10);
    expect(calculateWaveEnemyTotal(3, 2)).toBe(14);
    expect(calculateWaveEnemyTotal(4, 3)).toBe(17);
  });

  it("ubica llave por keyRoomId", () => {
    for (const level of levels) {
      const keyRoom = level.rooms.find((r) => r.id === level.keyRoomId);
      expect(keyRoom?.hasKey).toBe(true);
    }
  });
});
