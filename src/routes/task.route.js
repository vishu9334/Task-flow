import { Router } from "express";
import { taskController } from "../controllers/task.controller.js";
import { commentController } from "../controllers/comment.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachOrganization } from "../middleware/organization.middleware.js";

const taskRouter = Router();

// Apply Authentication and Organization Context
taskRouter.use(authenticate);
taskRouter.use(attachOrganization);

// Task CRUD
taskRouter.post("/", taskController.createTask);
taskRouter.get("/", taskController.getTasks);

// Comments on a task
taskRouter.post("/:id/comments", commentController.createComment);
taskRouter.delete("/:id/comments/:commentId", commentController.deleteComment);

taskRouter.get("/:id", taskController.getTaskById);
taskRouter.patch("/:id", taskController.updateTask);
taskRouter.put("/:id", taskController.updateTask);
taskRouter.delete("/:id", taskController.deleteTask);

// Task Assignments (PDF Task 03 & 04)
taskRouter.post("/:id/assign", taskController.assignTask);
taskRouter.post("/:id/unassign", taskController.unassignTask);

export { taskRouter };
