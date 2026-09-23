import { Router } from "express";
import { login, loginSchema, logout } from "../controllers/authController";
import { validateBody } from "../middleware/validate";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/login", validateBody(loginSchema), login);
router.post("/logout", authenticate, logout);

export default router;
