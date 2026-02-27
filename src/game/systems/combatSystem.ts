import type { Transform } from "../components";

export const isInsideMeleeArc = (
  attacker: Transform,
  target: Transform,
  range: number,
  yawOffset: number
): boolean => {
  const dx = target.x - attacker.x;
  const dz = target.z - attacker.z;
  const dist = Math.hypot(dx, dz);
  if (dist > range) {
    return false;
  }
  const dir = Math.atan2(dx, dz);
  const delta = Math.abs(normalizeAngle(dir - (attacker.yaw + yawOffset)));
  return delta <= Math.PI / 3;
};

const normalizeAngle = (rad: number): number => {
  let value = rad;
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
};
