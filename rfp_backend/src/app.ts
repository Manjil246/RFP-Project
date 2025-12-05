import express, { Application } from "express";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import "express-async-errors";
import { HealthCheckRoutes } from "./routes/healthCheck.route";
import { RFPRoutes } from "./routes/rfp.route";
import { VendorRoutes } from "./routes/vendor.route";
import { ProposalRoutes } from "./routes/proposal.route";
import { ProposalComparisonRoutes } from "./routes/proposal-comparison.route";
import { WebhookRoutes } from "./routes/webhook.route";
import { StatsRoutes } from "./routes/stats.route";
import { FRONTEND_BASE_URL, BACKEND_BASE_URL } from "./config/env";

export class App {
  private app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
  }

  private initializeMiddlewares(): void {
    this.app.use(express.json({ limit: "50mb" }));
    this.app.use(express.urlencoded({ limit: "50mb", extended: true }));
    this.app.use(cookieParser());
    const corsOptions: CorsOptions = {
      origin: [FRONTEND_BASE_URL, BACKEND_BASE_URL].filter(Boolean),
      credentials: true,
    };
    this.app.use(cors(corsOptions));
  }

  private initializeRoutes(): void {
    const healthCheckRoutes = new HealthCheckRoutes();
    const rfpRoutes = new RFPRoutes();
    const vendorRoutes = new VendorRoutes();
    const proposalRoutes = new ProposalRoutes();
    const comparisonRoutes = new ProposalComparisonRoutes();
    const webhookRoutes = new WebhookRoutes();
    const statsRoutes = new StatsRoutes();

    this.app.use("/api/v1/health-check", healthCheckRoutes.getRouter());
    this.app.use("/api/v1/rfps", rfpRoutes.getRouter());
    this.app.use("/api/v1/vendors", vendorRoutes.getRouter());
    this.app.use("/api/v1/proposals", proposalRoutes.getRouter());
    this.app.use("/api/v1", comparisonRoutes.getRouter());
    this.app.use("/api/v1/webhook", webhookRoutes.getRouter());
    this.app.use("/api/v1/stats", statsRoutes.getRouter());
  }

  public getApp(): Application {
    return this.app;
  }
}
