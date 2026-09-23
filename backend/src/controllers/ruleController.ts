import { Request, Response } from "express";
import { z } from "zod";
import { ComplianceRule, VALIDATION_TYPES, RULE_SEVERITIES } from "../models/ComplianceRule";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const ruleSchema = z.object({
  ruleCode: z.string().min(1).transform((s) => s.trim().toUpperCase()),
  name: z.string().min(1),
  description: z.string().min(1),
  validationType: z.enum(VALIDATION_TYPES),
  targetField: z.string().min(1),
  defaultSeverity: z.enum(RULE_SEVERITIES),
  enabled: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
  isPrototype: z.boolean().optional(),
});

export const ruleUpdateSchema = ruleSchema.partial().omit({ ruleCode: true });

/** GET /api/rules — Officer and Admin may view configured rules. */
export const listRules = asyncHandler(async (req: Request, res: Response) => {
  const enabledOnly = req.query.enabled === "true";
  const filter = enabledOnly ? { enabled: true } : {};
  const rules = await ComplianceRule.find(filter).sort({ ruleCode: 1 });
  res.json({ success: true, rules });
});

/** GET /api/rules/:id */
export const getRule = asyncHandler(async (req: Request, res: Response) => {
  const rule = await ComplianceRule.findById(req.params.id);
  if (!rule) throw ApiError.notFound("Rule not found");
  res.json({ success: true, rule });
});

/** POST /api/rules — Admin only */
export const createRule = asyncHandler(async (req: Request, res: Response) => {
  const existing = await ComplianceRule.findOne({ ruleCode: req.body.ruleCode });
  if (existing) throw ApiError.badRequest(`Rule code ${req.body.ruleCode} already exists.`);
  const rule = await ComplianceRule.create(req.body);
  res.status(201).json({ success: true, rule });
});

/** PUT /api/rules/:id — Admin only */
export const updateRule = asyncHandler(async (req: Request, res: Response) => {
  const rule = await ComplianceRule.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!rule) throw ApiError.notFound("Rule not found");
  res.json({ success: true, rule });
});

/** DELETE /api/rules/:id — Admin only */
export const deleteRule = asyncHandler(async (req: Request, res: Response) => {
  const rule = await ComplianceRule.findByIdAndDelete(req.params.id);
  if (!rule) throw ApiError.notFound("Rule not found");
  res.json({ success: true, message: "Rule deleted." });
});
