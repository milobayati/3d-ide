/**
 * سرویس منطق ویرایشگر کد
 * مدیریت فایل‌ها، Undo/Redo، و Syntax Highlighting
 */

interface EditorState {
  content: string;
  cursorPosition: number;
  language: string;
}

interface HistoryEntry {
  content: string;
  timestamp: number;
  description: string;
}

class EditorLogicService {
  private history: HistoryEntry[] = [];
  private historyIndex: number = -1;
  private currentContent: string = '';
  private currentLanguage: string = 'javascript';
  private isDirty: boolean = false;
  private syntaxHighlighter: Map<string, RegExp[]> = new Map();

  constructor() {
    this.initializeSyntaxRules();
  }

  /**
   * راه‌اندازی قوانین Syntax Highlighting
   */
  private initializeSyntaxRules(): void {
    // JavaScript/TypeScript
    this.syntaxHighlighter.set('javascript', [
      /\b(const|let|var|function|async|await|return|if|else|for|while|do|switch|case)\b/g,
      /\b(true|false|null|undefined)\b/g,
      /['"`].*?['"`]/g,
      /\/\/.*$/gm,
      /\/\*[\s\S]*?\*\//g,
    ]);

    // Python
    this.syntaxHighlighter.set('python', [
      /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|with)\b/g,
      /\b(True|False|None)\b/g,
      /['"`].*?['"`]/g,
      /#.*$/gm,
    ]);

    // HTML
    this.syntaxHighlighter.set('html', [
      /<\/?[a-zA-Z][a-zA-Z0-9]*\b[^>]*>/g,
      /\b(class|id|href|src|alt)\b/g,
      /['"`].*?['"`]/g,
      /<!--[\s\S]*?-->/g,
    ]);

    // CSS
    this.syntaxHighlighter.set('css', [
      /[.#][a-zA-Z_][a-zA-Z0-9_-]*/g,
      /\{[\s\S]*?\}/g,
      /(['"`]).*?\1/g,
      /\/\*[\s\S]*?\*\//g,
    ]);
  }

  /**
   * تعیین زبان برنامه‌نویسی
   */
  setLanguage(language: string): void {
    this.currentLanguage = language.toLowerCase();
  }

  /**
   * دریافت زبان فعلی
   */
  getLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * تنظیم محتوای کد
   */
  setContent(content: string, description: string = 'ویرایش'): void {
    this.currentContent = content;
    this.isDirty = true;
    this.addToHistory(content, description);
  }

  /**
   * دریافت محتوای فعلی
   */
  getContent(): string {
    return this.currentContent;
  }

  /**
   * اضافه کردن به تاریخچه (Undo/Redo)
   */
  private addToHistory(content: string, description: string): void {
    // حذف تاریخچه بعد از نقطه فعلی اگر کاربر قبلاً Undo کرده بود
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push({
      content,
      timestamp: Date.now(),
      description,
    });

    this.historyIndex = this.history.length - 1;

    // محدود کردن حداکثر تاریخچه به 100 مورد
    if (this.history.length > 100) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  /**
   * برگشت به عقب (Undo)
   */
  undo(): boolean {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.currentContent = this.history[this.historyIndex].content;
      this.isDirty = true;
      return true;
    }
    return false;
  }

  /**
   * رفتن به جلو (Redo)
   */
  redo(): boolean {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.currentContent = this.history[this.historyIndex].content;
      this.isDirty = true;
      return true;
    }
    return false;
  }

  /**
   * دریافت وضعیت Undo/Redo
   */
  getHistoryState(): { canUndo: boolean; canRedo: boolean } {
    return {
      canUndo: this.historyIndex > 0,
      canRedo: this.historyIndex < this.history.length - 1,
    };
  }

  /**
   * Syntax Highlighting
   */
  highlightSyntax(): Map<string, string[]> {
    const highlights = new Map<string, string[]>();
    const rules = this.syntaxHighlighter.get(this.currentLanguage) || [];

    rules.forEach((rule, index) => {
      const matches: string[] = [];
      let match;
      const regex = new RegExp(rule.source, rule.flags);

      while ((match = regex.exec(this.currentContent)) !== null) {
        matches.push(match[0]);
      }

      highlights.set(`rule-${index}`, matches);
    });

    return highlights;
  }

  /**
   * خودکامل کردن (Auto-completion)
   */
  getAutocompleteSuggestions(prefix: string): string[] {
    const suggestions = new Map<string, boolean>();

    // کلیدواژه‌های زبان
    const keywords = {
      javascript: [
        'const',
        'let',
        'var',
        'function',
        'async',
        'await',
        'return',
        'if',
        'else',
        'for',
        'while',
        'class',
        'extends',
        'import',
        'export',
      ],
      python: [
        'def',
        'class',
        'if',
        'elif',
        'else',
        'for',
        'while',
        'return',
        'import',
        'from',
        'try',
        'except',
        'with',
        'async',
        'await',
      ],
      html: [
        'div',
        'span',
        'p',
        'a',
        'button',
        'input',
        'form',
        'script',
        'link',
        'meta',
        'title',
        'body',
        'head',
      ],
      css: [
        'color',
        'background',
        'margin',
        'padding',
        'border',
        'display',
        'flex',
        'grid',
        'position',
        'width',
        'height',
      ],
    };

    // جستجو در کلیدواژه‌های مناسب
    const langKeywords = keywords[this.currentLanguage as keyof typeof keywords] || [];
    langKeywords.forEach((keyword) => {
      if (keyword.toLowerCase().startsWith(prefix.toLowerCase())) {
        suggestions.set(keyword, true);
      }
    });

    // جستجو در کدهای موجود
    const words = this.currentContent.split(/\W+/);
    words.forEach((word) => {
      if (
        word.length > prefix.length &&
        word.toLowerCase().startsWith(prefix.toLowerCase())
      ) {
        suggestions.set(word, true);
      }
    });

    return Array.from(suggestions.keys()).slice(0, 10);
  }

  /**
   * تغییر اندازه فونت
   */
  getFormattedCode(): string {
    return this.formatCode(this.currentContent);
  }

  /**
   * فرمت‌دهی خودکار کد
   */
  private formatCode(code: string): string {
    let formatted = code;

    // فرمت‌دهی ساده (تعداد spaces)
    const lines = formatted.split('\n');
    let indentLevel = 0;

    const formattedLines = lines.map((line) => {
      const trimmedLine = line.trim();

      // کاهش indent اگر خط با } شروع شود
      if (trimmedLine.startsWith('}') || trimmedLine.startsWith(']')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const indented = '  '.repeat(indentLevel) + trimmedLine;

      // افزایش indent اگر خط با { یا [ تمام شود
      if (trimmedLine.endsWith('{') || trimmedLine.endsWith('[')) {
        indentLevel++;
      }

      return indented;
    });

    return formattedLines.join('\n');
  }

  /**
   * جستجو و جایگزینی
   */
  findAndReplace(
    searchText: string,
    replaceText: string,
    replaceAll: boolean = false
  ): { count: number; newContent: string } {
    let count = 0;
    let newContent = this.currentContent;

    if (replaceAll) {
      const regex = new RegExp(searchText, 'g');
      const matches = newContent.match(regex);
      count = matches ? matches.length : 0;
      newContent = newContent.replace(regex, replaceText);
    } else {
      if (newContent.includes(searchText)) {
        newContent = newContent.replace(searchText, replaceText);
        count = 1;
      }
    }

    if (count > 0) {
      this.setContent(newContent, `جایگزینی ${count} مورد`);
    }

    return { count, newContent };
  }

  /**
   * شمارش خطوط و کاراکترها
   */
  getCodeStats(): { lines: number; characters: number; words: number } {
    const lines = this.currentContent.split('\n').length;
    const characters = this.currentContent.length;
    const words = this.currentContent.split(/\s+/).filter((w) => w.length > 0).length;

    return { lines, characters, words };
  }

  /**
   * دریافت وضعیت ویرایشگر
   */
  getEditorState(): EditorState & { isDirty: boolean; stats: any } {
    return {
      content: this.currentContent,
      cursorPosition: 0,
      language: this.currentLanguage,
      isDirty: this.isDirty,
      stats: this.getCodeStats(),
    };
  }

  /**
   * پاک‌کردن تاریخچه
   */
  clearHistory(): void {
    this.history = [];
    this.historyIndex = -1;
  }
}

export { EditorLogicService };
export type { EditorState, HistoryEntry };
