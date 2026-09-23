import { Router } from "express";
import {
  createInspection,
  getInspection,
  listInspections,
  analyzeInspection,
  reviewFinding,
  finalizeInspectionReview,
} from "../controllers/inspectionController";
import { generateReport, downloadReport } from "../controllers/reportController";
import { authenticate, authorize } from "../middleware/auth";
import { uploadPackageImages } from "../middleware/upload";

const router = Router();

// Inspector, Officer, and Admin may all start and view inspections (brief §6).
router.post(
  "/",
  authenticate,
  authorize("INSPECTOR", "OFFICER", "ADMIN"),
  uploadPackageImages,
  createInspection
);
router.get("/", authenticate, authorize("INSPECTOR", "OFFICER", "ADMIN"), listInspections);
router.get("/:id", authenticate, authorize("INSPECTOR", "OFFICER", "ADMIN"), getInspection);
router.post(
  "/:id/analyze",
  authenticate,
  authorize("INSPECTOR", "OFFICER", "ADMIN"),
  analyzeInspection
);
router.post(
  "/:id/report",
  authenticate,
  authorize("INSPECTOR", "OFFICER", "ADMIN"),
  generateReport
);
router.get(
  "/:id/report",
  authenticate,
  authorize("INSPECTOR", "OFFICER", "ADMIN"),
  downloadReport
);

// Phase 14: Human-in-the-Loop Finding Review & Verification
router.patch(
  "/:id/findings/:findingId/review",
  authenticate,
  authorize("INSPECTOR", "OFFICER", "ADMIN"),
  reviewFinding
);
router.post(
  "/:id/findings/:findingId/review",
  authenticate,
  authorize("INSPECTOR", "OFFICER", "ADMIN"),
  reviewFinding
);
router.post(
  "/:id/review-finding",
  authenticate,
  authorize("INSPECTOR", "OFFICER", "ADMIN"),
  reviewFinding
);
router.post(
  "/:id/review",
  authenticate,
  authorize("INSPECTOR", "OFFICER", "ADMIN"),
  finalizeInspectionReview
);
router.patch(
  "/:id/review",
  authenticate,
  authorize("INSPECTOR", "OFFICER", "ADMIN"),
  finalizeInspectionReview
);

export default router;


