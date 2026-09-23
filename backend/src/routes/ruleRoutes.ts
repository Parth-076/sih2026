import { Router } from "express";
import {
  listRules,
  getRule,
  createRule,
  updateRule,
  deleteRule,
  ruleSchema,
  ruleUpdateSchema,
} from "../controllers/ruleController";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

router.get("/", authenticate, authorize("OFFICER", "ADMIN"), listRules);
router.get("/:id", authenticate, authorize("OFFICER", "ADMIN"), getRule);

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validateBody(ruleSchema),
  createRule
);
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validateBody(ruleUpdateSchema),
  updateRule
);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteRule);

export default router;
