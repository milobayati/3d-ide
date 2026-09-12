/**
 * فایل اصلی برنامه
 * نقطه ورودی IDE سه‌بعدی
 */

import { IDE3DKernel } from './kernel';
import { KernelConnectionService } from './services/kernelConnectionService';
import { TripleStorageService } from './services/tripleStorageService';
import { LicenseManager } from './LICENSE';

// بررسی لایسنس هنگام راه‌اندازی
LicenseManager.showLicenseWarning();

interface IDEConfig {
  containerId: string;
  width?: number;
  height?: number;
  offlineMode?: boolean;
  kernelHost?: string;
  kernelPort?: number;
  useSSL?: boolean;
  gitHubToken?: string;
}

class IDE3D {
  private kernel: IDE3DKernel | null = null;
  private kernelConnection: KernelConnectionService | null = null;
  private storage: TripleStorageService | null = null;
  private config: IDEConfig;

  constructor(config: IDEConfig) {
    this.config = config;
    this.initialize();
  }

  /**
   * راه‌اندازی IDE
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🚀 درحال راه‌اندازی IDE سه‌بعدی...');

      // راه‌اندازی کرنل
      this.kernel = new IDE3DKernel({
        containerId: this.config.containerId,
        width: this.config.width,
        height: this.config.height,
        autoStart: true,
      });

      // راه‌اندازی اتصال به کرنل
      this.kernelConnection = new KernelConnectionService({
        offlineMode: this.config.offlineMode || false,
        kernelHost: this.config.kernelHost,
        kernelPort: this.config.kernelPort,
        useSSL: this.config.useSSL || false,
      });

      // راه‌اندازی سرویس ذخیره‌سازی
      this.storage = new TripleStorageService({
        gitHubToken: this.config.gitHubToken,
        kernelConnection: this.kernelConnection,
      });

      // شنیدن رویدادهای اتصال
      this.setupEventListeners();

      console.log('✅ IDE با موفقیت راه‌اندازی شد');
      this.showStartupInfo();
    } catch (error) {
      console.error('❌ خطا در راه‌اندازی IDE:', error);
      throw error;
    }
  }

  /**
   * تنظیم شنوندگان رویدادها
   */
  private setupEventListeners(): void {
    if (!this.kernelConnection) return;

    this.kernelConnection.on('kernel-connected', () => {
      console.log('🔗 کرنل متصل شد');
      this.showConnectionStatus();
    });

    this.kernelConnection.on('kernel-disconnected', () => {
      console.log('🔌 کرنل قطع شد');
      this.showConnectionStatus();
    });

    this.kernelConnection.on('connection-online', () => {
      console.log('🌐 اتصال آنلاین برقرار شد');
    });

    this.kernelConnection.on('connection-offline', () => {
      console.log('📴 حالت آفلاین فعال شد');
    });
  }

  /**
   * نمایش اطلاعات راه‌اندازی
   */
  private showStartupInfo(): void {
    console.group('📊 اطلاعات راه‌اندازی');
    console.log(`📦 نسخه: ${this.kernel?.getState().version}`);
    console.log(`🔌 وضعیت اتصال: ${this.kernelConnection?.getState()}`);
    console.log(`🌐 حالت آفلاین: ${this.config.offlineMode ? '✅ فعال' : '❌ غیرفعال'}`);
    console.log(`📍 موقعیت کرنل: ${this.config.kernelHost}:${this.config.kernelPort}`);
    console.groupEnd();
  }

  /**
   * نمایش وضعیت اتصال
   */
  private showConnectionStatus(): void {
    if (!this.kernelConnection) return;

    const status = this.kernelConnection.getConnectionInfo();
    console.table({
      'وضعیت': status.state,
      'آنلاین': status.isOnline ? '✅' : '❌',
      'تلاش‌های اتصال': status.reconnectAttempts,
      'درخواست‌های پنهان': '0',
    });
  }

  /**
   * اتصال به کرنل
   */
  async connectToKernel(): Promise<boolean> {
    if (!this.kernelConnection) return false;
    return await this.kernelConnection.connect();
  }

  /**
   * قطع اتصال
   */
  disconnectFromKernel(): void {
    if (this.kernelConnection) {
      this.kernelConnection.disconnect();
    }
  }

  /**
   * ذخیره پروژه
   */
  async saveProject(projectData: any): Promise<any> {
    if (!this.storage) return null;
    return await this.storage.saveProject(projectData);
  }

  /**
   * بارگذاری پروژه
   */
  async loadProject(projectId: string): Promise<any> {
    if (!this.storage) return null;
    return await this.storage.loadProject(projectId);
  }

  /**
   * دریافت تمام پروژه‌ها
   */
  async getAllProjects(): Promise<any[]> {
    if (!this.storage) return [];
    return await this.storage.getAllProjects();
  }

  /**
   * دریافت وضعیت سیستم
   */
  async getSystemStatus(): Promise<any> {
    return {
      kernel: this.kernel?.getState(),
      connection: this.kernelConnection?.getConnectionInfo(),
      storage: await this.storage?.getStorageStats(),
      timestamp: Date.now(),
    };
  }

  /**
   * اجرای تست‌های سیستم
   */
  async runDiagnostics(): Promise<any> {
    console.log('🧪 درحال اجرای تست‌های تشخیصی...');

    const results = {
      kernel: await this.kernel?.runTests(),
      connectionTest: await this.kernelConnection?.testConnection(),
      systemStatus: await this.getSystemStatus(),
    };

    console.log('✅ تست‌های تشخیصی تکمیل شد', results);
    return results;
  }

  /**
   * نمایش گزارش کامل
   */
  showFullReport(): void {
    console.log('📋 گزارش کامل سیستم');
    console.log('═══════════════════════════════════════════════════════════');
    
    // گزارش کرنل
    console.group('🔧 کرنل');
    const kernelState = this.kernel?.getState();
    console.table(kernelState);
    console.groupEnd();

    // گزارش اتصال
    console.group('🔗 اتصال');
    const connectionInfo = this.kernelConnection?.getConnectionInfo();
    console.table(connectionInfo);
    console.groupEnd();

    // گزارش لایسنس
    console.group('🔐 لایسنس');
    const licenseReport = new LicenseManager().generateComplianceReport();
    console.table(licenseReport.details);
    console.groupEnd();

    console.log('═══════════════════════════════════════════════════════════');
  }

  /**
   * بسته کردن IDE
   */
  async shutdown(): Promise<void> {
    console.log('🛑 درحال بسته کردن IDE...');

    if (this.kernelConnection) {
      this.kernelConnection.disconnect();
    }

    if (this.kernel) {
      this.kernel.shutdown();
    }

    console.log('✅ IDE بسته شد');
  }
}

// صادرات اصلی
export { IDE3D };

// راه‌اندازی خودکار
if (typeof window !== 'undefined') {
  (window as any).IDE3D = IDE3D;

  // نمایش پیام خوش‌آمدگویی
  console.log('%c🎨 IDE3D - نرم‌افزار طراحی سه‌بعدی', 'color: #2196F3; font-weight: bold; font-size: 16px');
  console.log('%cبرنامه‌ای حرفه‌ای برای طراحی و تطویر پروژه‌های سه‌بعدی', 'color: #666; font-style: italic');
  console.log('%c© 2024-2026 OpenAI & IDE3D Contributors | RB Label', 'color: #999; font-size: 12px');
}
