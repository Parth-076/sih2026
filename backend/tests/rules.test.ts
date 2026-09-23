import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app";
import { User } from "../src/models/User";
import { seedRules } from "../src/scripts/seedRules";

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

async function adminToken() {
  const passwordHash = await User.hashPassword("Admin@1234");
  await User.create({
    name: "Admin",
    email: "rules-admin@test.com",
    passwordHash,
    role: "ADMIN",
    active: true,
  });
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "rules-admin@test.com", password: "Admin@1234" });
  return res.body.token as string;
}

describe("Compliance rules API", () => {
  it("lists seeded demo rules for admin", async () => {
    await seedRules();
    const token = await adminToken();
    const res = await request(app).get("/api/rules").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.rules.length).toBe(10);
  });

  it("creates, updates, and deletes a rule", async () => {
    const token = await adminToken();
    const create = await request(app)
      .post("/api/rules")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ruleCode: "TEST-CUSTOM",
        name: "Custom test rule",
        description: "Demo",
        validationType: "PRESENCE",
        targetField: "batchNumber",
        defaultSeverity: "REVIEW_REQUIRED",
      });
    expect(create.status).toBe(201);

    const id = create.body.rule._id as string;
    const update = await request(app)
      .put(`/api/rules/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ enabled: false });
    expect(update.status).toBe(200);
    expect(update.body.rule.enabled).toBe(false);

    const del = await request(app)
      .delete(`/api/rules/${id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(200);
  });

  it("forbids inspectors from listing rules", async () => {
    const passwordHash = await User.hashPassword("Inspector@1234");
    await User.create({
      name: "Inspector",
      email: "insp@test.com",
      passwordHash,
      role: "INSPECTOR",
      active: true,
    });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "insp@test.com", password: "Inspector@1234" });
    const res = await request(app)
      .get("/api/rules")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(res.status).toBe(403);
  });
});
