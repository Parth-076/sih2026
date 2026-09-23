import { Schema, model, Document, Types } from "mongoose";

export const INSPECTION_STATUSES = [
  "PENDING_ANALYSIS", // images uploaded, OCR/rule pipeline not yet run
  "ANALYZING", // OCR call in flight
  "OCR_COMPLETE", // OCR done, declaration extraction not yet run
  "DECLARATIONS_EXTRACTED", // structured fields extracted; rule engine lands in a later phase
  "REVIEW_REQUIRED",
  "COMPLIANT",
  "NON_COMPLIANT",
] as const;
export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];

export interface IOcrBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IOcrBlock {
  text: string;
  confidence: number;
  boundingBox: IOcrBoundingBox;
}

export interface IImageOcrResult {
  imagePath: string;
  engine: string;
  imageWidth: number;
  imageHeight: number;
  processingTimeMs: number;
  fullText: string;
  blocks: IOcrBlock[];
}

export interface IExtractedDeclarations {
  mrp?: { value: number; raw: string };
  netQuantity?: { value: number; unit: string; raw: string };
  manufacturingDate?: { raw: string; parsed?: string };
  packingDate?: { raw: string; parsed?: string };
  bestBeforeOrExpiry?: { raw: string; parsed?: string };
  countryOfOrigin?: string;
  manufacturer?: string;
  consumerCare?: string;
  batchNumber?: string;
}

export interface IReadabilityAssessment {
  field: string;
  matchedText: string;
  relativeHeight: number;
  ocrConfidence: number;
  classification: "PASS" | "WARNING" | "REVIEW_REQUIRED";
  imagePath: string;
  boundingBox: IOcrBoundingBox;
  message: string;
}

export interface IReadabilityResults {
  overall: "PASS" | "WARNING" | "REVIEW_REQUIRED";
  assessments: IReadabilityAssessment[];
  thresholds: {
    minRelativeHeightPass: number;
    minRelativeHeightWarning: number;
    lowConfidenceThreshold: number;
  };
}

export interface IComplianceFindingEvidence {
  location: string;
  imagePath?: string;
  boundingBox?: IOcrBoundingBox;
  ocrText?: string;
  extractedValue?: string;
  expectedValue?: string;
}

export type FindingReviewStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "MARKED_FOR_REVIEW";

export interface IComplianceFinding {
  _id?: Types.ObjectId | string;
  ruleId?: string;
  ruleCode: string;
  ruleName: string;
  validationType: string;
  field: string;
  outcome: "NON_COMPLIANT" | "REVIEW_REQUIRED" | "WARNING";
  message: string;
  evidence: IComplianceFindingEvidence;
  reviewStatus?: FindingReviewStatus;
  reviewComment?: string;
  reviewedBy?: Types.ObjectId | string;
  reviewedAt?: Date;
}

export interface IInspection extends Document {
  inspectionCode: string; // human-readable ID for reports, e.g. INS-20260921-0001
  inspector: Types.ObjectId;
  product?: Types.ObjectId;
  images: string[]; // relative /uploads paths, multi-side package images
  barcodeScanned?: string;
  barcodeMatched: boolean;
  status: InspectionStatus;
  ocrResults: IImageOcrResult[];
  extractedDeclarations?: IExtractedDeclarations;
  readabilityResults?: IReadabilityResults;
  analysisError?: string; // last AI-service failure message, if any, for graceful degradation
  findings: IComplianceFinding[];
  evidence: Types.ObjectId[];
  finalStatus?: InspectionStatus;
  reviewer?: Types.ObjectId;
  reviewedAt?: Date;
  reportPath?: string;
  reportGeneratedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ocrBlockSchema = new Schema<IOcrBlock>(
  {
    text: { type: String, required: true },
    confidence: { type: Number, required: true },
    boundingBox: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true },
    },
  },
  { _id: false }
);

