import { Router } from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import productRoutes from "./productRoutes";
import inspectionRoutes from "./inspectionRoutes";
import ruleRoutes from "./ruleRoutes";
import reportRoutes from "./reportRoutes";
import dashboardRoutes from "./dashboardRoutes";
import { isDbConnected } from "../config/db";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    service: "labelcheck-backend",
    dbConnected: isDbConnected(),
    time: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/inspections", inspectionRoutes);
router.use("/rules", ruleRoutes);
router.use("/reports", reportRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
