import { App } from "./app";
import { connectDB } from "./database/sql-db";
import { PORT, ENABLE_NGROK, NGROK_AUTHTOKEN } from "./config/env";
import { GmailWatchService } from "./services/gmail-watch.service";
import { WatchSchedulerService } from "./services/watch-scheduler.service";
import * as ngrok from "@ngrok/ngrok";

const gmailWatchService = new GmailWatchService();
const watchSchedulerService = new WatchSchedulerService();

async function startServer() {
  try {
    // Connect to PostgreSQL database
    await connectDB();

    // Initialize Express app
    const app = new App();

    const server = app.getApp().listen(PORT, async () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);

      // Start ngrok tunnel if enabled
      if (ENABLE_NGROK && NGROK_AUTHTOKEN) {
        try {
          // Create ngrok listener with authtoken
          const listener = await ngrok.forward({
            addr: PORT,
            authtoken: NGROK_AUTHTOKEN,
          });

          console.log(`🌐 ngrok tunnel active: ${listener.url()}`);
          console.log(`   Use this URL for webhooks/OAuth callbacks`);
        } catch (ngrokError: any) {
          console.error("❌ Failed to start ngrok:", ngrokError.message);
          if (ngrokError.response) {
            console.error("   Response:", ngrokError.response);
          }
          console.log("   Continuing without ngrok...");
        }
      }
    });

    // Start Gmail watch (Pub/Sub notifications)
    try {
      await gmailWatchService.startWatch();
      console.log("✅ Gmail watch initialized");
    } catch (error) {
      console.error("⚠️  Gmail watch failed to start:", error);
      console.log(
        "📧 Webhook notifications will not work until watch is started"
      );
    }

    // Start watch renewal scheduler (runs daily)
    try {
      await watchSchedulerService.startScheduler();
      console.log("✅ Watch scheduler started (auto-renewal enabled)");
    } catch (error) {
      console.error("⚠️  Watch scheduler failed to start:", error);
      console.log("📧 Manual watch renewal may be required");
    }

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      console.log("🛑 SIGTERM received, shutting down gracefully");
      if (ENABLE_NGROK) {
        try {
          await ngrok.disconnect();
        } catch (error) {
          // Ignore ngrok errors during shutdown
        }
      }
      watchSchedulerService.stopScheduler();
      // Gmail watch doesn't need explicit stop (expires automatically)
      server.close(() => {
        process.exit(0);
      });
    });

    process.on("SIGINT", async () => {
      console.log("🛑 SIGINT received, shutting down gracefully");
      if (ENABLE_NGROK) {
        try {
          await ngrok.disconnect();
        } catch (error) {
          // Ignore ngrok errors during shutdown
        }
      }
      watchSchedulerService.stopScheduler();
      // Gmail watch doesn't need explicit stop (expires automatically)
      server.close(() => {
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
