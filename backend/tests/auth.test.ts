import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Point the app at the in-memory DB before importing anything that reads env/db.
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

// Imported after env vars are set so config/env.ts picks up the test values.
import app from "../src/app";
import { User } from "../src/models/User";

async function createUser(role: "ADMIN" | "OFFICER" | "INSPECTOR", email: string) {
  const passwordHash = await User.hashPassword("Password@123");
  return User.create({ name: `Test ${role}`, email, passwordHash, role, active: true });
}

describe("Auth", () => {
  it("rejects login with a non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "whatever123" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rejects login with a wrong password", async () => {
    await createUser("INSPECTOR", "inspector@test.com");
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "inspector@test.com", password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  it("logs in with correct credentials and returns a JWT", async () => {
    await createUser("INSPECTOR", "inspector2@test.com");
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "inspector2@test.com", password: "Password@123" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.role).toBe("INSPECTOR");
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("rejects a deactivated account", async () => {
    const user = await createUser("OFFICER", "inactive@test.com");
    user.active = false;
    await user.save();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "inactive@test.com", password: "Password@123" });
    expect(res.status).toBe(401);
  });
});

describe("Role authorization", () => {
  async function loginAs(role: "ADMIN" | "OFFICER" | "INSPECTOR") {
    const email = `${role.toLowerCase()}@rbactest.com`;
    await createUser(role, email);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "Password@123" });
    return res.body.token as string;
  }

  it("blocks a non-admin from listing users", async () => {
    const token = await loginAs("INSPECTOR");
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("allows an admin to list users", async () => {
    const token = await loginAs("ADMIN");
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it("rejects requests with no token", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });

  it("rejects requests with a malformed token", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });
});
