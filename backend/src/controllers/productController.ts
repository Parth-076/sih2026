import { Request, Response } from "express";
import { z } from "zod";
import { Product } from "../models/Product";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

const declarationsSchema = z.record(z.string()).optional();

export const productSchema = z.object({
  productName: z.string().min(1),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  productCategory: z.string().optional(),
  barcode: z.string().optional(),
  netQuantity: z.number().nonnegative().optional(),
  unit: z.string().optional(),
  mrp: z.number().nonnegative().optional(),
  countryOfOrigin: z.string().optional(),
  manufacturingDate: z.coerce.date().optional(),
  bestBeforeOrExpiry: z.coerce.date().optional(),
  consumerCare: z.string().optional(),
  batchNumber: z.string().optional(),
  declarations: declarationsSchema,
  images: z.array(z.string()).optional(),
});

export const productUpdateSchema = productSchema.partial();

/**
 * GET /api/products?search=&category=&page=&limit=
 * Any authenticated role. Supports free-text search across name/brand/
 * manufacturer and a category filter, for the Product Repository page and
 * for looking a product up mid-inspection.
 */
export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const { search, category } = req.query as { search?: string; category?: string };
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$text = { $search: search };
  }
  if (category) {
    filter.productCategory = category;
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    products,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

/** GET /api/products/:id */
export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound("Product not found");
  res.json({ success: true, product });
});

/**
 * GET /api/products/barcode/:barcode
 * Used by the barcode-scanning workflow (Phase 4). Returns 404 with a clear
 * message when the code decodes fine but no matching product exists, so the
 * frontend can show "Product ID detected but not found" and continue with
 * image-based inspection, per brief §9.
 */
export const getProductByBarcode = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findOne({ barcode: req.params.barcode });
  if (!product) {
    throw ApiError.notFound("Product ID detected but product was not found in repository.");
  }
  res.json({ success: true, product });
});

/** POST /api/products — Admin only */
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as z.infer<typeof productSchema>;

  if (data.barcode) {
    const existing = await Product.findOne({ barcode: data.barcode });
    if (existing) throw ApiError.conflict("A product with this barcode already exists");
  }

  const product = await Product.create({ ...data, createdBy: req.user!.sub });
  res.status(201).json({ success: true, product });
});

/** PUT /api/products/:id — Admin only */
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as z.infer<typeof productUpdateSchema>;

  const product = await Product.findByIdAndUpdate(req.params.id, data, {
    new: true,
    runValidators: true,
  });
  if (!product) throw ApiError.notFound("Product not found");
  res.json({ success: true, product });
});

/** DELETE /api/products/:id — Admin only */
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw ApiError.notFound("Product not found");
  res.json({ success: true, message: "Product deleted" });
});

/** GET /api/products/categories — distinct categories, for filter dropdowns */
export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Product.distinct("productCategory");
  res.json({ success: true, categories: categories.filter(Boolean) });
});
