import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";

/**
 * Validates req.{body,query,params} against a Zod schema.
 * On success, replaces req.body with the parsed data.
 * On failure, throws a ZodError which errorHandler formats into a 400.
 */
export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    req.body = parsed.body ?? req.body;
    next();
  };
}
