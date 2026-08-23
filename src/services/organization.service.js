import { postgresOrganizationData } from "../data/implimentations/postgres.organization.data.js";
import { postgresAuthData } from "../data/implimentations/postgres.auth.data.js";
import { ApiError } from "../utils/apiError.js";

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");

class OrganizationService {
  constructor({
    orgRepo = postgresOrganizationData,
    authRepo = postgresAuthData,
  } = {}) {
    this.orgRepo = orgRepo;
    this.authRepo = authRepo;
  }

  async createOrganization({ userId, name, slug }) {
    if (!userId) {
      throw new ApiError(401, "Authentication required", [], "AUTHENTICATION_REQUIRED");
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new ApiError(400, "Organization name is required", [], "VALIDATION_ERROR");
    }

    if (name.trim().length > 100) {
      throw new ApiError(400, "Organization name cannot exceed 100 characters", [], "VALIDATION_ERROR");
    }

    const resolvedSlug = slug?.trim() ? slugify(slug) : slugify(name);

    if (!resolvedSlug) {
      throw new ApiError(400, "Invalid organization slug", [], "VALIDATION_ERROR");
    }

    const existingSlug = await this.orgRepo.findOrganizationBySlug(resolvedSlug);
    if (existingSlug) {
      throw new ApiError(409, "Organization with this slug already exists", [], "SLUG_EXISTS");
    }

    const organization = await this.orgRepo.createOrganization({
      name: name.trim(),
      slug: resolvedSlug,
      userId,
    });

    return organization;
  }

  async getMyOrganizations({ userId }) {
    if (!userId) {
      throw new ApiError(401, "Authentication required", [], "AUTHENTICATION_REQUIRED");
    }

    return this.orgRepo.findOrganizationsByUserId(userId);
  }

  async addMember({ orgId, requesterUserId, requesterRole, email, role = "MEMBER" }) {
    if (!orgId) {
      throw new ApiError(403, "Organization context is required", [], "ORGANIZATION_REQUIRED");
    }

    // PDF Rule: "Admins can manage members and delete projects"
    if (requesterRole !== "ADMIN") {
      throw new ApiError(403, "Only organization admins can manage members", [], "FORBIDDEN");
    }

    if (!email || typeof email !== "string") {
      throw new ApiError(400, "User email is required", [], "VALIDATION_ERROR");
    }

    const targetUser = await this.authRepo.findUserByEmail(email.trim().toLowerCase());
    if (!targetUser) {
      throw new ApiError(404, "User not found with provided email", [], "USER_NOT_FOUND");
    }

    const existingMembership = await this.orgRepo.findMembership(orgId, targetUser.id);
    if (existingMembership) {
      throw new ApiError(409, "User is already a member of this organization", [], "MEMBER_EXISTS");
    }

    const validRoles = ["ADMIN", "MEMBER", "USER"];
    const memberRole = validRoles.includes(role) ? role : "MEMBER";

    const member = await this.orgRepo.addMember({
      organizationId: orgId,
      userId: targetUser.id,
      role: memberRole,
    });

    return member;
  }

  async getMembers({ orgId }) {
    if (!orgId) {
      throw new ApiError(403, "Organization context is required", [], "ORGANIZATION_REQUIRED");
    }

    return this.orgRepo.findMembersByOrgId(orgId);
  }
}

const organizationService = new OrganizationService();

export { OrganizationService, organizationService };
