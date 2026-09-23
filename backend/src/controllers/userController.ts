import { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { ROLES } from "../types";

/**
 * GET /api/users/me
 * Requires `authenticate`. Any authenticated role may call this.
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.sub);
  if (!user) {
    throw ApiError.unauthorized("Account not found");
  }
  res.json({ success: true, user });
});

/**
 * GET /api/users
 * Admin only. Lists all users (for the User Management page).
 */
export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, users });
});

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(ROLES),
  department: z.string().optional(),
});

/**
 * POST /api/users
 * Admin only. Creates a new Inspector/Officer/Admin account.
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role, department } = req.body as z.infer<
    typeof createUserSchema
  >;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict("A user with this email already exists");
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
    department,
  });

  res.status(201).json({ success: true, user });
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(ROLES).optional(),
  department: z.string().optional(),
  active: z.boolean().optional(),
});

/**
 * PUT /api/users/:id
 * Admin only. Updates role, active status, name, or department.
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body as z.infer<typeof updateUserSchema>;

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  res.json({ success: true, user });
});
