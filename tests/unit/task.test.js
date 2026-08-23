import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TaskService } from "../../src/services/task.service.js";

describe("Unit Tests: Task Logic & Assignment Validation", () => {
  it("should reject task creation if assignee does not belong to the same organization", async () => {
    const mockTaskRepo = {
      findMembership: async (_orgId, _userId) => null, // User is not a member of this org
    };
    const mockProjectRepo = {
      findProjectById: async () => ({
        id: "proj-123",
        orgId: "org-456",
      }),
    };

    const taskService = new TaskService({
      taskRepo: mockTaskRepo,
      projectRepo: mockProjectRepo,
    });

    await assert.rejects(
      async () => {
        await taskService.createTask({
          orgId: "org-456",
          creatorAdminId: "admin-111",
          projectId: "proj-123",
          title: "New Feature Task",
          assignedTo: "outsider-user-999",
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, "INVALID_ASSIGNEE");
        return true;
      }
    );
  });

  it("should reject invalid task status enum", async () => {
    const mockTaskRepo = {};
    const mockProjectRepo = {
      findProjectById: async () => ({ id: "p1", orgId: "org1" }),
    };
    const taskService = new TaskService({ taskRepo: mockTaskRepo, projectRepo: mockProjectRepo });

    await assert.rejects(
      async () => {
        await taskService.createTask({
          orgId: "org1",
          creatorAdminId: "a1",
          projectId: "p1",
          title: "Valid Title",
          status: "INVALID_STATUS",
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, "VALIDATION_ERROR");
        return true;
      }
    );
  });

  it("should reject task titles exceeding 150 characters", async () => {
    const mockTaskRepo = {};
    const mockProjectRepo = {
      findProjectById: async () => ({ id: "p1", orgId: "org1" }),
    };
    const taskService = new TaskService({ taskRepo: mockTaskRepo, projectRepo: mockProjectRepo });
    const longTitle = "A".repeat(151);

    await assert.rejects(
      async () => {
        await taskService.createTask({
          orgId: "org1",
          creatorAdminId: "a1",
          projectId: "p1",
          title: longTitle,
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, "VALIDATION_ERROR");
        return true;
      }
    );
  });

  it("should enforce RESTRICT constraint: reject project deletion when active tasks exist", async () => {
    const { ProjectService } = await import("../../src/services/project.service.js");
    const mockProjectRepo = {
      findProjectById: async () => ({ id: "proj-1", orgId: "org-1" }),
      countActiveTasksByProjectId: async () => 3, // 3 active tasks exist
      softDeleteProject: async () => {},
    };
    const projectService = new ProjectService(mockProjectRepo);

    await assert.rejects(
      async () => {
        await projectService.deleteProject({
          projectId: "proj-1",
          orgId: "org-1",
          requesterAdminId: "admin-1",
          userRole: "ADMIN",
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, "PROJECT_HAS_ACTIVE_TASKS");
        return true;
      }
    );
  });
});
