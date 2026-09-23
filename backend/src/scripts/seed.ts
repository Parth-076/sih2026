/**
 * Runs all seed steps against a single DB connection.
 * Usage: npm run seed --workspace=backend
 */
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { seedUsers } from "./seedUsers";
import { seedProducts } from "./seedProducts";
import { seedRules } from "./seedRules";

async function seedAll() {
  await connectDB();
  await seedUsers();
  await seedProducts();
  await seedRules();
  // eslint-disable-next-line no-console
  console.log("[seed] Done. Demo credentials are documented in the README.");
  await mongoose.disconnect();
  process.exit(0);
}

seedAll().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[seed] Failed:", err);
  process.exit(1);
});
