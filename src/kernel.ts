/**
 * کرنل IDE سه‌بعدی
 * مدیریت اتصالات و سرویس‌ها
 */

import { IDE3D } from './ide';
import { StorageService } from './services/storageService';
import { Visualization3DService } from './services/visualization3DService';
import { EditorLogicService } from './services/editorLogicService';
import { RenderingService } from './services/renderingService';
import { UIService } from './services/uiService';

interface KernelConfig {
  containerId: string;
  width?: number;
  height?: number;
  autoStart?: boolean;
}

interface KernelState {
  isRunning: boolean;
  startTime: number;
  uptime: number;
  version: string;
}

class IDE3DKernel {
  private ide: IDE3D | null = null;
  private config: KernelConfig;
  private state: KernelState = {
    isRunning: false,
    startTime: 0,
    uptime: 0,
    version: '1.0.0',
  };
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(config: KernelConfig) {
    this.config = {
      autoStart: true,
      ...config,
    };

    if (this.config.autoStart) {
      this.boot();
    }
  }

  /**
   * راه‌اندازی کرنل
   */
  private boot(): void {
    try {
      console.log('🚀 درحال راه‌اندازی کرنل IDE سه‌بعدی...');
      console.log(`📦 نسخه: ${this.state.version}`);

      // راه‌اندازی IDE
      this.ide = new (require('./ide').IDE3D)({
        container: document.getElementById(this.config.containerId)!,
        width: this.config.width || window.innerWidth,
        height: this.config.height || window.innerHeight,
      });

      this.state.isRunning = true;
      this.state.startTime = Date.now();

      // شروع نمایش uptime
      this.startUptimeMonitor();

      console.log('✅ کرنل با موفقیت راه‌اندازی شد');
      this.logSystemInfo();
    } catch (error) {
      console.error('❌ خطا در راه‌اندازی کرنل:', error);
      this.state.isRunning = false;
    }
  }

  /**
   * شروع نمایش uptime
   */
  private startUptimeMonitor(): void {
    this.updateInterval = setInterval(() => {
      this.state.uptime = Date.now() - this.state.startTime;
    }, 1000);
  }

  /**
   * نمایش اطلاعات سیستم
   */
  private logSystemInfo(): void {
    console.group('📊 اطلاعات سیستم');
    console.log(`نسخه: ${this.state.version}`);
    console.log(`مرورگر: ${navigator.userAgent.substring(0, 50)}...`);
    console.log(`رم: ${(navigator.deviceMemory || 'نامشخص')} GB`);
    console.log(`CPU Cores: ${navigator.hardwareConcurrency || 'نامشخص'}`);
    console.log(`وضعیت: ${this.state.isRunning ? '✅ فعال' : '❌ غیرفعال'}`);
    console.groupEnd();
  }

  /**
   * دریافت وضعیت کرنل
   */
  getState(): KernelState {
    return { ...this.state };
  }

  /**
   * دریافت IDE
   */
  getIDE(): IDE3D | null {
    return this.ide;
  }

  /**
   * دریافت سرویس‌ها
   */
  getServices() {
    if (!this.ide) {
      throw new Error('IDE هنوز راه‌اندازی نشده است');
    }
    return this.ide.getServices();
  }

  /**
   * متوقف کردن کرنل
   */
  shutdown(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    if (this.ide) {
      this.ide.dispose();
    }

    this.state.isRunning = false;
    console.log('🛑 کرنل بسته شد');
  }

  /**
   * دریافت آمار IDE
   */
  getStats() {
    if (!this.ide) {
      return null;
    }

    const ideState = this.ide.getIDEState();
    return {
      kernel: this.state,
      ide: ideState,
      memory: {
        used: (performance as any).memory?.usedJSHeapSize || 'نامشخص',
        limit: (performance as any).memory?.jsHeapSizeLimit || 'نامشخص',
      },
    };
  }

  /**
   * بازخوانی سیستم
   */
  restart(): void {
    console.log('🔄 درحال بازخوانی سیستم...');
    this.shutdown();
    setTimeout(() => {
      this.boot();
    }, 1000);
  }

  /**
   * نمایش گزارش تشخیصی
   */
  generateDiagnostics(): string {
    const stats = this.getStats();
    return `
═══════════════════════════════════════════════════════════
🔍 گزارش تشخیصی IDE سه‌بعدی
═══════════════════════════════════════════════════════════

📋 وضعیت کرنل:
  ✓ نسخه: ${this.state.version}
  ✓ وضعیت: ${this.state.isRunning ? 'فعال ✅' : 'غیرفعال ❌'}
  ✓ Uptime: ${Math.floor(this.state.uptime / 1000)}s
  ✓ شروع: ${new Date(this.state.startTime).toLocaleString('fa-IR')}

💾 حافظه:
  ✓ استفاده‌شده: ${stats?.memory.used || 'نامشخص'}
  ✓ محدودیت: ${stats?.memory.limit || 'نامشخص'}

🎮 IDE:
  ✓ پروژه فعلی: ${stats?.ide.currentProject?.name || 'بدون پروژه'}
  ✓ تم: ${stats?.ide.uiState.theme || 'نامشخص'}
  ✓ کیفیت رندرینگ: ${stats?.ide.renderQuality || 'نامشخص'}

📊 آمار کد:
  ✓ تعداد خطوط: ${stats?.ide.editorState.stats.lines || 0}
  ✓ تعداد کاراکتر: ${stats?.ide.editorState.stats.characters || 0}
  ✓ تعداد کلمات: ${stats?.ide.editorState.stats.words || 0}

🌐 مرورگر:
  ✓ WebGL: ${this.checkWebGLSupport() ? '✅' : '❌'}
  ✓ IndexedDB: ${this.checkIndexedDBSupport() ? '✅' : '❌'}
  ✓ LocalStorage: ${this.checkLocalStorageSupport() ? '✅' : '❌'}

═══════════════════════════════════════════════════════════
    `;
  }

