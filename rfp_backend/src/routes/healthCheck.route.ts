import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { HealthCheckController } from "../controllers/healthCheckup.controller";
import { HealthCheckService } from "../services/healthCheck.service";
import { HealthCheckRepository } from "../repositories/healthCheck.repository";
import { validateQueryParams } from "../middlewares/validationMiddleware";
import { healthCheckQuerySchema } from "../validationSchemas/healthCheck.VSchema";

export class HealthCheckRoutes {
  private router: Router;
  private healthCheckController: HealthCheckController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    const healthCheckRepository = new HealthCheckRepository();
    const healthCheckService = new HealthCheckService(healthCheckRepository);
    this.healthCheckController = new HealthCheckController(healthCheckService);
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Get all users - Admin and Manager only
    this.router.get(
      "/",
      this.authMiddleware.authenticate,
      validateQueryParams(healthCheckQuerySchema),
      this.healthCheckController.healthCheck
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
