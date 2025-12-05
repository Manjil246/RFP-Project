import nodemailer from "nodemailer";
import { GMAIL_USER, GMAIL_APP_PASSWORD } from "../config/env";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailSendResult {
  messageId: string;
  response: string;
}

export class EmailService {
  async sendEmail(options: EmailOptions): Promise<EmailSendResult> {
    try {
      const mailOptions = {
        from: GMAIL_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${options.to}: ${info.messageId}`);
      
      return {
        messageId: info.messageId || "",
        response: info.response || "",
      };
    } catch (error: any) {
      console.error(`❌ Failed to send email to ${options.to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/\n\s*\n/g, "\n");
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await transporter.verify();
      console.log("✅ Email server connection verified");
      return true;
    } catch (error) {
      console.error("❌ Email server connection failed:", error);
      return false;
    }
  }
}

