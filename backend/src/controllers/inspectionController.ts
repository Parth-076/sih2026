import { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import { imageSize } from "image-size";
import { z } from "zod";
import mongoose from "mongoose";
import {
  Inspection,
  generateInspectionCode,
  IInspection,
  INSPECTION_STATUSES,
} from "../models/Inspection";
import { IProduct, Product } from "../models/Product";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { env } from "../config/env";
import { runOcrOnImage, AiServiceUnavailableError } from "../services/aiServiceClient";
import { extractDeclarations, ExtractedDeclarations } from "../services/declarationExtractor";
import { analyzeReadability, ReadabilityAnalysisResult } from "../services/readabilityAnalyzer";
import { runRuleEngine, recalculateInspectionStatusAfterReview } from "../services/ruleEngine";
import { ComplianceRule } from "../models/ComplianceRule";
import { IExtractedDeclarations } from "../models/Inspection";
import { uploadPathToFilePath, mimeTypeForFile } from "../utils/uploadPaths";
import { JwtPayload } from "../types";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const createInspectionMetaSchema = z.object({
  barcode: z.string().trim().optional(),
  productId: z.string().trim().optional(),
});

/** Inspector may only touch their own inspections; Officer/Admin may touch any. */
export function assertCanAccessInspection(user: JwtPayload, inspection: IInspection) {
  const inspectorId =
    inspection.inspector && typeof inspection.inspector === "object" && "_id" in inspection.inspector
      ? String((inspection.inspector as { _id: unknown })._id)
      : String(inspection.inspector);

  if (user.role === "INSPECTOR" && inspectorId !== user.sub) {
    throw ApiError.forbidden("You can only access your own inspections.");
  }
}

/**
 * POST /api/inspections  (multipart/form-data)
 * Fields: images[] (1-6 files, required), barcode? (already decoded
 * client-side or entered manually), productId? (if the frontend already
 * resolved a repository match).
 *
 * Inspector, Officer, and Admin may all start an inspection (brief §6).
 * This is the "Upload Image" + "Barcode Scanning" → "Product Repository"
 * stage of the flow; OCR/rule analysis is wired on in later phases.
 */
export const createInspection = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) {
    throw ApiError.badRequest(
      "At least one package image is required to start an inspection."
    );
  }

  const metaResult = createInspectionMetaSchema.safeParse(req.body);
  if (!metaResult.success) {
    throw ApiError.badRequest("Invalid request data", metaResult.error.flatten());
  }
  const meta = metaResult.data;

  // Reject corrupt/unreadable images before we persist anything. image-size
  // parses just the file header, so this catches truncated/garbage files
  // without a heavyweight native decode dependency.
  for (const file of files) {
    try {
      const dims = imageSize(file.buffer);
      if (!dims.width || !dims.height) {
        throw new Error("no dimensions");
      }
    } catch {
      throw ApiError.badRequest(
        `"${file.originalname}" could not be read as a valid image. It may be corrupted — please re-upload.`
      );
    }
  }

  // Resolve the product, if any, from an explicit productId or a scanned barcode.
  let product = null;
  let barcodeMatched = false;
  if (meta.productId) {
    product = await Product.findById(meta.productId);
    if (!product) throw ApiError.badRequest("Selected product was not found.");
  } else if (meta.barcode) {
    product = await Product.findOne({ barcode: meta.barcode });
    barcodeMatched = Boolean(product);
    // No product match is not an error — brief §9 says continue with
    // image-based inspection and surface "product not found" instead.
  }

  const inspectionCode = await generateInspectionCode();

  const inspection = await Inspection.create({
    inspectionCode,
    inspector: req.user!.sub,
    product: product?._id,
    images: [],
    barcodeScanned: meta.barcode,
    barcodeMatched,
    status: "PENDING_ANALYSIS",
  });

  // Now that we have an inspection id, persist the images under a
  // dedicated folder and record their served paths.
  const inspectionDir = path.join(env.uploadDir, "inspections", inspection.id);
  await fs.mkdir(inspectionDir, { recursive: true });

  const savedPaths: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = EXT_BY_MIME[file.mimetype] ?? "jpg";
    const filename = `img-${i}.${ext}`;
    await fs.writeFile(path.join(inspectionDir, filename), file.buffer);
    savedPaths.push(`/uploads/inspections/${inspection.id}/${filename}`);
  }

  inspection.images = savedPaths;
  await inspection.save();

  res.status(201).json({
    success: true,
    inspection,
    productMatch: product
      ? { matched: true, product }
      : meta.barcode
        ? { matched: false, message: "Product ID detected but product was not found in repository." }
        : { matched: false, message: null },
  });
});

/**
 * GET /api/inspections/:id
 * Inspector may view only their own inspections; Officer/Admin may view any.
 */
