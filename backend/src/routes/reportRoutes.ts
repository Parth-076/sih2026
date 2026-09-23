import { Router } from "express";
import { generateReport, downloadReport } from "../controllers/reportController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

// Inspector, Officer, and Admin can generate and access reports
router.post(
  "/inspections/:id",
  authenticate,
  authorize("INSPECTOR", "OFFICER", "ADMIN"),
  generateReport
);
router.get(
  "/inspections/:id",
  authenticate,
  authorize("INSPECTOR", "OFFICER", "ADMIN"),
  downloadReport
);
router.get(
  "/inspections/:id/download",
  authenticate,
  authorize("INSPECTOR", "OFFICER", "ADMIN"),
  downloadReport
);

export default router;
