import { GmailWatchService } from "./gmail-watch.service";
import { WatchStateRepository } from "../repositories/watch-state.repository";
import { GMAIL_USER } from "../config/env";

export class WatchSchedulerService {
  private gmailWatchService: GmailWatchService;
  private watchStateRepository: WatchStateRepository;
  private renewalInterval: NodeJS.Timeout | null = null;
  private readonly RENEWAL_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.gmailWatchService = new GmailWatchService();
    this.watchStateRepository = new WatchStateRepository();
  }

  /**
   * Start the watch renewal scheduler
   * Checks and renews watch daily
   */
  async startScheduler(): Promise<void> {
    console.log("⏰ Starting watch renewal scheduler...");
    console.log(`   Renewal interval: Every 24 hours`);

    // Renew immediately on startup
    await this.checkAndRenewWatch();

    // Schedule daily renewal
    this.renewalInterval = setInterval(async () => {
      try {
        await this.checkAndRenewWatch();
      } catch (error) {
        console.error("❌ Error in scheduled watch renewal:", error);
      }
    }, this.RENEWAL_INTERVAL_MS);

    console.log("✅ Watch scheduler started");
  }

  /**
   * Stop the scheduler
   */
  stopScheduler(): void {
    if (this.renewalInterval) {
      clearInterval(this.renewalInterval);
      this.renewalInterval = null;
      console.log("🛑 Watch scheduler stopped");
    }
  }

  /**
   * Check if watch needs renewal and renew if necessary
   */
  async checkAndRenewWatch(): Promise<void> {
    try {
      console.log("\n🔄 [Watch Scheduler] Checking watch status...");
      const startTime = Date.now();

      // Get current watch state
      const currentState =
        await this.watchStateRepository.getWatchState(GMAIL_USER);
      const now = Date.now();

      // Check if renewal is needed
      if (currentState?.watchExpiration) {
        const expirationTime = currentState.watchExpiration;
        const daysUntilExpiration =
          (expirationTime - now) / (1000 * 60 * 60 * 24);

        console.log(
          `   Current expiration: ${new Date(expirationTime).toLocaleString()}`
        );
        console.log(
          `   Days until expiration: ${daysUntilExpiration.toFixed(2)}`
        );

        // Renew if less than 1 day remaining (safety margin)
        if (daysUntilExpiration < 1) {
          console.log(`   ⚠️  Watch expires soon, renewing...`);
          await this.renewWatch();
        } else {
          console.log(`   ✅ Watch is still valid, no renewal needed`);
        }
      } else {
        // No watch state found, start watch
        console.log(`   ⚠️  No watch state found, starting watch...`);
        await this.renewWatch();
      }

      const checkTime = Date.now() - startTime;
      console.log(`   ⏱️  Check completed in ${checkTime}ms\n`);
    } catch (error: any) {
      console.error("❌ Error checking watch status:", error.message);
      throw error;
    }
  }

  /**
   * Renew watch and update state
   */
  async renewWatch(): Promise<void> {
    try {
      console.log("🔔 [Watch Scheduler] Renewing watch...");
      const startTime = Date.now();

      const result = await this.gmailWatchService.startWatch();

      // Update watch state in DB
      await this.watchStateRepository.updateWatchExpiration(
        GMAIL_USER,
        parseInt(result.expiration),
        new Date()
      );

      // Update lastHistoryId if we got one from watch
      if (result.historyId) {
        await this.watchStateRepository.updateLastHistoryId(
          GMAIL_USER,
          result.historyId
        );
      }

      const renewalTime = Date.now() - startTime;
      console.log(`   ✅ Watch renewed successfully in ${renewalTime}ms`);
      console.log(
        `   📅 Next expiration: ${new Date(parseInt(result.expiration)).toLocaleString()}`
      );
    } catch (error: any) {
      console.error("❌ Failed to renew watch:", error.message);
      throw error;
    }
  }
}
