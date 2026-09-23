import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app";
import { User } from "../src/models/User";
import { Product } from "../src/models/Product";
import { Inspection } from "../src/models/Inspection";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

async function tokenFor(role: "ADMIN" | "OFFICER" | "INSPECTOR", suffix = "") {
  const email = `${role.toLowerCase()}${suffix}@dashboardservice.com`;
  const passwordHash = await User.hashPassword("Password@123");
  const user = await User.create({ name: `Test ${role}`, email, passwordHash, role, active: true });
  const res = await request(app).post("/api/auth/login").send({ email, password: "Password@123" });
  return { token: res.body.token as string, userId: user.id as string, user };
}

describe("Dashboard Aggregation Service & API (Phase 13)", () => {
  it("returns structured stats with totals, 30-day trend, violations, and recent inspections", async () => {
    const { token, userId } = await tokenFor("OFFICER", "dash1");

    const prod = await Product.create({
      productName: "Biscuits",
      productCategory: "Snacks",
    });

    // 1 Compliant inspection
    await Inspection.create({
      inspectionCode: "INS-D1",
      inspector: userId,
      status: "COMPLIANT",
      product: prod._id,
      images: ["/uploads/img.jpg"],
    });

    // 1 Non-compliant inspection with findings
    await Inspection.create({
      inspectionCode: "INS-D2",
      inspector: userId,
      status: "NON_COMPLIANT",
      product: prod._id,
      images: ["/uploads/img.jpg"],
      findings: [
        {
          ruleCode: "LM-MRP-PRESENCE",
          ruleName: "MRP must be declared",
          validationType: "PRESENCE",
          field: "mrp",
          outcome: "NON_COMPLIANT",
          message: "MRP missing",
          evidence: { location: "OCR text" },
        },
      ],
    });

    // 1 Review-required inspection
    await Inspection.create({
      inspectionCode: "INS-D3",
      inspector: userId,
      status: "REVIEW_REQUIRED",
      product: prod._id,
      images: ["/uploads/img.jpg"],
      findings: [
        {
          ruleCode: "LM-NETQTY-FORMAT",
          ruleName: "Standard abbreviation",
          validationType: "FORMAT",
          field: "netQuantity",
          outcome: "REVIEW_REQUIRED",
          message: "Non-standard unit abbreviation",
          evidence: { location: "OCR text" },
        },
      ],
    });

    const res = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const stats = res.body.stats;
    expect(stats.totals.total).toBe(3);
    expect(stats.totals.compliant).toBe(1);
    expect(stats.totals.nonCompliant).toBe(1);
    expect(stats.totals.reviewRequired).toBe(1);
    // Evaluated: 3, Compliant: 1 => 33%
    expect(stats.totals.complianceRate).toBe(33);

    // 30-day continuous trend check
    expect(Array.isArray(stats.trend)).toBe(true);
    expect(stats.trend.length).toBe(30);

    // Top violations check
    expect(Array.isArray(stats.topViolations)).toBe(true);
    expect(stats.topViolations.length).toBe(2);
    const mrpViolation = stats.topViolations.find((v: { field: string }) => v.field === "mrp");
    expect(mrpViolation).toBeDefined();
    expect(mrpViolation.nonCompliantCount).toBe(1);

    // Category breakdown check
    expect(Array.isArray(stats.categoryBreakdown)).toBe(true);
    const snackCategory = stats.categoryBreakdown.find(
      (c: { category: string }) => c.category === "Snacks"
    );
    expect(snackCategory).toBeDefined();
    expect(snackCategory.total).toBe(3);

    // Recent inspections check
    expect(Array.isArray(stats.recentInspections)).toBe(true);
    expect(stats.recentInspections.length).toBe(3);
  });

  it("enforces role scoping: inspector only sees their own aggregation stats", async () => {
    const inspectorA = await tokenFor("INSPECTOR", "dashA");
    const inspectorB = await tokenFor("INSPECTOR", "dashB");
    const officer = await tokenFor("OFFICER", "dashOff");

    // Inspector A has 2 inspections
    await Inspection.create({
      inspectionCode: "INS-A-1",
      inspector: inspectorA.userId,
      status: "COMPLIANT",
      images: ["/uploads/img.jpg"],
    });
    await Inspection.create({
      inspectionCode: "INS-A-2",
      inspector: inspectorA.userId,
      status: "NON_COMPLIANT",
      images: ["/uploads/img.jpg"],
    });

    // Inspector B has 1 inspection
    await Inspection.create({
      inspectionCode: "INS-B-1",
      inspector: inspectorB.userId,
      status: "COMPLIANT",
      images: ["/uploads/img.jpg"],
    });

    // Inspector A queries dashboard
    const resA = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${inspectorA.token}`);
    expect(resA.status).toBe(200);
    expect(resA.body.stats.totals.total).toBe(2);
    expect(resA.body.stats.totals.compliant).toBe(1);
    expect(resA.body.stats.totals.nonCompliant).toBe(1);

    // Officer queries dashboard — sees all 3
    const resOff = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${officer.token}`);
    expect(resOff.status).toBe(200);
    expect(resOff.body.stats.totals.total).toBe(3);
    expect(resOff.body.stats.totals.compliant).toBe(2);
  });

  it("requires authentication to access dashboard", async () => {
    const res = await request(app).get("/api/dashboard");
    expect(res.status).toBe(401);
  });
});
