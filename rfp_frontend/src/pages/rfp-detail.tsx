import { useEffect, useState } from "react";

import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Loader2,
  Package,
  Send,
  Users,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import type { RFP, RFPLineItem, Vendor } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api";

export default function RFPDetail() {
  const { id } = useParams<{ id: string }>();
  const [rfp, setRfp] = useState<(RFP & { lineItems: RFPLineItem[] }) | null>(
    null,
  );
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingRFP, setSendingRFP] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sentVendorIds, setSentVendorIds] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      loadRFP(id);
      // All vendors are now loaded with the RFP details - no separate call needed!
    }
  }, [id]);

  const loadRFP = async (rfpId: string) => {
    setLoading(true);
    try {
      // Use the optimized endpoint that includes all vendor information in a single call
      const response = await apiClient.getRFPByIdWithAllVendors(rfpId);
      setRfp(response.data);

      // Extract sent vendor IDs from the included sent vendors data
      const sentIds = response.data.sentVendors
        .filter((v) => v.emailStatus === "sent")
        .map((v) => v.vendorId);
      setSentVendorIds(sentIds);

      // Set all vendors for the send dialog (no separate API call needed!)
      setVendors(response.data.allVendors);
    } catch (err: any) {
      setError(err.message || "Failed to load RFP");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSendDialog = () => {
    setSelectedVendors([]);
    setShowSendDialog(true);
    setError(null);
    // Vendors are already loaded with RFP details - no additional loading needed!
  };

  const handleSendRFP = async () => {
    if (!rfp || selectedVendors.length === 0) {
      setError("Please select at least one vendor");
      return;
    }

    setSendingRFP(true);
    setError(null);

    try {
      await apiClient.sendRFPToVendors(rfp.id, selectedVendors);
      setShowSendDialog(false);
      setSentVendorIds((prev) => [...prev, ...selectedVendors]);
      setSelectedVendors([]);
      // Reload RFP to update status
      loadRFP(rfp.id);
    } catch (err: any) {
      setError(err.message || "Failed to send RFP");
    } finally {
      setSendingRFP(false);
    }
  };

  const toggleVendorSelection = (vendorId: string) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId) ?
        prev.filter((id) => id !== vendorId)
      : [...prev, vendorId],
    );
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !rfp) {
    return (
      <div className="space-y-4">
        <Link to="/rfps">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to RFPs
          </Button>
        </Link>
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            {error || "RFP not found"}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!rfp) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <Link to="/rfps">
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {rfp.title}
            </h1>
            {rfp.description && (
              <p className="mt-1 text-muted-foreground">{rfp.description}</p>
            )}
          </div>
        </div>
        <Button onClick={handleOpenSendDialog} className="flex-shrink-0">
          <Send className="mr-2 h-4 w-4" />
          Send to Vendors
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* RFP Details */}
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>RFP Information</CardTitle>
            <CardDescription>Basic details and requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-primary/20 px-2 py-1 text-xs font-medium text-primary">
                {rfp.status}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="font-medium">
                  {new Date(rfp.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {rfp.budget && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Budget</div>
                  <div className="text-xl font-semibold">
                    {formatCurrency(rfp.budget)}
                  </div>
                </div>
              </div>
            )}

            {rfp.deadline && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Deadline</div>
                  <div className="font-medium">
                    {new Date(rfp.deadline).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            {rfp.paymentTerms && (
              <div>
                <div className="mb-1 text-sm text-muted-foreground">
                  Payment Terms
                </div>
                <div className="font-medium">{rfp.paymentTerms}</div>
              </div>
            )}

            {rfp.warranty && (
              <div>
                <div className="mb-1 text-sm text-muted-foreground">
                  Warranty Required
                </div>
                <div className="font-medium">{rfp.warranty}</div>
              </div>
            )}

            {sentVendorIds.length > 0 && (
              <div className="flex items-center gap-3 border-t border-border pt-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Sent to</div>
                  <div className="font-medium">
                    {sentVendorIds.length} vendor
                    {sentVendorIds.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Line Items
            </CardTitle>
            <CardDescription>
              {rfp.lineItems?.length || 0} item
              {rfp.lineItems?.length !== 1 ? "s" : ""} required
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rfp.lineItems && rfp.lineItems.length > 0 ?
              <div className="space-y-3">
                {rfp.lineItems.map((item, index) => (
                  <div key={index} className="rounded-md border p-3 text-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{item.itemName}</span>
                      <span className="text-muted-foreground">
                        (Qty: {item.quantity})
                      </span>
                    </div>
                    {item.specifications &&
                      Object.keys(item.specifications).length > 0 && (
                        <div className="ml-6 space-y-1 text-xs text-muted-foreground">
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
                      <div className="ml-6 mt-1 text-xs text-muted-foreground">
                        <strong>Notes:</strong> {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            : <div className="py-4 text-center text-sm text-muted-foreground">
                No line items found
              </div>
            }
          </CardContent>
        </Card>
      </div>

      {/* Other Terms */}
      {rfp.otherTerms && Object.keys(rfp.otherTerms).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Terms</CardTitle>
            <CardDescription>
              Additional requirements and conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(rfp.otherTerms).map(([key, value]) => (
                <div
                  key={key}
                  className="border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="mb-1 text-sm font-medium capitalize text-foreground">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {typeof value === "object" && value !== null ?
                      <div className="ml-4 space-y-1">
                        {Object.entries(value as Record<string, any>).map(
                          ([subKey, subValue]) => (
                            <div key={subKey}>
                              <span className="font-medium">{subKey}:</span>{" "}
                              <span>{String(subValue)}</span>
                            </div>
                          ),
                        )}
                      </div>
                    : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Send RFP Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send RFP to Vendors</DialogTitle>
            <DialogDescription>
              Select vendors to send "{rfp.title}" to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loadingVendors ?
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            : vendors.length === 0 ?
              <p className="text-sm text-muted-foreground">
                No vendors available. Please add vendors first.
              </p>
            : <div className="max-h-96 space-y-2 overflow-y-auto">
                {vendors.map((vendor) => {
                  const alreadySent = sentVendorIds.includes(vendor.id);
                  const isSelected = selectedVendors.includes(vendor.id);

                  return (
                    <div
                      key={vendor.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                        alreadySent ?
                          "cursor-not-allowed border-muted bg-muted/50 opacity-60"
                        : isSelected ?
                          "cursor-pointer border-primary bg-primary/10"
                        : "cursor-pointer hover:bg-accent"
                      }`}
                      onClick={() =>
                        !alreadySent && toggleVendorSelection(vendor.id)
                      }
                    >
                      {alreadySent ?
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      : isSelected ?
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                      }
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{vendor.name}</div>
                          {alreadySent && (
                            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              Already sent
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {vendor.email}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            }
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSendDialog(false)}
              disabled={sendingRFP}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendRFP}
              disabled={selectedVendors.length === 0 || sendingRFP}
            >
              {sendingRFP ?
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              : <>
                  <Send className="mr-2 h-4 w-4" />
                  Send to {selectedVendors.length} Vendor
                  {selectedVendors.length !== 1 ? "s" : ""}
                </>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

