import { postgresTaskData } from "../data/implimentations/postgres.task.data.js";
import { postgresProjectData } from "../data/implimentations/postgres.project.data.js";
import { emailQueue } from "../queue/email.queue.js";
import { ApiError } from "../utils/apiError.js";

const VALID_STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

class TaskService {
  constructor({ taskRepo = postgresTaskData, projectRepo = postgresProjectData } = {}) {
    this.taskRepo = taskRepo;
    this.projectRepo = projectRepo;
  }

  async createTask({
    orgId,
    userId,
    projectId,
    title,
    description,
    status = "TODO",
    priority = "MEDIUM",
    dueDate,
    assignedTo,
  }) {
    if (!orgId) {
      throw new ApiError(403, "Organization context is required", [], "ORGANIZATION_REQUIRED");
    }

    if (!projectId) {
      throw new ApiError(400, "Project ID is required", [], "VALIDATION_ERROR");
    }

    // Verify Project exists and belongs to the authenticated user's organization
    const project = await this.projectRepo.findProjectById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found", [], "PROJECT_NOT_FOUND");
    }

    if (project.orgId !== orgId) {
      throw new ApiError(
        403,
        "Cannot create task in a project belonging to another organization",
        [],
        "CROSS_TENANT_ACCESS_FORBIDDEN"
      );
    }

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      throw new ApiError(400, "Task title is required", [], "VALIDATION_ERROR");
    }

    if (title.trim().length > 150) {
      throw new ApiError(400, "Task title cannot exceed 150 characters", [], "VALIDATION_ERROR");
    }

    if (status && !VALID_STATUSES.includes(status)) {
      throw new ApiError(
        400,
        `Invalid status. Allowed values: ${VALID_STATUSES.join(", ")}`,
        [],
        "VALIDATION_ERROR"
      );
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      throw new ApiError(
        400,
        `Invalid priority. Allowed values: ${VALID_PRIORITIES.join(", ")}`,
        [],
        "VALIDATION_ERROR"
      );
    }

    let parsedDueDate = null;
    if (dueDate) {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        throw new ApiError(400, "Invalid dueDate format", [], "VALIDATION_ERROR");
      }
    }

    // If assignee provided, verify assignee belongs to the same organization
    let assigneeMember = null;
    if (assignedTo) {
      assigneeMember = await this.taskRepo.findMembership(orgId, assignedTo);
      if (!assigneeMember) {
        throw new ApiError(
          400,
          "Assigned user must belong to the same organization as the task",
          [],
          "INVALID_ASSIGNEE"
        );
      }
    }

    const task = await this.taskRepo.createTask({
      projectId,
      title: title.trim(),
      description: description ? String(description).trim() : null,
      status,
      priority,
      dueDate: parsedDueDate,
      createdBy: userId,
      assignedTo: assignedTo || null,
    });

    // If assigned to user upon creation, trigger asynchronous email notification
    if (assignedTo && assigneeMember?.user?.email) {
      try {
        await emailQueue.add("send-task-assigned", {
          type: "TASK_ASSIGNED",
          toEmail: assigneeMember.user.email,
          taskId: task.id,
          taskTitle: task.title,
          assignedToName: `${assigneeMember.user.firstName} ${assigneeMember.user.lastName}`,
        });
      } catch (err) {
        console.error("Failed to enqueue task assignment email:", err.message);
      }
    }

    return task;
  }

  async getTasks({
    orgId,
    projectId,
    status,
    priority,
    assignee,
    dueDateFrom,
    dueDateTo,
    search,
    page = 1,
    limit = 20,
    cursor,
  }) {
    if (!orgId) {
      throw new ApiError(403, "Organization context is required", [], "ORGANIZATION_REQUIRED");
    }

    if (status && !VALID_STATUSES.includes(status)) {
      throw new ApiError(
        400,
        `Invalid status filter. Allowed values: ${VALID_STATUSES.join(", ")}`,
        [],
        "VALIDATION_ERROR"
      );
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      throw new ApiError(
        400,
        `Invalid priority filter. Allowed values: ${VALID_PRIORITIES.join(", ")}`,
        [],
        "VALIDATION_ERROR"
      );
    }

    const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 20));

    const filterOptions = {
      projectId,
      status,
      priority,
      assignee,
      dueDateFrom,
      dueDateTo,
      search: search ? String(search).trim() : undefined,
    };

    // Cursor Pagination (PDF Requirement)
    if (cursor) {
      const items = await this.taskRepo.findTasksByOrgId(orgId, {
        ...filterOptions,
        take: parsedLimit + 1,
        cursor,
      });

      const hasNextPage = items.length > parsedLimit;
      const data = hasNextPage ? items.slice(0, parsedLimit) : items;
      const nextCursor = hasNextPage ? data[data.length - 1]?.id : null;

      return {
        data,
        next_cursor: nextCursor,
      };
    }

    // Offset Pagination (PDF Requirement)
    const parsedPage = Math.max(1, Number(page) || 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const [data, total] = await Promise.all([
      this.taskRepo.findTasksByOrgId(orgId, {
        ...filterOptions,
        skip,
        take: parsedLimit,
      }),
      this.taskRepo.countTasksByOrgId(orgId, filterOptions),
    ]);

    return {
      data,
      total,
      page: parsedPage,
      limit: parsedLimit,
    };
  }

  async getTaskById({ taskId, orgId }) {
    if (!taskId) {
      throw new ApiError(400, "Task ID is required", [], "VALIDATION_ERROR");
    }

    const task = await this.taskRepo.findTaskById(taskId);
    if (!task) {
      throw new ApiError(404, "Task not found", [], "TASK_NOT_FOUND");
    }

    // Cross-tenant verification
    if (task.project?.orgId !== orgId) {
      throw new ApiError(
        403,
        "Access to task belonging to another organization is forbidden",
        [],
        "CROSS_TENANT_ACCESS_FORBIDDEN"
      );
    }

    return task;
  }

  async updateTask({ taskId, orgId, title, description, status, priority, dueDate }) {
    await this.getTaskById({ taskId, orgId });

    const updateData = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        throw new ApiError(400, "Task title cannot be empty", [], "VALIDATION_ERROR");
      }
      if (title.trim().length > 150) {
        throw new ApiError(400, "Task title cannot exceed 150 characters", [], "VALIDATION_ERROR");
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description ? String(description).trim() : null;
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        throw new ApiError(
          400,
          `Invalid status. Allowed values: ${VALID_STATUSES.join(", ")}`,
          [],
          "VALIDATION_ERROR"
        );
      }
      updateData.status = status;
    }

    if (priority !== undefined) {
      if (!VALID_PRIORITIES.includes(priority)) {
        throw new ApiError(
          400,
          `Invalid priority. Allowed values: ${VALID_PRIORITIES.join(", ")}`,
          [],
          "VALIDATION_ERROR"
        );
      }
      updateData.priority = priority;
    }

    if (dueDate !== undefined) {
      if (dueDate === null) {
        updateData.dueDate = null;
      } else {
        const parsedDueDate = new Date(dueDate);
        if (isNaN(parsedDueDate.getTime())) {
          throw new ApiError(400, "Invalid dueDate format", [], "VALIDATION_ERROR");
        }
        updateData.dueDate = parsedDueDate;
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, "No valid fields provided for update", [], "VALIDATION_ERROR");
    }

    return this.taskRepo.updateTask(taskId, updateData);
  }

  async deleteTask({ taskId, orgId }) {
    await this.getTaskById({ taskId, orgId });

    await this.taskRepo.softDeleteTask(taskId, new Date());

    return {
      success: true,
      message: "Task deleted successfully",
      id: taskId,
    };
  }

  async assignTask({ taskId, orgId, assigneeId }) {
    if (!assigneeId) {
      throw new ApiError(400, "Assignee user ID is required", [], "VALIDATION_ERROR");
    }

    const task = await this.getTaskById({ taskId, orgId });

    // PDF Rule: "The assigned user must belong to the same organization as the task"
    const membership = await this.taskRepo.findMembership(orgId, assigneeId);
    if (!membership) {
      throw new ApiError(
        400,
        "Assigned user must belong to the same organization as the task",
        [],
        "INVALID_ASSIGNEE"
      );
    }

    const updatedTask = await this.taskRepo.assignTask(taskId, assigneeId);

    // Enqueue BullMQ notification job
    if (membership.user?.email) {
      try {
        await emailQueue.add("send-task-assigned", {
          type: "TASK_ASSIGNED",
          toEmail: membership.user.email,
          taskId: task.id,
          taskTitle: task.title,
          assignedToName: `${membership.user.firstName} ${membership.user.lastName}`,
        });
      } catch (err) {
        console.error("Failed to enqueue task assignment email:", err.message);
      }
    }

    return updatedTask;
  }

  async unassignTask({ taskId, orgId, assigneeId }) {
    if (!assigneeId) {
      throw new ApiError(400, "Assignee user ID is required", [], "VALIDATION_ERROR");
    }

    const task = await this.getTaskById({ taskId, orgId });

    const updatedTask = await this.taskRepo.unassignTask(taskId, assigneeId);

    return updatedTask;
  }

  async getDashboardCounts({ orgId, projectId }) {
    if (!orgId) {
      throw new ApiError(403, "Organization context is required", [], "ORGANIZATION_REQUIRED");
    }

    return this.taskRepo.getDashboardCountsByOrgId(orgId, projectId);
  }
}

const taskService = new TaskService();

export { TaskService, taskService };