export const getInspection = asyncHandler(async (req: Request, res: Response) => {
  const inspection = await Inspection.findById(req.params.id).populate("product");
  if (!inspection) throw ApiError.notFound("Inspection not found");

  assertCanAccessInspection(req.user!, inspection);

  res.json({ success: true, inspection });
});

function declarationsToStored(extracted: ExtractedDeclarations): IExtractedDeclarations | undefined {
  const stored: IExtractedDeclarations = {};
  if (extracted.mrp) stored.mrp = extracted.mrp;
  if (extracted.netQuantity) stored.netQuantity = extracted.netQuantity;
  if (extracted.manufacturingDate) {
    stored.manufacturingDate = {
      raw: extracted.manufacturingDate.raw,
      parsed: extracted.manufacturingDate.parsed ?? undefined,
    };
  }
  if (extracted.packingDate) {
    stored.packingDate = {
      raw: extracted.packingDate.raw,
      parsed: extracted.packingDate.parsed ?? undefined,
    };
  }
  if (extracted.bestBeforeOrExpiry) {
    stored.bestBeforeOrExpiry = {
      raw: extracted.bestBeforeOrExpiry.raw,
      parsed: extracted.bestBeforeOrExpiry.parsed ?? undefined,
    };
  }
  if (extracted.countryOfOrigin) stored.countryOfOrigin = extracted.countryOfOrigin;
  if (extracted.manufacturer) stored.manufacturer = extracted.manufacturer;
  if (extracted.consumerCare) stored.consumerCare = extracted.consumerCare;
  if (extracted.batchNumber) stored.batchNumber = extracted.batchNumber;
  return Object.keys(stored).length > 0 ? stored : undefined;
}

/**
 * POST /api/inspections/:id/analyze
 * Runs OCR (via the Python AI service), declaration extraction (brief §11),
 * font/readability analysis (brief §12), and the configurable compliance rule
 * engine (Phase 9). The returned `status` is the computed verdict:
 * COMPLIANT, NON_COMPLIANT, or REVIEW_REQUIRED.
 *
 * If the AI service is unavailable, the inspection is reverted to
 * PENDING_ANALYSIS with `analysisError` set, and this endpoint returns 503.
 */
export const analyzeInspection = asyncHandler(async (req: Request, res: Response) => {
  const inspection = await Inspection.findById(req.params.id).populate("product");
  if (!inspection) throw ApiError.notFound("Inspection not found");
  assertCanAccessInspection(req.user!, inspection);

  if (inspection.images.length === 0) {
    throw ApiError.badRequest("This inspection has no images to analyze.");
  }

  inspection.status = "ANALYZING";
  inspection.analysisError = undefined;
  inspection.findings = [];
  await inspection.save();

  try {
    const results = [];
    for (const imagePath of inspection.images) {
      const filePath = uploadPathToFilePath(imagePath);
      const buffer = await fs.readFile(filePath);
      const mimeType = mimeTypeForFile(filePath);
      const ocr = await runOcrOnImage(buffer, path.basename(filePath), mimeType);
      results.push({ imagePath, ...ocr });
    }

    inspection.ocrResults = results;

    const combinedText = results.map((r) => r.fullText).join("\n");
    inspection.extractedDeclarations = declarationsToStored(extractDeclarations(combinedText));

    inspection.readabilityResults = analyzeReadability(results);

    const rules = await ComplianceRule.find({ enabled: true }).sort({ ruleCode: 1 });
    const productDoc =
      inspection.product && typeof inspection.product === "object"
        ? inspection.product
        : inspection.product
          ? await Product.findById(inspection.product)
          : null;

    const ruleResult = runRuleEngine(rules, {
      extractedDeclarations: inspection.extractedDeclarations,
      product: productDoc as IProduct | null,
      readability: inspection.readabilityResults as ReadabilityAnalysisResult,
      ocrResults: results,
    });

    inspection.findings = ruleResult.findings;
    inspection.status = ruleResult.status;
    if (ruleResult.status === "COMPLIANT") {
      inspection.finalStatus = "COMPLIANT";
    }
    await inspection.save();

    res.json({ success: true, inspection });
  } catch (err) {
    inspection.status = "PENDING_ANALYSIS";
    inspection.analysisError =
      err instanceof AiServiceUnavailableError
        ? err.message
        : "Analysis failed unexpectedly. Please try again.";
    await inspection.save();

    if (err instanceof AiServiceUnavailableError) {
      throw new ApiError(503, err.message);
    }
    throw err;
  }
});

