/**
 * سرویس رندرینگ
 * مدیریت WebGL، کمرا، و تعاملات موس و صفحه‌کلید
 */

import { Visualization3DService } from './visualization3DService';

interface MouseState {
  x: number;
  y: number;
  isPressed: boolean;
  deltaX: number;
  deltaY: number;
}

interface KeyboardState {
  keys: Map<string, boolean>;
}

interface CameraControl {
  enableRotation: boolean;
  enableZoom: boolean;
  enablePan: boolean;
  rotationSpeed: number;
  zoomSpeed: number;
  panSpeed: number;
}

class RenderingService {
  private visualization: Visualization3DService;
  private mouseState: MouseState = {
    x: 0,
    y: 0,
    isPressed: false,
    deltaX: 0,
    deltaY: 0,
  };
  private keyboardState: KeyboardState = {
    keys: new Map(),
  };
  private cameraControl: CameraControl = {
    enableRotation: true,
    enableZoom: true,
    enablePan: true,
    rotationSpeed: 0.01,
    zoomSpeed: 0.1,
    panSpeed: 0.01,
  };
  private selectedObjectId: string | null = null;
  private raycaster: any = null;

  constructor(visualization: Visualization3DService) {
    this.visualization = visualization;
    this.initializeMouseControls();
    this.initializeKeyboardControls();
  }

  /**
   * راه‌اندازی کنترل‌های موس
   */
  private initializeMouseControls(): void {
    const canvas = this.visualization.getScene().children[0];
    if (!canvas) return;

    document.addEventListener('mousemove', (event) => {
      this.mouseState.deltaX = event.clientX - this.mouseState.x;
      this.mouseState.deltaY = event.clientY - this.mouseState.y;
      this.mouseState.x = event.clientX;
      this.mouseState.y = event.clientY;

      if (this.mouseState.isPressed) {
        this.handleMouseDrag();
      }
    });

    document.addEventListener('mousedown', (event) => {
      this.mouseState.isPressed = true;
      this.handleMouseClick(event);
    });

    document.addEventListener('mouseup', () => {
      this.mouseState.isPressed = false;
    });

    document.addEventListener('wheel', (event) => {
      event.preventDefault();
      this.handleMouseWheel(event.deltaY);
    });
  }

  /**
   * راه‌اندازی کنترل‌های صفحه‌کلید
   */
  private initializeKeyboardControls(): void {
    document.addEventListener('keydown', (event) => {
      this.keyboardState.keys.set(event.key.toLowerCase(), true);
      this.handleKeyDown(event);
    });

    document.addEventListener('keyup', (event) => {
      this.keyboardState.keys.set(event.key.toLowerCase(), false);
      this.handleKeyUp(event);
    });
  }

  /**
   * مدیریت کلیک موس
   */
  private handleMouseClick(event: MouseEvent): void {
    // انتخاب شی سه‌بعدی
    const camera = this.visualization.getCamera();
    const scene = this.visualization.getScene();

    // محاسبه موقعیت موس نرمال‌شده
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;

    // بررسی تقاطع
    console.log(`کلیک در موقعیت: (${x.toFixed(2)}, ${y.toFixed(2)})`);
  }

  /**
   * مدیریت کشش موس
   */
  private handleMouseDrag(): void {
    if (!this.cameraControl.enableRotation) return;

    const camera = this.visualization.getCamera();
    const deltaMove = Math.sqrt(
      this.mouseState.deltaX ** 2 + this.mouseState.deltaY ** 2
    );

    if (deltaMove > 0) {
      // چرخش کمرا
      const euler = new (require('three')).Euler(0, 0, 0, 'YXZ');
      euler.setFromQuaternion(camera.quaternion);

      euler.setFromVector3(
        new (require('three')).Vector3(
          -this.mouseState.deltaY * this.cameraControl.rotationSpeed,
          -this.mouseState.deltaX * this.cameraControl.rotationSpeed,
          0
        )
      );

      camera.quaternion.setFromEuler(euler);
    }
  }

  /**
   * مدیریت چرخش موس (Zoom)
   */
  private handleMouseWheel(deltaY: number): void {
    if (!this.cameraControl.enableZoom) return;

    const camera = this.visualization.getCamera();
    const direction = camera.getWorldDirection(new (require('three')).Vector3());
    const distance = deltaY > 0 ? this.cameraControl.zoomSpeed : -this.cameraControl.zoomSpeed;

    camera.position.addScaledVector(direction, distance);
  }

  /**
   * مدیریت فشردن کلید صفحه‌کلید
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();

    // ناوبری با صفحه‌کلید
    if (key === 'arrowup' || key === 'w') {
      this.moveCamera(0, 0, -this.cameraControl.panSpeed);
    } else if (key === 'arrowdown' || key === 's') {
      this.moveCamera(0, 0, this.cameraControl.panSpeed);
    } else if (key === 'arrowleft' || key === 'a') {
      this.moveCamera(-this.cameraControl.panSpeed, 0, 0);
    } else if (key === 'arrowright' || key === 'd') {
      this.moveCamera(this.cameraControl.panSpeed, 0, 0);
    }

    // سایر کلیدهای میانبر
    if (key === 'r') {
      this.resetCamera();
    } else if (key === 'escape') {
      this.deselectObject();
    }
  }

  /**
   * مدیریت رها کردن کلید
   */
  private handleKeyUp(event: KeyboardEvent): void {
    // می‌توان برای متوقف کردن حرکت استفاده شود
  }

