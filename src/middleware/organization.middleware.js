import { postgresAuthData } from "../data/implimentations/postgres.auth.data.js";
import { ApiError } from "../utils/apiError.js";

class OrganizationMiddleware {
  static async attach(req, _res, next) {
    try {
      const memberships = await postgresAuthData.findMembershipByMemberId(req.user.sub);

      let organizationId =
        req.headers["x-organization-id"] ||
        req.body?.organizationId ||
        req.body?.orgId ||
        req.cookies?.organizationId ||
        req.user?.organizationId;

      if (!organizationId && memberships.length > 0) {
        organizationId = memberships[0].organizationId;
      }

      if (!organizationId) {
        return next(
          new ApiError(403, "Organization context is required", [], "ORGANIZATION_REQUIRED")
        );
      }

      const membership = memberships.find((item) => item.organizationId === organizationId);

      if (!membership) {
        return next(
          new ApiError(403, "Organization access forbidden", [], "ORGANIZATION_FORBIDDEN")
        );
      }

      req.organizationId = organizationId;
      req.organization = membership.organization;
      req.membership = membership;
      return next();
    } catch (error) {
      return next(error);
    }
  }
}

const attachOrganization = (req, res, next) => OrganizationMiddleware.attach(req, res, next);

export { OrganizationMiddleware, attachOrganization };