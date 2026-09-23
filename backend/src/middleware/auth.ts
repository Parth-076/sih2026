import { RequestHandler } from "express";
import { verifyToken } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";
import { Role } from "../types";
import { User } from "../models/User";

/**
 * Verifies the Bearer JWT on the request, attaches the decoded payload to
 * req.user, and confirms the referenced user still exists and is active.
 * This is the backend enforcement point — the frontend hiding buttons is
 * never sufficient on its own.
 */
export const authenticate: RequestHandler = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Missing or malformed Authorization header");
    }

    const token = header.slice("Bearer ".length);
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw ApiError.unauthorized("Invalid or expired token");
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.active) {
      throw ApiError.unauthorized("Account not found or deactivated");
    }

    req.user = { sub: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Restricts a route to one or more roles. Must run after `authenticate`.
 */
export function authorize(...allowedRoles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `This action requires one of the following roles: ${allowedRoles.join(", ")}`
        )
      );
    }
    next();
  };
}
