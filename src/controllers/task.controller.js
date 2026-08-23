import { taskService } from "../services/task.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";

class TaskController {
  constructor(service = taskService) {
    this.service = service;

    this.createTask = asyncHandler(this.createTask.bind(this));
    this.getTasks = asyncHandler(this.getTasks.bind(this));
    this.getTaskById = asyncHandler(this.getTaskById.bind(this));
    this.updateTask = asyncHandler(this.updateTask.bind(this));
    this.deleteTask = asyncHandler(this.deleteTask.bind(this));
    this.assignTask = asyncHandler(this.assignTask.bind(this));
    this.unassignTask = asyncHandler(this.unassignTask.bind(this));
    this.getDashboardCounts = asyncHandler(this.getDashboardCounts.bind(this));
  }

  async createTask(req, res) {
    const { projectId, title, description, status, priority, dueDate, assignedTo, memberId } = req.body;
    const targetMemberId = assignedTo || memberId;
    const task = await this.service.createTask({
      orgId: req.organizationId,
      creatorAdminId: req.user.sub,
      projectId,
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo: targetMemberId,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, task, "Task created successfully"));
  }

  async getTasks(req, res) {
    const {
      projectId,
      status,
      priority,
      assignee,
      dueDateFrom,
      dueDateTo,
      search,
      page,
      limit,
      cursor,
    } = req.query;

    const result = await this.service.getTasks({
      orgId: req.organizationId,
      projectId,
      status,
      priority,
      assignee,
      dueDateFrom,
      dueDateTo,
      search,
      page,
      limit,
      cursor,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Tasks retrieved successfully"));
  }

  async getTaskById(req, res) {
    const { id } = req.params;
    const task = await this.service.getTaskById({
      taskId: id,
      orgId: req.organizationId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, task, "Task retrieved successfully"));
  }

  async updateTask(req, res) {
    const { id } = req.params;
    const { title, description, status, priority, dueDate } = req.body;

    const task = await this.service.updateTask({
      taskId: id,
      orgId: req.organizationId,
      title,
      description,
      status,
      priority,
      dueDate,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, task, "Task updated successfully"));
  }

  async deleteTask(req, res) {
    const { id } = req.params;
    const result = await this.service.deleteTask({
      taskId: id,
      orgId: req.organizationId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Task deleted successfully"));
  }

  async assignTask(req, res) {
    const { id } = req.params;
    const { memberId } = req.body;

    const task = await this.service.assignTask({
      taskId: id,
      orgId: req.organizationId,
      memberId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, task, "Task assigned successfully"));
  }

  async unassignTask(req, res) {
    const { id } = req.params;
    const { memberId } = req.body;

    const task = await this.service.unassignTask({
      taskId: id,
      orgId: req.organizationId,
      memberId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, task, "Task unassigned successfully"));
  }

  async getDashboardCounts(req, res) {
    const { projectId } = req.query;
    const counts = await this.service.getDashboardCounts({
      orgId: req.organizationId,
      projectId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, counts, "Dashboard counts retrieved successfully"));
  }
}

const taskController = new TaskController();

export { TaskController, taskController };
