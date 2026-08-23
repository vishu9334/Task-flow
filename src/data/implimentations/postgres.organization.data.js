import { IOrganizationRepository } from "../contracts/IOrganization.contract.js";
import { prisma } from "../prisma.js";

class PostgresOrganizationData extends IOrganizationRepository {
  constructor(client = prisma) {
    super();
    this.client = client;
  }

  async createOrganization({ name, slug, adminId }) {
    return this.client.$transaction(async (transaction) => {
      const organization = await transaction.organization.create({
        data: {
          name,
          slug,
          userId: adminId,
        },
      });

      const member = await transaction.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: adminId,
          role: "ADMIN",
        },
      });

      await transaction.user.update({
        where: { id: adminId },
        data: { role: "ADMIN" },
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

  async findOrganizationsByAdminId(adminId) {
    const memberships = await this.client.organizationMember.findMany({
      where: { userId: adminId },
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

  async addMember({ organizationId, memberId, role = "MEMBER" }) {
    return this.client.$transaction(async (transaction) => {
      const member = await transaction.organizationMember.create({
        data: {
          organizationId,
          userId: memberId,
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

      const user = await transaction.user.findUnique({ where: { id: memberId } });
      if (user && user.role === "USER") {
        await transaction.user.update({
          where: { id: memberId },
          data: { role: role === "ADMIN" ? "ADMIN" : "MEMBER" },
        });
      }

      return member;
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

  async findMembership(organizationId, memberId) {
    return this.client.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: memberId,
        },
      },
    });
  }
}

const postgresOrganizationData = new PostgresOrganizationData();

export { PostgresOrganizationData, postgresOrganizationData };
