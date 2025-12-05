import { ParsedEmail } from "./gmail-api.service";
import { RFPVendorRepository } from "../repositories/rfp-vendor.repository";
import { VendorRepository } from "../repositories/vendor.repository";
import { RFPRepository } from "../repositories/rfp.repository";

export interface MatchedEmail {
  rfpId: string;
  vendorId: string;
  rfpVendorId: string;
  email: ParsedEmail;
}

export class EmailMatchingService {
  private rfpVendorRepository: RFPVendorRepository;
  private vendorRepository: VendorRepository;
  private rfpRepository: RFPRepository;

  constructor() {
    this.rfpVendorRepository = new RFPVendorRepository();
    this.vendorRepository = new VendorRepository();
    this.rfpRepository = new RFPRepository();
  }



  /**
   * Match by Message-ID (In-Reply-To header)
   */
  private async matchByMessageId(messageId: string): Promise<MatchedEmail | null> {
    const rfpVendor = await this.rfpVendorRepository.getRFPVendorByMessageId(
      messageId
    );

    if (rfpVendor && rfpVendor.emailStatus === "sent") {
      return {
        rfpId: rfpVendor.rfpId,
        vendorId: rfpVendor.vendorId,
        rfpVendorId: rfpVendor.id,
        email: {} as ParsedEmail, // Will be set by caller
      };
    }

    return null;
  }


  /**
   * Main method to match email to RFP (header-based only)
   * Uses In-Reply-To and References headers for matching
   */
  async matchEmail(email: ParsedEmail): Promise<MatchedEmail | null> {
    // First check: Is sender a vendor?
    const vendor = await this.vendorRepository.getVendorByEmail(email.from);
    if (!vendor) {
      console.log(`      ❌ Sender ${email.from} is not a registered vendor`);
      return null;
    }
    console.log(`      ✓ Sender is registered vendor: ${vendor.name}`);

    // Strategy 1: Match by In-Reply-To header (most reliable)
    if (email.inReplyTo) {
      console.log(`      🔍 Trying In-Reply-To matching: ${email.inReplyTo.substring(0, 30)}...`);
      const match = await this.matchByMessageId(email.inReplyTo);
      if (match) {
        console.log(`      ✅ Matched via In-Reply-To header`);
        return { ...match, email };
      }
      console.log(`      ❌ No match via In-Reply-To`);
    }

    // Strategy 2: Match by References header (for email chains)
    if (email.references) {
      console.log(`      🔍 Trying References header matching...`);
      const messageIds = email.references.split(/\s+/);
      for (const msgId of messageIds) {
        // Clean message ID (remove < > brackets if present)
        let cleanMsgId = msgId.trim();
        if (cleanMsgId.startsWith("<") && cleanMsgId.endsWith(">")) {
          cleanMsgId = cleanMsgId.slice(1, -1);
        }
        const match = await this.matchByMessageId(cleanMsgId);
        if (match) {
          console.log(`      ✅ Matched via References header`);
          return { ...match, email };
        }
      }
      console.log(`      ❌ No match via References`);
    }

    console.log(`      ❌ No matching strategy succeeded (no In-Reply-To or References header)`);
    return null; // No match found
  }
}

