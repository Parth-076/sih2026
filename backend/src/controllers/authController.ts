import { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { signToken } from "../utils/jwt";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

/**
 * POST /api/auth/login
 * Verifies credentials, issues a JWT. Does not reveal whether the email or
 * the password was wrong, to avoid user enumeration.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;

  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  if (!user.active) {
    throw ApiError.unauthorized("This account has been deactivated. Contact an administrator.");
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const token = signToken({ sub: user.id, role: user.role, email: user.email });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
});

/**
 * POST /api/auth/logout
 * JWTs are stateless, so logout is handled client-side by discarding the
 * token. This endpoint exists for a consistent API surface and to make it
 * easy to add token-blacklisting later if required.
 */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, message: "Logged out. Discard the token on the client." });
});
