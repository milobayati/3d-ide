/**
 * سرویس رابط کاربری (UI/UX)
 * مدیریت منوها، پانل‌ها، و ابزارهای کنترلی
 */

interface UIPanel {
  id: string;
  title: string;
  isOpen: boolean;
  position: 'left' | 'right' | 'bottom' | 'top';
  width?: number;
  height?: number;
}

interface UIButton {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
  isEnabled: boolean;
}

interface UIMenu {
  id: string;
  label: string;
  items: UIMenuItem[];
}

interface UIMenuItem {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
  separator?: boolean;
}

interface NotificationOptions {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

class UIService {
  private panels: Map<string, UIPanel> = new Map();
  private buttons: Map<string, UIButton> = new Map();
  private menus: Map<string, UIMenu> = new Map();
  private notifications: Map<string, NotificationOptions> = new Map();
  private currentTheme: 'light' | 'dark' = 'dark';
  private notificationId: number = 0;

  constructor() {
    this.initializeDefaultPanels();
    this.initializeDefaultMenus();
  }

  /**
   * راه‌اندازی پانل‌های پیش‌فرض
   */
  private initializeDefaultPanels(): void {
    this.createPanel('files-panel', 'فایل‌ها', 'left');
    this.createPanel('properties-panel', 'خصوصیات', 'right');
    this.createPanel('console-panel', 'کنسول', 'bottom');
    this.createPanel('hierarchy-panel', 'سلسله‌مراتب', 'left');
  }

  /**
   * راه‌اندازی منوهای پیش‌فرض
   */
  private initializeDefaultMenus(): void {
    this.createMenu('file-menu', 'فایل', [
      { id: 'new-file', label: 'پروژه جدید', icon: 'file-plus', onClick: () => this.log('پروژه جدید') },
      { id: 'open-file', label: 'باز کردن', icon: 'folder-open', onClick: () => this.log('باز کردن') },
      { id: 'save-file', label: 'ذخیره', icon: 'save', onClick: () => this.log('ذخیره') },
      { id: 'save-as-file', label: 'ذخیره به عنوان', icon: 'save', onClick: () => this.log('ذخیره به عنوان') },
      { separator: true, id: 'sep-1', label: '' },
      { id: 'exit', label: 'خروج', icon: 'exit', onClick: () => this.log('خروج') },
    ]);

    this.createMenu('edit-menu', 'ویرایش', [
      { id: 'undo', label: 'برگشت (Ctrl+Z)', icon: 'undo', onClick: () => this.log('برگشت') },
      { id: 'redo', label: 'جلو (Ctrl+Y)', icon: 'redo', onClick: () => this.log('جلو') },
      { separator: true, id: 'sep-1', label: '' },
      { id: 'cut', label: 'برش (Ctrl+X)', icon: 'cut', onClick: () => this.log('برش') },
      { id: 'copy', label: 'کپی (Ctrl+C)', icon: 'copy', onClick: () => this.log('کپی') },
      { id: 'paste', label: 'چسباندن (Ctrl+V)', icon: 'paste', onClick: () => this.log('چسباندن') },
    ]);

    this.createMenu('view-menu', 'نمایش', [
      { id: 'zoom-in', label: 'بزرگ‌نمایی +', icon: 'zoom-in', onClick: () => this.log('بزرگ‌نمایی') },
      { id: 'zoom-out', label: 'کوچک‌نمایی -', icon: 'zoom-out', onClick: () => this.log('کوچک‌نمایی') },
      { id: 'reset-view', label: 'بازنشانی نمایش', icon: 'reset', onClick: () => this.log('بازنشانی نمایش') },
    ]);

    this.createMenu('help-menu', 'راهنما', [
      { id: 'docs', label: 'مستندات', icon: 'book', onClick: () => this.log('مستندات') },
      { id: 'about', label: 'درباره', icon: 'info', onClick: () => this.log('درباره') },
    ]);
  }

  /**
   * ایجاد پانل جدید
   */
  createPanel(
    id: string,
    title: string,
    position: 'left' | 'right' | 'bottom' | 'top',
    width?: number,
    height?: number
  ): UIPanel {
    const panel: UIPanel = {
      id,
      title,
      isOpen: true,
      position,
      width,
      height,
    };
    this.panels.set(id, panel);
    this.log(`پانل ایجاد شد: ${title}`);
    return panel;
  }

  /**
   * باز/بسته کردن پانل
   */
  togglePanel(panelId: string): void {
    const panel = this.panels.get(panelId);
    if (panel) {
      panel.isOpen = !panel.isOpen;
      this.log(`پانل ${panel.title} ${panel.isOpen ? 'باز' : 'بسته'} شد`);
    }
  }

  /**
   * دریافت پانل
   */
  getPanel(panelId: string): UIPanel | undefined {
    return this.panels.get(panelId);
  }

  /**
   * دریافت تمام پانل‌ها
   */
  getAllPanels(): UIPanel[] {
    return Array.from(this.panels.values());
  }

  /**
   * ایجاد دکمه جدید
   */
  createButton(
    id: string,
    label: string,
    onClick: () => void,
    icon?: string
  ): UIButton {
    const button: UIButton = {
      id,
      label,
      icon,
      onClick,
      isEnabled: true,
    };
    this.buttons.set(id, button);
    return button;
  }

