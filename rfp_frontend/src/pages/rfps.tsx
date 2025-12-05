import { useEffect, useState } from "react";

import { Calendar, FileText, Loader2, Plus } from "lucide-react";
import { Link } from "react-router-dom";

import type { RFP, RFPLineItem } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";

export default function RFPs() {
  const [naturalLanguageText, setNaturalLanguageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [rfps, setRfps] = useState<(RFP & { lineItems: RFPLineItem[] })[]>([]);
  const [loadingRFPs, setLoadingRFPs] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rfpVendorsMap, setRfpVendorsMap] = useState<Record<string, string[]>>(
    {},
  );

  useEffect(() => {
    loadRFPs();
  }, []);

  const loadRFPs = async () => {
    setLoadingRFPs(true);
    try {
      const response = await apiClient.getAllRFPs();
      setRfps(response.data);

      // Load vendors for each RFP
      const vendorsMap: Record<string, string[]> = {};
      for (const rfp of response.data) {
        try {
          const vendorsResponse = await apiClient.getRFPVendors(rfp.id);
          vendorsMap[rfp.id] = vendorsResponse.data
            .filter((v) => v.emailStatus === "sent")
            .map((v) => v.vendorId);
        } catch (err) {
          console.error(`Failed to load vendors for RFP ${rfp.id}:`, err);
          vendorsMap[rfp.id] = [];
        }
      }
      setRfpVendorsMap(vendorsMap);
    } catch (err: any) {
      setError(err.message || "Failed to load RFPs");
    } finally {
      setLoadingRFPs(false);
    }
  };

  const handleCreateRFP = async () => {
    if (!naturalLanguageText.trim()) {
      setError("Please enter a description");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.createRFP(naturalLanguageText);
      setNaturalLanguageText("");
      setSuccess("RFP created successfully!");
      setShowCreateDialog(false);
      loadRFPs(); // Reload list
    } catch (err: any) {
      setError(err.message || "Failed to create RFP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">RFPs</h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage your Requests for Proposals
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create RFP
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
          {success}
        </div>
      )}

      {/* RFPs List */}
      <div>
        {loadingRFPs ?
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        : rfps.length === 0 ?
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-3 h-12 w-12 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                No RFPs yet. Click the "Create RFP" button to get started.
              </p>
            </CardContent>
          </Card>
        : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rfps.map((rfp) => (
              <Link key={rfp.id} to={`/rfps/${rfp.id}`}>
                <Card className="flex h-full cursor-pointer flex-col transition-colors hover:border-primary/50">
                  <CardHeader className="pb-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Created {new Date(rfp.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="mb-2 line-clamp-2 text-base font-medium">
                          {rfp.title}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                              rfp.status === "sent" ?
                                "bg-primary/20 text-primary"
                              : rfp.status === "draft" ?
                                "bg-muted text-muted-foreground"
                              : rfp.status === "in_review" ?
                                "bg-blue-500/20 text-blue-400"
                              : "bg-green-500/20 text-green-400"
                            }`}
                          >
                            {rfp.status}
                          </span>
                        </div>
                      </div>
                      <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3">
                    {rfp.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {rfp.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm">
                      {rfp.budget && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Budget</span>
                          <span className="font-medium">
                            ${parseFloat(rfp.budget).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {rfp.deadline && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Deadline
                          </span>
                          <span className="font-medium">
                            {new Date(rfp.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {rfp.lineItems && rfp.lineItems.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Items</span>
                          <span className="font-medium">
                            {rfp.lineItems.length}
                          </span>
                        </div>
                      )}
                      {rfpVendorsMap[rfp.id] &&
                        rfpVendorsMap[rfp.id].length > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Sent to
                            </span>
                            <span className="font-medium">
                              {rfpVendorsMap[rfp.id].length} vendor
                              {rfpVendorsMap[rfp.id].length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        }
      </div>

      {/* Create RFP Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New RFP</DialogTitle>
            <DialogDescription>
              Describe what you want to procure in natural language. Our AI will
              extract all the details automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Example: I need to procure laptops and monitors for our new office. Budget is $50,000 total. Need delivery within 30 days. We need 20 laptops with 16GB RAM and 15 monitors 27-inch. Payment terms should be net 30, and we need at least 1 year warranty."
              value={naturalLanguageText}
              onChange={(e) => setNaturalLanguageText(e.target.value)}
              rows={8}
              disabled={loading}
              className="resize-none"
            />
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setNaturalLanguageText("");
                setError(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRFP}
              disabled={loading || !naturalLanguageText.trim()}
            >
              {loading ?
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              : <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create RFP
                </>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
