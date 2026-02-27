import * as THREE from "three";
import goblinSheetUrl from "../assets/sprites/enemies/goblin/goblin_sheet.png";
import knight14Url from "../assets/sprites/enemies/knight/frame0014.png";
import knight15Url from "../assets/sprites/enemies/knight/frame0015.png";
import knight16Url from "../assets/sprites/enemies/knight/frame0016.png";
import knight17Url from "../assets/sprites/enemies/knight/frame0017.png";
import knight18Url from "../assets/sprites/enemies/knight/frame0018.png";
import knight19Url from "../assets/sprites/enemies/knight/frame0019.png";
import knight20Url from "../assets/sprites/enemies/knight/frame0020.png";
import knight21Url from "../assets/sprites/enemies/knight/frame0021.png";
import skeleton0Url from "../assets/sprites/enemies/skeleton/run_0.png";
import skeleton1Url from "../assets/sprites/enemies/skeleton/run_1.png";
import skeleton2Url from "../assets/sprites/enemies/skeleton/run_2.png";
import skeleton3Url from "../assets/sprites/enemies/skeleton/run_3.png";
import skeleton4Url from "../assets/sprites/enemies/skeleton/run_4.png";
import skeleton5Url from "../assets/sprites/enemies/skeleton/run_5.png";
import skeleton6Url from "../assets/sprites/enemies/skeleton/run_6.png";
import skeleton7Url from "../assets/sprites/enemies/skeleton/run_7.png";
import wizardIdleUrl from "../assets/sprites/enemies/wizard/wizard_idle.png";
import grassTextureUrl from "../assets/textures/terrain/ground_grass.png";
import keyTextureUrl from "../assets/textures/terrain/key_water.png";
import wallTextureUrl from "../assets/textures/terrain/wall_stone.png";

export class Renderer3D {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly textureLoader = new THREE.TextureLoader();
  private readonly textures: {
    floor: THREE.Texture;
    wall: THREE.Texture;
    key: THREE.Texture;
  };

  constructor(private readonly mount: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#5f7d8a");

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(this.renderer.domElement);

    this.textures = {
      floor: this.loadTexture(grassTextureUrl, 26, 26),
      wall: this.loadTexture(wallTextureUrl, 24, 2),
      key: this.loadTexture(keyTextureUrl, 2, 2)
    };

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 8, 5);
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
      sprite = this.createAtlasSprite(wizardIdleUrl, 10, 1, 10, 0, 1.8, 1.8);
    } else if (type === "campesino") {
      sprite = this.createFrameSprite(
        [skeleton0Url, skeleton1Url, skeleton2Url, skeleton3Url, skeleton4Url, skeleton5Url, skeleton6Url, skeleton7Url],
        11,
        1.7,
        1.7
      );
    } else if (type === "caballero") {
      sprite = this.createFrameSprite(
        [knight14Url, knight15Url, knight16Url, knight17Url, knight18Url, knight19Url, knight20Url, knight21Url],
        11,
        1.8,
        1.8
      );
    } else {
      sprite = this.createAtlasSprite(goblinSheetUrl, 8, 3, 10, 0, 2.2, 2.2);
    }

    sprite.name = `enemy-${type}`;
    this.scene.add(sprite);
    return sprite;
  }

  spawnKey(): THREE.Mesh {
    const geo = new THREE.TorusGeometry(0.4, 0.14, 8, 12);
    const mat = new THREE.MeshStandardMaterial({
      map: this.textures.key,
      color: "#ffffff",
      emissive: "#42a5f5",
      emissiveIntensity: 0.22,
      roughness: 0.65,
      metalness: 0.1
    });
    const mesh = new THREE.Mesh(geo, mat);
    this.scene.add(mesh);
    return mesh;
  }

  removeObject(obj: THREE.Object3D): void {
    this.scene.remove(obj);
  }

  private createAtlasSprite(
    url: string,
    cols: number,
    rows: number,
    fps: number,
    rowIndex: number,
    scaleX: number,
    scaleY: number
  ): THREE.Sprite {
    const texture = this.textureLoader.load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1 / cols, 1 / rows);
    texture.offset.set(0, 1 - (rowIndex + 1) / rows);

    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.2,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(scaleX, scaleY, 1);
    sprite.userData.animateEnemySprite = (time: number): void => {
      const frame = Math.floor(time * fps) % cols;
      texture.offset.x = frame / cols;
      texture.offset.y = 1 - (rowIndex + 1) / rows;
    };
    return sprite;
  }

  private createFrameSprite(frameUrls: string[], fps: number, scaleX: number, scaleY: number): THREE.Sprite {
    const frames = frameUrls.map((url) => {
      const texture = this.textureLoader.load(url);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      return texture;
    });
    const mat = new THREE.SpriteMaterial({
      map: frames[0],
      transparent: true,
      alphaTest: 0.2,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(scaleX, scaleY, 1);
    sprite.userData.animateEnemySprite = (time: number): void => {
      const frame = Math.floor(time * fps) % frames.length;
      if (mat.map !== frames[frame]) {
        mat.map = frames[frame];
        mat.needsUpdate = true;
      }
    };
    return sprite;
  }

  private addArenaBase(): void {
    const floorGeo = new THREE.PlaneGeometry(300, 300, 1, 1);
    const floorMat = new THREE.MeshStandardMaterial({
      map: this.textures.floor,
      color: "#ffffff",
      roughness: 1,
      metalness: 0
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    this.scene.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({
      map: this.textures.wall,
      color: "#ffffff",
      roughness: 0.92,
      metalness: 0.03
    });
    const wallThickness = 2;
    const wallHeight = 6;
    const half = 150;

    const north = new THREE.Mesh(new THREE.BoxGeometry(300, wallHeight, wallThickness), wallMat);
    north.position.set(0, wallHeight / 2, -half);
    const south = new THREE.Mesh(new THREE.BoxGeometry(300, wallHeight, wallThickness), wallMat);
    south.position.set(0, wallHeight / 2, half);
    const west = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, 300), wallMat);
    west.position.set(-half, wallHeight / 2, 0);
    const east = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, 300), wallMat);
    east.position.set(half, wallHeight / 2, 0);

    this.scene.add(north, south, west, east);
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

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };
}
