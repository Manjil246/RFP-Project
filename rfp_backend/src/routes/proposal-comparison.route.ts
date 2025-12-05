import { Router } from "express";
import { ProposalComparisonController } from "../controllers/proposal-comparison.controller";
import { validateParams } from "../middlewares/validationMiddleware";
import { z } from "zod";

const getComparisonSchema = z.object({
  params: z.object({
    rfpId: z.string().uuid("Invalid RFP ID format"),
  }),
});

export class ProposalComparisonRoutes {
  private router: Router;
  private comparisonController: ProposalComparisonController;

  constructor() {
    this.router = Router();
    this.comparisonController = new ProposalComparisonController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Get comparison for RFP
    this.router.get(
      "/rfps/:rfpId/compare",
      validateParams(getComparisonSchema.shape.params),
      this.comparisonController.getComparisonForRFP
    );

    // Get comparison statuses for multiple RFPs
    this.router.get(
      "/comparisons/statuses",
      this.comparisonController.getComparisonStatuses
    );

    // Get RFP comparison data (proposal counts + comparison status) for all RFPs
    this.router.get(
      "/comparisons/rfp-data",
      this.comparisonController.getRFPComparisonData
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
