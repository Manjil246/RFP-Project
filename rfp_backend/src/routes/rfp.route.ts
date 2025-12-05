import { Router } from "express";
import { RFPController } from "../controllers/rfp.controller";
import { RFPService } from "../services/rfp.service";
import { RFPRepository } from "../repositories/rfp.repository";
import { VendorRepository } from "../repositories/vendor.repository";
import { validateBody, validateParams } from "../middlewares/validationMiddleware";
import {
  createRFPSchema,
  updateRFPSchema,
  getRFPByIdSchema,
  deleteRFPSchema,
  sendRFPToVendorsSchema,
} from "../validationSchemas/rfp.VSchema";

export class RFPRoutes {
  private router: Router;
  private rfpController: RFPController;

  constructor() {
    this.router = Router();
    const rfpRepository = new RFPRepository();
    const vendorRepository = new VendorRepository();
    const rfpService = new RFPService(rfpRepository, vendorRepository);
    this.rfpController = new RFPController(rfpService);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Create RFP from natural language
    this.router.post(
      "/",
      validateBody(createRFPSchema.shape.body),
      this.rfpController.createRFP
    );

    // Get all RFPs
    this.router.get("/", this.rfpController.getAllRFPs);

    // Get RFP by ID
    this.router.get(
      "/:id",
      validateParams(getRFPByIdSchema.shape.params),
      this.rfpController.getRFPById
    );

    // Update RFP
    this.router.put(
      "/:id",
      validateParams(updateRFPSchema.shape.params),
      validateBody(updateRFPSchema.shape.body),
      this.rfpController.updateRFP
    );

    // Delete RFP
    this.router.delete(
      "/:id",
      validateParams(deleteRFPSchema.shape.params),
      this.rfpController.deleteRFP
    );

    // Send RFP to vendors
    this.router.post(
      "/:id/send",
      validateParams(getRFPByIdSchema.shape.params),
      validateBody(sendRFPToVendorsSchema.shape.body),
      this.rfpController.sendRFPToVendors
    );

    // Get vendors who received this RFP
    this.router.get(
      "/:id/vendors",
      validateParams(getRFPByIdSchema.shape.params),
      this.rfpController.getRFPVendors
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

