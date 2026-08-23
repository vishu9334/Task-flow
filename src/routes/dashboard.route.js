import { Router } from "express";
import { taskController } from "../controllers/task.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachOrganization } from "../middleware/organization.middleware.js";

const dashboardRouter = Router();

dashboardRouter.use(authenticate);
dashboardRouter.use(attachOrganization);

dashboardRouter.get("/counts", taskController.getDashboardCounts);

export { dashboardRouter };
