/**
 * سرویس تصور سازی سه‌بعدی
 * Three.js برای رندرینگ و مدیریت صحنه
 */

import * as THREE from 'three';

interface Visualization3DConfig {
  container: HTMLElement;
  width: number;
  height: number;
  backgroundColor: number;
}

class Visualization3DService {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private objects: Map<string, THREE.Object3D> = new Map();
  private lights: Map<string, THREE.Light> = new Map();
  private animationId: number | null = null;

  constructor(config: Visualization3DConfig) {
    this.container = config.container;

    // تنظیم صحنه
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(config.backgroundColor);

    // تنظیم کمرا
    this.camera = new THREE.PerspectiveCamera(
      75,
      config.width / config.height,
      0.1,
      1000
    );
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);

    // تنظیم رندرر
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(config.width, config.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // اضافه کردن نورهای پیش‌فرض
    this.addDefaultLights();

    // شروع حلقه انیمیشن
    this.startAnimationLoop();

    // مدیریت تغییر اندازه صفحه
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * اضافه کردن نورهای پیش‌فرض
   */
  private addDefaultLights(): void {
    // نور آمبینت
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    this.lights.set('ambient', ambientLight);

    // نور جهت‌دار
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    this.lights.set('directional', directionalLight);

    // نور نقطه‌ای
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-10, 10, 10);
    this.scene.add(pointLight);
    this.lights.set('point', pointLight);
  }

  /**
   * اضافه کردن مکعب
   */
  addCube(
    id: string,
    position: [number, number, number],
    size: number = 1,
    color: number = 0x00ff00
  ): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({ color });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(...position);
    cube.castShadow = true;
    cube.receiveShadow = true;
    this.scene.add(cube);
    this.objects.set(id, cube);
    return cube;
  }

  /**
   * اضافه کردن کره
   */
  addSphere(
    id: string,
    position: [number, number, number],
    radius: number = 1,
    color: number = 0xff0000
  ): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(...position);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    this.scene.add(sphere);
    this.objects.set(id, sphere);
    return sphere;
  }

  /**
   * اضافه کردن سیلندر
   */
  addCylinder(
    id: string,
    position: [number, number, number],
    radiusTop: number = 1,
    radiusBottom: number = 1,
    height: number = 2,
    color: number = 0x0000ff
  ): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32);
    const material = new THREE.MeshStandardMaterial({ color });
    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(...position);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    this.scene.add(cylinder);
    this.objects.set(id, cylinder);
    return cylinder;
  }

  /**
   * اضافه کردن صفحه زمین
   */
  addPlane(
    id: string,
    position: [number, number, number],
    width: number = 20,
    height: number = 20,
    color: number = 0x888888
  ): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshStandardMaterial({ color });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(...position);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    this.scene.add(plane);
    this.objects.set(id, plane);
    return plane;
  }

  /**
   * حرکت دادن یک شی
   */
  moveObject(
    id: string,
    position: [number, number, number]
  ): void {
    const obj = this.objects.get(id);
    if (obj) {
      obj.position.set(...position);
    }
  }

  /**
   * چرخاندن یک شی
   */
  rotateObject(
    id: string,
    rotation: [number, number, number]
  ): void {
    const obj = this.objects.get(id);
    if (obj) {
      obj.rotation.set(...rotation);
    }
  }

  /**
   * تغییر رنگ یک شی
   */
  setObjectColor(id: string, color: number): void {
    const obj = this.objects.get(id);
    if (obj && obj instanceof THREE.Mesh) {
      (obj.material as THREE.MeshStandardMaterial).color.setHex(color);
    }
  }

  /**
   * حذف یک شی
   */
  removeObject(id: string): void {
    const obj = this.objects.get(id);
    if (obj) {
      this.scene.remove(obj);
      this.objects.delete(id);
    }
  }

  /**
   * دریافت شی
   */
  getObject(id: string): THREE.Object3D | undefined {
    return this.objects.get(id);
  }

  /**
   * حلقه انیمیشن اصلی
   */
  private startAnimationLoop(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  /**
   * مدیریت تغییر اندازه صفحه
   */
  private onWindowResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * تنظیم موقعیت کمرا
   */
  setCameraPosition(position: [number, number, number], target: [number, number, number]): void {
    this.camera.position.set(...position);
    this.camera.lookAt(...target);
  }

  /**
   * دریافت کمرا
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * دریافت صحنه
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * پاک‌کردن تمام اشیاء
   */
  clear(): void {
    this.objects.forEach((obj) => this.scene.remove(obj));
    this.objects.clear();
  }

  /**
   * متوقف کردن رندرینگ
   */
  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

export { Visualization3DService };
