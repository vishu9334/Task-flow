import { IOrganizationRepository } from "../contracts/IOrganization.contract.js";
import { prisma } from "../prisma.js";

class PostgresOrganizationData extends IOrganizationRepository {
  constructor(client = prisma) {
    super();
    this.client = client;
  }

  async createOrganization({ name, slug, userId }) {
    return this.client.$transaction(async (transaction) => {
      const organization = await transaction.organization.create({
        data: {
          name,
          slug,
          userId,
        },
      });

      const member = await transaction.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId,
          role: "ADMIN",
        },
      });

      return {
        ...organization,
        role: member.role,
      };
    });
  }

  async findOrganizationById(id) {
    return this.client.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
    });
  }

  async findOrganizationBySlug(slug) {
    return this.client.organization.findUnique({
      where: { slug },
    });
  }

  async findOrganizationsByUserId(userId) {
    const memberships = await this.client.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                members: true,
                projects: true,
              },
            },
          },
        },
      },
    });

    return memberships.map((item) => ({
      ...item.organization,
      role: item.role,
      joinedAt: item.createdAt,
    }));
  }

  async addMember({ organizationId, userId, role = "MEMBER" }) {
    return this.client.organizationMember.create({
      data: {
        organizationId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  async findMembersByOrgId(organizationId) {
    return this.client.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  async findMembership(organizationId, userId) {
    return this.client.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
  }
}

const postgresOrganizationData = new PostgresOrganizationData();

export { PostgresOrganizationData, postgresOrganizationData };
