import {
  runRuleEngine,
  deriveInspectionStatus,
  recalculateInspectionStatusAfterReview,
} from "../src/services/ruleEngine";
import { IComplianceRule } from "../src/models/ComplianceRule";
import { analyzeReadability } from "../src/services/readabilityAnalyzer";
import { IImageOcrResult } from "../src/models/Inspection";

const baseRule = (overrides: Partial<IComplianceRule>): IComplianceRule =>
  ({
    id: "rule-id",
    enabled: true,
    isPrototype: true,
    config: {},
    ...overrides,
  }) as IComplianceRule;

const ocrResults: IImageOcrResult[] = [
  {
    imagePath: "/uploads/a.png",
    engine: "test",
    imageWidth: 800,
    imageHeight: 600,
    processingTimeMs: 1,
    fullText: "MRP Rs. 109\nNet Qty 200g\nCountry of Origin India",
    blocks: [],
  },
];

describe("deriveInspectionStatus", () => {
  it("prefers NON_COMPLIANT over REVIEW_REQUIRED", () => {
    expect(
      deriveInspectionStatus([
        {
          ruleCode: "A",
          ruleName: "A",
          validationType: "PRESENCE",
          field: "mrp",
          outcome: "REVIEW_REQUIRED",
          message: "",
          evidence: { location: "" },
        },
        {
          ruleCode: "B",
          ruleName: "B",
          validationType: "CONSISTENCY",
          field: "mrp",
          outcome: "NON_COMPLIANT",
          message: "",
          evidence: { location: "" },
        },
      ])
    ).toBe("NON_COMPLIANT");
  });
});

describe("runRuleEngine", () => {
  it("flags missing country of origin as NON_COMPLIANT", () => {
    const rules = [
      baseRule({
        ruleCode: "LM-ORIGIN-PRESENCE",
        name: "Country of origin",
        validationType: "PRESENCE",
        targetField: "countryOfOrigin",
        defaultSeverity: "NON_COMPLIANT",
      }),
    ];

    const readability = analyzeReadability(ocrResults);
    const result = runRuleEngine(rules, {
      extractedDeclarations: {
        mrp: { value: 99, raw: "MRP Rs. 99" },
        netQuantity: { value: 200, unit: "g", raw: "Net Qty 200g" },
      },
      product: null,
      readability,
      ocrResults,
    });

    expect(result.findings).toHaveLength(1);
    expect(result.status).toBe("NON_COMPLIANT");
  });

  it("flags MRP mismatch against repository as NON_COMPLIANT", () => {
    const rules = [
      baseRule({
        ruleCode: "LM-MRP-CONSISTENCY",
        name: "MRP consistency",
        validationType: "CONSISTENCY",
        targetField: "mrp",
        defaultSeverity: "NON_COMPLIANT",
      }),
    ];

    const readability = analyzeReadability(ocrResults);
    const result = runRuleEngine(rules, {
      extractedDeclarations: { mrp: { value: 109, raw: "MRP Rs. 109" } },
      product: { mrp: 99 } as never,
      readability,
      ocrResults,
    });

    expect(result.findings[0].outcome).toBe("NON_COMPLIANT");
    expect(result.status).toBe("NON_COMPLIANT");
  });

  it("flags non-standard format as WARNING or REVIEW_REQUIRED", () => {
    const rules = [
      baseRule({
        ruleCode: "LM-MRP-FORMAT",
        name: "MRP currency format",
        validationType: "FORMAT",
        targetField: "mrp",
        defaultSeverity: "REVIEW_REQUIRED",
        config: {
          pattern: "(?:m\\.?\\s*r\\.?\\s*p|maximum\\s+retail\\s+price|₹|rs\\.?)",
          invertMatch: false, // fails when pattern does NOT match
        },
      }),
    ];

    const readability = analyzeReadability(ocrResults);
    const result = runRuleEngine(rules, {
      extractedDeclarations: {
        mrp: { value: 99, raw: "Price 99 only" }, // missing MRP / Rs / ₹
      },
      product: null,
      readability,
      ocrResults,
    });

    expect(result.findings.length).toBe(1);
    expect(result.findings[0].ruleCode).toBe("LM-MRP-FORMAT");
  });

  it("flags poor font readability as REVIEW_REQUIRED", () => {
    const rules = [
      baseRule({
        ruleCode: "LM-READABILITY-MRP",
        name: "MRP readability",
        validationType: "READABILITY",
        targetField: "mrp",
        defaultSeverity: "REVIEW_REQUIRED",
        config: {
          failOn: ["REVIEW_REQUIRED", "WARNING"],
        },
      }),
    ];

    // Mock readability result where MRP was classified as REVIEW_REQUIRED
    const mockReadability = {
      overall: "REVIEW_REQUIRED" as const,
      assessments: [
        {
          field: "mrp" as const,
          matchedText: "MRP Rs. 99",
          relativeHeight: 0.005,
          ocrConfidence: 0.45,
          classification: "REVIEW_REQUIRED" as const,
          imagePath: "/uploads/a.png",
          boundingBox: { x: 10, y: 20, width: 50, height: 10 },
          message: "MRP text height is 0.5% of package height (minimum 1.5% recommended).",
        },
      ],
      thresholds: {
        minRelativeHeightPass: 0.02,
        minRelativeHeightWarning: 0.012,
        lowConfidenceThreshold: 0.65,
      },
    };

    const result = runRuleEngine(rules, {
      extractedDeclarations: { mrp: { value: 99, raw: "MRP Rs. 99" } },
      product: null,
      readability: mockReadability,
      ocrResults,
    });

    expect(result.findings.length).toBe(1);
    expect(result.findings[0].outcome).toBe("REVIEW_REQUIRED");
    expect(result.findings[0].evidence.imagePath).toBe("/uploads/a.png");
    expect(result.status).toBe("REVIEW_REQUIRED");
  });
});