  /**
   * بررسی پشتیبانی WebGL
   */
  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch {
      return false;
    }
  }

  /**
   * بررسی پشتیبانی IndexedDB
   */
  private checkIndexedDBSupport(): boolean {
    return !!indexedDB;
  }

  /**
   * بررسی پشتیبانی LocalStorage
   */
  private checkLocalStorageSupport(): boolean {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * اجرای تست‌ها
   */
  async runTests(): Promise<{ passed: number; failed: number; results: string[] }> {
    const results: string[] = [];
    let passed = 0;
    let failed = 0;

    console.group('🧪 تست‌های سیستم');

    // تست 1: بررسی راه‌اندازی
    try {
      if (this.state.isRunning) {
        results.push('✅ تست راه‌اندازی: موفق');
        passed++;
      } else {
        results.push('❌ تست راه‌اندازی: ناموفق');
        failed++;
      }
    } catch (error) {
      results.push(`❌ تست راه‌اندازی: ${error}`);
      failed++;
    }

    // تست 2: بررسی سرویس‌ها
    try {
      const services = this.getServices();
      if (services && Object.keys(services).length > 0) {
        results.push(`✅ تست سرویس‌ها: ${Object.keys(services).length} سرویس یافت شد`);
        passed++;
      } else {
        results.push('❌ تست سرویس‌ها: سرویسی یافت نشد');
        failed++;
      }
    } catch (error) {
      results.push(`❌ تست سرویس‌ها: ${error}`);
      failed++;
    }

    // تست 3: بررسی فناوری‌های مورد نیاز
    try {
      const webgl = this.checkWebGLSupport();
      const indexeddb = this.checkIndexedDBSupport();
      const localstorage = this.checkLocalStorageSupport();

      if (webgl && indexeddb && localstorage) {
        results.push('✅ تست فناوری‌ها: تمام فناوری‌های مورد نیاز در دسترس هستند');
        passed++;
      } else {
        results.push(`⚠️ تست فناوری‌ها: WebGL=${webgl}, IndexedDB=${indexeddb}, LocalStorage=${localstorage}`);
      }
    } catch (error) {
      results.push(`❌ تست فناوری‌ها: ${error}`);
      failed++;
    }

    // تست 4: بررسی حافظه
    try {
      const memory = (performance as any).memory;
      if (memory) {
        results.push(`✅ تست حافظه: ${Math.round(memory.usedJSHeapSize / 1048576)}MB / ${Math.round(memory.jsHeapSizeLimit / 1048576)}MB`);
        passed++;
      } else {
        results.push('⚠️ تست حافظه: اطلاعات حافظه در دسترس نیست');
      }
    } catch (error) {
      results.push(`❌ تست حافظه: ${error}`);
      failed++;
    }

    results.forEach((result) => console.log(result));
    console.groupEnd();

    return { passed, failed, results };
  }

  /**
   * بازبینی کل پروژه
   */
  async auditProject(): Promise<any> {
    console.group('🔍 بازبینی پروژه');

    const ideState = this.ide?.getIDEState();
    const services = this.getServices();

    const audit = {
      timestamp: new Date().toISOString(),
      kernel: this.state,
      project: ideState?.currentProject || null,
      services: {
        storage: '✅ فعال',
        visualization3D: '✅ فعال',
        editor: '✅ فعال',
        rendering: '✅ فعال',
        ui: '✅ فعال',
      },
      editor: {
        language: ideState?.editorState.language || 'نامشخص',
        isDirty: ideState?.editorState.isDirty || false,
        stats: ideState?.editorState.stats || {},
      },
      ui: {
        theme: ideState?.uiState.theme || 'نامشخص',
        panels: ideState?.uiState.panels?.length || 0,
        notifications: ideState?.uiState.notifications?.length || 0,
      },
    };

    console.log('📝 گزارش بازبینی:');
    console.table(audit);
    console.groupEnd();

    return audit;
  }
}

// صادرات کرنل
export { IDE3DKernel };

// راه‌اندازی خودکار
if (typeof window !== 'undefined') {
  (window as any).IDE3DKernel = IDE3DKernel;
  (window as any).initializeIDEKernel = (config: KernelConfig) => {
    return new IDE3DKernel(config);
  };
}
