import { Router } from "express";
import { jobController } from "../controllers/job.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const jobRouter = Router();

// Endpoint: GET /jobs/:id
jobRouter.get("/:id", authenticate, jobController.getJobStatus);

export { jobRouter };
