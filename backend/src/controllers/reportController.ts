import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Inspection } from "../models/Inspection";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { env } from "../config/env";
import { assertCanAccessInspection } from "./inspectionController";
import { generateInspectionReport } from "../services/reportGenerator";

/**
 * POST /api/inspections/:id/report (and POST /api/reports/inspections/:id)
 * Generates an official PDF report for the given inspection, stores the path,
 * and returns the generated report metadata.
 */
export const generateReport = asyncHandler(async (req: Request, res: Response) => {
  const inspection = await Inspection.findById(req.params.id)
    .populate("product")
    .populate("inspector", "name email role")
    .populate("reviewer", "name email role");

  if (!inspection) throw ApiError.notFound("Inspection not found");
  assertCanAccessInspection(req.user!, inspection);

  const report = await generateInspectionReport(inspection);

  inspection.reportPath = report.fileName;
  inspection.reportGeneratedAt = new Date();
  await inspection.save();

  res.status(201).json({
    success: true,
    message: "Inspection report generated successfully.",
    report: {
      fileName: report.fileName,
      generatedAt: inspection.reportGeneratedAt,
      downloadUrl: `/api/inspections/${inspection._id}/report`,
    },
  });
});

/**
 * GET /api/inspections/:id/report (and GET /api/reports/inspections/:id)
 * Downloads or previews the inspection PDF report. If the PDF does not exist yet,
 * it is automatically generated on-the-fly.
 * Use query `?inline=true` to render in-browser, otherwise downloads as an attachment.
 */
export const downloadReport = asyncHandler(async (req: Request, res: Response) => {
  const inspection = await Inspection.findById(req.params.id)
    .populate("product")
    .populate("inspector", "name email role")
    .populate("reviewer", "name email role");

  if (!inspection) throw ApiError.notFound("Inspection not found");
  assertCanAccessInspection(req.user!, inspection);

  let targetPath = inspection.reportPath
    ? path.join(env.reportDir, inspection.reportPath)
    : path.join(env.reportDir, `Report-${inspection.inspectionCode}.pdf`);

  if (!fs.existsSync(targetPath)) {
    const report = await generateInspectionReport(inspection);
    inspection.reportPath = report.fileName;
    inspection.reportGeneratedAt = new Date();
    await inspection.save();
    targetPath = report.filePath;
  }

  const inline = req.query.inline === "true";
  const filename = `LabelCheck-Report-${inspection.inspectionCode}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `${inline ? "inline" : "attachment"}; filename="${filename}"`
  );

  const readStream = fs.createReadStream(targetPath);
  readStream.pipe(res);
});
