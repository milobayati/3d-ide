/**
 * سرویس ذخیره‌سازی پروژه‌ها و فایل‌ها
 * LocalStorage و IndexedDB را مدیریت می‌کند
 */

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  files: FileData[];
}

interface FileData {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  createdAt: number;
  updatedAt: number;
}

class StorageService {
  private dbName = 'IDE3D_DB';
  private storeName = 'projects';
  private db: IDBDatabase | null = null;

  /**
   * راه‌اندازی IndexedDB
   */
  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * ذخیره یک پروژه
   */
  async saveProject(project: Project): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(project);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * بازیابی یک پروژه
   */
  async getProject(projectId: string): Promise<Project | null> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(projectId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * دریافت تمامی پروژه‌ها
   */
  async getAllProjects(): Promise<Project[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  /**
   * حذف یک پروژه
   */
  async deleteProject(projectId: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(projectId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * ذخیره در LocalStorage (تنظیمات)
   */
  saveSettings(key: string, value: any): void {
    try {
      localStorage.setItem(`IDE3D_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('خطا در ذخیره تنظیمات:', error);
    }
  }

  /**
   * بازیابی از LocalStorage
   */
  getSettings(key: string): any {
    try {
      const item = localStorage.getItem(`IDE3D_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('خطا در بازیابی تنظیمات:', error);
      return null;
    }
  }

  /**
   * پاک‌کردن تنظیمات
   */
  clearSettings(key: string): void {
    localStorage.removeItem(`IDE3D_${key}`);
  }
}

export const storageService = new StorageService();
export type { Project, FileData };
