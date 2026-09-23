/**
 * Seeds demo products covering the scenarios required by the brief (§32):
 *   1. Fully compliant product
 *   2. Product with a missing declaration
 *   3. Product with an inconsistent MRP (label vs repository)
 *   4. Product prone to poor label readability (small/low-contrast text)
 *   5. Product with multiple findings at once
 *
 * These are repository *reference* records — the values an inspector
 * expects to see. When package images are uploaded in later phases, OCR
 * results are compared against these values by the rule engine (Phase 9).
 * `declarations.demoScenario` is a plain-text note for demo narration only;
 * it plays no role in compliance logic.
 *
 * Safe to re-run: matched by barcode and updated in place.
 */
import { Product } from "../models/Product";

const DEMO_PRODUCTS = [
  {
    productName: "Suraksha Refined Sunflower Oil",
    brand: "Suraksha",
    manufacturer: "Suraksha Edible Oils Pvt. Ltd.",
    productCategory: "Edible Oil",
    barcode: "8901030123457",
    netQuantity: 1000,
    unit: "ml",
    mrp: 189,
    countryOfOrigin: "India",
    manufacturingDate: new Date("2026-04-10"),
    bestBeforeOrExpiry: new Date("2027-04-09"),
    consumerCare: "1800-123-4567, care@surakshaoils.example",
    batchNumber: "SUR-2026-0410-A",
    declarations: {
      demoScenario: "Fully compliant — all required declarations present and consistent.",
      fssaiLicenseNo: "12345678901234",
    },
    images: [],
  },
  {
    productName: "Nirmal Wheat Flour (Atta)",
    brand: "Nirmal",
    manufacturer: "Nirmal Flour Mills",
    productCategory: "Staples",
    barcode: "8901030123464",
    netQuantity: 5,
    unit: "kg",
    mrp: 245,
    countryOfOrigin: "India",
    manufacturingDate: new Date("2026-05-02"),
    // bestBeforeOrExpiry intentionally omitted
    // consumerCare intentionally omitted
    batchNumber: "NIR-0502",
    declarations: {
      demoScenario:
        "Missing declaration — consumer care details and best-before date are not on the label.",
    },
    images: [],
  },
  {
    productName: "Chatpata Masala Namkeen",
    brand: "Chatpata",
    manufacturer: "Chatpata Snacks Co.",
    productCategory: "Packaged Snacks",
    barcode: "8901030123471",
    netQuantity: 200,
    unit: "g",
    mrp: 99, // repository (correct) MRP
    countryOfOrigin: "India",
    manufacturingDate: new Date("2026-06-01"),
    bestBeforeOrExpiry: new Date("2026-12-01"),
    consumerCare: "1800-987-6543",
    batchNumber: "CHT-0601",
    declarations: {
      demoScenario:
        "Inconsistent MRP — package is printed with Rs. 109 while the repository record (and correct MRP) is Rs. 99.",
      labelPrintedMrp: "Rs. 109",
    },
    images: [],
  },
  {
    productName: "Amrit Toothpaste Family Pack",
    brand: "Amrit",
    manufacturer: "Amrit Oral Care Ltd.",
    productCategory: "Personal Care",
    barcode: "8901030123488",
    netQuantity: 200,
    unit: "g",
    mrp: 145,
    countryOfOrigin: "India",
    manufacturingDate: new Date("2026-03-15"),
    bestBeforeOrExpiry: new Date("2028-03-14"),
    consumerCare: "1800-555-1212",
    batchNumber: "AMR-0315",
    declarations: {
      demoScenario:
        "Poor readability — net-quantity and MRP text on the label are printed very small / low " +
        "contrast, intended to trigger a WARNING or REVIEW REQUIRED from the font/readability check " +
        "once a package image is analyzed.",
    },
    images: [],
  },
  {
    productName: "Rangeela Instant Noodles Multipack",
    brand: "Rangeela",
    manufacturer: "Rangeela Foods Pvt. Ltd.",
    productCategory: "Packaged Food",
    barcode: "8901030123495",
    netQuantity: 280,
    unit: "g",
    mrp: 60,
    countryOfOrigin: "India",
    manufacturingDate: new Date("2026-07-01"),
    // bestBeforeOrExpiry intentionally omitted
    // consumerCare intentionally omitted
    batchNumber: "RGL-0701",
    declarations: {
      demoScenario:
        "Multiple findings — missing best-before date and consumer care, plus label MRP printed as " +
        "Rs. 65 against a repository MRP of Rs. 60, plus a non-standard unit label ('gm.' instead of 'g').",
      labelPrintedMrp: "Rs. 65",
      labelPrintedUnit: "gm.",
    },
    images: [],
  },
];

export async function seedProducts(): Promise<void> {
  for (const product of DEMO_PRODUCTS) {
    const result = await Product.findOneAndUpdate({ barcode: product.barcode }, product, {
      upsert: true,
      new: true,
    });
    // eslint-disable-next-line no-console
    console.log(`[seed:products] ${result.barcode}  ${result.productName}`);
  }
}

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { connectDB } = require("../config/db");
  const mongoose = require("mongoose");
  connectDB()
    .then(seedProducts)
    .then(() => mongoose.disconnect())
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error("[seed:products] Failed:", err);
      process.exit(1);
    });
}
