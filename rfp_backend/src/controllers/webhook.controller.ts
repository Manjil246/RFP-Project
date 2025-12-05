import { Request, Response } from "express";
import { GmailHistoryService } from "../services/gmail-history.service";
import { EmailProcessorService } from "../services/email-processor.service";
import { WatchStateRepository } from "../repositories/watch-state.repository";
import { GMAIL_USER } from "../config/env";

interface QueuedNotification {
  notification: {
    emailAddress: string;
    historyId: string;
  };
  messageId: string;
  publishTime: string;
}

export class WebhookController {
  private gmailHistoryService: GmailHistoryService;
  private emailProcessorService: EmailProcessorService;
  private watchStateRepository: WatchStateRepository;
  private processingQueue: QueuedNotification[] = [];
  private isProcessing: boolean = false;
  private processedMessageIds: Set<string> = new Set(); // Track processed Pub/Sub message IDs

  constructor() {
    this.gmailHistoryService = new GmailHistoryService();
    this.emailProcessorService = new EmailProcessorService();
    this.watchStateRepository = new WatchStateRepository();
  }

  /**
   * Handle Gmail Pub/Sub webhook notifications
   * Returns 200 immediately to acknowledge, processes in background
   */
  handleGmailWebhook = async (req: Request, res: Response) => {
    console.log("\n📬 [Webhook] Notification received:");
    console.log(`   Timestamp: ${new Date().toLocaleString()}`);

    try {
      // Pub/Sub sends the notification in message.data as base64url-encoded JSON
      const message = req.body?.message;

      if (!message || !message.data) {
        console.log("   ⚠️  Invalid webhook format - no message.data");
        // Acknowledge immediately
        return res
          .status(200)
          .json({ acknowledged: true, reason: "invalid_format" });
      }

      // Decode base64url-encoded data
      const decodedData = Buffer.from(message.data, "base64").toString("utf-8");
      const notification = JSON.parse(decodedData);

      console.log("   📧 Decoded notification:");
      console.log(`      Email: ${notification.emailAddress}`);
      console.log(`      History ID: ${notification.historyId}`);
      console.log(`      Pub/Sub Message ID: ${message.messageId}`);
      console.log(`      Publish Time: ${message.publishTime}`);

      // Check if this message was already processed (deduplication)
      const pubSubMessageId = message.messageId || `unknown-${Date.now()}`;
      if (this.processedMessageIds.has(pubSubMessageId)) {
        console.log(
          `   ⏭️  Duplicate notification (already processed) - IGNORED`
        );
        return res
          .status(200)
          .json({ acknowledged: true, reason: "duplicate" });
      }

      // Mark as processed immediately to prevent duplicates
      this.processedMessageIds.add(pubSubMessageId);
      // Keep only last 1000 message IDs in memory (prevent memory leak)
      if (this.processedMessageIds.size > 1000) {
        const firstId = this.processedMessageIds.values().next().value;
        if (firstId) {
          this.processedMessageIds.delete(firstId);
        }
      }

      // Acknowledge immediately (return 200)
      res.status(200).json({
        acknowledged: true,
        messageId: pubSubMessageId,
        historyId: notification.historyId,
      });

      // Process in background (fire and forget)
      this.queueNotification({
        notification,
        messageId: pubSubMessageId,
        publishTime: message.publishTime || new Date().toISOString(),
      }).catch((error) => {
        console.error("   ❌ Error in background processing:", error);
      });

      // Don't await - return immediately
    } catch (error: any) {
      console.error("   ❌ Error handling webhook:", error);
      // Still acknowledge to prevent retries
      return res.status(200).json({ acknowledged: true, error: error.message });
    }
  };

  /**
   * Queue notification for processing
   * If processing is active, add to queue. Otherwise, start processing.
   */
  private async queueNotification(queued: QueuedNotification): Promise<void> {
    if (this.isProcessing) {
      console.log(
        `   📥 Processing active, adding to queue (queue size: ${this.processingQueue.length + 1})`
      );
      this.processingQueue.push(queued);
      return;
    }

    // Start processing immediately
    this.processNotification(queued);
  }