describe("recalculateInspectionStatusAfterReview", () => {
  it("returns COMPLIANT when all findings are REJECTED", () => {
    const status = recalculateInspectionStatusAfterReview([
      { outcome: "NON_COMPLIANT", reviewStatus: "REJECTED" },
      { outcome: "REVIEW_REQUIRED", reviewStatus: "REJECTED" },
      { outcome: "WARNING", reviewStatus: "REJECTED" },
    ]);
    expect(status).toBe("COMPLIANT");
  });

  it("retains NON_COMPLIANT if at least one active non-rejected finding is NON_COMPLIANT", () => {
    const status = recalculateInspectionStatusAfterReview([
      { outcome: "NON_COMPLIANT", reviewStatus: "CONFIRMED" },
      { outcome: "NON_COMPLIANT", reviewStatus: "REJECTED" },
      { outcome: "REVIEW_REQUIRED", reviewStatus: "PENDING" },
    ]);
    expect(status).toBe("NON_COMPLIANT");
  });

  it("returns REVIEW_REQUIRED if non-compliant finding is rejected but review-required finding remains", () => {
    const status = recalculateInspectionStatusAfterReview([
      { outcome: "NON_COMPLIANT", reviewStatus: "REJECTED" },
      { outcome: "REVIEW_REQUIRED", reviewStatus: "CONFIRMED" },
    ]);
    expect(status).toBe("REVIEW_REQUIRED");
  });

  it("returns REVIEW_REQUIRED if an item is explicitly MARKED_FOR_REVIEW", () => {
    const status = recalculateInspectionStatusAfterReview([
      { outcome: "WARNING", reviewStatus: "MARKED_FOR_REVIEW" },
    ]);
    expect(status).toBe("REVIEW_REQUIRED");
  });

  it("returns COMPLIANT for empty findings array", () => {
    expect(recalculateInspectionStatusAfterReview([])).toBe("COMPLIANT");
  });
});

