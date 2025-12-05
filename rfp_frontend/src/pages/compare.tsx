import { useEffect, useState } from "react";

import {
  AlertCircle,
  BarChart3,
  Building2,
  CheckCircle2,
  Inbox,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";

interface RFPComparisonData {
  rfpId: string;
  rfpTitle: string;
  proposalCount: number;
  hasComparison: boolean;
  compared: boolean;
}

export default function Compare() {
  const navigate = useNavigate();
  const [rfpData, setRfpData] = useState<RFPComparisonData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRFPComparisonData();
  }, []);

  const loadRFPComparisonData = async () => {
    setLoading(true);
    try {
      // Single API call to get all RFP data with comparison info
      const response = await apiClient.getRFPComparisonData();
      setRfpData(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to load RFP comparison data");
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (rfpId: string) => {
    const data = rfpData.find((item) => item.rfpId === rfpId);
    if (data && data.proposalCount > 0) {
      navigate(`/compare/${rfpId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Compare Proposals
        </h1>
        <p className="mt-1 text-muted-foreground">
          Select an RFP to view and compare vendor proposals
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ?
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      : rfpData.length === 0 ?
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="mb-3 h-12 w-12 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              No RFPs available for comparison.
            </p>
          </CardContent>
        </Card>
      : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rfpData.map((item) => {
            const canCompare = item.proposalCount > 0;

            return (
              <Card
                key={item.rfpId}
                className={`flex h-full flex-col transition-colors hover:border-primary/50 ${
                  canCompare ? "cursor-pointer" : (
                    "cursor-not-allowed opacity-60"
                  )
                }`}
                onClick={() => handleCardClick(item.rfpId)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="mb-2 line-clamp-2 text-base font-medium">
                        {item.rfpTitle}
                      </CardTitle>
                    </div>
                    <Building2 className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Inbox className="h-3.5 w-3.5" />
                        Proposals
                      </span>
                      <span className="font-medium">{item.proposalCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Comparison
                      </span>
                      <div className="flex items-center gap-1.5">
                        {item.hasComparison ?
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                            <span className="font-medium text-green-400">
                              Done
                            </span>
                          </>
                        : canCompare ?
                          <>
                            <XCircle className="h-4 w-4 text-orange-400" />
                            <span className="font-medium text-orange-400">
                              Pending
                            </span>
                          </>
                        : <span className="font-medium text-muted-foreground">
                            N/A
                          </span>
                        }
                      </div>
                    </div>
                    {item.hasComparison && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <RefreshCw className="h-3.5 w-3.5" />
                          Updated
                        </span>
                        <div className="flex items-center gap-1.5">
                          {item.compared ?
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-400" />
                              <span className="font-medium text-green-400">
                                Yes
                              </span>
                            </>
                          : <>
                              <AlertCircle className="h-4 w-4 text-orange-400" />
                              <span className="font-medium text-orange-400">
                                Needs Update
                              </span>
                            </>
                          }
                        </div>
                      </div>
                    )}
                  </div>

                  {!canCompare && (
                    <div className="mt-auto border-t border-border pt-3">
                      <div className="text-center text-xs text-muted-foreground">
                        No proposals received yet
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      }
    </div>
  );
}
