import type { LevelConfig, RoomConfig } from "../../data/types";
import { getArenaLayout } from "../worldGeometry";

export const generateLevelRooms = (level: LevelConfig): RoomConfig[] => {
  const layout = getArenaLayout(level.levelIndex);
  if (layout === "straight") {
    return level.rooms;
  }

  if (layout === "right") {
    return level.rooms.map((room, idx) => {
      if (idx === 0) return { ...room, coords: [-72, 0] };
      if (idx === 1) return { ...room, coords: [0, 0] };
      return { ...room, coords: [0, 72] };
    });
  }

  return level.rooms.map((room, idx) => {
    if (idx === 0) return { ...room, coords: [-72, 0] };
    if (idx === 1) return { ...room, coords: [0, 0] };
    return { ...room, coords: [0, -72] };
  });
};
