import { Router } from "express";
import { organizationController } from "../controllers/organization.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachOrganization } from "../middleware/organization.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

const organizationRouter = Router();

organizationRouter.use(authenticate);

// User Organizations
organizationRouter.post("/", organizationController.createOrganization);
organizationRouter.get("/my", organizationController.getMyOrganizations);

// Org Members (Scoped by org context)
organizationRouter.post(
  "/members",
  attachOrganization,
  requireRoles("ADMIN"),
  organizationController.addMember
);
organizationRouter.get("/members", attachOrganization, organizationController.getMembers);

export { organizationRouter };
