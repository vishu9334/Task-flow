import { ITaskRepository } from "../contracts/ITask.contract.js";
import { prisma } from "../prisma.js";

class PostgresTaskData extends ITaskRepository {
  constructor(client = prisma) {
    super();
    this.client = client;
  }

  async createTask(taskData) {
    return this.client.task.create({
      data: taskData,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            orgId: true,
          },
        },
      },
    });
  }

  async findTaskById(taskId, options = {}) {
    const { includeDeleted = false } = options;

    return this.client.task.findFirst({
      where: {
        id: taskId,
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
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            orgId: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findTaskByIdAndOrgId(taskId, orgId, options = {}) {
    const { includeDeleted = false } = options;

    return this.client.task.findFirst({
      where: {
        id: taskId,
        project: {
          orgId,
        },
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
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            orgId: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findTasksByOrgId(orgId, filterAndPaginationOptions = {}) {
    const {
      projectId,
      status,
      priority,
      assignee,
      dueDateFrom,
      dueDateTo,
      search,
      skip,
      take,
      cursor,
      orderBy = { createdAt: "desc" },
    } = filterAndPaginationOptions;

    const whereClause = {
      project: { orgId },
      deletedAt: null,
      ...(projectId ? { projectId } : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(assignee ? { assignedTo: assignee } : {}),
      ...(dueDateFrom || dueDateTo
        ? {
            dueDate: {
              ...(dueDateFrom ? { gte: new Date(dueDateFrom) } : {}),
              ...(dueDateTo ? { lte: new Date(dueDateTo) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    return this.client.task.findMany({
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
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            orgId: true,
          },
        },
      },
    });
  }

  async countTasksByOrgId(orgId, filterOptions = {}) {
    const { projectId, status, priority, assignee, dueDateFrom, dueDateTo, search } =
      filterOptions;

    const whereClause = {
      project: { orgId },
      deletedAt: null,
      ...(projectId ? { projectId } : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(assignee ? { assignedTo: assignee } : {}),
      ...(dueDateFrom || dueDateTo
        ? {
            dueDate: {
              ...(dueDateFrom ? { gte: new Date(dueDateFrom) } : {}),
              ...(dueDateTo ? { lte: new Date(dueDateTo) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    return this.client.task.count({
      where: whereClause,
    });
  }

  async updateTask(taskId, updateData) {
    return this.client.task.update({
      where: { id: taskId },
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
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            orgId: true,
          },
        },
      },
    });
  }

  async softDeleteTask(taskId, deletedAt = new Date()) {
    return this.client.task.update({
      where: { id: taskId },
      data: { deletedAt },
    });
  }

  async assignTask(taskId, userId) {
    return this.client.$transaction(async (transaction) => {
      await transaction.taskAssignment.upsert({
        where: {
          taskId_userId: {
            taskId,
            userId,
          },
        },
        create: {
          taskId,
          userId,
          assignedAt: new Date(),
        },
        update: {
          assignedAt: new Date(),
        },
      });

      return transaction.task.update({
        where: { id: taskId },
        data: { assignedTo: userId },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              orgId: true,
            },
          },
        },
      });
    });
  }

  async unassignTask(taskId, userId) {
    return this.client.$transaction(async (transaction) => {
      await transaction.taskAssignment.deleteMany({
        where: {
          taskId,
          userId,
        },
      });

      return transaction.task.update({
        where: { id: taskId },
        data: { assignedTo: null },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              orgId: true,
            },
          },
        },
      });
    });
  }

  async getDashboardCountsByOrgId(orgId, projectId) {
    const counts = await this.client.task.groupBy({
      by: ["status"],
      where: {
        project: { orgId },
        ...(projectId ? { projectId } : {}),
        deletedAt: null,
      },
      _count: {
        _all: true,
      },
    });

    const formattedCounts = {
      TODO: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      DONE: 0,
      total: 0,
    };

    counts.forEach((item) => {
      formattedCounts[item.status] = item._count._all;
      formattedCounts.total += item._count._all;
    });

    return formattedCounts;
  }

  async findMembership(orgId, userId) {
    return this.client.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
      include: {
        user: {
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
}

const postgresTaskData = new PostgresTaskData();

export { PostgresTaskData, postgresTaskData };
