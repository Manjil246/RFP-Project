import { Request, Response } from "express";
import { IVendorService } from "../interfaces/vendor.interfaces";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";

export class VendorController {
  private vendorService: IVendorService;

  constructor(vendorService: IVendorService) {
    this.vendorService = vendorService;
  }

  createVendor = async (req: Request, res: Response) => {
    try {
      const vendor = await this.vendorService.createVendor(req.body);
      return sendSuccessResponse(
        res,
        201,
        "Vendor created successfully",
        vendor
      );
    } catch (error: any) {
      console.error("Create vendor error:", error);
      return sendErrorResponse(
        res,
        error.message?.includes("already exists") ? 409 : 500,
        error.message || "Failed to create vendor",
        error
      );
    }
  };

  getVendorById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const vendor = await this.vendorService.getVendorById(id);

      if (!vendor) {
        return sendErrorResponse(res, 404, "Vendor not found");
      }

      return sendSuccessResponse(
        res,
        200,
        "Vendor retrieved successfully",
        vendor
      );
    } catch (error: any) {
      console.error("Get vendor error:", error);
      return sendErrorResponse(
        res,
        500,
        error.message || "Failed to get vendor",
        error
      );
    }
  };

  getAllVendors = async (req: Request, res: Response) => {
    try {
      const vendors = await this.vendorService.getAllVendors();
      return sendSuccessResponse(
        res,
        200,
        "Vendors retrieved successfully",
        vendors
      );
    } catch (error: any) {
      console.error("Get all vendors error:", error);
      return sendErrorResponse(
        res,
        500,
        error.message || "Failed to get vendors",
        error
      );
    }
  };

  updateVendor = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updatedVendor = await this.vendorService.updateVendor(
        id,
        req.body
      );

      if (!updatedVendor) {
        return sendErrorResponse(res, 404, "Vendor not found");
      }

      return sendSuccessResponse(
        res,
        200,
        "Vendor updated successfully",
        updatedVendor
      );
    } catch (error: any) {
      console.error("Update vendor error:", error);
      return sendErrorResponse(
        res,
        error.message?.includes("already exists") ? 409 : 500,
        error.message || "Failed to update vendor",
        error
      );
    }
  };

  deleteVendor = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await this.vendorService.deleteVendor(id);

      if (!deleted) {
        return sendErrorResponse(res, 404, "Vendor not found");
      }

      return sendSuccessResponse(res, 200, "Vendor deleted successfully");
    } catch (error: any) {
      console.error("Delete vendor error:", error);
      return sendErrorResponse(
        res,
        500,
        error.message || "Failed to delete vendor",
        error
      );
    }
  };
}

