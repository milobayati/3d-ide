/**
 * سرویس ذخیره‌سازی سه‌بعدی
 * ذخیره در سرور، GitHub و دستگاه محلی
 */

interface StorageLocation {
  local: boolean;      // ذخیره‌سازی محلی در IndexedDB
  device: boolean;     // ذخیره‌سازی در کرنل دستگاه
  github: boolean;     // ذخیره‌سازی در GitHub Gist/Repository
  server: boolean;     // ذخیره‌سازی در سرور
}

interface ProjectData {
  id: string;
  name: string;
  description: string;
  objects: any[];
  config: any;
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: string;
    author?: string;
  };
}

interface SyncStatus {
  lastSyncLocal: number;
  lastSyncDevice: number;
  lastSyncGitHub: number;
  lastSyncServer: number;
  pendingSync: boolean;
}

class TripleStorageService {
  private db: IDBDatabase | null = null;
  private dbName = 'IDE3D_Projects';
  private dbVersion = 1;
  private storeName = 'projects';
  
  private kernelConnection: any = null;
  private gitHubToken: string = '';
  private serverEndpoint: string = '';
  private syncStatus: Map<string, SyncStatus> = new Map();

  constructor(config?: {
    gitHubToken?: string;
    serverEndpoint?: string;
    kernelConnection?: any;
  }) {
    this.gitHubToken = config?.gitHubToken || '';
    this.serverEndpoint = config?.serverEndpoint || 'http://localhost:3000';
    this.kernelConnection = config?.kernelConnection;
    this.initLocalDB();
  }

