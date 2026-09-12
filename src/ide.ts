/**
 * فایل اصلی اپلیکیشن IDE سه‌بعدی
 * اتصال تمام سرویس‌ها و مدیریت برنامه
 */

import { StorageService, Project, FileData } from './services/storageService';
import { Visualization3DService } from './services/visualization3DService';
import { EditorLogicService } from './services/editorLogicService';
import { RenderingService } from './services/renderingService';
import { UIService } from './services/uiService';

interface IDEConfig {
  container: HTMLElement;
  width: number;
  height: number;
}

class IDE3D {
  private config: IDEConfig;
  private storageService: StorageService;
  private visualization3D: Visualization3DService;
  private editorLogic: EditorLogicService;
  private rendering: RenderingService;
  private ui: UIService;
  private currentProject: Project | null = null;

  constructor(config: IDEConfig) {
    this.config = config;
    this.storageService = new StorageService();
    this.editorLogic = new EditorLogicService();
    this.ui = new UIService();

    // راه‌اندازی سرویس‌های سه‌بعدی
    this.visualization3D = new Visualization3DService({
      container: config.container,
      width: config.width,
      height: config.height,
      backgroundColor: 0x1a1a1a,
    });

    this.rendering = new RenderingService(this.visualization3D);

    this.initializeApp();
  }

  /**
   * راه‌اندازی اپلیکیشن
   */
  private async initializeApp(): Promise<void> {
    try {
      this.ui.showInfo('درحال راه‌اندازی IDE سه‌بعدی...');

      // راه‌اندازی پایگاه داده
      await this.storageService.initDB();
      this.ui.showSuccess('پایگاه داده آماده شد');

      // افزودن اشیاء نمونه
      this.addSampleObjects();

      // تنظیم کنترل‌ها
      this.setupControls();

      // تنظیم منوها
      this.setupMenus();

      this.ui.showSuccess('IDE سه‌بعدی با موفقیت راه‌اندازی شد!');
      this.ui.updateStatusBar('آماده برای کار');
    } catch (error) {
      this.ui.showError('خطا در راه‌اندازی اپلیکیشن');
      console.error(error);
    }
  }

  /**
   * اضافه کردن اشیاء نمونه
   */
  private addSampleObjects(): void {
    // اضافه کردن صفحه زمین
    this.visualization3D.addPlane('ground', [0, -2, 0], 20, 20, 0x444444);

    // اضافه کردن مکعب‌ها
    this.visualization3D.addCube('cube1', [-3, 0, 0], 1, 0x00ff00);
    this.visualization3D.addCube('cube2', [0, 0, 0], 1, 0x0000ff);
    this.visualization3D.addCube('cube3', [3, 0, 0], 1, 0xff0000);

    // اضافه کردن کره‌ها
    this.visualization3D.addSphere('sphere1', [-3, 3, 0], 1, 0xffff00);
    this.visualization3D.addSphere('sphere2', [3, 3, 0], 1, 0xff00ff);

    // اضافه کردن سیلندر
    this.visualization3D.addCylinder('cylinder1', [0, 0, -3], 0.5, 0.5, 2, 0x00ffff);

    this.ui.showInfo('اشیاء نمونه اضافه شدند');
  }

  /**
   * تنظیم کنترل‌ها
   */
  private setupControls(): void {
    // دکمه‌های ابزارها
    this.ui.createButton('add-cube-btn', 'افزودن مکعب', () => this.addNewCube());
    this.ui.createButton('add-sphere-btn', 'افزودن کره', () => this.addNewSphere());
    this.ui.createButton('add-cylinder-btn', 'افزودن سیلندر', () => this.addNewCylinder());
    this.ui.createButton('reset-view-btn', 'بازنشانی نمایش', () => this.rendering.resetCamera());
    this.ui.createButton('save-project-btn', 'ذخیره پروژه', () => this.saveProject());
    this.ui.createButton('load-project-btn', 'بارگذاری پروژه', () => this.loadProject());

    // تنظیمات رندرینگ
    this.ui.createButton('quality-low-btn', 'کیفیت کم', () => {
      this.rendering.setRenderQuality('low');
      this.ui.showInfo('کیفیت رندرینگ: کم');
    });

    this.ui.createButton('quality-high-btn', 'کیفیت بالا', () => {
      this.rendering.setRenderQuality('high');
      this.ui.showInfo('کیفیت رندرینگ: بالا');
    });

    // تم‌ها
    this.ui.createButton('theme-light-btn', 'تم روشن', () => {
      this.ui.setTheme('light');
    });

    this.ui.createButton('theme-dark-btn', 'تم تاریک', () => {
      this.ui.setTheme('dark');
    });
  }

