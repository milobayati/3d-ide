/**
 * سرویس اتصال به کرنل
 * مدیریت ارتباط آفلاین و آنلاین با کرنل Node.js
 */

interface KernelConnectionConfig {
  offlineMode?: boolean;
  kernelHost?: string;
  kernelPort?: number;
  useSSL?: boolean;
  useSSH?: boolean;
  sshKey?: string;
  sshUser?: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

interface KernelMessage {
  id: string;
  type: 'request' | 'response' | 'event';
  method?: string;
  params?: any;
  result?: any;
  error?: string;
  timestamp: number;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'offline' | 'error';

class KernelConnectionService {
  private config: Required<KernelConnectionConfig>;
  private socket: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private messageQueue: Map<string, Promise<any>> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private isOnline = navigator.onLine;

  constructor(config: KernelConnectionConfig = {}) {
    this.config = {
      offlineMode: config.offlineMode ?? process.env.OFFLINE_MODE === 'true',
      kernelHost: config.kernelHost || process.env.KERNEL_HOST || 'localhost',
      kernelPort: config.kernelPort || parseInt(process.env.KERNEL_PORT || '3000'),
      useSSL: config.useSSL ?? process.env.USE_SSL === 'true',
      useSSH: config.useSSH ?? process.env.SSH_ENABLED === 'true',
      sshKey: config.sshKey || process.env.SSH_KEY || '',
      sshUser: config.sshUser || process.env.SSH_USER || 'user',
      reconnectDelay: config.reconnectDelay || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
    };

    this.setupOnlineOfflineListeners();
  }

  /**
   * تنظیم شنوندگان آنلاین/آفلاین
   */
  private setupOnlineOfflineListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 اتصال اینترنت برقرار شد');
      this.emit('connection-online');
      if (this.config.offlineMode === false) {
        this.connect();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 اتصال اینترنت قطع شد');
      this.emit('connection-offline');
      if (this.state === 'connected') {
        this.setState('offline');
      }
    });
  }

  /**
   * تغییر وضعیت
   */
  private setState(newState: ConnectionState): void {
    if (this.state !== newState) {
      console.log(`🔄 وضعیت تغییر کرد: ${this.state} → ${newState}`);
      this.state = newState;
      this.emit('state-changed', { state: newState });
    }
  }

