import type { InputState } from "../game/state";

export class InputController {
  private readonly keys = new Set<string>();
  private readonly state: InputState = {
    forward: 0,
    right: 0,
    attack: false,
    shield: false,
    projectile: false,
    dash: false,
    interact: false,
    heal: false,
    mouseDeltaX: 0,
    mouseDeltaY: 0
  };

  constructor(private readonly element: HTMLElement) {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    element.addEventListener("click", () => {
      if (document.pointerLockElement !== element) {
        element.requestPointerLock();
      }
    });
  }

  destroy(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mouseup", this.onMouseUp);
  }

  consumeState(): InputState {
    const forward = (this.keys.has("KeyW") ? -1 : 0) + (this.keys.has("KeyS") ? 1 : 0);
    const right = (this.keys.has("KeyD") ? 1 : 0) + (this.keys.has("KeyA") ? -1 : 0);

    const snapshot: InputState = {
      forward,
      right,
      attack: this.state.attack,
      shield: this.state.shield,
      projectile: this.state.projectile,
      dash: this.state.dash,
      interact: this.state.interact,
      heal: this.state.heal,
      mouseDeltaX: this.state.mouseDeltaX,
      mouseDeltaY: this.state.mouseDeltaY
    };

    this.state.projectile = false;
    this.state.dash = false;
    this.state.interact = false;
    this.state.heal = false;
    this.state.mouseDeltaX = 0;
    this.state.mouseDeltaY = 0;

    return snapshot;
  }

  private onKeyDown = (ev: KeyboardEvent): void => {
    this.keys.add(ev.code);
    if (ev.code === "KeyE") {
      this.state.projectile = true;
    }
    if (ev.code === "ShiftLeft" || ev.code === "ShiftRight") {
      this.state.dash = true;
    }
    if (ev.code === "KeyF") {
      this.state.interact = true;
    }
    if (ev.code === "KeyH") {
      this.state.heal = true;
    }
  };

  private onKeyUp = (ev: KeyboardEvent): void => {
    this.keys.delete(ev.code);
  };

  private onMouseMove = (ev: MouseEvent): void => {
    if (document.pointerLockElement !== this.element) {
      return;
    }
    this.state.mouseDeltaX += ev.movementX;
    this.state.mouseDeltaY += ev.movementY;
  };

  private onMouseDown = (ev: MouseEvent): void => {
    if (ev.button === 0) {
      this.state.attack = true;
    }
    if (ev.button === 2) {
      this.state.shield = true;
    }
  };

  private onMouseUp = (ev: MouseEvent): void => {
    if (ev.button === 0) {
      this.state.attack = false;
    }
    if (ev.button === 2) {
      this.state.shield = false;
    }
  };
}
