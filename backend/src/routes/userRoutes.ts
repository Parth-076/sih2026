import { Router } from "express";
import {
  getCurrentUser,
  listUsers,
  createUser,
  createUserSchema,
  updateUser,
  updateUserSchema,
} from "../controllers/userController";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

router.get("/me", authenticate, getCurrentUser);

// Admin-only user management
router.get("/", authenticate, authorize("ADMIN"), listUsers);
router.post("/", authenticate, authorize("ADMIN"), validateBody(createUserSchema), createUser);
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validateBody(updateUserSchema),
  updateUser
);

export default router;
