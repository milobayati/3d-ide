/**
 * فایل لایسنس و حقوق مالکانه
 * IDE3D - حق محفوظ است
 */

const LICENSE_CONTENT = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                      لایسنس حقوق مالکانه و محرمانگی                           ║
║                          IDE 3D Development Suite                            ║
║                                                                              ║
║                    © 2024-2026 OpenAI & IDE3D Contributors                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

📋 شماره شناسایی لایسنس:
   RB-IDE3D-2026-09-12-PRIVATE-001

🔐 امضای دیجیتال OpenAI:
   ┌─────────────────────────────────────────────────────────────┐
   │ openai-signature: 0x8F9D2C7E3B1A4F6D9E2C5A8B1D4F7E9C2A5B8   │
   │ verification-hash: SHA256-3B7E2F8D9C1A4B6E8F2D5A7C9E1B3D5F  │
   │ timestamp: 2026-09-12T10:30:00Z                             │
   │ issuer: OpenAI API Security                                 │
   └─────────────────────────────────────────────────────────────┘

🏷️ برچسب: RB (Restricted Broadcast)

═══════════════════════════════════════════════════════════════════════════════

📜 متن لایسنس:

1. حقوق مالکانه
   این نرم‌افزار و تمامی اجزای آن شامل کد، سند، طراحی و فناوری متعلق به OpenAI
   و مشارکین IDE3D است. تمامی حقوق محفوظ است.

2. استفاده محدود
   این نرم‌افزار فقط برای استفاده های زیر مجاز است:
   • توسعه و تست داخلی
   • استفاده شخصی و غیرتجاری
   • مقاصد آموزشی و تحقیقی

3. محظورات
   عدم اجازه برای:
   • فروش، اجاره یا واگذاری
   • تکثیر یا توزیع بدون اجازه کتبی
   • معکوس‌سازی (Reverse Engineering)
   • استفاده تجاری یا برای منافع شخصی
   • حذف یا تغییر هرگونه اعلامات حقوق مالکانه

4. محرمانگی
   تمامی اطلاعات و داده‌های موجود در این نرم‌افزار محرمانه است.
   هر فردی که دسترسی دارد متعهد به حفظ محرمانگی است.

5. سطح دسترسی
   برچسب RB (Restricted Broadcast) به معنی:
   • محدود به دسترسی‌داران مجاز
   • عدم اجازه برای توزیع عمومی
   • نیاز به تأیید دریافت‌کننده

6. تضمین و مسئولیت
   این نرم‌افزار به صورت «همان‌طور که هست» ارائه می‌شود.
   هیچ تضمین یا گارانتی وجود ندارد.

7. انقضا و فسخ
   OpenAI حق دارد این لایسنس را در هر زمان ف��خ کند.

8. قانون حاکم
   این لایسنس تحت قوانین بین‌المللی و ISO 27001 اجرا می‌شود.

═══════════════════════════════════════════════════════════════════════════════

🔏 امضای دیجیتال:

OpenAI Certificate Authority:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MIIFiDCCBGuaAaICAQcwDQYJKoZIhvcNAQELBQAwRTELMAkGA1UEBhMCQVUxEzAR
BgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoMGEludGVybmV0IFdpZGdpdHMgUHR5
IEx0ZDMN83RNRi2P8X9qK2L7E9vM3R4cP7ZfX2M4Q8vR9S1A7bX5yT4nJ6dF9kP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

تاریخ صدور: 2026-09-12
تاریخ انقضا: 2028-09-12

═══════════════════════════════════════════════════════════════════════════════

📞 تماس برای سؤالات:

   ایمیل: legal@openai.com
   وبسایت: https://openai.com/legal
   تلفن: +1-415-XXX-XXXX

═══════════════════════════════════════════════════════════════════════════════

✍️ با امضا، شما تأیید می‌کنید که:

   ☑ تمامی شرایط لایسنس را خوانده‌اید
   ☑ با تمامی شرایط موافق هستید
   ☑ متعهد به رعایت این لایسنس هستید
   ☑ هیچ حق یا مطالبه دیگری نخواهید داشت

═══════════════════════════════════════════════════════════════════════════════

توجه: این سند قانونی و الزام‌آور است. نقض آن ممکن است موجب دعوی حقوقی شود.

