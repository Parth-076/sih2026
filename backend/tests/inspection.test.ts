import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

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

import app from "../src/app";
import { User } from "../src/models/User";
import { Product } from "../src/models/Product";
import { Inspection } from "../src/models/Inspection";

// Smallest possible valid PNG (1x1 transparent pixel).
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

async function tokenFor(role: "ADMIN" | "OFFICER" | "INSPECTOR", suffix = "") {
  const email = `${role.toLowerCase()}${suffix}@inspectiontest.com`;
  const passwordHash = await User.hashPassword("Password@123");
  const user = await User.create({ name: `Test ${role}`, email, passwordHash, role, active: true });
  const res = await request(app).post("/api/auth/login").send({ email, password: "Password@123" });
  return { token: res.body.token as string, userId: user.id as string };
}

describe("Inspection creation", () => {
  it("rejects creation with no images", async () => {
    const { token } = await tokenFor("INSPECTOR");
    const res = await request(app)
      .post("/api/inspections")
      .set("Authorization", `Bearer ${token}`)
      .field("barcode", "0000000000000");
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least one package image/i);
  });

  it("rejects an unsupported file type", async () => {
    const { token } = await tokenFor("INSPECTOR", "2");
    const res = await request(app)
      .post("/api/inspections")
      .set("Authorization", `Bearer ${token}`)
      .attach("images", Buffer.from("not an image"), "notes.txt");
    expect(res.status).toBe(400);
  });

  it("creates an inspection with a valid image, no barcode", async () => {
    const { token } = await tokenFor("INSPECTOR", "3");
    const res = await request(app)
      .post("/api/inspections")
      .set("Authorization", `Bearer ${token}`)
      .attach("images", TINY_PNG, "front.png");
    expect(res.status).toBe(201);
    expect(res.body.inspection.status).toBe("PENDING_ANALYSIS");
    expect(res.body.inspection.images.length).toBe(1);
    expect(res.body.productMatch.matched).toBe(false);
  });

  it("matches a product when the barcode is found in the repository", async () => {
    await Product.create({ productName: "Matched Product", barcode: "1111111111111" });
    const { token } = await tokenFor("OFFICER");
    const res = await request(app)
      .post("/api/inspections")
      .set("Authorization", `Bearer ${token}`)
      .field("barcode", "1111111111111")
      .attach("images", TINY_PNG, "front.png");
    expect(res.status).toBe(201);
    expect(res.body.productMatch.matched).toBe(true);
    expect(res.body.inspection.product).toBeTruthy();
  });

  it("returns the not-found message when the barcode doesn't match any product", async () => {
    const { token } = await tokenFor("OFFICER", "2");
    const res = await request(app)
      .post("/api/inspections")
      .set("Authorization", `Bearer ${token}`)
      .field("barcode", "9999999999999")
      .attach("images", TINY_PNG, "front.png");
    expect(res.status).toBe(201);
    expect(res.body.productMatch.matched).toBe(false);
    expect(res.body.productMatch.message).toMatch(/not found in repository/i);
  });

  it("accepts multiple package-side images", async () => {
    const { token } = await tokenFor("ADMIN");
    const res = await request(app)
      .post("/api/inspections")
      .set("Authorization", `Bearer ${token}`)
      .attach("images", TINY_PNG, "front.png")
      .attach("images", TINY_PNG, "back.png");
    expect(res.status).toBe(201);
    expect(res.body.inspection.images.length).toBe(2);
  });
});

