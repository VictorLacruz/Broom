export const calculateWaveEnemyTotal = (levelIndex: number, waveNumber: number): number => {
  const base = 10;
  const perWave = 2;
  const perLevel = 1;
  return base + perWave * Math.max(0, waveNumber - 1) + perLevel * (levelIndex - 1);
};
