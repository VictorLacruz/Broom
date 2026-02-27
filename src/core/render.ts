import * as THREE from "three";
import dungeonFloor01Url from "../assets/textures/dungeon/floor01.png";
import dungeonFloor02Url from "../assets/textures/dungeon/floor02.png";
import dungeonWallUrl from "../assets/textures/dungeon/brick_wall01.png";
import doorClosedUrl from "../assets/sprites/items/door_closed.jpeg";
import doorOpenUrl from "../assets/sprites/items/door_open.jpeg";
import key1Url from "../assets/sprites/items/keyfly_1.jpeg";
import key2Url from "../assets/sprites/items/keyfly_2.jpeg";
import key3Url from "../assets/sprites/items/keyfly_3.jpeg";
import key4Url from "../assets/sprites/items/keyfly_4.jpeg";

type EnemyAnimState = "idle" | "run" | "attack";

type AtlasStateConfig = {
  texture: THREE.Texture;
  cols: number;
  rows: number;
  rowIndex: number;
  fps: number;
  frameCount: number;
};

type FrameStateConfig = {
  textures: THREE.Texture[];
  fps: number;
};

const enemySprites = import.meta.glob("../assets/sprites/enemies/**/*.png", {
  eager: true,
  import: "default"
}) as Record<string, string>;

const enemySpriteUrl = (suffix: string): string => {
  const hit = Object.entries(enemySprites).find(([key]) => key.endsWith(suffix));
  if (!hit) {
    throw new Error(`Sprite not found: ${suffix}`);
  }
  return hit[1];
};

const loadFrameSequence = (prefix: string, from: number, to: number): string[] => {
  const out: string[] = [];
  for (let i = from; i <= to; i += 1) {
    out.push(enemySpriteUrl(`${prefix}${String(i).padStart(4, "0")}.png`));
  }
  return out;
};

export class Renderer3D {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly textureLoader = new THREE.TextureLoader();
  private readonly textures: {
    floor: THREE.Texture;
    ceiling: THREE.Texture;
    wall: THREE.Texture;
    doorClosed: THREE.Texture;
    doorOpen: THREE.Texture;
    keyFrames: THREE.Texture[];
  };
  private activeDoor: THREE.Sprite | null = null;

  constructor(private readonly mount: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#1b232a");
    this.scene.fog = new THREE.Fog("#0f151a", 65, 230);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(this.renderer.domElement);

    this.textures = {
      floor: this.loadTexture(dungeonFloor01Url, 24, 24),
      ceiling: this.loadTexture(dungeonFloor02Url, 24, 24),
      wall: this.loadTexture(dungeonWallUrl, 8, 2),
      doorClosed: this.loadSpriteTexture(doorClosedUrl),
      doorOpen: this.loadSpriteTexture(doorOpenUrl),
      keyFrames: [this.loadSpriteTexture(key1Url), this.loadSpriteTexture(key2Url), this.loadSpriteTexture(key3Url), this.loadSpriteTexture(key4Url)]
    };

    const ambient = new THREE.AmbientLight(0xffffff, 0.72);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 0.38);
    dir.position.set(8, 11, 5);
    this.scene.add(dir);