const imageOcrResultSchema = new Schema<IImageOcrResult>(
  {
    imagePath: { type: String, required: true },
    engine: { type: String, required: true },
    imageWidth: { type: Number, required: true },
    imageHeight: { type: Number, required: true },
    processingTimeMs: { type: Number, required: true },
    fullText: { type: String, default: "" },
    blocks: { type: [ocrBlockSchema], default: [] },
  },
  { _id: false }
);

const readabilityAssessmentSchema = new Schema<IReadabilityAssessment>(
  {
    field: String,
    matchedText: String,
    relativeHeight: Number,
    ocrConfidence: Number,
    classification: { type: String, enum: ["PASS", "WARNING", "REVIEW_REQUIRED"] },
    imagePath: String,
    boundingBox: {
      x: Number,
      y: Number,
      width: Number,
      height: Number,
    },
    message: String,
  },
  { _id: false }
);

const readabilityResultsSchema = new Schema<IReadabilityResults>(
  {
    overall: { type: String, enum: ["PASS", "WARNING", "REVIEW_REQUIRED"] },
    assessments: { type: [readabilityAssessmentSchema], default: [] },
    thresholds: {
      minRelativeHeightPass: Number,
      minRelativeHeightWarning: Number,
      lowConfidenceThreshold: Number,
    },
  },
  { _id: false }
);

const complianceFindingSchema = new Schema<IComplianceFinding>(
  {
    ruleId: String,
    ruleCode: String,
    ruleName: String,
    validationType: String,
    field: String,
    outcome: { type: String, enum: ["NON_COMPLIANT", "REVIEW_REQUIRED", "WARNING"] },
    message: String,
    evidence: {
      location: String,
      imagePath: String,
      boundingBox: {
        x: Number,
        y: Number,
        width: Number,
        height: Number,
      },
      ocrText: String,
      extractedValue: String,
      expectedValue: String,
    },
    reviewStatus: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "REJECTED", "MARKED_FOR_REVIEW"],
      default: "PENDING",
    },
    reviewComment: { type: String, trim: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { _id: true }
);

const extractedDeclarationsSchema = new Schema<IExtractedDeclarations>(
  {
    mrp: { value: Number, raw: String },
    netQuantity: { value: Number, unit: String, raw: String },
    manufacturingDate: { raw: String, parsed: String },
    packingDate: { raw: String, parsed: String },
    bestBeforeOrExpiry: { raw: String, parsed: String },
    countryOfOrigin: String,
    manufacturer: String,
    consumerCare: String,
    batchNumber: String,
  },
  { _id: false }
);

const inspectionSchema = new Schema<IInspection>(
  {
    inspectionCode: { type: String, required: true, unique: true, index: true },
    inspector: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    images: { type: [String], default: [] },
    barcodeScanned: { type: String, trim: true },
    barcodeMatched: { type: Boolean, default: false },
    status: { type: String, enum: INSPECTION_STATUSES, default: "PENDING_ANALYSIS", index: true },
    ocrResults: { type: [imageOcrResultSchema], default: [] },
    extractedDeclarations: { type: extractedDeclarationsSchema },
    readabilityResults: { type: readabilityResultsSchema },
    analysisError: { type: String },
    findings: { type: [complianceFindingSchema], default: [] },
    evidence: { type: [Schema.Types.ObjectId], ref: "Evidence", default: [] },
    finalStatus: { type: String, enum: INSPECTION_STATUSES },
    reviewer: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reportPath: { type: String },
    reportGeneratedAt: { type: Date },
  },
  { timestamps: true }
);

inspectionSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete (ret as unknown as Record<string, unknown>).__v;
    return ret;
  },
});

export const Inspection = model<IInspection>("Inspection", inspectionSchema);

/**
 * Generates a readable, sortable inspection code: INS-YYYYMMDD-NNNN, where
 * NNNN is a per-day counter. Not cryptographically unique across a race,
 * but the schema's unique index catches any collision and the caller can
 * retry — acceptable for a single-instance local deployment.
 */
export async function generateInspectionCode(): Promise<string> {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const countToday = await Inspection.countDocuments({ createdAt: { $gte: startOfDay } });
  const seq = String(countToday + 1).padStart(4, "0");
  return `INS-${datePart}-${seq}`;
}
