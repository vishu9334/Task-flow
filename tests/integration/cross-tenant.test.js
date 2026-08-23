import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/data/prisma.js";

describe("Integration Tests: Multi-Tenant Cross-Org Security", () => {
  it("should return 403 Forbidden when a user tries to access a project from another organization", async () => {
    // 1. Login User 1 (Acme Technologies)
    const loginRes = await request(app)
      .post("/auth/login")
      .send({
        email: "john.doe@taskflow.dev",
        password: "Password123!",
      });

    const cookie = loginRes.headers["set-cookie"];
    const acmeOrgId = loginRes.body.data.organization.id;

    // 2. Find a project belonging to Stark Enterprises (the other org)
    const starkOrg = await prisma.organization.findUnique({
      where: { slug: "stark-enterprises" },
      include: { projects: true },
    });

    const starkProject = starkOrg.projects[0];
    assert.ok(starkProject, "Stark project must exist in seed data");

    // 3. User 1 tries to access Stark's project using Acme's context
    const res = await request(app)
      .get(`/projects/${starkProject.id}`)
      .set("Cookie", cookie)
      .set("x-organization-id", acmeOrgId);

    // PDF Rule: Cross-tenant attempts MUST return 403 Forbidden and not expose data
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.code, "CROSS_TENANT_ACCESS_FORBIDDEN");
  });

  it("should return 403 Forbidden when a user tries to access a task from another organization", async () => {
    // 1. Login User 1 (Acme Technologies)
    const loginRes = await request(app)
      .post("/auth/login")
      .send({
        email: "john.doe@taskflow.dev",
        password: "Password123!",
      });

    const cookie = loginRes.headers["set-cookie"];
    const acmeOrgId = loginRes.body.data.organization.id;

    // 2. Find a task belonging to Stark Enterprises
    const starkTask = await prisma.task.findFirst({
      where: { project: { organization: { slug: "stark-enterprises" } } },
    });

    assert.ok(starkTask, "Stark task must exist");

    // 3. User 1 attempts to read Stark task
    const res = await request(app)
      .get(`/tasks/${starkTask.id}`)
      .set("Cookie", cookie)
      .set("x-organization-id", acmeOrgId);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.code, "CROSS_TENANT_ACCESS_FORBIDDEN");
  });
});
