/**
 * Jest `setupFiles` run before a test file's own top-level imports execute.
 * That matters here: config/env.ts validates required env vars (JWT_SECRET
 * has no fallback) at *import* time, and `import app from "../src/app"` in
 * each test file runs during Jest's synchronous collection phase — before
 * that file's own `beforeAll` body ever runs. So env vars needed at import
 * time must be set here, not in `beforeAll`.
 *
 * MONGO_URI is a harmless placeholder: tests connect directly via
 * `mongoose.connect(mongod.getUri())` in their own beforeAll, bypassing
 * config/db.ts entirely, so nothing ever reads this value for real.
 */
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-do-not-use-in-production";
process.env.MONGO_URI = "mongodb://127.0.0.1:27017/labelcheck-test-placeholder";
process.env.CLIENT_ORIGIN = "http://localhost:5173";
process.env.UPLOAD_DIR = "../.test-uploads";
process.env.REPORT_DIR = "../.test-reports";
