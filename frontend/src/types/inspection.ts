import { Product } from "./product";

export type InspectionStatus =
  | "PENDING_ANALYSIS"
  | "ANALYZING"
  | "OCR_COMPLETE"
  | "DECLARATIONS_EXTRACTED"
  | "REVIEW_REQUIRED"
  | "COMPLIANT"
  | "NON_COMPLIANT";

export interface OcrBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrBlock {
  text: string;
  confidence: number;
  boundingBox: OcrBoundingBox;
}

export interface ImageOcrResult {
  imagePath: string;
  engine: string;
  imageWidth: number;
  imageHeight: number;
  processingTimeMs: number;
  fullText: string;
  blocks: OcrBlock[];
}

export interface ExtractedDeclarations {
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

export interface ReadabilityAssessment {
  field: string;
  matchedText: string;
  relativeHeight: number;
  ocrConfidence: number;
  classification: "PASS" | "WARNING" | "REVIEW_REQUIRED";
  imagePath: string;
  boundingBox: OcrBoundingBox;
  message: string;
}

export interface ReadabilityResults {
  overall: "PASS" | "WARNING" | "REVIEW_REQUIRED";
  assessments: ReadabilityAssessment[];
}

export interface ComplianceFinding {
  _id?: string;
  ruleCode: string;
  ruleName: string;
  validationType: string;
  field: string;
  outcome: "NON_COMPLIANT" | "REVIEW_REQUIRED" | "WARNING";
  message: string;
  evidence: {
    location: string;
    imagePath?: string;
    ocrText?: string;
    extractedValue?: string;
    expectedValue?: string;
  };
  reviewStatus?: "PENDING" | "CONFIRMED" | "REJECTED" | "MARKED_FOR_REVIEW";
  reviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface Inspection {
  _id: string;
  inspectionCode: string;
  inspector: string | { _id: string; name: string; email: string; role: string };
  product?: Product | string;
  images: string[];
  barcodeScanned?: string;
  barcodeMatched: boolean;
  status: InspectionStatus;
  ocrResults: ImageOcrResult[];
  extractedDeclarations?: ExtractedDeclarations;
  readabilityResults?: ReadabilityResults;
  analysisError?: string;
  findings: ComplianceFinding[];
  finalStatus?: InspectionStatus;
  reviewer?: string | { _id: string; name: string; email: string; role: string };
  reviewedAt?: string;
  reportPath?: string;
  reportGeneratedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductMatch {
  matched: boolean;
  product?: Product;
  message?: string | null;
}

export interface CreateInspectionResponse {
  success: true;
  inspection: Inspection;
  productMatch: ProductMatch;
}
