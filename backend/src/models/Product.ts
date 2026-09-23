import { Schema, model, Document } from "mongoose";

/**
 * Declarations are stored as a flexible key/value map rather than fixed
 * columns, because different product categories legitimately carry
 * different declaration sets (see brief §7 — "Support products with
 * different declaration structures"). The well-known Legal Metrology
 * fields are still promoted to first-class columns below so the rule
 * engine (Phase 9) can query them directly and efficiently; `declarations`
 * holds anything additional or category-specific.
 */
export interface IProduct extends Document {
  productName: string;
  brand?: string;
  manufacturer?: string;
  productCategory?: string;
  barcode?: string;
  netQuantity?: number;
  unit?: string; // normalized: g, kg, ml, l, pcs, etc.
  mrp?: number;
  countryOfOrigin?: string;
  manufacturingDate?: Date;
  bestBeforeOrExpiry?: Date;
  consumerCare?: string;
  batchNumber?: string;
  declarations?: Record<string, string>;
  images: string[];
  createdBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    productName: { type: String, required: true, trim: true, index: true },
    brand: { type: String, trim: true },
    manufacturer: { type: String, trim: true },
    productCategory: { type: String, trim: true, index: true },
    barcode: { type: String, trim: true, unique: true, sparse: true, index: true },
    netQuantity: { type: Number, min: 0 },
    unit: { type: String, trim: true },
    mrp: { type: Number, min: 0 },
    countryOfOrigin: { type: String, trim: true },
    manufacturingDate: { type: Date },
    bestBeforeOrExpiry: { type: Date },
    consumerCare: { type: String, trim: true },
    batchNumber: { type: String, trim: true },
    declarations: { type: Schema.Types.Mixed, default: {} },
    images: { type: [String], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

productSchema.index({ productName: "text", brand: "text", manufacturer: "text" });

productSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete (ret as unknown as Record<string, unknown>).__v;
    return ret;
  },
});

export const Product = model<IProduct>("Product", productSchema);
