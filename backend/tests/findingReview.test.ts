import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app";
import { User } from "../src/models/User";
import { Inspection, IInspection } from "../src/models/Inspection";

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

async function tokenFor(role: "ADMIN" | "OFFICER" | "INSPECTOR", emailPrefix: string) {
  const email = `${emailPrefix}@reviewtest.com`;
  const passwordHash = await User.hashPassword("Password@123");
  const user = await User.create({
    name: `${role} User`,
    email,
    passwordHash,
    role,
    active: true,
  });
  const res = await request(app).post("/api/auth/login").send({ email, password: "Password@123" });
  return { token: res.body.token as string, userId: user._id.toString() };
}

async function createInspectionWithFindings(inspectorId: string): Promise<IInspection> {
  return await Inspection.create({
    inspectionCode: `INS-${Date.now()}-001`,
    inspector: new mongoose.Types.ObjectId(inspectorId),
    images: ["/uploads/pkg.jpg"],
    status: "NON_COMPLIANT",
    findings: [
      {
        ruleCode: "LM-ORIGIN-PRESENCE",
        ruleName: "Country of Origin",
        validationType: "PRESENCE",
        field: "countryOfOrigin",
        outcome: "NON_COMPLIANT",
        message: "Country of origin missing from label",
        evidence: {
          location: "Front label OCR",
          ocrText: "Net Wt 100g MRP Rs 50",
        },
        reviewStatus: "PENDING",
      },
      {
        ruleCode: "LM-READABILITY-MRP",
        ruleName: "MRP Readability",
        validationType: "READABILITY",
        field: "mrp",
        outcome: "REVIEW_REQUIRED",
        message: "MRP text height is borderline",
        evidence: {
          location: "Bottom price block",
          ocrText: "MRP Rs 50",
        },
        reviewStatus: "PENDING",
      },
    ],
  });
}

