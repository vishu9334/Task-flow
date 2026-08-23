import { projectService } from "../services/project.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";

class ProjectController {
  constructor(service = projectService) {
    this.service = service;

    this.createProject = asyncHandler(this.createProject.bind(this));
    this.getProjects = asyncHandler(this.getProjects.bind(this));
    this.getProjectById = asyncHandler(this.getProjectById.bind(this));
    this.updateProject = asyncHandler(this.updateProject.bind(this));
    this.deleteProject = asyncHandler(this.deleteProject.bind(this));
  }

  async createProject(req, res) {
    const { name, description } = req.body;
    const project = await this.service.createProject({
      orgId: req.organizationId,
      creatorAdminId: req.user.sub,
      name,
      description,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, project, "Project created successfully"));
  }

  async getProjects(req, res) {
    const { page, limit, cursor, search } = req.query;
    const result = await this.service.getProjects({
      orgId: req.organizationId,
      page,
      limit,
      cursor,
      search,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Projects retrieved successfully"));
  }

  async getProjectById(req, res) {
    const { id } = req.params;
    const project = await this.service.getProjectById({
      projectId: id,
      orgId: req.organizationId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, project, "Project retrieved successfully"));
  }

  async updateProject(req, res) {
    const { id } = req.params;
    const { name, description } = req.body;
    const project = await this.service.updateProject({
      projectId: id,
      orgId: req.organizationId,
      name,
      description,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, project, "Project updated successfully"));
  }

  async deleteProject(req, res) {
    const { id } = req.params;
    const result = await this.service.deleteProject({
      projectId: id,
      orgId: req.organizationId,
      requesterAdminId: req.user.sub,
      userRole: req.membership?.role || req.user?.role,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Project deleted successfully"));
  }
}

const projectController = new ProjectController();

export { ProjectController, projectController };