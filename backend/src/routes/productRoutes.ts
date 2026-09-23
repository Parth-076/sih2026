import { Router } from "express";
import {
  listProducts,
  getProduct,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  listCategories,
  productSchema,
  productUpdateSchema,
} from "../controllers/productController";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

// Any authenticated role can browse/search products — inspectors need this
// mid-inspection, officers/admins for review and repository management.
router.get("/", authenticate, listProducts);
router.get("/categories", authenticate, listCategories);
router.get("/barcode/:barcode", authenticate, getProductByBarcode);
router.get("/:id", authenticate, getProduct);

// Only Admin manages the product repository (brief §5 — Admin: "Manage
// products", "Manage product repository").
router.post("/", authenticate, authorize("ADMIN"), validateBody(productSchema), createProduct);
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validateBody(productUpdateSchema),
  updateProduct
);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteProduct);

export default router;
