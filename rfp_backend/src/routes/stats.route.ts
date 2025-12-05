import { Router } from "express";
import { StatsController } from "../controllers/stats.controller";

export class StatsRoutes {
  private router: Router;
  private statsController: StatsController;

  constructor() {
    this.router = Router();
    this.statsController = new StatsController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Get dashboard statistics
    this.router.get("/dashboard", this.statsController.getDashboardStats);
  }

  public getRouter(): Router {
    return this.router;
  }
}
