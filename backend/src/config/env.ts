import dotenv from "dotenv";
import path from "path";

// Load backend/.env explicitly regardless of the working directory the process
// was started from.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(
      `Missing required environment variable "${name}". Copy backend/.env.example to backend/.env and fill it in.`
    );
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 5000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",

  mongoUri: required("MONGO_URI", "mongodb://127.0.0.1:27017/labelcheck"),

  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",

  aiServiceUrl: process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8000",
  aiServiceTimeoutMs: Number(process.env.AI_SERVICE_TIMEOUT_MS ?? 30000),

  uploadDir: path.resolve(__dirname, "../../", process.env.UPLOAD_DIR ?? "../uploads"),
  maxUploadSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB ?? 10),

  reportDir: path.resolve(__dirname, "../../", process.env.REPORT_DIR ?? "../reports"),
};

export const isProd = env.nodeEnv === "production";
