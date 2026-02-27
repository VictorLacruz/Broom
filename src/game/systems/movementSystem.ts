import type { InputState } from "../state";
import type { Transform, Velocity } from "../components";

export const updatePlayerMovement = (
  transform: Transform,
  velocity: Velocity,
  input: InputState,
  speed: number,
  delta: number
): void => {
  const cos = Math.cos(transform.yaw);
  const sin = Math.sin(transform.yaw);
  const mx = input.forward * sin + input.right * cos;
  const mz = input.forward * cos - input.right * sin;
  const len = Math.hypot(mx, mz) || 1;

  velocity.x = (mx / len) * speed;
  velocity.z = (mz / len) * speed;
  transform.x += velocity.x * delta;
  transform.z += velocity.z * delta;
};
