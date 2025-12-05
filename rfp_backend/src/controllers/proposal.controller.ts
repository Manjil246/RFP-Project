import { Request, Response } from "express";
import { IProposalService } from "../interfaces/proposal.interfaces";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";

export class ProposalController {
  private proposalService: IProposalService;

  constructor(proposalService: IProposalService) {
    this.proposalService = proposalService;
  }

  getProposalById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const proposal = await this.proposalService.getProposalById(id);

      if (!proposal) {
        return sendErrorResponse(res, 404, "Proposal not found");
      }

      return sendSuccessResponse(
        res,
        200,
        "Proposal retrieved successfully",
        proposal
      );
    } catch (error: any) {
      console.error("Get proposal error:", error);
      return sendErrorResponse(
        res,
        500,
        error.message || "Failed to get proposal",
        error
      );
    }
  };

  getProposalsByRFPId = async (req: Request, res: Response) => {
    try {
      const { rfpId } = req.params;
      const proposals = await this.proposalService.getProposalsByRFPId(rfpId);

      return sendSuccessResponse(
        res,
        200,
        "Proposals retrieved successfully",
        proposals
      );
    } catch (error: any) {
      console.error("Get proposals by RFP error:", error);
      return sendErrorResponse(
        res,
        500,
        error.message || "Failed to get proposals",
        error
      );
    }
  };

  getAllProposals = async (req: Request, res: Response) => {
    try {
      const proposals = await this.proposalService.getAllProposals();

      return sendSuccessResponse(
        res,
        200,
        "Proposals retrieved successfully",
        proposals
      );
    } catch (error: any) {
      console.error("Get all proposals error:", error);
      return sendErrorResponse(
        res,
        500,
        error.message || "Failed to get proposals",
        error
      );
    }
  };
}

