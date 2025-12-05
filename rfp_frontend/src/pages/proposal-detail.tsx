import { JSX, useEffect, useState } from "react";

import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  Mail,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import type { Proposal, ProposalLineItem } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiClient } from "@/lib/api";

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<
    (Proposal & { lineItems: ProposalLineItem[] }) | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadProposal(id);
    }
  }, [id]);

  const loadProposal = async (proposalId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.getProposalById(proposalId);
      setProposal(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to load proposal");
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

  const formatFieldName = (fieldName: string): string => {
    // Convert camelCase to human-readable format
    return fieldName
      .replace(/([A-Z])/g, " $1") // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim();
  };

  const getExtractedData = (proposal: Proposal) => {
    return (proposal.extractedData as any) || {};
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="space-y-4">
        <Link to="/proposals">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Proposals
          </Button>
        </Link>
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            {error || "Proposal not found"}
          </CardContent>
        </Card>
      </div>
    );
  }

  const extracted = getExtractedData(proposal);

  const formatObjectForDisplay = (obj: any, indent = 0): JSX.Element[] => {
    const elements: JSX.Element[] = [];
    const indentClass = indent > 0 ? `ml-${indent * 4}` : "";

    Object.entries(obj).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }

      if (typeof value === "object" && !Array.isArray(value)) {
        elements.push(
          <div key={key} className={`${indentClass} mb-2`}>
            <div className="text-sm font-medium">{formatFieldName(key)}:</div>
            <div className="ml-4 mt-1 space-y-1">
              {formatObjectForDisplay(value, indent + 1)}
            </div>
          </div>,
        );
      } else if (Array.isArray(value)) {
        elements.push(
          <div key={key} className={`${indentClass} mb-2`}>
            <div className="text-sm font-medium">{formatFieldName(key)}:</div>
            <div className="ml-4 mt-1 space-y-1">
              {value.map((item: any, idx: number) => (
                <div key={idx} className="text-sm text-muted-foreground">
                  •{" "}
                  {typeof item === "object" ?
                    JSON.stringify(item)
                  : String(item)}
                </div>
              ))}
            </div>
          </div>,
        );
      } else {
        elements.push(
          <div key={key} className={`${indentClass} mb-1 text-sm`}>
            <span className="font-medium">{formatFieldName(key)}:</span>{" "}
            <span className="text-muted-foreground">{String(value)}</span>
          </div>,
        );
      }
    });

    return elements;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/proposals">
          <Button variant="outline" size="icon" className="flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Proposal Details
          </h1>
          <p className="mt-1 text-muted-foreground">
            {proposal.emailSubject || "Vendor Proposal"}
          </p>
        </div>
      </div>

      {/* Proposal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Proposal Information</CardTitle>
          <CardDescription>AI-extracted structured data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {extracted.totalPrice && (
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Total Price</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(extracted.totalPrice)}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 text-sm">
            {extracted.deliveryTime && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <strong>Delivery Time:</strong> {extracted.deliveryTime}
                </div>
              </div>
            )}
            {extracted.paymentTerms && (
              <div>
                <strong>Payment Terms:</strong> {extracted.paymentTerms}
              </div>
            )}
            {extracted.warranty && (
              <div>
                <strong>Warranty:</strong> {extracted.warranty}
              </div>
            )}
            {extracted.completenessScore !== undefined && (
              <div>
                <strong>Completeness Score:</strong>{" "}
                {extracted.completenessScore}%
              </div>
            )}
          </div>

          {extracted.additionalTerms &&
            Object.keys(extracted.additionalTerms).length > 0 && (
              <div className="border-t border-border pt-4">
                <strong className="text-sm font-medium">
                  Additional Terms:
                </strong>
                <div className="mt-2 space-y-1">
                  {formatObjectForDisplay(extracted.additionalTerms)}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
          <CardDescription>
            {proposal.lineItems?.length || 0} item
            {proposal.lineItems?.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {proposal.lineItems && proposal.lineItems.length > 0 ?
            <div className="space-y-3">
              {proposal.lineItems.map((item, index) => (
                <div key={index} className="rounded-md border p-3 text-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.itemName}</span>
                    <span className="text-muted-foreground">
                      x{item.quantity}
                    </span>
                  </div>
                  <div className="ml-6 space-y-1">
                    {item.unitPrice && (
                      <div>
                        <strong>Unit Price:</strong>{" "}
                        {formatCurrency(item.unitPrice)}
                      </div>
                    )}
                    {item.totalPrice && (
                      <div>
                        <strong>Total:</strong>{" "}
                        {formatCurrency(item.totalPrice)}
                      </div>
                    )}
                    {item.specifications &&
                      Object.keys(item.specifications).length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {Object.entries(item.specifications).map(
                            ([key, value]) => (
                              <div key={key}>
                                <strong>{formatFieldName(key)}:</strong>{" "}
                                {String(value)}
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    {item.notes && (
                      <div className="text-xs text-muted-foreground">
                        {item.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          : <div className="py-4 text-center text-sm text-muted-foreground">
              No line items found
            </div>
          }
        </CardContent>
      </Card>

      {/* Original Email */}
      <Card>
        <CardHeader>
          <CardTitle>Original Email</CardTitle>
          <CardDescription>
            Raw email content received from vendor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Subject:</strong> {proposal.emailSubject || "N/A"}
            </div>
            <div>
              <strong>Received:</strong>{" "}
              {new Date(proposal.createdAt).toLocaleString()}
            </div>
            {proposal.parsedAt && (
              <div>
                <strong>Parsed:</strong>{" "}
                {new Date(proposal.parsedAt).toLocaleString()}
              </div>
            )}
          </div>
          <div className="mt-4 rounded-md bg-muted p-4">
            <div className="mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <strong>Email Body:</strong>
            </div>
            <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap text-sm">
              {proposal.emailBody || "No email body available"}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
