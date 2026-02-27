import abilitiesUrl from "../data/Abilities.json?url";
import enemyTypesUrl from "../data/EnemyTypes.json?url";
import levelConfigsUrl from "../data/LevelConfig.json?url";
import type { AbilitiesConfig, EnemyType, LevelConfig } from "../data/types";

export interface GameData {
  levels: LevelConfig[];
  enemies: EnemyType[];
  abilities: AbilitiesConfig;
}

const readJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${url}: ${response.status}`);
  }
  return (await response.json()) as T;
};

export const loadGameData = async (): Promise<GameData> => {
  const [levels, enemies, abilities] = await Promise.all([
    readJson<LevelConfig[]>(levelConfigsUrl),
    readJson<EnemyType[]>(enemyTypesUrl),
    readJson<AbilitiesConfig>(abilitiesUrl)
  ]);

  return { levels, enemies, abilities };
};