describe("Inspection visibility", () => {
  it("lets an inspector view their own inspection", async () => {
    const { token } = await tokenFor("INSPECTOR", "4");
    const createRes = await request(app)
      .post("/api/inspections")
      .set("Authorization", `Bearer ${token}`)
      .attach("images", TINY_PNG, "front.png");

    const getRes = await request(app)
      .get(`/api/inspections/${createRes.body.inspection._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(getRes.status).toBe(200);
  });

  it("blocks an inspector from viewing another inspector's inspection", async () => {
    const inspectorA = await tokenFor("INSPECTOR", "5a");
    const inspectorB = await tokenFor("INSPECTOR", "5b");

    const createRes = await request(app)
      .post("/api/inspections")
      .set("Authorization", `Bearer ${inspectorA.token}`)
      .attach("images", TINY_PNG, "front.png");

    const getRes = await request(app)
      .get(`/api/inspections/${createRes.body.inspection._id}`)
      .set("Authorization", `Bearer ${inspectorB.token}`);
    expect(getRes.status).toBe(403);
  });

  it("lets an officer view any inspector's inspection", async () => {
    const inspector = await tokenFor("INSPECTOR", "6");
    const officer = await tokenFor("OFFICER", "3");

    const createRes = await request(app)
      .post("/api/inspections")
      .set("Authorization", `Bearer ${inspector.token}`)
      .attach("images", TINY_PNG, "front.png");

    const getRes = await request(app)
      .get(`/api/inspections/${createRes.body.inspection._id}`)
      .set("Authorization", `Bearer ${officer.token}`);
    expect(getRes.status).toBe(200);
  });

  it("scopes the inspection list to the inspector's own records", async () => {
    const inspectorA = await tokenFor("INSPECTOR", "7a");
    const inspectorB = await tokenFor("INSPECTOR", "7b");

    await request(app)
      .post("/api/inspections")
      .set("Authorization", `Bearer ${inspectorA.token}`)
      .attach("images", TINY_PNG, "front.png");
    await request(app)
      .post("/api/inspections")
      .set("Authorization", `Bearer ${inspectorB.token}`)
      .attach("images", TINY_PNG, "front.png");

    const listRes = await request(app)
      .get("/api/inspections")
      .set("Authorization", `Bearer ${inspectorA.token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.inspections.length).toBe(1);
  });
});

describe("Inspection filtering & history (Phase 12)", () => {
  it("filters inspections by status", async () => {
    const { token, userId } = await tokenFor("OFFICER", "f1");

    await Inspection.create({
      inspectionCode: "INS-F-001",
      inspector: userId,
      status: "COMPLIANT",
      images: ["/uploads/test.jpg"],
    });
    await Inspection.create({
      inspectionCode: "INS-F-002",
      inspector: userId,
      status: "NON_COMPLIANT",
      images: ["/uploads/test.jpg"],
    });

    const res = await request(app)
      .get("/api/inspections?status=COMPLIANT")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.inspections.length).toBe(1);
    expect(res.body.inspections[0].inspectionCode).toBe("INS-F-001");
  });

  it("filters inspections by product category", async () => {
    const { token, userId } = await tokenFor("OFFICER", "f2");

    const bev = await Product.create({
      productName: "Mango Juice",
      productCategory: "Beverages",
    });
    const snack = await Product.create({
      productName: "Potato Chips",
      productCategory: "Snacks",
    });

    await Inspection.create({
      inspectionCode: "INS-CAT-001",
      inspector: userId,
      product: bev._id,
      status: "COMPLIANT",
      images: ["/uploads/test.jpg"],
    });
    await Inspection.create({
      inspectionCode: "INS-CAT-002",
      inspector: userId,
      product: snack._id,
      status: "COMPLIANT",
      images: ["/uploads/test.jpg"],
    });

    const res = await request(app)
      .get("/api/inspections?category=Beverages")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.inspections.length).toBe(1);
    expect(res.body.inspections[0].inspectionCode).toBe("INS-CAT-001");
  });

  it("filters inspections by product keyword/barcode", async () => {
    const { token, userId } = await tokenFor("OFFICER", "f3");

    const prod = await Product.create({
      productName: "Special Chocolate",
      brand: "SweetCo",
      barcode: "8901234567890",
    });

    await Inspection.create({
      inspectionCode: "INS-PROD-001",
      inspector: userId,
      product: prod._id,
      status: "COMPLIANT",
      images: ["/uploads/test.jpg"],
    });
    await Inspection.create({
      inspectionCode: "INS-PROD-002",
      inspector: userId,
      status: "COMPLIANT",
      images: ["/uploads/test.jpg"],
    });

    const res = await request(app)
      .get("/api/inspections?product=SweetCo")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.inspections.length).toBe(1);
    expect(res.body.inspections[0].inspectionCode).toBe("INS-PROD-001");
  });

  it("filters inspections by findings severity", async () => {
    const { token, userId } = await tokenFor("OFFICER", "f4");

    await Inspection.create({
      inspectionCode: "INS-SEV-001",
      inspector: userId,
      status: "NON_COMPLIANT",
      images: ["/uploads/test.jpg"],
      findings: [
        {
          ruleCode: "RULE-1",
          ruleName: "Rule 1",
          validationType: "PRESENCE",
          field: "mrp",
          outcome: "NON_COMPLIANT",
          message: "MRP missing",
          evidence: { location: "label" },
        },
      ],
    });
    await Inspection.create({
      inspectionCode: "INS-SEV-002",
      inspector: userId,
      status: "REVIEW_REQUIRED",
      images: ["/uploads/test.jpg"],
      findings: [
        {
          ruleCode: "RULE-2",
          ruleName: "Rule 2",
          validationType: "PRESENCE",
          field: "netQuantity",
          outcome: "REVIEW_REQUIRED",
          message: "Check weight",
          evidence: { location: "label" },
        },
      ],
    });

    const res = await request(app)
      .get("/api/inspections?severity=NON_COMPLIANT")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.inspections.length).toBe(1);
    expect(res.body.inspections[0].inspectionCode).toBe("INS-SEV-001");
  });

  it("filters inspections by date range", async () => {
    const { token, userId } = await tokenFor("OFFICER", "f5");

    const past = new Date("2026-01-01T00:00:00.000Z");
    const recent = new Date("2026-06-15T00:00:00.000Z");

    const insp1 = new Inspection({
      inspectionCode: "INS-DATE-001",
      inspector: userId,
      status: "COMPLIANT",
      images: ["/uploads/test.jpg"],
    });
    insp1.createdAt = past;
    await insp1.save();

    const insp2 = new Inspection({
      inspectionCode: "INS-DATE-002",
      inspector: userId,
      status: "COMPLIANT",
      images: ["/uploads/test.jpg"],
    });
    insp2.createdAt = recent;
    await insp2.save();

    const res = await request(app)
      .get("/api/inspections?startDate=2026-06-01&endDate=2026-06-30")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.inspections.length).toBe(1);
    expect(res.body.inspections[0].inspectionCode).toBe("INS-DATE-002");
  });

  it("allows officer to filter by inspector, while inspector remains strictly scoped", async () => {
    const inspectorA = await tokenFor("INSPECTOR", "f6a");
    const inspectorB = await tokenFor("INSPECTOR", "f6b");
    const officer = await tokenFor("OFFICER", "f6c");

    await Inspection.create({
      inspectionCode: "INS-INSP-001",
      inspector: inspectorA.userId,
      status: "COMPLIANT",
      images: ["/uploads/test.jpg"],
    });
    await Inspection.create({
      inspectionCode: "INS-INSP-002",
      inspector: inspectorB.userId,
      status: "COMPLIANT",
      images: ["/uploads/test.jpg"],
    });

    // Officer filters by inspectorA
    const offRes = await request(app)
      .get(`/api/inspections?inspector=${inspectorA.userId}`)
      .set("Authorization", `Bearer ${officer.token}`);
    expect(offRes.status).toBe(200);
    expect(offRes.body.inspections.length).toBe(1);
    expect(offRes.body.inspections[0].inspectionCode).toBe("INS-INSP-001");

    // InspectorA tries to query inspectorB — should still receive only inspectorA's inspections
    const inspRes = await request(app)
      .get(`/api/inspections?inspector=${inspectorB.userId}`)
      .set("Authorization", `Bearer ${inspectorA.token}`);
    expect(inspRes.status).toBe(200);
    expect(inspRes.body.inspections.length).toBe(1);
    expect(inspRes.body.inspections[0].inspectionCode).toBe("INS-INSP-001");
  });
});
