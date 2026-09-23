import express from "express";
import "express-async-errors";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env, isProd } from "./config/env";
import routes from "./routes";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [env.clientOrigin, "http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(isProd ? "combined" : "dev"));

// Serve uploaded package images so the frontend can render them (e.g. for
// OCR bounding-box overlays and evidence viewers in later phases).
app.use("/uploads", express.static(env.uploadDir));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