  /**
   * تنظیم منوها
   */
  private setupMenus(): void {
    // بروزرسانی آیتم‌های منو
    const fileMenu = this.ui.getMenu('file-menu');
    if (fileMenu) {
      fileMenu.items[0].onClick = () => this.createNewProject();
      fileMenu.items[1].onClick = () => this.loadProject();
      fileMenu.items[2].onClick = () => this.saveProject();
    }

    const editMenu = this.ui.getMenu('edit-menu');
    if (editMenu) {
      editMenu.items[0].onClick = () => {
        if (this.editorLogic.undo()) {
          this.ui.showInfo('برگشت انجام شد');
        }
      };
      editMenu.items[1].onClick = () => {
        if (this.editorLogic.redo()) {
          this.ui.showInfo('جلو انجام شد');
        }
      };
    }
  }

  /**
   * ایجاد پروژه جدید
   */
  private createNewProject(): void {
    this.ui.showInputDialog(
      'پروژه جدید',
      'نام پروژه',
      (projectName) => {
        const newProject: Project = {
          id: `project-${Date.now()}`,
          name: projectName,
          description: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          files: [],
        };
        this.currentProject = newProject;
        this.ui.showSuccess(`پروژه "${projectName}" ایجاد شد`);
      }
    );
  }

  /**
   * ذخیره پروژه
   */
  private async saveProject(): Promise<void> {
    if (!this.currentProject) {
      this.ui.showWarning('ابتدا یک پروژه ایجاد کنید');
      return;
    }

    try {
      this.currentProject.updatedAt = Date.now();
      await this.storageService.saveProject(this.currentProject);
      this.ui.showSuccess('پروژه با موفقیت ذخیره شد');
    } catch (error) {
      this.ui.showError('خطا در ذخیره پروژه');
      console.error(error);
    }
  }

  /**
   * بارگذاری پروژه
   */
  private async loadProject(): Promise<void> {
    try {
      const projects = await this.storageService.getAllProjects();
      if (projects.length === 0) {
        this.ui.showInfo('هیچ پروژه‌ای یافت نشد');
        return;
      }
      this.currentProject = projects[0];
      this.ui.showSuccess(`پروژه "${this.currentProject.name}" بارگذاری شد`);
    } catch (error) {
      this.ui.showError('خطا در بارگذاری پروژه');
      console.error(error);
    }
  }

  /**
   * افزودن مکعب جدید
   */
  private addNewCube(): void {
    const id = `cube-${Date.now()}`;
    this.visualization3D.addCube(id, [0, 0, 0], 1, Math.random() * 0xffffff);
    this.rendering.selectObject(id);
    this.ui.showSuccess('مکعب جدید اضافه شد');
  }

  /**
   * افزودن کره جدید
   */
  private addNewSphere(): void {
    const id = `sphere-${Date.now()}`;
    this.visualization3D.addSphere(id, [0, 0, 0], 1, Math.random() * 0xffffff);
    this.rendering.selectObject(id);
    this.ui.showSuccess('کره جدید اضافه شد');
  }

  /**
   * افزودن سیلندر جدید
   */
  private addNewCylinder(): void {
    const id = `cylinder-${Date.now()}`;
    this.visualization3D.addCylinder(id, [0, 0, 0], 0.5, 0.5, 2, Math.random() * 0xffffff);
    this.rendering.selectObject(id);
    this.ui.showSuccess('سیلندر جدید اضافه شد');
  }

  /**
   * دریافت وضعیت IDE
   */
  getIDEState(): {
    currentProject: Project | null;
    editorState: any;
    uiState: any;
    renderQuality: string;
  } {
    return {
      currentProject: this.currentProject,
      editorState: this.editorLogic.getEditorState(),
      uiState: this.ui.getUIState(),
      renderQuality: 'medium',
    };
  }

  /**
   * پاک‌کردن و خروج
   */
  dispose(): void {
    this.rendering.dispose();
    this.visualization3D.dispose();
    this.ui.dispose();
    this.ui.showInfo('IDE بسته شد');
  }

  /**
   * دریافت سرویس‌ها (برای دسترسی مستقیم)
   */
  getServices() {
    return {
      storage: this.storageService,
      visualization3D: this.visualization3D,
      editor: this.editorLogic,
      rendering: this.rendering,
      ui: this.ui,
    };
  }
}

// راه‌اندازی IDE
export function initializeIDE(containerId: string): IDE3D {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container with id "${containerId}" not found`);
  }

  const ide = new IDE3D({
    container,
    width: container.clientWidth,
    height: container.clientHeight,
  });

  return ide;
}

export { IDE3D };
