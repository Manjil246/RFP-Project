import { Request, Response } from "express";
import { IHealthCheckService } from "../interfaces/healthCheck.interfaces";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { errorHealthResponse, successHealthResponse } from "../lib/healthCheck";

export class HealthCheckController {
  private healthService: IHealthCheckService;

  constructor(healthService: IHealthCheckService) {
    this.healthService = healthService;
  }

  healthCheck = async (req: Request, res: Response) => {
    try {
      const { name } = req.query;
      const result = await this.healthService.getHealthStatus(name as string);
      //  We will be using this helper in other routes
      //  return sendSuccessResponse(res, 200, "Health check successful", result);
      return res.status(200).send(successHealthResponse(name as string));
    } catch (error) {
      console.error("Health check failed:", error);
      //  We will be using this helper in other routes
      //   return sendErrorResponse(res, 500, "Health check failed", error);
      return res.status(500).send(errorHealthResponse());
    }
  };
}
