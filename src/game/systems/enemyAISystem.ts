import type { EnemyTag, Transform } from "../components";

export const updateEnemySteering = (
  enemy: EnemyTag,
  transform: Transform,
  player: Transform,
  delta: number
): void => {
  const dx = player.x - transform.x;
  const dz = player.z - transform.z;
  const dist = Math.hypot(dx, dz) || 0.001;
  const nx = dx / dist;
  const nz = dz / dist;

  let advance = 1;
  if (enemy.type.behavior === "ranged_keep_distance") {
    advance = dist > 8 ? 1 : dist < 6 ? -1 : 0;
  }
  if (enemy.type.behavior === "flank") {
    transform.x += -nz * enemy.type.speed * delta * 2;
    transform.z += nx * enemy.type.speed * delta * 2;
  }
  transform.x += nx * enemy.type.speed * advance * delta * 4;
  transform.z += nz * enemy.type.speed * advance * delta * 4;
};
