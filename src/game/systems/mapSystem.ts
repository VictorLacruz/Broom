import type { LevelConfig, RoomConfig } from "../../data/types";

export const generateLevelRooms = (level: LevelConfig): RoomConfig[] => {
  if (level.levelIndex === 1) {
    return level.rooms;
  }

  return level.rooms.map((room, idx) => ({
    ...room,
    coords: [room.coords[0] + (Math.random() * 16 - 8), room.coords[1] + (Math.random() * 16 - 8)],
    area: Math.round(room.area * (1 + idx * 0.03))
  }));
};
