import { EmailService } from "./email.service";
import { RFP } from "../models/rfp-model";
import { RFPLineItem } from "../models/rfp-line-item-model";
import { Vendor } from "../models/vendor-model";

export class RFPEmailService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  formatRFPAsEmail(
    rfp: RFP,
    lineItems: RFPLineItem[],
    vendorName: string
  ): string {
    const formatDate = (dateString?: string | null) => {
      if (!dateString) return "Not specified";
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const formatCurrency = (amount?: string | null) => {
      if (!amount) return "Not specified";
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(parseFloat(amount));
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
    .line-item { background-color: white; padding: 15px; margin-bottom: 10px; border-radius: 4px; border-left: 4px solid #2563eb; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-label { font-weight: 600; color: #6b7280; }
    .footer { background-color: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; font-size: 12px; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Request for Proposal (RFP)</h1>
      <p>Dear ${vendorName},</p>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="section-title">${rfp.title}</div>
        ${rfp.description ? `<p>${rfp.description}</p>` : ""}
      </div>

      <div class="section">
        <div class="section-title">RFP Details</div>
        <div class="info-row">
          <span class="info-label">Budget:</span>
          <span>${formatCurrency(rfp.budget)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Deadline:</span>
          <span>${formatDate(rfp.deadline)}</span>
        </div>
        ${rfp.paymentTerms ? `
        <div class="info-row">
          <span class="info-label">Payment Terms:</span>
          <span>${rfp.paymentTerms}</span>
        </div>
        ` : ""}
        ${rfp.warranty ? `
        <div class="info-row">
          <span class="info-label">Warranty Required:</span>
          <span>${rfp.warranty}</span>
        </div>
        ` : ""}
      </div>

      ${lineItems.length > 0 ? `
      <div class="section">
        <div class="section-title">Items Required</div>
        ${lineItems
          .map(
            (item) => `
          <div class="line-item">
            <strong>${item.itemName}</strong> - Quantity: ${item.quantity}
            ${item.specifications && Object.keys(item.specifications).length > 0
              ? `<div style="margin-top: 8px; font-size: 14px; color: #6b7280;">
                  ${Object.entries(item.specifications)
                    .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                    .join(", ")}
                </div>`
              : ""}
            ${item.notes ? `<div style="margin-top: 8px; font-size: 14px; color: #6b7280;">${item.notes}</div>` : ""}
          </div>
        `
          )
          .join("")}
      </div>
      ` : ""}

      <div class="section">
        <p><strong>Please submit your proposal by replying to this email.</strong></p>
        <p>Include the following in your response:</p>
        <ul>
          <li>Pricing for each item</li>
          <li>Total cost</li>
          <li>Delivery timeline</li>
          <li>Payment terms</li>
          <li>Warranty information</li>
          <li>Any additional terms or conditions</li>
        </ul>
      </div>
    </div>

    <div class="footer">
      <p>This is an automated RFP. Please reply to this email with your proposal.</p>
      <p>RFP ID: ${rfp.id}</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  async sendRFPToVendor(
    rfp: RFP,
    lineItems: RFPLineItem[],
    vendor: Vendor
  ): Promise<string> {
    // Include RFP ID in subject for matching replies
    const subject = `RFP: ${rfp.title} [RFP-ID: ${rfp.id}]`;
    const html = this.formatRFPAsEmail(rfp, lineItems, vendor.name);

    const result = await this.emailService.sendEmail({
      to: vendor.email,
      subject,
      html,
    });

    // Return messageId for storing in database
    return result.messageId;
  }
}