/**
 * GET /api/inspections?page=&limit=&status=&product=&inspector=&category=&severity=&startDate=&endDate=&search=
 *
 * Phase 12 (Inspection History):
 * Supports multi-dimensional search & filtering:
 * - status: single or comma-separated inspection statuses
 * - product: matches productName, brand, barcode, or ObjectId
 * - inspector: inspector ID or name/email search (Inspectors remain strictly scoped to own records)
 * - category: product category via linked product
 * - severity: finding outcome (NON_COMPLIANT, REVIEW_REQUIRED, WARNING)
 * - date range: startDate / from and endDate / to
 * - search / q: keyword matching inspection code, barcode, or product name
 */
export const listInspections = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));

  const filter: Record<string, unknown> = {};

  // 1. Role-based scoping: Inspector can ONLY EVER see their own records
  if (req.user!.role === "INSPECTOR") {
    filter.inspector = req.user!.sub;
  } else if (req.query.inspector) {
    // Officer / Admin can filter by inspector (ObjectId, email, or name)
    const inspTerm = String(req.query.inspector).trim();
    if (mongoose.Types.ObjectId.isValid(inspTerm)) {
      filter.inspector = inspTerm;
    } else {
      const matchingUsers = await User.find({
        $or: [
          { name: new RegExp(inspTerm, "i") },
          { email: new RegExp(inspTerm, "i") },
        ],
      }).select("_id");
      filter.inspector = { $in: matchingUsers.map((u) => u._id) };
    }
  }

  // 2. Status filter
  if (req.query.status) {
    const statuses = String(req.query.status)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (statuses.length === 1) {
      filter.status = statuses[0];
    } else if (statuses.length > 1) {
      filter.status = { $in: statuses };
    }
  }

  // 3. Severity filter (finding outcome: NON_COMPLIANT, REVIEW_REQUIRED, WARNING)
  if (req.query.severity) {
    const sevs = String(req.query.severity)
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    if (sevs.length === 1) {
      filter["findings.outcome"] = sevs[0];
    } else if (sevs.length > 1) {
      filter["findings.outcome"] = { $in: sevs };
    }
  }

  // 4. Date range filter (from / to / startDate / endDate)
  const startDate = req.query.startDate || req.query.from || req.query.dateFrom;
  const endDate = req.query.endDate || req.query.to || req.query.dateTo;
  if (startDate || endDate) {
    const dateQuery: Record<string, Date> = {};
    if (startDate) {
      const parsedStart = new Date(String(startDate));
      if (!isNaN(parsedStart.getTime())) {
        dateQuery.$gte = parsedStart;
      }
    }
    if (endDate) {
      const parsedEnd = new Date(String(endDate));
      if (!isNaN(parsedEnd.getTime())) {
        // If string is YYYY-MM-DD (10 chars), extend to end of that day
        if (String(endDate).length === 10) {
          parsedEnd.setHours(23, 59, 59, 999);
        }
        dateQuery.$lte = parsedEnd;
      }
    }
    if (Object.keys(dateQuery).length > 0) {
      filter.createdAt = dateQuery;
    }
  }

  // 5. Category filter & Product filter
  const categoryParam = req.query.category ? String(req.query.category).trim() : null;
  const productParam = req.query.product ? String(req.query.product).trim() : null;

  if (categoryParam || productParam) {
    const productQuery: Record<string, unknown> = {};
    if (categoryParam) {
      productQuery.productCategory = new RegExp(categoryParam, "i");
    }
    if (productParam) {
      if (mongoose.Types.ObjectId.isValid(productParam)) {
        productQuery._id = productParam;
      } else {
        productQuery.$or = [
          { productName: new RegExp(productParam, "i") },
          { brand: new RegExp(productParam, "i") },
          { barcode: productParam },
        ];
      }
    }
    const matchingProducts = await Product.find(productQuery).select("_id");
    const productIds = matchingProducts.map((p) => p._id);
    filter.product = { $in: productIds };
  }

  // 6. Keyword search (inspectionCode, barcodeScanned, or product name)
  const searchParam = req.query.search || req.query.q;
  if (searchParam) {
    const term = String(searchParam).trim();
    if (term) {
      const matchingProducts = await Product.find({
        $or: [
          { productName: new RegExp(term, "i") },
          { brand: new RegExp(term, "i") },
        ],
      }).select("_id");
      const matchedProdIds = matchingProducts.map((p) => p._id);

      const orClause = [
        { inspectionCode: new RegExp(term, "i") },
        { barcodeScanned: new RegExp(term, "i") },
        { product: { $in: matchedProdIds } },
      ];

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: orClause }];
        delete filter.$or;
      } else {
        filter.$or = orClause;
      }
    }
  }

  const [inspections, total] = await Promise.all([
    Inspection.find(filter)
      .populate("product", "productName brand productCategory barcode mrp netQuantity unit")
      .populate("inspector", "name email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Inspection.countDocuments(filter),
  ]);

  res.json({
    success: true,
    inspections,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

/**
 * PATCH /api/inspections/:id/findings/:findingId/review
 * POST  /api/inspections/:id/findings/:findingId/review
 * POST  /api/inspections/:id/review-finding
 *
 * Phase 14 (Human-in-the-Loop Verification):
 * Allows Inspectors (for own records) or Officers / Admins (for all)
 * to confirm, reject, or mark a compliance finding for review.
 * - confirm: confirms violation (retained in status evaluation)
 * - reject: rejects finding (disregarded in status evaluation; if all non-compliant findings are rejected, status becomes COMPLIANT)
 * - mark-for-review: marks finding as requiring supervisor review (status becomes REVIEW_REQUIRED)
 */
export const reviewFinding = asyncHandler(async (req: Request, res: Response) => {
  const inspection = await Inspection.findById(req.params.id);
  if (!inspection) throw ApiError.notFound("Inspection not found");
  assertCanAccessInspection(req.user!, inspection);

  const findingRef =
    req.params.findingId ??
    req.body.findingId ??
    (req.body.index !== undefined ? String(req.body.index) : undefined);

  if (findingRef === undefined || findingRef === "") {
    throw ApiError.badRequest("Finding identifier (findingId or index) is required");
  }

  let findingIndex = -1;
  // If it's a numeric index (0, 1, 2...)
  if (/^\d+$/.test(findingRef)) {
    const idx = parseInt(findingRef, 10);
    if (idx >= 0 && idx < inspection.findings.length) {
      findingIndex = idx;
    }
  }

  // If not found by index, look up by _id or ruleCode
  if (findingIndex === -1) {
    findingIndex = inspection.findings.findIndex(
      (f: any) =>
        (f._id && f._id.toString() === findingRef) ||
        f.ruleCode?.toLowerCase() === findingRef.toLowerCase()
    );
  }

  if (findingIndex === -1) {
    throw ApiError.notFound("Compliance finding not found in this inspection");
  }

  const rawAction = String(req.body.action || req.body.reviewStatus || req.body.status || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

  let targetStatus: "CONFIRMED" | "REJECTED" | "MARKED_FOR_REVIEW";
  if (rawAction === "confirm" || rawAction === "confirmed") {
    targetStatus = "CONFIRMED";
  } else if (rawAction === "reject" || rawAction === "rejected") {
    targetStatus = "REJECTED";
  } else if (
    rawAction === "mark-for-review" ||
    rawAction === "marked-for-review" ||
    rawAction === "review"
  ) {
    targetStatus = "MARKED_FOR_REVIEW";
  } else {
    throw ApiError.badRequest(
      `Invalid review action '${rawAction}'. Supported actions: confirm, reject, mark-for-review`
    );
  }

  const finding = inspection.findings[findingIndex];
  finding.reviewStatus = targetStatus;
  if (req.body.comment !== undefined) {
    finding.reviewComment = String(req.body.comment).trim();
  }
  finding.reviewedBy = new mongoose.Types.ObjectId(req.user!.sub);
  finding.reviewedAt = new Date();

  // Audit trail on inspection level
  inspection.reviewer = new mongoose.Types.ObjectId(req.user!.sub);
  inspection.reviewedAt = new Date();

  // Recalculate inspection status based on human verdict
  const recalculated = recalculateInspectionStatusAfterReview(inspection.findings);
  inspection.status = recalculated;

  // FinalStatus policy
  if (req.body.finalStatus) {
    inspection.finalStatus = req.body.finalStatus;
  } else {
    const allReviewed = inspection.findings.every(
      (f) => f.reviewStatus && f.reviewStatus !== "PENDING"
    );
    if (allReviewed) {
      inspection.finalStatus = recalculated;
    }
  }

  await inspection.save();

  res.json({
    success: true,
    finding,
    inspection,
  });
});

/**
 * POST  /api/inspections/:id/review
 * PATCH /api/inspections/:id/review
 *
 * Finalizes or assigns the overall inspection review verdict (COMPLIANT, NON_COMPLIANT, REVIEW_REQUIRED).
 */
export const finalizeInspectionReview = asyncHandler(async (req: Request, res: Response) => {
  const inspection = await Inspection.findById(req.params.id);
  if (!inspection) throw ApiError.notFound("Inspection not found");
  assertCanAccessInspection(req.user!, inspection);

  const finalStatus = req.body.finalStatus ?? req.body.status;
  if (!finalStatus || !INSPECTION_STATUSES.includes(finalStatus)) {
    throw ApiError.badRequest(
      `Invalid finalStatus '${finalStatus}'. Must be one of: ${INSPECTION_STATUSES.join(", ")}`
    );
  }

  inspection.finalStatus = finalStatus;
  inspection.status = finalStatus;
  inspection.reviewer = new mongoose.Types.ObjectId(req.user!.sub);
  inspection.reviewedAt = new Date();

  await inspection.save();

  res.json({ success: true, inspection });
});