    this.addArenaBase();
    window.addEventListener("resize", this.onResize);
    this.renderer.domElement.addEventListener("contextmenu", (ev) => ev.preventDefault());
  }

  get canvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    window.removeEventListener("resize", this.onResize);
    this.renderer.dispose();
  }

  spawnEnemy(type: string, _color: string): THREE.Sprite {
    let sprite: THREE.Sprite;
    if (type === "mago") {
      sprite = this.createStateAtlasSprite(
        {
          idle: this.makeAtlasState(enemySpriteUrl("wizard/wizard_idle.png"), 10, 1, 0, 10, 10),
          run: this.makeAtlasState(enemySpriteUrl("wizard/wizard_run.png"), 6, 1, 0, 12, 6),
          attack: this.makeAtlasState(enemySpriteUrl("wizard/wizard_attack.png"), 40, 10, 0, 16, 40)
        },
        1.9,
        1.9
      );
    } else if (type === "campesino") {
      sprite = this.createStateFrameSprite(
        {
          idle: this.makeFrameState(
            [
              enemySpriteUrl("skeleton/idle_0.png"),
              enemySpriteUrl("skeleton/idle_1.png"),
              enemySpriteUrl("skeleton/idle_2.png"),
              enemySpriteUrl("skeleton/idle_3.png"),
              enemySpriteUrl("skeleton/idle_4.png")
            ],
            8
          ),
          run: this.makeFrameState(
            [
              enemySpriteUrl("skeleton/run_0.png"),
              enemySpriteUrl("skeleton/run_1.png"),
              enemySpriteUrl("skeleton/run_2.png"),
              enemySpriteUrl("skeleton/run_3.png"),
              enemySpriteUrl("skeleton/run_4.png"),
              enemySpriteUrl("skeleton/run_5.png"),
              enemySpriteUrl("skeleton/run_6.png"),
              enemySpriteUrl("skeleton/run_7.png")
            ],
            11
          ),
          attack: this.makeFrameState(
            [
              enemySpriteUrl("skeleton/attack_00.png"),
              enemySpriteUrl("skeleton/attack_01.png"),
              enemySpriteUrl("skeleton/attack_02.png"),
              enemySpriteUrl("skeleton/attack_03.png"),
              enemySpriteUrl("skeleton/attack_04.png"),
              enemySpriteUrl("skeleton/attack_05.png"),
              enemySpriteUrl("skeleton/attack_06.png"),
              enemySpriteUrl("skeleton/attack_07.png"),
              enemySpriteUrl("skeleton/attack_08.png"),
              enemySpriteUrl("skeleton/attack_09.png"),
              enemySpriteUrl("skeleton/attack_10.png"),
              enemySpriteUrl("skeleton/attack_11.png"),
              enemySpriteUrl("skeleton/attack_12.png"),
              enemySpriteUrl("skeleton/attack_13.png"),
              enemySpriteUrl("skeleton/attack_14.png")
            ],
            14
          )
        },
        1.75,
        1.75
      );
    } else if (type === "caballero") {
      sprite = this.createStateFrameSprite(
        {
          idle: this.makeFrameState(loadFrameSequence("knight/frame", 0, 5), 8),
          run: this.makeFrameState(loadFrameSequence("knight/frame", 14, 21), 11),
          attack: this.makeFrameState(loadFrameSequence("knight/frame", 35, 48), 14)
        },
        1.9,
        1.9
      );
    } else {
      sprite = this.createStateAtlasSprite(
        {
          idle: this.makeAtlasState(enemySpriteUrl("goblin/goblin_sheet.png"), 8, 3, 0, 8, 8),
          run: this.makeAtlasState(enemySpriteUrl("goblin/goblin_sheet.png"), 8, 3, 1, 10, 8),
          attack: this.makeAtlasState(enemySpriteUrl("goblin/goblin_sheet.png"), 8, 3, 2, 12, 8)
        },
        2.2,
        2.2
      );
    }

    sprite.name = `enemy-${type}`;
    this.scene.add(sprite);
    return sprite;
  }

  spawnKey(): THREE.Sprite {
    const mat = new THREE.SpriteMaterial({
      map: this.textures.keyFrames[0],
      transparent: true,
      alphaTest: 0.25,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.1, 1.1, 1);
    sprite.center.set(0.5, 0.15);
    sprite.userData.animateKeySprite = (time: number): void => {
      const frame = Math.floor(time * 8) % this.textures.keyFrames.length;
      mat.map = this.textures.keyFrames[frame];
      mat.needsUpdate = true;
      sprite.position.y = 1.15 + Math.sin(time * 3) * 0.16;
    };
    this.scene.add(sprite);
    return sprite;
  }

  spawnDoor(): THREE.Sprite {
    const mat = new THREE.SpriteMaterial({
      map: this.textures.doorClosed,
      transparent: true,
      alphaTest: 0.2,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(3.6, 3.6, 1);
    sprite.center.set(0.5, 0.05);
    this.activeDoor = sprite;
    this.scene.add(sprite);
    return sprite;
  }

  setDoorOpen(open: boolean): void {
    if (!this.activeDoor) {
      return;
    }
    const mat = this.activeDoor.material as THREE.SpriteMaterial;
    const target = open ? this.textures.doorOpen : this.textures.doorClosed;
    if (mat.map !== target) {
      mat.map = target;
      mat.opacity = open ? 0.72 : 1;
      mat.needsUpdate = true;
    }
  }

  removeObject(obj: THREE.Object3D): void {
    if (obj === this.activeDoor) {
      this.activeDoor = null;
    }
    this.scene.remove(obj);
  }

  private makeAtlasState(
    url: string,
    cols: number,
    rows: number,
    rowIndex: number,
    fps: number,
    frameCount: number
  ): AtlasStateConfig {
    const texture = this.textureLoader.load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1 / cols, 1 / rows);
    texture.offset.set(0, 1 - (rowIndex + 1) / rows);
    return { texture, cols, rows, rowIndex, fps, frameCount };
  }

  private makeFrameState(urls: string[], fps: number): FrameStateConfig {
    const textures = urls.map((url) => {
      const texture = this.textureLoader.load(url);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      return texture;
    });
    return { textures, fps };
  }

  private createStateAtlasSprite(states: Record<EnemyAnimState, AtlasStateConfig>, scaleX: number, scaleY: number): THREE.Sprite {
    const mat = new THREE.SpriteMaterial({
      map: states.run.texture,
      transparent: true,
      alphaTest: 0.2,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(scaleX, scaleY, 1);
    sprite.center.set(0.5, 0.08);

    let currentState: EnemyAnimState = "run";
    const setEnemyAnimState = (state: EnemyAnimState): void => {
      currentState = state;
      const cfg = states[currentState];
      if (mat.map !== cfg.texture) {
        mat.map = cfg.texture;
        mat.needsUpdate = true;
      }
    };
    const animateEnemySprite = (time: number): void => {
      const cfg = states[currentState];
      const frame = Math.floor(time * cfg.fps) % cfg.frameCount;
      cfg.texture.offset.x = frame / cfg.cols;
      cfg.texture.offset.y = 1 - (cfg.rowIndex + 1) / cfg.rows;
    };

    sprite.userData.setEnemyAnimState = setEnemyAnimState;
    sprite.userData.animateEnemySprite = animateEnemySprite;
    return sprite;
  }

  private createStateFrameSprite(states: Record<EnemyAnimState, FrameStateConfig>, scaleX: number, scaleY: number): THREE.Sprite {
    const mat = new THREE.SpriteMaterial({
      map: states.run.textures[0],
      transparent: true,
      alphaTest: 0.2,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(scaleX, scaleY, 1);
    sprite.center.set(0.5, 0.08);

    let currentState: EnemyAnimState = "run";
    const setEnemyAnimState = (state: EnemyAnimState): void => {
      currentState = state;
    };
    const animateEnemySprite = (time: number): void => {
      const cfg = states[currentState];
      const frame = Math.floor(time * cfg.fps) % cfg.textures.length;
      if (mat.map !== cfg.textures[frame]) {
        mat.map = cfg.textures[frame];
        mat.needsUpdate = true;
      }
    };

    sprite.userData.setEnemyAnimState = setEnemyAnimState;
    sprite.userData.animateEnemySprite = animateEnemySprite;
    return sprite;
  }

  private addArenaBase(): void {
    const floorMat = new THREE.MeshStandardMaterial({
      map: this.textures.floor,
      color: "#ffffff",
      roughness: 1,
      metalness: 0
    });
    const ceilingMat = new THREE.MeshStandardMaterial({
      map: this.textures.ceiling,
      color: "#d6d6d6",
      roughness: 1,
      metalness: 0,
      side: THREE.DoubleSide
    });
    const wallMat = new THREE.MeshStandardMaterial({
      map: this.textures.wall,
      color: "#ffffff",
      roughness: 0.92,
      metalness: 0.03
    });

    const ROOM_W = 56;
    const ROOM_D = 56;
    const COR_W = 18;
    const COR_D = 20;
    const WALL_H = 6;
    const WALL_T = 1.4;
    const ROOF_Y = WALL_H;
    const C1 = -72;
    const C2 = 0;
    const C3 = 72;
    const COR1 = -36;
    const COR2 = 36;

    this.addRectFloor(C1, 0, ROOM_W, ROOM_D, 0, floorMat);
    this.addRectFloor(C2, 0, ROOM_W, ROOM_D, 0, floorMat);
    this.addRectFloor(C3, 0, ROOM_W, ROOM_D, 0, floorMat);
    this.addRectFloor(COR1, 0, COR_D, COR_W, 0.01, floorMat);
    this.addRectFloor(COR2, 0, COR_D, COR_W, 0.01, floorMat);

    this.addRectFloor(C1, 0, ROOM_W, ROOM_D, ROOF_Y, ceilingMat, Math.PI / 2);
    this.addRectFloor(C2, 0, ROOM_W, ROOM_D, ROOF_Y, ceilingMat, Math.PI / 2);
    this.addRectFloor(C3, 0, ROOM_W, ROOM_D, ROOF_Y, ceilingMat, Math.PI / 2);
    this.addRectFloor(COR1, 0, COR_D, COR_W, ROOF_Y, ceilingMat, Math.PI / 2);
    this.addRectFloor(COR2, 0, COR_D, COR_W, ROOF_Y, ceilingMat, Math.PI / 2);

    this.addRoomWalls(C1, ROOM_W, ROOM_D, WALL_H, WALL_T, wallMat, false, true);
    this.addRoomWalls(C2, ROOM_W, ROOM_D, WALL_H, WALL_T, wallMat, true, true);
    this.addRoomWalls(C3, ROOM_W, ROOM_D, WALL_H, WALL_T, wallMat, true, false);

    this.addCorridorWalls(COR1, COR_D, COR_W, WALL_H, WALL_T, wallMat);
    this.addCorridorWalls(COR2, COR_D, COR_W, WALL_H, WALL_T, wallMat);
  }

  private addRectFloor(
    x: number,
    z: number,
    width: number,
    depth: number,
    y: number,
    material: THREE.Material,
    rotX = -Math.PI / 2
  ): void {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth, 1, 1), material);
    mesh.rotation.x = rotX;
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
  }

  private addRoomWalls(
    cx: number,
    width: number,
    depth: number,
    height: number,
    thickness: number,
    mat: THREE.Material,
    openWest: boolean,
    openEast: boolean
  ): void {
    const halfW = width / 2;
    const halfD = depth / 2;
    const gap = 10;
    const sideSeg = (depth - gap) / 2;

    const north = new THREE.Mesh(new THREE.BoxGeometry(width, height, thickness), mat);
    north.position.set(cx, height / 2, -halfD);
    const south = new THREE.Mesh(new THREE.BoxGeometry(width, height, thickness), mat);
    south.position.set(cx, height / 2, halfD);
    this.scene.add(north, south);

    if (openWest) {
      const w1 = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, sideSeg), mat);
      const w2 = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, sideSeg), mat);
      w1.position.set(cx - halfW, height / 2, -((gap / 2) + sideSeg / 2));
      w2.position.set(cx - halfW, height / 2, (gap / 2) + sideSeg / 2);
      this.scene.add(w1, w2);
    } else {
      const west = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, depth), mat);
      west.position.set(cx - halfW, height / 2, 0);
      this.scene.add(west);
    }

    if (openEast) {
      const e1 = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, sideSeg), mat);
      const e2 = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, sideSeg), mat);
      e1.position.set(cx + halfW, height / 2, -((gap / 2) + sideSeg / 2));
      e2.position.set(cx + halfW, height / 2, (gap / 2) + sideSeg / 2);
      this.scene.add(e1, e2);
    } else {
      const east = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, depth), mat);
      east.position.set(cx + halfW, height / 2, 0);
      this.scene.add(east);
    }
  }

  private addCorridorWalls(
    cx: number,
    width: number,
    depth: number,
    height: number,
    thickness: number,
    mat: THREE.Material
  ): void {
    const halfD = depth / 2;
    const north = new THREE.Mesh(new THREE.BoxGeometry(width, height, thickness), mat);
    north.position.set(cx, height / 2, -halfD);
    const south = new THREE.Mesh(new THREE.BoxGeometry(width, height, thickness), mat);
    south.position.set(cx, height / 2, halfD);
    this.scene.add(north, south);
  }

  private loadTexture(url: string, repeatX: number, repeatY: number): THREE.Texture {
    const texture = this.textureLoader.load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    return texture;
  }

  private loadSpriteTexture(url: string): THREE.Texture {
    const texture = this.textureLoader.load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };
}