  /**
   * فعال/غیرفعال کردن دکمه
   */
  setButtonEnabled(buttonId: string, enabled: boolean): void {
    const button = this.buttons.get(buttonId);
    if (button) {
      button.isEnabled = enabled;
    }
  }

  /**
   * کلیک دکمه
   */
  clickButton(buttonId: string): void {
    const button = this.buttons.get(buttonId);
    if (button && button.isEnabled) {
      button.onClick();
      this.log(`دکمه کلیک شد: ${button.label}`);
    }
  }

  /**
   * دریافت دکمه
   */
  getButton(buttonId: string): UIButton | undefined {
    return this.buttons.get(buttonId);
  }

  /**
   * ایجاد منو جدید
   */
  createMenu(id: string, label: string, items: UIMenuItem[]): UIMenu {
    const menu: UIMenu = {
      id,
      label,
      items,
    };
    this.menus.set(id, menu);
    return menu;
  }

  /**
   * اجرای آیتم منو
   */
  executeMenuItem(menuId: string, itemId: string): void {
    const menu = this.menus.get(menuId);
    if (menu) {
      const item = menu.items.find((i) => i.id === itemId);
      if (item) {
        item.onClick();
        this.log(`آیتم منو اجرا شد: ${item.label}`);
      }
    }
  }

  /**
   * دریافت منو
   */
  getMenu(menuId: string): UIMenu | undefined {
    return this.menus.get(menuId);
  }

  /**
   * دریافت تمام منوها
   */
  getAllMenus(): UIMenu[] {
    return Array.from(this.menus.values());
  }

  /**
   * نمایش اعلان
   */
  showNotification(options: NotificationOptions): string {
    const id = String(this.notificationId++);
    const duration = options.duration || 3000;

    this.notifications.set(id, options);
    this.log(`اعلان ${options.type}: ${options.message}`);

    // حذف خودکار بعد از مدت زمان
    if (duration > 0) {
      setTimeout(() => {
        this.notifications.delete(id);
      }, duration);
    }

    return id;
  }

  /**
   * اعلان موفقیت
   */
  showSuccess(message: string, duration?: number): string {
    return this.showNotification({ message, type: 'success', duration });
  }

  /**
   * اعلان خطا
   */
  showError(message: string, duration?: number): string {
    return this.showNotification({ message, type: 'error', duration });
  }

  /**
   * اعلان هشدار
   */
  showWarning(message: string, duration?: number): string {
    return this.showNotification({ message, type: 'warning', duration });
  }

  /**
   * اعلان اطلاع
   */
  showInfo(message: string, duration?: number): string {
    return this.showNotification({ message, type: 'info', duration });
  }

  /**
   * حذف اعلان
   */
  dismissNotification(notificationId: string): void {
    this.notifications.delete(notificationId);
  }

  /**
   * دریافت تمام اعلان‌ها
   */
  getNotifications(): NotificationOptions[] {
    return Array.from(this.notifications.values());
  }

  /**
   * تغییر تم
   */
  setTheme(theme: 'light' | 'dark'): void {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    this.log(`تم تغییر یافت: ${theme}`);
  }

  /**
   * دریافت تم فعلی
   */
  getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }

  /**
   * نمایش دیالوگ تأیید
   */
  showConfirmDialog(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    console.log(`دیالوگ تأیید: ${title}\n${message}`);
    this.log(`دیالوگ تأیید نمایش یافت: ${title}`);
    // پیاده‌سازی واقعی توسط React/Vue/Angular انجام می‌شود
  }

  /**
   * نمایش دیالوگ ورودی
   */
  showInputDialog(
    title: string,
    placeholder: string,
    onSubmit: (value: string) => void,
    onCancel?: () => void
  ): void {
    console.log(`دیالوگ ورودی: ${title}`);
    this.log(`دیالوگ ورودی نمایش یافت: ${title}`);
  }

  /**
   * به‌روز‌رسانی نوار وضعیت
   */
  updateStatusBar(message: string): void {
    this.log(`نوار وضعیت: ${message}`);
  }

  /**
   * تنظیم عنوان صفحه
   */
  setPageTitle(title: string): void {
    document.title = title;
    this.log(`عنوان صفحه: ${title}`);
  }

  /**
   * لاگ کردن (برای کنسول)
   */
  private log(message: string): void {
    console.log(`[UI Service] ${message}`);
  }

  /**
   * دریافت گزارش کامل UI
   */
  getUIState(): {
    panels: UIPanel[];
    buttons: UIButton[];
    menus: UIMenu[];
    notifications: NotificationOptions[];
    theme: string;
  } {
    return {
      panels: Array.from(this.panels.values()),
      buttons: Array.from(this.buttons.values()),
      menus: Array.from(this.menus.values()),
      notifications: Array.from(this.notifications.values()),
      theme: this.currentTheme,
    };
  }

  /**
   * پاک‌کردن تمام المان‌های UI
   */
  dispose(): void {
    this.panels.clear();
    this.buttons.clear();
    this.menus.clear();
    this.notifications.clear();
    this.log('تمام المان‌های UI پاک شدند');
  }
}

export { UIService };
export type {
  UIPanel,
  UIButton,
  UIMenu,
  UIMenuItem,
  NotificationOptions,
};
