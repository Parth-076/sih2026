import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app";
import { User } from "../src/models/User";
import { Inspection } from "../src/models/Inspection";
import { generateInspectionReport } from "../src/services/reportGenerator";

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
  const email = `${role.toLowerCase()}${suffix}@reporttest.com`;
  const passwordHash = await User.hashPassword("Password@123");
  const user = await User.create({ name: `Test ${role}`, email, passwordHash, role, active: true });
  const res = await request(app).post("/api/auth/login").send({ email, password: "Password@123" });
  return { token: res.body.token as string, user };
}

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

async function createInspectionDoc(inspectorId: mongoose.Types.ObjectId) {
  return await Inspection.create({
    inspectionCode: "INS-TEST-0001",
    inspector: inspectorId,
    images: ["/uploads/inspections/test/img-0.jpg"],
    status: "NON_COMPLIANT",
    extractedDeclarations: {
      mrp: { value: 99, raw: "MRP Rs. 99" },
      netQuantity: { value: 200, unit: "g", raw: "Net Qty 200g" },
      countryOfOrigin: "India",
    },
    readabilityResults: {
      overall: "WARNING",
      assessments: [
        {
          field: "mrp",
          matchedText: "MRP Rs. 99",
          relativeHeight: 0.02,
          ocrConfidence: 0.95,
          classification: "WARNING",
          imagePath: "/uploads/inspections/test/img-0.jpg",
          boundingBox: { x: 10, y: 10, width: 80, height: 20 },
          message: "Small text warning",
        },
      ],
      thresholds: {
        minRelativeHeightPass: 0.028,
        minRelativeHeightWarning: 0.018,
        lowConfidenceThreshold: 0.75,
      },
    },
    findings: [
      {
        ruleCode: "LM-MRP-CONSISTENCY",
        ruleName: "MRP matches product repository",
        validationType: "CONSISTENCY",
        field: "mrp",
        outcome: "NON_COMPLIANT",
        message: "MRP on label (₹99) does not match repository (₹120).",
        evidence: {
          location: "Extracted MRP vs product repository",
          extractedValue: "99",
          expectedValue: "120",
          ocrText: "MRP Rs. 99",
        },
      },
    ],
  });
}

describe("Inspection Report Generation Service & API (Phase 11)", () => {
  it("generates a valid, non-empty PDF document via reportGenerator service", async () => {
    const { user } = await tokenFor("INSPECTOR");
    const inspection = await createInspectionDoc(user._id as mongoose.Types.ObjectId);

    const report = await generateInspectionReport(inspection);

    expect(report).toBeDefined();
    expect(report.fileName).toBe("Report-INS-TEST-0001.pdf");
    expect(report.buffer.length).toBeGreaterThan(1000);
    // Standard PDF header signature check: starts with %PDF-
    expect(report.buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });

  it("generates a report via POST /api/inspections/:id/report", async () => {
    const { token, user } = await tokenFor("INSPECTOR");
    const inspection = await createInspectionDoc(user._id as mongoose.Types.ObjectId);

    const res = await request(app)
      .post(`/api/inspections/${inspection._id}/report`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.report.fileName).toBe("Report-INS-TEST-0001.pdf");

    const updated = await Inspection.findById(inspection._id);
    expect(updated?.reportPath).toBe("Report-INS-TEST-0001.pdf");
    expect(updated?.reportGeneratedAt).toBeDefined();
  });

  it("downloads a report via GET /api/inspections/:id/report", async () => {
    const { token, user } = await tokenFor("INSPECTOR");
    const inspection = await createInspectionDoc(user._id as mongoose.Types.ObjectId);

    const res = await request(app)
      .get(`/api/inspections/${inspection._id}/report`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.headers["content-disposition"]).toContain("attachment; filename=");
    expect(res.body.length).toBeGreaterThan(1000);
  });

  it("allows preview mode via ?inline=true query param", async () => {
    const { token, user } = await tokenFor("INSPECTOR");
    const inspection = await createInspectionDoc(user._id as mongoose.Types.ObjectId);

    const res = await request(app)
      .get(`/api/reports/inspections/${inspection._id}?inline=true`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.headers["content-disposition"]).toContain("inline; filename=");
  });

  it("enforces RBAC: forbids an inspector from accessing another inspector's report", async () => {
    const { user: userA } = await tokenFor("INSPECTOR", "a");
    const { token: tokenB } = await tokenFor("INSPECTOR", "b");
    const inspectionA = await createInspectionDoc(userA._id as mongoose.Types.ObjectId);

    const res = await request(app)
      .get(`/api/inspections/${inspectionA._id}/report`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
  });

  it("allows Officer and Admin to access any inspector's report", async () => {
    const { user: inspector } = await tokenFor("INSPECTOR");
    const { token: officerToken } = await tokenFor("OFFICER");
    const { token: adminToken } = await tokenFor("ADMIN");
    const inspection = await createInspectionDoc(inspector._id as mongoose.Types.ObjectId);

    const officerRes = await request(app)
      .get(`/api/inspections/${inspection._id}/report`)
      .set("Authorization", `Bearer ${officerToken}`);
    expect(officerRes.status).toBe(200);

    const adminRes = await request(app)
      .get(`/api/inspections/${inspection._id}/report`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);
  });
});
