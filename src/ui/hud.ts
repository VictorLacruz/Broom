import type { GameRuntimeState } from "../game/state";

export class HUD {
  private readonly root: HTMLElement;
  private readonly enemiesEl: HTMLElement;
  private readonly healthTextEl: HTMLElement;
  private readonly healthBarEl: HTMLElement;
  private readonly shieldEl: HTMLElement;
  private readonly cooldown1El: HTMLElement;
  private readonly cooldown2El: HTMLElement;
  private readonly keyIconEl: HTMLElement;
  private readonly loadingEl: HTMLElement;
  private readonly messageEl: HTMLElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement("div");
    this.root.className = "hud";

    this.enemiesEl = this.block("hud-top-left", "0 / 0");

    const bottomLeft = this.block("hud-bottom-left", "");
    this.healthTextEl = document.createElement("div");
    this.healthBarEl = document.createElement("div");
    this.healthBarEl.className = "health-bar";
    this.shieldEl = document.createElement("div");
    bottomLeft.append(this.healthTextEl, this.healthBarEl, this.shieldEl);

    const bottomRight = this.block("hud-bottom-right", "");
    this.cooldown1El = document.createElement("div");
    this.cooldown2El = document.createElement("div");
    bottomRight.append(this.cooldown1El, this.cooldown2El);

    this.keyIconEl = this.block("hud-key", "LLAVE");
    this.keyIconEl.style.display = "none";

    this.loadingEl = this.block("overlay", "Cargando...");
    this.loadingEl.style.display = "none";

    this.messageEl = this.block("message", "");

    this.root.append(
      this.enemiesEl,
      bottomLeft,
      bottomRight,
      this.keyIconEl,
      this.loadingEl,
      this.messageEl
    );

    parent.appendChild(this.root);
  }

  update(state: GameRuntimeState): void {
    this.enemiesEl.textContent = `${state.enemiesAlive} / ${state.enemiesTotal}`;

    const hpPct = Math.max(0, Math.min(1, state.playerHealth / state.playerMaxHealth));
    this.healthTextEl.textContent = `Vida: ${Math.ceil(state.playerHealth)} / ${state.playerMaxHealth}`;
    this.healthBarEl.style.width = `${Math.round(hpPct * 220)}px`;
    this.shieldEl.textContent = `Durabilidad: ${Math.ceil((state.shieldDurability / state.shieldMaxDurability) * 100)}%`;

    this.cooldown1El.textContent = `Cabeza de mangual: ${state.cooldowns.projectile.toFixed(1)}s`;
    this.cooldown2El.textContent = `Dash: ${state.cooldowns.dash.toFixed(1)}s`;

    this.keyIconEl.style.display = state.playerHasKey ? "block" : "none";
    this.loadingEl.style.display = state.loading ? "flex" : "none";

    if (state.gameOver) {
      this.messageEl.textContent = "Derrota";
      this.messageEl.style.display = "block";
    } else if (state.victory) {
      this.messageEl.textContent = "Victoria";
      this.messageEl.style.display = "block";
    } else {
      this.messageEl.textContent = "";
      this.messageEl.style.display = "none";
    }

  }

  private block(className: string, text: string): HTMLElement {
    const el = document.createElement("div");
    el.className = className;
    el.textContent = text;
    return el;
  }
}
