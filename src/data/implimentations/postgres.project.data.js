import { IProjectRepository } from "../contracts/IProject.contract.js";
import { prisma } from "../prisma.js";

class PostgresProjectData extends IProjectRepository {
  constructor(client = prisma) {
    super();
    this.client = client;
  }

  async createProject(projectData) {
    return this.client.project.create({
      data: projectData,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findProjectById(projectId, options = {}) {
    const { includeDeleted = false } = options;

    return this.client.project.findFirst({
      where: {
        id: projectId,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });
  }

  async findProjectByIdAndOrgId(projectId, orgId, options = {}) {
    const { includeDeleted = false } = options;

    return this.client.project.findFirst({
      where: {
        id: projectId,
        orgId,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });
  }

  async findProjectsByOrgId(orgId, paginationOptions = {}) {
    const {
      skip,
      take,
      cursor,
      search,
      orderBy = { createdAt: "desc" },
    } = paginationOptions;

    const whereClause = {
      orgId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    return this.client.project.findMany({
      where: whereClause,
      ...(skip !== undefined ? { skip } : {}),
      ...(take !== undefined ? { take } : {}),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });
  }

  async countProjectsByOrgId(orgId, filterOptions = {}) {
    const { search } = filterOptions;

    const whereClause = {
      orgId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    return this.client.project.count({
      where: whereClause,
    });
  }

  async updateProject(projectId, updateData) {
    return this.client.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async softDeleteProject(projectId, deletedAt = new Date()) {
    return this.client.project.update({
      where: { id: projectId },
      data: { deletedAt },
    });
  }
}

const postgresProjectData = new PostgresProjectData();

export { PostgresProjectData, postgresProjectData };
