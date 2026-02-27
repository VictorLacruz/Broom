export type Rect = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export const DOOR_POSITION = {
  x: 97.6,
  y: 0.18,
  z: 0
} as const;

export const DOOR_COLLIDER: Rect = {
  minX: 96.9,
  maxX: 98.1,
  minZ: -2.3,
  maxZ: 2.3
};
