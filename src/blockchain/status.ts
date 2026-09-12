/**
 * Blockchain Status Checker
 * بررسی وضعیت اتصال به بلاکچین Umbrella Network
 */

import { UmbrellaNetworkConnector } from './umbrellaConnect';

interface BlockchainStatus {
  connected: boolean;
  nodeId?: string;
  address?: string;
  chainId?: number;
  blockNumber?: number;
  balance?: string;
  gasPrice?: string;
  lastHeartbeat?: string;
  error?: string;
}

class BlockchainStatusChecker {
  private connector: UmbrellaNetworkConnector;
  private statusHistory: BlockchainStatus[] = [];
  private maxHistory: number = 100;

  constructor(config?: any) {
    this.connector = new UmbrellaNetworkConnector(config);
  }

  /**
   * بررسی وضعیت کامل
   */
  async checkFullStatus(): Promise<BlockchainStatus> {
    try {
      console.log('🔍 درحال بررسی وضعیت بلاکچین...');

      const nodeStatus = this.connector.getNodeStatus();
      const chainData = await this.connector.getChainData();
      const balance = await this.connector.getUMBBalance();

      const status: BlockchainStatus = {
        connected: nodeStatus.connected,
        nodeId: nodeStatus.nodeId,
        address: nodeStatus.address,
        chainId: chainData?.chainId,
        blockNumber: chainData?.blockNumber,
        balance: balance,
        gasPrice: chainData?.gasPrice,
        lastHeartbeat: nodeStatus.lastHeartbeat,
      };

      this.statusHistory.push(status);
      if (this.statusHistory.length > this.maxHistory) {
        this.statusHistory.shift();
      }

      console.log('✅ بررسی وضعیت تکمیل شد');
      return status;
    } catch (error) {
      const errorStatus: BlockchainStatus = {
        connected: false,
        error: String(error),
      };

      this.statusHistory.push(errorStatus);
      console.error('❌ خطا در بررسی وضعیت:', error);
      return errorStatus;
    }
  }

