import { google } from "googleapis";
import { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } from "../config/env";
import { simpleParser } from "mailparser";

export interface ParsedEmail {
  messageId: string;
  inReplyTo: string | null;
  references: string | null;
  from: string;
  fromName: string;
  subject: string;
  text: string;
  html: string;
  date: Date;
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
    content: Buffer;
  }>;
}

export interface EmailHeaders {
  messageId: string;
  inReplyTo: string | null;
  references: string | null;
  from: string;
  fromName: string;
  subject: string;
  date: Date;
}

export class GmailAPIService {
  private gmail: any;
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET,
      "urn:ietf:wg:oauth:2.0:oob" // For installed apps
    );

    this.oauth2Client.setCredentials({
      refresh_token: GMAIL_REFRESH_TOKEN,
    });

    this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
  }

  /**
   * Search for unread emails since a specific date
   */
  async searchUnreadEmails(sinceDate?: Date): Promise<string[]> {
    try {
      let query = "is:unread";

      if (sinceDate) {
        const sinceTimestamp = Math.floor(sinceDate.getTime() / 1000);
        query += ` after:${sinceTimestamp}`;
      }

      const response = await this.gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: 50,
      });

      const messages = response.data.messages || [];
      return messages.map((msg: any) => msg.id);
    } catch (error: any) {
      console.error("Gmail API search error:", error);
      throw new Error(`Failed to search emails: ${error.message}`);
    }
  }

  /**
   * Fetch email headers only (fast, for matching)
   */
  async fetchEmailHeaders(messageId: string): Promise<EmailHeaders> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "metadata",
        metadataHeaders: [
          "Message-ID",
          "In-Reply-To",
          "References",
          "From",
          "Subject",
          "Date",
        ],
      });

      const headers = response.data.payload?.headers || [];
      const headerMap: Record<string, string> = {};

      headers.forEach((header: any) => {
        headerMap[header.name.toLowerCase()] = header.value;
      });

      // Extract message ID
      let messageIdValue = headerMap["message-id"] || "";
      if (messageIdValue && messageIdValue.startsWith("<") && messageIdValue.endsWith(">")) {
        messageIdValue = messageIdValue.slice(1, -1);
      }

      // Extract In-Reply-To
      let inReplyTo: string | null = headerMap["in-reply-to"]?.trim() || null;
      if (inReplyTo && inReplyTo.startsWith("<") && inReplyTo.endsWith(">")) {
        inReplyTo = inReplyTo.slice(1, -1);
      }

      // Extract References
      let references: string | null = headerMap["references"]?.trim() || null;

      // Extract From
      const fromHeader = headerMap["from"] || "";
      const fromMatch = fromHeader.match(/(?:^|,)\s*(?:(?:"([^"]+)")\s*)?<([^>]+)>|([^<,]+@[^>,\s]+)/i);
      const fromName = fromMatch?.[1] || fromMatch?.[3]?.trim() || "";
      const from = fromMatch?.[2] || fromMatch?.[3]?.trim() || "";

      // Extract Subject
      const subject = headerMap["subject"] || "";

      // Extract Date
      const dateHeader = headerMap["date"];
      const date = dateHeader ? new Date(dateHeader) : new Date();

      return {
        messageId: messageIdValue,
        inReplyTo,
        references,
        from,
        fromName,
        subject,
        date,
      };
    } catch (error: any) {
      console.error("Gmail API fetch headers error:", error);
      throw new Error(`Failed to fetch email headers: ${error.message}`);
    }
  }

  /**
   * Fetch full email (for parsing proposal content)
   */
  async fetchEmail(messageId: string): Promise<ParsedEmail> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "raw",
      });

      // Decode base64 email
      const rawEmail = Buffer.from(response.data.raw, "base64");
      const parsed = await simpleParser(rawEmail);

      // Extract message ID
      let messageIdValue = parsed.messageId || "";
      if (messageIdValue && messageIdValue.startsWith("<") && messageIdValue.endsWith(">")) {
        messageIdValue = messageIdValue.slice(1, -1);
      }

      // Extract In-Reply-To
      let inReplyTo: string | null = null;
      const inReplyToRaw: any = parsed.inReplyTo;
      if (inReplyToRaw) {
        if (typeof inReplyToRaw === "string") {
          inReplyTo = inReplyToRaw;
          if (inReplyTo.startsWith("<") && inReplyTo.endsWith(">")) {
            inReplyTo = inReplyTo.slice(1, -1);
          }
        } else if (Array.isArray(inReplyToRaw) && inReplyToRaw.length > 0) {
          const firstItem: any = inReplyToRaw[0];
          if (typeof firstItem === "string") {
            inReplyTo = firstItem;
            if (inReplyTo.startsWith("<") && inReplyTo.endsWith(">")) {
              inReplyTo = inReplyTo.slice(1, -1);
            }
          }
        }
      }

      // Extract References
      let references: string | null = null;
      if (parsed.references) {
        if (Array.isArray(parsed.references)) {
          references = parsed.references.join(" ");
        } else {
          references = parsed.references;
        }
      }

      return {
        messageId: messageIdValue,
        inReplyTo,
        references,
        from: parsed.from?.value[0]?.address || "",
        fromName: parsed.from?.value[0]?.name || "",
        subject: parsed.subject || "",
        text: parsed.text || "",
        html: parsed.html || "",
        date: parsed.date || new Date(),
        attachments: (parsed.attachments || []).map((att: any) => ({
          filename: att.filename || "unknown",
          contentType: att.contentType || "application/octet-stream",
          size: att.size || 0,
          content: att.content as Buffer,
        })),
      };
    } catch (error: any) {
      console.error("Gmail API fetch email error:", error);
      throw new Error(`Failed to fetch email: ${error.message}`);
    }
  }

  /**
   * Mark email as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
          removeLabelIds: ["UNREAD"],
        },
      });
    } catch (error: any) {
      console.error("Gmail API mark as read error:", error);
      throw new Error(`Failed to mark email as read: ${error.message}`);
    }
  }

  /**
   * Check if service is connected
   */
  isConnectedToServer(): boolean {
    return !!this.gmail && !!this.oauth2Client;
  }
}

