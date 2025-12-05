import type { Request, Response, NextFunction } from "express";
//Not adding jwt for now to avoid extra dependency, if required :- bun add "jsonwebtoken" and bun add -d @types/jsonwebtoken package
// import jwt from "jsonwebtoken";

// Extend Express Request so req.user is recognized
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export class AuthMiddleware {
  // ✅ Public middleware wrapper
  public authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    this.handleAuthentication(req, res, next).catch((err) => {
      console.error("Authentication error:", err);
      res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    });
  };

  // ✅ Internal handler
  private async handleAuthentication(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // Skip authentication for this template and pass it to the next middleware
    next();

    // 1️⃣ Extract token from cookie or Authorization header
    //   let token = req.cookies?.token;
    //   if (!token) {
    //     const authHeader = req.headers.authorization;
    //     if (authHeader?.startsWith("Bearer ")) {
    //       token = authHeader.slice(7);
    //     }
    //   }

    //   if (!token) {
    //     res
    //       .status(401)
    //       .json({ success: false, message: "Access token is required" });
    //     return;
    //   }

    //   // 2️⃣ Verify token
    //   const decoded = jwt.verify(token, this.jwtSecret);

    //   if (!decoded) {
    //     res
    //       .status(401)
    //       .json({ success: false, message: "Invalid or expired token" });
    //     return;
    //   }
    
    // Fetch user from DB if needed and attach to req.user

    //   // 3️⃣ Attach decoded payload to request
    //   req.user = decoded;
    //   next();
  }
}
