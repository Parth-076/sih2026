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

async function tokenFor(role: "ADMIN" | "OFFICER" | "INSPECTOR") {
  const email = `${role.toLowerCase()}@producttest.com`;
  const passwordHash = await User.hashPassword("Password@123");
  await User.create({ name: `Test ${role}`, email, passwordHash, role, active: true });
  const res = await request(app).post("/api/auth/login").send({ email, password: "Password@123" });
  return res.body.token as string;
}

const samplePayload = {
  productName: "Test Mustard Oil",
  brand: "TestBrand",
  netQuantity: 500,
  unit: "ml",
  mrp: 120,
  barcode: "1234567890123",
};

describe("Product creation", () => {
  it("allows an admin to create a product", async () => {
    const token = await tokenFor("ADMIN");
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send(samplePayload);
    expect(res.status).toBe(201);
    expect(res.body.product.productName).toBe("Test Mustard Oil");
  });

  it("blocks an inspector from creating a product", async () => {
    const token = await tokenFor("INSPECTOR");
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send(samplePayload);
    expect(res.status).toBe(403);
  });

  it("blocks an officer from creating a product", async () => {
    const token = await tokenFor("OFFICER");
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send(samplePayload);
    expect(res.status).toBe(403);
  });

  it("rejects an invalid payload (missing required productName)", async () => {
    const token = await tokenFor("ADMIN");
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ brand: "NoName" });
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate barcode", async () => {
    const token = await tokenFor("ADMIN");
    await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send(samplePayload);
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...samplePayload, productName: "Duplicate Barcode Product" });
    expect(res.status).toBe(409);
  });
});

describe("Product reads", () => {
  it("lets any authenticated role list products", async () => {
    const admin = await tokenFor("ADMIN");
    await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${admin}`)
      .send(samplePayload);

    const inspector = await tokenFor("INSPECTOR");
    const res = await request(app)
      .get("/api/products")
      .set("Authorization", `Bearer ${inspector}`);
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(1);
  });

  it("looks a product up by barcode", async () => {
    const admin = await tokenFor("ADMIN");
    await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${admin}`)
      .send(samplePayload);

    const res = await request(app)
      .get(`/api/products/barcode/${samplePayload.barcode}`)
      .set("Authorization", `Bearer ${admin}`);
    expect(res.status).toBe(200);
    expect(res.body.product.barcode).toBe(samplePayload.barcode);
  });

  it("returns a clear 404 message when a barcode isn't in the repository", async () => {
    const admin = await tokenFor("ADMIN");
    const res = await request(app)
      .get("/api/products/barcode/0000000000000")
      .set("Authorization", `Bearer ${admin}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found in repository/i);
  });
});

describe("Product update/delete permissions", () => {
  it("blocks a non-admin from deleting a product", async () => {
    const admin = await tokenFor("ADMIN");
    const created = await Product.create(samplePayload);

    const inspector = await tokenFor("INSPECTOR");
    const res = await request(app)
      .delete(`/api/products/${created.id}`)
      .set("Authorization", `Bearer ${inspector}`);
    expect(res.status).toBe(403);
    void admin;
  });

  it("allows an admin to update and then delete a product", async () => {
    const admin = await tokenFor("ADMIN");
    const created = await Product.create(samplePayload);

    const updateRes = await request(app)
      .put(`/api/products/${created.id}`)
      .set("Authorization", `Bearer ${admin}`)
      .send({ mrp: 150 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.product.mrp).toBe(150);

    const deleteRes = await request(app)
      .delete(`/api/products/${created.id}`)
      .set("Authorization", `Bearer ${admin}`);
    expect(deleteRes.status).toBe(200);
  });
});
