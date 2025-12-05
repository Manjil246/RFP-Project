import { Router } from "express";
import { ProposalController } from "../controllers/proposal.controller";
import { ProposalService } from "../services/proposal.service";
import { ProposalRepository } from "../repositories/proposal.repository";
import { validateParams } from "../middlewares/validationMiddleware";
import {
  getProposalByIdSchema,
  getProposalsByRFPIdSchema,
} from "../validationSchemas/proposal.VSchema";

export class ProposalRoutes {
  private router: Router;
  private proposalController: ProposalController;

  constructor() {
    this.router = Router();
    const proposalRepository = new ProposalRepository();
    const proposalService = new ProposalService(proposalRepository);
    this.proposalController = new ProposalController(proposalService);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Get all proposals
    this.router.get("/", this.proposalController.getAllProposals);

    // Get proposal by ID
    this.router.get(
      "/:id",
      validateParams(getProposalByIdSchema.shape.params),
      this.proposalController.getProposalById
    );

    // Get proposals by RFP ID
    this.router.get(
      "/rfp/:rfpId",
      validateParams(getProposalsByRFPIdSchema.shape.params),
      this.proposalController.getProposalsByRFPId
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

