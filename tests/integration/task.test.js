import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/data/prisma.js";

describe("Integration Tests: Task CRUD & Dashboard Endpoints", () => {
  it("should create a new task, fetch it, update it, and soft delete it", async () => {
    // 1. Login
    const loginRes = await request(app)
      .post("/auth/login")
      .send({
        email: "john.doe@taskflow.dev",
        password: "Password123!",
      });

    const cookie = loginRes.headers["set-cookie"];
    const orgId = loginRes.body.data.organization.id;

    // 2. Get an Acme project
    const project = await prisma.project.findFirst({
      where: { orgId },
    });
    assert.ok(project);

    // 3. Create Task
    const createRes = await request(app)
      .post("/tasks")
      .set("Cookie", cookie)
      .set("x-organization-id", orgId)
      .send({
        projectId: project.id,
        title: "Automated Integration Test Task",
        description: "Created during automated test suite execution",
        status: "TODO",
        priority: "HIGH",
      });

    assert.strictEqual(createRes.status, 201);
    assert.strictEqual(createRes.body.data.title, "Automated Integration Test Task");
    const taskId = createRes.body.data.id;

    // 4. Get Task By ID
    const getRes = await request(app)
      .get(`/tasks/${taskId}`)
      .set("Cookie", cookie)
      .set("x-organization-id", orgId);

    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.body.data.id, taskId);

    // 5. Update Task
    const updateRes = await request(app)
      .patch(`/tasks/${taskId}`)
      .set("Cookie", cookie)
      .set("x-organization-id", orgId)
      .send({
        status: "IN_PROGRESS",
        priority: "URGENT",
      });

    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.data.status, "IN_PROGRESS");

    // 6. Get Dashboard Counts
    const dashRes = await request(app)
      .get("/dashboard/counts")
      .set("Cookie", cookie)
      .set("x-organization-id", orgId);

    assert.strictEqual(dashRes.status, 200);
    assert.ok(dashRes.body.data.total > 0);
    assert.ok(dashRes.body.data.IN_PROGRESS > 0);

    // 7. Soft Delete Task
    const deleteRes = await request(app)
      .delete(`/tasks/${taskId}`)
      .set("Cookie", cookie)
      .set("x-organization-id", orgId);

    assert.strictEqual(deleteRes.status, 200);
    assert.strictEqual(deleteRes.body.data.success, true);
  });
});
