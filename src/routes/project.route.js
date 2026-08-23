import { Router } from "express";
import { projectController } from "../controllers/project.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachOrganization } from "../middleware/organization.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

const projectRouter = Router();

// Apply Authentication and Organization Context to all project routes
projectRouter.use(authenticate);
projectRouter.use(attachOrganization);

// Project CRUD Routes (Admins only can create projects)
projectRouter.post("/", requireRoles("ADMIN"), projectController.createProject);
projectRouter.get("/", projectController.getProjects);
projectRouter.get("/:id", projectController.getProjectById);
projectRouter.patch("/:id", projectController.updateProject);
projectRouter.put("/:id", projectController.updateProject);

// Admins only can delete projects (PDF Task 02 requirement)
projectRouter.delete("/:id", requireRoles("ADMIN"), projectController.deleteProject);

export { projectRouter };
