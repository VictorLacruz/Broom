import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import enemyModelUrl from "../assets/models/itch_basicman.fbx?url";
import grassTextureUrl from "../assets/textures/terrain/ground_grass.png";
import keyTextureUrl from "../assets/textures/terrain/key_water.png";
import wallTextureUrl from "../assets/textures/terrain/wall_stone.png";

export class Renderer3D {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly textureLoader = new THREE.TextureLoader();
  private readonly fbxLoader = new FBXLoader();
  private enemyTemplate: THREE.Group | null = null;
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
    this.loadEnemyTemplate();
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

  spawnEnemy(type: string, color: string): THREE.Group {
    if (this.enemyTemplate) {
      return this.spawnEnemyFromTemplate(type, color);
    }

    return this.spawnFallbackEnemy(type, color);
  }

  private spawnEnemyFromTemplate(type: string, color: string): THREE.Group {
    const root = this.enemyTemplate!.clone(true);
    root.name = `enemy-${type}`;
    this.tintModel(root, color);
    this.addEnemyProps(root, type, color);
    this.scene.add(root);
    return root;
  }

  private spawnFallbackEnemy(type: string, color: string): THREE.Group {
    const root = new THREE.Group();
    root.name = `enemy-${type}`;

    const cloth = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
      metalness: 0.05
    });
    const skin = new THREE.MeshStandardMaterial({
      color: "#f2c7a2",
      roughness: 1,
      metalness: 0
    });
    const dark = new THREE.MeshStandardMaterial({
      color: "#2b2b2b",
      roughness: 1,
      metalness: 0
    });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.85, 6, 10), cloth);
    body.position.y = 1.15;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), skin);
    head.position.y = 1.85;

    const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.52, 4, 8), cloth);
    armL.position.set(-0.42, 1.16, 0);
    armL.rotation.z = 0.18;

    const armR = armL.clone();
    armR.position.x = 0.42;
    armR.rotation.z = -0.18;

    const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.62, 4, 8), dark);
    legL.position.set(-0.17, 0.45, 0);
    const legR = legL.clone();
    legR.position.x = 0.17;

    root.add(body, head, armL, armR, legL, legR);
    this.addEnemyProps(root, type, color);

    this.scene.add(root);
    return root;
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

  private createEnemyNameTag(type: string): THREE.Sprite {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "rgba(17, 24, 39, 0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(245, 244, 232, 0.9)";
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
      ctx.fillStyle = "#f5f4e8";
      ctx.font = "bold 28px Verdana";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(type.toUpperCase(), canvas.width / 2, canvas.height / 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(2.6, 0.65, 1);
    sprite.position.set(0, 2.35, 0);
    return sprite;
  }

  private addEnemyProps(root: THREE.Group, type: string, color: string): void {
    root.add(this.createEnemyNameTag(type));

    const propsMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.92,
      metalness: 0.08
    });

    if (type === "caballero") {
      const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.08, 14), propsMat);
      shield.position.set(-0.45, 1.2, 0.2);
      shield.rotation.x = Math.PI / 2;
      root.add(shield);
    } else if (type === "goblin") {
      const dagger = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.5, 6), propsMat);
      dagger.position.set(0.48, 1.12, 0.18);
      dagger.rotation.z = Math.PI / 3;
      root.add(dagger);
    } else if (type === "mago") {
      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8), propsMat);
      staff.position.set(0.5, 1.08, 0.05);
      staff.rotation.z = 0.16;
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 10, 8),
        new THREE.MeshStandardMaterial({ color: "#7dd3fc", emissive: "#1d4ed8", emissiveIntensity: 0.5 })
      );
      orb.position.set(0, 0.58, 0);
      staff.add(orb);
      root.add(staff);
    } else {
      const tool = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), propsMat);
      tool.position.set(0.46, 1.08, 0);
      tool.rotation.z = -0.22;
      root.add(tool);
    }
  }

  private loadEnemyTemplate(): void {
    this.fbxLoader.load(
      enemyModelUrl,
      (object) => {
        const template = new THREE.Group();
        template.name = "itch-basicman-template";
        object.scale.setScalar(0.018);
        object.position.set(0, 0, 0);
        object.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = false;
            mesh.receiveShadow = false;
            const src = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
            const baseColor = src && "color" in src ? ((src as THREE.MeshStandardMaterial).color?.getHexString() ?? "ffffff") : "ffffff";
            mesh.material = new THREE.MeshStandardMaterial({
              color: `#${baseColor}`,
              roughness: 0.9,
              metalness: 0.02
            });
          }
        });
        template.add(object);
        this.enemyTemplate = template;
      },
      undefined,
      () => {
        this.enemyTemplate = null;
      }
    );
  }

  private tintModel(root: THREE.Object3D, color: string): void {
    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const current = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        const mat =
          current instanceof THREE.MeshStandardMaterial
            ? current
            : new THREE.MeshStandardMaterial({
                color: "#ffffff",
                roughness: 0.9,
                metalness: 0.02
              });
        mesh.material = mat.clone();
        (mesh.material as THREE.MeshStandardMaterial).color.multiply(new THREE.Color(color));
      }
    });
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
