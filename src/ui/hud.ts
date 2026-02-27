import type { GameRuntimeState } from "../game/state";
import grassTextureUrl from "../assets/textures/terrain/ground_grass.png";

export class HUD {
  private readonly root: HTMLElement;
  private readonly enemiesEl: HTMLElement;
  private readonly minimapEl: HTMLElement;
  private readonly minimapCanvas: HTMLCanvasElement;
  private readonly healthTextEl: HTMLElement;
  private readonly healthBarEl: HTMLElement;
  private readonly shieldEl: HTMLElement;
  private readonly cooldown1El: HTMLElement;
  private readonly cooldown2El: HTMLElement;
  private readonly keyIconEl: HTMLElement;
  private readonly loadingEl: HTMLElement;
  private readonly messageEl: HTMLElement;
  private readonly minimapTextureImage: HTMLImageElement;
  private minimapPattern: CanvasPattern | null = null;

  constructor(parent: HTMLElement) {
    this.root = document.createElement("div");
    this.root.className = "hud";

    this.enemiesEl = this.block("hud-top-left", "0 / 0");
    this.minimapEl = this.block("hud-top-right", "");
    this.minimapCanvas = document.createElement("canvas");
    this.minimapCanvas.width = 160;
    this.minimapCanvas.height = 100;
    this.minimapEl.appendChild(this.minimapCanvas);
    this.minimapTextureImage = new Image();
    this.minimapTextureImage.src = grassTextureUrl;
    this.minimapTextureImage.onload = () => {
      const ctx = this.minimapCanvas.getContext("2d");
      if (!ctx) {
        return;
      }
      this.minimapPattern = ctx.createPattern(this.minimapTextureImage, "repeat");
    };

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
      this.minimapEl,
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

    this.drawMinimap(state);
  }

  private drawMinimap(state: GameRuntimeState): void {
    const ctx = this.minimapCanvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
    if (this.minimapPattern) {
      ctx.fillStyle = this.minimapPattern;
    } else {
      ctx.fillStyle = "#1f2d3c";
    }
    ctx.fillRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
    ctx.fillStyle = "rgba(12, 24, 32, 0.58)";
    ctx.fillRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);

    const rooms = state.currentLevel.rooms;
    const minX = Math.min(...rooms.map((r) => r.coords[0]));
    const maxX = Math.max(...rooms.map((r) => r.coords[0]));
    const minZ = Math.min(...rooms.map((r) => r.coords[1]));
    const maxZ = Math.max(...rooms.map((r) => r.coords[1]));

    const spanX = Math.max(1, maxX - minX);
    const spanZ = Math.max(1, maxZ - minZ);

    for (const room of rooms) {
      const x = ((room.coords[0] - minX) / spanX) * 126 + 12;
      const z = ((room.coords[1] - minZ) / spanZ) * 66 + 14;
      const w = Math.max(16, Math.sqrt(room.area) * 1.5);
      const h = Math.max(10, Math.sqrt(room.area));

      ctx.fillStyle = room.id === state.currentLevel.keyRoomId ? "#f59e0b" : "#8aa7b8";
      ctx.fillRect(x, z, w, h);
      ctx.strokeStyle = "#0e141a";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, z, w, h);
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, this.minimapCanvas.width - 2, this.minimapCanvas.height - 2);
  }

  private block(className: string, text: string): HTMLElement {
    const el = document.createElement("div");
    el.className = className;
    el.textContent = text;
    return el;
  }
}
