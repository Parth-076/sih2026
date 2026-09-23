import { Schema, model, Document } from "mongoose";

export const VALIDATION_TYPES = ["PRESENCE", "CONSISTENCY", "FORMAT", "READABILITY"] as const;
export type ValidationType = (typeof VALIDATION_TYPES)[number];

export const RULE_SEVERITIES = ["NON_COMPLIANT", "REVIEW_REQUIRED"] as const;
export type RuleSeverity = (typeof RULE_SEVERITIES)[number];

export interface IComplianceRule extends Document {
  ruleCode: string;
  name: string;
  description: string;
  validationType: ValidationType;
  targetField: string;
  defaultSeverity: RuleSeverity;
  enabled: boolean;
  /** Type-specific options — e.g. format regex, consistency tolerance, readability minimum. */
  config: Record<string, unknown>;
  isPrototype: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const complianceRuleSchema = new Schema<IComplianceRule>(
  {
    ruleCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    validationType: { type: String, enum: VALIDATION_TYPES, required: true },
    targetField: { type: String, required: true, trim: true },
    defaultSeverity: { type: String, enum: RULE_SEVERITIES, required: true },
    enabled: { type: Boolean, default: true, index: true },
    config: { type: Schema.Types.Mixed, default: {} },
    isPrototype: { type: Boolean, default: true },
  },
  { timestamps: true }
);

complianceRuleSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete (ret as unknown as Record<string, unknown>).__v;
    return ret;
  },
});

export const ComplianceRule = model<IComplianceRule>("ComplianceRule", complianceRuleSchema);
