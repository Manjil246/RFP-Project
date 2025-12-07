import { useEffect, useState } from "react";

import {
  ArrowLeft,
  Award,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import type { ComparisonData, Recommendation, RFP } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiClient } from "@/lib/api";

export default function CompareDetail() {
  const { id } = useParams<{ id: string }>();
  const [rfp, setRfp] = useState<RFP | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null,
  );
  const [wasCached, setWasCached] = useState(false);
  const [computedAt, setComputedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      loadRFP(id);
      loadComparison(id);
    }
  }, [id]);

  const loadRFP = async (rfpId: string) => {
    try {
      const response = await apiClient.getRFPById(rfpId);
      setRfp(response.data);
    } catch (err: any) {
      console.error("Failed to load RFP:", err);
    }
  };

  const loadComparison = async (rfpId: string) => {
    setLoadingComparison(true);
    setError(null);
    setActiveStepIndex(0);

    const totalSteps = comparisonSteps.length;
    const stepDuration = 500; // Each step takes 200ms
    const startTime = Date.now();

    // Start API call immediately
    const apiPromise = apiClient.getComparisonForRFP(rfpId);

    // Animate through steps sequentially (except last one)
    const stepTimers: NodeJS.Timeout[] = [];

    for (let i = 0; i < totalSteps - 1; i++) {
      const timer = setTimeout(
        () => {
          setActiveStepIndex(i + 1);
        },
        (i + 1) * stepDuration,
      );
      stepTimers.push(timer);
    }

    // Move to last step after all previous steps complete
    const lastStepTimer = setTimeout(
      () => {
        setActiveStepIndex(totalSteps - 1);
      },
      (totalSteps - 1) * stepDuration,
    );
    stepTimers.push(lastStepTimer);

    try {
      // Wait for API response
      const response = await apiPromise;

      // Calculate elapsed time
      const elapsedTime = Date.now() - startTime;
      const minTimeForLastStep = (totalSteps - 1) * stepDuration + stepDuration; // Time for all steps including last

      // If response came before minimum time, wait for last step to complete its 200ms
      if (elapsedTime < minTimeForLastStep) {
        const remainingTime = minTimeForLastStep - elapsedTime;
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      setComparison(response.data.comparison);
      setRecommendation(response.data.recommendation);
      setWasCached(response.data.wasCached);
      setComputedAt(response.data.computedAt);
    } catch (err: any) {
      setError(err.message || "Failed to load comparison");
      setComparison(null);
      setRecommendation(null);
    } finally {
      // Clear all timers
      stepTimers.forEach((timer) => clearTimeout(timer));
      // Small delay before hiding loader
      setTimeout(() => {
        setLoadingComparison(false);
        setActiveStepIndex(null);
      }, 300);
    }
  };

  const formatCurrency = (amount: string | null) => {
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

  const getPriceComparisonData = () => {
    if (!comparison) return null;
    const priceRow = comparison.comparisonTable.find(
      (row) => row.criteria === "Total Price",
    );
    if (!priceRow) return null;

    const prices = comparison.proposals
      .map((proposal) => {
        const value = priceRow.values[proposal.vendorId];
        return {
          vendorName: proposal.vendorName,
          vendorId: proposal.vendorId,
          price: value && typeof value === "string" ? parseFloat(value) : null,
        };
      })
      .filter((p) => p.price !== null) as Array<{
      vendorName: string;
      vendorId: string;
      price: number;
    }>;

    if (prices.length === 0) return null;

    const maxPrice = Math.max(...prices.map((p) => p.price));
    const minPrice = Math.min(...prices.map((p) => p.price));

    return { prices, maxPrice, minPrice };
  };

  const priceData = getPriceComparisonData();

  const comparisonSteps = [
    {
      icon: FileText,
      title: "Analyzing RFP Requirements",
      description: "Reviewing all requirements, line items, and specifications",
    },
    {
      icon: Building2,
      title: "Processing Vendor Proposals",
      description:
        "Extracting pricing, terms, and delivery information from each proposal",
    },
    {
      icon: TrendingUp,
      title: "Comparing Proposals",
      description:
        "Evaluating prices, delivery times, and terms against RFP requirements",
    },
    {
      icon: Sparkles,
      title: "Calculating Completeness Scores",
      description: "Assessing how well each proposal meets all requirements",
    },
    {
      icon: Award,
      title: "Generating AI Recommendation",
      description: "Analyzing all factors to recommend the best vendor",
    },
  ];

  if (loadingComparison) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/compare">
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Comparing Proposals
            </h1>
            <p className="mt-1 text-muted-foreground">
              Please wait while we analyze and compare all proposals
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Processing Comparison</CardTitle>
            <CardDescription>
              This may take a few moments while we analyze all proposals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comparisonSteps.map((step, index) => {
                const isVisible =
                  activeStepIndex !== null && index <= activeStepIndex;
                const isActive = activeStepIndex === index;
                const isCompleted =
                  activeStepIndex !== null && index < activeStepIndex;
                const Icon = step.icon;

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-4 transition-all duration-300 ${
                      isVisible ?
                        "translate-x-0 opacity-100"
                      : "-translate-x-4 opacity-0"
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {isActive ?
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      : isCompleted ?
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                      : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <h3
                          className={`font-medium ${
                            isActive ? "text-foreground" : (
                              "text-muted-foreground"
                            )
                          }`}
                        >
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !comparison) {
    return (
      <div className="space-y-4">
        <Link to="/compare">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Compare
          </Button>
        </Link>
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            {error || "Comparison not found"}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!comparison || !recommendation) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <Link to="/compare">
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {rfp?.title || "Comparison"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Vendor proposal comparison and AI recommendation
            </p>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {wasCached ?
              <>
                <Clock className="h-4 w-4" />
                <span>
                  Updated {new Date(computedAt || "").toLocaleString()}
                </span>
              </>
            : <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Just generated
              </span>
            }
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => id && loadComparison(id)}
            disabled={loadingComparison}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loadingComparison ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* RFP Info */}
      {rfp && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <CardTitle>{rfp.title}</CardTitle>
                <Link
                  to={`/rfps/${rfp.id}`}
                  className="mt-1 flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View RFP details
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Price Comparison Visualization */}
      {priceData && priceData.prices.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Price Comparison
            </CardTitle>
            <CardDescription>
              Visual comparison of proposal prices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priceData.prices.map((item) => {
                // Calculate percentage relative to max price (so all bars are visible)
                const percentage = (item.price / priceData.maxPrice) * 100;
                const isRecommended = item.vendorId === recommendation.vendorId;
                const isLowest = item.price === priceData.minPrice;
                return (
                  <div key={item.vendorId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.vendorName}</span>
                        {isRecommended && (
                          <Award className="h-3.5 w-3.5 text-primary" />
                        )}
                        {isLowest && (
                          <span className="rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                            Lowest
                          </span>
                        )}
                      </div>
                      <span className="font-semibold">
                        {formatCurrency(item.price.toString())}
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          isRecommended ? "bg-green-600"
                          : isLowest ? "bg-green-500"
                          : "bg-green-400"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completeness Score Explanations */}
      {comparison.proposals.some((p) => p.completenessScoreExplanation) && (
        <Card>
          <CardHeader>
            <CardTitle>Completeness Score Analysis</CardTitle>
            <CardDescription>
              Detailed explanation of how complete each proposal is
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {comparison.proposals.map(
              (proposal) =>
                proposal.completenessScoreExplanation && (
                  <div
                    key={proposal.proposalId}
                    className="border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-medium">{proposal.vendorName}</div>
                      <span className="rounded-md bg-primary/20 px-2 py-1 text-sm font-medium text-primary">
                        {proposal.completenessScore}/100
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {proposal.completenessScoreExplanation}
                    </p>
                  </div>
                ),
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Recommendation */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <CardTitle>AI Recommendation</CardTitle>
          </div>
          <CardDescription>
            Recommended vendor based on RFP requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-2xl font-bold">
                {recommendation.vendorName}
              </div>
              <span className="rounded-full bg-primary/20 px-3 py-1 text-sm font-medium text-primary">
                Winner
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Score</span>
                <span className="font-semibold">
                  {recommendation.score}/100
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-2.5 rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${recommendation.score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          {recommendation.scoreBreakdown && (
            <div className="space-y-4 rounded-md border border-border bg-background p-4">
              <div className="mb-3 text-sm font-medium">Score Breakdown:</div>
              <div className="grid grid-cols-2 gap-4">
                {recommendation.scoreBreakdown.priceScore !== undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Price Score</span>
                      <span className="font-medium">
                        {recommendation.scoreBreakdown.priceScore}/100
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{
                          width: `${recommendation.scoreBreakdown.priceScore}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {recommendation.scoreBreakdown.deliveryScore !== undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Delivery Score
                      </span>
                      <span className="font-medium">
                        {recommendation.scoreBreakdown.deliveryScore}/100
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{
                          width: `${recommendation.scoreBreakdown.deliveryScore}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {recommendation.scoreBreakdown.completenessScore !==
                  undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Completeness Score
                      </span>
                      <span className="font-medium">
                        {recommendation.scoreBreakdown.completenessScore}/100
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-purple-500"
                        style={{
                          width: `${recommendation.scoreBreakdown.completenessScore}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {recommendation.scoreBreakdown.termsScore !== undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Terms Score</span>
                      <span className="font-medium">
                        {recommendation.scoreBreakdown.termsScore}/100
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-orange-500"
                        style={{
                          width: `${recommendation.scoreBreakdown.termsScore}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              {recommendation.scoreBreakdown.explanation && (
                <div className="border-t border-border pt-2">
                  <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                    {recommendation.scoreBreakdown.explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="rounded-md border border-border bg-background p-4">
            <div className="mb-2 text-sm font-medium">Detailed Reasoning:</div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {recommendation.reasoning}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Comparison</CardTitle>
          <CardDescription>
            Side-by-side comparison of all proposals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="-mx-6 overflow-x-auto px-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="sticky left-0 z-10 bg-background p-4 text-left font-semibold">
                    Criteria
                  </th>
                  {comparison.proposals.map((proposal) => (
                    <th
                      key={proposal.proposalId}
                      className={`min-w-[180px] p-4 text-left font-semibold ${
                        proposal.vendorId === recommendation.vendorId ?
                          "border-l-2 border-r-2 border-primary/30 bg-primary/10"
                        : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {proposal.vendorName}
                        {proposal.vendorId === recommendation.vendorId && (
                          <Award className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.comparisonTable.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-border ${
                      idx % 2 === 0 ? "bg-background" : "bg-muted/30"
                    }`}
                  >
                    <td className="sticky left-0 z-10 bg-inherit p-4 font-medium">
                      {row.criteria}
                    </td>
                    {comparison.proposals.map((proposal) => {
                      const value = row.values[proposal.vendorId];
                      let displayValue: string;
                      
                      if (value === null || value === undefined) {
                        displayValue = "Not specified";
                      } else if (
                        row.criteria === "Total Price" &&
                        typeof value === "string"
                      ) {
                        displayValue = formatCurrency(value);
                      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                        // Handle objects - try to extract meaningful information
                        try {
                          // Check if it's a warranty object with duration/period
                          const obj = value as any;
                          if (obj.duration || obj.period || obj.length) {
                            const duration = obj.duration || obj.period || obj.length;
                            const unit = obj.unit || "years";
                            displayValue = `${duration} ${unit}`;
                          } else if (obj.value || obj.text || obj.description) {
                            // Try common object properties
                            displayValue = String(obj.value || obj.text || obj.description);
                          } else {
                            // Otherwise, format as key-value pairs
                            const entries = Object.entries(value);
                            if (entries.length > 0) {
                              displayValue = entries
                                .map(([key, val]) => {
                                  if (val === null || val === undefined) return `${key}: N/A`;
                                  if (typeof val === "object") return `${key}: ${JSON.stringify(val)}`;
                                  return `${key}: ${String(val)}`;
                                })
                                .join(", ");
                            } else {
                              displayValue = "Not specified";
                            }
                          }
                        } catch (e) {
                          // Last resort: try to stringify
                          try {
                            displayValue = JSON.stringify(value);
                          } catch {
                            displayValue = "Not specified";
                          }
                        }
                      } else if (Array.isArray(value)) {
                        displayValue = value
                          .map((item) => 
                            typeof item === "object" ? JSON.stringify(item) : String(item)
                          )
                          .join(", ");
                      } else {
                        displayValue = String(value);
                      }
                      
                      const isWinner = row.winner === proposal.vendorId;
                      const isRecommended =
                        proposal.vendorId === recommendation.vendorId;
                      return (
                        <td
                          key={proposal.proposalId}
                          className={`p-4 ${
                            isRecommended ?
                              "border-l-2 border-r-2 border-primary/30 bg-primary/5"
                            : ""
                          } ${isWinner ? "font-semibold text-green-400" : ""}`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{displayValue}</span>
                            {isWinner && (
                              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Price Range
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Minimum</span>
              <span className="font-semibold text-green-400">
                {formatCurrency(comparison.summary.priceRange.min)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Maximum</span>
              <span className="font-semibold text-orange-400">
                {formatCurrency(comparison.summary.priceRange.max)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="text-sm font-medium">Average</span>
              <span className="font-semibold">
                {formatCurrency(comparison.summary.priceRange.average)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Delivery Range
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fastest</span>
              <span className="font-semibold text-green-400">
                {comparison.summary.deliveryRange.fastest || "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Slowest</span>
              <span className="font-semibold text-orange-400">
                {comparison.summary.deliveryRange.slowest || "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
