import { NextFunction, Request, Response } from "express";
import { z, ZodTypeAny } from "zod";
import { sendErrorResponse } from "../utils/response";

// ✅ Generic body validation middleware
export const validateBody = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // ✅ ZodError always has `.issues`
      const errorMessage = result.error.issues[0].message;
      return sendErrorResponse(res, 400, errorMessage);
    }

    req.body = result.data; // validated data
    next();
  };
};

// ✅ Generic query validation middleware
export const validateQueryParams = <T extends ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errorMessage = result.error.issues[0].message;
      return sendErrorResponse(res, 400, errorMessage);
    }
    next();
  };
};

// ✅ Generic params validation middleware
export const validateParams = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errorMessage = result.error.issues[0].message;
      return sendErrorResponse(res, 400, errorMessage);
    }

    req.params = result.data; // validated params
    next();
  };
};
