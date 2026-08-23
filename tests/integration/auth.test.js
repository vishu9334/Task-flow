import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Integration Tests: Auth Endpoints", () => {
  it("should successfully log in seeded user with valid credentials", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "john.doe@taskflow.dev",
        password: "Password123!",
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.user);
    assert.strictEqual(res.body.data.user.email, "john.doe@taskflow.dev");
    assert.ok(res.headers["set-cookie"]);
  });

  it("should reject login with wrong password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "john.doe@taskflow.dev",
        password: "WrongPassword!",
      });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.code, "INVALID_CREDENTIALS");
  });

  it("should reject unverified or non-existent email login", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "ghost.user@taskflow.dev",
        password: "Password123!",
      });

    assert.strictEqual(res.status, 401);
  });
});
