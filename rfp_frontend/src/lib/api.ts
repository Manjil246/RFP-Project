const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

export interface RFPLineItem {
  id?: string;
  itemName: string;
  quantity: number;
  specifications?: Record<string, any>;
  notes?: string;
}

export interface RFP {
  id: string;
  title: string;
  description?: string;
  budget?: string;
  deadline?: string;
  paymentTerms?: string;
  warranty?: string;
  otherTerms?: Record<string, any>;
  status: "draft" | "sent" | "in_review" | "closed";
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  lineItems?: RFPLineItem[];
}

export interface CreateRFPRequest {
  naturalLanguageText: string;
}

export interface CreateRFPResponse {
  success: boolean;
  message: string;
  data: RFP & { lineItems: RFPLineItem[] };
}

export interface GetRFPsResponse {
  success: boolean;
  message: string;
  data: (RFP & { lineItems: RFPLineItem[] })[];
}

export interface GetRFPsWithVendorCountsResponse {
  success: boolean;
  message: string;
  data: (RFP & { lineItems: RFPLineItem[]; vendorCount: number })[];
}

export interface GetRFPWithAllVendorsResponse {
  success: boolean;
  message: string;
  data: RFP & {
    lineItems: RFPLineItem[];
    sentVendors: Array<{
      vendorId: string;
      vendorName: string;
      vendorEmail: string;
      emailStatus: string;
      emailSentAt: string | null;
    }>;
    allVendors: Array<{
      id: string;
      name: string;
      email: string;
    }>;
  };
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  contactInfo?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorRequest {
  name: string;
  email: string;
  contactInfo?: Record<string, any>;
}

export interface VendorResponse {
  success: boolean;
  message: string;
  data: Vendor;
}

export interface GetVendorsResponse {
  success: boolean;
  message: string;
  data: Vendor[];
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = (await response.json()) as T;

      if (!response.ok) {
        throw new Error(
          (data as any).message || `HTTP error! status: ${response.status}`,
        );
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // RFP endpoints
  async createRFP(naturalLanguageText: string): Promise<CreateRFPResponse> {
    return this.request<CreateRFPResponse>("/rfps", {
      method: "POST",
      body: JSON.stringify({ naturalLanguageText }),
    });
  }

  async getAllRFPs(): Promise<GetRFPsResponse> {
    return this.request<GetRFPsResponse>("/rfps");
  }

  async getAllRFPsWithVendorCounts(): Promise<GetRFPsWithVendorCountsResponse> {
    return this.request<GetRFPsWithVendorCountsResponse>("/rfps/with-vendor-counts");
  }

  async getRFPByIdWithAllVendors(id: string): Promise<GetRFPWithAllVendorsResponse> {
    return this.request<GetRFPWithAllVendorsResponse>(`/rfps/${id}/with-vendors`);
  }

  async getRFPById(id: string): Promise<CreateRFPResponse> {
    return this.request<CreateRFPResponse>(`/rfps/${id}`);
  }

  async updateRFP(
    id: string,
    updates: Partial<RFP>,
  ): Promise<CreateRFPResponse> {
    return this.request<CreateRFPResponse>(`/rfps/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteRFP(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/rfps/${id}`, {
      method: "DELETE",
    });
  }

  async sendRFPToVendors(
    rfpId: string,
    vendorIds: string[],
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      success: number;
      failed: number;
      results: Array<{
        vendorId: string;
        vendorName: string;
        success: boolean;
        error?: string;
      }>;
    };
  }> {
    return this.request(`/rfps/${rfpId}/send`, {
      method: "POST",
      body: JSON.stringify({ vendorIds }),
    });
  }

  async getRFPVendors(rfpId: string): Promise<{
    success: boolean;
    message: string;
    data: Array<{
      vendorId: string;
      vendorName: string;
      vendorEmail: string;
      emailStatus: string;
      emailSentAt: string | null;
    }>;
  }> {
    return this.request(`/rfps/${rfpId}/vendors`);
  }

  // Vendor endpoints
  async createVendor(vendor: CreateVendorRequest): Promise<VendorResponse> {
    return this.request<VendorResponse>("/vendors", {
      method: "POST",
      body: JSON.stringify(vendor),
    });
  }