  /**
   * راه‌اندازی پایگاه داده محلی (IndexedDB)
   */
  private async initLocalDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('❌ خطا در باز کردن پایگاه داده');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ پایگاه داده محلی آماده شد');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
          console.log('📦 ذخیره‌سازی محلی ایجاد شد');
        }
      };
    });
  }

  /**
   * ذخیره پروژه در سه مکان
   */
  async saveProject(
    project: ProjectData,
    locations: Partial<StorageLocation> = { local: true, device: true, github: true, server: true }
  ): Promise<{ success: boolean; locations: any }> {
    const results = {
      local: false,
      device: false,
      github: false,
      server: false,
    };

    try {
      console.log(`💾 درحال ذخیره پروژه: ${project.name}`);

      // ذخیره محلی
      if (locations.local !== false) {
        results.local = await this.saveToLocal(project);
      }

      // ذخیره در کرنل دستگاه
      if (locations.device !== false && this.kernelConnection) {
        results.device = await this.saveToDevice(project);
      }

      // ذخیره در GitHub
      if (locations.github !== false && this.gitHubToken) {
        results.github = await this.saveToGitHub(project);
      }

      // ذخیره در سرور
      if (locations.server !== false) {
        results.server = await this.saveToServer(project);
      }

      // به‌روزرسانی وضعیت همگام‌سازی
      this.updateSyncStatus(project.id, results);

      console.log('✅ پروژه با موفقیت ذخیره شد', results);
      return { success: true, locations: results };
    } catch (error) {
      console.error('❌ خطا در ذخیره پروژه:', error);
      return { success: false, locations: results };
    }
  }

  /**
   * ذخیره‌سازی محلی (IndexedDB)
   */
  private async saveToLocal(project: ProjectData): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.db) {
        console.warn('⚠️ پایگاه داده محلی در دسترس نیست');
        resolve(false);
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(project);

      request.onsuccess = () => {
        console.log(`✅ پروژه در ذخیره‌سازی محلی ذخیره شد: ${project.name}`);
        resolve(true);
      };

      request.onerror = () => {
        console.error('❌ خطا در ذخیره‌سازی محلی');
        resolve(false);
      };
    });
  }

  /**
   * ذخیره‌سازی در کرنل دستگاه
   */
  private async saveToDevice(project: ProjectData): Promise<boolean> {
    try {
      if (!this.kernelConnection || !this.kernelConnection.isConnected?.()) {
        console.warn('⚠️ اتصال به کرنل دستگاه موجود نیست');
        return false;
      }

      const response = await this.kernelConnection.request('save-project', {
        project,
        timestamp: Date.now(),
      });

      if (response.success) {
        console.log(`✅ پروژه در دستگاه ذخیره شد: ${project.name}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ خطا در ذخیره‌سازی در دستگاه:', error);
      return false;
    }
  }

  /**
   * ذخیره‌سازی در GitHub Gist
   */
  private async saveToGitHub(project: ProjectData): Promise<boolean> {
    try {
      const gistData = {
        description: `IDE3D Project: ${project.name}`,
        public: false,
        files: {
          'project.json': {
            content: JSON.stringify(project, null, 2),
          },
        },
      };

      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          Authorization: `token ${this.gitHubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gistData),
      });

      if (response.ok) {
        const gist = await response.json();
        console.log(`✅ پروژه در GitHub Gist ذخیره شد: ${gist.id}`);
        
        // ذخیره ID Gist در متاداده
        project.metadata['gistId'] = gist.id;
        
        return true;
      } else {
        console.error('❌ خطا در GitHub API:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('❌ خطا در ذخیره‌سازی در GitHub:', error);
      return false;
    }
  }

  /**
   * ذخیره‌سازی در سرور
   */
  private async saveToServer(project: ProjectData): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverEndpoint}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });

      if (response.ok) {
        console.log(`✅ پروژه در سرور ذخیره شد: ${project.name}`);
        return true;
      } else {
        console.error('❌ خطا در سرور:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('❌ خطا در ذخیره‌سازی در سرور:', error);
      return false;
    }
  }

  /**
   * بارگذاری پروژه از مکان‌های مختلف
   */
  async loadProject(
    projectId: string,
    priority: ('local' | 'device' | 'github' | 'server')[] = ['local', 'device', 'server', 'github']
  ): Promise<ProjectData | null> {
    for (const location of priority) {
      console.log(`🔄 درحال بارگذاری از ${location}...`);

      let project: ProjectData | null = null;

      switch (location) {
        case 'local':
          project = await this.loadFromLocal(projectId);
          break;
        case 'device':
          project = await this.loadFromDevice(projectId);
          break;
        case 'github':
          project = await this.loadFromGitHub(projectId);
          break;
        case 'server':
          project = await this.loadFromServer(projectId);
          break;
      }

      if (project) {
        console.log(`✅ پروژه از ${location} بارگذاری شد`);
        return project;
      }
    }

    console.warn('⚠️ پروژه در هیچ مکانی یافت نشد');
    return null;
  }

  /**
   * بارگذاری از ذخیره‌سازی محلی
   */
  private async loadFromLocal(projectId: string): Promise<ProjectData | null> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(projectId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('❌ خطا در بارگذاری محلی');
        resolve(null);
      };
    });
  }

  /**
   * بارگذاری از کرنل دستگاه
   */
  private async loadFromDevice(projectId: string): Promise<ProjectData | null> {
    try {
      if (!this.kernelConnection?.isConnected?.()) {
        return null;
      }

      const response = await this.kernelConnection.request('load-project', { projectId });
      return response?.project || null;
    } catch (error) {
      console.error('❌ خطا در بارگذاری از دستگاه:', error);
      return null;
    }
  }

  /**
   * بارگذاری از GitHub
   */
  private async loadFromGitHub(projectId: string): Promise<ProjectData | null> {
    try {
      // جستجو برای Gist براساس ID یا نام
      const response = await fetch(`https://api.github.com/gists/${projectId}`, {
        headers: {
          Authorization: `token ${this.gitHubToken}`,
        },
      });

      if (response.ok) {
        const gist = await response.json();
        const projectFile = gist.files['project.json'];
        if (projectFile) {
          return JSON.parse(projectFile.content);
        }
      }
      return null;
    } catch (error) {
      console.error('❌ خطا در بارگذاری از GitHub:', error);
      return null;
    }
  }

  /**
   * بارگذاری از سرور
   */
  private async loadFromServer(projectId: string): Promise<ProjectData | null> {
    try {
      const response = await fetch(`${this.serverEndpoint}/api/projects/${projectId}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('❌ خطا در بارگذاری از سرور:', error);
      return null;
    }
  }

  /**
   * همگام‌سازی خودکار بین مکان‌ها
   */
  async syncProject(projectId: string): Promise<void> {
    console.log(`🔄 درحال همگام‌سازی پروژه: ${projectId}`);

    const localProject = await this.loadFromLocal(projectId);
    if (!localProject) {
      console.warn('⚠️ پروژه محلی یافت نشد');
      return;
    }

    // حفظ ورژن
    localProject.metadata.version = '1.0.0';

    // ذخیره در تمام مکان‌ها
    await this.saveProject(localProject, {
      local: true,
      device: true,
      github: true,
      server: true,
    });

    console.log('✅ همگام‌سازی کامل شد');
  }

  /**
   * به‌روزرسانی وضعیت همگام‌سازی
   */
  private updateSyncStatus(projectId: string, results: any): void {
    const status: SyncStatus = {
      lastSyncLocal: results.local ? Date.now() : 0,
      lastSyncDevice: results.device ? Date.now() : 0,
      lastSyncGitHub: results.github ? Date.now() : 0,
      lastSyncServer: results.server ? Date.now() : 0,
      pendingSync: !Object.values(results).every((v: any) => v === true || v === false),
    };

    this.syncStatus.set(projectId, status);
  }

  /**
   * دریافت وضعیت همگام‌سازی
   */
  getSyncStatus(projectId: string): SyncStatus | undefined {
    return this.syncStatus.get(projectId);
  }

  /**
   * دریافت تمام پروژه‌های ذخیره‌شده
   */
  async getAllProjects(): Promise<ProjectData[]> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve([]);
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('❌ خطا در دریافت پروژه‌ها');
        resolve([]);
      };
    });
  }

  /**
   * حذف پروژه
   */
  async deleteProject(projectId: string): Promise<boolean> {
    console.log(`🗑️ درحال حذف پروژه: ${projectId}`);

    // حذف محلی
    await this.deleteFromLocal(projectId);

    // حذف از سرور
    try {
      await fetch(`${this.serverEndpoint}/api/projects/${projectId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('⚠️ خطا در حذف از سرور:', error);
    }

    // حذف از دستگاه
    if (this.kernelConnection?.isConnected?.()) {
      try {
        await this.kernelConnection.request('delete-project', { projectId });
      } catch (error) {
        console.error('⚠️ خطا در حذف از دستگاه:', error);
      }
    }

    console.log('✅ پروژه حذف شد');
    return true;
  }

  /**
   * حذف محلی
   */
  private async deleteFromLocal(projectId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(false);
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(projectId);

      request.onsuccess = () => {
        console.log(`✅ پروژه از ذخیره‌سازی محلی حذف شد`);
        resolve(true);
      };

      request.onerror = () => {
        console.error('❌ خطا در حذف محلی');
        resolve(false);
      };
    });
  }

  /**
   * دریافت آمار ذخیره‌سازی
   */
  async getStorageStats(): Promise<{
    local: number;
    device: number;
    github: number;
    server: number;
  }> {
    const projects = await this.getAllProjects();
    
    return {
      local: projects.length,
      device: projects.length, // تقریبی
      github: 0, // نیاز به API دیگر
      server: 0, // نیاز به API دیگر
    };
  }
}

export { TripleStorageService };
export type { ProjectData, StorageLocation, SyncStatus };
