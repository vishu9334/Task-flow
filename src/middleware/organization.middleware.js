import { postgresAuthData } from "../data/implimentations/postgres.auth.data.js";
import { ApiError } from "../utils/apiError.js";

class OrganizationMiddleware {
  static async attach(req, _res, next) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return next(new ApiError(403, "Organization context is required", [], "ORGANIZATION_REQUIRED"));
      }

      const memberships = await postgresAuthData.findMembershipByUserId(req.user.sub);
      const membership = memberships.find((item) => item.organizationId === organizationId);

      if (!membership) {
        return next(new ApiError(403, "Organization access forbidden", [], "ORGANIZATION_FORBIDDEN"));
      }

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