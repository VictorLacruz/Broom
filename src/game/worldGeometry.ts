export type Rect = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export type ArenaLayout = "straight" | "right" | "left";

const ROOM_HALF = 28;
const CORRIDOR_HALF_W = 9;
const CORRIDOR_HALF_L = 10;
const DOOR_HALF_W = 2.3;

export const getArenaLayout = (levelIndex: number): ArenaLayout => {
  if (levelIndex === 2) {
    return "right";
  }
  if (levelIndex === 3) {
    return "left";
  }
  return "straight";
};

export const getDoorPosition = (levelIndex: number): { x: number; y: number; z: number } => {
  const layout = getArenaLayout(levelIndex);
  if (layout === "right") {
    return { x: 0, y: 0.18, z: 97.6 };
  }
  if (layout === "left") {
    return { x: 0, y: 0.18, z: -97.6 };
  }
  return { x: 97.6, y: 0.18, z: 0 };
};

export const getDoorCollider = (levelIndex: number): Rect => {
  const layout = getArenaLayout(levelIndex);
  if (layout === "right") {
    return {
      minX: -DOOR_HALF_W,
      maxX: DOOR_HALF_W,
      minZ: 96.9,
      maxZ: 98.1
    };
  }
  if (layout === "left") {
    return {
      minX: -DOOR_HALF_W,
      maxX: DOOR_HALF_W,
      minZ: -98.1,
      maxZ: -96.9
    };
  }
  return {
    minX: 96.9,
    maxX: 98.1,
    minZ: -DOOR_HALF_W,
    maxZ: DOOR_HALF_W
  };
};

export const getWalkableRects = (levelIndex: number): Rect[] => {
  const layout = getArenaLayout(levelIndex);
  const room1: Rect = { minX: -98, maxX: -44, minZ: -26, maxZ: 26 };
  const room2: Rect = { minX: -28, maxX: 28, minZ: -26, maxZ: 26 };
  const corridor1: Rect = {
    minX: -36 - CORRIDOR_HALF_L,
    maxX: -36 + CORRIDOR_HALF_L,
    minZ: -CORRIDOR_HALF_W,
    maxZ: CORRIDOR_HALF_W
  };

  if (layout === "right") {
    const room3: Rect = {
      minX: -26,
      maxX: 26,
      minZ: 44,
      maxZ: 98
    };
    const corridor2: Rect = {
      minX: -CORRIDOR_HALF_W,
      maxX: CORRIDOR_HALF_W,
      minZ: 36 - CORRIDOR_HALF_L,
      maxZ: 36 + CORRIDOR_HALF_L
    };
    return [room1, room2, room3, corridor1, corridor2];
  }

  if (layout === "left") {
    const room3: Rect = {
      minX: -26,
      maxX: 26,
      minZ: -98,
      maxZ: -44
    };
    const corridor2: Rect = {
      minX: -CORRIDOR_HALF_W,
      maxX: CORRIDOR_HALF_W,
      minZ: -36 - CORRIDOR_HALF_L,
      maxZ: -36 + CORRIDOR_HALF_L
    };
    return [room1, room2, room3, corridor1, corridor2];
  }

  const room3: Rect = { minX: 44, maxX: 98, minZ: -26, maxZ: 26 };
  const corridor2: Rect = {
    minX: 36 - CORRIDOR_HALF_L,
    maxX: 36 + CORRIDOR_HALF_L,
    minZ: -CORRIDOR_HALF_W,
    maxZ: CORRIDOR_HALF_W
  };
  return [room1, room2, room3, corridor1, corridor2];
};

export const INITIAL_ROOM_CENTER = {
  x: -72,
  z: 0
} as const;

export const ARENA_DIMENSIONS = {
  roomHalf: ROOM_HALF,
  corridorHalfW: CORRIDOR_HALF_W,
  corridorHalfL: CORRIDOR_HALF_L
} as const;
