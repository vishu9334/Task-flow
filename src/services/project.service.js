import { postgresProjectData } from "../data/implimentations/postgres.project.data.js";
import { ApiError } from "../utils/apiError.js";

class ProjectService {
  constructor(repository = postgresProjectData) {
    this.repository = repository;
  }

  async createProject({ orgId, userId, name, description }) {
    if (!orgId) {
      throw new ApiError(403, "Organization context is required", [], "ORGANIZATION_REQUIRED");
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new ApiError(400, "Project name is required", [], "VALIDATION_ERROR", {
        field: "name",
        message: "Project name cannot be empty",
      });
    }

    if (name.trim().length > 150) {
      throw new ApiError(400, "Project name cannot exceed 150 characters", [], "VALIDATION_ERROR", {
        field: "name",
        message: "Maximum 150 characters allowed",
      });
    }

    const project = await this.repository.createProject({
      orgId,
      name: name.trim(),
      description: description ? String(description).trim() : null,
      createdBy: userId,
    });

    return project;
  }

  async getProjects({ orgId, page = 1, limit = 20, cursor, search }) {
    if (!orgId) {
      throw new ApiError(403, "Organization context is required", [], "ORGANIZATION_REQUIRED");
    }

    const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 20));

    // Cursor-based pagination (as specified in PDF)
    if (cursor) {
      const items = await this.repository.findProjectsByOrgId(orgId, {
        take: parsedLimit + 1,
        cursor,
        search: search ? String(search).trim() : undefined,
      });

      const hasNextPage = items.length > parsedLimit;
      const data = hasNextPage ? items.slice(0, parsedLimit) : items;
      const nextCursor = hasNextPage ? data[data.length - 1]?.id : null;

      return {
        data,
        next_cursor: nextCursor,
      };
    }

    // Offset-based pagination (as specified in PDF)
    const parsedPage = Math.max(1, Number(page) || 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const [data, total] = await Promise.all([
      this.repository.findProjectsByOrgId(orgId, {
        skip,
        take: parsedLimit,
        search: search ? String(search).trim() : undefined,
      }),
      this.repository.countProjectsByOrgId(orgId, {
        search: search ? String(search).trim() : undefined,
      }),
    ]);

    return {
      data,
      total,
      page: parsedPage,
      limit: parsedLimit,
    };
  }

  async getProjectById({ projectId, orgId }) {
    if (!projectId) {
      throw new ApiError(400, "Project ID is required", [], "VALIDATION_ERROR");
    }

    const project = await this.repository.findProjectById(projectId);

    if (!project) {
      throw new ApiError(404, "Project not found", [], "PROJECT_NOT_FOUND");
    }

    // Strict Cross-tenant check (PDF Task 02 & Task 03 requirement)
    if (project.orgId !== orgId) {
      throw new ApiError(
        403,
        "Access to resource belonging to another organization is forbidden",
        [],
        "CROSS_TENANT_ACCESS_FORBIDDEN"
      );
    }

    return project;
  }

  async updateProject({ projectId, orgId, name, description }) {
    if (!projectId) {
      throw new ApiError(400, "Project ID is required", [], "VALIDATION_ERROR");
    }

    // Verify existence & tenant ownership
    await this.getProjectById({ projectId, orgId });

    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        throw new ApiError(400, "Project name cannot be empty", [], "VALIDATION_ERROR");
      }
      if (name.trim().length > 150) {
        throw new ApiError(400, "Project name cannot exceed 150 characters", [], "VALIDATION_ERROR");
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description ? String(description).trim() : null;
    }

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, "No valid fields provided for update", [], "VALIDATION_ERROR");
    }

    return this.repository.updateProject(projectId, updateData);
  }

  async deleteProject({ projectId, orgId, userRole }) {
    if (!projectId) {
      throw new ApiError(400, "Project ID is required", [], "VALIDATION_ERROR");
    }

    // PDF Rule: "Admins can manage members and delete projects"
    if (userRole !== "ADMIN") {
      throw new ApiError(
        403,
        "Only organization admins are allowed to delete projects",
        [],
        "FORBIDDEN"
      );
    }

    // Verify existence & tenant ownership
    await this.getProjectById({ projectId, orgId });

    // PDF Task 01 RESTRICT Rule: Prevent project deletion if active tasks exist
    const activeTasksCount = await this.repository.countActiveTasksByProjectId(projectId);
    if (activeTasksCount > 0) {
      throw new ApiError(
        400,
        `Cannot delete project with ${activeTasksCount} active task(s). Please delete or reassign all tasks first.`,
        [],
        "PROJECT_HAS_ACTIVE_TASKS"
      );
    }

    await this.repository.softDeleteProject(projectId, new Date());

    return {
      success: true,
      message: "Project deleted successfully",
      id: projectId,
    };
  }
}

const projectService = new ProjectService();

export { ProjectService, projectService };
