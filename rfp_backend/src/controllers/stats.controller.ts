import { Request, Response } from "express";
import { StatsService } from "../services/stats.service";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";

export class StatsController {
  private statsService: StatsService;

  constructor() {
    this.statsService = new StatsService();
  }

  getDashboardStats = async (req: Request, res: Response) => {
    try {
      const stats = await this.statsService.getDashboardStats();
      return sendSuccessResponse(
        res,
        200,
        "Dashboard stats retrieved successfully",
        stats
      );
    } catch (error: any) {
      console.error("Get dashboard stats error:", error);
      return sendErrorResponse(
        res,
        500,
        error.message || "Failed to get dashboard stats",
        error
      );
    }
  };
}
