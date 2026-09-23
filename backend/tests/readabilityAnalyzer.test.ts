import { analyzeReadability } from "../src/services/readabilityAnalyzer";
import { IImageOcrResult } from "../src/models/Inspection";

const SAMPLE: IImageOcrResult[] = [
  {
    imagePath: "/uploads/test.png",
    engine: "test",
    imageWidth: 800,
    imageHeight: 600,
    processingTimeMs: 1,
    fullText: "MRP Rs. 99\nNet Qty 200g",
    blocks: [
      {
        text: "MRP Rs. 99",
        confidence: 0.95,
        boundingBox: { x: 0, y: 0, width: 100, height: 30 },
      },
      {
        text: "Net Qty 200g",
        confidence: 0.9,
        boundingBox: { x: 0, y: 40, width: 120, height: 8 },
      },
    ],
  },
];

describe("readabilityAnalyzer", () => {
  it("classifies large MRP text as PASS and very small net-qty text as REVIEW_REQUIRED", () => {
    const result = analyzeReadability(SAMPLE);
    expect(result.assessments.find((a) => a.field === "mrp")?.classification).toBe("PASS");
    expect(result.assessments.find((a) => a.field === "netQuantity")?.classification).toBe(
      "REVIEW_REQUIRED"
    );
    expect(result.overall).toBe("REVIEW_REQUIRED");
  });
});