  /**
   * اتصال به کرنل
   */
  async connect(): Promise<boolean> {
    // اگر در حالت آفلاین باشیم
    if (this.config.offlineMode) {
      console.log('📴 حالت آفلاین فعال است');
      this.setState('offline');
      this.emit('kernel-offline-mode');
      return true;
    }

    // اگر اینترنت قطع باشد
    if (!this.isOnline) {
      console.log('⚠️ اتصال اینترنت موجود نیست');
      this.setState('offline');
      return false;
    }

    if (this.state === 'connected') {
      return true;
    }

    if (this.state === 'connecting') {
      return false;
    }

    this.setState('connecting');

    try {
      const protocol = this.config.useSSL ? 'wss' : 'ws';
      const url = `${protocol}://${this.config.kernelHost}:${this.config.kernelPort}`;

      console.log(`🔗 درحال اتصال به کرنل: ${url}`);

      this.socket = new WebSocket(url);

      return new Promise((resolve) => {
        if (!this.socket) return resolve(false);

        this.socket.onopen = () => {
          console.log('✅ اتصال به کرنل برقرار شد');
          this.setState('connected');
          this.reconnectAttempts = 0;
          this.emit('kernel-connected');
          resolve(true);
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.socket.onerror = (error) => {
          console.error('❌ خطا در اتصال:', error);
          this.setState('error');
          this.emit('kernel-error', error);
          resolve(false);
        };

        this.socket.onclose = () => {
          console.log('🔌 اتصال به کرنل قطع شد');
          this.setState('disconnected');
          this.emit('kernel-disconnected');
          this.attemptReconnect();
          resolve(false);
        };

        // مهلت زمانی 10 ثانیه
        setTimeout(() => {
          if (this.state === 'connecting') {
            console.warn('⏱️ زمان اتصال تمام شد');
            this.socket?.close();
            resolve(false);
          }
        }, 10000);
      });
    } catch (error) {
      console.error('❌ خطا در اتصال:', error);
      this.setState('error');
      this.attemptReconnect();
      return false;
    }
  }

  /**
   * تلاش مجدد برای اتصال
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('❌ حداکثر تلاش‌های اتصال مجدد به پایان رسید');
      this.setState('offline');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 تلاش اتصال مجدد ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`);

    setTimeout(() => {
      if (this.isOnline) {
        this.connect();
      }
    }, this.config.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * مدیریت پیام‌های دریافتی
   */
  private handleMessage(message: KernelMessage): void {
    console.log(`📨 پیام دریافت شد:`, message);

    if (message.type === 'response') {
      const resolver = this.messageQueue.get(message.id);
      if (resolver) {
        if (message.error) {
          console.error(`❌ خطا: ${message.error}`);
        } else {
          console.log(`✅ پاسخ دریافت شد`);
        }
      }
    } else if (message.type === 'event') {
      this.emit(message.method || 'event', message.params);
    }
  }

  /**
   * ارسال درخواست به کرنل
   */
  async request(method: string, params?: any): Promise<any> {
    // در حالت آفلاین، درخواست را ذخیره کنید
    if (this.config.offlineMode || this.state === 'offline') {
      console.log(`📦 درخواست در حالت آفلاین ذخیره شد: ${method}`);
      return { offline: true, method, params, timestamp: Date.now() };
    }

    if (this.state !== 'connected') {
      const connected = await this.connect();
      if (!connected) {
        throw new Error('نمی‌تواند به کرنل متصل شود');
      }
    }

    const id = `${method}-${Date.now()}-${Math.random()}`;
    const message: KernelMessage = {
      id,
      type: 'request',
      method,
      params,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.messageQueue.delete(id);
        reject(new Error(`زمان درخواست "${method}" تمام شد`));
      }, 30000);

      this.messageQueue.set(id, async (response: KernelMessage) => {
        clearTimeout(timeout);
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.result);
        }
      });

      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(message));
      } else {
        reject(new Error('WebSocket در حالت آماده نیست'));
      }
    });
  }

  /**
   * ارسال رویداد
   */
  async emit(eventName: string, data?: any): Promise<void> {
    const listeners = this.eventListeners.get(eventName) || [];
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (error) {
        console.error(`خطا در اجرای شنونده ${eventName}:`, error);
      }
    }
  }

  /**
   * شنیدن رویدادها
   */
  on(eventName: string, callback: Function): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)!.push(callback);
  }

  /**
   * قطع شنیدن رویداد
   */
  off(eventName: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * دریافت وضعیت اتصال
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * بررسی آنلاین بودن
   */
  isConnected(): boolean {
    return this.state === 'connected';
  }

  /**
   * بررسی آفلاین بودن
   */
  isOffline(): boolean {
    return this.state === 'offline' || !this.isOnline;
  }

  /**
   * قطع اتصال
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setState('disconnected');
    console.log('🔌 اتصال قطع شد');
  }

  /**
   * دریافت اطلاعات اتصال
   */
  getConnectionInfo(): {
    state: ConnectionState;
    host: string;
    port: number;
    useSSL: boolean;
    useSSH: boolean;
    offlineMode: boolean;
    isOnline: boolean;
    reconnectAttempts: number;
  } {
    return {
      state: this.state,
      host: this.config.kernelHost,
      port: this.config.kernelPort,
      useSSL: this.config.useSSL,
      useSSH: this.config.useSSH,
      offlineMode: this.config.offlineMode,
      isOnline: this.isOnline,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * تست اتصال
   */
  async testConnection(): Promise<{ success: boolean; latency: number }> {
    const startTime = Date.now();
    try {
      await this.request('ping');
      const latency = Date.now() - startTime;
      console.log(`✅ تست اتصال موفق: ${latency}ms`);
      return { success: true, latency };
    } catch (error) {
      console.error('❌ تست اتصال ناموفق:', error);
      return { success: false, latency: -1 };
    }
  }
}

export { KernelConnectionService };
export type { KernelConnectionConfig, KernelMessage, ConnectionState };
