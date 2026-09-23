/**
 * Seeds the three demo accounts required for the SIH demo:
 *   admin@example.com / Admin@1234
 *   officer@example.com / Officer@1234
 *   inspector@example.com / Inspector@1234
 *
 * Safe to re-run: existing accounts are updated in place rather than
 * duplicated. Exported so scripts/seed.ts can orchestrate it alongside
 * product seeding; also runnable standalone via `npm run seed:users`.
 */
import { User } from "../models/User";

const DEMO_ACCOUNTS = [
  {
    name: "System Administrator",
    email: "admin@example.com",
    password: "Admin@1234",
    role: "ADMIN" as const,
    department: "System Administration",
  },
  {
    name: "Legal Metrology Officer",
    email: "officer@example.com",
    password: "Officer@1234",
    role: "OFFICER" as const,
    department: "Enforcement",
  },
  {
    name: "Field Inspector",
    email: "inspector@example.com",
    password: "Inspector@1234",
    role: "INSPECTOR" as const,
    department: "Field Inspection",
  },
];

export async function seedUsers(): Promise<void> {
  for (const account of DEMO_ACCOUNTS) {
    const passwordHash = await User.hashPassword(account.password);
    const result = await User.findOneAndUpdate(
      { email: account.email },
      {
        name: account.name,
        email: account.email,
        passwordHash,
        role: account.role,
        department: account.department,
        active: true,
      },
      { upsert: true, new: true }
    );
    // eslint-disable-next-line no-console
    console.log(`[seed:users] ${result.role.padEnd(10)} ${result.email}`);
  }
}

if (require.main === module) {
  // Allow running this file standalone: npm run seed:users
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { connectDB } = require("../config/db");
  const mongoose = require("mongoose");
  connectDB()
    .then(seedUsers)
    .then(() => mongoose.disconnect())
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error("[seed:users] Failed:", err);
      process.exit(1);
    });
}
