import { google } from "googleapis";
import {
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
  GMAIL_TOPIC_NAME,
  GMAIL_USER,
} from "../config/env";
import { WatchStateRepository } from "../repositories/watch-state.repository";

export class GmailWatchService {
  private gmail: any;
  private oauth2Client: any;
  private watchStateRepository: WatchStateRepository;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET,
      "urn:ietf:wg:oauth:2.0:oob"
    );

    this.oauth2Client.setCredentials({
      refresh_token: GMAIL_REFRESH_TOKEN,
    });

    this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
    this.watchStateRepository = new WatchStateRepository();
  }

  /**
   * Get access token from refresh token
   * This ensures we have a valid access token before making API calls
   */
  async getAccessToken(): Promise<string> {
    try {
      const { token } = await this.oauth2Client.getAccessToken();
      if (!token) {
        throw new Error("Failed to get access token");
      }
      console.log("✅ Access token obtained successfully");
      console.log(`📋 Access Token: ${token}`);
      console.log(
        `\n💡 You can use this token to manually call the watch API:`
      );
      console.log(
        `   curl -X POST "https://www.googleapis.com/gmail/v1/users/me/watch" \\`
      );
      console.log(`     -H "Authorization: Bearer ${token}" \\`);
      console.log(`     -H "Content-Type: application/json" \\`);
      console.log(
        `     -d '{"topicName": "${GMAIL_TOPIC_NAME}", "labelIds": ["INBOX"], "labelFilterBehavior": "INCLUDE"}'`
      );
      return token;
    } catch (error: any) {
      console.error("❌ Failed to get access token:", error.message);
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  /**
   * Start watching Gmail mailbox for changes
   * Must be renewed at least every 7 days (recommended: once per day)
   */
  async startWatch(): Promise<{ historyId: string; expiration: string }> {
    try {
      console.log("🔔 Starting Gmail watch...");
      console.log(`   Topic: ${GMAIL_TOPIC_NAME}`);

      // Ensure we have a valid access token before making the API call
      await this.getAccessToken();

      const response = await this.gmail.users.watch({
        userId: "me",
        requestBody: {
          topicName: GMAIL_TOPIC_NAME,
          labelIds: ["INBOX"],
          labelFilterBehavior: "INCLUDE",
        },
      });

      const historyId = response.data.historyId;
      const expiration = new Date(
        parseInt(response.data.expiration)
      ).toLocaleString();

      console.log(`✅ Gmail watch started successfully!`);
      console.log(`   History ID: ${historyId}`);
      console.log(`   Expiration: ${expiration}`);
      console.log(
        `   ⚠️  Remember to renew watch before expiration (recommended: daily)`
      );

      // Save watch state to DB
      await this.watchStateRepository.upsertWatchState({
        emailAddress: GMAIL_USER,
        lastHistoryId: historyId,
        watchExpiration: parseInt(response.data.expiration),
        lastRenewedAt: new Date(),
      });
      console.log(`   💾 Watch state saved to database`);

      return {
        historyId: historyId,
        expiration: response.data.expiration,
      };
    } catch (error: any) {
      console.error("❌ Failed to start Gmail watch:", error.message);
      if (error.response?.data) {
        console.error(
          "   Error details:",
          JSON.stringify(error.response.data, null, 2)
        );
      }
      throw new Error(`Failed to start Gmail watch: ${error.message}`);
    }
  }

  /**
   * Renew watch (call this daily to keep receiving notifications)
   */
  async renewWatch(): Promise<{ historyId: string; expiration: string }> {
    return this.startWatch();
  }
}