  /**
   * Process notification and handle queue
   */
  private async processNotification(queued: QueuedNotification): Promise<void> {
    // Set lock
    this.isProcessing = true;
    const webhookStartTime = Date.now();

    try {
      const { notification, messageId, publishTime } = queued;
      console.log(`\n   🔄 [Processing] Starting notification processing...`);
      console.log(`      Message ID: ${messageId}`);
      console.log(`      History ID: ${notification.historyId}`);

      // Get last processed historyId from DB
      const watchState = await this.watchStateRepository.getWatchState(
        notification.emailAddress || GMAIL_USER
      );
      const lastHistoryId = watchState?.lastHistoryId;

      if (!lastHistoryId) {
        console.log(
          "   ⚠️  No last historyId found - saving current as starting point"
        );
        await this.watchStateRepository.updateLastHistoryId(
          notification.emailAddress || GMAIL_USER,
          notification.historyId
        );
        return;
      }

      console.log(`   📜 Last processed historyId: ${lastHistoryId}`);
      console.log(`   📜 New historyId: ${notification.historyId}`);

      // Get history changes since last processed
      const historyStartTime = Date.now();
      const { messageIds, newHistoryId } =
        await this.gmailHistoryService.getHistoryChanges(lastHistoryId);
      const historyTime = Date.now() - historyStartTime;
      console.log(`   ⏱️  History fetched in ${historyTime}ms`);

      if (messageIds.length === 0) {
        console.log(`   ℹ️  No new messages to process`);
        // Still update historyId in case of other changes (labels, etc.)
        await this.watchStateRepository.updateLastHistoryId(
          notification.emailAddress || GMAIL_USER,
          newHistoryId
        );
        return;
      }

      console.log(`   📨 Processing ${messageIds.length} new message(s)...`);

      // Process each new message
      const processStartTime = Date.now();
      let processedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < messageIds.length; i++) {
        const emailMessageId = messageIds[i];
        try {
          await this.emailProcessorService.processEmail(emailMessageId);
          processedCount++;
        } catch (error: any) {
          errorCount++;
          console.error(
            `   ❌ Failed to process message ${i + 1}/${messageIds.length}:`,
            error.message
          );
          // Log full error for debugging
          if (error.stack) {
            console.error(`   Stack:`, error.stack);
          }
        }
      }

      const processTime = Date.now() - processStartTime;
      console.log(`   ✅ Processing completed:`);
      console.log(`      Processed: ${processedCount}/${messageIds.length}`);
      console.log(`      Errors: ${errorCount}`);
      console.log(`      Time: ${processTime}ms`);

      // Update last processed historyId
      await this.watchStateRepository.updateLastHistoryId(
        notification.emailAddress || GMAIL_USER,
        newHistoryId
      );
      console.log(`   💾 Updated last historyId: ${newHistoryId}`);

      const totalTime = Date.now() - webhookStartTime;
      console.log(`   ⏱️  Total processing time: ${totalTime}ms\n`);
    } catch (error: any) {
      const totalTime = Date.now() - webhookStartTime;
      console.error(
        `   ❌ Error processing notification after ${totalTime}ms:`,
        error
      );
      if (error.stack) {
        console.error(`   Stack:`, error.stack);
      }
    } finally {
      // Release lock
      this.isProcessing = false;

      // Process next item in queue if any
      if (this.processingQueue.length > 0) {
        const next = this.processingQueue.shift();
        if (next) {
          console.log(
            `   📤 Processing next item from queue (${this.processingQueue.length} remaining)`
          );
          // Process next item (don't await - let it run)
          this.processNotification(next).catch((error) => {
            console.error("   ❌ Error processing queued notification:", error);
          });
        }
      }
    }
  }
}
