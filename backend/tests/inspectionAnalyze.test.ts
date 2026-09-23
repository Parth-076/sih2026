import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer;
const originalFetch = global.fetch;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(() => {
  global.fetch = originalFetch;
});

afterEach(async () => {
  global.fetch = originalFetch;
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

import app from "../src/app";
import { User } from "../src/models/User";
import { seedRules } from "../src/scripts/seedRules";

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

async function tokenFor(role: "ADMIN" | "OFFICER" | "INSPECTOR", suffix = "") {
  const email = `${role.toLowerCase()}${suffix}@analyzetest.com`;
  const passwordHash = await User.hashPassword("Password@123");
  await User.create({ name: `Test ${role}`, email, passwordHash, role, active: true });
  const res = await request(app).post("/api/auth/login").send({ email, password: "Password@123" });
  return res.body.token as string;
}

async function createTestInspection(token: string) {
  const res = await request(app)
    .post("/api/inspections")
    .set("Authorization", `Bearer ${token}`)
    .attach("images", TINY_PNG, "front.png");
  return res.body.inspection._id as string;
}

const SAMPLE_OCR_RESPONSE = {
  engine: "paddleocr",
  imageWidth: 800,
  imageHeight: 600,
  processingTimeMs: 120,
  fullText:
    "MRP Rs. 99\nNet Qty 200g\nCountry of Origin India\nConsumer Care 1800-123-4567\nBest Before 01/12/2026\nBatch No TEST-001",
  blocks: [
    {
      text: "MRP Rs. 99",
      confidence: 0.95,
      boundingBox: { x: 10, y: 20, width: 100, height: 30 },
    },
    {
      text: "Net Qty 200g",
      confidence: 0.91,
      boundingBox: { x: 10, y: 60, width: 120, height: 28 },
    },
  ],
};

describe("Inspection analysis — AI service integration", () => {
  beforeEach(async () => {
    await seedRules();
  });

  it("stores OCR results and runs readability + rule engine on success", async () => {
    const token = await tokenFor("INSPECTOR");
    const inspectionId = await createTestInspection(token);

    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify(SAMPLE_OCR_RESPONSE), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const res = await request(app)
      .post(`/api/inspections/${inspectionId}/analyze`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.inspection.status).toBe("COMPLIANT");
    expect(res.body.inspection.ocrResults.length).toBe(1);
    expect(res.body.inspection.ocrResults[0].fullText).toContain("MRP Rs. 99");
    expect(res.body.inspection.ocrResults[0].blocks.length).toBe(2);
    expect(res.body.inspection.extractedDeclarations.mrp.value).toBe(99);
    expect(res.body.inspection.readabilityResults.overall).toBeDefined();
    expect(Array.isArray(res.body.inspection.findings)).toBe(true);
  });

  it("degrades gracefully when the AI service returns 503 (engine not installed)", async () => {
    const token = await tokenFor("OFFICER");
    const inspectionId = await createTestInspection(token);

    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "PaddleOCR is not installed or failed to load." }), {
        status: 503,
        headers: { "content-type": "application/json" },
      })
    );

    const res = await request(app)
      .post(`/api/inspections/${inspectionId}/analyze`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(503);
    expect(res.body.message).toMatch(/not installed/i);

    // The inspection should be reverted, not left stuck mid-analysis or
    // showing a fake completed state.
    const getRes = await request(app)
      .get(`/api/inspections/${inspectionId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(getRes.body.inspection.status).toBe("PENDING_ANALYSIS");
    expect(getRes.body.inspection.analysisError).toMatch(/not installed/i);
  });

  it("degrades gracefully when the AI service is unreachable (connection refused)", async () => {
    const token = await tokenFor("ADMIN");
    const inspectionId = await createTestInspection(token);

    global.fetch = jest.fn().mockRejectedValue(new Error("fetch failed (ECONNREFUSED)"));

    const res = await request(app)
      .post(`/api/inspections/${inspectionId}/analyze`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(503);
    expect(res.body.message).toMatch(/unavailable/i);
  });

  it("blocks an inspector from analyzing another inspector's inspection", async () => {
    const tokenA = await tokenFor("INSPECTOR", "A");
    const tokenB = await tokenFor("INSPECTOR", "B");
    const inspectionId = await createTestInspection(tokenA);

    const res = await request(app)
      .post(`/api/inspections/${inspectionId}/analyze`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });

  it("runs unified pipeline end-to-end: OCR -> extraction -> readability -> rule engine -> NON_COMPLIANT status with audit evidence", async () => {
    const token = await tokenFor("INSPECTOR", "pipeline");
    const inspectionId = await createTestInspection(token);

    // OCR text with missing Country of Origin and Consumer Care details
    const VIOLATION_OCR_RESPONSE = {
      engine: "paddleocr",
      imageWidth: 800,
      imageHeight: 600,
      processingTimeMs: 150,
      fullText: "MRP Rs. 149\nNet Qty 100g",
      blocks: [
        {
          text: "MRP Rs. 149",
          confidence: 0.88,
          boundingBox: { x: 10, y: 20, width: 100, height: 12 }, // small font height relative to image
        },
        {
          text: "Net Qty 100g",
          confidence: 0.92,
          boundingBox: { x: 10, y: 50, width: 100, height: 25 },
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify(VIOLATION_OCR_RESPONSE), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const res = await request(app)
      .post(`/api/inspections/${inspectionId}/analyze`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // 1. OCR Results
    expect(res.body.inspection.ocrResults.length).toBe(1);
    expect(res.body.inspection.ocrResults[0].blocks.length).toBe(2);

    // 2. Extracted Declarations
    expect(res.body.inspection.extractedDeclarations.mrp.value).toBe(149);
    expect(res.body.inspection.extractedDeclarations.netQuantity.value).toBe(100);

    // 3. Readability assessment
    expect(res.body.inspection.readabilityResults).toBeDefined();

    // 4. Rule Engine findings with audit evidence and initial PENDING reviewStatus
    expect(res.body.inspection.findings.length).toBeGreaterThanOrEqual(1);
    const originFinding = res.body.inspection.findings.find(
      (f: any) => f.ruleCode === "LM-ORIGIN-PRESENCE"
    );
    expect(originFinding).toBeDefined();
    expect(originFinding.outcome).toBe("NON_COMPLIANT");
    expect(originFinding.reviewStatus).toBe("PENDING");
    expect(originFinding.evidence.location).toBeDefined();

    // 5. Final derived status
    expect(res.body.inspection.status).toBe("NON_COMPLIANT");
  });
});

