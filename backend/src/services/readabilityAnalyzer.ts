import { IImageOcrResult, IOcrBoundingBox } from "../models/Inspection";

export const READABILITY_CLASSIFICATIONS = ["PASS", "WARNING", "REVIEW_REQUIRED"] as const;
export type ReadabilityClassification = (typeof READABILITY_CLASSIFICATIONS)[number];

export type ReadabilityField = "mrp" | "netQuantity";

export interface FieldReadabilityAssessment {
  field: ReadabilityField;
  matchedText: string;
  relativeHeight: number;
  ocrConfidence: number;
  classification: ReadabilityClassification;
  imagePath: string;
  boundingBox: IOcrBoundingBox;
  message: string;
}

export interface ReadabilityAnalysisResult {
  overall: ReadabilityClassification;
  assessments: FieldReadabilityAssessment[];
  thresholds: {
    minRelativeHeightPass: number;
    minRelativeHeightWarning: number;
    lowConfidenceThreshold: number;
  };
}

const DEFAULT_THRESHOLDS = {
  minRelativeHeightPass: 0.028,
  minRelativeHeightWarning: 0.018,
  lowConfidenceThreshold: 0.75,
};

const MRP_BLOCK = /m\.?\s*r\.?\s*p|maximum\s+retail\s+price|₹|rs\.?\s*\d/i;
const NET_QTY_BLOCK = /net\s*(?:qty|quantity|wt|weight|contents)|\d+\s*(?:g|kg|ml|l)\b/i;

function classifyRelativeHeight(
  relativeHeight: number,
  thresholds: typeof DEFAULT_THRESHOLDS
): ReadabilityClassification {
  if (relativeHeight >= thresholds.minRelativeHeightPass) return "PASS";
  if (relativeHeight >= thresholds.minRelativeHeightWarning) return "WARNING";
  return "REVIEW_REQUIRED";
}

function bumpClassification(
  current: ReadabilityClassification,
  lowConfidence: boolean
): ReadabilityClassification {
  if (!lowConfidence) return current;
  if (current === "PASS") return "WARNING";
  return "REVIEW_REQUIRED";
}

function worstClassification(
  items: ReadabilityClassification[]
): ReadabilityClassification {
  if (items.includes("REVIEW_REQUIRED")) return "REVIEW_REQUIRED";
  if (items.includes("WARNING")) return "WARNING";
  return "PASS";
}

function fieldForBlock(text: string): ReadabilityField | null {
  if (MRP_BLOCK.test(text)) return "mrp";
  if (NET_QTY_BLOCK.test(text)) return "netQuantity";
  return null;
}

/**
 * Estimates label readability from OCR bounding boxes and image dimensions
 * (brief §12). This is a rough CV proxy — not a legal font-size measurement.
 */
export function analyzeReadability(
  ocrResults: IImageOcrResult[],
  thresholds: Partial<typeof DEFAULT_THRESHOLDS> = {}
): ReadabilityAnalysisResult {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds };
  const assessments: FieldReadabilityAssessment[] = [];

  for (const image of ocrResults) {
    if (!image.imageHeight || image.imageHeight <= 0) continue;

    for (const block of image.blocks) {
      const field = fieldForBlock(block.text);
      if (!field) continue;

      const relativeHeight = block.boundingBox.height / image.imageHeight;
      const lowConfidence = block.confidence < t.lowConfidenceThreshold;
      let classification = classifyRelativeHeight(relativeHeight, t);
      classification = bumpClassification(classification, lowConfidence);

      const message =
        classification === "PASS"
          ? "Text block appears large enough to read at this image resolution."
          : classification === "WARNING"
            ? "Text block is relatively small or low-confidence — verify legibility on the physical label."
            : "Text block is very small or low-confidence — manual readability review recommended.";

      assessments.push({
        field,
        matchedText: block.text,
        relativeHeight,
        ocrConfidence: block.confidence,
        classification,
        imagePath: image.imagePath,
        boundingBox: block.boundingBox,
        message,
      });
    }
  }

  // Keep the worst assessment per field (MRP and net quantity matter most for LM).
  const byField = new Map<ReadabilityField, FieldReadabilityAssessment>();
  for (const a of assessments) {
    const existing = byField.get(a.field);
    if (!existing) {
      byField.set(a.field, a);
      continue;
    }
    const worse = worstClassification([existing.classification, a.classification]);
    if (worse !== existing.classification || a.relativeHeight < existing.relativeHeight) {
      byField.set(a.field, a);
    }
  }

  const merged = [...byField.values()];
  const overall = worstClassification(merged.map((a) => a.classification));

  return {
    overall,
    assessments: merged,
    thresholds: t,
  };
}