  /**
   * اتصال خودکار به نود
   */
  async autoConnect(retries: number = 3): Promise<boolean> {
    console.log(`🔗 درحال تلاش برای اتصال (تلاش‌های باقی‌مانده: ${retries})...`);

    for (let i = 0; i < retries; i++) {
      const connected = await this.connector.connect();
      if (connected) {
        console.log('✅ اتصال موفق');
        return true;
      }

      if (i < retries - 1) {
        console.log(`⏳ منتظر ${2000 * (i + 1)}ms قبل از تلاش دوباره...`);
        await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)));
      }
    }

    console.error('❌ اتصال ناموفق بعد از تمام تلاش‌ها');
    return false;
  }

  /**
   * نمایش وضعیت به‌طور مستمر
   */
  async monitorStatus(interval: number = 10000): Promise<void> {
    console.log(`📊 درحال مراقبت وضعیت (هر ${interval}ms)`);

    const monitor = setInterval(async () => {
      const status = await this.checkFullStatus();

      console.clear();
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║        📊 وضعیت بلاکچین Umbrella Network              ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('');

      if (status.connected) {
        console.log(`✅ وضعیت: متصل`);
        console.log(`🔗 شناسه نود: ${status.nodeId}`);
        console.log(`👤 آدرس: ${status.address}`);
        console.log(`⛓️ Chain ID: ${status.chainId}`);
        console.log(`📦 بلاک جاری: ${status.blockNumber}`);
        console.log(`💰 موجودی: ${status.balance} UMB`);
        console.log(`⛽ قیمت گاز: ${status.gasPrice} Gwei`);
        console.log(`💓 آخرین Heartbeat: ${status.lastHeartbeat}`);
      } else {
        console.log(`❌ وضعیت: قطع‌شده`);
        console.log(`⚠️ خطا: ${status.error}`);
      }

      console.log('');
      console.log(`📈 تاریخچه (آخرین ${this.statusHistory.length} رکورد):`);
      this.displayStatusHistory();
      console.log('');
      console.log(`🕐 زمان بررسی: ${new Date().toLocaleString('fa-IR')}`);
    }, interval);

    // توقف مراقبت با Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(monitor);
      console.log('\n🛑 مراقبت متوقف شد');
      process.exit(0);
    });
  }

  /**
   * نمایش تاریخچه وضعیت
   */
  private displayStatusHistory(): void {
    const recentHistory = this.statusHistory.slice(-10);

    console.table(
      recentHistory.map((status, index) => ({
        '#': index + 1,
        وضعیت: status.connected ? '✅ متصل' : '❌ قطع',
        'Chain ID': status.chainId || 'N/A',
        'بلاک': status.blockNumber || 'N/A',
        'موجودی': status.balance ? `${status.balance.substring(0, 8)}...` : 'N/A',
      }))
    );
  }

  /**
   * تست تراکنش
   */
  async testTransaction(to: string, amount: string = '0.01'): Promise<string | null> {
    console.log(`🧪 درحال تست تراکنش...`);
    console.log(`   از: ${await this.connector.getUMBBalance()}`);
    console.log(`   به: ${to}`);
    console.log(`   مقدار: ${amount} UMB`);

    const txHash = await this.connector.sendTransaction(to, amount);

    if (txHash) {
      console.log(`✅ تراکنش موفق: ${txHash}`);
    } else {
      console.log(`❌ تراکنش ناموفق`);
    }

    return txHash;
  }

  /**
   * دریافت داده‌های Oracle
   */
  async fetchOracleData(dataId: string): Promise<any> {
    console.log(`📡 درحال دریافت داده‌های Oracle (ID: ${dataId})...`);

    const data = await this.connector.getOracleData(dataId);

    if (data) {
      console.log(`✅ داده‌های Oracle دریافت شد:`, data);
    } else {
      console.log(`❌ خطا در دریافت داده‌های Oracle`);
    }

    return data;
  }

  /**
   * گزارش تفصیلی
   */
  async generateDetailedReport(): Promise<void> {
    console.clear();
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     📋 گزارش تفصیلی Umbrella Network Connector         ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    // وضعیت نود
    console.group('🔗 وضعیت نود');
    const nodeStatus = this.connector.getNodeStatus();
    console.table(nodeStatus);
    console.groupEnd();
    console.log('');

    // داده‌های بلاکچین
    console.group('⛓️ داده‌های بلاکچین');
    const chainData = await this.connector.getChainData();
    console.table(chainData);
    console.groupEnd();
    console.log('');

    // اطلاعات توکن
    console.group('💰 اطلاعات توکن UMB');
    const tokenInfo = await this.connector.getUMBTokenInfo();
    console.table(tokenInfo);
    console.groupEnd();
    console.log('');

    // تاریخچه
    console.group('📊 تاریخچه بررسی‌ها');
    this.displayStatusHistory();
    console.groupEnd();
    console.log('');

    console.log(`✅ گزارش تکمیل شد - ${new Date().toLocaleString('fa-IR')}`);
  }

  /**
   * بسته کردن اتصال
   */
  async close(): Promise<void> {
    await this.connector.disconnect();
    console.log('🔌 اتصال بسته شد');
  }
}

/**
 * اجرای برنامه مستقل
 */
async function main() {
  const checker = new BlockchainStatusChecker({
    network: process.env.BLOCKCHAIN_NETWORK || 'testnet',
    rpcUrl: process.env.RPC_URL,
    privateKey: process.env.PRIVATE_KEY,
  });

  try {
    // اتصال خودکار
    const connected = await checker.autoConnect();

    if (!connected) {
      console.error('❌ نتوانست به بلاکچین متصل شود');
      process.exit(1);
    }

    // گزارش تفصیلی
    await checker.generateDetailedReport();

    // مراقبت مستمر
    if (process.argv.includes('--monitor')) {
      await checker.monitorStatus(5000);
    }
  } catch (error) {
    console.error('❌ خطا در اجرای برنامه:', error);
    process.exit(1);
  }
}

// اجرا اگر فایل مستقل است
if (require.main === module) {
  main().catch(console.error);
}

export { BlockchainStatusChecker, BlockchainStatus };
