import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiClient, type Proposal, type ProposalLineItem } from "@/lib/api";
import {
  Loader2,
  Mail,
  DollarSign,
  Calendar,
  CheckCircle2,
  Building2,
  User,
  Package,
} from "lucide-react";

export default function Proposals() {
  const [proposals, setProposals] = useState<
    (Proposal & { lineItems: ProposalLineItem[] })[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAllProposals();
      setProposals(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to load proposals");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount?: string | null) => {
    if (!amount) return "Not specified";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(parseFloat(amount));
    } catch {
      return amount;
    }
  };

  const getExtractedData = (proposal: Proposal) => {
    return (proposal.extractedData as any) || {};
  };

  const getCompletenessColor = (score?: number) => {
    if (!score) return "text-muted-foreground";
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-orange-400";
  };

  // Group proposals by RFP
  const proposalsByRFP = useMemo(() => {
    const grouped = new Map<
      string,
      {
        rfpId: string;
        rfpTitle: string;
        proposals: (Proposal & { lineItems: ProposalLineItem[] })[];
      }
    >();

    proposals.forEach((proposal) => {
      const rfpId = proposal.rfpId;
      const rfpTitle = proposal.rfp?.title || `RFP ${rfpId.substring(0, 8)}...`;

      if (!grouped.has(rfpId)) {
        grouped.set(rfpId, {
          rfpId,
          rfpTitle,
          proposals: [],
        });
      }

      grouped.get(rfpId)!.proposals.push(proposal);
    });

    return Array.from(grouped.values());
  }, [proposals]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Proposals</h1>
        <p className="text-muted-foreground mt-1">
          View and manage vendor proposals received via email
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : proposals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No proposals received yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Proposals will appear here when vendors reply to RFPs.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {proposalsByRFP.map((group) => (
            <div key={group.rfpId} className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h2 className="text-lg font-semibold">{group.rfpTitle}</h2>
                    <p className="text-sm text-muted-foreground">
                      {group.proposals.length} proposal{group.proposals.length !== 1 ? "s" : ""} received
                    </p>
                  </div>
                </div>
                <Link
                  to={`/rfps/${group.rfpId}`}
                  className="text-sm text-primary hover:underline"
                >
                  View RFP →
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.proposals.map((proposal) => {
                  const extracted = getExtractedData(proposal);
                  return (
                    <Link key={proposal.id} to={`/proposals/${proposal.id}`}>
                      <Card className="flex flex-col hover:border-primary/50 transition-colors cursor-pointer h-full">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {proposal.parsedAt && (
                                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                                )}
                                <CardTitle className="text-base font-medium line-clamp-2">
                                  {proposal.vendor?.name || "Vendor Proposal"}
                                </CardTitle>
                              </div>
                            </div>
                            <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-3">
                          {proposal.vendor && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-muted-foreground truncate">
                                {proposal.vendor.email}
                              </span>
                            </div>
                          )}

                          {extracted.totalPrice && (
                            <div className="flex items-center gap-3">
                              <DollarSign className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <div>
                                <div className="text-sm text-muted-foreground">Total Price</div>
                                <div className="text-xl font-semibold">
                                  {formatCurrency(extracted.totalPrice)}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="space-y-2 text-sm">
                            {extracted.deliveryTime && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" />
                                  Delivery
                                </span>
                                <span className="font-medium">{extracted.deliveryTime}</span>
                              </div>
                            )}
                            {proposal.lineItems && proposal.lineItems.length > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                  <Package className="h-3.5 w-3.5" />
                                  Items
                                </span>
                                <span className="font-medium">{proposal.lineItems.length}</span>
                              </div>
                            )}
                            {extracted.completenessScore !== undefined && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Completeness</span>
                                <span className={`font-medium ${getCompletenessColor(extracted.completenessScore)}`}>
                                  {extracted.completenessScore}%
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="mt-auto pt-3 border-t border-border">
                            <div className="text-xs text-muted-foreground">
                              Received: {new Date(proposal.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