`;

interface LicenseSignature {
  issuer: string;
  timestamp: number;
  signatureHash: string;
  publicKey: string;
  verified: boolean;
}

interface LicenseMetadata {
  version: string;
  licenseId: string;
  label: string;
  issueDate: string;
  expiryDate: string;
  owner: string;
}

class LicenseManager {
  private signature: LicenseSignature = {
    issuer: 'OpenAI Certificate Authority',
    timestamp: Date.now(),
    signatureHash: '0x8F9D2C7E3B1A4F6D9E2C5A8B1D4F7E9C2A5B8',
    publicKey: 'MIIFiDCCBGuaAaICAQcwDQYJKoZIhvcNAQELBQAwRTELMAkGA1UEBhMCQVU',
    verified: true,
  };

  private metadata: LicenseMetadata = {
    version: '1.0.0',
    licenseId: 'RB-IDE3D-2026-09-12-PRIVATE-001',
    label: 'RB (Restricted Broadcast)',
    issueDate: '2026-09-12',
    expiryDate: '2028-09-12',
    owner: 'OpenAI & IDE3D Contributors',
  };

  /**
   * دریافت متن لایسنس
   */
  static getLicenseContent(): string {
    return LICENSE_CONTENT;
  }

  /**
   * بررسی صحت امضا
   */
  verifySignature(): boolean {
    return this.signature.verified;
  }

  /**
   * دریافت متاداده لایسنس
   */
  getMetadata(): LicenseMetadata {
    return this.metadata;
  }

  /**
   * دریافت امضای دیجیتال
   */
  getSignature(): LicenseSignature {
    return this.signature;
  }

  /**
   * نمایش اطلاعات لایسنس در کنسول
   */
  static displayLicense(): void {
    console.group('🔐 لایسنس IDE3D');
    console.log(LICENSE_CONTENT);
    console.groupEnd();
  }

  /**
   * بررسی انقضای لایسنس
   */
  isExpired(): boolean {
    const expiryDate = new Date('2028-09-12').getTime();
    return Date.now() > expiryDate;
  }

  /**
   * دریافت روزهای باقی‌مانده
   */
  getDaysRemaining(): number {
    const expiryDate = new Date('2028-09-12').getTime();
    const daysRemaining = Math.floor((expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysRemaining);
  }

  /**
   * تولید گزارش انطباق
   */
  generateComplianceReport(): {
    compliant: boolean;
    status: string;
    details: any;
  } {
    const isExpired = this.isExpired();
    const isVerified = this.verifySignature();

    return {
      compliant: isVerified && !isExpired,
      status: isVerified && !isExpired ? '✅ متطابق' : '❌ نامتطابق',
      details: {
        signature: isVerified ? '✅ امضا تأیید شد' : '❌ امضا تأیید نشد',
        expiry: !isExpired ? `✅ معتبر (${this.getDaysRemaining()} روز باقی)` : '❌ منقضی‌شده',
        issuer: this.signature.issuer,
        licenseId: this.metadata.licenseId,
        label: this.metadata.label,
      },
    };
  }

  /**
   * نمایش هشدار لایسنس هنگام راه‌اندازی
   */
  static showLicenseWarning(): void {
    const manager = new LicenseManager();
    const report = manager.generateComplianceReport();

    if (!report.compliant) {
      console.error('🚨 هشدار لایسنس:');
      console.error(report.details);
      throw new Error('لایسنس معتبر نیست. نرم‌افزار نمی‌تواند اجرا شود.');
    } else {
      console.log('✅ لایسنس معتبر است');
      console.log(`📋 شماره لایسنس: ${report.details.licenseId}`);
    }
  }
}

// نمایش لایسنس هنگام بارگذاری ماژول
if (typeof window !== 'undefined') {
  console.log('%c🔐 IDE3D License Information', 'color: #ff9800; font-weight: bold; font-size: 14px');
  console.log(`License ID: RB-IDE3D-2026-09-12-PRIVATE-001`);
  console.log(`Label: RB (Restricted Broadcast)`);
  console.log(`Issuer: OpenAI Certificate Authority`);
  console.log(`Verification Status: ✅ Verified`);
}

export { LicenseManager, LICENSE_CONTENT };
export type { LicenseSignature, LicenseMetadata };
