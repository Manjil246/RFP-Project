import { google } from "googleapis";
import {
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
} from "../config/env";
import { GmailAPIService } from "./gmail-api.service";

export interface HistoryChange {
  id: string;
  messagesAdded?: Array<{
    message: {
      id: string;
      threadId: string;
    };
  }>;
  messagesDeleted?: Array<{
    message: {
      id: string;
      threadId: string;
    };
  }>;
}

export interface HistoryResponse {
  history: HistoryChange[];
  historyId: string;
  nextPageToken?: string;
}

export class GmailHistoryService {
  private gmail: any;
  private oauth2Client: any;
  private gmailAPIService: GmailAPIService;

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
    this.gmailAPIService = new GmailAPIService();
  }

  /**
   * Get history changes since a specific historyId
   * Returns list of new message IDs
   */
  async getHistoryChanges(
    startHistoryId: string
  ): Promise<{ messageIds: string[]; newHistoryId: string }> {
    try {
      console.log(
        `   📜 Fetching history changes since historyId: ${startHistoryId}`
      );
      const startTime = Date.now();

      const response = await this.gmail.users.history.list({
        userId: "me",
        startHistoryId: startHistoryId,
        historyTypes: ["messageAdded"], // Only new messages
        maxResults: 100, // Gmail API limit
      });

      const fetchTime = Date.now() - startTime;
      const historyData: HistoryResponse = response.data;

      // Extract message IDs from history
      const messageIds: string[] = [];
      if (historyData.history) {
        for (const historyRecord of historyData.history) {
          if (historyRecord.messagesAdded) {
            for (const messageAdded of historyRecord.messagesAdded) {
              messageIds.push(messageAdded.message.id);
            }
          }
        }
      }

      console.log(
        `   ✅ History fetched in ${fetchTime}ms: ${messageIds.length} new message(s) found`
      );
      console.log(`   📊 New historyId: ${historyData.historyId}`);

      return {
        messageIds,
        newHistoryId: historyData.historyId,
      };
    } catch (error: any) {
      console.error(`   ❌ Error fetching history:`, error.message);
      if (error.response?.data) {
        console.error(
          `   Error details:`,
          JSON.stringify(error.response.data, null, 2)
        );
      }
      throw new Error(`Failed to fetch history: ${error.message}`);
    }
  }

  /**
   * Get Gmail API service instance for fetching emails
   */
  getGmailAPIService(): GmailAPIService {
    return this.gmailAPIService;
  }
}
