import { Request, Response } from "express";
import mongoose from "mongoose";
import { Inspection } from "../models/Inspection";
import { asyncHandler } from "../utils/asyncHandler";

/**
 * GET /api/dashboard
 *
 * Phase 13 (Dashboard):
 * Aggregates live KPI statistics, time-series trends, violation distributions,
 * product category breakdowns, and recent inspections.
 *
 * RBAC:
 * - INSPECTOR: automatically scoped to own inspection records
 * - OFFICER / ADMIN: system-wide metrics across all inspectors
 */
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const isInspector = req.user!.role === "INSPECTOR";

  // Build root scope filter
  const scopeFilter: Record<string, unknown> = isInspector
    ? { inspector: new mongoose.Types.ObjectId(req.user!.sub) }
    : {};

  // 1. KPI Totals
  const [total, compliant, nonCompliant, reviewRequired, pending] = await Promise.all([
    Inspection.countDocuments(scopeFilter),
    Inspection.countDocuments({ ...scopeFilter, status: "COMPLIANT" }),
    Inspection.countDocuments({ ...scopeFilter, status: "NON_COMPLIANT" }),
    Inspection.countDocuments({ ...scopeFilter, status: "REVIEW_REQUIRED" }),
    Inspection.countDocuments({
      ...scopeFilter,
      status: { $in: ["PENDING_ANALYSIS", "ANALYZING"] },
    }),
  ]);

  const evaluated = compliant + nonCompliant + reviewRequired;
  const complianceRate = evaluated > 0 ? Math.round((compliant / evaluated) * 100) : 0;

  // 2. 30-Day Inspection Trend
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const trendAgg = await Inspection.aggregate([
    {
      $match: {
        ...scopeFilter,
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        total: { $sum: 1 },
        compliant: { $sum: { $cond: [{ $eq: ["$status", "COMPLIANT"] }, 1, 0] } },
        nonCompliant: { $sum: { $cond: [{ $eq: ["$status", "NON_COMPLIANT"] }, 1, 0] } },
        reviewRequired: { $sum: { $cond: [{ $eq: ["$status", "REVIEW_REQUIRED"] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill in zero-activity dates for a smooth continuous timeline
  const trendMap = new Map(trendAgg.map((item) => [item._id, item]));
  const trend = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const existing = trendMap.get(dateStr);
    trend.push({
      date: dateStr,
      label,
      total: existing?.total ?? 0,
      compliant: existing?.compliant ?? 0,
      nonCompliant: existing?.nonCompliant ?? 0,
      reviewRequired: existing?.reviewRequired ?? 0,
    });
  }

  // 3. Top Violations (Unwind findings and group by rule & field)
  const violationAgg = await Inspection.aggregate([
    { $match: scopeFilter },
    { $unwind: "$findings" },
    {
      $match: {
        "findings.outcome": { $in: ["NON_COMPLIANT", "REVIEW_REQUIRED", "WARNING"] },
      },
    },
    {
      $group: {
        _id: {
          field: "$findings.field",
          ruleCode: "$findings.ruleCode",
          ruleName: "$findings.ruleName",
        },
        count: { $sum: 1 },
        nonCompliantCount: {
          $sum: { $cond: [{ $eq: ["$findings.outcome", "NON_COMPLIANT"] }, 1, 0] },
        },
        reviewRequiredCount: {
          $sum: { $cond: [{ $eq: ["$findings.outcome", "REVIEW_REQUIRED"] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 6 },
  ]);

  const topViolations = violationAgg.map((v) => ({
    field: v._id.field || "General",
    ruleCode: v._id.ruleCode || "RULE",
    ruleName: v._id.ruleName || v._id.ruleCode || "Rule violation",
    totalCount: v.count,
    nonCompliantCount: v.nonCompliantCount,
    reviewRequiredCount: v.reviewRequiredCount,
  }));

  // 4. Product Category Breakdown
  const categoryAgg = await Inspection.aggregate([
    { $match: scopeFilter },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "productDoc",
      },
    },
    { $unwind: { path: "$productDoc", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ["$productDoc.productCategory", "Unlinked / Other"] },
        total: { $sum: 1 },
        compliant: { $sum: { $cond: [{ $eq: ["$status", "COMPLIANT"] }, 1, 0] } },
        nonCompliant: { $sum: { $cond: [{ $eq: ["$status", "NON_COMPLIANT"] }, 1, 0] } },
        reviewRequired: { $sum: { $cond: [{ $eq: ["$status", "REVIEW_REQUIRED"] }, 1, 0] } },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 5 },
  ]);

  const categoryBreakdown = categoryAgg.map((c) => ({
    category: c._id || "Unlinked / Other",
    total: c.total,
    compliant: c.compliant,
    nonCompliant: c.nonCompliant,
    reviewRequired: c.reviewRequired,
    complianceRate: c.total > 0 ? Math.round((c.compliant / c.total) * 100) : 0,
  }));

  // 5. Recent Inspections
  const recentInspections = await Inspection.find(scopeFilter)
    .populate("product", "productName brand productCategory barcode")
    .populate("inspector", "name email")
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    success: true,
    stats: {
      totals: {
        total,
        compliant,
        nonCompliant,
        reviewRequired,
        pending,
        complianceRate,
      },
      trend,
      topViolations,
      categoryBreakdown,
      recentInspections,
    },
  });
});
