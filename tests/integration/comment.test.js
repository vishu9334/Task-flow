import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/data/prisma.js";

describe("Integration Tests: Comment Endpoints", () => {
  it("should reject an empty comment", async () => {
    const loginRes = await request(app).post("/auth/login").send({
      email: "john.doe@taskflow.dev",
      password: "Password123!",
    });

    const cookie = loginRes.headers["set-cookie"];
    const orgId = loginRes.body.data.organization.id;
    const task = await prisma.task.findFirst({
      where: { deletedAt: null, project: { orgId } },
    });
    assert.ok(task);

    const response = await request(app)
      .post(`/tasks/${task.id}/comments`)
      .set("Cookie", cookie)
      .set("x-organization-id", orgId)
      .send({ content: "   " });

    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.code, "VALIDATION_ERROR");
  });

  it("should create and soft delete the authenticated user's comment", async () => {
    const loginRes = await request(app).post("/auth/login").send({
      email: "john.doe@taskflow.dev",
      password: "Password123!",
    });

    assert.strictEqual(loginRes.status, 200);
    const cookie = loginRes.headers["set-cookie"];
    const orgId = loginRes.body.data.organization.id;

    const task = await prisma.task.findFirst({
      where: {
        deletedAt: null,
        project: { orgId },
      },
    });
    assert.ok(task);

    const createRes = await request(app)
      .post(`/tasks/${task.id}/comments`)
      .set("Cookie", cookie)
      .set("x-organization-id", orgId)
      .send({ content: "Comment created by the integration test" });

    assert.strictEqual(createRes.status, 201);
    assert.strictEqual(createRes.body.data.taskId, task.id);
    assert.strictEqual(createRes.body.data.content, "Comment created by the integration test");
    const commentId = createRes.body.data.id;

    const deleteRes = await request(app)
      .delete(`/tasks/${task.id}/comments/${commentId}`)
      .set("Cookie", cookie)
      .set("x-organization-id", orgId);

    assert.strictEqual(deleteRes.status, 200);
    assert.strictEqual(deleteRes.body.data.id, commentId);
    assert.strictEqual(deleteRes.body.data.deletedAt, null);

    const storedComment = await prisma.comment.findUnique({ where: { id: commentId } });
    assert.ok(storedComment.deletedAt);
  });
});
