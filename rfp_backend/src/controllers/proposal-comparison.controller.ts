import { Request, Response } from "express";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { ProposalComparisonService } from "../services/proposal-comparison.service";

export class ProposalComparisonController {
  private comparisonService: ProposalComparisonService;

  constructor() {
    this.comparisonService = new ProposalComparisonService();
  }

  getComparisonForRFP = async (req: Request, res: Response) => {
    try {
      const { rfpId } = req.params;

      if (!rfpId) {
        return sendErrorResponse(res, 400, "RFP ID is required");
      }

      const result = await this.comparisonService.getComparisonForRFP(rfpId);

      return sendSuccessResponse(
        res,
        200,
        "Comparison retrieved successfully",
        {
          rfpId,
          ...result,
        }
      );
    } catch (error: any) {
      console.error("Get comparison error:", error);
      return sendErrorResponse(
        res,
        500,
        error.message || "Failed to get comparison",
        error
      );
    }
  };

  getComparisonStatuses = async (req: Request, res: Response) => {
    try {
      const { rfpIds } = req.query;

      if (!rfpIds || typeof rfpIds !== "string") {
        return sendErrorResponse(
          res,
          400,
          "rfpIds query parameter is required (comma-separated)"
        );
      }

      const rfpIdArray = rfpIds.split(",").filter((id) => id.trim());

      if (rfpIdArray.length === 0) {
        return sendSuccessResponse(
          res,
          200,
          "Comparison statuses retrieved",
          {}
        );
      }

      const statuses =
        await this.comparisonService.getComparisonStatuses(rfpIdArray);

      return sendSuccessResponse(
        res,
        200,
        "Comparison statuses retrieved successfully",
        statuses
      );
    } catch (error: any) {
      console.error("Get comparison statuses error:", error);
      return sendErrorResponse(
        res,
        500,
        error.message || "Failed to get comparison statuses",
        error
      );
    }
  };

  getRFPComparisonData = async (req: Request, res: Response) => {
    try {
      const data = await this.comparisonService.getRFPComparisonData();

      return sendSuccessResponse(
        res,
        200,
        "RFP comparison data retrieved successfully",
        data
      );
    } catch (error: any) {
      console.error("Get RFP comparison data error:", error);
      return sendErrorResponse(
        res,
        500,
        error.message || "Failed to get RFP comparison data",
        error
      );
    }
  };
}
