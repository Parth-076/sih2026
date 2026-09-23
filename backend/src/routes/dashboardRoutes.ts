import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboardController";
import { authenticate } from "../middleware/auth";

const router = Router();

// Any authenticated role (Inspector, Officer, Admin) can view their dashboard
router.get("/", authenticate, getDashboardStats);

export default router;
