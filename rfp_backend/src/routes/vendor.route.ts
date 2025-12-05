import { Router } from "express";
import { VendorController } from "../controllers/vendor.controller";
import { VendorService } from "../services/vendor.service";
import { VendorRepository } from "../repositories/vendor.repository";
import { validateBody, validateParams } from "../middlewares/validationMiddleware";
import {
  createVendorSchema,
  updateVendorSchema,
  getVendorByIdSchema,
  deleteVendorSchema,
} from "../validationSchemas/vendor.VSchema";

export class VendorRoutes {
  private router: Router;
  private vendorController: VendorController;

  constructor() {
    this.router = Router();
    const vendorRepository = new VendorRepository();
    const vendorService = new VendorService(vendorRepository);
    this.vendorController = new VendorController(vendorService);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Create vendor
    this.router.post(
      "/",
      validateBody(createVendorSchema.shape.body),
      this.vendorController.createVendor
    );

    // Get all vendors
    this.router.get("/", this.vendorController.getAllVendors);

    // Get vendor by ID
    this.router.get(
      "/:id",
      validateParams(getVendorByIdSchema.shape.params),
      this.vendorController.getVendorById
    );

    // Update vendor
    this.router.put(
      "/:id",
      validateParams(updateVendorSchema.shape.params),
      validateBody(updateVendorSchema.shape.body),
      this.vendorController.updateVendor
    );

    // Delete vendor
    this.router.delete(
      "/:id",
      validateParams(deleteVendorSchema.shape.params),
      this.vendorController.deleteVendor
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