  async getAllVendors(): Promise<GetVendorsResponse> {
    return this.request<GetVendorsResponse>("/vendors");
  }

  async getVendorById(id: string): Promise<VendorResponse> {
    return this.request<VendorResponse>(`/vendors/${id}`);
  }

  async updateVendor(
    id: string,
    updates: Partial<CreateVendorRequest>,
  ): Promise<VendorResponse> {
    return this.request<VendorResponse>(`/vendors/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteVendor(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/vendors/${id}`,
      {
        method: "DELETE",
      },
    );
  }

  // Proposal endpoints
  async getAllProposals(): Promise<{
    success: boolean;
    message: string;
    data: (Proposal & { lineItems: ProposalLineItem[] })[];
  }> {
    return this.request("/proposals");
  }

  async getProposalById(id: string): Promise<{
    success: boolean;
    message: string;
    data: Proposal & { lineItems: ProposalLineItem[] };
  }> {
    return this.request(`/proposals/${id}`);
  }

  async getProposalsByRFPId(rfpId: string): Promise<{
    success: boolean;
    message: string;
    data: (Proposal & { lineItems: ProposalLineItem[] })[];
  }> {
    return this.request(`/proposals/rfp/${rfpId}`);
  }

  // Comparison endpoints
  async getComparisonForRFP(rfpId: string): Promise<{
    success: boolean;
    message: string;
    data: {
      rfpId: string;
      comparison: ComparisonData;
      recommendation: Recommendation;
      wasCached: boolean;
      computedAt: string;
    };
  }> {
    return this.request(`/rfps/${rfpId}/compare`);
  }

  async getComparisonStatuses(rfpIds: string[]): Promise<{
    success: boolean;
    message: string;
    data: Record<string, boolean>; // rfpId -> compared (true/false)
  }> {
    const rfpIdsParam = rfpIds.join(",");
    return this.request(`/comparisons/statuses?rfpIds=${rfpIdsParam}`);
  }

  async getRFPComparisonData(): Promise<{
    success: boolean;
    message: string;
    data: Array<{
      rfpId: string;
      rfpTitle: string;
      proposalCount: number;
      hasComparison: boolean;
      compared: boolean;
    }>;
  }> {
    return this.request("/comparisons/rfp-data");
  }

  // Stats endpoints
  async getDashboardStats(): Promise<{
    success: boolean;
    message: string;
    data: {
      rfps: number;
      vendors: number;
      proposals: number;
      comparisons: number;
    };
  }> {
    return this.request("/stats/dashboard");
  }
}

export interface ComparisonData {
  proposals: Array<{
    proposalId: string;
    vendorId: string;
    vendorName: string;
    vendorEmail: string;
    totalPrice: string | null;
    deliveryTime: string | null;
    paymentTerms: string | null;
    warranty: string | null;
    completenessScore: number | null;
    completenessScoreExplanation?: string | null;
  }>;
  comparisonTable: Array<{
    criteria: string;
    values: Record<string, string | number | null>;
    winner?: string;
  }>;
  summary: {
    totalProposals: number;
    priceRange: {
      min: string | null;
      max: string | null;
      average: string | null;
    };
    deliveryRange: {
      fastest: string | null;
      slowest: string | null;
    };
  };
}

export interface Recommendation {
  vendorId: string;
  vendorName: string;
  reasoning: string;
  score: number;
  scoreBreakdown?: {
    priceScore?: number;
    deliveryScore?: number;
    completenessScore?: number;
    termsScore?: number;
    overallScore: number;
    explanation?: string;
  };
}

export interface Proposal {
  id: string;
  rfpId: string;
  vendorId: string;
  emailSubject?: string;
  emailBody?: string;
  emailMessageId?: string;
  extractedData?: Record<string, any>;
  rawAttachments?: Record<string, any>;
  parsedAt?: string;
  createdAt: string;
  updatedAt: string;
  lineItems?: ProposalLineItem[];
  rfp?: {
    id: string;
    title: string;
  };
  vendor?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ProposalLineItem {
  id?: string;
  proposalId: string;
  rfpLineItemId?: string;
  itemName: string;
  quantity: number;
  unitPrice?: string;
  totalPrice?: string;
  specifications?: Record<string, any>;
  notes?: string;
}

export const apiClient = new ApiClient(API_URL);
