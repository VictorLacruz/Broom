import type { Transform } from "../components";

type Rect = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

const WALKABLE_RECTS: Rect[] = [
  { minX: -98, maxX: -46, minZ: -26, maxZ: 26 },
  { minX: -26, maxX: 26, minZ: -26, maxZ: 26 },
  { minX: 46, maxX: 98, minZ: -26, maxZ: 26 },
  { minX: -46, maxX: -26, minZ: -8.5, maxZ: 8.5 },
  { minX: 26, maxX: 46, minZ: -8.5, maxZ: 8.5 }
];

const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

const isInsideRect = (x: number, z: number, r: Rect): boolean =>
  x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ;

export const clampToWalkable = (x: number, z: number, radius: number): { x: number; z: number } => {
  const insetRects = WALKABLE_RECTS.map((r) => ({
    minX: r.minX + radius,
    maxX: r.maxX - radius,
    minZ: r.minZ + radius,
    maxZ: r.maxZ - radius
  }));

  for (const r of insetRects) {
    if (isInsideRect(x, z, r)) {
      return { x, z };
    }
  }

  let best = { x, z };
  let bestDist = Number.POSITIVE_INFINITY;
  for (const r of insetRects) {
    const cx = clamp(x, r.minX, r.maxX);
    const cz = clamp(z, r.minZ, r.maxZ);
    const d = Math.hypot(cx - x, cz - z);
    if (d < bestDist) {
      bestDist = d;
      best = { x: cx, z: cz };
    }
  }
  return best;
};

export const separateCircles = (
  a: Transform,
  b: Transform,
  radiusA: number,
  radiusB: number,
  ratioA = 0.5,
  ratioB = 0.5
): void => {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const dist = Math.hypot(dx, dz) || 0.0001;
  const minDist = radiusA + radiusB;
  if (dist >= minDist) {
    return;
  }
  const overlap = minDist - dist;
  const nx = dx / dist;
  const nz = dz / dist;
  a.x -= nx * overlap * ratioA;
  a.z -= nz * overlap * ratioA;
  b.x += nx * overlap * ratioB;
  b.z += nz * overlap * ratioB;
};

