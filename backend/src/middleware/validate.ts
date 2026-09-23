import { RequestHandler } from "express";
import { ZodTypeAny } from "zod";
import { ApiError } from "../utils/ApiError";

/**
 * Validates req.body against a zod schema. On success, replaces req.body
 * with the parsed (and coerced/defaulted) value.
 */
export function validateBody(schema: ZodTypeAny): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(ApiError.badRequest("Invalid request body", result.error.flatten()));
    }
    req.body = result.data;
    next();
  };
}