  /**
   * جابه‌جایی کمرا
   */
  private moveCamera(dx: number, dy: number, dz: number): void {
    const camera = this.visualization.getCamera();
    camera.position.x += dx;
    camera.position.y += dy;
    camera.position.z += dz;
  }

  /**
   * بازنشانی کمرا
   */
  resetCamera(): void {
    this.visualization.setCameraPosition([5, 5, 5], [0, 0, 0]);
  }

  /**
   * تنظیم کنترل‌های کمرا
   */
  setCameraControl(control: Partial<CameraControl>): void {
    this.cameraControl = { ...this.cameraControl, ...control };
  }

  /**
   * دریافت کنترل‌های کمرا
   */
  getCameraControl(): CameraControl {
    return this.cameraControl;
  }

  /**
   * انتخاب یک شی
   */
  selectObject(objectId: string): void {
    this.deselectObject();
    this.selectedObjectId = objectId;
    const obj = this.visualization.getObject(objectId);
    if (obj) {
      console.log(`شی انتخاب شد: ${objectId}`);
      // تغییر رنگ یا نورانی‌کردن شی
      if (obj instanceof (require('three')).Mesh) {
        (obj.material as any).emissive.setHex(0x444444);
      }
    }
  }

  /**
   * لغو انتخاب شی
   */
  deselectObject(): void {
    if (this.selectedObjectId) {
      const obj = this.visualization.getObject(this.selectedObjectId);
      if (obj) {
        if (obj instanceof (require('three')).Mesh) {
          (obj.material as any).emissive.setHex(0x000000);
        }
      }
      this.selectedObjectId = null;
    }
  }

  /**
   * دریافت شی انتخاب‌شده
   */
  getSelectedObject(): string | null {
    return this.selectedObjectId;
  }

  /**
   * حرکت شی انتخاب‌شده
   */
  moveSelectedObject(position: [number, number, number]): void {
    if (this.selectedObjectId) {
      this.visualization.moveObject(this.selectedObjectId, position);
    }
  }

  /**
   * چرخاندن شی انتخاب‌شده
   */
  rotateSelectedObject(rotation: [number, number, number]): void {
    if (this.selectedObjectId) {
      this.visualization.rotateObject(this.selectedObjectId, rotation);
    }
  }

  /**
   * تغییر رنگ شی انتخاب‌شده
   */
  setSelectedObjectColor(color: number): void {
    if (this.selectedObjectId) {
      this.visualization.setObjectColor(this.selectedObjectId, color);
    }
  }

  /**
   * دریافت وضعیت موس
   */
  getMouseState(): MouseState {
    return { ...this.mouseState };
  }

  /**
   * دریافت وضعیت صفحه‌کلید
   */
  getKeyboardState(): KeyboardState {
    return this.keyboardState;
  }

  /**
   * بررسی اینکه کلیدی فشرده‌شده است یا نه
   */
  isKeyPressed(key: string): boolean {
    return this.keyboardState.keys.get(key.toLowerCase()) || false;
  }

  /**
   * ترخ رندرینگ (FPS)
   */
  getFrameRate(): number {
    // این می‌تواند توسط یک ردیاب جداگانه پیاده‌سازی شود
    return 60;
  }

  /**
   * فعال‌کردن / غیرفعال‌کردن رندرینگ
   */
  setRenderingEnabled(enabled: boolean): void {
    // کنترل حلقه رندرینگ
    console.log(`رندرینگ: ${enabled ? 'فعال' : 'غیرفعال'}`);
  }

  /**
   * گرفتن عکس از صحنه (Screenshot)
   */
  takeScreenshot(): string {
    const renderer = (this.visualization as any).renderer;
    return renderer.domElement.toDataURL('image/png');
  }

  /**
   * تنظیم کیفیت رندرینگ
   */
  setRenderQuality(quality: 'low' | 'medium' | 'high'): void {
    const pixelRatio =
      quality === 'low' ? 0.5 : quality === 'medium' ? 1 : 2;
    const renderer = (this.visualization as any).renderer;
    renderer.setPixelRatio(pixelRatio);
    console.log(`کیفیت رندرینگ تنظیم شد: ${quality}`);
  }

  /**
   * پاک‌کردن تمام رخدادهای
   */
  dispose(): void {
    document.removeEventListener('mousemove', this.handleMouseDrag);
    document.removeEventListener('mousedown', this.handleMouseClick);
    document.removeEventListener('mouseup', this.handleMouseDrag);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }
}

export { RenderingService };
export type { MouseState, KeyboardState, CameraControl };
