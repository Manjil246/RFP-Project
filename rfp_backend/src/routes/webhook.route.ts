import { Router } from "express";
import { WebhookController } from "../controllers/webhook.controller";

export class WebhookRoutes {
  private router: Router;
  private webhookController: WebhookController;

  constructor() {
    this.router = Router();
    this.webhookController = new WebhookController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Gmail Pub/Sub webhook endpoint
    this.router.post("/", this.webhookController.handleGmailWebhook);
  }

  public getRouter(): Router {
    return this.router;
  }
}

