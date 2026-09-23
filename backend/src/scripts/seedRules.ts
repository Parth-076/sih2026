import { ComplianceRule } from "../models/ComplianceRule";

/**
 * Ten prototype/demo rules aligned with brief §32 scenarios and BUILD_LOG Phase 9.
 * Safe to re-run: matched by ruleCode and updated in place.
 */
const DEMO_RULES = [
  {
    ruleCode: "LM-MRP-PRESENCE",
    name: "MRP must be declared",
    description: "Maximum Retail Price must appear on the package label.",
    validationType: "PRESENCE" as const,
    targetField: "mrp",
    defaultSeverity: "NON_COMPLIANT" as const,
    config: {},
  },
  {
    ruleCode: "LM-NETQTY-PRESENCE",
    name: "Net quantity must be declared",
    description: "Net quantity (with unit) must appear on the package label.",
    validationType: "PRESENCE" as const,
    targetField: "netQuantity",
    defaultSeverity: "NON_COMPLIANT" as const,
    config: {},
  },
  {
    ruleCode: "LM-ORIGIN-PRESENCE",
    name: "Country of origin must be declared",
    description: "Country of origin must appear on the package label.",
    validationType: "PRESENCE" as const,
    targetField: "countryOfOrigin",
    defaultSeverity: "NON_COMPLIANT" as const,
    config: {},
  },
  {
    ruleCode: "LM-MRP-CONSISTENCY",
    name: "MRP matches product repository",
    description:
      "When a repository product is linked, the extracted MRP must match the repository MRP.",
    validationType: "CONSISTENCY" as const,
    targetField: "mrp",
    defaultSeverity: "NON_COMPLIANT" as const,
    config: {},
  },
  {
    ruleCode: "LM-NETQTY-CONSISTENCY",
    name: "Net quantity matches product repository",
    description:
      "When a repository product is linked, extracted net quantity and unit must match the repository.",
    validationType: "CONSISTENCY" as const,
    targetField: "netQuantity",
    defaultSeverity: "NON_COMPLIANT" as const,
    config: {},
  },
  {
    ruleCode: "LM-CONSUMER-CARE-PRESENCE",
    name: "Consumer care details should be present",
    description: "Consumer care contact (phone/email) should be declared on the label.",
    validationType: "PRESENCE" as const,
    targetField: "consumerCare",
    defaultSeverity: "REVIEW_REQUIRED" as const,
    config: {},
  },
  {
    ruleCode: "LM-EXPIRY-PRESENCE",
    name: "Best-before / expiry should be present",
    description: "Best-before or expiry information should be declared on the label.",
    validationType: "PRESENCE" as const,
    targetField: "bestBeforeOrExpiry",
    defaultSeverity: "REVIEW_REQUIRED" as const,
    config: {},
  },
  {
    ruleCode: "LM-NETQTY-FORMAT",
    name: "Net quantity unit uses standard abbreviation",
    description:
      "Net quantity should use standard unit abbreviations (e.g. 'g', not non-standard variants like 'gm.').",
    validationType: "FORMAT" as const,
    targetField: "netQuantity",
    defaultSeverity: "REVIEW_REQUIRED" as const,
    config: {
      pattern: "\\b\\d+\\s*gm\\.\\b",
      invertMatch: true,
    },
  },
  {
    ruleCode: "LM-MRP-FORMAT",
    name: "MRP line includes currency indicator",
    description: "MRP declaration should include Rs/₹ or spell out Maximum Retail Price.",
    validationType: "FORMAT" as const,
    targetField: "mrp",
    defaultSeverity: "REVIEW_REQUIRED" as const,
    config: {
      pattern: "(?:m\\.?\\s*r\\.?\\s*p|maximum\\s+retail\\s+price|₹|rs\\.?)",
      invertMatch: false,
    },
  },
  {
    ruleCode: "LM-READABILITY-MRP",
    name: "MRP text readability",
    description:
      "MRP text should be large and clear enough to read from the package photo (estimated from OCR box size).",
    validationType: "READABILITY" as const,
    targetField: "mrp",
    defaultSeverity: "REVIEW_REQUIRED" as const,
    config: { failOn: ["WARNING", "REVIEW_REQUIRED"], warningOutcome: "WARNING" },
  },
];

export async function seedRules() {
  for (const rule of DEMO_RULES) {
    await ComplianceRule.findOneAndUpdate(
      { ruleCode: rule.ruleCode },
      { ...rule, enabled: true, isPrototype: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // eslint-disable-next-line no-console
    console.log(`[seed:rules] ${rule.ruleCode}  ${rule.name}`);
  }
}

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { connectDB } = require("../config/db");
  const mongoose = require("mongoose");
  connectDB()
    .then(seedRules)
    .then(() => mongoose.disconnect())
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error("[seed:rules] Failed:", err);
      process.exit(1);
    });
}
