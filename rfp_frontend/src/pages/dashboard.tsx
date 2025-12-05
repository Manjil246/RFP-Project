import { useEffect, useState } from "react";

import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  FileCheck,
  FileText,
  Inbox,
  Mail,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiClient } from "@/lib/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    rfps: 0,
    vendors: 0,
    proposals: 0,
    comparisons: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome to your AI-Powered RFP Management System
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total RFPs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {loading ? "..." : stats.rfps}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Active requests for proposals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {loading ? "..." : stats.vendors}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Registered vendors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proposals</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {loading ? "..." : stats.proposals}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Received proposals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comparisons</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {loading ? "..." : stats.comparisons}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              AI-powered comparisons
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-Powered Features
            </CardTitle>
            <CardDescription>
              Leverage artificial intelligence to streamline your RFP process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Bot className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <div>
                <h4 className="text-sm font-medium">
                  Natural Language Processing
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create RFPs using simple natural language. Our AI extracts all
                  the details automatically.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <div>
                <h4 className="text-sm font-medium">
                  Automatic Proposal Parsing
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  AI extracts pricing, terms, and details from vendor emails and
                  attachments (PDF, Word, Excel).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <div>
                <h4 className="text-sm font-medium">Smart Comparisons</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Get AI-powered recommendations based on price, delivery time,
                  and RFP requirements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Key Capabilities
            </CardTitle>
            <CardDescription>
              Everything you need for efficient RFP management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <div>
                <h4 className="text-sm font-medium">Email Integration</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Send RFPs via email and receive responses automatically.
                  Real-time webhook notifications.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <div>
                <h4 className="text-sm font-medium">Vendor Management</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Maintain a database of vendors and easily select recipients
                  for each RFP.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BarChart3 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <div>
                <h4 className="text-sm font-medium">Comparison & Analysis</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Compare multiple proposals side-by-side with detailed analysis
                  and recommendations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              to="/rfps"
              className="group flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary/20">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium">Create RFP</h4>
                <p className="text-xs text-muted-foreground">
                  Start a new request
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-foreground" />
            </Link>

            <Link
              to="/vendors"
              className="group flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary/20">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium">Manage Vendors</h4>
                <p className="text-xs text-muted-foreground">
                  Add or update vendors
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-foreground" />
            </Link>

            <Link
              to="/compare"
              className="group flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary/20">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium">Compare Proposals</h4>
                <p className="text-xs text-muted-foreground">
                  Analyze and compare
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-foreground" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* How to Use Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            How to Use This System
          </CardTitle>
          <CardDescription>
            A step-by-step guide to get the most out of your RFP management
            system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                1
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-medium">
                  Create an RFP
                  <Link
                    to="/rfps"
                    className="text-xs text-primary hover:underline"
                  >
                    Go to RFPs →
                  </Link>
                </h4>
                <p className="text-sm text-muted-foreground">
                  Describe what you want to procure in natural language. For
                  example: "I need 20 laptops with 16GB RAM, 15 monitors
                  27-inch, budget $50,000, delivery within 30 days, payment
                  terms net 30, warranty 1 year." Our AI will automatically
                  extract all the details and create a structured RFP.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                2
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-medium">
                  Add Vendors
                  <Link
                    to="/vendors"
                    className="text-xs text-primary hover:underline"
                  >
                    Go to Vendors →
                  </Link>
                </h4>
                <p className="text-sm text-muted-foreground">
                  Add vendors to your database with their contact information.
                  You can add vendors at any time, and they'll be available for
                  all your RFPs. Make sure to include accurate email addresses
                  as RFPs will be sent via email.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                3
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="text-sm font-medium">Send RFP to Vendors</h4>
                <p className="text-sm text-muted-foreground">
                  Select which vendors should receive your RFP and send it via
                  email. The system will automatically format the RFP as a
                  professional email with all details. Vendors will receive the
                  RFP and can reply directly to the email.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                4
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-medium">
                  Receive & Parse Proposals
                  <Link
                    to="/proposals"
                    className="text-xs text-primary hover:underline"
                  >
                    View Proposals →
                  </Link>
                </h4>
                <p className="text-sm text-muted-foreground">
                  When vendors reply to your RFP email, the system automatically
                  receives and processes their response. AI extracts pricing,
                  delivery times, payment terms, warranty information, and more
                  from both the email body and any attachments (PDF, Word,
                  Excel). Proposals are automatically created and linked to the
                  RFP.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                5
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-medium">
                  Compare & Get Recommendations
                  <Link
                    to="/compare"
                    className="text-xs text-primary hover:underline"
                  >
                    Compare Now →
                  </Link>
                </h4>
                <p className="text-sm text-muted-foreground">
                  Once you have multiple proposals, use the comparison feature
                  to see side-by-side comparisons of pricing, delivery times,
                  terms, and completeness. Our AI analyzes all proposals against
                  your RFP requirements and provides a recommendation for the
                  best vendor, explaining why based on price, delivery,
                  warranty, and other factors.
                </p>
              </div>
            </div>

            {/* Tips */}
            <div className="mt-6 border-t border-border pt-6">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Pro Tips
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-primary">•</span>
                  <span>
                    Be specific in your RFP description - include quantities,
                    specifications, budget, and deadlines for best results.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-primary">•</span>
                  <span>
                    Vendors can attach PDF quotes, Excel spreadsheets, or Word
                    documents - our AI will extract all relevant information.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-primary">•</span>
                  <span>
                    If a vendor sends multiple emails, the system automatically
                    merges them into a single updated proposal.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-primary">•</span>
                  <span>
                    Comparison results are cached - they update automatically
                    when new proposals arrive or existing ones are modified.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
