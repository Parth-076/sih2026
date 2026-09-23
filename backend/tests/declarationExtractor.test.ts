import { extractDeclarations } from "../src/services/declarationExtractor";
import { normalizeUnit, parseAmount, tryParseDate } from "../src/utils/labelNormalization";

describe("MRP extraction — brief §11 examples", () => {
  it.each([
    ["MRP Rs. 99", 99],
    ["MRP ₹99", 99],
    ["M.R.P. 99", 99],
    ["Maximum Retail Price: Rs 99", 99],
    ["MRP (Incl. of all taxes): Rs. 1,234.50", 1234.5],
  ])("recognizes %s as MRP %d", (text, expected) => {
    const result = extractDeclarations(text);
    expect(result.mrp).not.toBeNull();
    expect(result.mrp!.value).toBe(expected);
  });

  it("returns null when no MRP is present", () => {
    expect(extractDeclarations("Net Qty 500g").mrp).toBeNull();
  });
});

describe("Net quantity extraction and unit normalization", () => {
  it.each([
    ["Net Qty 500 g", 500, "g"],
    ["Net Weight: 500gm", 500, "g"],
    ["Net Quantity 1 kg", 1, "kg"],
    ["Net Wt 250 ml", 250, "ml"],
    ["Net Contents 1 L", 1, "l"],
    ["Net Qty: 2 Litres", 2, "l"],
  ])("parses %s as %d %s", (text, value, unit) => {
    const result = extractDeclarations(text);
    expect(result.netQuantity).not.toBeNull();
    expect(result.netQuantity!.value).toBe(value);
    expect(result.netQuantity!.unit).toBe(unit);
  });
});

describe("normalizeUnit", () => {
  it.each([
    ["g", "g"],
    ["gm", "g"],
    ["gms", "g"],
    ["grams", "g"],
    ["kg", "kg"],
    ["kgs", "kg"],
    ["ml", "ml"],
    ["mL", "ml"],
    ["l", "l"],
    ["litre", "l"],
    ["litres", "l"],
    ["liters", "l"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeUnit(input)).toBe(expected);
  });

  it("returns null for an unrecognized unit", () => {
    expect(normalizeUnit("furlongs")).toBeNull();
  });
});

describe("parseAmount", () => {
  it("strips thousands separators", () => {
    expect(parseAmount("1,234.50")).toBe(1234.5);
  });
  it("returns null for non-numeric input", () => {
    expect(parseAmount("abc")).toBeNull();
  });
});

describe("Date extraction", () => {
  it("extracts manufacturing date distinct from expiry", () => {
    const result = extractDeclarations("Mfg Date: 10/04/2026\nBest Before: 09/04/2027");
    expect(result.manufacturingDate?.raw).toBe("10/04/2026");
    expect(result.bestBeforeOrExpiry?.raw).toBe("09/04/2027");
  });

  it("parses DD/MM/YYYY into an ISO date", () => {
    const date = tryParseDate("10/04/2026");
    expect(date?.toISOString().slice(0, 10)).toBe("2026-04-10");
  });

  it("parses 'Jan 2027' style dates", () => {
    const date = tryParseDate("Jan 2027");
    expect(date?.toISOString().slice(0, 7)).toBe("2027-01");
  });

  it("returns null parsed date for an unrecognized format but keeps raw text", () => {
    const result = extractDeclarations("Best Before: 18 months from packaging");
    expect(result.bestBeforeOrExpiry?.raw).toMatch(/18\s*months/i);
    expect(result.bestBeforeOrExpiry?.parsed).toBeNull();
  });
});

describe("Other declarations", () => {
  it("extracts country of origin", () => {
    expect(extractDeclarations("Country of Origin: India").countryOfOrigin).toBe("India");
  });

  it("extracts manufacturer from a 'Manufactured by' line", () => {
    const result = extractDeclarations("Manufactured by: Suraksha Edible Oils Pvt. Ltd.\nNet Qty 1L");
    expect(result.manufacturer).toContain("Suraksha Edible Oils");
  });

  it("extracts a consumer-care phone/email pair", () => {
    const result = extractDeclarations("Consumer Care: 1800-123-4567, care@example.com");
    expect(result.consumerCare).toContain("1800-123-4567");
    expect(result.consumerCare).toContain("care@example.com");
  });

  it("extracts a batch number", () => {
    expect(extractDeclarations("Batch No: SUR-2026-0410-A").batchNumber).toBe("SUR-2026-0410-A");
  });

  it("returns nulls across the board for text with no recognizable declarations", () => {
    const result = extractDeclarations("A picture of a cat.");
    expect(result.mrp).toBeNull();
    expect(result.netQuantity).toBeNull();
    expect(result.countryOfOrigin).toBeNull();
    expect(result.manufacturer).toBeNull();
    expect(result.batchNumber).toBeNull();
  });
});

describe("Realistic combined label text", () => {
  it("extracts multiple fields from one block of OCR text", () => {
    const text = `
      Suraksha Refined Sunflower Oil
      Net Qty: 1 L
      MRP Rs. 189 (Incl. of all taxes)
      Mfg Date: 10/04/2026
      Best Before: 09/04/2027
      Manufactured by: Suraksha Edible Oils Pvt. Ltd.
      Country of Origin: India
      Batch No: SUR-2026-0410-A
      Consumer Care: 1800-123-4567
    `;
    const result = extractDeclarations(text);
    expect(result.mrp?.value).toBe(189);
    expect(result.netQuantity).toEqual({ value: 1, unit: "l", raw: "Net Qty: 1 L" });
    expect(result.manufacturingDate?.raw).toBe("10/04/2026");
    expect(result.bestBeforeOrExpiry?.raw).toBe("09/04/2027");
    expect(result.countryOfOrigin).toBe("India");
    expect(result.batchNumber).toBe("SUR-2026-0410-A");
    expect(result.consumerCare).toContain("1800-123-4567");
  });
});
