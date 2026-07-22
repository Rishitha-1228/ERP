import { NextFunction, Request, Response } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/jwt";
import { AppError } from "../utils/AppError";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/** Verifies the access token sent in the Authorization header. */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw AppError.unauthorized("Missing or malformed Authorization header");
  }

  const token = header.split(" ")[1];
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw AppError.unauthorized("Invalid or expired access token");
  }
}

/** Restricts a route to specific roles. Use AFTER `authenticate`. */
export function authorize(...allowedRoles: TokenPayload["role"][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw AppError.unauthorized();
    if (!allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden(`Role '${req.user.role}' cannot perform this action`);
    }
    next();
  };
}
