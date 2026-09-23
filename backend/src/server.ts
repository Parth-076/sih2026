import fs from "fs";
import app from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";

async function main() {
  // Ensure shared upload/report directories exist even on a fresh clone.
  for (const dir of [env.uploadDir, env.reportDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  await connectDB();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] LabelCheck backend listening on http://localhost:${env.port}`);
    // eslint-disable-next-line no-console
    console.log(`[server] Environment: ${env.nodeEnv}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[server] Fatal startup error:", err);
  process.exit(1);
});
