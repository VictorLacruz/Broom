import type { Transform } from "../components";
import { getDoorCollider, getWalkableRects, type Rect } from "../worldGeometry";

const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

const isInsideRect = (x: number, z: number, r: Rect): boolean =>
  x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ;

export const clampToWalkable = (x: number, z: number, radius: number, levelIndex: number): { x: number; z: number } => {
  const walkableRects = getWalkableRects(levelIndex);
  const insetRects = walkableRects.map((r) => ({
    minX: r.minX + radius,
    maxX: r.maxX - radius,
    minZ: r.minZ + radius,
    maxZ: r.maxZ - radius
  }));

  for (const r of insetRects) {
    if (isInsideRect(x, z, r)) {
      return resolveBlockingRects(x, z, radius, levelIndex);
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
  return resolveBlockingRects(best.x, best.z, radius, levelIndex);
};

const resolveBlockingRects = (x: number, z: number, radius: number, levelIndex: number): { x: number; z: number } => {
  const blockingRects = [getDoorCollider(levelIndex)];
  let px = x;
  let pz = z;

  for (const rect of blockingRects) {
    const expanded = {
      minX: rect.minX - radius,
      maxX: rect.maxX + radius,
      minZ: rect.minZ - radius,
      maxZ: rect.maxZ + radius
    };
    if (!isInsideRect(px, pz, expanded)) {
      continue;
    }

    const outLeft = Math.abs(px - expanded.minX);
    const outRight = Math.abs(expanded.maxX - px);
    const outTop = Math.abs(pz - expanded.minZ);
    const outBottom = Math.abs(expanded.maxZ - pz);
    const minPush = Math.min(outLeft, outRight, outTop, outBottom);

    if (minPush === outLeft) {
      px = expanded.minX;
    } else if (minPush === outRight) {
      px = expanded.maxX;
    } else if (minPush === outTop) {
      pz = expanded.minZ;
    } else {
      pz = expanded.maxZ;
    }
  }

  return { x: px, z: pz };
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
