import { IComplianceRule, ValidationType } from "../models/ComplianceRule";
import {
  IExtractedDeclarations,
  IImageOcrResult,
  InspectionStatus,
} from "../models/Inspection";
import { IProduct } from "../models/Product";
import { normalizeUnit } from "../utils/labelNormalization";
import {
  FieldReadabilityAssessment,
  ReadabilityAnalysisResult,
  ReadabilityClassification,
} from "./readabilityAnalyzer";

export const FINDING_OUTCOMES = ["NON_COMPLIANT", "REVIEW_REQUIRED", "WARNING"] as const;
export type FindingOutcome = (typeof FINDING_OUTCOMES)[number];

export interface ComplianceFindingEvidence {
  location: string;
  imagePath?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  ocrText?: string;
  extractedValue?: string;
  expectedValue?: string;
}

export interface ComplianceFinding {
  _id?: string;
  ruleId?: string;
  ruleCode: string;
  ruleName: string;
  validationType: ValidationType;
  field: string;
  outcome: FindingOutcome;
  message: string;
  evidence: ComplianceFindingEvidence;
  reviewStatus?: "PENDING" | "CONFIRMED" | "REJECTED" | "MARKED_FOR_REVIEW";
  reviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface RuleEngineInput {
  extractedDeclarations?: IExtractedDeclarations | null;
  product?: IProduct | null;
  readability: ReadabilityAnalysisResult;
  ocrResults: IImageOcrResult[];
}

export interface RuleEngineResult {
  findings: ComplianceFinding[];
  status: InspectionStatus;
}

function hasPresenceValue(field: string, declarations?: IExtractedDeclarations | null): boolean {
  if (!declarations) return false;
  switch (field) {
    case "mrp":
      return declarations.mrp?.value !== undefined;
    case "netQuantity":
      return declarations.netQuantity?.value !== undefined;
    case "countryOfOrigin":
      return Boolean(declarations.countryOfOrigin?.trim());
    case "manufacturer":
      return Boolean(declarations.manufacturer?.trim());
    case "consumerCare":
      return Boolean(declarations.consumerCare?.trim());
    case "bestBeforeOrExpiry":
      return Boolean(declarations.bestBeforeOrExpiry?.raw?.trim());
    case "manufacturingDate":
      return Boolean(declarations.manufacturingDate?.raw?.trim());
    case "batchNumber":
      return Boolean(declarations.batchNumber?.trim());
    default:
      return false;
  }
}

function extractedDisplay(field: string, declarations?: IExtractedDeclarations | null): string | undefined {
  if (!declarations) return undefined;
  switch (field) {
    case "mrp":
      return declarations.mrp ? `${declarations.mrp.value} (${declarations.mrp.raw})` : undefined;
    case "netQuantity":
      return declarations.netQuantity
        ? `${declarations.netQuantity.value} ${declarations.netQuantity.unit} (${declarations.netQuantity.raw})`
        : undefined;
    case "countryOfOrigin":
      return declarations.countryOfOrigin;
    case "manufacturer":
      return declarations.manufacturer;
    case "consumerCare":
      return declarations.consumerCare;
    case "bestBeforeOrExpiry":
      return declarations.bestBeforeOrExpiry?.raw;
    case "manufacturingDate":
      return declarations.manufacturingDate?.raw;
    case "batchNumber":
      return declarations.batchNumber;
    default:
      return undefined;
  }
}

function productExpected(field: string, product?: IProduct | null): string | undefined {
  if (!product) return undefined;
  switch (field) {
    case "mrp":
      return product.mrp !== undefined ? String(product.mrp) : undefined;
    case "netQuantity":
      return product.netQuantity !== undefined && product.unit
        ? `${product.netQuantity} ${product.unit}`
        : undefined;
    case "countryOfOrigin":
      return product.countryOfOrigin;
    case "manufacturer":
      return product.manufacturer;
    case "consumerCare":
      return product.consumerCare;
    case "bestBeforeOrExpiry":
      return product.bestBeforeOrExpiry?.toISOString().slice(0, 10);
    default:
      return undefined;
  }
}

function ocrSnippetForField(field: string, ocrResults: IImageOcrResult[]): string | undefined {
  const combined = ocrResults.map((r) => r.fullText).join("\n");
  if (field === "mrp") {
    const m = combined.match(/(?:m\.?\s*r\.?\s*p|maximum\s+retail\s+price)[^\n]*/i);
    return m?.[0];
  }
  if (field === "netQuantity") {
    const m = combined.match(/net\s*(?:qty|quantity|wt|weight|contents)?[^\n]*/i);
    return m?.[0];
  }
  return combined.slice(0, 120) || undefined;
}

function readabilityForField(
  field: string,
  readability: ReadabilityAnalysisResult
): FieldReadabilityAssessment | undefined {
  if (field !== "mrp" && field !== "netQuantity") return undefined;
  return readability.assessments.find((a) => a.field === field);
}

function severityToOutcome(severity: "NON_COMPLIANT" | "REVIEW_REQUIRED"): FindingOutcome {
  return severity;
}

function evaluatePresence(rule: IComplianceRule, input: RuleEngineInput): ComplianceFinding | null {
  if (hasPresenceValue(rule.targetField, input.extractedDeclarations)) return null;

  return {
    ruleId: rule.id,
    ruleCode: rule.ruleCode,
    ruleName: rule.name,
    validationType: rule.validationType,
    field: rule.targetField,
    outcome: severityToOutcome(rule.defaultSeverity),
    message: `${rule.name}: no "${rule.targetField}" declaration was found in the OCR text.`,
    evidence: {
      location: "Declaration extraction (OCR full text)",
      ocrText: ocrSnippetForField(rule.targetField, input.ocrResults),
      extractedValue: extractedDisplay(rule.targetField, input.extractedDeclarations),
    },
  };
}

function evaluateConsistency(rule: IComplianceRule, input: RuleEngineInput): ComplianceFinding | null {
  if (!input.product) return null;

  const declarations = input.extractedDeclarations;
  if (!declarations) {
    return {
      ruleId: rule.id,
      ruleCode: rule.ruleCode,
      ruleName: rule.name,
      validationType: rule.validationType,
      field: rule.targetField,
      outcome: severityToOutcome(rule.defaultSeverity),
      message: `${rule.name}: cannot compare against the repository — no declarations were extracted.`,
      evidence: {
        location: "Product repository cross-check",
        expectedValue: productExpected(rule.targetField, input.product),
      },
    };
  }

  if (rule.targetField === "mrp") {
    if (declarations.mrp?.value === undefined || input.product.mrp === undefined) return null;
    if (declarations.mrp.value !== input.product.mrp) {
      return {
        ruleId: rule.id,
        ruleCode: rule.ruleCode,
        ruleName: rule.name,
        validationType: rule.validationType,
        field: rule.targetField,
        outcome: severityToOutcome(rule.defaultSeverity),
        message: `MRP on the label (₹${declarations.mrp.value}) does not match the repository record (₹${input.product.mrp}).`,
        evidence: {
          location: "Extracted MRP vs product repository",
          extractedValue: String(declarations.mrp.value),
          expectedValue: String(input.product.mrp),
          ocrText: declarations.mrp.raw,
        },
      };
    }
    return null;
  }

  if (rule.targetField === "netQuantity") {
    if (
      declarations.netQuantity?.value === undefined ||
      input.product.netQuantity === undefined ||
      !input.product.unit
    ) {
      return null;
    }
    const labelUnit = declarations.netQuantity.unit;
    const repoUnit = normalizeUnit(input.product.unit) ?? input.product.unit;
    if (
      declarations.netQuantity.value !== input.product.netQuantity ||
      labelUnit !== repoUnit
    ) {
      return {
        ruleId: rule.id,
        ruleCode: rule.ruleCode,
        ruleName: rule.name,
        validationType: rule.validationType,
        field: rule.targetField,
        outcome: severityToOutcome(rule.defaultSeverity),
        message: `Net quantity on the label (${declarations.netQuantity.value} ${labelUnit}) does not match the repository (${input.product.netQuantity} ${repoUnit}).`,
        evidence: {
          location: "Extracted net quantity vs product repository",
          extractedValue: `${declarations.netQuantity.value} ${labelUnit}`,
          expectedValue: `${input.product.netQuantity} ${repoUnit}`,
          ocrText: declarations.netQuantity.raw,
        },
      };
    }
  }

  return null;
}

function evaluateFormat(rule: IComplianceRule, input: RuleEngineInput): ComplianceFinding | null {
  const declarations = input.extractedDeclarations;
  const pattern = rule.config.pattern as string | undefined;
  if (!pattern) return null;

  let raw: string | undefined;
  if (rule.targetField === "netQuantity") raw = declarations?.netQuantity?.raw;
  else if (rule.targetField === "mrp") raw = declarations?.mrp?.raw;
  else return null;

  if (!raw) return null;

  const regex = new RegExp(pattern, "i");
  const invert = Boolean(rule.config.invertMatch);

  const matched = regex.test(raw);
  const fails = invert ? matched : !matched;

  if (!fails) return null;

  return {
    ruleId: rule.id,
    ruleCode: rule.ruleCode,
    ruleName: rule.name,
    validationType: rule.validationType,
    field: rule.targetField,
    outcome: severityToOutcome(rule.defaultSeverity),
    message: rule.description,
    evidence: {
      location: "Extracted declaration raw text",
      extractedValue: raw,
      ocrText: raw,
    },
  };
}

function readabilityOutcome(classification: ReadabilityClassification): FindingOutcome {
  if (classification === "PASS") return "WARNING"; // not used when pass
  if (classification === "WARNING") return "WARNING";
  return "REVIEW_REQUIRED";
}

function evaluateReadability(rule: IComplianceRule, input: RuleEngineInput): ComplianceFinding | null {
  const assessment = readabilityForField(rule.targetField, input.readability);
  if (!assessment) return null;

  const failOn = (rule.config.failOn as ReadabilityClassification[] | undefined) ?? [
    "WARNING",
    "REVIEW_REQUIRED",
  ];
  if (!failOn.includes(assessment.classification)) return null;

  const outcome =
    assessment.classification === "REVIEW_REQUIRED"
      ? "REVIEW_REQUIRED"
      : (rule.config.warningOutcome as FindingOutcome | undefined) ?? "WARNING";

  return {
    ruleId: rule.id,
    ruleCode: rule.ruleCode,
    ruleName: rule.name,
    validationType: rule.validationType,
    field: rule.targetField,
    outcome,
    message: `${rule.name}: ${assessment.message}`,
    evidence: {
      location: `OCR block on ${assessment.imagePath}`,
      imagePath: assessment.imagePath,
      boundingBox: assessment.boundingBox,
      ocrText: assessment.matchedText,
      extractedValue: `relative height ${(assessment.relativeHeight * 100).toFixed(2)}%, confidence ${(assessment.ocrConfidence * 100).toFixed(0)}%`,
    },
  };
}

function evaluateRule(rule: IComplianceRule, input: RuleEngineInput): ComplianceFinding | null {
  switch (rule.validationType as ValidationType) {
    case "PRESENCE":
      return evaluatePresence(rule, input);
    case "CONSISTENCY":
      return evaluateConsistency(rule, input);
    case "FORMAT":
      return evaluateFormat(rule, input);
    case "READABILITY":
      return evaluateReadability(rule, input);
    default:
      return null;
  }
}

/**
 * Inspection verdict policy:
 * - Any NON_COMPLIANT finding → NON_COMPLIANT
 * - Else any REVIEW_REQUIRED or WARNING → REVIEW_REQUIRED
 * - Else → COMPLIANT
 */
export function deriveInspectionStatus(findings: ComplianceFinding[]): InspectionStatus {
  if (findings.some((f) => f.outcome === "NON_COMPLIANT")) return "NON_COMPLIANT";
  if (findings.some((f) => f.outcome === "REVIEW_REQUIRED" || f.outcome === "WARNING")) {
    return "REVIEW_REQUIRED";
  }
  return "COMPLIANT";
}

/**
 * Human-in-the-Loop verdict policy (Phase 14):
 * Evaluates active (non-rejected) findings to determine effective inspection status.
 * - REJECTED findings are disregarded (treated as resolved false-positives)
 * - Any active NON_COMPLIANT finding → NON_COMPLIANT
 * - Any active REVIEW_REQUIRED / WARNING or explicit MARKED_FOR_REVIEW → REVIEW_REQUIRED
 * - When all findings are rejected (or none existed) → COMPLIANT
 */
export function recalculateInspectionStatusAfterReview(
  findings: Array<{
    outcome: FindingOutcome;
    reviewStatus?: "PENDING" | "CONFIRMED" | "REJECTED" | "MARKED_FOR_REVIEW";
  }>
): InspectionStatus {
  const activeFindings = findings.filter((f) => f.reviewStatus !== "REJECTED");

  if (activeFindings.length === 0) {
    return "COMPLIANT";
  }

  if (activeFindings.some((f) => f.outcome === "NON_COMPLIANT")) {
    return "NON_COMPLIANT";
  }

  if (
    activeFindings.some(
      (f) =>
        f.outcome === "REVIEW_REQUIRED" ||
        f.outcome === "WARNING" ||
        f.reviewStatus === "MARKED_FOR_REVIEW"
    )
  ) {
    return "REVIEW_REQUIRED";
  }

  return "COMPLIANT";
}

export function runRuleEngine(rules: IComplianceRule[], input: RuleEngineInput): RuleEngineResult {
  const active = rules.filter((r) => r.enabled);
  const findings: ComplianceFinding[] = [];

  for (const rule of active) {
    const finding = evaluateRule(rule, input);
    if (finding) {
      findings.push({
        ...finding,
        reviewStatus: "PENDING",
      });
    }
  }

  return {
    findings,
    status: deriveInspectionStatus(findings),
  };
}
