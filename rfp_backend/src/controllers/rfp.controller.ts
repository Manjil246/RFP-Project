import { Request, Response } from "express";
import { IRFPService } from "../interfaces/rfp.interfaces";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";

export class RFPController {
  private rfpService: IRFPService;

  constructor(rfpService: IRFPService) {
    this.rfpService = rfpService;
  }

  createRFP = async (req: Request, res: Response) => {
    try {
      const { naturalLanguageText } = req.body;

      if (!naturalLanguageText || typeof naturalLanguageText !== "string") {
        return sendErrorResponse(
          res,
          400,
          "naturalLanguageText is required and must be a string"
        );
      }

      const rfp = await this.rfpService.createRFPFromNaturalLanguage(
        naturalLanguageText
      );

      return sendSuccessResponse(
        res,
        201,
        "RFP created successfully",
        rfp
      );
    } catch (error: any) {
      console.error("Create RFP error:", error);
      return sendErrorResponse(
        res,
        500,
        error.message || "Failed to create RFP",
        error
      );
    }
  };

  getRFPById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const rfp = await this.rfpService.getRFPById(id);

      if (!rfp) {
        return sendErrorResponse(res, 404, "RFP not found");
      }

      return sendSuccessResponse(res, 200, "RFP retrieved successfully", rfp);
    } catch (error: any) {
      console.error("Get RFP error:", error);
      return sendErrorResponse(
        res,
        500,
        error.message || "Failed to get RFP",
        error
      );
    }
  };

  getAllRFPs = async (req: Request, res: Response) => {
    try {
      const rfps = await this.rfpService.getAllRFPs();

      return sendSuccessResponse(
        res,
        200,
        "RFPs retrieved successfully",
        rfps
      );
    } catch (error: any) {
      console.error("Get all RFPs error:", error);
      return sendErrorResponse(
        res,
        500,
        error.message || "Failed to get RFPs",
        error
      );
    }
  };

  getAllRFPsWithVendorCounts = async (req: Request, res: Response) => {
    try {
      const rfps = await this.rfpService.getAllRFPsWithVendorCounts();

      return sendSuccessResponse(
        res,
        200,
        "RFPs with vendor counts retrieved successfully",
        rfps
      );
    } catch (error: any) {
      console.error("Get all RFPs with vendor counts error:", error);
      return sendErrorResponse(
        res,
        500,
        error.message || "Failed to get RFPs with vendor counts",
        error
      );
    }
  };

  getRFPByIdWithAllVendors = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const rfp = await this.rfpService.getRFPByIdWithAllVendors(id);

      if (!rfp) {
        return sendErrorResponse(res, 404, "RFP not found");
      }

      return sendSuccessResponse(res, 200, "RFP with all vendors retrieved successfully", rfp);
    } catch (error: any) {
      console.error("Get RFP with all vendors error:", error);
      return sendErrorResponse(
        res,
        500,
        error.message || "Failed to get RFP with all vendors",
        error
      );
    }
  };

  updateRFP = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedRFP = await this.rfpService.updateRFP(id, updateData);

      if (!updatedRFP) {
        return sendErrorResponse(res, 404, "RFP not found");
      }

      return sendSuccessResponse(
        res,
        200,
        "RFP updated successfully",
        updatedRFP
      );
    } catch (error: any) {
      console.error("Update RFP error:", error);
      return sendErrorResponse(
        res,
        500,
        error.message || "Failed to update RFP",
        error
      );
    }
  };

  deleteRFP = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deleted = await this.rfpService.deleteRFP(id);

      if (!deleted) {
        return sendErrorResponse(res, 404, "RFP not found");
      }

      return sendSuccessResponse(res, 200, "RFP deleted successfully");
    } catch (error: any) {
      console.error("Delete RFP error:", error);
      return sendErrorResponse(
        res,
        500,
        error.message || "Failed to delete RFP",
        error
      );
    }
  };

  sendRFPToVendors = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { vendorIds } = req.body;

      if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
        return sendErrorResponse(
          res,
          400,
          "vendorIds is required and must be a non-empty array"
        );
      }

      const result = await this.rfpService.sendRFPToVendors(id, vendorIds);

      return sendSuccessResponse(
        res,
        200,
        `RFP sent to ${result.success} vendor(s). ${result.failed} failed.`,
        result
      );
    } catch (error: any) {
      console.error("Send RFP error:", error);
      return sendErrorResponse(
        res,
        500,
        error.message || "Failed to send RFP",
        error
      );
    }
  };

  getRFPVendors = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const vendors = await this.rfpService.getRFPVendors(id);

      return sendSuccessResponse(
        res,
        200,
        "RFP vendors retrieved successfully",
        vendors
      );
    } catch (error: any) {
      console.error("Get RFP vendors error:", error);
      return sendErrorResponse(
        res,
        500,
        error.message || "Failed to get RFP vendors",
        error
      );
    }
  };
}

