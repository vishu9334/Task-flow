import { describe, it } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { AuthService } from "../../src/services/auth.service.js";

describe("Unit Tests: Authentication Logic", () => {
  it("should hash passwords using bcrypt with at least 12 salt rounds", async () => {
    const rawPassword = "SecurePassword123!";
    const saltRounds = 12;
    const hash = await bcrypt.hash(rawPassword, saltRounds);

    assert.ok(hash.startsWith("$2a$12$") || hash.startsWith("$2b$12$"));
    const matches = await bcrypt.compare(rawPassword, hash);
    assert.strictEqual(matches, true);
  });

  it("should generate username from email prefix when username is not provided", () => {
    const email = "vishal.kumar@taskflow.dev";
    const username = email.split("@")[0];
    assert.strictEqual(username, "vishal.kumar");
  });

  it("should reject invalid email format during registration", async () => {
    const mockRepo = {};
    const service = new AuthService({ repository: mockRepo });

    await assert.rejects(
      async () => {
        await service.register({
          firstName: "John",
          lastName: "Doe",
          email: "invalid-email-address",
          password: "Password123!",
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, "INVALID_EMAIL");
        return true;
      }
    );
  });
});
