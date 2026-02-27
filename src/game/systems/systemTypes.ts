import type { GameContext } from "../GameContext";
import type { InputState } from "../state";

export interface FrameState {
  delta: number;
  time: number;
  input: InputState;
}

export type GameSystem = (ctx: GameContext, frame: FrameState) => void;

