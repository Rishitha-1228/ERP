import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
    });
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) logger.error(err.message, { stack: err.stack });
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
  }

  // Postgres unique_violation
  if (typeof err === "object" && err !== null && (err as any).code === "23505") {
    return res.status(409).json({ success: false, message: "A record with this value already exists." });
  }

  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, { err });
  return res.status(500).json({ success: false, message: "Internal server error" });
}
