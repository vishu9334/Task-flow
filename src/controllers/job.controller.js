import { emailQueue } from "../queue/email.queue.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";

class JobController {
  constructor(queue = emailQueue) {
    this.queue = queue;
    this.getJobStatus = asyncHandler(this.getJobStatus.bind(this));
  }

  async getJobStatus(req, res) {
    const { id } = req.params;
    const job = await this.queue.getJob(id);

    if (!job) {
      throw new ApiError(404, "Job not found", [], "JOB_NOT_FOUND");
    }

    const state = await job.getState();

    // Map BullMQ states to PDF supported statuses: pending, active, completed, failed
    let status = state;
    if (state === "waiting" || state === "delayed" || state === "waiting-children") {
      status = "pending";
    }

    const jobData = {
      id: job.id,
      name: job.name,
      status,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason || null,
      data: job.data,
      timestamp: job.timestamp,
      processedOn: job.processedOn || null,
      finishedOn: job.finishedOn || null,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, jobData, "Job status retrieved successfully"));
  }
}

const jobController = new JobController();

export { JobController, jobController };
