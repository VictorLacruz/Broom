import * as THREE from "three";
import enemyTextureUrl from "../assets/textures/terrain/enemy_dirt.png";
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
    enemy: THREE.Texture;
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
      enemy: this.loadTexture(enemyTextureUrl, 1, 1),
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

  spawnEnemy(color: string): THREE.Mesh {
    const geo = new THREE.BoxGeometry(1, 2, 1);
    const mat = new THREE.MeshStandardMaterial({
      map: this.textures.enemy,
      color,
      roughness: 0.9,
      metalness: 0.05
    });
    const mesh = new THREE.Mesh(geo, mat);
    this.scene.add(mesh);
    return mesh;
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