describe("Human-in-the-loop finding review API (Phase 14)", () => {
  it("allows officer to confirm a violation finding with review comment", async () => {
    const inspector = await tokenFor("INSPECTOR", "insp1");
    const officer = await tokenFor("OFFICER", "officer1");
    const inspDoc = await createInspectionWithFindings(inspector.userId);

    const finding0 = inspDoc.findings[0];
    const findingId = (finding0 as any)._id.toString();

    const res = await request(app)
      .patch(`/api/inspections/${inspDoc._id}/findings/${findingId}/review`)
      .set("Authorization", `Bearer ${officer.token}`)
      .send({
        action: "confirm",
        comment: "Inspected physical carton; origin is indeed absent.",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.finding.reviewStatus).toBe("CONFIRMED");
    expect(res.body.finding.reviewComment).toBe("Inspected physical carton; origin is indeed absent.");
    expect(res.body.finding.reviewedBy).toBe(officer.userId);
    expect(res.body.finding.reviewedAt).toBeDefined();

    // Inspection still has active NON_COMPLIANT finding, so status remains NON_COMPLIANT
    expect(res.body.inspection.status).toBe("NON_COMPLIANT");
    expect(res.body.inspection.reviewer).toBe(officer.userId);
  });

  it("recalculates inspection status to COMPLIANT when all violations are rejected", async () => {
    const inspector = await tokenFor("INSPECTOR", "insp2");
    const officer = await tokenFor("OFFICER", "officer2");
    const inspDoc = await createInspectionWithFindings(inspector.userId);

    const finding0 = inspDoc.findings[0];
    const finding1 = inspDoc.findings[1];

    // Reject finding 0 (the NON_COMPLIANT one: e.g. officer saw origin stamped in ink on side)
    const res1 = await request(app)
      .post(`/api/inspections/${inspDoc._id}/findings/${(finding0 as any)._id}/review`)
      .set("Authorization", `Bearer ${officer.token}`)
      .send({
        action: "reject",
        comment: "False positive: country of origin is stamped in dot-matrix on the crimp fold.",
      });

    expect(res1.status).toBe(200);
    expect(res1.body.finding.reviewStatus).toBe("REJECTED");
    // With finding 0 rejected, only finding 1 (REVIEW_REQUIRED) is active
    expect(res1.body.inspection.status).toBe("REVIEW_REQUIRED");

    // Reject finding 1 (the REVIEW_REQUIRED readability one)
    const res2 = await request(app)
      .patch(`/api/inspections/${inspDoc._id}/findings/${(finding1 as any)._id}/review`)
      .set("Authorization", `Bearer ${officer.token}`)
      .send({
        action: "reject",
        comment: "Font size measured manually with digital micrometer — passes min height.",
      });

    expect(res2.status).toBe(200);
    expect(res2.body.finding.reviewStatus).toBe("REJECTED");
    // All findings rejected! Inspection becomes COMPLIANT!
    expect(res2.body.inspection.status).toBe("COMPLIANT");
    expect(res2.body.inspection.finalStatus).toBe("COMPLIANT");
  });

  it("marks a finding for supervisor review using mark-for-review action", async () => {
    const inspector = await tokenFor("INSPECTOR", "insp3");
    const inspDoc = await createInspectionWithFindings(inspector.userId);

    const res = await request(app)
      .patch(`/api/inspections/${inspDoc._id}/findings/1/review`)
      .set("Authorization", `Bearer ${inspector.token}`)
      .send({
        action: "mark-for-review",
        comment: "Requesting Senior Metrology Officer review on font height.",
      });

    expect(res.status).toBe(200);
    expect(res.body.finding.reviewStatus).toBe("MARKED_FOR_REVIEW");
    expect(res.body.finding.reviewComment).toContain("Requesting Senior Metrology Officer");
  });

  it("supports review via POST /api/inspections/:id/review-finding with index in body", async () => {
    const admin = await tokenFor("ADMIN", "admin1");
    const inspector = await tokenFor("INSPECTOR", "insp4");
    const inspDoc = await createInspectionWithFindings(inspector.userId);

    const res = await request(app)
      .post(`/api/inspections/${inspDoc._id}/review-finding`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        index: 0,
        action: "confirm",
        comment: "Admin confirmed violation.",
      });

    expect(res.status).toBe(200);
    expect(res.body.finding.ruleCode).toBe("LM-ORIGIN-PRESENCE");
    expect(res.body.finding.reviewStatus).toBe("CONFIRMED");
  });

  it("enforces inspector RBAC isolation: inspector B cannot review inspector A's inspection", async () => {
    const inspectorA = await tokenFor("INSPECTOR", "inspA");
    const inspectorB = await tokenFor("INSPECTOR", "inspB");
    const inspDoc = await createInspectionWithFindings(inspectorA.userId);

    const res = await request(app)
      .patch(`/api/inspections/${inspDoc._id}/findings/0/review`)
      .set("Authorization", `Bearer ${inspectorB.token}`)
      .send({ action: "confirm" });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/only access your own/i);
  });

  it("returns 400 for invalid review action", async () => {
    const officer = await tokenFor("OFFICER", "officer3");
    const inspDoc = await createInspectionWithFindings(officer.userId);

    const res = await request(app)
      .patch(`/api/inspections/${inspDoc._id}/findings/0/review`)
      .set("Authorization", `Bearer ${officer.token}`)
      .send({ action: "invalid_action" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid review action/i);
  });

  it("returns 404 for non-existent finding reference", async () => {
    const officer = await tokenFor("OFFICER", "officer4");
    const inspDoc = await createInspectionWithFindings(officer.userId);

    const res = await request(app)
      .patch(`/api/inspections/${inspDoc._id}/findings/NON_EXISTENT_ID/review`)
      .set("Authorization", `Bearer ${officer.token}`)
      .send({ action: "confirm" });

    expect(res.status).toBe(404);
  });

  it("finalizes overall inspection review via POST /api/inspections/:id/review", async () => {
    const officer = await tokenFor("OFFICER", "officer5");
    const inspDoc = await createInspectionWithFindings(officer.userId);

    const res = await request(app)
      .post(`/api/inspections/${inspDoc._id}/review`)
      .set("Authorization", `Bearer ${officer.token}`)
      .send({ finalStatus: "NON_COMPLIANT" });

    expect(res.status).toBe(200);
    expect(res.body.inspection.finalStatus).toBe("NON_COMPLIANT");
    expect(res.body.inspection.status).toBe("NON_COMPLIANT");
    expect(res.body.inspection.reviewer).toBe(officer.userId);
  });
});
